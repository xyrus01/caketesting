import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

let object;
let controls;
let objRender = 'eye';

const loader = new GLTFLoader();

loader.load(
    'cake/${objToRender}/birthday_cake.gltf',
    function(gltf){
        object = gltf.scene;
        scene.add(object);
    },
    function(xhr){
        console.log((xhr.loaded/xhr.total * 100) + '% loaded');
    },
    function(error){
        console.error(error);
    }
)

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innedWidth, window.innerHeight);

document.getElementById("box1").appendChild(renderer.domElement);

camera.position.z = objToRender === "dino" ? 25 : 500;

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, objToRender === "dino" ? 5 : 1);
scene.add(ambientLight);
