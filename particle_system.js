import {defs, tiny} from "./examples/common.js";
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
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
        this.ground_y = 0;
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
        if (this.position[1] <= this.ground_y) {
            return true;
        }
        else
            return false;
    }
    set_ground_y(y) {
        this.ground_y = y;
    }
}

export
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
}

export
class Mass_Spring_Damper {
    constructor() {
        this.particles = [];
        this.springs = [];
        this.g_acc = vec3(0,-9.81,0);
        this.ground_y = 0;
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
}

export
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