import {tiny, defs} from '../examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

const EdgeVertexIndices = [
    [0, 1],
    [1, 3],
    [3, 2],
    [2, 0],
    [4, 5],
    [5, 7],
    [7, 6],
    [6, 4],
    [0, 4],
    [1, 5],
    [3, 7],
    [2, 6],
];

// For each MC case, a list of triangles, specified as triples of edge indices, terminated by -1
const TriangleTable = [
    [ -1 ],
    [ 3, 8, 0, -1 ],
    [ 1, 0, 9, -1 ],
    [ 9, 1, 8, 8, 1, 3, -1 ],
    [ 3, 2, 11, -1 ],
    [ 2, 11, 0, 0, 11, 8, -1 ],
    [ 1, 0, 9, 3, 2, 11, -1 ],
    [ 11, 1, 2, 11, 9, 1, 11, 8, 9, -1 ],
    [ 10, 2, 1, -1 ],
    [ 2, 1, 10, 0, 3, 8, -1 ],
    [ 0, 9, 2, 2, 9, 10, -1 ],
    [ 8, 2, 3, 8, 10, 2, 8, 9, 10, -1 ],
    [ 1, 10, 3, 3, 10, 11, -1 ],
    [ 10, 0, 1, 10, 8, 0, 10, 11, 8, -1 ],
    [ 9, 3, 0, 9, 11, 3, 9, 10, 11, -1 ],
    [ 9, 10, 8, 8, 10, 11, -1 ],
    [ 7, 4, 8, -1 ],
    [ 0, 3, 4, 4, 3, 7, -1 ],
    [ 0, 9, 1, 4, 8, 7, -1 ],
    [ 1, 4, 9, 1, 7, 4, 1, 3, 7, -1 ],
    [ 11, 3, 2, 8, 7, 4, -1 ],
    [ 4, 11, 7, 4, 2, 11, 4, 0, 2, -1 ],
    [ 3, 2, 11, 0, 9, 1, 4, 8, 7, -1 ],
    [ 9, 1, 4, 4, 1, 7, 7, 1, 2, 7, 2, 11, -1 ],
    [ 7, 4, 8, 1, 10, 2, -1 ],
    [ 7, 4, 3, 3, 4, 0, 10, 2, 1, -1 ],
    [ 10, 2, 9, 9, 2, 0, 7, 4, 8, -1 ],
    [ 7, 4, 9, 7, 9, 2, 9, 10, 2, 3, 7, 2, -1 ],
    [ 1, 10, 3, 3, 10, 11, 4, 8, 7, -1 ],
    [ 4, 0, 7, 0, 1, 10, 7, 0, 10, 7, 10, 11, -1 ],
    [ 7, 4, 8, 9, 3, 0, 9, 11, 3, 9, 10, 11, -1 ],
    [ 7, 4, 11, 4, 9, 11, 9, 10, 11, -1 ],
    [ 5, 9, 4, -1 ],
    [ 8, 0, 3, 9, 4, 5, -1 ],
    [ 1, 0, 5, 5, 0, 4, -1 ],
    [ 5, 8, 4, 5, 3, 8, 5, 1, 3, -1 ],
    [ 3, 2, 11, 5, 9, 4, -1 ],
    [ 2, 11, 0, 0, 11, 8, 5, 9, 4, -1 ],
    [ 4, 5, 0, 0, 5, 1, 11, 3, 2, -1 ],
    [ 11, 8, 2, 8, 4, 5, 2, 8, 5, 2, 5, 1, -1 ],
    [ 5, 9, 4, 1, 10, 2, -1 ],
    [ 0, 3, 8, 1, 10, 2, 5, 9, 4, -1 ],
    [ 2, 5, 10, 2, 4, 5, 2, 0, 4, -1 ],
    [ 4, 5, 8, 8, 5, 3, 3, 5, 10, 3, 10, 2, -1 ],
    [ 11, 3, 10, 10, 3, 1, 4, 5, 9, -1 ],
    [ 4, 5, 9, 10, 0, 1, 10, 8, 0, 10, 11, 8, -1 ],
    [ 4, 5, 10, 4, 10, 3, 10, 11, 3, 0, 4, 3, -1 ],
    [ 4, 5, 8, 5, 10, 8, 10, 11, 8, -1 ],
    [ 5, 9, 7, 7, 9, 8, -1 ],
    [ 3, 9, 0, 3, 5, 9, 3, 7, 5, -1 ],
    [ 7, 0, 8, 7, 1, 0, 7, 5, 1, -1 ],
    [ 3, 7, 1, 1, 7, 5, -1 ],
    [ 5, 9, 7, 7, 9, 8, 2, 11, 3, -1 ],
    [ 5, 9, 0, 5, 0, 11, 0, 2, 11, 7, 5, 11, -1 ],
    [ 2, 11, 3, 7, 0, 8, 7, 1, 0, 7, 5, 1, -1 ],
    [ 2, 11, 1, 11, 7, 1, 7, 5, 1, -1 ],
    [ 8, 7, 9, 9, 7, 5, 2, 1, 10, -1 ],
    [ 10, 2, 1, 3, 9, 0, 3, 5, 9, 3, 7, 5, -1 ],
    [ 2, 0, 10, 0, 8, 7, 10, 0, 7, 10, 7, 5, -1 ],
    [ 10, 2, 5, 2, 3, 5, 3, 7, 5, -1 ],
    [ 5, 9, 8, 5, 8, 7, 1, 10, 3, 10, 11, 3, -1 ],
    [ 1, 10, 0, 0, 10, 11, 0, 11, 7, 0, 7, 5, 0, 5, 9, -1 ],
    [ 8, 7, 0, 0, 7, 5, 0, 5, 10, 0, 10, 11, 0, 11, 3, -1 ],
    [ 5, 11, 7, 10, 11, 5, -1 ],
    [ 11, 6, 7, -1 ],
    [ 3, 8, 0, 7, 11, 6, -1 ],
    [ 1, 0, 9, 7, 11, 6, -1 ],
    [ 9, 1, 8, 8, 1, 3, 6, 7, 11, -1 ],
    [ 6, 7, 2, 2, 7, 3, -1 ],
    [ 0, 7, 8, 0, 6, 7, 0, 2, 6, -1 ],
    [ 6, 7, 2, 2, 7, 3, 9, 1, 0, -1 ],
    [ 9, 1, 2, 9, 2, 7, 2, 6, 7, 8, 9, 7, -1 ],
    [ 10, 2, 1, 11, 6, 7, -1 ],
    [ 2, 1, 10, 3, 8, 0, 7, 11, 6, -1 ],
    [ 0, 9, 2, 2, 9, 10, 7, 11, 6, -1 ],
    [ 6, 7, 11, 8, 2, 3, 8, 10, 2, 8, 9, 10, -1 ],
    [ 7, 10, 6, 7, 1, 10, 7, 3, 1, -1 ],
    [ 1, 10, 0, 0, 10, 8, 8, 10, 6, 8, 6, 7, -1 ],
    [ 9, 10, 0, 10, 6, 7, 0, 10, 7, 0, 7, 3, -1 ],
    [ 6, 7, 10, 7, 8, 10, 8, 9, 10, -1 ],
    [ 4, 8, 6, 6, 8, 11, -1 ],
    [ 6, 3, 11, 6, 0, 3, 6, 4, 0, -1 ],
    [ 11, 6, 8, 8, 6, 4, 1, 0, 9, -1 ],
    [ 6, 4, 11, 4, 9, 1, 11, 4, 1, 11, 1, 3, -1 ],
    [ 2, 8, 3, 2, 4, 8, 2, 6, 4, -1 ],
    [ 0, 2, 4, 4, 2, 6, -1 ],
    [ 9, 1, 0, 2, 8, 3, 2, 4, 8, 2, 6, 4, -1 ],
    [ 9, 1, 4, 1, 2, 4, 2, 6, 4, -1 ],
    [ 4, 8, 6, 6, 8, 11, 1, 10, 2, -1 ],
    [ 1, 10, 2, 6, 3, 11, 6, 0, 3, 6, 4, 0, -1 ],
    [ 0, 9, 10, 0, 10, 2, 4, 8, 6, 8, 11, 6, -1 ],
    [ 11, 6, 3, 3, 6, 4, 3, 4, 9, 3, 9, 10, 3, 10, 2, -1 ],
    [ 1, 10, 6, 1, 6, 8, 6, 4, 8, 3, 1, 8, -1 ],
    [ 1, 10, 0, 10, 6, 0, 6, 4, 0, -1 ],
    [ 0, 9, 3, 3, 9, 10, 3, 10, 6, 3, 6, 4, 3, 4, 8, -1 ],
    [ 4, 10, 6, 9, 10, 4, -1 ],
    [ 4, 5, 9, 6, 7, 11, -1 ],
    [ 7, 11, 6, 8, 0, 3, 9, 4, 5, -1 ],
    [ 1, 0, 5, 5, 0, 4, 11, 6, 7, -1 ],
    [ 11, 6, 7, 5, 8, 4, 5, 3, 8, 5, 1, 3, -1 ],
    [ 3, 2, 7, 7, 2, 6, 9, 4, 5, -1 ],
    [ 5, 9, 4, 0, 7, 8, 0, 6, 7, 0, 2, 6, -1 ],
    [ 1, 0, 4, 1, 4, 5, 3, 2, 7, 2, 6, 7, -1 ],
    [ 4, 5, 8, 8, 5, 1, 8, 1, 2, 8, 2, 6, 8, 6, 7, -1 ],
    [ 6, 7, 11, 5, 9, 4, 1, 10, 2, -1 ],
    [ 5, 9, 4, 7, 11, 6, 0, 3, 8, 2, 1, 10, -1 ],
    [ 7, 11, 6, 2, 5, 10, 2, 4, 5, 2, 0, 4, -1 ],
    [ 6, 7, 11, 3, 8, 4, 3, 4, 5, 3, 5, 2, 2, 5, 10, -1 ],
    [ 9, 4, 5, 7, 10, 6, 7, 1, 10, 7, 3, 1, -1 ],
    [ 5, 9, 4, 8, 0, 1, 8, 1, 10, 8, 10, 7, 7, 10, 6, -1 ],
    [ 6, 7, 10, 10, 7, 3, 10, 3, 0, 10, 0, 4, 10, 4, 5, -1 ],
    [ 4, 5, 8, 8, 5, 10, 8, 10, 6, 8, 6, 7, -1 ],
    [ 9, 6, 5, 9, 11, 6, 9, 8, 11, -1 ],
    [ 0, 3, 9, 9, 3, 5, 5, 3, 11, 5, 11, 6, -1 ],
    [ 1, 0, 8, 1, 8, 6, 8, 11, 6, 5, 1, 6, -1 ],
    [ 11, 6, 3, 6, 5, 3, 5, 1, 3, -1 ],
    [ 2, 6, 3, 6, 5, 9, 3, 6, 9, 3, 9, 8, -1 ],
    [ 5, 9, 6, 9, 0, 6, 0, 2, 6, -1 ],
    [ 3, 2, 8, 8, 2, 6, 8, 6, 5, 8, 5, 1, 8, 1, 0, -1 ],
    [ 1, 6, 5, 2, 6, 1, -1 ],
    [ 2, 1, 10, 9, 6, 5, 9, 11, 6, 9, 8, 11, -1 ],
    [ 2, 1, 10, 5, 9, 0, 5, 0, 3, 5, 3, 6, 6, 3, 11, -1 ],
    [ 10, 2, 5, 5, 2, 0, 5, 0, 8, 5, 8, 11, 5, 11, 6, -1 ],
    [ 10, 2, 5, 5, 2, 3, 5, 3, 11, 5, 11, 6, -1 ],
    [ 5, 9, 6, 6, 9, 8, 6, 8, 3, 6, 3, 1, 6, 1, 10, -1 ],
    [ 5, 9, 6, 6, 9, 0, 6, 0, 1, 6, 1, 10, -1 ],
    [ 8, 3, 0, 5, 10, 6, -1 ],
    [ 6, 5, 10, -1 ],
    [ 6, 10, 5, -1 ],
    [ 3, 8, 0, 5, 6, 10, -1 ],
    [ 9, 1, 0, 10, 5, 6, -1 ],
    [ 3, 8, 1, 1, 8, 9, 6, 10, 5, -1 ],
    [ 6, 10, 5, 2, 11, 3, -1 ],
    [ 8, 0, 11, 11, 0, 2, 5, 6, 10, -1 ],
    [ 10, 5, 6, 1, 0, 9, 3, 2, 11, -1 ],
    [ 5, 6, 10, 11, 1, 2, 11, 9, 1, 11, 8, 9, -1 ],
    [ 2, 1, 6, 6, 1, 5, -1 ],
    [ 5, 6, 1, 1, 6, 2, 8, 0, 3, -1 ],
    [ 6, 9, 5, 6, 0, 9, 6, 2, 0, -1 ],
    [ 8, 9, 3, 9, 5, 6, 3, 9, 6, 3, 6, 2, -1 ],
    [ 3, 6, 11, 3, 5, 6, 3, 1, 5, -1 ],
    [ 5, 6, 11, 5, 11, 0, 11, 8, 0, 1, 5, 0, -1 ],
    [ 0, 9, 3, 3, 9, 11, 11, 9, 5, 11, 5, 6, -1 ],
    [ 5, 6, 9, 6, 11, 9, 11, 8, 9, -1 ],
    [ 7, 4, 8, 5, 6, 10, -1 ],
    [ 0, 3, 4, 4, 3, 7, 10, 5, 6, -1 ],
    [ 4, 8, 7, 9, 1, 0, 10, 5, 6, -1 ],
    [ 6, 10, 5, 1, 4, 9, 1, 7, 4, 1, 3, 7, -1 ],
    [ 11, 3, 2, 7, 4, 8, 5, 6, 10, -1 ],
    [ 10, 5, 6, 4, 11, 7, 4, 2, 11, 4, 0, 2, -1 ],
    [ 7, 4, 8, 3, 2, 11, 9, 1, 0, 10, 5, 6, -1 ],
    [ 10, 5, 6, 7, 4, 9, 7, 9, 1, 7, 1, 11, 11, 1, 2, -1 ],
    [ 2, 1, 6, 6, 1, 5, 8, 7, 4, -1 ],
    [ 7, 4, 0, 7, 0, 3, 5, 6, 1, 6, 2, 1, -1 ],
    [ 8, 7, 4, 6, 9, 5, 6, 0, 9, 6, 2, 0, -1 ],
    [ 5, 6, 9, 9, 6, 2, 9, 2, 3, 9, 3, 7, 9, 7, 4, -1 ],
    [ 4, 8, 7, 3, 6, 11, 3, 5, 6, 3, 1, 5, -1 ],
    [ 7, 4, 11, 11, 4, 0, 11, 0, 1, 11, 1, 5, 11, 5, 6, -1 ],
    [ 4, 8, 7, 11, 3, 0, 11, 0, 9, 11, 9, 6, 6, 9, 5, -1 ],
    [ 5, 6, 9, 9, 6, 11, 9, 11, 7, 9, 7, 4, -1 ],
    [ 9, 4, 10, 10, 4, 6, -1 ],
    [ 6, 10, 4, 4, 10, 9, 3, 8, 0, -1 ],
    [ 0, 10, 1, 0, 6, 10, 0, 4, 6, -1 ],
    [ 3, 8, 4, 3, 4, 10, 4, 6, 10, 1, 3, 10, -1 ],
    [ 9, 4, 10, 10, 4, 6, 3, 2, 11, -1 ],
    [ 8, 0, 2, 8, 2, 11, 9, 4, 10, 4, 6, 10, -1 ],
    [ 11, 3, 2, 0, 10, 1, 0, 6, 10, 0, 4, 6, -1 ],
    [ 2, 11, 1, 1, 11, 8, 1, 8, 4, 1, 4, 6, 1, 6, 10, -1 ],
    [ 4, 1, 9, 4, 2, 1, 4, 6, 2, -1 ],
    [ 3, 8, 0, 4, 1, 9, 4, 2, 1, 4, 6, 2, -1 ],
    [ 4, 6, 0, 0, 6, 2, -1 ],
    [ 3, 8, 2, 8, 4, 2, 4, 6, 2, -1 ],
    [ 3, 1, 11, 1, 9, 4, 11, 1, 4, 11, 4, 6, -1 ],
    [ 9, 4, 1, 1, 4, 6, 1, 6, 11, 1, 11, 8, 1, 8, 0, -1 ],
    [ 11, 3, 6, 3, 0, 6, 0, 4, 6, -1 ],
    [ 8, 6, 11, 4, 6, 8, -1 ],
    [ 10, 7, 6, 10, 8, 7, 10, 9, 8, -1 ],
    [ 10, 9, 6, 9, 0, 3, 6, 9, 3, 6, 3, 7, -1 ],
    [ 8, 7, 0, 0, 7, 1, 1, 7, 6, 1, 6, 10, -1 ],
    [ 6, 10, 7, 10, 1, 7, 1, 3, 7, -1 ],
    [ 3, 2, 11, 10, 7, 6, 10, 8, 7, 10, 9, 8, -1 ],
    [ 6, 10, 7, 7, 10, 9, 7, 9, 0, 7, 0, 2, 7, 2, 11, -1 ],
    [ 11, 3, 2, 1, 0, 8, 1, 8, 7, 1, 7, 10, 10, 7, 6, -1 ],
    [ 6, 10, 7, 7, 10, 1, 7, 1, 2, 7, 2, 11, -1 ],
    [ 8, 7, 6, 8, 6, 1, 6, 2, 1, 9, 8, 1, -1 ],
    [ 0, 3, 9, 9, 3, 7, 9, 7, 6, 9, 6, 2, 9, 2, 1, -1 ],
    [ 8, 7, 0, 7, 6, 0, 6, 2, 0, -1 ],
    [ 7, 2, 3, 6, 2, 7, -1 ],
    [ 11, 3, 6, 6, 3, 1, 6, 1, 9, 6, 9, 8, 6, 8, 7, -1 ],
    [ 11, 7, 6, 1, 9, 0, -1 ],
    [ 11, 3, 6, 6, 3, 0, 6, 0, 8, 6, 8, 7, -1 ],
    [ 11, 7, 6, -1 ],
    [ 10, 5, 11, 11, 5, 7, -1 ],
    [ 10, 5, 11, 11, 5, 7, 0, 3, 8, -1 ],
    [ 7, 11, 5, 5, 11, 10, 0, 9, 1, -1 ],
    [ 3, 8, 9, 3, 9, 1, 7, 11, 5, 11, 10, 5, -1 ],
    [ 5, 2, 10, 5, 3, 2, 5, 7, 3, -1 ],
    [ 0, 2, 8, 2, 10, 5, 8, 2, 5, 8, 5, 7, -1 ],
    [ 0, 9, 1, 5, 2, 10, 5, 3, 2, 5, 7, 3, -1 ],
    [ 10, 5, 2, 2, 5, 7, 2, 7, 8, 2, 8, 9, 2, 9, 1, -1 ],
    [ 1, 11, 2, 1, 7, 11, 1, 5, 7, -1 ],
    [ 8, 0, 3, 1, 11, 2, 1, 7, 11, 1, 5, 7, -1 ],
    [ 0, 9, 5, 0, 5, 11, 5, 7, 11, 2, 0, 11, -1 ],
    [ 3, 8, 2, 2, 8, 9, 2, 9, 5, 2, 5, 7, 2, 7, 11, -1 ],
    [ 5, 7, 1, 1, 7, 3, -1 ],
    [ 8, 0, 7, 0, 1, 7, 1, 5, 7, -1 ],
    [ 0, 9, 3, 9, 5, 3, 5, 7, 3, -1 ],
    [ 9, 7, 8, 5, 7, 9, -1 ],
    [ 8, 5, 4, 8, 10, 5, 8, 11, 10, -1 ],
    [ 10, 5, 4, 10, 4, 3, 4, 0, 3, 11, 10, 3, -1 ],
    [ 1, 0, 9, 8, 5, 4, 8, 10, 5, 8, 11, 10, -1 ],
    [ 9, 1, 4, 4, 1, 3, 4, 3, 11, 4, 11, 10, 4, 10, 5, -1 ],
    [ 10, 5, 2, 2, 5, 3, 3, 5, 4, 3, 4, 8, -1 ],
    [ 10, 5, 2, 5, 4, 2, 4, 0, 2, -1 ],
    [ 9, 1, 0, 3, 2, 10, 3, 10, 5, 3, 5, 8, 8, 5, 4, -1 ],
    [ 10, 5, 2, 2, 5, 4, 2, 4, 9, 2, 9, 1, -1 ],
    [ 1, 5, 2, 5, 4, 8, 2, 5, 8, 2, 8, 11, -1 ],
    [ 2, 1, 11, 11, 1, 5, 11, 5, 4, 11, 4, 0, 11, 0, 3, -1 ],
    [ 4, 8, 5, 5, 8, 11, 5, 11, 2, 5, 2, 0, 5, 0, 9, -1 ],
    [ 5, 4, 9, 2, 3, 11, -1 ],
    [ 4, 8, 5, 8, 3, 5, 3, 1, 5, -1 ],
    [ 0, 5, 4, 1, 5, 0, -1 ],
    [ 0, 9, 3, 3, 9, 5, 3, 5, 4, 3, 4, 8, -1 ],
    [ 5, 4, 9, -1 ],
    [ 11, 4, 7, 11, 9, 4, 11, 10, 9, -1 ],
    [ 0, 3, 8, 11, 4, 7, 11, 9, 4, 11, 10, 9, -1 ],
    [ 0, 4, 1, 4, 7, 11, 1, 4, 11, 1, 11, 10, -1 ],
    [ 7, 11, 4, 4, 11, 10, 4, 10, 1, 4, 1, 3, 4, 3, 8, -1 ],
    [ 9, 4, 7, 9, 7, 2, 7, 3, 2, 10, 9, 2, -1 ],
    [ 8, 0, 7, 7, 0, 2, 7, 2, 10, 7, 10, 9, 7, 9, 4, -1 ],
    [ 1, 0, 10, 10, 0, 4, 10, 4, 7, 10, 7, 3, 10, 3, 2, -1 ],
    [ 7, 8, 4, 10, 1, 2, -1 ],
    [ 9, 4, 1, 1, 4, 2, 2, 4, 7, 2, 7, 11, -1 ],
    [ 8, 0, 3, 2, 1, 9, 2, 9, 4, 2, 4, 11, 11, 4, 7, -1 ],
    [ 7, 11, 4, 11, 2, 4, 2, 0, 4, -1 ],
    [ 3, 8, 2, 2, 8, 4, 2, 4, 7, 2, 7, 11, -1 ],
    [ 9, 4, 1, 4, 7, 1, 7, 3, 1, -1 ],
    [ 9, 4, 1, 1, 4, 7, 1, 7, 8, 1, 8, 0, -1 ],
    [ 3, 4, 7, 0, 4, 3, -1 ],
    [ 7, 8, 4, -1 ],
    [ 8, 11, 9, 9, 11, 10, -1 ],
    [ 0, 3, 9, 3, 11, 9, 11, 10, 9, -1 ],
    [ 1, 0, 10, 0, 8, 10, 8, 11, 10, -1 ],
    [ 10, 3, 11, 1, 3, 10, -1 ],
    [ 3, 2, 8, 2, 10, 8, 10, 9, 8, -1 ],
    [ 9, 2, 10, 0, 2, 9, -1 ],
    [ 1, 0, 10, 10, 0, 8, 10, 8, 3, 10, 3, 2, -1 ],
    [ 2, 10, 1, -1 ],
    [ 2, 1, 11, 1, 9, 11, 9, 8, 11, -1 ],
    [ 2, 1, 11, 11, 1, 9, 11, 9, 0, 11, 0, 3, -1 ],
    [ 11, 0, 8, 2, 0, 11, -1 ],
    [ 3, 11, 2, -1 ],
    [ 1, 8, 3, 9, 8, 1, -1 ],
    [ 1, 9, 0, -1 ],
    [ 8, 3, 0, -1 ],
    [ -1 ],
];

