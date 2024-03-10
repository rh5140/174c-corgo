import { defs, tiny } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component, Matrix } = tiny;

export
class KinematicBody{
    constructor() {
        this.root = null;
    }

    draw(webgl_manager, uniforms, transform) {
        this.matrix_stack = [];
        this._rec_draw(this.root,
            transform,
            webgl_manager, uniforms
        );
    }

    _rec_draw(arc, matrix, webgl_manager, uniforms) {
        if (arc !== null) {
            const L = arc.location_matrix;
            const A = arc.articulation_matrix;
            matrix.post_multiply(L.times(A));
            this.matrix_stack.push(matrix.copy());

            const node = arc.child_node;
            const T = node.transform_matrix;
            matrix.post_multiply(T);
            node.shape.draw(webgl_manager, uniforms, matrix, node.material);

            matrix = this.matrix_stack.pop();
            for (const next_arc of node.children_arcs) {
                this.matrix_stack.push(matrix.copy());
                this._rec_draw(next_arc, matrix, webgl_manager, uniforms, node.material);
                matrix = this.matrix_stack.pop();
            }
        }
    }

    update_IK(end_eff, goal, transform, orient=false, start_eff=null, k=0.01, damping=1.5, strength=0.02){
        let e_global = this.compute_global_transform(end_eff.parent_arc, transform).times(end_eff.location_matrix);

        let e_rot = e_global.sub_block([ 0,0 ], [ 3,3 ])
        let g_rot = goal.sub_block([ 0,0 ], [ 3,3 ])
        let orien_diff = orient ? calc_orient_error(e_rot, g_rot) : vec3(0, 0, 0)

        let e_pos = vec3(e_global[0][3], e_global[1][3], e_global[2][3]);
        let g_pos = vec3(goal[0][3], goal[1][3], goal[2][3]);
        let pos_diff = g_pos.minus(e_pos);

        if (pos_diff.norm() < 0.1 && orien_diff.norm() < 0.01) return;

        let diff = new Matrix([pos_diff[0]], [pos_diff[1]], [pos_diff[2]], [orien_diff[0]], [orien_diff[1]], [orien_diff[2]]);

        let compute = this.compute_jacobian(end_eff, transform);
        let J = compute.regular;
        let JT = compute.transpose;
        let JP = JT.times(new Matrix(...math.inv(J.times(JT).plus(this.generate_identity(JT.length).times(damping)))));

        let DOFDiff = this.calc_DOF_diff(end_eff);

        let d_theta = JP.times(diff.times(k))
            .plus((this.generate_identity(JT.length).minus(JP.times(J))).times(DOFDiff).times(strength));

        let curNode = end_eff;
        let index = 0;
        while(curNode != null){
            let arc = curNode.parent_arc;
            if("x" in arc.rotation){
                arc.rotation.x += d_theta[index][0];
                index++;
            }
            if("y" in arc.rotation){
                arc.rotation.y += d_theta[index][0];
                index++;
            }
            if("z" in arc.rotation){
                arc.rotation.z += d_theta[index][0];
                index++;
            }
            if("x" in arc.translation){
                arc.translation.x += d_theta[index][0];
                index++;
            }
            if("y" in arc.translation){
                arc.translation.y += d_theta[index][0];
                index++;
            }
            if("z" in arc.translation){
                arc.translation.z += d_theta[index][0];
                index++;
            }
            arc.update_articulation_matrix()

            curNode = arc.parent_node;
        }
    }

    generate_identity(size){
        let arr_out = [];
        for(let i = 0; i < size; i++){
            let row = [];
            for(let j = 0; j < size; j++){
                row.push(i === j ? 1 : 0);
            }
            arr_out.push(row);
        }
        return new Matrix(...arr_out);
    }

    compute_jacobian(end_eff, transform){
        let e_global = this.compute_global_transform(end_eff.parent_arc, transform).times(end_eff.transform_matrix);
        let e_pos = vec3(e_global[0][3], e_global[1][3], e_global[2][3]);

        let curNode = end_eff;
        let array_Jac = [];
        while(curNode != null){
            let arc = curNode.parent_arc;
            let j_global = this.compute_global_transform(arc, transform);
            if("x" in arc.rotation){
                let axis = vec3(j_global[0][0], j_global[1][0], j_global[2][0]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))).concat(Array.from(axis)));
            }
            if("y" in arc.rotation){
                let axis = vec3(j_global[0][1], j_global[1][1], j_global[2][1]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))).concat(Array.from(axis)));
            }
            if("z" in arc.rotation){
                let axis = vec3(j_global[0][2], j_global[1][2], j_global[2][2]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))).concat(Array.from(axis)));
            }
            if("x" in arc.translation){
                let axis = vec3(j_global[0][0], j_global[1][0], j_global[2][0]).normalized();

                array_Jac.push(Array.from(axis).concat([0, 0, 0]));
            }
            if("y" in arc.translation){
                let axis = vec3(j_global[0][1], j_global[1][1], j_global[2][1]).normalized();

                array_Jac.push(Array.from(axis).concat([0, 0, 0]));
            }
            if("z" in arc.translation){
                let axis = vec3(j_global[0][2], j_global[1][2], j_global[2][2]).normalized();

                array_Jac.push(Array.from(axis).concat([0, 0, 0]));
            }
            curNode = arc.parent_node;
        }

        let flipped = array_Jac[0].map(function (_, c) { return array_Jac.map(function (r) { return r[c]; }); });

        return {
            regular: new Matrix(...flipped),
            transpose: new Matrix(...array_Jac)
        };
    }

    calc_DOF_diff(end_eff){
        let curNode = end_eff;
        let diff = [];
        while(curNode != null){
            let arc = curNode.parent_arc;

            if("x" in arc.rotation) diff.push("x" in arc.rotation_pref ? [arc.rotation_pref.x - arc.rotation.x] : [0]);
            if("y" in arc.rotation) diff.push("y" in arc.rotation_pref ? [arc.rotation_pref.y - arc.rotation.y] : [0]);
            if("z" in arc.rotation) diff.push("z" in arc.rotation_pref ? [arc.rotation_pref.z - arc.rotation.z] : [0]);
            if("x" in arc.translation) diff.push("x" in arc.translation_pref ? [arc.translation_pref.x - arc.translation.x] : [0]);
            if("y" in arc.translation) diff.push("y" in arc.translation_pref ? [arc.translation_pref.y - arc.translation.y] : [0]);
            if("z" in arc.translation) diff.push("z" in arc.translation_pref ? [arc.translation_pref.z - arc.translation.z] : [0]);

            curNode = arc.parent_node;
        }

        return new Matrix(...diff)
    }

    compute_global_transform(arc, transform){
        let out = transform;
        let p = arc;
        while(p.parent_node != null){
            out.pre_multiply(p.articulation_matrix);
            out.pre_multiply(p.location_matrix);
            p = p.parent_node.parent_arc;
        }
        out.pre_multiply(p.articulation_matrix);
        out.pre_multiply(p.location_matrix);

        return out;
    }
}

