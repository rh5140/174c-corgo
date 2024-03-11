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

    update_IK(end_eff, goal, transform, orient=false, start_eff=null, k=0.01, damping=0.1, strength=0.5){
        let e_global = this.compute_global_transform(end_eff.parent_arc, transform).times(end_eff.location_matrix);

        let e_pos = vec3(e_global[0][3], e_global[1][3], e_global[2][3]);
        let g_pos = goal;
        let pos_diff = g_pos.minus(e_pos);

        let diff = new Matrix([pos_diff[0]], [pos_diff[1]], [pos_diff[2]]);

        let compute = this.compute_jacobian(end_eff, transform, start_eff);
        let J = compute.regular;
        let JT = compute.transpose;
        let JP = JT.times(new Matrix(...math.inv(J.times(JT).plus(this.generate_identity(JT.length).times(damping)))));

        let DOFDiff = this.calc_DOF_diff(end_eff, start_eff);

        let d_theta = JP.times(diff.times(k))
            .plus((this.generate_identity(JT.length).minus(JP.times(J))).times(DOFDiff).times(strength));

        let curNode = end_eff;
        let index = 0;
        while(curNode !== start_eff){
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

        return (pos_diff.norm() < 0.1);
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

    compute_jacobian(end_eff, transform, start_eff=null){
        let e_global = this.compute_global_transform(end_eff.parent_arc, transform).times(end_eff.transform_matrix);
        let e_pos = vec3(e_global[0][3], e_global[1][3], e_global[2][3]);

        let curNode = end_eff;
        let array_Jac = [];
        while(curNode !== start_eff){
            let arc = curNode.parent_arc;
            let j_global = this.compute_global_transform(arc, transform);
            if("x" in arc.rotation){
                let axis = vec3(j_global[0][0], j_global[1][0], j_global[2][0]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))));
            }
            if("y" in arc.rotation){
                let axis = vec3(j_global[0][1], j_global[1][1], j_global[2][1]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))));
            }
            if("z" in arc.rotation){
                let axis = vec3(j_global[0][2], j_global[1][2], j_global[2][2]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))));
            }
            if("x" in arc.translation){
                let axis = vec3(j_global[0][0], j_global[1][0], j_global[2][0]).normalized();

                array_Jac.push(Array.from(axis));
            }
            if("y" in arc.translation){
                let axis = vec3(j_global[0][1], j_global[1][1], j_global[2][1]).normalized();

                array_Jac.push(Array.from(axis));
            }
            if("z" in arc.translation){
                let axis = vec3(j_global[0][2], j_global[1][2], j_global[2][2]).normalized();

                array_Jac.push(Array.from(axis));
            }
            curNode = arc.parent_node;
        }

        let flipped = array_Jac[0].map(function (_, c) { return array_Jac.map(function (r) { return r[c]; }); });

        return {
            regular: new Matrix(...flipped),
            transpose: new Matrix(...array_Jac)
        };
    }

    calc_DOF_diff(end_eff, start_eff=null){
        let curNode = end_eff;
        let diff = [];
        while(curNode !== start_eff){
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