export class Simulation{
    constructor() {
        this.shape = new MarchingSquares()

        this.particles = [];

        this.g_acc = 9.8;
        this.ground_ks = 5000;
        this.ground_kd = 50;
        this.p_dt = 0.0006  //Physics delta time

        this.alpha = 0.1
        this.beta = 0.3
        this.min_distance = 0.1;
        this.fake_st = 0;

        this.rend_qual = .6;

        this.ground_pos = vec3(0, 0, 0);
        this.ground_norm = vec3(0, 1, 0);
    }

    create_particles(num_particles){
        for(let i = 0; i < num_particles; i++) this.particles.push(new Particle());
    }

    set_particle(index, mass, pos, vel){
        if(index >= this.particles.length) return;

        this.particles[index].mass = mass;
        this.particles[index].position = pos;
        this.particles[index].velocity = vel;
        this.particles[index].generateTransform();
    }

    set_all_velocities(vel){
        this.particles.forEach((particle) => {
            particle.velocity = vel;
        })
    }

    calculate_fluid_force(p1, p2){
        let dir = p2.position.minus(p1.position)
        let dist = dir.norm()
        if(dist > 1) return vec3(0,0,0)
        let scalar = p1.mass * p2.mass *
            (
                (this.alpha / ((dist + 0.01 + this.min_distance) ** 2))
                - (this.beta / ((dist + 0.01) ** 4))
            )
        return dir.times(scalar)
    }

