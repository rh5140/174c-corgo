import { defs, tiny } from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// TODO: you should implement the required classes here or in another file.
class Curve_Shape extends Shape {
  constructor(curve_function, sample_count, size, curve_color=color( 1, 0, 0, 1 )) {
    super("position", "normal");

    this.material = { shader: new defs.Phong_Shader(), ambient: 1.0, color: curve_color }
    this.sample_count = sample_count;
    this.size = size;

    if (curve_function && this.sample_count) {
      for (let i = 0; i < this.size - 1; i++) {
        for (let j = 0; j < this.sample_count + 1; j++) {
          let t = j / this.sample_count;
          this.arrays.position.push(curve_function(t, i, i+1));
          this.arrays.normal.push(vec3(0, 0, 0)); // have to add normal to make Phong shader work.
        }
      }
    }
  }

  draw(webgl_manager, uniforms) {
    // call super with "LINE_STRIP" mode
    super.draw(webgl_manager, uniforms, Mat4.identity(), this.material, "LINE_STRIP");
  }

  update(webgl_manager, uniforms, curve_function) {
    if (curve_function && this.sample_count) {
      for (let i = 0; i < this.sample_count + 1; i++) {
        let t = 1.0 * i / this.sample_count;
        this.arrays.position[i] = curve_function(t);
      }
    }
    // this.arrays.position.forEach((v, i) => v = curve_function(i / this.sample_count));
    this.copy_onto_graphics_card(webgl_manager.context);
    // Note: vertex count is not changed.
    // not tested if possible to change the vertex count.
  }
};

class Hermite_Spline {
  constructor() {
    this.points = [];
    this.tangents = [];
    this.size = 0;
  }
  add_point(x,y,z,tx,ty,tz) {
    this.points.push(vec3(x,y,z));
    this.tangents.push(vec3(tx,ty,tz));
    this.size += 1;
  }
  get_position(t, i_0, i_1) { // NEED TO INTERPOLATE
    if (this.size < 2) { return vec3(0,0,0); }

    let p_0 = this.points[i_0].copy(); // copy of p_0 position
    let p_1 = this.points[i_1].copy(); // copy of p_1 position
    
    let scale = 1 / (this.size - 1);

    let m_0 = this.tangents[i_0].copy().times(scale); // copy of m_0 position
    let m_1 = this.tangents[i_1].copy().times(scale); // copy of m_1 position

    // p(t) = (2t^3 - 3t^2 + 1)p_0 + (t^3 - 2t^2 + t)m_0 + (-2t^3 + 3t^2)p_0 + (t^3 - t^2)m_1
    let h_00 = 2*t**3 - 3*t**2 + 1;
    let h_10 = t**3 - 2*t**2 + t;
    let h_01 = -2*t**3 + 3*t**2;
    let h_11 = t**3 - t**2;

    let a = p_0.times(h_00);
    let b = p_1.times(h_01);
    let c = m_0.times(h_10);
    let d = m_1.times(h_11);
    
    return a.plus(b).plus(c).plus(d);
  }
  get_velocity(t, i_0, i_1) {
    if (this.size < 2) { return vec3(0,0,0); }

    let p_0 = this.points[i_0].copy(); // copy of p_0 position
    let p_1 = this.points[i_1].copy(); // copy of p_1 position
    
    let scale = 1 / (this.size - 1);

    let m_0 = this.tangents[i_0].copy().times(scale); // copy of m_0 position
    let m_1 = this.tangents[i_1].copy().times(scale); // copy of m_1 position

    // p(t) = (2t^3 - 3t^2 + 1)p_0 + (t^3 - 2t^2 + t)m_0 + (-2t^3 + 3t^2)p_0 + (t^3 - t^2)m_1
    // v(t) = (6t^2 - 6t)p_1 + (3t^2 - 4t + 1)m_0 + (-6t^2 + 6t)p_0 + (3t^2 - 2t)m_1
    let h_00 = 6*t**2 - 6*t;
    let h_10 = 3*t**2 - 4*t + 1;
    let h_01 = -6*t**2 + 6*t;
    let h_11 = 3*t**2 - 2*t;

    let a = p_0.times(h_00);
    let b = p_1.times(h_01);
    let c = m_0.times(h_10);
    let d = m_1.times(h_11);
    
    return a.plus(b).plus(c).plus(d);
  }
  get_acceleration(t, i_0, i_1) {
    if (this.size < 2) { return vec3(0,0,0); }

    let p_0 = this.points[i_0].copy(); // copy of p_0 position
    let p_1 = this.points[i_1].copy(); // copy of p_1 position
    
    let scale = 1 / (this.size - 1);

    let m_0 = this.tangents[i_0].copy().times(scale); // copy of m_0 position
    let m_1 = this.tangents[i_1].copy().times(scale); // copy of m_1 position

    // p(t) = (2t^3 - 3t^2 + 1)p_0 + (t^3 - 2t^2 + t)m_0 + (-2t^3 + 3t^2)p_0 + (t^3 - t^2)m_1
    // v(t) = (6t^2 - 6t)p_1 + (3t^2 - 4t + 1)m_0 + (-6t^2 + 6t)p_0 + (3t^2 - 2t)m_1
    // a(t) = (12t - 6)p_1 + (6t - 4)m_0 + (-12t + 6)p_0 + (6t-2)m_1
    let h_00 = 12*t - 6;
    let h_10 = 3*t**2 - 4;
    let h_01 = -12*t + 6;
    let h_11 = 6*t - 2;

    let a = p_0.times(h_00);
    let b = p_1.times(h_01);
    let c = m_0.times(h_10);
    let d = m_1.times(h_11);
    
    return a.plus(b).plus(c).plus(d);
  }
  get_arc_length() {
    let length = 0;
    let sample_cnt = 1000;

    let prev = this.get_position(0, 0, 1);
    for (let i = 0; i < this.size - 1; i++) {
      for (let j = 1; j < (sample_cnt + 1); j++) {
        const t = j / sample_cnt;
        const curr = this.get_position(t, i, i+1);
        length += curr.minus(prev).norm();
        prev = curr;
      }
    }
    return length;
  }
};

