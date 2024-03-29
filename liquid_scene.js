
import { Corgo } from "./assets/corgi/corgi.js";
import { Tree } from "./assets/tree/tree.js";
import { defs, tiny } from './examples/common.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Simulation } from "./lib/liquid_particle_system.js";
import { BoxCollider, Rigidbody } from "./lib/rigidbody.js";

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
            'corgi': new Corgo(),
            'spigot': new Shape_From_File("assets/spigot.obj"),
            'mushroom': new Shape_From_File("assets/mushroom.obj"),
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
        this.materials.water = {
            shader: phong,
            ambient: .2,
            diffusivity: 0.1,
            specularity: 1,
            color: color(.5, .5, 1, .2)
        }
        this.materials.spigot = {
            shader: phong,
            ambient: .2,
            diffusivity: 0.1,
            specularity: .5,
            color: color(.8, .8, .8, 1)
        }
        this.materials.brick = {
            shader: tex_phong,
            ambient: .3,
            diffusivity: 0.1,
            specularity: 0,
            color: color(1, 0.3, 0.3, 1),
            texture: new Texture( "assets/brick.png" )
        }
        this.materials.grass = {
            shader: tex_phong,
            ambient: .2,
            diffusivity: 0.1,
            specularity: 0,
            color: color(1, 1, 1, 1),
            texture: new Texture( "assets/grass.png" )
        }
        this.materials.mushroom = {
            shader: tex_phong,
            ambient: .2,
            diffusivity: 0.1,
            specularity: 0,
            color: color(1, 1, 1, 1),
            texture: new Texture( "assets/mushroom.png" )
        }

        this.fluid = new Simulation(this.shapes.box, this.materials.plastic);
        // this.fluid.create_particles(1);

        this.corgi = new Rigidbody("corgi", this.shapes.corgi, this.materials.plastic,
            vec3(-40,0.5,40), vec3(0,math.PI/4,0), vec3(1,1,1),
            Mat4.identity());
        this.corgi.colliders.push(
            new BoxCollider(this.corgi, vec3(2,1,1), vec3(0,0,0))
        );
        this.corgi.velocity = vec3(10, 0, -10);

        this.animt = 0

        //corgo animation
        this.thigh_angle = 0;
        this.thigh_angle_change_rate = 0.1;
        this.thigh_max_angle = Math.PI / 4;
        this.thigh_forward = true;


        this.tail_angle = 0;
        this.tail_forward = true;

        this.audio = {
            bgm: new Audio(),
        }
        this.audio.bgm.src = "assets/audio/water.mp3"; // https://freesound.org/people/septalium1/sounds/583833/
    }
    render_animation(caller) {
        if(!this.running) {
            this.audio.bgm.pause();
            return;
        }

        Shader.assign_camera(Mat4.look_at(vec3(10, 2, 10), vec3(-100, 0, -100), vec3(0, 1, 0)), this.uniforms);
        this.uniforms.projection_transform = Mat4.perspective(Math.PI / 4, caller.width / caller.height, 1, 100);
        //Camera
        // Shader.assign_camera(Mat4.look_at(vec3(10, 2, 10), vec3(-100, 0, -100), vec3(0, 1, 0)), this.uniforms);
        // this.uniforms.projection_transform = Mat4.perspective(Math.PI / 4, caller.width / caller.height, 1, 100);
        this.audio.bgm.play().catch((e) => {
            console.log("Not ready")
        });

        //Lights
        const t = this.t = this.uniforms.animation_time / 1000;
        const angle = Math.sin(t);

        const light_position = vec4(20 * Math.cos(angle), 20, 20 * Math.sin(angle), 1.0);
        this.uniforms.lights = [defs.Phong_Shader.light_source(light_position, color(1, 1, 1, 1), 1000000)];

        //Ground
        this.shapes.box.draw(caller, this.uniforms, Mat4.translation(0, -0.5, 0).times(Mat4.scale(100, 0.01, 100)), this.materials.grass)

        const dt = Math.min(1.0 / 30, this.uniforms.animation_delta_time / 1000);

        this.animt += dt
        this.animt = this.animt % 1
        if(this.corgi.position[0] > 40) this.corgi.position = vec3(-40,0.5,40)

        this.corgi.update(caller, this.uniforms, dt);

        for(let accum = 0; accum < dt; accum += this.fluid.p_dt) {
            this.fluid.update();
        }
        // this.fluid.update();
        // this.fluid.create_particles(1);
        this.fluid.draw(caller, this.uniforms, this.materials.water)
        if(math.random() > 0.7) this.fluid.create_particles(1);

        this.shapes.spigot.draw(caller, this.uniforms, Mat4.translation(-2.75, 7.5, -2.75).times(Mat4.rotation(-math.PI/4, 0, 1, 0)).times(Mat4.scale(4,4,4)), this.materials.spigot)

        this.shapes.box.draw(caller, this.uniforms, Mat4.translation(-10, 7.5, -10).times(Mat4.rotation(-math.PI/4, 0, 1, 0)).times(Mat4.scale(1,10,30)), this.materials.brick)

        this.shapes.mushroom.draw(caller, this.uniforms, Mat4.translation(0, 7.5, -15).times(Mat4.rotation(-math.PI/2, 0, 1, 1)).times(Mat4.scale(1,1,1)), this.materials.mushroom)
        this.shapes.mushroom.draw(caller, this.uniforms, Mat4.translation(-13, 5, -2).times(Mat4.rotation(math.PI/2.4, 1    , 1, 0)).times(Mat4.scale(1.5,1.5,1.5)), this.materials.mushroom)
        this.shapes.mushroom.draw(caller, this.uniforms, Mat4.translation(-10, 0.7, 5).times(Mat4.rotation(math.PI/2.4, 0    , 1, 0)).times(Mat4.scale(.8,.8,.8)), this.materials.mushroom)
        this.shapes.mushroom.draw(caller, this.uniforms, Mat4.translation(-11, 1, 6).times(Mat4.rotation(math.PI/1.2, 0    , 1, 0)).times(Mat4.scale(1,1,1)), this.materials.mushroom)
        this.shapes.mushroom.draw(caller, this.uniforms, Mat4.translation(-12, 1.3, 4).times(Mat4.scale(1.2,1.2,1.2)), this.materials.mushroom)

        if (this.thigh_forward) {
            this.thigh_angle += this.thigh_angle_change_rate;
            this.corgi.model.thigh.rotation.z += this.thigh_angle_change_rate;
            this.corgi.model.shoulder.rotation.z -= this.thigh_angle_change_rate;
            if (this.thigh_angle >= this.thigh_max_angle) {
                this.thigh_forward = false;
            }
        } else {
            this.thigh_angle -= this.thigh_angle_change_rate;
            this.corgi.model.thigh.rotation.z -= this.thigh_angle_change_rate;
            this.corgi.model.shoulder.rotation.z += this.thigh_angle_change_rate;
            if (this.thigh_angle <= -this.thigh_max_angle) {
                this.thigh_forward = true;
            }
        }
        //console.log(this.thigh_angle);

        let wag_rate = 0.1
        if (this.tail_forward) {
            this.tail_angle += wag_rate;
            this.corgi.model.tail_muscle.rotation.x += wag_rate;
            if (this.tail_angle >= Math.PI / 6) {
                this.tail_forward = false;
            }
        } else {
            this.tail_angle -= wag_rate;
            this.corgi.model.tail_muscle.rotation.x -= wag_rate;
            if (this.tail_angle <= -Math.PI / 6) {
                this.tail_forward = true;
            }
        }
    }
}