    apply_ground_penalty(particle){
        const damping = (this.ground_kd * particle.velocity[1]) ** 2 * Math.sign(this.ground_kd * particle.velocity[1]);
        const force = -particle.position[1] * this.ground_ks - this.ground_kd * particle.velocity[1];

        particle.ext_force[1] += force
    }

    update(){
        let toDel = []
        let plen = this.particles.length;
        for(let i = 0; i < plen; i++) {
            let particle = this.particles[i]

            if(particle.lifetime < 0){
                toDel.push(i);
                continue;
            }

            particle.velocity = particle.velocity.times(0.9995)

            particle.ext_force[1] += -this.g_acc * particle.mass

            if(particle.position[1] <= 0) {
                this.apply_ground_penalty(particle);
            }

            if(math.random() > 0.9) {
                for(let j = i + 1; j < plen; j++){

                    let p2 = this.particles[j];
                    let f = this.calculate_fluid_force(particle, p2)
                    particle.ext_force = particle.ext_force.plus(f)
                    p2.ext_force = p2.ext_force.plus(f.times(-1))
                }
            }else{
                particle.ext_force[1] += this.fake_st * 9.8
            }

            particle.update(this.p_dt);
        }

        for(const i in toDel.reverse()){
            this.particles.splice(i, 1)
        }
    }

