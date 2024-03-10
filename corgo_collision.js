import { defs, tiny } from './examples/common.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Mass_Spring_Damper } from "./particle_system.js";
import { Curve_Shape, Hermite_Spline } from "./spline.js";
import {Corgo} from "./corgi.js";
import {Flower} from "./flower.js";

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
const Corgo_collision_base = defs.Corgo_collision_base =
    class Corgo_collision_base extends Component
    {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                               // This particular scene is broken up into two pieces for easier understanding.
                                               // The piece here is the base class, which sets up the machinery to draw a simple
                                               // scene demonstrating a few concepts.  A subclass of it, Part_one_hermite,
                                               // exposes only the display() method, which actually places and draws the shapes,
                                               // isolating that code so it can be experimented with on its own.
      init()
      {
        console.log("init")

        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape it
        // would be redundant to tell it again.  You should just re-use the
        // one called "box" more than once in display() to draw multiple cubes.
        // Don't define more than one blueprint for the same thing here.
        this.shapes = {
          'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows(),
          'corgi': new Shape_From_File("assets/corgi.obj"),
          'mushroom': new Shape_From_File("assets/mushroom.obj"),
          'tree': new Shape_From_File("assets/tree.obj"),
          'cloud': new Shape_From_File("assets/cloud.obj"),
        };

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 0.8, specularity: .0, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.mushroomMtl = { shader: tex_phong, ambient: .2, diffusivity: 1, specularity: 0, color: color(1, 1, 1, 1), texture: new Texture( "assets/mushroom.png" )};

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

        this.timestep = 1/1000;
        this.t_sim = 0;
        this.running = true;



        //corgo animation
        this.thigh_angle = 0;
        this.thigh_angle_change_rate = 0.1; 
        this.thigh_max_angle = Math.PI/4;
        this.thigh_forward = true;


        this.tail_angle = 0;
        this.tail_forward = true;
      }

      render_animation( caller )
      {                                                // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into Part_one_hermite, a
        // subclass of this Scene.  Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if( !caller.controls )
        { this.animated_children.push( caller.controls = new defs.Movement_Controls( { uniforms: this.uniforms } ) );
          caller.controls.add_mouse_controls( caller.canvas );

          // Define the global camera and projection matrices, which are stored in shared_uniforms.  The camera
          // matrix follows the usual format for transforms, but with opposite values (cameras exist as
          // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
          // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() or
          // orthographic() automatically generate valid matrices for one.  The input arguments of
          // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.

          // !!! Camera changed here
          Shader.assign_camera( Mat4.look_at (vec3 (10, 2, 10), vec3 (-100, 0, -100), vec3 (0, 1, 0)), this.uniforms );
        }
        this.uniforms.projection_transform = Mat4.perspective( Math.PI/4, caller.width/caller.height, 1, 100 );

        // *** Lights: *** Values of vector or point lights.  They'll be consulted by
        // the shader when coloring shapes.  See Light's class definition for inputs.
        const t = this.t = this.uniforms.animation_time/1000;
        const angle = Math.sin( t );

        // const light_position = Mat4.rotation( angle,   1,0,0 ).times( vec4( 0,-1,1,0 ) ); !!!
        // !!! Light changed here
        const light_position = vec4(20 * Math.cos(angle), 20,  20 * Math.sin(angle), 1.0);
        this.uniforms.lights = [ defs.Phong_Shader.light_source( light_position, color( 1,1,1,1 ), 1000000 ) ];

      }
    }


