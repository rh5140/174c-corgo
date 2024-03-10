import { defs, tiny } from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

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

    update_IK(end_eff, goal, k=0.01){
        let e_global = this.compute_global_transform(end_eff.parent_arc).times(end_eff.transform_matrix);
        let e_pos = vec3(e_global[0][3], e_global[1][3], e_global[2][3]);
        let diff = goal.minus(e_pos).times(k);

        let compute = this.compute_jacobian(end_eff);
        let J = compute.regular;
        let JT = compute.transpose;
        let JP = JT.times(new Matrix(...math.inv(J.times(JT))));

        let preferences = new Matrix(...this.gather_preferences(end_eff));
        let curDOF = new Matrix(...this.gather_DOF(end_eff));
        let DOFDiff = preferences.minus(curDOF);

        let d_theta = JP.times(new Matrix([diff[0]], [diff[1]], [diff[2]]))
            .plus((this.generate_identity(JT.length).minus(JP.times(J))).times(DOFDiff));

        let curNode = end_eff;
        let index = 0;
        while(curNode != null){
            let arc = curNode.parent_arc;
            if(arc.rotation.x){
                arc.rotation.x += d_theta[index][0];
                index++;
            }
            if(arc.rotation.y){
                arc.rotation.y += d_theta[index][0];
                index++;
            }
            if(arc.rotation.z){
                arc.rotation.z += d_theta[index][0];
                index++;
            }
            if(arc.translation.x){
                arc.translation.x += d_theta[index][0];
                index++;
            }
            if(arc.translation.y){
                arc.translation.y += d_theta[index][0];
                index++;
            }
            if(arc.translation.z){
                arc.translation.z += d_theta[index][0];
                index++;
            }
            arc.update_articulation_matrix()

            curNode = arc.parent_node;
        }

        return goal.minus(e_pos).norm() < 0.1;
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

    compute_jacobian(end_eff){
        let e_global = this.compute_global_transform(end_eff.parent_arc).times(end_eff.transform_matrix);
        let e_pos = vec3(e_global[0][3], e_global[1][3], e_global[2][3]);

        let curNode = end_eff;
        let array_Jac = [];
        while(curNode != null){
            let arc = curNode.parent_arc;
            let j_global = this.compute_global_transform(arc);
            if(arc.rotation.x){
                let axis = vec3(j_global[0][0], j_global[1][0], j_global[2][0]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))));
            }
            if(arc.rotation.y){
                let axis = vec3(j_global[0][1], j_global[1][1], j_global[2][1]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))));
            }
            if(arc.rotation.z){
                let axis = vec3(j_global[0][2], j_global[1][2], j_global[2][2]);
                let j_pos = vec3(j_global[0][3], j_global[1][3], j_global[2][3]);

                array_Jac.push(Array.from(axis.cross(e_pos.minus(j_pos))));
            }
            if(arc.translation.x){
                let axis = vec3(j_global[0][0], j_global[1][0], j_global[2][0]).normalized();

                array_Jac.push(Array.from(axis));
            }
            if(arc.translation.y){
                let axis = vec3(j_global[0][1], j_global[1][1], j_global[2][1]).normalized();

                array_Jac.push(Array.from(axis));
            }
            if(arc.translation.z){
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

    gather_preferences(end_eff){
        let curNode = end_eff;
        let preferences = [];
        while(curNode != null){
            let arc = curNode.parent_arc;

            preferences = preferences.concat(arc.preference.map(pref => [pref]));

            curNode = arc.parent_node;
        }

        return preferences;
    }

    gather_DOF(end_eff){
        let curNode = end_eff;
        let preferences = [];
        while(curNode != null){
            let arc = curNode.parent_arc;

            if("x" in arc.rotation) preferences.push([arc.rotation.x]);
            if("y" in arc.rotation) preferences.push([arc.rotation.y]);
            if("z" in arc.rotation) preferences.push([arc.rotation.z]);
            if("x" in arc.translation) preferences.push([arc.translation.x]);
            if("y" in arc.translation) preferences.push([arc.translation.y]);
            if("z" in arc.translation) preferences.push([arc.translation.z]);

            curNode = arc.parent_node;
        }

        return preferences;
    }

    compute_global_transform(arc){
        let out = this.transformation_matrix;
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
    constructor(name, shape, material, transform) {
        this.name = name;
        this.shape = shape;
        this.material = material;
        this.transform_matrix = transform;
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
        this.articulation_matrix = Mat4.identity();

        this.rotation = {};
        this.translation = {};
        this.preference = [];
    }

    set_dof(rx, ry, rz, tx = false, ty = false, tz = false){
        if(rx) this.rotation.x = 0.01;
        if(ry) this.rotation.y = 0.01;
        if(rz) this.rotation.z = 0.01;
        if(tx) this.translation.x = 0.01;
        if(ty) this.translation.y = 0.01;
        if(tz) this.translation.z = 0.01;

        this.update_articulation_matrix();
    }

    update_articulation_matrix(){
        this.articulation_matrix = Mat4.identity();
        this.articulation_matrix.pre_multiply(Mat4.translation(this.translation.x ? this.translation.x : 0, this.translation.y ? this.translation.y : 0, this.translation.z ? this.translation.z : 0));
        if(this.rotation.x){
            this.articulation_matrix.pre_multiply(Mat4.rotation(this.rotation.x, 1, 0, 0));
        }
        if(this.rotation.y){
            this.articulation_matrix.pre_multiply(Mat4.rotation(this.rotation.y, 0, 1, 0));
        }
        if(this.rotation.z){
            this.articulation_matrix.pre_multiply(Mat4.rotation(this.rotation.z, 0, 0, 1));
        }
    }
}