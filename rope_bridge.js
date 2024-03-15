import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {Mass_Spring_Damper} from "./lib/particle_system.js";
import {Curve_Shape, Hermite_Spline} from "./lib/spline.js";
import {Corgo} from "./assets/corgi/corgi.js";
import {Tree} from "./assets/tree/tree.js";

// Pull these names into this module's scope for convenience:
const {vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component} = tiny;

export const Rope_bridge_base = defs.Rope_bridge_base =
    class Rope_bridge_base extends Component {
        init() {
            console.log("init")

            this.hover = this.swarm = false;

            this.shapes = {
                'box': new defs.Cube(),
                'ball': new defs.Subdivision_Sphere(4),
                'axis': new defs.Axis_Arrows(),
                'tree': new Tree(),
                'cloud': new Shape_From_File("assets/cloud.obj"),
                'plank': new Shape_From_File("assets/plank.obj"),
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
                color: color(.9, .5, .9, 1)
            }
            this.materials.metal = {
                shader: phong,
                ambient: .2,
                diffusivity: 1,
                specularity: 1,
                color: color(.9, .5, .9, 1)
            }
            this.materials.wood = {
                shader: tex_phong,
                ambient: 0.8,
                diffusivity: 1.0,
                specularity: 0.0,
                texture: new Texture("assets/wood.jpg")
            }
            this.materials.rope = {
                shader: tex_phong,
                ambient: 1.0,
                diffusivity: 1.0,
                specularity: 0.0,
                color: color(.9, .9, .9, 1.0),
                texture: new Texture("assets/rope.jpg")
            }

            // Spline
            this.spline = new Hermite_Spline();
            this.sample_cnt = 1000;
            this.spline.add_point(-5, -2, -5, -30.0, 0.0, 30.0);
            this.spline.add_point(-5, -2, 5.0, 30.0, 0.0, 30.0);
            this.spline.add_point(5.0, -2, 5.0, 30.0, 0.0, -30.0);
            this.spline.add_point(5.0, -2, -5, -30.0, 0.0, -30.0);
            this.spline.add_point(-5, -2, -5, -30.0, 0.0, 30.0);
            const curve_fn = (t, i_0, i_1) => this.spline.get_position(t, i_0, i_1);
            this.curve = new Curve_Shape(curve_fn, this.sample_cnt, this.spline.size);

            // Corgo
            this.corgo = new Corgo();

            // Bouncing object
            this.msd = new Mass_Spring_Damper();


            this.create_rope_bridge();



            this.timestep = 1 / 1000;
            this.t_sim = 0;
            this.running = true;


            //corgo animation
            this.thigh_angle = 0;
            this.thigh_angle_change_rate = 0.1;
            this.thigh_max_angle = Math.PI / 4;
            this.thigh_forward = true;


            this.tail_angle = 0;
            this.tail_forward = true;
        }

        create_rope_bridge() {
            const ks = 5000;
            const kd = 200;
            const length = 1;

            // Horrible block of duplicated code
            let particles_in_rope = 9;
            let particle_index = 0;
            let spring_index = 0;
            let springs_in_rope = particles_in_rope - 1;
            this.create_rope(particles_in_rope, particle_index, 0, 0, 0);

            this.create_springs_for_rope(springs_in_rope, spring_index, particle_index, ks, kd, length);
            particle_index += particles_in_rope;
            spring_index += springs_in_rope;


            // Creating one rope of the rope bridge
            // this.msd.create_particles(9);
            // this.msd.particles[0].top =  true;
            // this.msd.particles[8].top =  true;
            //
            // this.msd.particles[0].set_properties(1, -1, 5, -1, 0, 0, 0);
            // this.msd.particles[1].set_properties(1, 0, 5, -0.1, 0, 5, 0);
            // this.msd.particles[2].set_properties(1, 1, 5, -0.1, 0, 5, 0);
            // this.msd.particles[3].set_properties(1, 1, 5, -1, 0, 5, 0);
            // this.msd.particles[4].set_properties(1, 2, 5, -1, 0, 5, 0);
            // this.msd.particles[5].set_properties(1, 3, 5, -1, 0, 5, 0);
            // this.msd.particles[6].set_properties(1, 4, 5, -1, 0, 5, 0);
            // this.msd.particles[7].set_properties(1, 5, 5, -1, 0, 5, 0);
            // this.msd.particles[8].set_properties(1, 6, 5, -1, 0, 5, 0);

            // Create the other rope on the rope bridge
            this.create_rope(particles_in_rope, particle_index, 0, 0, -2);
            this.create_springs_for_rope(springs_in_rope, spring_index, particle_index, ks, kd, length)
            particle_index += particles_in_rope;
            spring_index += springs_in_rope;

            // this.msd.create_particles(9);
            // this.msd.particles[9].top =  true;
            // this.msd.particles[17].top =  true;
            // let x_offset = 0;
            // let y_offset = 0;
            // let z_offset = 2;
            // this.msd.particles[9].set_properties(1, -1 - x_offset, 5 - y_offset, -1 - z_offset, 0, 0, 0);
            // this.msd.particles[10].set_properties(1, 0 - x_offset, 5 - y_offset, -0.1 - z_offset, 0, 5, 0);
            // this.msd.particles[11].set_properties(1, 1 - x_offset, 5 - y_offset, -0.1 - z_offset, 0, 5, 0);
            // this.msd.particles[12].set_properties(1, 1 - x_offset, 5 - y_offset, -1 - z_offset, 0, 5, 0);
            // this.msd.particles[13].set_properties(1, 2 - x_offset, 5 - y_offset, -1 - z_offset, 0, 5, 0);
            // this.msd.particles[14].set_properties(1, 3 - x_offset, 5 - y_offset, -1 - z_offset, 0, 5, 0);
            // this.msd.particles[15].set_properties(1, 4 - x_offset, 5 - y_offset, -1 - z_offset, 0, 5, 0);
            // this.msd.particles[16].set_properties(1, 5 - x_offset, 5 - y_offset, -1 - z_offset, 0, 5, 0);
            // this.msd.particles[17].set_properties(1, 6 - x_offset, 5 - y_offset, -1 - z_offset, 0, 5, 0);


            // Springs for one side of the rope bridge
            // this.msd.create_springs(8);
            // this.msd.springs[0].connect(this.msd.particles[0], this.msd.particles[1], ks, kd, length);
            // this.msd.springs[1].connect(this.msd.particles[1], this.msd.particles[2], ks, kd, length);
            // this.msd.springs[2].connect(this.msd.particles[2], this.msd.particles[3], ks, kd, length);
            // this.msd.springs[3].connect(this.msd.particles[3], this.msd.particles[4], ks, kd, length);
            // this.msd.springs[4].connect(this.msd.particles[4], this.msd.particles[5], ks, kd, length);
            // this.msd.springs[5].connect(this.msd.particles[5], this.msd.particles[6], ks, kd, length);
            // this.msd.springs[6].connect(this.msd.particles[6], this.msd.particles[7], ks, kd, length);
            // this.msd.springs[7].connect(this.msd.particles[7], this.msd.particles[8], ks, kd, length);
            // // this.msd.springs[8].connect(this.msd.particles[8], this.msd.particles[0], ks, kd, length);

            // Springs for the other side of the rope bridge
            // this.msd.create_springs(8);
            // this.msd.springs[8].connect(this.msd.particles[9], this.msd.particles[10], ks, kd, length);
            // this.msd.springs[9].connect(this.msd.particles[10], this.msd.particles[11], ks, kd, length);
            // this.msd.springs[10].connect(this.msd.particles[11], this.msd.particles[12], ks, kd, length);
            // this.msd.springs[11].connect(this.msd.particles[12], this.msd.particles[13], ks, kd, length);
            // this.msd.springs[12].connect(this.msd.particles[13], this.msd.particles[14], ks, kd, length);
            // this.msd.springs[13].connect(this.msd.particles[14], this.msd.particles[15], ks, kd, length);
            // this.msd.springs[14].connect(this.msd.particles[15], this.msd.particles[16], ks, kd, length);
            // this.msd.springs[15].connect(this.msd.particles[16], this.msd.particles[17], ks, kd, length);

            // Springs for planks maybe?
            let plank_ks = 5000;
            let plank_kd = 500;
            let plank_length = 2;
            this.msd.create_springs(9);
            for(let i = 0 ; i < 9; i++) {
                this.msd.springs[16 + i].connect(this.msd.particles[0 + i], this.msd.particles[9 + i], plank_ks, plank_kd, plank_length);
                this.msd.springs[16 + i].is_plank = true;
            }
            // this.msd.springs[16].connect(this.msd.particles[0], this.msd.particles[9], plank_ks, plank_kd, plank_length);
            // this.msd.springs[17].connect(this.msd.particles[1], this.msd.particles[10], plank_ks, plank_kd, plank_length);
            // this.msd.springs[18].connect(this.msd.particles[2], this.msd.particles[11], plank_ks, plank_kd, plank_length);
            // this.msd.springs[19].connect(this.msd.particles[3], this.msd.particles[12], plank_ks, plank_kd, plank_length);
            // this.msd.springs[20].connect(this.msd.particles[4], this.msd.particles[13], plank_ks, plank_kd, plank_length);
            // this.msd.springs[21].connect(this.msd.particles[5], this.msd.particles[14], plank_ks, plank_kd, plank_length);
            // this.msd.springs[22].connect(this.msd.particles[6], this.msd.particles[15], plank_ks, plank_kd, plank_length);
            // this.msd.springs[23].connect(this.msd.particles[7], this.msd.particles[16], plank_ks, plank_kd, plank_length);
            // this.msd.springs[24].connect(this.msd.particles[8], this.msd.particles[17], plank_ks, plank_kd, plank_length);
            spring_index += 9;

            // Add railings
            const railing_height = 2;
            this.create_rope(particles_in_rope, particle_index, 0, railing_height, 0);
            // console.log("spring index: " + spring_index)
            this.create_springs_for_rope(springs_in_rope, spring_index, particle_index, ks, kd, length);
            particle_index += particles_in_rope;
            spring_index += springs_in_rope;

            this.create_rope(particles_in_rope, particle_index, 0, railing_height, -2);
            this.create_springs_for_rope(springs_in_rope, spring_index, particle_index, ks, kd, length);

            // Add ropes between railings and the bottom ropes on the bridge
            // Magic numbers galore (refactor later)
            let railing_ks = 5000;
            let railing_kd = 500;
            let railing_length = 1.75;
            this.msd.create_springs(18);
            for(let i = 0; i < 18 ; i++) {
                this.msd.springs[41 + i].connect(this.msd.particles[i], this.msd.particles[18 + i], railing_ks, railing_kd, railing_length);
            }
            // this.msd.create_springs(9);
            // this.msd.springs[41].connect(this.msd.particles[0], this.msd.particles[18], railing_ks, railing_kd, railing_length);
            // this.msd.springs[42].connect(this.msd.particles[1], this.msd.particles[19], railing_ks, railing_kd, railing_length);
            // this.msd.springs[43].connect(this.msd.particles[2], this.msd.particles[20], railing_ks, railing_kd, railing_length);
            // this.msd.springs[44].connect(this.msd.particles[3], this.msd.particles[21], railing_ks, railing_kd, railing_length);
            // this.msd.springs[45].connect(this.msd.particles[4], this.msd.particles[22], railing_ks, railing_kd, railing_length);
            // this.msd.springs[46].connect(this.msd.particles[5], this.msd.particles[23], railing_ks, railing_kd, railing_length);
            // this.msd.springs[47].connect(this.msd.particles[6], this.msd.particles[24], railing_ks, railing_kd, railing_length);
            // this.msd.springs[48].connect(this.msd.particles[7], this.msd.particles[25], railing_ks, railing_kd, railing_length);
            // this.msd.springs[49].connect(this.msd.particles[8], this.msd.particles[26], railing_ks, railing_kd, railing_length);
            //
            // this.msd.create_springs(9);
            // this.msd.springs[50].connect(this.msd.particles[9], this.msd.particles[27], railing_ks, railing_kd, railing_length);
            // this.msd.springs[51].connect(this.msd.particles[10], this.msd.particles[28], railing_ks, railing_kd, railing_length);
            // this.msd.springs[52].connect(this.msd.particles[11], this.msd.particles[29], railing_ks, railing_kd, railing_length);
            // this.msd.springs[53].connect(this.msd.particles[12], this.msd.particles[30], railing_ks, railing_kd, railing_length);
            // this.msd.springs[54].connect(this.msd.particles[13], this.msd.particles[31], railing_ks, railing_kd, railing_length);
            // this.msd.springs[55].connect(this.msd.particles[14], this.msd.particles[32], railing_ks, railing_kd, railing_length);
            // this.msd.springs[56].connect(this.msd.particles[15], this.msd.particles[33], railing_ks, railing_kd, railing_length);
            // this.msd.springs[57].connect(this.msd.particles[16], this.msd.particles[34], railing_ks, railing_kd, railing_length);
            // this.msd.springs[58].connect(this.msd.particles[17], this.msd.particles[35], railing_ks, railing_kd, railing_length);

        }

        create_rope(num, start_index, x_offset, y_offset, z_offset) {
            this.msd.create_particles(num);
            this.msd.particles[start_index].top =  true;
            this.msd.particles[start_index + num - 1].top =  true;

            for(let i = 0; i < num; i++) {
                let x = -1;
                let y = 5;
                let z = -1;
                let vx = 0;
                let vy = 5;
                let vz = 0;

                if(i === 0)
                    vy = 0;

                else if(i === 1 || i === 2) {
                    z = -0.1;
                }
                // else if(i === 3)
                //     x_offset -= 1; // more magic numbers to get the movement i want


                this.msd.particles[start_index + i].set_properties(1, x + i + x_offset, y + y_offset, z + z_offset, vx, vy, vz);
            }

            // this.msd.particles[18].set_properties(1, -1, railing_height, -1, 0, 0, 0);
            // this.msd.particles[19].set_properties(1, 0, railing_height, -0.1, 0, 5, 0);
            // this.msd.particles[20].set_properties(1, 1, railing_height, -0.1, 0, 5, 0);
            // this.msd.particles[21].set_properties(1, 1, railing_height, -1, 0, 5, 0);
            // this.msd.particles[22].set_properties(1, 2, railing_height, -1, 0, 5, 0);
            // this.msd.particles[23].set_properties(1, 3, railing_height, -1, 0, 5, 0);
            // this.msd.particles[24].set_properties(1, 4, railing_height, -1, 0, 5, 0);
            // this.msd.particles[25].set_properties(1, 5, railing_height, -1, 0, 5, 0);
            // this.msd.particles[26].set_properties(1, 6, railing_height, -1, 0, 5, 0);

        }

        create_springs_for_rope(num, spring_start_index, particle_start_index, ks, kd, length) {
            this.msd.create_springs(num);

            if(this.msd.particles.length < particle_start_index + num - 1) {
                throw "Attempting to create springs for invalid particles";
            }

            if(this.msd.springs.length < spring_start_index + num - 1) {
                throw "Invalid spring starting index";
            }

            for(let i = 0; i < num; i++) {
                this.msd.springs[spring_start_index + i].connect(this.msd.particles[particle_start_index + i], this.msd.particles[particle_start_index + i + 1], ks, kd, length);
            }

            // this.msd.springs[8].connect(this.msd.particles[9], this.msd.particles[10], ks, kd, length);
            // this.msd.springs[9].connect(this.msd.particles[10], this.msd.particles[11], ks, kd, length);
            // this.msd.springs[10].connect(this.msd.particles[11], this.msd.particles[12], ks, kd, length);
            // this.msd.springs[11].connect(this.msd.particles[12], this.msd.particles[13], ks, kd, length);
            // this.msd.springs[12].connect(this.msd.particles[13], this.msd.particles[14], ks, kd, length);
            // this.msd.springs[13].connect(this.msd.particles[14], this.msd.particles[15], ks, kd, length);
            // this.msd.springs[14].connect(this.msd.particles[15], this.msd.particles[16], ks, kd, length);
            // this.msd.springs[15].connect(this.msd.particles[16], this.msd.particles[17], ks, kd, length);
        }

        render_animation(caller) {
            Shader.assign_camera(Mat4.look_at(vec3(10, 2, 10), vec3(-100, 0, -100), vec3(0, 1, 0)), this.uniforms);
            this.uniforms.projection_transform = Mat4.perspective(Math.PI / 4, caller.width / caller.height, 1, 100);

            // *** Lights: *** Values of vector or point lights.  They'll be consulted by
            // the shader when coloring shapes.  See Light's class definition for inputs.
            const t = this.t = this.uniforms.animation_time / 1000;
            const angle = Math.sin(t);

            // const light_position = Mat4.rotation( angle,   1,0,0 ).times( vec4( 0,-1,1,0 ) ); !!!
            // !!! Light changed here
            const light_position = vec4(20 * Math.cos(angle), 20, 20 * Math.sin(angle), 1.0);
            this.uniforms.lights = [defs.Phong_Shader.light_source(light_position, color(1, 1, 1, 1), 1000000)];

        }
    }


