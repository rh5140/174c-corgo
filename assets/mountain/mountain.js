import {defs, tiny} from "../../examples/common.js";
import {Shape_From_File} from "../../examples/obj-file-demo.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Mountain {
    constructor() {
        this.shapes = {
            'mountain': new Shape_From_File("assets/mountain/mountain.obj"),
        };

        const tex_phong = new defs.Textured_Phong();
        this.materials = {
            'mountain': { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/mountain/mountain.png" ) },
        };
    }

    draw(webgl_manager, uniforms, transform) {
        this.shapes.mountain.draw(webgl_manager, uniforms, transform, this.materials.mountain);
    }
}