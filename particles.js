const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x121212, 1);
renderer.setAnimationLoop( animate );

// Append to particle container instead of body
const particleContainer = document.querySelector('.particle-container');
particleContainer.appendChild( renderer.domElement );

// Create particles with a more modern look
const particleCount = 1500;
const particleGeometry = new THREE.BufferGeometry();

// Create a custom shader material for better-looking particles
const particleMaterial = new THREE.PointsMaterial({
    color: 0x4a6cf7,  // Match our primary color
    size: 0.04,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,  // Add glow effect
    sizeAttenuation: true  // Particles closer to camera appear larger
});

// Create particle positions
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = Math.random() * 10 + 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    velocities[i] = (Math.random() - 0.5) * 0.02;
    velocities[i + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i + 2] = (Math.random() - 0.5) * 0.02;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

camera.position.z = 15;

// Handle window resize
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);

// Add mouse interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Improved animation function
function animate() {
    const positions = particles.geometry.attributes.position.array;
    const time = Date.now() * 0.0005;

    // Smooth camera movement following mouse
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    camera.rotation.x += 0.05 * (targetY - camera.rotation.x);
    camera.rotation.y += 0.05 * (targetX - camera.rotation.y);

    for (let i = 0; i < particleCount * 3; i += 3) {
        // Add some wave-like motion to particles
        const ix = i / 3;
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Add subtle sine wave motion
        positions[i] += Math.sin(time + ix * 0.1) * 0.01;
        positions[i + 1] += Math.cos(time + ix * 0.1) * 0.01;

        // Boundary check with smoother transition
        if (Math.abs(positions[i]) > 20) {
            velocities[i] *= -0.95;
        }
        if (Math.abs(positions[i + 1]) > 20) {
            velocities[i + 1] *= -0.95;
        }
        if (Math.abs(positions[i + 2]) > 20) {
            velocities[i + 2] *= -0.95;
        }
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;

    renderer.render(scene, camera);
}
