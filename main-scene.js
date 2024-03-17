import { FlowerDanceScene } from "./flower_dance_scene.js";
import { Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game } from "./examples/axes-viewer.js";
import { defs } from './examples/common.js';
import { Demonstration } from "./examples/demonstration.js";
import { Parametric_Surfaces } from "./examples/parametric-surfaces.js";
import { Transforms_Sandbox, Transforms_Sandbox_Base } from "./examples/transforms-sandbox.js";
import { Mushroom_scene } from "./mushroom_scene.js";
import { Rope_bridge } from "./rope_bridge.js";
import {Liquid_Scene} from "./liquid_scene.js";
const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;

Object.assign (defs,
    {Minimal_Webgl_Demo},
    {Axes_Viewer, Axes_Viewer_Test_Scene, Matrix_Game},
    {Demonstration},
    {Parametric_Surfaces},
    {Transforms_Sandbox_Base, Transforms_Sandbox},
    {FlowerDanceScene: FlowerDanceScene},
    {Mushroom_scene}
);

// ******************** SELECT THE DEMO TO DISPLAY:

let curScene = 0
let scenes = [Rope_bridge, Mushroom_scene, FlowerDanceScene, Liquid_Scene];
let i_scenes = scenes.map (scene => new scene ());
let scene_ids = ["#Bridge", "#Mushroom", "#Flower", "#Water"]

function select_scene(i, element_to_replace) {
    element_to_replace.innerHTML = "";
    i_scenes[i].render_layout (element_to_replace);
    i_scenes[i].running = false
    document.querySelector (scene_ids[i]).style.display = "none"
}

function show_scene(i){
    i_scenes[curScene].running = false
    document.querySelector (scene_ids[curScene]).style.display = "none"
    curScene = i
    i_scenes[curScene].running = true
    document.querySelector (scene_ids[curScene]).style.display = "block"
}

document.getElementById("p1").addEventListener("click", () => { show_scene(0) });
document.getElementById("p2").addEventListener("click", () => { show_scene(1) });
document.getElementById("p3").addEventListener("click", () => { show_scene(2) });
document.getElementById("p4").addEventListener("click", () => { show_scene(3) });

for(let i = 0; i < scene_ids.length; i++){
    select_scene(i, document.querySelector (scene_ids[i] + " > .document-builder"))
}

show_scene(0)

export { scenes, defs, select_scene };

