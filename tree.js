import {defs, tiny} from "./examples/common.js";
import {Shape_From_File} from "./examples/obj-file-demo.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Tree {
    constructor() {
        this.shapes = {
            'leaves': new Shape_From_File("assets/tree/Icosphere.obj"),
            'trunk': new Shape_From_File("assets/tree/Cube.obj"),
        };

        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {
            'leaves': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/tree/leave.png" ) },
            'trunk': { shader: phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(75/255, 58/255, 38/255, 1) },
        };
    }

    draw(webgl_manager, uniforms, transform) {
        this.shapes.trunk.draw(webgl_manager, uniforms, transform, this.materials.trunk);
        this.shapes.leaves.draw(webgl_manager, uniforms, Mat4.translation(0, 3, 0).times(transform), this.materials.leaves);
    }
}