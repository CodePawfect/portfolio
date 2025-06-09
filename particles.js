/**
 * 3D Particle Animation System
 * Creates a floating particle field with smooth movement and wave-like animations
 */

class ParticleSystem {
    constructor() {
        // Configuration constants - easy to adjust for different effects
        this.config = {
            particleCount: 2000,
            particleColor: 0x4a6cf7,     // Blue color matching site theme
            particleSize: 0.03,
            particleOpacity: 0.7,
            movementSpeed: 0.02,         // How fast particles drift
            waveIntensity: 0.01,         // How much particles sway
            rotationSpeed: {
                x: 0.0005,               // Slow rotation around X axis
                y: 0.001                 // Slightly faster rotation around Y axis
            },
            boundaries: {
                sphere: 15,              // Maximum distance from center
                resetRadius: { min: 2, max: 10 }, // Where to respawn particles
                bounce: 12               // Axis boundary for bouncing
            }
        };

        // Initialize the 3D scene components
        this.initializeScene();
        this.createParticles();
        this.setupEventListeners();
        this.startAnimation();
    }

    /**
     * Sets up the basic 3D scene with camera, renderer, and lighting
     */
    initializeScene() {
        // Create the 3D world space where particles will exist
        this.scene = new THREE.Scene();
        
        // Camera settings: 75° field of view, responsive aspect ratio, near/far clipping
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1,  // Minimum render distance
            1000  // Maximum render distance
        );
        
        // WebGL renderer for smooth 3D graphics
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // Sharp on high-DPI displays
        this.renderer.setClearColor(0x121212, 1); // Dark background
        this.renderer.setAnimationLoop(() => this.animate());

        // Add renderer to the designated container in the DOM
        const particleContainer = document.querySelector('.particle-container');
        particleContainer.appendChild(this.renderer.domElement);