    draw(webgl_manager, uniforms, material) {
        let voxels = new Voxels(this.rend_qual)
        this.particles.forEach((particle) => {
            voxels.add(particle.position)
        })
        voxels.generate_midpoints()

        this.shape.update(webgl_manager, voxels)

        this.shape.draw(webgl_manager, uniforms, Mat4.identity(), material)

        // y = 0
    }
}

class Voxels{
    constructor(rend_qual) {
        this.data = new Map()
        this.midpoints = new Set()
        this.rend_mul = 1/rend_qual

        this.threshold = 1
    }

    add(pos){
        let radius = 1
        for(let i = -radius; i < radius; i++){
            for(let j = -radius; j < radius; j++){
                for(let k = -radius; k < radius; k++){
                    if((i ** 2 + j ** 2 + k **2) ** 0.5 > radius) continue;
                    let voxel_coord = pos.times(this.rend_mul)
                    voxel_coord = vec3(math.floor(voxel_coord[0]), math.floor(voxel_coord[1]), math.floor(voxel_coord[2]))
                    voxel_coord = voxel_coord.plus(vec3(i, j, k)).times(1/this.rend_mul)
                    let dist = voxel_coord.minus(pos).norm()
                    dist = 1/math.max(0, (dist/radius))

                    let string_coord = (math.floor(pos[0] * this.rend_mul) + i) + " " +
                        (math.floor(pos[1] * this.rend_mul) + j) + " " +
                        (math.floor(pos[2] * this.rend_mul) + k);

                    if(this.data.has(string_coord)){
                        this.data.set(string_coord, this.data.get(string_coord) + dist)
                    }else{
                        this.data.set(string_coord, dist)
                    }
                }
            }
        }
    }