class Particle extends Shape {
  constructor() {
    super ("position", "normal", "texture_coords");
    this.set = false;
    this.mass = 1;
    this.position = vec3(0,0,0);
    this.velocity = vec3(0,0,0);
    this.acceleration = vec3(0,0,0);
    this.ext_force = vec3(0,0,0)
    this.top = false;
  }
  update_top(dt, spline) {
    // Use spline
    // position function
    // velocity is derivative of position, accel is derivative of velocity
  }
  update(dt, technique) {
    if (!this.set) {
      throw "Particle: Initialization not complete.";
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
      // just doing a(t) rather than averaging for now
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
      throw "Spring: Initialization not complete.";
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
    this.g_acc = vec3(0,-9.81,0);
    this.ground_ks = 5000;
    this.ground_kd = 10;
    this.technique = "symplectic";
    this.spline = null;
    // Don't need friction
  }
  update(dt) {
    for (const p of this.particles) {
      if (p.top) {
      }
      else {
        p.ext_force = this.g_acc.times(p.mass);
        // add ground collision and damping
        // secret_calculate_ground_forces(this, p);
        if (p.hit_ground()) {
          const fn = this.calculate_ground_force(p);
          p.ext_force = p.ext_force.plus(fn);
        }
      }
    }
    for (const s of this.springs) {
      s.update();
    }
    for (const p of this.particles) {
      if (p.top) {
        p.update_top(dt, this.spline);
      }
      else {
        p.update(dt, this.technique);
      }
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
const Part_three_chain_base = defs.Part_three_chain_base =
    class Part_three_chain_base extends Component
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

        // Spline
        this.spline = new Hermite_Spline();
        this.sample_cnt = 1000;
        this.spline.add_point(0.0, 5.0, 0.0, -20.0, 0.0, 20.0);
        this.spline.add_point(0.0, 5.0, 5.0, 20.0, 0.0, 20.0);
        this.spline.add_point(5.0, 10.0, 5.0, 20.0, 0.0, -20.0);
        this.spline.add_point(5.0, 5.0, 0.0, -20.0, 0.0, -20.0);
        this.spline.add_point(0.0, 5.0, 0.0, -20.0, 0.0, 20.0);
        const curve_fn = (t, i_0, i_1) => this.spline.get_position(t, i_0, i_1);
        this.curve = new Curve_Shape(curve_fn, this.sample_cnt, this.spline.size);

        // Chain
        const ks = 1000;
        const kd = 10;
        const length = 1;
        this.msd = new Mass_Spring_Damper();
        this.msd.spline = this.spline;
        this.msd.create_particles(8);
        this.msd.particles[0].set_properties(1, 0, 5, 0, 1, 1, 1);
        this.msd.particles[0].top = true;
        this.msd.particles[1].set_properties(1, 0, 4, 0, 0, 0, 0);
        this.msd.particles[2].set_properties(1, 0, 3, 0, 0, 0, 0);
        this.msd.particles[3].set_properties(1, 0, 2, 0, 0, 0, 0);
        this.msd.particles[4].set_properties(1, 0, 1, 0, 0, 0, 0);
        this.msd.particles[5].set_properties(1, 1, 1, 0, 0, 0, 0);
        this.msd.particles[6].set_properties(1, 2, 1, 0, 0, 0, 0);
        this.msd.particles[7].set_properties(1, 3, 1, 0, 0, 0, 0);
        this.msd.create_springs(7);
        this.msd.springs[0].connect(this.msd.particles[0], this.msd.particles[1], ks, kd, length);
        this.msd.springs[1].connect(this.msd.particles[1], this.msd.particles[2], ks, kd, length);
        this.msd.springs[2].connect(this.msd.particles[2], this.msd.particles[3], ks, kd, length);
        this.msd.springs[3].connect(this.msd.particles[3], this.msd.particles[4], ks, kd, length);
        this.msd.springs[4].connect(this.msd.particles[4], this.msd.particles[5], ks, kd, length);
        this.msd.springs[5].connect(this.msd.particles[5], this.msd.particles[6], ks, kd, length);
        this.msd.springs[6].connect(this.msd.particles[6], this.msd.particles[7], ks, kd, length);

        this.timestep = 1/1000;
        this.t_sim = 0;
        this.running = true;
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


export class Part_three_chain extends Part_three_chain_base
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

    const blue = color( 0,0,1,1 ), yellow = color( 0.7,1,0,1 ), red = color(1,0,0,1);

    const t = this.t = this.uniforms.animation_time/1000;

    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    // let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
    //     .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    // this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );

    // TODO: you should draw spline here.
    // Draw Pringle spline
    this.curve.draw(caller, this.uniforms);

    // Draw chain
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

      let dt = this.dt = Math.min(1/30, this.uniforms.animation_delta_time / 1000);
      // dt *= this.sim_speed;
      if (this.running) {
        const t_next = this.t_sim + dt;
        while (this.t_sim < t_next) {
          // updating top particle
          // y = 0.5*Math.sin(x - PI/2) + 0.5
          const PI = Math.PI;
          let y = 0.5*Math.sin(this.t_sim/2 - PI/2) + 0.5;
          // 0 <= y <= 4
          let idx = parseInt(Math.floor(y * 4));
          // 0 <= idx <= 3
          let iter = 4 * (y - idx * 0.25);
          // let idx = parseInt(Math.floor(this.t_sim % 4));
          // let iter = this.t_sim % 1.0;
          this.msd.particles[0].position = this.spline.get_position(iter, idx, idx+1);
          this.msd.particles[0].velocity = this.spline.get_velocity(iter, idx, idx+1);
          this.msd.particles[0].acceleration = this.spline.get_velocity(iter, idx, idx + 1);

          // normal update
          this.msd.update(this.timestep)
          this.t_sim += this.timestep;
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
