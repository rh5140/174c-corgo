import {defs, tiny} from "./examples/common.js";
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {KinematicBody, Arc, Node} from "./kinematic_body.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Corgo extends KinematicBody{
    constructor() {
        super();

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
        super.draw(webgl_manager, uniforms, this.transformation_matrix)
    }

    get transformation_matrix(){
        return Mat4.translation(this.position[0], this.position[1], this.position[2])
            .times(generate_rotation(this.velocity.normalized(), vec3(1, 0, 0)));
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