        // Position camera to get a good view of the particle field
        this.camera.position.z = 15;
    }

    /**
     * Creates the particle system with positions and movement data
     */
    createParticles() {
        // Geometry holds the 3D positions of all particles
        this.particleGeometry = new THREE.BufferGeometry();
        
        // Material defines how particles look (color, size, transparency)
        this.particleMaterial = new THREE.PointsMaterial({
            color: this.config.particleColor,
            size: this.config.particleSize,
            transparent: true,
            opacity: this.config.particleOpacity,
            blending: THREE.AdditiveBlending,  // Creates glow effect
            sizeAttenuation: true              // Closer particles appear larger
        });

        // Arrays to store particle data
        // Each particle needs 3 values: x, y, z coordinates
        this.positions = new Float32Array(this.config.particleCount * 3);
        this.velocities = new Float32Array(this.config.particleCount * 3);

        // Generate initial positions and velocities for each particle
        this.initializeParticleData();

        // Connect position data to geometry and create particle system
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);
    }

    /**
     * Sets up initial positions and velocities for all particles
     * Distributes particles in a spherical pattern around the origin
     */
    initializeParticleData() {
        for (let i = 0; i < this.config.particleCount * 3; i += 3) {
            // Generate spherical coordinates for even distribution
            const sphericalCoords = this.generateSphericalPosition();
            
            // Convert spherical to 3D cartesian coordinates
            const position = this.sphericalToCartesian(sphericalCoords);
            
            // Set particle position
            this.positions[i] = position.x;
            this.positions[i + 1] = position.y;
            this.positions[i + 2] = position.z;

            // Give each particle a random drift velocity
            this.velocities[i] = this.randomVelocity();
            this.velocities[i + 1] = this.randomVelocity();
            this.velocities[i + 2] = this.randomVelocity();
        }
    }

    /**
     * Generates random spherical coordinates for particle placement
     * @returns {Object} Spherical coordinates (radius, theta, phi)
     */
    generateSphericalPosition() {
        return {
            radius: Math.random() * 10 + 5,      // Distance from center: 5-15 units
            theta: Math.random() * Math.PI * 2,  // Horizontal angle: 0-360°
            phi: Math.random() * Math.PI         // Vertical angle: 0-180°
        };
    }

    /**
     * Converts spherical coordinates to 3D cartesian coordinates
     * Math explanation: This transforms (radius, theta, phi) to (x, y, z)
     * - x = radius × sin(phi) × cos(theta)
     * - y = radius × sin(phi) × sin(theta)  
     * - z = radius × cos(phi)
     */
    sphericalToCartesian({ radius, theta, phi }) {
        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi)
        };
    }

    /**
     * Generates a small random velocity for particle drift
     * @returns {number} Random velocity between -0.01 and +0.01
     */
    randomVelocity() {
        return (Math.random() - 0.5) * this.config.movementSpeed;
    }

    /**
     * Sets up responsive behavior for window resize events
     */
    setupEventListeners() {
        const handleResize = () => {
            // Update camera aspect ratio to match new window dimensions
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            // Resize renderer to fill new window size
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
    }

    /**
     * Starts the animation loop
     */
    startAnimation() {
        this.animate();
    }

    /**
     * Main animation function - called every frame
     * Updates particle positions and renders the scene
     */
    animate() {
        const time = Date.now() * 0.0005; // Time for wave calculations
        
        // Update each particle's position
        for (let i = 0; i < this.config.particleCount * 3; i += 3) {
            this.updateParticlePosition(i, time);
            this.applyBoundaryConstraints(i);
        }

        // Tell Three.js that positions have changed
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // Add gentle rotation to entire particle system
        this.particles.rotation.y += this.config.rotationSpeed.y;
        this.particles.rotation.x += this.config.rotationSpeed.x;

        // Render the frame
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Updates a single particle's position with drift and wave motion
     * @param {number} index - Array index for this particle (x coordinate)
     * @param {number} time - Current animation time
     */
    updateParticlePosition(index, time) {
        const particleId = index / 3; // Unique ID for this particle
        
        // Apply constant drift movement
        this.positions[index] += this.velocities[index];         // x
        this.positions[index + 1] += this.velocities[index + 1]; // y
        this.positions[index + 2] += this.velocities[index + 2]; // z

        // Add wave-like motion for organic feel
        // Math: sin/cos creates smooth oscillating movement
        this.positions[index] += Math.sin(time + particleId * 0.1) * this.config.waveIntensity;
        this.positions[index + 1] += Math.cos(time + particleId * 0.1) * this.config.waveIntensity;
    }

    /**
     * Keeps particles within visible boundaries using two methods:
     * 1. Spherical boundary - respawn if too far from center
     * 2. Axis boundaries - bounce off walls
     */
    applyBoundaryConstraints(index) {
        // Check distance from center point (0,0,0)
        const distanceFromCenter = Math.sqrt(
            this.positions[index] * this.positions[index] + 
            this.positions[index + 1] * this.positions[index + 1] + 
            this.positions[index + 2] * this.positions[index + 2]
        );
        
        // If particle drifted too far, respawn it closer to center
        if (distanceFromCenter > this.config.boundaries.sphere) {
            this.respawnParticle(index);
        }
        
        // Bounce off individual axis boundaries (creates invisible walls)
        this.bounceOffWalls(index);
    }

    /**
     * Respawns a particle at a new random position closer to center
     * @param {number} index - Array index for particle to respawn
     */
    respawnParticle(index) {
        const { min, max } = this.config.boundaries.resetRadius;
        const sphericalCoords = {
            radius: Math.random() * (max - min) + min,
            theta: Math.random() * Math.PI * 2,
            phi: Math.random() * Math.PI
        };
        
        const position = this.sphericalToCartesian(sphericalCoords);
        
        // Reset position
        this.positions[index] = position.x;
        this.positions[index + 1] = position.y;
        this.positions[index + 2] = position.z;

        // Reset velocity
        this.velocities[index] = this.randomVelocity();
        this.velocities[index + 1] = this.randomVelocity();
        this.velocities[index + 2] = this.randomVelocity();
    }

    /**
     * Makes particles bounce off invisible walls on each axis
     * @param {number} index - Array index for particle to check
     */
    bounceOffWalls(index) {
        const bounceLimit = this.config.boundaries.bounce;
        
        // Reverse velocity direction if hitting wall (creates bounce effect)
        if (Math.abs(this.positions[index]) > bounceLimit) {
            this.velocities[index] *= -1; // Reverse X direction
        }
        if (Math.abs(this.positions[index + 1]) > bounceLimit) {
            this.velocities[index + 1] *= -1; // Reverse Y direction
        }
        if (Math.abs(this.positions[index + 2]) > bounceLimit) {
            this.velocities[index + 2] *= -1; // Reverse Z direction
        }
    }
}

// Initialize the particle system when the script loads
const particleSystem = new ParticleSystem();