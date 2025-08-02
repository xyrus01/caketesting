// ==========================================
// 🎛️ CAMERA & SCENE SETTINGS - ADJUST HERE
// ==========================================
const CAMERA_SETTINGS = {
    // Initial camera rotation (in radians)  
    initialRotationY: Math.PI * 0.15,  // Horizontal rotation (0 = front, PI/2 = side, PI = back)
    initialRotationX: Math.PI * 0.3,   // Vertical rotation (0 = level, PI/4 = looking down)
    
    // Camera distance multiplier
    zoomLevel: 1,  // Smaller = closer, Larger = further away
    
    // Camera height offset
    heightOffset: 0,  // Positive = higher, Negative = lower
    
    // Rotation limits (in degrees for easier adjustment)
    maxUpRotation: 55,    // Maximum degrees to look up
    maxDownRotation: 45,  // Maximum degrees to look down
    
    // Smoothness controls
    rotationSpeed: 0.01,  // Mouse sensitivity (lower = slower/smoother)
    dampening: 0.1         // Animation smoothness (lower = smoother, higher = more responsive)
};

const SCENE_SETTINGS = {
    backgroundColor: 0x222222  // 0x000000 = black, 0xffffff = white, 0x222222 = dark gray
};

// Mobile detection and optimization
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
    CAMERA_SETTINGS.rotationSpeed *= 1.2; // Slightly more sensitive on mobile
}
// ==========================================

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Get the container div
const container = document.getElementById('box1');
const containerWidth = container.offsetWidth;
const containerHeight = container.offsetHeight;

// Set renderer size to match container
renderer.setSize(containerWidth, containerHeight);
renderer.setClearColor(SCENE_SETTINGS.backgroundColor); // Use background color from settings
container.appendChild(renderer.domElement);

// Update camera aspect ratio
camera.aspect = containerWidth / containerHeight;
camera.updateProjectionMatrix();

// Add lighting (essential for seeing your model properly)
const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Additional point light for better illumination
const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

// Add a second point light from another angle
const pointLight2 = new THREE.PointLight(0xffffff, 0.3, 50);
pointLight2.position.set(-5, 5, 5);
scene.add(pointLight2);

// GLTF Loader
const loader = new THREE.GLTFLoader();

console.log('Starting to load model...');

loader.load(
    'cake/birthday_cake.gltf', // Path to your model
    function (gltf) {
        // Success callback
        console.log('GLTF loaded successfully!', gltf);
        
        const model = gltf.scene;
        
        // Scale the model (adjust if needed)
        model.scale.set(1, 1, 1);
        
        // Position the model
        model.position.set(0, 0, 0);
        
        // Add the model to the scene
        scene.add(model);
        
        // Center the camera on the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model center:', center);
        console.log('Model size:', size);
        
        // Position camera using rotation instead of position offset
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraDistance *= CAMERA_SETTINGS.zoomLevel; // Use zoom from settings
        
        // Calculate camera position using spherical coordinates (rotation-based)
        const spherical = new THREE.Spherical(
            cameraDistance,                           // radius (distance)
            Math.PI / 2 - CAMERA_SETTINGS.initialRotationX,  // phi (vertical angle)
            CAMERA_SETTINGS.initialRotationY          // theta (horizontal angle)
        );
        
        // Set camera position from spherical coordinates
        camera.position.setFromSpherical(spherical);
        camera.position.add(center); // Move to cake center
        camera.position.y += CAMERA_SETTINGS.heightOffset; // Apply height offset
        
        // Always look at the cake center
        camera.lookAt(center);
        
        console.log('Model loaded and positioned successfully!');
        
        // Store model reference for controls
        window.cakeModel = model;
        window.cakeCenter = center;
    },
    function (progress) {
        // Progress callback
        const percentage = (progress.loaded / progress.total * 100);
        console.log('Loading progress:', percentage.toFixed(2) + '%');
    },
    function (error) {
        // Error callback
        console.error('Error loading model:', error);
        
        // Add a fallback cube so you know the 3D scene is working
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        
        console.log('Added fallback cube - if you see a pink cube, the 3D engine is working but the model failed to load');
    }
);

// Mouse controls for rotating the view - SMOOTHER VERSION
let mouseX = 0, mouseY = 0;
let isMouseDown = false;
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };

// Convert degrees to radians for limits
const maxUpRadians = CAMERA_SETTINGS.maxUpRotation * (Math.PI / 180);
const maxDownRadians = CAMERA_SETTINGS.maxDownRotation * (Math.PI / 180);

container.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    container.style.cursor = 'grabbing';
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    
    const deltaX = e.clientX - mouseX;
    const deltaY = e.clientY - mouseY;
    
    // Update target rotation instead of directly moving camera
    targetRotation.y -= deltaX * CAMERA_SETTINGS.rotationSpeed;
    targetRotation.x -= deltaY * CAMERA_SETTINGS.rotationSpeed; // Fixed: reversed for natural movement
    
    // Apply rotation limits: up = positive, down = negative (fixed the logic)
    targetRotation.x = Math.max(-maxDownRadians, Math.min(maxUpRadians, targetRotation.x));
    
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Set cursor style
container.style.cursor = 'grab';

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

// Animation loop with smooth camera movement
function animate() {
    requestAnimationFrame(animate);
    
    // Smooth camera rotation interpolation using settings
    currentRotation.x += (targetRotation.x - currentRotation.x) * CAMERA_SETTINGS.dampening;
    currentRotation.y += (targetRotation.y - currentRotation.y) * CAMERA_SETTINGS.dampening;
    
    // Apply smooth rotation to camera
    if (window.cakeCenter) {
        const center = window.cakeCenter;
        const distance = camera.position.distanceTo(center);
        
        // Calculate smooth camera position with proper phi limits to prevent inversion
        const phi = Math.PI / 2 - CAMERA_SETTINGS.initialRotationX + currentRotation.x;
        const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi)); // Prevent camera flip
        
        const spherical = new THREE.Spherical(
            distance,
            clampedPhi, // Use clamped phi to prevent inversion
            CAMERA_SETTINGS.initialRotationY + currentRotation.y
        );
        
        camera.position.setFromSpherical(spherical);
        camera.position.add(center);
        camera.position.y += CAMERA_SETTINGS.heightOffset;
        camera.lookAt(center);
    }
    
    // Optional: Add subtle rotation animation to the model
    if (window.cakeModel) {
        // Uncomment the line below for auto-rotation
        // window.cakeModel.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// Start the animation loop
animate();

console.log('3D scene initialized successfully!');