    generate_midpoints(){
        this.data.forEach((val, point) => {
            let p = point.split(" ").map(Number)
            this.midpoints.add(
                (p[0] + 0.5) + " " +
                (p[1] + 0.5) + " " +
                (p[2] + 0.5)
            )
            this.midpoints.add(
                (p[0] - 0.5) + " " +
                (p[1] + 0.5) + " " +
                (p[2] + 0.5)
            )
            this.midpoints.add(
                (p[0] + 0.5) + " " +
                (p[1] + 0.5) + " " +
                (p[2] - 0.5)
            )
            this.midpoints.add(
                (p[0] - 0.5) + " " +
                (p[1] + 0.5) + " " +
                (p[2] - 0.5)
            )
            this.midpoints.add(
                (p[0] + 0.5) + " " +
                (p[1] - 0.5) + " " +
                (p[2] + 0.5)
            )
            this.midpoints.add(
                (p[0] - 0.5) + " " +
                (p[1] - 0.5) + " " +
                (p[2] + 0.5)
            )
            this.midpoints.add(
                (p[0] + 0.5) + " " +
                (p[1] - 0.5) + " " +
                (p[2] - 0.5)
            )
            this.midpoints.add(
                (p[0] - 0.5) + " " +
                (p[1] - 0.5) + " " +
                (p[2] - 0.5)
            )
        })
    }

