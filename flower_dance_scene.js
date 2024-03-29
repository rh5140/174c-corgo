import { Corgo } from "./assets/corgi/corgi.js";
import { Flower } from "./assets/flower/flower.js";
import { Tree } from "./assets/tree/tree.js";
import { defs, tiny } from './examples/common.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Mass_Spring_Damper } from "./lib/particle_system.js";
import { Curve_Shape, Hermite_Spline } from "./lib/spline.js";

// Pull these names into this module's scope for convenience:
const {vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component} = tiny;

export const Corgo_collision_base = defs.Corgo_collision_base =
    class Corgo_collision_base extends Component {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                                                                            // This particular scene is broken up into two pieces for easier understanding.
                                                                                            // The piece here is the base class, which sets up the machinery to draw a simple
                                                                                            // scene demonstrating a few concepts.  A subclass of it, Part_one_hermite,
                                                                                            // exposes only the display() method, which actually places and draws the shapes,
                                                                                            // isolating that code so it can be experimented with on its own.
        init() {
            console.log("init")

            // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
            this.hover = this.swarm = false;
            // At the beginning of our program, load one of each of these shape
            // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
            // would be redundant to tell it again.  You should just re-use the
            // one called "box" more than once in display() to draw multiple cubes.
            // Don't define more than one blueprint for the same thing here.
            this.shapes = {
                'box': new defs.Cube(),
                'ball': new defs.Subdivision_Sphere(4),
                'axis': new defs.Axis_Arrows(),
                'mushroom': new Shape_From_File("assets/mushroom.obj"),
                'cloud': new Shape_From_File("assets/cloud.obj"),
                'tree': new Tree(),
                'mountain': new Shape_From_File("assets/mountain/mountain.obj"),
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
            this.materials.mushroomMtl = {
                shader: tex_phong,
                ambient: .2,
                diffusivity: 1,
                specularity: 0,
                color: color(1, 1, 1, 1),
                texture: new Texture("assets/mushroom.png")
            }
            this.materials.mountain = {
                shader: tex_phong,
                ambient: .4,
                diffusivity: .6,
                specularity: 0.3,
                color: color(1, 1, 1    , 1),
                texture: new Texture("assets/mountain/mountain.png")
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

            // Flower
            this.flower = new Flower();

            // Bouncing object
            const ks = 5000;
            const kd = 10;
            const length = 1;
            this.msd = new Mass_Spring_Damper();
            this.msd.ground_y = 3; // HARDCODING HEIGHT OF MUSHROOM FOR NOW
            this.msd.spline = this.spline;
            this.msd.create_particles(4);
            this.msd.particles[0].set_properties(1, -1, 5, -1, 0, 5, 0);
            this.msd.particles[1].set_properties(1, -1, 5, 1, 0, 5, 0);
            this.msd.particles[2].set_properties(1, 1, 5, 1, 0, 5, 0);
            this.msd.particles[3].set_properties(1, 1, 5, -1, 0, 5, 0);
            this.msd.create_springs(4);
            this.msd.springs[0].connect(this.msd.particles[0], this.msd.particles[1], ks, kd, length);
            this.msd.springs[1].connect(this.msd.particles[1], this.msd.particles[2], ks, kd, length);
            this.msd.springs[2].connect(this.msd.particles[2], this.msd.particles[3], ks, kd, length);
            this.msd.springs[3].connect(this.msd.particles[3], this.msd.particles[0], ks, kd, length);

            this.timestep = 1 / 1000;
            this.t_sim = 0;
            this.running = true;


            //corgo animation
            this.thigh_angle = 0;
            this.thigh_angle_change_rate = 0.05;
            this.thigh_max_angle = Math.PI / 4;
            this.thigh_forward = true;


            this.tail_angle = 0;
            this.tail_forward = true;


            //flower
            this.flower_toggle = 0;
            this.flower_up = vec3(0, 0, 0);

            //cam
            
            //cam spline
            this.spline_cam = new Hermite_Spline();

            this.spline_cam.add_point(12, 7, 13, 0, 5.0, 0);
            this.spline_cam.add_point(12, 8, 10, 0, 5.0, 0);
            this.spline_cam.add_point(12, 7, 7, 0, 5.0, 0);
            this.spline_cam.add_point(12, 8, 10, 0, 5.0, 0);
            this.spline_cam.add_point(12, 7, 13, 0, 5.0, 0);

            const curve_fn_spline = (t, i_0, i_1) => this.spline_cam.get_position(t, i_0, i_1);
            this.curve_cam = new Curve_Shape(curve_fn_spline, this.sample_cnt, this.spline_cam.size);

            /*
            //flower spline
            this.flower_spline = new Hermite_Spline();

            //right front
            this.flower_spline.add_point(6, 5.0, -1, -10, 0, -10);

            //right
            this.flower_spline.add_point(4, 3, -3, -10, 2, 10);

            //right back
            this.flower_spline.add_point(2, 5.0, -1, 10, 0, 10);

            //left front
            this.flower_spline.add_point(6, 5.0, 1, 10, 0, 10);
            
            //left
            this.flower_spline.add_point(4, 3, 3, -10, -2, 10);

            //left back
            this.flower_spline.add_point(2, 5.0, 1, 10, 0, -10);
            

            //right front
            this.flower_spline.add_point(6, 5.0, -1, -10, 0, -10);
            */
            //flower spline
            this.flower_spline = new Hermite_Spline();


            //right
            this.flower_spline.add_point(4, 4, -2, -10, 2, 10);

            //right back
            this.flower_spline.add_point(2, 5, 0, 10, 0, 10);

            //left
            this.flower_spline.add_point(4, 4, 2, -10, -2, 10);

            //left back
            this.flower_spline.add_point(2, 5, 0, 10, 0, -10);

            //right
            this.flower_spline.add_point(4, 4, -2, -10, 2, 10);


            //this.flower_spline.add_point(2, 6.0, 0, -10.0, 0.0, 20.0);
            //this.flower_spline.add_point(-5.0, -4.0, -5, -30.0, 0.0, 30.0);
            //this.flower_spline.add_point(-5.0, -2.0, 5.0, 30.0, 0.0, 30.0);
            //this.flower_spline.add_point(5.0, -2.0, 5.0, 30.0, 0.0, -30.0);

            const curve_fn_flower = (t, i_0, i_1) => this.flower_spline.get_position(t, i_0, i_1);
            this.flower_curve = new Curve_Shape(curve_fn_flower, this.sample_cnt, this.flower_spline.size);


            //left arm
            this.flower_spline_left = new Hermite_Spline();

            this.flower_spline_left.add_point(0, 3, 5, 0, 0, 0);
            this.flower_spline_left.add_point(3, 4, 5, 0, 0, 0);
            this.flower_spline_left.add_point(3, 4, 3, 0, 0, 0);
            this.flower_spline_left.add_point(3, 4, 5, 0, 0, 0);
            this.flower_spline_left.add_point(0, 3, 5, 0, 0, 0);

            const curve_fn_flower_left = (t, i_0, i_1) => this.flower_spline_left.get_position(t, i_0, i_1);
            this.flower_curve_left = new Curve_Shape(curve_fn_flower_left, this.sample_cnt, this.flower_spline_left.size);

            //right

            this.flower_spline_right = new Hermite_Spline();

            this.flower_spline_right.add_point(0, 3, -5, 0, 0, 0);
            this.flower_spline_right.add_point(3, 4, -5, 0, 0, 0);
            this.flower_spline_right.add_point(3, 4, -3, 0, 0, 0);
            this.flower_spline_right.add_point(3, 4, -5, 0, 0, 0);
            this.flower_spline_right.add_point(0, 3, -5, 0, 0, 0);
            
            const curve_fn_flower_right = (t, i_0, i_1) => this.flower_spline_right.get_position(t, i_0, i_1);
            this.flower_curve_right = new Curve_Shape(curve_fn_flower_right, this.sample_cnt, this.flower_spline_right.size);

            this.audio = {
                africa: new Audio(),
            }
            this.audio.africa.src = "assets/audio/Toto_Africa.mp3";
        }

        render_animation(caller) {

            if(!this.running) return;
            // display():  Called once per frame of animation.  We'll isolate out
            // the code that actually draws things into Part_one_hermite, a
            // subclass of this Scene.  Here, the base class's display only does
            // some initial setup.

            // // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
            // if (!caller.controls) {
            //     this.animated_children.push(caller.controls = new defs.Movement_Controls({uniforms: this.uniforms}));
            //     caller.controls.add_mouse_controls(caller.canvas);
            //
            //     // Define the global camera and projection matrices, which are stored in shared_uniforms.  The camera
            //     // matrix follows the usual format for transforms, but with opposite values (cameras exist as
            //     // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
            //     // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() or
            //     // orthographic() automatically generate valid matrices for one.  The input arguments of
            //     // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.
            //
            //     // !!! Camera changed here
            // }
            //Shader.assign_camera(Mat4.look_at(vec3(15, 2, 15), vec3(-100, 0, -100), vec3(0, 1, 0)), this.uniforms);
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


export class FlowerDanceScene extends Corgo_collision_base {                                                    // **Part_one_hermite** is a Scene object that can be added to any display canvas.
                                                                                                               // This particular scene is broken up into two pieces for easier understanding.
                                                                                                               // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                                                                               // The piece here exposes only the display() method, which actually places and draws
                                                                                                               // the shapes.  We isolate that code so it can be experimented with on its own.
                                                                                                               // This gives you a very small code sandbox for editing a simple scene, and for
                                                                                                               // experimenting with matrix transformations.
    render_animation(caller) {

        if(!this.running) {
            this.audio.africa.pause();
            return;
        }
        // display():  Called once per frame of animation.  For each shape that you want to
        // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
        // different matrix value to control where the shape appears.

        // Variables that are in scope for you to use:
        // this.shapes.box:   A vertex array object defining a 2x2x2 cube.
        // this.shapes.ball:  A vertex array object defining a 2x2x2 spherical surface.
        // this.materials.metal:    Selects a shader and draws with a shiny surface.
        // this.materials.plastic:  Selects a shader and draws a more matte surface.
        // this.lights:  A pre-made collection of Light objects.
        // this.hover:  A boolean variable that changes when the user presses a button.
        // shared_uniforms:  Information the shader needs for drawing.  Pass to draw().
        // caller:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().

        // Call the setup code that we left inside the base class:
        super.render_animation(caller);

        /**********************************
         Start coding down here!!!!
         **********************************/
            // From here on down it's just some example shapes drawn for you -- freely
            // replace them with your own!  Notice the usage of the Mat4 functions
            // translation(), scale(), and rotation() to generate matrices, and the
            // function times(), which generates products of matrices.

        const blue = color(0, 0, 1, 1), yellow = color(0.7, 1, 0, 1), red = color(1, 0, 0, 1),
            black = color(0, 0, 0, 1), white = color(1, 1, 1, 1);

        const t = this.t = this.uniforms.animation_time / 1000;

        // !!! Draw ground
        // TRANSLATED DOWN 3
        let floor_transform = Mat4.translation(0, -3, 0).times(Mat4.scale(100, 0.01, 100));
        this.shapes.box.draw(caller, this.uniforms, floor_transform, {
            ...this.materials.plastic,
            color: color(2 / 255, 48 / 255, 32 / 255, 1)
        });

        // TODO: you should draw spline here.
        //this.curve.draw(caller, this.uniforms);

        //flower debug
        //this.flower_curve.draw(caller, this.uniforms);
        //this.flower_curve_right.draw(caller, this.uniforms);
        //this.flower_curve_left.draw(caller, this.uniforms);

        this.curve_cam.draw(caller, this.uniforms);


        // Draw Cube Corgo
        this.corgo.draw(caller, this.uniforms);

        // Draw Flower
        this.flower.draw(caller, this.uniforms);
        // this.shapes.ball.draw(caller, this.uniforms, Mat4.translation(...ik_target).times(Mat4.scale(0.5, 0.5, 0.5)), {...this.materials.plastic, color: color(1, 1, 1, 0.2)})

        // Draw mushroom placeholder
        // this.shapes.mushroom.draw(caller, this.uniforms,  Mat4.translation(0,-1,0), this.materials.mushroomMtl);

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

        // Draw bouncing thing placeholder
        let particle_pos = this.msd.particles[0].position;
        let particle_y = particle_pos[1];
        // this.shapes.box.draw(caller, this.uniforms,  Mat4.translation(0,particle_y+1,0), { ...this.materials.plastic, color: white } )

        // Draw chain
        for (let i = 0; i < this.msd.particles.length; i++) {
            let particle = this.msd.particles[i];
            if (particle.set) {
                let position = particle.position;
                let x = position[0];
                let y = position[1];
                let z = position[2];
                // this.shapes.ball.draw( caller, this.uniforms, Mat4.translation(x,y,z).times(Mat4.scale(0.25, 0.25, 0.25)), { ...this.materials.metal, color: blue } );
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
                // this.shapes.box.draw(caller, this.uniforms, model_transform, { ...this.materials.plastic, color: red });
            }
        }

        let dt = this.dt = Math.min(1 / 30, this.uniforms.animation_delta_time / 1000);
        // dt *= this.sim_speed;
        if (this.running) {
            this.audio.africa.play();
            const t_next = this.t_sim + dt;
            while (this.t_sim < t_next) {
                let num_points = this.spline.size - 1;
                let idx = Math.floor(this.t_sim % num_points);
                let iter = this.t_sim % 1.0;
                this.corgo.position = this.spline.get_position(iter, idx, idx + 1);
                this.corgo.velocity = this.spline.get_velocity(iter, idx, idx + 1);
                this.corgo.acceleration = this.spline.get_velocity(iter, idx, idx + 1);

                //flower ik
                let f_speed = this.t_sim * 1.5;
                num_points = this.flower_spline.size - 1;
                idx = Math.floor(f_speed % num_points);
                iter = f_speed % 1.0;
                this.flower.update_IK(this.flower.eyes_node, this.flower_spline.get_position(iter, idx, idx+1));
                
                //left
                num_points = this.flower_spline_left.size - 1;
                idx = Math.floor(f_speed % num_points);
                iter = f_speed % 1.0;
                this.flower.update_IK(this.flower.l_hand_node, this.flower_spline_left.get_position(iter, idx, idx+1), this.flower.midsection_node);

                //right
                num_points = this.flower_spline_right.size - 1;
                idx = Math.floor(f_speed % num_points);
                iter = f_speed % 1.0;
                this.flower.update_IK(this.flower.r_hand_node, this.flower_spline_right.get_position(iter, idx, idx+1), this.flower.midsection_node);


                //cam
                let cam_speed = 0.2;
                num_points = this.spline_cam.size - 1;
                idx = Math.floor((this.t_sim * cam_speed) % num_points);
                iter = (this.t_sim * cam_speed) % 1.0;

                Shader.assign_camera(Mat4.look_at(this.spline_cam.get_position(iter, idx, idx + 1), vec3(-30, -16, -30), vec3(0, 1, 0)), this.uniforms);



                // normal update
                this.msd.update(this.timestep)
                this.t_sim += this.timestep;

            }
        }

    

        let counter = 0
        counter = 0
        /*
        while(counter < 10){
          counter++
          if(this.flower.update_IK(this.flower.eyes_node, this.corgo.position.plus(vec3(0, 3, 0)))) return;
          if(this.flower.update_IK(this.flower.r_hand_node, this.corgo.position, this.flower.midsection_node)) return;
          if(this.flower.update_IK(this.flower.l_hand_node, this.corgo.position, this.flower.midsection_node)) return;
        }
        */
       
        //funne dance
        //this.flower.position.plus(vec3(0, 3, 0))

        let fstate = this.flower_toggle
        let flower_targ_1 = vec3(1, 2, 0);
        let flower_targ_2 = vec3(2, 4, 2);

        //console.log(this.flower.eyes_node.location_matrix);

        /*
        while(counter < 10){
            counter++;
            if(fstate < 50){
                if(this.flower.update_IK(this.flower.eyes_node, this.corgo.position.plus(vec3(0, 3, 0)))) return;
                if(this.flower.update_IK(this.flower.r_hand_node, this.corgo.position, this.flower.midsection_node)) return;
                if(this.flower.update_IK(this.flower.l_hand_node, this.corgo.position, this.flower.midsection_node)) return;
                this.flower_up = this.corgo.position.plus(vec3(0, 10, 0))
            }
            else if(fstate >= 50){
                if(this.flower.update_IK(this.flower.eyes_node, this.flower_up))return;
                if(this.flower.update_IK(this.flower.r_hand_node, flower_targ_1, this.flower.midsection_node)) return;
                if(this.flower.update_IK(this.flower.l_hand_node, flower_targ_1, this.flower.midsection_node)) return;
            }
        }
        */
        for(let i = 0; i < math.PI; i+=math.PI/8) {
            this.shapes.mountain.draw(caller, this.uniforms, Mat4.rotation(i, 0, 1, 0).times(Mat4.translation(0, 0, -75)).times(Mat4.scale(20, 20, 20)), this.materials.mountain);
        }
        this.shapes.ball.draw(caller, this.uniforms, Mat4.identity().times(Mat4.scale(70,70,70)), {...this.materials.plastic, ambient: 1, color: color(0.3, .7, .7, 1)});

        
        this.flower_toggle++;
        if(this.flower_toggle >= 100){
            this.flower_toggle = 0;
        }
        

        //if(this.flower.update_IK(this.flower.r_hand_node, this.corgo.position, this.flower.midsection_node)) return;
        //if(this.flower.update_IK(this.flower.l_hand_node, this.corgo.position, this.flower.midsection_node)) return;

        //crappy corgo animation
        //legs
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

    // render_controls() {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    //     // buttons with key bindings for affecting this scene, and live info readouts.
    //     this.control_panel.innerHTML += "Part Three: (no buttons)";
    //     this.new_line();
    // }
}