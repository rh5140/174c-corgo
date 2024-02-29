import { Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game } from "./examples/axes-viewer.js";
import { Collision_Demo, Inertia_Demo } from "./examples/collisions-demo.js";
import { defs } from './examples/common.js';
import { Demonstration } from "./examples/demonstration.js";
import { Many_Lights_Demo } from "./examples/many-lights-demo.js";
import { Obj_File_Demo } from "./examples/obj-file-demo.js";
import { Parametric_Surfaces } from "./examples/parametric-surfaces.js";
import { Scene_To_Texture_Demo } from "./examples/scene-to-texture-demo.js";
import { Text_Demo } from "./examples/text-demo.js";
import { Transforms_Sandbox, Transforms_Sandbox_Base } from "./examples/transforms-sandbox.js";

// Now everything is loaded from tiny-graphics.js and its helper files. An object "tiny" wraps its contents, along
// with "defs" for wrapping some additional utilities included in common.js.

// ******************** Before selecting which demo we want to display, we have to load its code. If this page is hosted
// on the internet, the demo's class can be injected right here by the server.
//
// In this case, it's not, so you'll instead Load demos from files in your directory and copy them into "defs."

const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;

import { Corgo_collision } from "./corgo_collision.js";
import { Part_three_chain } from "./part_three_chain.js";
import { Part_two_spring } from "./part_two_spring.js";

Object.assign (defs,
    {Minimal_Webgl_Demo},
    {Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game},
    {Demonstration},
    {Inertia_Demo, Collision_Demo},
    {Many_Lights_Demo},
    {Obj_File_Demo},
    {Parametric_Surfaces},
    {Scene_To_Texture_Demo},
    {Text_Demo},
    {Transforms_Sandbox_Base, Transforms_Sandbox},
    {Corgo_collision},
    {Part_two_spring},
    {Part_three_chain}
);

// ******************** SELECT THE DEMO TO DISPLAY:

let scenes = {1: Corgo_collision, 2: Part_two_spring, 3: Part_three_chain};
const scene_selector = (i) => scenes[i];

const main_scene        = Corgo_collision; // default
const additional_scenes = [];

export { additional_scenes, defs, main_scene, scene_selector };

