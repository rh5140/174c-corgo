import {defs, tiny} from "./examples/common.js";
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {KinematicBody, Arc, Node} from "./kinematic_body.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Flower extends KinematicBody{
    constructor() {
        super();

        this.shapes = {
            'bottom': new Shape_From_File("assets/flower/Flower_Bottom.obj"),
            'segment': new Shape_From_File("assets/flower/Flower_Segment.obj"),
            'upper': new Shape_From_File("assets/flower/Flower_Upper.obj"),
            'petals': new Shape_From_File("assets/flower/Flower_Petals.obj"),
            'eyes': new Shape_From_File("assets/flower/Flower_Eyes.obj"),
            'hands': new Shape_From_File("assets/flower/Flower_Hands.obj"),
        };

        const phong = new defs.Phong_Shader();
        this.materials = {
            'bottom': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1) },
            'segment': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1) },
            'upper': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1) },
            'petals': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1) },
            'eyes': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1)},
            'hands': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1) },
        };

        this.position = vec3(0,0,0);

        // bottom node
        const bottom_transform = Mat4.identity();
        this.bottom_node = new Node("bottom", this.shapes.bottom, this.materials.bottom, bottom_transform, Mat4.translation(0, -1.3, 0));
        // root->torso
        const root_location = Mat4.translation(0, 0, 0);
        this.root = new Arc("root", null, this.bottom_node, root_location);
        this.root.set_dof(false, true, false)

        // midsection node
        let midsection_transform = Mat4.scale(1.2, 1.2, 1.2);
        this.midsection_node = new Node("midsection", this.shapes.segment, this.materials.segment, midsection_transform, Mat4.translation(0, 1.2, 0));
        // bottom->midjoint->midsection
        const midjoint_location = Mat4.translation(-0.045, -0.4, -0.04);
        this.midjoint = new Arc("midjoint", this.bottom_node, this.midsection_node, midjoint_location);
        this.midjoint.set_dof(false, false, true);
        // this.midjoint.rotation_pref.z = -3 * math.PI/4
        this.bottom_node.children_arcs.push(this.midjoint)

        // topsection node
        let topsection_transform = Mat4.scale(1.5, 1.5, 1.5);
        this.topsection_node = new Node("topsection", this.shapes.upper, this.materials.upper, topsection_transform, Mat4.translation(0, 1.05, 0.03));
        // bottom->topjoint->topsection
        const topjoint_location = Mat4.translation(-0.045, 2.4, -0.04);
        this.topjoint = new Arc("topjoint", this.midsection_node, this.topsection_node, topjoint_location);
        this.topjoint.set_dof(false, false, true);
        // this.topjoint.rotation_pref.z = 3 * math.PI/4
        this.midsection_node.children_arcs.push(this.topjoint)

        // petals node
        let petals_transform = Mat4.scale(1.5, 1.5, 1.5);
        this.petals_node = new Node("petals", this.shapes.petals, this.materials.petals, petals_transform, Mat4.translation(0.2, 0, 0));
        // bottom->topjoint->topsection
        const petalsjoint_location = Mat4.translation(0, 4, 0);
        this.petalsjoint = new Arc("petalsjoint", this.topsection_node, this.petals_node, petalsjoint_location);
        this.petalsjoint.set_dof(true, true, true);
        this.topsection_node.children_arcs.push(this.petalsjoint)

        // eyes node
        let eyes_transform = Mat4.scale(1, 1, 1);
        this.eyes_node = new Node("eyes", this.shapes.eyes, this.materials.eyes, eyes_transform, Mat4.translation(0.2, 0, 0));
        // bottom->topjoint->topsection
        const eyesjoint_location = Mat4.translation(0.5, 0.3, 0);
        this.eyesjoint = new Arc("eyesjoint", this.petals_node, this.eyes_node, eyesjoint_location);
        this.petals_node.children_arcs.push(this.eyesjoint)
    }

    update_IK(end_eff, goal) {
        return super.update_IK(end_eff, goal, this.transformation_matrix, true);
    }

    compute_global_transform(arc) {
        return super.compute_global_transform(arc, this.transformation_matrix);
    }

    draw(webgl_manager, uniforms) {
        super.draw(webgl_manager, uniforms, this.transformation_matrix)
    }

    get transformation_matrix(){
        return Mat4.translation(this.position[0], this.position[1], this.position[2]);
    }
}