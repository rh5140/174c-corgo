
import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {Mass_Spring_Damper} from "./lib/particle_system.js";
import {Curve_Shape, Hermite_Spline} from "./lib/spline.js";
import {Corgo} from "./assets/corgi/corgi.js";
import {Tree} from "./assets/tree/tree.js";
import {Simulation} from "./lib/liquid_particle_system.js";

// Pull these names into this module's scope for convenience:
const {vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component} = tiny;

export class Liquid_Scene extends Component{
    init() {
        console.log("init")

        this.hover = this.swarm = false;

        this.shapes = {
            'box': new defs.Cube(),
            'ball': new defs.Subdivision_Sphere(4),
            'axis': new defs.Axis_Arrows(),
            'tree': new Tree(),
            'cloud': new Shape_From_File("assets/cloud.obj"),
        };

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = {
            shader: phong,
            ambient: .2,
            diffusivity: 0.8,
            specularity: .0,
            color: color(1, 1, 1, 1)
        }

        this.fluid = new Simulation(this.shapes.box, this.materials.plastic);
        this.fluid.create_particles(1);
    }
    render_animation(caller) {
        //Camera
        Shader.assign_camera(Mat4.look_at(vec3(10, 2, 10), vec3(-100, 0, -100), vec3(0, 1, 0)), this.uniforms);
        this.uniforms.projection_transform = Mat4.perspective(Math.PI / 4, caller.width / caller.height, 1, 100);

        //Lights
        const t = this.t = this.uniforms.animation_time / 1000;
        const angle = Math.sin(t);

        const light_position = vec4(20 * Math.cos(angle), 20, 20 * Math.sin(angle), 1.0);
        this.uniforms.lights = [defs.Phong_Shader.light_source(light_position, color(1, 1, 1, 1), 1000000)];

        //Ground
        this.shapes.box.draw(caller, this.uniforms, Mat4.translation(0, -0.5, 0).times(Mat4.scale(100, 0.01, 100)), this.materials.plastic)

        const dt = Math.min(1.0 / 30, this.uniforms.animation_delta_time / 1000);

        for(let accum = 0; accum < dt; accum += this.fluid.p_dt) {
            this.fluid.update();
        }
        // this.fluid.update();
        // this.fluid.create_particles(1);
        this.fluid.draw(caller, this.uniforms, this.materials.plastic)


        // console.log(dt)
        // y = 0
    }
}