export class Corgo_collision extends Corgo_collision_base
{                                                    // **Part_one_hermite** is a Scene object that can be added to any display canvas.
                                                     // This particular scene is broken up into two pieces for easier understanding.
                                                     // See the other piece, My_Demo_Base, if you need to see the setup code.
                                                     // The piece here exposes only the display() method, which actually places and draws
                                                     // the shapes.  We isolate that code so it can be experimented with on its own.
                                                     // This gives you a very small code sandbox for editing a simple scene, and for
                                                     // experimenting with matrix transformations.
  render_animation( caller )
  {                                                // display():  Called once per frame of animation.  For each shape that you want to
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
    super.render_animation( caller );

    /**********************************
     Start coding down here!!!!
     **********************************/
        // From here on down it's just some example shapes drawn for you -- freely
        // replace them with your own!  Notice the usage of the Mat4 functions
        // translation(), scale(), and rotation() to generate matrices, and the
        // function times(), which generates products of matrices.

    const blue = color( 0,0,1,1 ), yellow = color( 0.7,1,0,1 ), red = color(1,0,0,1), black = color(0,0,0,1), white = color(1,1,1,1);

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    // TRANSLATED DOWN 3
    let floor_transform = Mat4.translation(0, -3, 0).times(Mat4.scale(100, 0.01, 100));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: color(2/255, 48/255, 32/255, 1) } );

    // TODO: you should draw spline here.
    // this.curve.draw(caller, this.uniforms);

    // Draw Cube Corgo
    this.corgo.draw(caller, this.uniforms);

    // Draw Flower
    this.flower.draw(caller, this.uniforms);
    let ik_target = Mat4.translation(3, 5, 2).times(Mat4.rotation(Math.PI/2, 0, 1, 0));
    this.shapes.corgi.draw(caller, this.uniforms, ik_target, {...this.materials.plastic, color: color(1, 1, 1, 0.3)});
    this.shapes.corgi.draw(caller, this.uniforms, this.flower.compute_global_transform(this.flower.petalsjoint).times(this.flower.petals_node.transform_matrix), {...this.materials.plastic, color: color(1, 1, 1, 0.3)});

    // Draw mushroom placeholder
    // this.shapes.mushroom.draw(caller, this.uniforms,  Mat4.translation(0,-1,0), this.materials.mushroomMtl);

    this.shapes.tree.draw(caller, this.uniforms,  Mat4.translation(-10,2,0).times(Mat4.scale(3, 3, 3)), { ...this.materials.plastic, color: color(0, 1, 0, 1) } );
    this.shapes.tree.draw(caller, this.uniforms,  Mat4.translation(0,2,-10).times(Mat4.scale(3, 3, 3)), { ...this.materials.plastic, color: color(0, 1, 0, 1) } );
    this.shapes.tree.draw(caller, this.uniforms,  Mat4.translation(-8,2,-8).times(Mat4.scale(3, 3, 3)), { ...this.materials.plastic, color: color(0, 1, 0, 1) } );

    this.shapes.cloud.draw(caller, this.uniforms,  Mat4.translation(-30,10,0).times(Mat4.scale(3, 3, 3)), { ...this.materials.plastic, color: color(1, 1, 1, 1) } );
    this.shapes.cloud.draw(caller, this.uniforms,  Mat4.translation(0,10,-30).times(Mat4.scale(3, 3, 3)), { ...this.materials.plastic, color: color(1, 1, 1, 1) } );
    this.shapes.cloud.draw(caller, this.uniforms,  Mat4.translation(-25,10,-25).times(Mat4.scale(3, 3, 3)), { ...this.materials.plastic, color: color(1, 1, 1, 1) } );

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
          let v = vec3(0,1,0);
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

      let dt = this.dt = Math.min(1/30, this.uniforms.animation_delta_time / 1000);
      // dt *= this.sim_speed;
      if (this.running) {
        const t_next = this.t_sim + dt;
        while (this.t_sim < t_next) {
          let num_points = this.spline.size - 1;
          let idx = Math.floor(this.t_sim % num_points);
          let iter = this.t_sim % 1.0;
          this.corgo.position = this.spline.get_position(iter, idx, idx+1);
          this.corgo.velocity = this.spline.get_velocity(iter, idx, idx+1);
          this.corgo.acceleration = this.spline.get_velocity(iter, idx, idx + 1);

          this.flower.update_IK(this.flower.eyes_node, ik_target)

          // normal update
          this.msd.update(this.timestep)
          this.t_sim += this.timestep;
        }
      }

      //crappy corgo animation
      //legs
      if(this.thigh_forward){
        this.thigh_angle += this.thigh_angle_change_rate;
        this.corgo.thigh.articulation_matrix = this.corgo.thigh.articulation_matrix.times(Mat4.rotation(this.thigh_angle_change_rate, 0, 0, 1));
        this.corgo.shoulder.articulation_matrix = this.corgo.shoulder.articulation_matrix.times(Mat4.rotation(-this.thigh_angle_change_rate, 0, 0, 1)); //shoulder, probably temp
        if(this.thigh_angle >= this.thigh_max_angle){
          this.thigh_forward = false;
        }
      }
      else{
        this.thigh_angle -= this.thigh_angle_change_rate;
        this.corgo.thigh.articulation_matrix = this.corgo.thigh.articulation_matrix.times(Mat4.rotation(-this.thigh_angle_change_rate, 0, 0, 1));
        this.corgo.shoulder.articulation_matrix = this.corgo.shoulder.articulation_matrix.times(Mat4.rotation(this.thigh_angle_change_rate, 0, 0, 1)); //shoulder, probably temp
        if(this.thigh_angle <= -this.thigh_max_angle){
          this.thigh_forward = true;
        }
      }
      //console.log(this.thigh_angle);

      let wag_rate = 0.1
      if(this.tail_forward){
        this.tail_angle += wag_rate;
        this.corgo.tail_muscle.articulation_matrix = this.corgo.tail_muscle.articulation_matrix.times(Mat4.rotation(wag_rate, 1, 0, 0));
        if(this.tail_angle >= Math.PI/6){
          this.tail_forward = false;
        }
      }
      else{
        this.tail_angle -= wag_rate;
        this.corgo.tail_muscle.articulation_matrix = this.corgo.tail_muscle.articulation_matrix.times(Mat4.rotation(-wag_rate, 1, 0, 0));
        if(this.tail_angle <= -Math.PI/6){
          this.tail_forward = true;
        }
      }

  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Three: (no buttons)";
    this.new_line();
  }
}