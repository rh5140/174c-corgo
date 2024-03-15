import { Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game } from "./examples/axes-viewer.js";
import { defs } from './examples/common.js';
import { Demonstration } from "./examples/demonstration.js";
import { Parametric_Surfaces } from "./examples/parametric-surfaces.js";
import { Transforms_Sandbox, Transforms_Sandbox_Base } from "./examples/transforms-sandbox.js";
const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;
import { Corgo_collision } from "./corgo_collision.js";
import { Rope_bridge } from "./rope_bridge.js";
import {Part_one_hermite} from "./mushroom_scene.js";

Object.assign (defs,
    {Minimal_Webgl_Demo},
    {Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game},
    {Demonstration},
    {Parametric_Surfaces},
    {Transforms_Sandbox_Base, Transforms_Sandbox},
    {Corgo_collision}
);

// ******************** SELECT THE DEMO TO DISPLAY:

let scenes = {1: Rope_bridge};
const scene_selector = (i) => scenes[i];

const main_scene        = Corgo_collision; // default
const additional_scenes = [];

export { additional_scenes, defs, main_scene, scene_selector };

