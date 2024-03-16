import {defs, tiny} from '../examples/common.js';
import {Shape_From_File} from "../examples/obj-file-demo.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Rigidbody{
    static searchableObjects = [];

    constructor(name, model, material,
                position, rotation, scale,
                parent, isStatic = true) {
        //Properties
        this.name = name;
        this.velocity = vec3(0, 0, 0);
        this.position = position;
        this.scale = scale;
        this.eulerAngles = rotation;
        this.mass = 1;
        this.isStatic = isStatic;

        //Rendering properties
        this.parent = parent;
        this.transform = Mat4.identity();
        this.generateTransform();
        this.model = model;
        this.material = material;

        this.colliders = [];

        Rigidbody.searchableObjects.push(this);
    }

    update(context, program_state, deltaTime){
        //Draw object
        this.position = this.position.plus(this.velocity.times(deltaTime))
        this.generateTransform();
        this.model.draw(context, program_state, this.transform);
    }

    //Internal use
    generateTransform(){
        let rotation = Mat4.rotation(this.eulerAngles[0], 1, 0, 0)
            .times(Mat4.rotation(this.eulerAngles[1], 0, 1, 0))
            .times(Mat4.rotation(this.eulerAngles[2], 0, 0, 1));
        this.transform = Mat4.translation(this.position[0], this.position[1], this.position[2])
            .times(rotation)
            .times(Mat4.scale(this.scale[0], this.scale[1], this.scale[2]))
            .times(this.parent);
    }
}

export class BoxCollider{
    constructor(parent, scale, position) {
        this.parent = parent;
        this.scale = scale; //vec3
        this.position = position; //vec3
    }
    checkCollision(point){
        if(!this.checkIfInBox(point)) return{
            detected: false,
            point: null,
            normal: null
        }

        let reverseBoxPosition = Mat4.scale(...this.scale)
            .times(Mat4.translation(...this.position))
            .times(Mat4.rotation(-this.parent.eulerAngles[2], 0, 0, 1))
            .times(Mat4.rotation(-this.parent.eulerAngles[1], 0, 1, 0))
            .times(Mat4.rotation(-this.parent.eulerAngles[0], 1, 0, 0))
            .times(Mat4.translation(-this.parent.position[0], -this.parent.position[1], -this.parent.position[2]));
        let boxPosition = Mat4.translation(this.parent.position[0], this.parent.position[1], this.parent.position[2])
            .times(Mat4.rotation(this.parent.eulerAngles[0], 1, 0, 0))
            .times(Mat4.rotation(this.parent.eulerAngles[1], 0, 1, 0))
            .times(Mat4.rotation(this.parent.eulerAngles[2], 0, 0, 1))
            .times(Mat4.translation(...this.position))
            .times(Mat4.scale(...this.scale))



        let avgPoint = point;
        let localPointPos = reverseBoxPosition.times(point.to4(true)).to3();
        let distanceVector = point.minus(this.position);
        let boxHalfLengths = this.scale;

        let largestAxis = Math.abs(distanceVector[1])/boxHalfLengths[1] > Math.abs(distanceVector[0])/boxHalfLengths[0] ? 1 : 0;
        largestAxis = Math.abs(distanceVector[2])/boxHalfLengths[2] > Math.abs(distanceVector[largestAxis])/boxHalfLengths[largestAxis] ? 2 : largestAxis;

        let posNeg = distanceVector[largestAxis] < 0 ? -1 : 1;

        if(largestAxis === 0){
            return {
                detected: true,
                pendepth: math.abs(localPointPos[0] - posNeg)/this.scale[0],
                normal: boxPosition.times(vec3(posNeg, 0, 0).to4(true)).to3().minus(this.parent.position).normalized(),
                vel: this.parent.velocity
            };
        }else if(largestAxis === 1){
            return {
                detected: true,
                pendepth: math.abs(localPointPos[1] - posNeg)/this.scale[1],
                normal: boxPosition.times(vec3(0, posNeg, 0).to4(true)).to3().minus(this.parent.position).normalized(),
                vel: this.parent.velocity
            };
        }else if(largestAxis === 2){
            return {
                detected: true,
                pendepth: math.abs(localPointPos[2] - posNeg)/this.scale[2],
                normal: boxPosition.times(vec3(0, 0, posNeg).to4(true)).to3().minus(this.parent.position).normalized(),
                vel: this.parent.velocity
            };
        }
    }

    getWorldPos(){
        return this.parent.transform.times(this.position.to4(true)).to3();
    }

    //INTERNAL USE; point is a vec3
    checkIfInBox(point) {
        let inv = Mat4.inverse(this.parent.transform);
        let newPoint = inv.times(point.to4(true)).to3();
        return (newPoint[0] <= 1 && newPoint[0] >= -1 && newPoint[1] <= 1 && newPoint[1] >= -1 && newPoint[2] <= 1 && newPoint[2] >= -1);
    }
}