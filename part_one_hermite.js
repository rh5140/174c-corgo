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
    this.table = []; // idx: (t, arc length)
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
  get_arc_length() {
    let length = 0;
    let sample_cnt = 1000;

    // first value of table is t=0, length=0
    this.table.push(vec3(0,0,0));

    let prev = this.get_position(0, 0, 1);
    for (let i = 0; i < this.size - 1; i++) {
      for (let j = 1; j < (sample_cnt + 1); j++) {
        const t = j / sample_cnt;
        const curr = this.get_position(t, i, i+1);
        length += curr.minus(prev).norm();
        prev = curr;

        // map [0, size] to [0,1]
        let param = (i + t) / this.size;
        this.table.push(vec3(this.table.length + 1, param, length));
      }
    }
    // last value is t=1, length
    this.table.push(vec3(this.table.length + 1, 1, length));
    return length;
  }
};

export
const Part_one_hermite_base = defs.Part_one_hermite_base =
    class Part_one_hermite_base extends Component
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

        this.curve_fn = null;
        this.sample_cnt = 0;
        this.curve = new Curve_Shape(null, 100, 0);

        // *** Materials: ***  A "material" used on individual shapes specifies all fields
        // that a Shader queries to light/color it properly.  Here we use a Phong shader.
        // We can now tweak the scalar coefficients from the Phong lighting formulas.
        // Expected values can be found listed in Phong_Shader::update_GPU().
        const basic = new defs.Basic_Shader();
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;

        // TODO: you should create a Spline class instance
        this.spline = new Hermite_Spline();
        this.sample_cnt = 1000;

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


export class Part_one_hermite extends Part_one_hermite_base
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

    const blue = color( 0,0,1,1 ), yellow = color( 1,0.7,0,1 );

    const t = this.t = this.uniforms.animation_time/1000;


    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw curve

    // // Sad, this is not working
    // const gl = caller.context;
    // gl.lineWidth(10);

    // add some fluctuation
    // if (this.curve_fn && this.sample_cnt === this.curve.sample_count) {
    //   this.curve.update(caller, this.uniforms,
    //       (s) => this.curve_fn(s).plus(vec3(Math.cos(this.t * s), Math.sin(this.t), 0)) );
    // }

    // TODO: you should draw spline here.
    this.curve.draw(caller, this.uniforms);
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part One:";
    this.new_line();
    this.key_triggered_button( "Parse Commands", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Draw", [], this.update_scene );
    this.new_line();
    this.key_triggered_button( "Load", [], this.load_spline );
    this.new_line();
    this.key_triggered_button( "Export", [], this.export_spline );
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
    // supports:
    //    add point x y z tx ty tz
    //    set tangent idx x y z
    //    set point idx x y z
    //    get_arc_length
    let text = document.getElementById("input").value;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const words = lines[i].split(' ');

      if (words.length > 8) {
        document.getElementById("output").value = "invalid input (Part 1)";
      }
      // add point x y z tx ty tz
      else if (words.length == 8) {
        // check if if it's an add point command
        if (words[0] == "add" && words[1] == "point") {
          const x = parseFloat(words[2]);
          const y = parseFloat(words[3]);
          const z = parseFloat(words[4]);
          const tx = parseFloat(words[5]);
          const ty = parseFloat(words[6]);
          const tz = parseFloat(words[7]);
          this.spline.add_point(x,y,z,tx,ty,tz);

          document.getElementById("output").value = "add point";
        }
        else {
          document.getElementById("output").value = "invalid input (Part 1)";
        }
      }
      else if (words.length == 6) {
        if (words[0] == "set") {
          const idx = parseFloat(words[2]);
          // check idx is within length
          if (idx < 0 || idx >= this.spline.size) {
            document.getElementById("output").value = "invalid input (Part 1): control point does not exist";
          }

          const x = parseFloat(words[3]);
          const y = parseFloat(words[4]);
          const z = parseFloat(words[5]);
          if (words[1] == "tangent") {
            this.spline.tangents[idx] = vec3(x,y,z);
          }
          else if (words[1] == "point") {
            this.spline.points[idx] = vec3(x,y,z);
          }
        }
        else {
          document.getElementById("output").value = "invalid input (Part 1)";
        }
      }
      else if (words == "get_arc_length") {
        const arc_length = this.spline.get_arc_length();
        document.getElementById("output").value = arc_length;
      }
      else {
        document.getElementById("output").value = "invalid input (Part 1)";
      }
    }
  }

  update_scene() { // callback for Draw button
    const curve_fn = (t, i_0, i_1) => this.spline.get_position(t, i_0, i_1);
    this.curve = new Curve_Shape(curve_fn, this.sample_cnt, this.spline.size);
  }

  load_spline() {
    document.getElementById("output").value = "load_spline";
    let text = document.getElementById("input").value;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const words = lines[i].split(' ');
      const x = parseFloat(words[0]);
      const y = parseFloat(words[1]);
      const z = parseFloat(words[2]);
      const tx = parseFloat(words[3]);
      const ty = parseFloat(words[4]);
      const tz = parseFloat(words[5]);
      this.spline.add_point(x,y,z,tx,ty,tz);
    }
  }

  export_spline() {
    let result = "";
    for (let i = 0; i < this.spline.size; i++) {
      let c = this.spline.points[i];
      let t = this.spline.tangents[i];

      let c_x = c[0];
      let c_y = c[1];
      let c_z = c[2];

      let t_x = t[0];
      let t_y = t[1];
      let t_z = t[2];

      result = result.concat("\n", c_x, " ", c_y, " ", c_z, " ", t_x, " ", t_y, " ", t_z);
    }
    document.getElementById("output").value = result;
  }
}