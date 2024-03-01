import {defs} from "./examples/common";

export class Part_one_hermite
{
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
    {
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