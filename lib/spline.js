import {defs, tiny} from "../examples/common.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;



// Assignment 1 classes
export
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
}

export
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
}