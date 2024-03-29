import { Corgo } from "./assets/corgi/corgi.js";
import { Dead_Tree, Small_Tree, Tree } from "./assets/tree/tree.js";
import { defs, tiny } from './examples/common.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Mass_Spring_Damper } from "./lib/particle_system.js";
import { Curve_Shape, Hermite_Spline } from "./lib/spline.js";

// Pull these names into this module's scope for convenience:
const {vec, vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component} = tiny;

export let reached_goal;
export const Rope_bridge_base = defs.Rope_bridge_base =
    class Rope_bridge_base extends Component {
        init() {
            console.log("init rope bridge scene")

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
                texture: new Texture("assets/rock256_lighter.jpg", "LINEAR_MIPMAP_LINEAR")
            }
            this.materials.rock = {
                shader: tex_phong,
                ambient: 0.5,
                diffusivity: 1.0,
                specularity: 0.0,
                color: color(.5, .5, .5, 1.0),
                texture: new Texture("assets/rock256.jpg", "LINEAR_MIPMAP_LINEAR")
            }
            this.materials.cloud = {
                shader: phong,
                ambient: 0.5,
                diffusivity: 1.0,
                specularity: 0.0,
                color: color(1.0, 1.0, 1.0, 0.6),
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
            this.rope_segment_length = 1.0; // Distance between particles in a rope

            // Create the first bridge (the long one)
            // this.create_rope_bridge(-1, 5, -1, 20);
            this.create_rope_bridge(-1, 3, -1, 19, 2.5, 19);

            // Create the second bridge
            this.create_rope_bridge(20, 2.5, 18, 32, 6, -3);

            this.create_rope_bridge(32, 6, -3, 20, 2.5, -18);

            this.create_rope_bridge(17, 2.5, -18, 1, 3, -4);


            this.timestep = 1 / 1000;
            this.t_sim = 0;
            this.running = true;

            this.goal_mushroom_position = vec3(32, 6, -3);
            reached_goal = false;


            //corgo animation
            this.thigh_angle = 0;
            this.thigh_angle_change_rate = 0.1;
            this.thigh_max_angle = Math.PI / 4;
            this.thigh_forward = true;


            this.tail_angle = 0;
            this.tail_forward = true;


            //cam spline
            this.spline_cam = new Hermite_Spline();

            this.spline_cam.add_point(20, 15, -5, 10, 0, 0);
            this.spline_cam.add_point(25, 15, 0, 0, 0, 10);
            this.spline_cam.add_point(20, 15, 5, -10, 0, 0);
            this.spline_cam.add_point(25, 16, 0, 0, 0, -10);
            this.spline_cam.add_point(20, 15, -5, 10, 0, 0);

            const curve_fn_spline = (t, i_0, i_1) => this.spline_cam.get_position(t, i_0, i_1);
            this.curve_cam = new Curve_Shape(curve_fn_spline, this.sample_cnt, this.spline_cam.size);
        }

        create_rope_bridge(x, y, z, end_x, end_y, end_z) { // (x, y, z) is the start point of the bridge, (end_x, end_y, end_z) is the end point 
            const ks = 5000;
            const kd = 200;
            const natural_rope_length = 1; // natural length of springs in rope

            const bridge_distance = Math.sqrt((end_x - x)**2 + (end_y - y)**2 + (end_z - z)**2 );
            console.log("bridge is " + bridge_distance + " units long")
            console.log("this.rope_segment_length: " + this.rope_segment_length)
            const particles_in_rope = Math.ceil(bridge_distance / this.rope_segment_length); // How many particles are in a single rope
            console.log(particles_in_rope + " particles in rope")
            let delta_x = (end_x - x) / particles_in_rope; // the x-distance between each particle in the rope
            let delta_y = (end_y - y) / particles_in_rope; // the y-distance ""             ""
            let delta_z = (end_z - z) / particles_in_rope; // the z-distance ""             ""
            const springs_in_rope = particles_in_rope - 1; // How many springs are in a single rope
            let starting_particle_index = this.particle_index;
            let starting_spring_index = this.spring_index;

            console.log("start point: (" + x + ", " + y + ", " + z + ")   End point: (" + end_x + ", " + end_y + ", " + end_z + ")");
            let alpha = Math.atan((end_x - x)/ (end_z - z)); // returns angle in radians
            alpha = Math.abs(alpha);
            let x_offset = Math.abs(Math.cos(alpha) * 2);
            // if(end_x - x > 0)
            //     x_offset *= -1;
            let z_offset = Math.abs( Math.sin(alpha) * 2);
            if(end_z - z > 0)
                z_offset *= -1;
            console.log("alpha: " + alpha)
            console.log("x_offset: " + x_offset + ", z_offset: " + z_offset)
            // let x_offset = 0;
            // let z_offset = 2;

            const offset = vec3(end_x, end_y, end_z).minus(vec3(x, y, z)).normalized().cross(vec3(0, 1, 0))
            // Create one rope of the floor of the rope bridge
            this.create_rope(particles_in_rope, this.particle_index, x, y, z, -offset[0], 0, -offset[2], delta_x, delta_y, delta_z);

            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, natural_rope_length);
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;


            // Create the other rope on the floor of the rope bridge
            this.create_rope(particles_in_rope, this.particle_index, x, y, z, offset[0], 0, offset[2], delta_x, delta_y, delta_z);
            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, natural_rope_length)
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;


            // Springs for planks
            const plank_ks = 5000;
            const plank_kd = 500;
            const plank_length = 2;
            console.log("Bridge plank indices: " + this.spring_index + " to " + (this.spring_index + particles_in_rope))
            this.msd.create_springs(particles_in_rope); // There are as many planks as particles in a single rope
            for(let i = 0 ; i < particles_in_rope; i++) {
                this.msd.springs[this.spring_index + i].connect(this.msd.particles[starting_particle_index + i], this.msd.particles[starting_particle_index + particles_in_rope + i], plank_ks, plank_kd, plank_length);
                this.msd.springs[this.spring_index + i].is_plank = true;
            }
            this.spring_index += particles_in_rope;

            // Add railings
            const railing_height = 2;
            this.create_rope(particles_in_rope, this.particle_index, x, y, z, -offset[0], railing_height, -offset[2], delta_x, delta_y, delta_z);
            // console.log("spring index: " + this.spring_index)
            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, natural_rope_length);
            this.particle_index += particles_in_rope;
            this.spring_index += springs_in_rope;

            this.create_rope(particles_in_rope, this.particle_index, x, y, z, offset[0], railing_height, offset[2], delta_x, delta_y, delta_z);
            this.create_springs_for_rope(springs_in_rope, this.spring_index, this.particle_index, ks, kd, natural_rope_length);
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

        create_rope(num, start_index, x, y, z, x_offset, y_offset, z_offset, delta_x, delta_y, delta_z) {
            const distance_between_particles = 1;

            this.msd.create_particles(num);
            this.msd.particles[start_index].top =  true;
            this.msd.particles[start_index + num - 1].top =  true;

            for(let i = 0; i < num; i++) {
                let vx = 0;
                let vy = 5;
                let vz = 0;

                if(i === 0)
                    vy = 0;

                // else if(i === 1 || i === 2) { // Tiny perturbation to make the movement of the bridge more interesting
                //     z += -0.1;
                // }



                this.msd.particles[start_index + i].set_properties(1, x + (i * delta_x) + x_offset, y + (i * delta_y) + y_offset, z + (i * delta_z) + z_offset, vx, vy, vz);
            }

            console.log("Location of top particles: first " + this.msd.particles[start_index].position + " and last " + this.msd.particles[start_index + num - 1].position)


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
            if (!this.running) return
            // if (!caller.controls) {
            //     this.animated_children.push(caller.controls = new defs.Movement_Controls({uniforms: this.uniforms}));
            //     caller.controls.add_mouse_controls(caller.canvas);
            //     Shader.assign_camera(Mat4.look_at(vec3(50,25, 25), vec3(-200, -100, -100), vec3(0, 1, 0)), this.uniforms);
            // }
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
        if(!this.running) {
            this.audio.wind.pause();
            return
        }

        // Call the setup code that we left inside the base class:
        super.render_animation(caller);



        const blue = color(0, 0, 1, 1), yellow = color(0.7, 1, 0, 1), red = color(1, 0, 0, 1),
            black = color(0, 0, 0, 1), white = color(1, 1, 1, 1), tan = color(.9, .9, .9, 1.0);

        const t = this.t = this.uniforms.animation_time / 1000;

        const light_blue = color(0, 0.3, 0.7, 1);

        this.audio.wind.play().catch((e) => {
            console.log("Not ready")
        });

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
        this.shapes.tree.draw(caller, this.uniforms, Mat4.translation(32, 2, 12).times(Mat4.scale(3, 3, 3)));
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

        // Draw random mushroom for debugging
        this.shapes.mountain.draw(caller, this.uniforms, Mat4.translation(19, 0, 19).times(Mat4.scale(5, 4, 3)), this.materials.mountainside);

        // Draw random mushroom for debugging
        this.shapes.mountain.draw(caller, this.uniforms, Mat4.translation(19, 0, -19).times(Mat4.scale(5, 4, 3)), this.materials.mountainside);

        // Mushroom island mountain
        this.shapes.mountain.draw(caller, this.uniforms, Mat4.translation(32, 0, -3).times(Mat4.scale(5, 5, 3)), this.materials.mountainside);
        this.shapes.mushroom.draw(caller, this.uniforms,  Mat4.translation(this.goal_mushroom_position[0],this.goal_mushroom_position[1],this.goal_mushroom_position[2]), this.materials.mushroomMtl);

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

                    let points_dir = p2.minus(p1)
                    let forward = points_dir.cross(vec3(0, 1, 0)).normalized()
                    let angle = math.atan2(vec(0,0,1).cross(forward).dot(vec3(0, 1, 0)), vec(0,0,1).dot(forward))

                    let plank_transform = Mat4.scale(0.55, 0.8, 1);
                    plank_transform.pre_multiply(Mat4.rotation(angle, 0, 1, 0));
                    plank_transform.pre_multiply(Mat4.translation(center[0], center[1], center[2]));
                    this.shapes.plank.draw(caller, this.uniforms, plank_transform, this.materials.wood);
                }

            }
        }

        // draw sky???
        this.shapes.ball.draw(caller, this.uniforms, Mat4.identity().times(Mat4.scale(80,80,80)), {...this.materials.plastic, color: color(0.5, 1, 1, 1)});

        //reset the spline to the new locations of the planks....
        // Inefficiently reset all points in the spline :(
        this.spline.points = [];
        this.spline.tangents = [];
        this.spline.size = 0;
        for(let i = 0; i < plank_locations.length; i++) {
            this.spline.add_point(plank_locations[i][0], plank_locations[i][1] + 1.5, plank_locations[i][2], 1, 0, 0);
        }
        // Draw spline for debugging
        // Don't do this it clogs up the GPU
        // const curve_fn = (t, i_0, i_1) => this.spline.get_position(t, i_0, i_1);
        // this.curve = new Curve_Shape(curve_fn, this.sample_cnt, this.spline.size);
        // this.curve.draw(caller, this.uniforms);


        //cam spline draw (debug)
        // this.curve_cam.draw(caller, this.uniforms);

        let dt = this.dt = Math.min(1 / 30, this.uniforms.animation_delta_time / 1000);
        // dt *= this.sim_speed;
        const corgo_speedup = 4.0; // To make corgo run faster
        const cam_speed = 0.2
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

                //camera anim
                num_points = this.spline_cam.size - 1;
                idx = Math.floor((this.t_sim * cam_speed) % num_points);
                iter = (this.t_sim * cam_speed) % 1.0;

                Shader.assign_camera(Mat4.look_at(this.spline_cam.get_position(iter, idx, idx + 1), this.corgo.position, vec3(0, 1, 0)), this.uniforms);

                // normal update
                this.msd.update(this.timestep)
                this.t_sim += this.timestep;

                let distance_from_goal = Math.sqrt((this.corgo.position[0] - this.goal_mushroom_position[0])**2 + (this.corgo.position[1] - this.goal_mushroom_position[1])**2 + (this.corgo.position[2] - this.goal_mushroom_position[2])**2 );
                if(distance_from_goal < 3) {
                    // select_scene(1)

                    // reached_goal = true;
                    // this.running = false;
                    // break;

                    //TODO: do some destruction so that webgl doesn't die when the new scene is loaded in
                }
            }
        }

        // //crappy corgo animation
        if (this.thigh_forward) {
            this.thigh_angle += this.thigh_angle_change_rate;
            this.corgo.thigh.rotation.z += this.thigh_angle_change_rate;
            this.corgo.shoulder.rotation.z -= this.thigh_angle_change_rate;
            if (this.thigh_angle >= this.thigh_max_angle) {
                this.thigh_forward = false;
            }
        } else {
            this.thigh_angle -= this.thigh_angle_change_rate;
            this.corgo.thigh.rotation.z -= this.thigh_angle_change_rate;
            this.corgo.shoulder.rotation.z += this.thigh_angle_change_rate;
            if (this.thigh_angle <= -this.thigh_max_angle) {
                this.thigh_forward = true;
            }
        }
        //console.log(this.thigh_angle);

        let wag_rate = 0.05
        if (this.tail_forward) {
            this.tail_angle += wag_rate;
            this.corgo.tail_muscle.rotation.x += wag_rate;
            if (this.tail_angle >= Math.PI / 6) {
                this.tail_forward = false;
            }
        } else {
            this.tail_angle -= wag_rate;
            this.corgo.tail_muscle.rotation.x -= wag_rate;
            if (this.tail_angle <= -Math.PI / 6) {
                this.tail_forward = true;
            }
        }

    }
}
