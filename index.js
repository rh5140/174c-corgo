// ********************* THE ENTRY POINT OF YOUR JAVASCRIPT PROGRAM STARTS HERE *********************
// Indicate which element on the page you want the Canvas_Widget to replace with a 3D WebGL area:
export let element;
const element_to_replace = document.querySelector ("#main-section");
import {main_scene, scene_selector, additional_scenes} from './main-scene.js';
import {reached_goal} from "./rope_bridge.js"; // Very hacky
const root = new main_scene ();                                                     // This line creates your scene.
root.animated_children.push (...additional_scenes.map (scene => new scene ()));
root.render_layout (element_to_replace);

function select_scene(i) {
    element_to_replace.innerHTML = "";
    const scene = scene_selector(i);
    const root = new scene();                                                     // This line creates your scene.
    root.animated_children.push (...additional_scenes.map (scene => new scene ()));
    root.render_layout (element_to_replace);
}




document.getElementById("p1").addEventListener("click", () => { select_scene(1) });
document.getElementById("p2").addEventListener("click", () => { select_scene(2) });

element = document.getElementById("p2");
// let event = new Event('click');
// element.dispatchEvent(event);