import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const {Vector3, Vector, vec, vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component} = tiny;

// TODO: you should implement the required classes here or in another file.
class Particle extends Shape {
  constructor() {
    super ("position", "normal", "texture_coords");
    this.set = false;
    this.mass = 1;
    this.position = vec3(0,0,0);
    this.velocity = vec3(0,0,0);
    this.acceleration = vec3(0,0,0);
    this.ext_force = vec3(0,0,0)
  }
  update(dt, technique) {
    if (!this.set) {
      throw "Initialization not complete.";
    }

    this.acceleration = this.ext_force.times(1 / this.mass);
    const prev_position = this.position.copy();
    const prev_velocity = this.velocity.copy();
    let dx = prev_velocity.times(dt);
    let dv = this.acceleration.times(dt);
    if (technique == "euler") {
      // forward euler
      // x(t + dt) = x(t) + dt*v(t)
      // v(t + dt) = v(t) + dt*a(t)
      this.position = prev_position.plus(dx);
      this.velocity = prev_velocity.plus(dv);
    }
    else if (technique == "symplectic") {
      // symplectic euler
      // v(t + dt) = v(t) + dt*a(t) = v(t) + dv
      // x(t + dt) = x(t) + dt*v(t + dt)
      this.velocity = prev_velocity.plus(dv);
      dx = this.velocity.times(dt);
      this.position = prev_position.plus(dx);
    }
    else if (technique == "verlet") {
      // assumes acceleration only depends on position and not velocity
      // x(t + dt) = x(t) + dt*v(t) + dt**2/2*a(t)
      // v(t + dt) = v(t) + dt*(a(t) + a(t + dt))/2
      const acc_term_factor = dt**2/2;
      dx = prev_velocity.times(dt).plus(this.acceleration.times(acc_term_factor));
      this.position = prev_position.plus(dx);
      // (a(t) approximates (a(t)+a(t+dt))/2...
      this.velocity = prev_velocity.plus(dv);
    }
    else {
      throw "Not a valid technique.";
    }
  }
  set_properties(mass, x, y, z, vx, vy, vz) {
    this.set = true;
    this.mass = mass;
    this.position = vec3(x,y,z);
    this.velocity = vec3(vx,vy,vz);
  }
  set_velocity(vx, vy, vz) {
    this.velocity = vec3(vx,vy,vz);
  }
  hit_ground() {
    if (this.position[1] <= 0)
      return true;
    else
      return false;
  }
};

class Spring {
  constructor() {
    this.set = false;
    this.particle_0 = null;
    this.particle_1 = null;
    this.ks = 0;
    this.kd = 0;
    this.rest_length = 0;
  }
  update() {
    if (!this.set) {
      throw "Initialization not complete.";
    }

    // Check lecture slides 05, page 6/18
    const fe_ij = this.calculate_viscoelastic_forces();

    // elastic collisions
    // for some reason, add_by/subtract_by isn't working for me
    this.particle_0.ext_force = this.particle_0.ext_force.plus(fe_ij);
    this.particle_1.ext_force = this.particle_1.ext_force.minus(fe_ij);
  }
  connect(particle_0, particle_1, ks, kd, length) {
    this.set = true;
    this.particle_0 = particle_0;
    this.particle_1 = particle_1;
    this.ks = ks;
    this.kd = kd;
    this.rest_length = length;
  }
  calculate_viscoelastic_forces() {
    const p_i = this.particle_0.position.copy();
    const p_j = this.particle_1.position.copy();
    const d_ij = p_j.minus(p_i);
    const d_ij_mag = distance(p_j, p_i);
    const d_ij_unit = d_ij.normalized();
    const v_i = this.particle_0.velocity.copy();
    const v_j = this.particle_1.velocity.copy();
    const v_ij = v_j.minus(v_i);
    const l_ij = this.rest_length;

    // spring force (elastic)
    // fs_ij = ks_ij * (d_ij - l_ij) * d_ij
    const elastic_factor = this.ks * (d_ij_mag - l_ij); // ks_ij * (d_ij - l_ij)
    const fs_ij = d_ij_unit.times(elastic_factor);

    // damper force (viscous)
    // fd_ij = -kd_ij * (v_ij dot d_ij) * d_ij;
    const viscous_factor = this.kd * (v_ij.dot(d_ij_unit));
    const fd_ij = d_ij_unit.times(viscous_factor);

    const fe_ij = fs_ij.plus(fd_ij);

    return fe_ij;
  }
};