    cube_meshes(encoded_mp){
        let p = vec3(...encoded_mp.split(" ").map(Number))
        let points = []
        let pIndex = 0

        let corners = [
            (p[0] - 0.5) + " " + (p[1] - 0.5) + " " + (p[2] - 0.5),
            (p[0] + 0.5) + " " + (p[1] - 0.5) + " " + (p[2] - 0.5),
            (p[0] - 0.5) + " " + (p[1] + 0.5) + " " + (p[2] - 0.5),
            (p[0] + 0.5) + " " + (p[1] + 0.5) + " " + (p[2] - 0.5),
            (p[0] - 0.5) + " " + (p[1] - 0.5) + " " + (p[2] + 0.5),
            (p[0] + 0.5) + " " + (p[1] - 0.5) + " " + (p[2] + 0.5),
            (p[0] - 0.5) + " " + (p[1] + 0.5) + " " + (p[2] + 0.5),
            (p[0] + 0.5) + " " + (p[1] + 0.5) + " " + (p[2] + 0.5)
        ]

        for(let i = 0; i < 8; i++) {
            if (this.data.has(corners[i])) {
                points.push([corners[i], this.data.get(corners[i])])
                if(this.data.get(corners[i]) >= this.threshold) pIndex += 1 << i
            }else{
                points.push([corners[i], 0])
            }
        }

        let output = []
        let normals = []
        let t_table = TriangleTable[pIndex];
        for(let i = 0; i < t_table.length; i++){
            if(t_table[i] === -1) break;
            output.push(this.interp_edge(points, [t_table[i]]))
        }
        for(let i = 0; i < output.length; i+=3){
            let n = (output[i].minus(output[i + 1])).cross(output[i].minus(output[i + 2])).normalized()
            normals.push(n, n, n)
        }

        return [output, normals]
    }

