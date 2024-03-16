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

const element_to_replace = document.querySelector ("#main-section");

let scenes = [Rope_bridge, Mushroom_scene];
let i_scenes = scenes.map (scene => new scene ());

// const main_scene        = Rope_bridge; // default
const main_scene = Rope_bridge;

function select_scene(i) {
    element_to_replace.innerHTML = "";
    const curScene = i_scenes[i];
    curScene.render_layout (element_to_replace);
    curScene.init()
}

document.getElementById("p1").addEventListener("click", () => { select_scene(0) });
document.getElementById("p2").addEventListener("click", () => { select_scene(1) });

select_scene(0)

console.log("Test")

export { scenes, defs, main_scene, select_scene };