class Mass_Spring_Damper {
  constructor() {
    this.particles = [];
    this.springs = [];
    this.g_acc = vec3(0,0,0);
    this.ground_ks = 0;
    this.ground_kd = 0;
    this.technique = "euler";
    // Don't need friction
  }
  update(dt) {
    for (const p of this.particles) {
      p.ext_force = this.g_acc.times(p.mass);
      // add ground collision and damping
      if (p.hit_ground()) {
        const fn = this.calculate_ground_force(p);
        p.ext_force = p.ext_force.plus(fn);
      }
    }
    for (const s of this.springs) {
      s.update();
    }
    for (const p of this.particles) {
      p.update(dt, this.technique);
    }
  }
  create_particles(num) {
    for (let i = 0; i < num; i++) {
      this.particles.push(new Particle());
    }
  }
  set_all_particles_velocity(vx, vy, vz) {
    for (let i = 0; i < this.particles.length; i++) {
      particles[i].set_velocity(vx, vy, vz);
    }
  }
  create_springs(num) {
    for (let i = 0; i < num; i++) {
      this.springs.push(new Spring());
    }
  }
  calculate_ground_force(p) {
    // f_n = ks * ((P_g - x(t)) dot n) * n - kd * (v(t) dot n) * n
    // ((P_g - x(t) dot n)) = (0,x(t).y,0)
    const n = vec3(0,1,0);
    const v = p.velocity;
    const elastic_factor = -this.ground_ks * p.position[1];
    const elastic_component = n.times(elastic_factor);
    const viscous_factor = this.ground_kd * v.dot(n);
    const viscous_component = n.times(viscous_factor);
    const fn = elastic_component.minus(viscous_component);
    return fn;
  }
};

function distance(pos_0, pos_1) {
  let x_0 = pos_0[0];
  let y_0 = pos_0[1];
  let z_0 = pos_0[2];
  let x_1 = pos_1[0];
  let y_1 = pos_1[1];
  let z_1 = pos_1[2];

  let x_diff = x_0 - x_1;
  let y_diff = y_0 - y_1;
  let z_diff = z_0 - z_1;

  const length = Math.sqrt(x_diff**2 + y_diff**2 + z_diff**2);
  return length;
}

export
const Part_two_spring_base = defs.Part_two_spring_base =
    class Part_two_spring_base extends Component
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
        this.shapes = { 'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows() };

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;

        // TODO: you should create the necessary shapes
        this.msd = new Mass_Spring_Damper();
        this.sample_cnt = 1000;

        // initialized not running, time running = 0
        this.running = false;
        this.t_sim = 0;
        this.timestep = 1/1000;
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
          Shader.assign_camera( Mat4.look_at (vec3 (10, 10, 10), vec3 (0, 0, 0), vec3 (0, 1, 0)), this.uniforms );
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

        // draw axis arrows.
        this.shapes.axis.draw(caller, this.uniforms, Mat4.identity(), this.materials.rgb);
      }
    }


