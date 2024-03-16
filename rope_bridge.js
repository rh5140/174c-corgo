import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {Mass_Spring_Damper} from "./lib/particle_system.js";
import {Curve_Shape, Hermite_Spline} from "./lib/spline.js";
import {Corgo} from "./assets/corgi/corgi.js";
import {Tree, Small_Tree, Dead_Tree} from "./assets/tree/tree.js";

// Pull these names into this module's scope for convenience:
const {vec, vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component} = tiny;

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
                'small_tree': new Small_Tree(0.5),
                'dead_tree': new Dead_Tree(),
                'cloud': new Shape_From_File("assets/cloud.obj"),
                'plank': new Shape_From_File("assets/plank.obj"),
                'mountain': new Shape_From_File("assets/mountain.obj"),
                'rocks': new Shape_From_File("assets/tree/Icosphere.obj"),
                'mushroom': new Shape_From_File("assets/mushroom.obj"),
            };

            // *** Materials: ***  A "material" used on individual shapes specifies all fields
            // that a Shader queries to light/color it properly.  Here we use a Phong shader.
            // We can now tweak the scalar coefficients from the Phong lighting formulas.
            // Expected values can be found listed in Phong_Shader::update_GPU().
            const phong = new defs.Phong_Shader();
            const tex_phong = new defs.Textured_Phong();
            // const tex_modified = new Texture_Smaller();
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
            this.materials.mountainside = {
                shader: tex_phong,
                ambient: 0.5,
                diffusivity: 1.0,
                specularity: 0.0,
                color: color(.7, 0.7, .5, 1.0),
                texture: new Texture("assets/rock.jpg", "LINEAR_MIPMAP_LINEAR")
            }
            this.materials.rock = {
                shader: tex_phong,
                ambient: 0.5,
                diffusivity: 1.0,
                specularity: 0.0,
                color: color(.5, .5, .5, 1.0),
                texture: new Texture("assets/rock.jpg", "LINEAR_MIPMAP_LINEAR")
            }
            this.materials.cloud = {
                shader: phong,
                ambient: 0.5,
                diffusivity: 1.0,
                specularity: 0.0,
                color: color(1.0, 1.0, 1.0, 0.6),
                // texture: new Texture("assets/rock.jpg", "LINEAR_MIPMAP_LINEAR")
            }
            this.materials.water = {
                shader: tex_phong,
                ambient: 0.8,
                diffusivity: 0.0,
                specularity: 1.0,
                color: color(1.0, 1.0, 1.0, 1.0),
                texture: new Texture("assets/water.jpg")
            }
            this.materials.mushroomMtl = {
                shader: tex_phong,
                ambient: .2,
                diffusivity: 1,
                specularity: 0,
                color: color(1, 1, 1, 1),
                texture: new Texture("assets/mushroom.png")
            }

            this.audio = {
                wind: new Audio(),
            }
            this.audio.wind.src = "assets/audio/ropebridge/wind.mp3";


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

            this.particle_index = 0;
            this.spring_index = 0;
            // Create the first bridge (the long one)
            this.create_rope_bridge(-1, 5, -1, 20);

            // Create the second bridge
            this.create_rope_bridge(20, 5, -1, 12);


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

        create_rope_bridge(x, y, z, bridge_length) { // (x, y, z) is the start point of the bridge
            const ks = 5000;
            const kd = 200;
            const length = 1;

            // Horrible block of duplicated code
            const particles_in_rope = bridge_length; // How many particles are in a single rope
            const springs_in_rope = particles_in_rope - 1; // How many springs are in a single rope
            let starting_particle_index = this.particle_index;
            let starting_spring_index = this.spring_index;

            // Create one rope of the floor of the rope bridge
            this.create_rope(particles_in_rope, this.particle_index, x, y, z, 0, 0, 0);

            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, length);
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;


            // Create the other rope on the floor of the rope bridge
            this.create_rope(particles_in_rope, this.particle_index, x, y, z, 0, 0, -2);
            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, length)
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;


            // Springs for planks
            const plank_ks = 5000;
            const plank_kd = 500;
            const plank_length = 2;
            this.msd.create_springs(particles_in_rope); // There are as many planks as particles in a single rope
            for(let i = 0 ; i < particles_in_rope; i++) {
                this.msd.springs[this.spring_index + i].connect(this.msd.particles[starting_particle_index + i], this.msd.particles[starting_particle_index + particles_in_rope + i], plank_ks, plank_kd, plank_length);
                this.msd.springs[this.spring_index + i].is_plank = true;
            }
            this.spring_index += particles_in_rope;

            // Add railings
            const railing_height = 2;
            this.create_rope(particles_in_rope, this.particle_index, x, y, z, 0, railing_height, 0);
            // console.log("spring index: " + this.spring_index)
            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, length);
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;

            this.create_rope(particles_in_rope, this.particle_index, x, y, z, 0, railing_height, -2);
            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, length);
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;

            // Add ropes to connect the railings and the bottom ropes on the bridge
            const railing_ks = 5000;
            const railing_kd = 500;
            const railing_length = 1.75;
            this.msd.create_springs(particles_in_rope * 2);
            for(let i = 0; i < particles_in_rope * 2 ; i++) {
                this.msd.springs[this.spring_index + i].connect(this.msd.particles[starting_particle_index + i], this.msd.particles[starting_particle_index + particles_in_rope * 2 + i], railing_ks, railing_kd, railing_length);
            }
            this.spring_index += particles_in_rope * 2;


        }

        create_rope(num, start_index, x, y, z, x_offset, y_offset, z_offset) {
            this.msd.create_particles(num);
            this.msd.particles[start_index].top =  true;
            this.msd.particles[start_index + num - 1].top =  true;

            for(let i = 0; i < num; i++) {
                // NOTE: hardcoded the starting points of the ropes here
                // let x = -1;
                // let y = 5;
                // let z = -1;
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

        }

        render_animation(caller) {
            Shader.assign_camera(Mat4.look_at(vec3(50,25, 25), vec3(-200, -100, -100), vec3(0, 1, 0)), this.uniforms);
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

        const light_blue = color(0, 0.3, 0.7, 1);

        this.audio.wind.play();

        // !!! Draw ground
        // TRANSLATED DOWN 3
        let floor_transform = Mat4.translation(0, -3, 0).times(Mat4.scale(100, 0.01, 100));

        this.shapes.box.draw(caller, this.uniforms, floor_transform, this.materials.water);

        // Draw Cube Corgo
        this.corgo.draw(caller, this.uniforms);

        // this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(-10, 2, 0).times(Mat4.scale(0.5, 0.5, 0.5)));
        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(0, 3, 3).times(Mat4.scale(1, 1, 1)));

        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(10, 3, 2).times(Mat4.rotation(Math.PI / 4, 0, 0, 1)));

        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(10, 3, -8).times(Mat4.rotation(-Math.PI / 4, 1, 1, 1)));

        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(0, 0, 5));
        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(2, 0, 6));
        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(10, 0, 6).times(Mat4.rotation(Math.PI / 8, 1, 1, 1)));
        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(20, 0, 0));


        this.shapes.small_tree.draw(caller, this.uniforms, Mat4.translation(33, 5, 5).times(Mat4.rotation(Math.PI / 4, 1, 1, 1)));


        // Giant trees
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(0, 2, -10).times(Mat4.scale(3, 3, 3)));
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(-8, 2, -8).times(Mat4.scale(3, 3, 3)));
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(5, 2, 8).times(Mat4.scale(3, 3, 3)));
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(25, 2, 6).times(Mat4.scale(3, 3, 3)));
        // // Giant kelp
        // this.shapes.dead_tree.draw(caller, this.uniforms, Mat4.translation(0, 2, -10).times(Mat4.scale(3, 4, 3)));
        // this.shapes.dead_tree.draw(caller, this.uniforms, Mat4.translation(-8, 2, 0).times(Mat4.rotation(Math.PI / 6 , 1, 0, 1)).times(Mat4.scale(3, 7, 3)));
        // this.shapes.dead_tree.draw(caller, this.uniforms, Mat4.translation(5, 2, 8).times(Mat4.rotation(Math.PI / 6 , 0, 1, 1)).times(Mat4.scale(3, 10, 3)));

        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(-20, 5, 10).times(Mat4.scale(2, 2, 2)), {...this.materials.cloud, color: white});
        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(5, 3, -15).times(Mat4.scale(3, 3, 3)), this.materials.cloud);
        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(-25, 5, -25).times(Mat4.scale(3, 3, 3)), {...this.materials.cloud, color: white});


        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(5, 4, 3).times(Mat4.scale(0.8, 0.8, 0.8)), this.materials.cloud);

        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(15, 4, 5).times(Mat4.rotation(Math.PI / 2, 0, 0, 1)).times(Mat4.scale(1, 1, 1)), this.materials.cloud);


        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(8, 4, -5).times(Mat4.scale(0.8, 0.8, 0.8)), this.materials.cloud);

        // this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(9, 3.5, 3).times(Mat4.scale(5, 1, 2)), this.materials.cloud);

        this.shapes.cloud.draw(caller, this.uniforms, Mat4.translation(17, 3.5, 5).times(Mat4.rotation(Math.PI / 4 , 0, 0, 1)).times(Mat4.scale(2, 2, 2)), this.materials.cloud);

        // Draw "cliffs"
        // Try to downsample texture
        let texture2_coord = this.shapes.mountain.arrays.texture_coord;
        for (let i = 0; i < texture2_coord.length; i++) {
            let new_coord = vec(texture2_coord[i][0] * 2, texture2_coord[i][1] * 2); // Zoom out on each axis (so the texture appears multiple times on each face)
            this.shapes.mountain.arrays.texture_coord[i] = new_coord;
        }
        this.shapes.mountain.draw(caller, this.uniforms, Mat4.translation(-2, 0, -3).times(Mat4.scale(5, 5, 3)), this.materials.mountainside);


        this.shapes.mountain.draw(caller, this.uniforms, Mat4.translation(15, 0, -6).times(Mat4.scale(5, 5, 3)), this.materials.mountainside);

        // Mushroom island mountain
        this.shapes.mountain.draw(caller, this.uniforms, Mat4.translation(32, 0, -3).times(Mat4.scale(5, 5, 3)), this.materials.mountainside);
        this.shapes.mushroom.draw(caller, this.uniforms,  Mat4.translation(32,6,-3), this.materials.mushroomMtl);

        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(-3, 3, -3).times(Mat4.scale(2, 2, 2)).times(Mat4.rotation(Math.PI , 0, 0, 1)), this.materials.rock);
        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(-1, 0, 0).times(Mat4.scale(2, 2, 2)).times(Mat4.rotation(Math.PI , 1, 1, 1)), this.materials.rock);
        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(6, 0, -3).times(Mat4.scale(2, 2, 2)).times(Mat4.rotation(Math.PI , 0, 0, 1)), this.materials.rock);
        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(3, -1, 0).times(Mat4.scale(2, 2, 2)).times(Mat4.rotation(Math.PI , 0, 0, 1)), this.materials.rock);

        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(18, 2, -3).times(Mat4.scale(2, 2, 2)), this.materials.rock);
        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(18, 0, -3).times(Mat4.scale(2, 2, 2)), this.materials.rock);
        this.shapes.rocks.draw(caller, this.uniforms, Mat4.translation(17, 1, 0).times(Mat4.scale(2, 2, 2)), this.materials.rock);


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

            }
        }


        let plank_locations = []; // For the new spline
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
                    plank_locations.push(center); // For the new spline

                    let plank_transform = Mat4.scale(0.55, 0.8, 1);
                    plank_transform.pre_multiply(Mat4.rotation(theta, w[0], w[1], w[2]));
                    plank_transform.pre_multiply(Mat4.rotation(Math.PI / 2, 1, 0, 0));
                    plank_transform.pre_multiply(Mat4.rotation(Math.PI / 2, 0, 1, 0));
                    plank_transform.pre_multiply(Mat4.translation(center[0], center[1], center[2]));
                    this.shapes.plank.draw(caller, this.uniforms, plank_transform, this.materials.wood);
                }

            }
        }

        //reset the spline to the new locations of the planks....
        // Inefficiently reset all points in the spline :(
        this.spline.points = [];
        this.spline.tangents = [];
        this.spline.size = 0;
        for(let i = 0; i < plank_locations.length; i++) {
            console.log(plank_locations[i])
            this.spline.add_point(plank_locations[i][0], plank_locations[i][1] + 1.5, plank_locations[i][2], 1, 0, 0);
        }
        // Draw spline for debugging
        // Don't do this it clogs up the GPU
        // const curve_fn = (t, i_0, i_1) => this.spline.get_position(t, i_0, i_1);
        // this.curve = new Curve_Shape(curve_fn, this.sample_cnt, this.spline.size);
        // this.curve.draw(caller, this.uniforms);

        let dt = this.dt = Math.min(1 / 30, this.uniforms.animation_delta_time / 1000);
        // dt *= this.sim_speed;
        const corgo_speedup = 4.0; // To make corgo run faster
        if (this.running) {
            const t_next = this.t_sim + dt;
            while (this.t_sim < t_next) {
                let num_points = this.spline.size - 1;
                let idx = Math.floor((this.t_sim * corgo_speedup) % num_points);
                let iter = (this.t_sim * corgo_speedup) % 1.0;
                // console.log("t_sim: " + this.t_sim + "iter: " + iter);
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