    interp_edge(corners, edge){
        let whichC = EdgeVertexIndices[edge];
        let p1 = vec3(...corners[whichC[0]][0].split(" ").map(Number)).times(1/this.rend_mul)
        let p2 = vec3(...corners[whichC[1]][0].split(" ").map(Number)).times(1/this.rend_mul)
        let p1val = corners[whichC[0]][1]
        let p2val = corners[whichC[1]][1]

        let interp = (this.threshold - p1val) / (p2val - p1val)

        return p1.plus(p2.minus(p1).times(interp))
    }
}

export class Particle{
    constructor() {
        this.mass = 1;
        this.position = vec3(0, 4, 0).randomized(1);
        this.velocity = vec3(0, 0, 0).randomized(0.5);
        this.acceleration = vec3(0, 0, 0)
        this.ext_force = vec3(0, 0, 0)

        this.lifetime = 10

        this.intp_func = verlet

        // Rendering Properties
        this.transform = Mat4.scale(0.2, 0.2, 0.2);
        this.generateTransform();
    }

    update(deltaTime){
        this.intp_func(this, deltaTime);
        this.generateTransform()
        this.lifetime -= deltaTime
    }

    generateTransform(){
        this.transform[0][3] = this.position[0]
        this.transform[1][3] = this.position[1]
        this.transform[2][3] = this.position[2]
    }
}

