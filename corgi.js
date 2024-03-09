import {defs, tiny} from "./examples/common.js";
import {Shape_From_File} from "./examples/obj-file-demo.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Corgo {
    constructor() {
        this.shapes = {
            'body': new Shape_From_File("assets/corgi/Body.obj"),
            'ears': new Shape_From_File("assets/corgi/Ears.obj"),
            'back_leg': new Shape_From_File("assets/corgi/Back_Leg.obj"),
            'front_leg': new Shape_From_File("assets/corgi/Front_Leg.obj"),
            'tail': new Shape_From_File("assets/corgi/Tail.obj"),
        };

        const tex_phong = new defs.Textured_Phong();
        this.materials = {
            'body': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/corgi/Body.png" ) },
            'ears': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/corgi/Ears.png" ) },
            'back_leg': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/corgi/Back Leg.png" ) },
            'front_leg': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/corgi/Front Leg.png" ) },
            'tail': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/corgi/Tail.png" ) },
        };

        this.position = vec3(0,0,0);
        this.velocity = vec3(0,0,0);
        this.acceleration = vec3(0,0,0);

        // body node
        const body_transform = Mat4.scale(1, 1, 1);
        this.body_node = new Node("body", this.shapes.body, this.materials.body, body_transform);
        // root->torso
        const root_location = Mat4.translation(0, 0, 0);
        this.root = new Arc("root", null, this.body_node, root_location);
        this.root.set_dof(true, true, true, true, true, true);

        // ears node
        let ears_transform = Mat4.scale(.4, .4, .4);
        ears_transform.pre_multiply(Mat4.translation(-.1, .3, 0));
        this.ears_node = new Node("ears", this.shapes.ears, this.materials.ears, ears_transform);
        // body->ear_muscles->ears
        const ear_muscles_location = Mat4.translation(1, .6, 0);
        this.ear_muscles = new Arc("ear_muscles", this.body_node, this.ears_node, ear_muscles_location);
        this.ear_muscles.set_dof(true, true, true);
        this.body_node.children_arcs.push(this.ear_muscles)

        // back leg node
        let back_leg_transform = Mat4.scale(.35, .35, .35);
        back_leg_transform.pre_multiply(Mat4.translation(.1, -.4, 0));
        this.back_leg_node = new Node("ears", this.shapes.back_leg, this.materials.back_leg, back_leg_transform);
        // body->thigh->back_legs
        const thigh_location = Mat4.translation(-1.16, -.5, 0);
        this.thigh = new Arc("thigh", this.body_node, this.back_leg_node, thigh_location);
        this.thigh.set_dof(true, true, true);
        this.body_node.children_arcs.push(this.thigh)

        // front leg node
        let front_leg_transform = Mat4.scale(.35, .35, .35);
        front_leg_transform.pre_multiply(Mat4.translation(-.1, -.3, 0));
        this.front_leg_node = new Node("ears", this.shapes.front_leg, this.materials.front_leg, front_leg_transform);
        // body->thigh->back_legs
        const shoulder_location = Mat4.translation(.96, -.56, 0);
        this.shoulder = new Arc("shoulder", this.body_node, this.front_leg_node, shoulder_location);
        this.shoulder.set_dof(true, true, true);
        this.body_node.children_arcs.push(this.shoulder)

        // tail node
        let tail_transform = Mat4.scale(.35, .35, .35);
        tail_transform.pre_multiply(Mat4.translation(.1, .6, 0));
        this.tail_node = new Node("tail", this.shapes.tail, this.materials.tail, tail_transform);
        // body->tail_muscle->tail
        const tail_muscle_location = Mat4.translation(-1.5, 0, 0);
        this.tail_muscle = new Arc("tail_muscle", this.body_node, this.tail_node, tail_muscle_location);
        this.tail_muscle.set_dof(true, true, true);
        this.body_node.children_arcs.push(this.tail_muscle)
    }

    draw(webgl_manager, uniforms) {
        this.matrix_stack = [];
        this._rec_draw(this.root,
            this.transformation_matrix,
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

    get transformation_matrix(){
        return Mat4.translation(this.position[0], this.position[1], this.position[2])
            .times(generate_rotation(this.velocity.normalized(), vec3(1, 0, 0)));
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

class Node {
    constructor(name, shape, material, transform) {
        this.name = name;
        this.shape = shape;
        this.material = material;
        this.transform_matrix = transform;
        this.children_arcs = [];
    }
}

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

function generate_rotation(a, b){
    let s = a.cross(b).dot(vec3(0, -1, 0));
    let c = a.dot(b);
    let angle = Math.atan2(s, c);
    if(isNaN(angle)){
        angle = 0;
    }
    return Mat4.rotation(angle, 0, 1, 0);
}