export class Rope_bridge extends Rope_bridge_base {
    render_animation(caller) {

        // Call the setup code that we left inside the base class:
        super.render_animation(caller);

        const blue = color(0, 0, 1, 1), yellow = color(0.7, 1, 0, 1), red = color(1, 0, 0, 1),
            black = color(0, 0, 0, 1), white = color(1, 1, 1, 1), tan = color(.9, .9, .9, 1.0);

        const t = this.t = this.uniforms.animation_time / 1000;

        // !!! Draw ground
        // TRANSLATED DOWN 3
        let floor_transform = Mat4.translation(0, -3, 0).times(Mat4.scale(100, 0.01, 100));
        this.shapes.box.draw(caller, this.uniforms, floor_transform, {
            ...this.materials.plastic,
            color: color(2 / 255, 48 / 255, 32 / 255, 1)
        });

        // Draw Cube Corgo
        this.corgo.draw(caller, this.uniforms);

        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(-10, 2, 0).times(Mat4.scale(3, 3, 3)));
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(0, 2, -10).times(Mat4.scale(3, 3, 3)));
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(-8, 2, -8).times(Mat4.scale(3, 3, 3)));

        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(-30, 10, 0).times(Mat4.scale(3, 3, 3)), {
            ...this.materials.plastic,
            color: color(1, 1, 1, 1)
        });
        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(0, 10, -30).times(Mat4.scale(3, 3, 3)), {
            ...this.materials.plastic,
            color: color(1, 1, 1, 1)
        });
        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(-25, 10, -25).times(Mat4.scale(3, 3, 3)), {
            ...this.materials.plastic,
            color: color(1, 1, 1, 1)
        });

        // Draw chain (now a rope)
        for (let i = 0; i < this.msd.particles.length; i++) {
            let particle = this.msd.particles[i];
            if (particle.set) {
                let position = particle.position;
                let x = position[0];
                let y = position[1];
                let z = position[2];
                // console.log("position: " + position)
                this.shapes.ball.draw( caller, this.uniforms, Mat4.translation(x,y,z).times(Mat4.scale(0.07, 0.07, 0.07)), { ...this.materials.rope, color: tan } );


                // Draw planks
                // this.shapes.box.draw(caller, this.uniforms, Mat4.translation(x,y,z).times(Mat4.scale(0.3, 0.01, 1)), { ...this.materials.plastic, color: red });
            }
        }

        for (const s of this.msd.springs) {
            if (s.set) {
                const p1 = s.particle_0.position;
                const p2 = s.particle_1.position;
                const len = (p2.minus(p1)).norm();
                const center = (p1.plus(p2)).times(0.5);

                let model_transform = Mat4.scale(0.05, len / 2, 0.05);

                // https://computergraphics.stackexchange.com/questions/4008/rotate-a-cylinder-from-xy-plane-to-given-points
                const p = p1.minus(p2).normalized();
                let v = vec3(0, 1, 0);
                if (Math.abs(v.cross(p).norm()) < 0.1) {
                    v = vec3(0, 0, 1);
                    model_transform = Mat4.scale(0.05, 0.05, len / 2);
                }
                const w = v.cross(p).normalized();

                const theta = Math.acos(v.dot(p));
                model_transform.pre_multiply(Mat4.rotation(theta, w[0], w[1], w[2]));
                model_transform.pre_multiply(Mat4.translation(center[0], center[1], center[2]));

                if(!s.is_plank) {
                    this.shapes.box.draw(caller, this.uniforms, model_transform, this.materials.rope);
                }
                else {
                    let plank_transform = Mat4.scale(0.55, 0.8, 1);
                    plank_transform.pre_multiply(Mat4.rotation(theta, w[0], w[1], w[2]));
                    plank_transform.pre_multiply(Mat4.rotation(Math.PI / 2, 1, 0, 0));
                    plank_transform.pre_multiply(Mat4.rotation(Math.PI / 2, 0, 1, 0));
                    plank_transform.pre_multiply(Mat4.translation(center[0], center[1], center[2]));
                    this.shapes.plank.draw(caller, this.uniforms, plank_transform, this.materials.wood);
                }

            }
        }

        let dt = this.dt = Math.min(1 / 30, this.uniforms.animation_delta_time / 1000);
        // dt *= this.sim_speed;
        if (this.running) {
            const t_next = this.t_sim + dt;
            while (this.t_sim < t_next) {
                let num_points = this.spline.size - 1;
                let idx = Math.floor(this.t_sim % num_points);
                let iter = this.t_sim % 1.0;
                this.corgo.position = this.spline.get_position(iter, idx, idx + 1);
                this.corgo.velocity = this.spline.get_velocity(iter, idx, idx + 1);
                this.corgo.acceleration = this.spline.get_velocity(iter, idx, idx + 1);

                // normal update
                this.msd.update(this.timestep)
                this.t_sim += this.timestep;
            }
        }

        // //crappy corgo animation
        // //legs
        // if (this.thigh_forward) {
        //     this.thigh_angle += this.thigh_angle_change_rate;
        //     this.corgo.thigh.articulation_matrix = this.corgo.thigh.articulation_matrix.times(Mat4.rotation(this.thigh_angle_change_rate, 0, 0, 1));
        //     this.corgo.shoulder.articulation_matrix = this.corgo.shoulder.articulation_matrix.times(Mat4.rotation(-this.thigh_angle_change_rate, 0, 0, 1)); //shoulder, probably temp
        //     if (this.thigh_angle >= this.thigh_max_angle) {
        //         this.thigh_forward = false;
        //     }
        // } else {
        //     this.thigh_angle -= this.thigh_angle_change_rate;
        //     this.corgo.thigh.articulation_matrix = this.corgo.thigh.articulation_matrix.times(Mat4.rotation(-this.thigh_angle_change_rate, 0, 0, 1));
        //     this.corgo.shoulder.articulation_matrix = this.corgo.shoulder.articulation_matrix.times(Mat4.rotation(this.thigh_angle_change_rate, 0, 0, 1)); //shoulder, probably temp
        //     if (this.thigh_angle <= -this.thigh_max_angle) {
        //         this.thigh_forward = true;
        //     }
        // }
        // //console.log(this.thigh_angle);
        //
        // let wag_rate = 0.1
        // if (this.tail_forward) {
        //     this.tail_angle += wag_rate;
        //     this.corgo.tail_muscle.articulation_matrix = this.corgo.tail_muscle.articulation_matrix.times(Mat4.rotation(wag_rate, 1, 0, 0));
        //     if (this.tail_angle >= Math.PI / 6) {
        //         this.tail_forward = false;
        //     }
        // } else {
        //     this.tail_angle -= wag_rate;
        //     this.corgo.tail_muscle.articulation_matrix = this.corgo.tail_muscle.articulation_matrix.times(Mat4.rotation(-wag_rate, 1, 0, 0));
        //     if (this.tail_angle <= -Math.PI / 6) {
        //         this.tail_forward = true;
        //     }
        // }

    }
}