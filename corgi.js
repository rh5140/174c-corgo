import {defs, tiny} from "./examples/common.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Corgo {
    constructor(shape, material) {
        this.shape = shape;
        this.material = material;

        this.position = vec3(0,0,0);
        this.velocity = vec3(0,0,0);
        this.acceleration = vec3(0,0,0);
    }

    draw(caller, uniforms){
        this.shape.draw(caller, uniforms,
            Mat4.translation(this.position[0], this.position[1], this.position[2])
                .times(generate_rotation(this.velocity.normalized(), vec3(1, 0, 0))),
            this.material
        );
    }
}



function generate_rotation(a, b){
    let s = a.cross(b).dot(vec3(0, -1, 0));
    let c = a.dot(b);
    let angle = Math.atan2(s, c);
    return Mat4.rotation(angle, 0, 1, 0);
}