export
class Node {
    constructor(name, shape, material, transform, locale) {
        this.name = name;
        this.shape = shape;
        this.material = material;
        this.location_matrix = locale;
        this.transform_matrix = locale.times(transform);
        this.children_arcs = [];
    }
}

export
class Arc {
    constructor(name, parent, child, location) {
        this.name = name;
        this.parent_node = parent;
        this.child_node = child;
        if(child) this.child_node.parent_arc = this;
        this.location_matrix = location;
        this.articulation = Mat4.identity();

        this.rotation = {};
        this.translation = {};
        this.rotation_pref = {};
        this.translation_pref = {};
    }

    set_dof(rx, ry, rz, tx = false, ty = false, tz = false){
        if(rx) this.rotation.x = 0;
        if(ry) this.rotation.y = 0;
        if(rz) this.rotation.z = 0;
        if(tx) this.translation.x = 0;
        if(ty) this.translation.y = 0;
        if(tz) this.translation.z = 0;

        this.update_articulation_matrix();
    }

    get articulation_matrix(){
        this.update_articulation_matrix()
        return this.articulation;
    }

    set articulation_matrix(val){
        this.articulation = val;
    }

    update_articulation_matrix(){
        this.articulation = Mat4.identity();
        this.articulation.pre_multiply(Mat4.translation(this.translation.x ? this.translation.x : 0, this.translation.y ? this.translation.y : 0, this.translation.z ? this.translation.z : 0));
        if("x" in this.rotation){
            // this.rotation.x = ((this.rotation.x) % (math.PI * 2))
            this.articulation.pre_multiply(Mat4.rotation(this.rotation.x, 1, 0, 0));
        }
        if("y" in this.rotation){
            // this.rotation.y = ((this.rotation.y) % (math.PI * 2))
            this.articulation.pre_multiply(Mat4.rotation(this.rotation.y, 0, 1, 0));
        }
        if("z" in this.rotation){
            // this.rotation.z = ((this.rotation.z) % (math.PI * 2))
            this.articulation.pre_multiply(Mat4.rotation(this.rotation.z, 0, 0, 1));
        }
    }
}

function calc_orient_error(e_rot, g_rot) {
    let matrix = g_rot.times(e_rot.transposed())

    // Convert the rotation matrix to a quaternion
    let trace
    let qx, qy, qz, qw;

    if (matrix[2][2] < 0) {
        if(matrix[0][0] > matrix[1][1]){
            trace = 1 + matrix[0][0] - matrix[1][1] - matrix[2][2];

            qw = trace;
            qx = (matrix[0][1] + matrix[1][0]);
            qy = (matrix[2][0] + matrix[0][2]);
            qz = (matrix[1][2] - matrix[2][1]);
        }
        else {
            trace = 1 - matrix[0][0] + matrix[1][1] - matrix[2][2];

            qw = (matrix[0][1] + matrix[1][0]);
            qx = trace;
            qy = (matrix[1][2] + matrix[2][1]);
            qz = (matrix[2][0] - matrix[0][2]);
        }
    } else {
        if(matrix[0][0] < -matrix[1][1]){
            trace = 1 - matrix[0][0] - matrix[1][1] + matrix[2][2];

            qw = (matrix[2][0] + matrix[0][2]);
            qx = (matrix[1][2] + matrix[2][1]);
            qy = trace;
            qz = (matrix[0][1] - matrix[1][0]);
        }
        else {
            trace = 1 + matrix[0][0] + matrix[1][1] + matrix[2][2];

            qw = (matrix[1][2] - matrix[2][1]);
            qx = (matrix[2][0] - matrix[0][2]);
            qy = (matrix[0][1] - matrix[1][0]);
            qz = trace;
        }
    }
    let quat = vec4(qw, qx, qy, qz);
    quat = quat.times(0.5 / (math.sqrt(trace) + 0.00001))
    if(quat[0] < 0) quat = quat.times(-1)

    let angle = 2 * math.acos(quat[0]);
    let axis = vec3(quat[1], quat[2], quat[3]);

    return axis.times(angle)
}

// function calc_orient_error(e_rot, g_rot){
//     let m = g_rot.times(e_rot.transposed())
//     let vue = math.acos((m[0][0] + m[1][1] + m[2][2] - 1)/2);
//     let r = vec3(m[2][1] - m[1][2], m[0][2] - m[2][0], m[1][0] - m[0][1]).times(1 / (2 * math.sin(vue) + 0.001))
//     return r.times(math.sin(vue))
// }