export class Part_two_spring extends Part_two_spring_base
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

    const blue = color( 0,0,1,1 ), yellow = color( 1,1,0,1 ), red = color(1,0,0,1);

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
         .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    // this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );

    // testing animation
    // this.shapes.ball.draw( caller, this.uniforms, ball_transform.times(Mat4.translation(1, Math.sin(3 * Math.PI * t), 1)), { ...this.materials.metal, color: blue } );

    // TODO: you should draw spline here.
    for (let i = 0; i < this.msd.particles.length; i++) {
      let particle = this.msd.particles[i];
      if (particle.set) {
        let position = particle.position;
        let x = position[0];
        let y = position[1];
        let z = position[2];
        this.shapes.ball.draw( caller, this.uniforms, Mat4.translation(x,y,z).times(Mat4.scale(0.25, 0.25, 0.25)), { ...this.materials.metal, color: blue } );
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
          this.shapes.box.draw(caller, this.uniforms, model_transform, { ...this.materials.plastic, color: red });
        }
      }
    
      // this.running bool initialized to false, change to true upon Run()
            // external loop:
      // determine how much time
      // elapsed time from last display or assume 60 fps

      // inner loop:
      // stable: make sure inner time step is small enough
      // efficient, not too small
      // try 60FPS, 1 ms per step
      // actually running the system
      let dt = this.dt = Math.min(1/30, this.uniforms.animation_delta_time / 1000);
      // dt *= this.sim_speed;
      if (this.running) {
        const t_next = this.t_sim + dt;
        while (this.t_sim < t_next) {
          this.msd.update(this.timestep)
          this.t_sim += this.timestep;
        }
      }


  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Two:";
    this.new_line();
    this.key_triggered_button( "Config", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Run", [], this.start );
    this.new_line();

    /* Some code for your reference
    this.key_triggered_button( "Copy input", [ "c" ], function() {
      let text = document.getElementById("input").value;
      console.log(text);
      document.getElementById("output").value = text;
    } );
    this.new_line();
    this.key_triggered_button( "Relocate", [ "r" ], function() {
      let text = document.getElementById("input").value;
      const words = text.split(' ');
      if (words.length >= 3) {
        const x = parseFloat(words[0]);
        const y = parseFloat(words[1]);
        const z = parseFloat(words[2]);
        this.ball_location = vec3(x, y, z)
        document.getElementById("output").value = "success";
      }
      else {
        document.getElementById("output").value = "invalid input";
      }
    } );
     */
  }

  parse_commands() {
    //TODO
    // supports:
    //    (3) create particles <Number of Particles>
    //    (9) particle <index> <mass> <x y z vx vy vz>
    //    (4) all_velocities <vx vy vz>
    //    (3) create springs <Number of Springs>
    //    (7) link <sindex> <pindex1> <pindex2> <ks> <kd> <length>
    //    (3) integration <"euler" | "symplectic" | "verlet"> <timestep>
    //    (3) ground <ks> <kd>
    //    (2) gravity <g>
    let text = document.getElementById("input").value;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const words = lines[i].split(' ');

      if (words.length > 9 || words.length < 2) {
        document.getElementById("output").value = "invalid input (part 2)";
      }
      else if (words.length == 2) {
        if (words[0] == "gravity") {
          this.msd.g_acc = vec3(0,-parseFloat(words[1]),0);
        }
      }
      else if (words.length == 3) {
        if (words[0] == "create") {
          const num = parseInt(words[2]);
          if (words[1] == "particles") {
            // create particles <Number of Particles>
            this.msd.create_particles(num);
            document.getElementById("output").value = "create particles"
          }
          else if (words[1] == "springs") {
            // create springs <Number of Springs>
            this.msd.create_springs(num);
            document.getElementById("output").value = "create springs"
          }
        }
        else if (words[0] == "integration") {
          // integration <"euler" | "symplectic" | "verlet"> <timestep>
          this.msd.technique = words[1];
          this.timestep = parseFloat(words[2]);
        }
        else if (words[0] == "ground") {
          // ground <ks> <kd>
          this.msd.ground_ks = parseFloat(words[1]);
          this.msd.ground_kd = parseFloat(words[2]);
        }
        else {
          document.getElementById("output").value = "invalid input (part 2)";
        }
      }
      else if (words.length == 4) {
        if (words[0] == "all_velocities") {
          const vx = parseFloat(words[1]);
          const vy = parseFloat(words[2]);
          const vz = parseFloat(words[3]);
          this.msd.set_all_particles_velocity(vx, vy, vz);
          document.getElementById("output").value = "all_velocities";
        }
      }
      else if (words.length == 7) {
        if (words[0] == "link") {
          const s_idx = parseInt(words[1]);
          const p_idx_0 = parseInt(words[2]);
          const p_idx_1 = parseInt(words[3]);
          const ks = parseFloat(words[4]);
          const kd = parseFloat(words[5]);
          let length = parseFloat(words[6]);

          let particle_0 = this.msd.particles[p_idx_0];
          let particle_1 = this.msd.particles[p_idx_1];

          if (length < 0) {
            let pos_0 = particle_0.position;
            let pos_1 = particle_1.position;

            length = distance(pos_0, pos_1);
          }
          this.msd.springs[s_idx].connect(particle_0, particle_1, ks, kd, length);
        }
      }
      else if (words.length == 9) {
        if (words[0] == "particle") {
          // particle <index> <mass> <x y z vx vy vz>
          const idx = parseInt(words[1]);
          const mass = parseFloat(words[2]);
          const x = parseFloat(words[3]);
          const y = parseFloat(words[4]);
          const z = parseFloat(words[5]);
          const vx = parseFloat(words[6]);
          const vy = parseFloat(words[7]);
          const vz = parseFloat(words[8]);
          this.msd.particles[idx].set_properties(mass, x, y, z, vx, vy, vz);
          document.getElementById("output").value = "set particle";
        }
      }
      else {
        document.getElementById("output").value = "invalid input (part 2)";
      }
    }
  }

  start() { // callback for Run button
    document.getElementById("output").value = "start";
    //TODO
    this.running = true;
  }
}
