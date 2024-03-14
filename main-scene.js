import { Corgo_collision } from "./corgo_collision.js";
import { Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game } from "./examples/axes-viewer.js";
import { defs } from './examples/common.js';
import { Demonstration } from "./examples/demonstration.js";
import { Parametric_Surfaces } from "./examples/parametric-surfaces.js";
import { Transforms_Sandbox, Transforms_Sandbox_Base } from "./examples/transforms-sandbox.js";
import { Mushroom_scene } from "./mushroom_scene.js";
import { Rope_bridge } from "./rope_bridge.js";
const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;

Object.assign (defs,
    {Minimal_Webgl_Demo},
    {Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game},
    {Demonstration},
    {Parametric_Surfaces},
    {Transforms_Sandbox_Base, Transforms_Sandbox},
    {Corgo_collision},
    {Mushroom_scene}
);

// ******************** SELECT THE DEMO TO DISPLAY:

let scenes = {1: Rope_bridge, 2: Corgo_collision};
const scene_selector = (i) => scenes[i];

// const main_scene        = Rope_bridge; // default
const main_scene = Mushroom_scene;
const additional_scenes = [];

export { additional_scenes, defs, main_scene, scene_selector };

