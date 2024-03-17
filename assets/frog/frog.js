import { defs, tiny } from "../../examples/common.js";
import { Shape_From_File } from "../../examples/obj-file-demo.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Frog {
    constructor() {
        this.shapes = {
            'body': new Shape_From_File("assets/frog/Frog_Body.obj"),
            'back_legs': new Shape_From_File("assets/frog/Frog_Back_Legs.obj"),
            'eyes': new Shape_From_File("assets/frog/Frog_Eyes.obj"),
            'front_legs': new Shape_From_File("assets/frog/Frog_Front_Legs.obj"),
        };

        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {
            'body': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/frog/Body.png" ) },
            'back_legs': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(.6, .78, .56, 1) },
            'eyes': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(0, 0, 0, 1) },
            'front_legs': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(.6, .78, .56, 1) },
        };
    }

    draw(webgl_manager, uniforms, transform) {
        this.shapes.body.draw(webgl_manager, uniforms, transform, this.materials.body);
        this.shapes.back_legs.draw(webgl_manager, uniforms, transform.times(Mat4.translation(-1.2, -0.6, 0).times(Mat4.scale(0.6, 0.6, 0.6))), this.materials.back_legs);
        this.shapes.eyes.draw(webgl_manager, uniforms, transform.times(Mat4.translation(.65, .6, 0).times(Mat4.scale(0.35, 0.35, 0.35))), this.materials.eyes);
        this.shapes.front_legs.draw(webgl_manager, uniforms, transform.times(Mat4.translation(.6, -0.5, 0).times(Mat4.scale(0.6, 0.6, 0.6))), this.materials.front_legs);
    }
}