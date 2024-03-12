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
        const tex_phong = new defs.Textured_Phong();
        this.materials = {
            'bottom': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/flower/Bottom.png" ) },
            'segment': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/flower/Segment.png" ) },
            'upper': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/flower/Upper.png" ) },
            'petals': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/flower/Petals.png" ) },
            'eyes': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/flower/Eyes.png" ) },
            'hands': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/flower/Hands.png" ) },
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
        this.midsection_node = new Node("midsection", this.shapes.segment, this.materials.segment, midsection_transform, Mat4.translation(0, 1.25, 0));
        // bottom->midjoint->midsection
        const midjoint_location = Mat4.translation(-0.045, -0.3, -0.04);
        this.midjoint = new Arc("midjoint", this.bottom_node, this.midsection_node, midjoint_location);
        this.midjoint.set_dof(false, false, true);
        this.midjoint.rotation_pref.z = -math.PI / 8
        this.bottom_node.children_arcs.push(this.midjoint)

        // topsection node
        let topsection_transform = Mat4.scale(1.5, 1.5, 1.5);
        this.topsection_node = new Node("topsection", this.shapes.upper, this.materials.upper, topsection_transform, Mat4.translation(0, 1.05, 0.03));
        // bottom->topjoint->topsection
        const topjoint_location = Mat4.translation(-0.045, 2.4, -0.04);
        this.topjoint = new Arc("topjoint", this.midsection_node, this.topsection_node, topjoint_location);
        this.topjoint.set_dof(false, false, true);
        this.topjoint.rotation_pref.z = -math.PI / 8
        this.midsection_node.children_arcs.push(this.topjoint)

        // petals node
        let petals_transform = Mat4.scale(1.5, 1.5, 1.5);
        this.petals_node = new Node("petals", this.shapes.petals, this.materials.petals, petals_transform, Mat4.translation(0.2, 0, 0));
        // bottom->topjoint->topsection
        const petalsjoint_location = Mat4.translation(0, 4, 0);
        this.petalsjoint = new Arc("petalsjoint", this.topsection_node, this.petals_node, petalsjoint_location);
        this.petalsjoint.set_dof(false, false, true);
        this.petalsjoint.rotation_pref.z = Math.PI/4
        this.topsection_node.children_arcs.push(this.petalsjoint)

        // eyes node
        let eyes_transform = Mat4.scale(1, 1, 1);
        this.eyes_node = new Node("eyes", this.shapes.eyes, this.materials.eyes, eyes_transform, Mat4.translation(0.2, 0, 0));
        // bottom->topjoint->topsection
        const eyesjoint_location = Mat4.translation(0.5, 0.3, 0);
        this.eyesjoint = new Arc("eyesjoint", this.petals_node, this.eyes_node, eyesjoint_location);
        this.petals_node.children_arcs.push(this.eyesjoint)

        // l_arm node
        let l_arm_transform = Mat4.rotation(math.PI/2, 1, 0, 0).times(Mat4.scale(1.2, 1.2, 1.2));
        this.l_arm_node = new Node("l_arm", this.shapes.segment, this.materials.segment, l_arm_transform, Mat4.translation(0, 0.03, 1.3));
        // bottom->topjoint->topsection
        const l_shoulder_location = Mat4.translation(-0.045, 2.4, -0.04);
        this.l_shoulder = new Arc("l_shoulder", this.midsection_node, this.l_arm_node, l_shoulder_location);
        this.l_shoulder.set_dof(false, true, true);
        this.l_shoulder.rotation_pref.z = 0;
        this.l_shoulder.rotation_pref.y = -math.PI / 4;
        this.midsection_node.children_arcs.push(this.l_shoulder)

        // l_forearm node
        let l_forearm_transform = Mat4.rotation(math.PI/2, 1, 0, 0).times(Mat4.scale(1.2, 1.2, 1.2));
        this.l_forearm_node = new Node("l_forearm", this.shapes.segment, this.materials.segment, l_forearm_transform, Mat4.translation(0, 0.03, 1.3));
        // bottom->topjoint->topsection
        const l_elbow_location = Mat4.translation(-0.045, 0.04, 2.5);
        this.l_elbow = new Arc("l_elbow", this.l_arm_node, this.l_forearm_node, l_elbow_location);
        this.l_elbow.set_dof(false, true, false);
        this.l_elbow.rotation_pref.y = math.PI / 2;
        this.l_arm_node.children_arcs.push(this.l_elbow)

        // l_hand node
        let l_hand_transform = Mat4.rotation(math.PI * 0.9, 1, 0, 0).times(Mat4.scale(.7, .7, .7));
        this.l_hand_node = new Node("l_hand", this.shapes.hands, this.materials.hands, l_hand_transform, Mat4.translation(0, 0.03, 1));
        // bottom->topjoint->topsection
        const l_wrist_location = Mat4.translation(-0.045, 0.04, 2.5);
        this.l_wrist = new Arc("l_elbow", this.l_forearm_node, this.l_hand_node, l_wrist_location);
        this.l_wrist.set_dof(false, true, false);
        this.l_wrist.rotation_pref.y = -math.PI / 2;
        this.l_forearm_node.children_arcs.push(this.l_wrist)

        // l_palm node
        let l_palm_transform = Mat4.rotation(math.PI * 0.9, 1, 0, 0).times(Mat4.scale(0, 0, 0));
        this.l_palm_node = new Node("l_palm", this.shapes.segment, this.materials.segment, l_palm_transform, Mat4.translation(1, 0, 0));
        // bottom->topjoint->topsection
        const l_palm_joint_location = Mat4.translation(.1, 0.04, .9);
        this.l_palm_joint = new Arc("l_palm_joint", this.l_hand_node, this.l_palm_node, l_palm_joint_location);
        this.l_hand_node.children_arcs.push(this.l_palm_joint)

        // r_arm node
        let r_arm_transform = Mat4.rotation(math.PI/2, 1, 0, 0).times(Mat4.scale(1.2, 1.2, 1.2));
        this.r_arm_node = new Node("r_arm", this.shapes.segment, this.materials.segment, r_arm_transform, Mat4.translation(0, 0.03, -1.3));
        // bottom->topjoint->topsection
        const r_shoulder_location = Mat4.translation(-0.045, 2.4, 0.04);
        this.r_shoulder = new Arc("r_shoulder", this.midsection_node, this.r_arm_node, r_shoulder_location);
        this.r_shoulder.set_dof(false, true, true);
        this.r_shoulder.rotation_pref.z = 0;
        this.r_shoulder.rotation_pref.y = math.PI/4;
        this.midsection_node.children_arcs.push(this.r_shoulder)

        // r_forearm node
        let r_forearm_transform = Mat4.rotation(math.PI/2, 1, 0, 0).times(Mat4.scale(1.2, 1.2, 1.2));
        this.r_forearm_node = new Node("r_forearm", this.shapes.segment, this.materials.segment, r_forearm_transform, Mat4.translation(0, -0.03, -1.3));
        // bottom->topjoint->topsection
        const r_elbow_location = Mat4.translation(0.045, 0.04, -2.5);
        this.r_elbow = new Arc("r_elbow", this.r_arm_node, this.r_forearm_node, r_elbow_location);
        this.r_elbow.set_dof(false, true, false);
        this.r_elbow.rotation_pref.y = -math.PI/2;
        this.r_arm_node.children_arcs.push(this.r_elbow)

        // r_hand node
        let r_hand_transform = Mat4.rotation(math.PI * -0.1, 1, 0, 0).times(Mat4.scale(.7, .7, .7));
        this.r_hand_node = new Node("r_hand", this.shapes.hands, this.materials.hands, r_hand_transform, Mat4.translation(0, -0.03, -1));
        // bottom->topjoint->topsection
        const r_wrist_location = Mat4.translation(-0.045, -0.04, -2.5);
        this.r_wrist = new Arc("r_elbow", this.r_forearm_node, this.r_hand_node, r_wrist_location);
        this.r_wrist.set_dof(false, true, false);
        this.r_wrist.rotation_pref.y = math.PI/2;
        this.r_forearm_node.children_arcs.push(this.r_wrist)

        // r_palm node
        let r_palm_transform = Mat4.rotation(math.PI * 0.9, 1, 0, 0).times(Mat4.scale(0, 0, 0));
        this.r_palm_node = new Node("r_palm", this.shapes.segment, this.materials.segment, r_palm_transform, Mat4.translation(1, 0, 0));
        // bottom->topjoint->topsection
        const r_palm_joint_location = Mat4.translation(.1, 0.04, -.9);
        this.r_palm_joint = new Arc("r_palm_joint", this.r_hand_node, this.r_palm_node, r_palm_joint_location);
        this.r_hand_node.children_arcs.push(this.r_palm_joint)
    }

    update_IK(end_eff, goal, start_eff=null) {
        return super.update_IK(end_eff, goal, this.transformation_matrix, true, start_eff);
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