function verlet(particle, deltaTime) {
    let new_accel = particle.ext_force.times(1/particle.mass);
    particle.position = particle.position.plus(particle.velocity.times(deltaTime)).plus(particle.acceleration.times(deltaTime ** 2 / 2));
    particle.velocity = particle.velocity.plus(particle.acceleration.plus(new_accel).times(deltaTime/2));
    particle.acceleration = new_accel;

    this.generateTransform()
    particle.ext_force = vec3(0, 0, 0);
}

const array_size = 10000
class MarchingSquares extends Shape {
    constructor() {

        super("position", "normal",);
        this.arrays.position = new Array(array_size).fill(vec3(0,0,0))
        this.arrays.normal = new Array(array_size).fill(vec3(0,0,0))
        this.indices = Array.from(Array(array_size).keys())
    }

    update(webgl_manager, voxels){
        let s_normal = new Map()
        let s_normal_idx = new Map()

        let index = 0;
        voxels.midpoints.forEach((mp) => {
            let cm = voxels.cube_meshes(mp)
            let cmp = cm[0]
            let cmn = cm[1]
            for(let i = 0; i < cmp.length; i++){
                let pos_index = p_to_string(cmp[i])
                if(s_normal.has(pos_index)){
                    let cur_norm = s_normal.get(pos_index)
                    let cur_norm_idx = s_normal_idx.get(pos_index)
                    cur_norm_idx.push(index)
                    s_normal.set(pos_index, cur_norm.plus(cmn[i]))
                    s_normal_idx.set(pos_index, cur_norm_idx)
                }else{
                    s_normal.set(pos_index, cmn[i])
                    s_normal_idx.set(pos_index, [index])
                }
                this.arrays.position[index] = cmp[i]
                this.arrays.normal[index] = (cmn[i])
                this.indices[index] = index
                index++
            }
        })

        s_normal.forEach((val, key) => {
            let n_indices = s_normal_idx.get(key)
            n_indices.forEach((i) => {
                this.arrays.normal[i] = val.normalized()
            })
        })

        for(; index < array_size; index++){
            this.arrays.position[index] = vec3(0,0,0)
            this.arrays.normal[index] = vec3(0,0,0)
        }

        this.copy_onto_graphics_card(webgl_manager.context);
    }
}

function p_to_string(p){
    return p[0] + " " + p[1] + " " + p[2]
}

function string_to_p(s){
    return vec3(...s.split(" ").map(Number))
}