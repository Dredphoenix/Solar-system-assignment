   class SolarSystem {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.clock = new THREE.Clock();
                this.isAnimating = true;
                this.isDarkTheme = true;
                
                // Animation objects for smooth transitions using Three.js
                this.animations = {
                    cameraPosition: { x: 0, y: 30, z: 60 },
                    cameraRotation: { x: 0, y: 0, z: 0 },
                    uiElements: new Map()
                };
                
                // Planet data with realistic relative sizes and distances
                this.planetData = {
                    mercury: { name: 'Mercury', size: 0.38, distance: 8, speed: 4.74, color: 0x8c7853, info: 'Closest planet to the Sun, extreme temperatures' },
                    venus: { name: 'Venus', size: 0.95, distance: 12, speed: 3.50, color: 0xffa500, info: 'Hottest planet with thick atmosphere' },
                    earth: { name: 'Earth', size: 1.0, distance: 16, speed: 2.98, color: 0x6b93d6, info: 'Our home planet with water and life' },
                    mars: { name: 'Mars', size: 0.53, distance: 20, speed: 2.41, color: 0xcd5c5c, info: 'The Red Planet with polar ice caps' },
                    jupiter: { name: 'Jupiter', size: 2.8, distance: 28, speed: 1.31, color: 0xd2691e, info: 'Largest planet with Great Red Spot' },
                    saturn: { name: 'Saturn', size: 2.3, distance: 36, speed: 0.97, color: 0xfad5a5, info: 'Famous for its beautiful ring system' },
                    uranus: { name: 'Uranus', size: 1.6, distance: 44, speed: 0.68, color: 0x4fd0e7, info: 'Ice giant tilted on its side' },
                    neptune: { name: 'Neptune', size: 1.5, distance: 52, speed: 0.54, color: 0x4169e1, info: 'Windiest planet in the solar system' }
                };
                
                this.planets = {};
                this.orbitLines = {};
                this.stars = null;
                this.sun = null;
                this.sunGlow = null;
                
                // Mouse and camera controls
                this.mouse = { x: 0, y: 0, isDragging: false, previousX: 0, previousY: 0 };
                this.cameraControls = {
                    targetRotationX: 0,
                    targetRotationY: 0,
                    targetDistance: 60,
                    currentRotationX: 0,
                    currentRotationY: 0,
                    currentDistance: 60
                };
                
                this.init();
            }

            async init() {
                try {
                    this.createScene();
                    this.createCamera();
                    this.createRenderer();
                    this.createLights();
                    this.createSun();
                    this.createPlanets();
                    this.createOrbitLines();
                    this.createStars();
                    this.setupControls();
                    this.setupEventListeners();
                    this.animate();
                    
                    // Hide loading with Three.js animation
                    this.hideLoadingScreen();
                } catch (error) {
                    console.error('Error initializing solar system:', error);
                }
            }

            hideLoadingScreen() {
                // Use Three.js to animate loading screen fade out
                const loadingElement = document.getElementById('loading');
                let opacity = 1;
                const fadeAnimation = () => {
                    opacity -= 0.02;
                    loadingElement.style.opacity = opacity;
                    if (opacity > 0) {
                        requestAnimationFrame(fadeAnimation);
                    } else {
                        loadingElement.style.display = 'none';
                    }
                };
                
                setTimeout(() => {
                    fadeAnimation();
                }, 1000);
            }

            createScene() {
                this.scene = new THREE.Scene();
                this.scene.fog = new THREE.Fog(0x000000, 100, 200);
            }

            createCamera() {
                this.camera = new THREE.PerspectiveCamera(
                    60,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
                this.camera.position.set(0, 30, 60);
                this.camera.lookAt(0, 0, 0);
            }

            createRenderer() {
                this.renderer = new THREE.WebGLRenderer({ 
                    antialias: true,
                    alpha: true
                });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                this.renderer.setClearColor(0x000011, 1);
                
                document.getElementById('canvas-container').appendChild(this.renderer.domElement);
            }

            createLights() {
                // Ambient light for subtle illumination
                const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
                this.scene.add(ambientLight);

                // Point light from the sun
                const sunLight = new THREE.PointLight(0xffffff, 2, 200);
                sunLight.position.set(0, 0, 0);
                sunLight.castShadow = true;
                sunLight.shadow.mapSize.width = 2048;
                sunLight.shadow.mapSize.height = 2048;
                this.scene.add(sunLight);
                this.sunLight = sunLight;
            }

            createSun() {
                // Main sun
                const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
                const sunMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    emissive: 0xffaa00,
                    emissiveIntensity: 0.3
                });
                
                this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
                this.scene.add(this.sun);

                // Sun glow effect - animated using Three.js
                const glowGeometry = new THREE.SphereGeometry(4, 32, 32);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffaa00,
                    transparent: true,
                    opacity: 0.1
                });
                this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
                this.scene.add(this.sunGlow);
            }

            createPlanets() {
                Object.keys(this.planetData).forEach(planetKey => {
                    const data = this.planetData[planetKey];
                    
                    // Create planet geometry and material
                    const geometry = new THREE.SphereGeometry(data.size, 16, 16);
                    const material = new THREE.MeshLambertMaterial({ 
                        color: data.color,
                        transparent: true,
                        opacity: 0.9
                    });
                    
                    const planet = new THREE.Mesh(geometry, material);
                    planet.position.x = data.distance;
                    planet.castShadow = true;
                    planet.receiveShadow = true;
                    planet.userData = { 
                        name: data.name, 
                        info: data.info,
                        originalColor: data.color,
                        isHovered: false
                    };
                    
                    // Create orbit group for rotation
                    const orbitGroup = new THREE.Group();
                    orbitGroup.add(planet);
                    
                    this.scene.add(orbitGroup);
                    this.planets[planetKey] = {
                        mesh: planet,
                        orbitGroup: orbitGroup,
                        angle: Math.random() * Math.PI * 2,
                        speed: data.speed,
                        baseSpeed: data.speed,
                        distance: data.distance,
                        rotationSpeed: 0,
                        pulsePhase: Math.random() * Math.PI * 2
                    };
                });
            }

            createOrbitLines() {
                Object.keys(this.planetData).forEach(planetKey => {
                    const data = this.planetData[planetKey];
                    const points = [];
                    
                    for (let i = 0; i <= 64; i++) {
                        const angle = (i / 64) * Math.PI * 2;
                        points.push(new THREE.Vector3(
                            Math.cos(angle) * data.distance,
                            0,
                            Math.sin(angle) * data.distance
                        ));
                    }
                    
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({ 
                        color: 0x333333,
                        transparent: true,
                        opacity: 0.3
                    });
                    
                    const orbitLine = new THREE.Line(geometry, material);
                    this.scene.add(orbitLine);
                    this.orbitLines[planetKey] = orbitLine;
                });
            }

            createStars() {
                const starsGeometry = new THREE.BufferGeometry();
                const starsMaterial = new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: 1,
                    transparent: true,
                    opacity: 0.8
                });

                const starsVertices = [];
                for (let i = 0; i < 1000; i++) {
                    const x = (Math.random() - 0.5) * 400;
                    const y = (Math.random() - 0.5) * 400;
                    const z = (Math.random() - 0.5) * 400;
                    starsVertices.push(x, y, z);
                }

                starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
                this.stars = new THREE.Points(starsGeometry, starsMaterial);
                this.scene.add(this.stars);
            }

            setupControls() {
                const controlsContainer = document.getElementById('planet-controls');
                
                Object.keys(this.planetData).forEach(planetKey => {
                    const data = this.planetData[planetKey];
                    
                    const controlDiv = document.createElement('div');
                    controlDiv.className = 'planet-control';
                    
                    controlDiv.innerHTML = `
                        <div class="planet-name">${data.name}</div>
                        <div class="speed-control">
                            <input type="range" class="speed-slider" 
                                   id="${planetKey}-speed" 
                                   min="0" max="10" step="0.1" 
                                   value="${data.speed}">
                            <span class="speed-value" id="${planetKey}-value">${data.speed.toFixed(1)}x</span>
                        </div>
                    `;
                    
                    controlsContainer.appendChild(controlDiv);
                    
                    // Add event listener for speed control
                    const slider = document.getElementById(`${planetKey}-speed`);
                    const valueDisplay = document.getElementById(`${planetKey}-value`);
                    
                    slider.addEventListener('input', (e) => {
                        const newSpeed = parseFloat(e.target.value);
                        this.planets[planetKey].speed = newSpeed;
                        valueDisplay.textContent = `${newSpeed.toFixed(1)}x`;
                        
                        // Animate slider feedback using Three.js principles
                        this.animateSliderFeedback(planetKey, newSpeed);
                    });
                });
            }

            animateSliderFeedback(planetKey, speed) {
                // Use Three.js animation to provide visual feedback
                const planet = this.planets[planetKey];
                if (planet) {
                    // Temporarily brighten the planet
                    const originalEmissive = planet.mesh.material.emissive.getHex();
                    planet.mesh.material.emissive.setHex(0x444444);
                    
                    setTimeout(() => {
                        planet.mesh.material.emissive.setHex(originalEmissive);
                    }, 200);
                }
            }

            setupEventListeners() {
                // Window resize
                window.addEventListener('resize', () => this.onWindowResize());
                
                // Mouse interactions for planet hover
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2();
                
                this.renderer.domElement.addEventListener('mousemove', (event) => {
                    // Handle camera rotation if dragging
                    if (this.mouse.isDragging) {
                        const deltaX = event.clientX - this.mouse.previousX;
                        const deltaY = event.clientY - this.mouse.previousY;
                        
                        this.cameraControls.targetRotationY += deltaX * 0.01;
                        this.cameraControls.targetRotationX += deltaY * 0.01;
                        
                        // Clamp vertical rotation
                        this.cameraControls.targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraControls.targetRotationX));
                        
                        this.mouse.previousX = event.clientX;
                        this.mouse.previousY = event.clientY;
                    }
                    
                    // Planet hover detection
                    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    
                    raycaster.setFromCamera(mouse, this.camera);
                    const planetMeshes = Object.values(this.planets).map(p => p.mesh);
                    const intersects = raycaster.intersectObjects(planetMeshes);
                    
                    // Reset all planets hover state
                    Object.values(this.planets).forEach(planet => {
                        if (planet.mesh.userData.isHovered) {
                            planet.mesh.userData.isHovered = false;
                            planet.mesh.material.emissive.setHex(0x000000);
                        }
                    });
                    
                    if (intersects.length > 0 && !this.mouse.isDragging) {
                        const planet = intersects[0].object;
                        planet.userData.isHovered = true;
                        planet.material.emissive.setHex(0x222222);
                        this.showPlanetInfo(planet.userData);
                        document.body.style.cursor = 'pointer';
                    } else {
                        this.hidePlanetInfo();
                        document.body.style.cursor = 'default';
                    }
                });
                
                // Mouse down for camera controls
                this.renderer.domElement.addEventListener('mousedown', (e) => {
                    this.mouse.isDragging = true;
                    this.mouse.previousX = e.clientX;
                    this.mouse.previousY = e.clientY;
                    document.body.style.cursor = 'grabbing';
                });

                // Mouse up
                window.addEventListener('mouseup', () => {
                    this.mouse.isDragging = false;
                    document.body.style.cursor = 'default';
                });

                // Mouse wheel for zoom
                this.renderer.domElement.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const zoomSpeed = 5;
                    const direction = e.deltaY > 0 ? 1 : -1;
                    
                    this.cameraControls.targetDistance += direction * zoomSpeed;
                    this.cameraControls.targetDistance = Math.max(20, Math.min(200, this.cameraControls.targetDistance));
                });
                
                // Control panel minimize
                document.getElementById('minimize-btn').addEventListener('click', () => {
                    const content = document.getElementById('panel-content');
                    const btn = document.getElementById('minimize-btn');
                    
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        btn.textContent = '−';
                    } else {
                        content.style.display = 'none';
                        btn.textContent = '+';
                    }
                });
                
                // Pause/Resume button
                document.getElementById('pause-btn').addEventListener('click', () => {
                    this.toggleAnimation();
                });
                
                // Theme toggle
                document.getElementById('theme-btn').addEventListener('click', () => {
                    this.toggleTheme();
                });
            }

            showPlanetInfo(planetData) {
                const infoPanel = document.getElementById('info-panel');
                const infoContent = document.getElementById('planet-info');
                
                infoContent.innerHTML = `
                    <h3>${planetData.name}</h3>
                    <p>${planetData.info}</p>
                `;
                
                infoPanel.style.display = 'block';
            }

            hidePlanetInfo() {
                document.getElementById('info-panel').style.display = 'none';
            }

            toggleAnimation() {
                this.isAnimating = !this.isAnimating;
                const btn = document.getElementById('pause-btn');
                
                if (this.isAnimating) {
                    btn.textContent = 'Pause';
                    btn.classList.remove('paused');
                } else {
                    btn.textContent = 'Resume';
                    btn.classList.add('paused');
                }
            }

            toggleTheme() {
                this.isDarkTheme = !this.isDarkTheme;
                const btn = document.getElementById('theme-btn');
                
                // Animate theme transition using Three.js
                this.animateThemeTransition();
                
                if (this.isDarkTheme) {
                    document.body.classList.remove('light-theme');
                    btn.textContent = 'Light Mode';
                } else {
                    document.body.classList.add('light-theme');
                    btn.textContent = 'Dark Mode';
                }
            }

            animateThemeTransition() {
                // Animate background color change using Three.js
                const startColor = this.isDarkTheme ? new THREE.Color(0x87ceeb) : new THREE.Color(0x000011);
                const endColor = this.isDarkTheme ? new THREE.Color(0x000011) : new THREE.Color(0x87ceeb);
                const duration = 1000; // 1 second
                const startTime = Date.now();
                
                const animateBackground = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const currentColor = startColor.clone().lerp(endColor, progress);
                    this.renderer.setClearColor(currentColor);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateBackground);
                    }
                };
                
                animateBackground();
            }

            updateCameraPosition() {
                // Smooth camera movement using Three.js interpolation
                const lerpFactor = 0.05;
                
                this.cameraControls.currentRotationX += (this.cameraControls.targetRotationX - this.cameraControls.currentRotationX) * lerpFactor;
                this.cameraControls.currentRotationY += (this.cameraControls.targetRotationY - this.cameraControls.currentRotationY) * lerpFactor;
                this.cameraControls.currentDistance += (this.cameraControls.targetDistance - this.cameraControls.currentDistance) * lerpFactor;
                
                // Calculate camera position
                const x = Math.sin(this.cameraControls.currentRotationY) * Math.cos(this.cameraControls.currentRotationX) * this.cameraControls.currentDistance;
                const y = Math.sin(this.cameraControls.currentRotationX) * this.cameraControls.currentDistance;
                const z = Math.cos(this.cameraControls.currentRotationY) * Math.cos(this.cameraControls.currentRotationX) * this.cameraControls.currentDistance;
                
                this.camera.position.set(x, y, z);
                this.camera.lookAt(0, 0, 0);
            }

            onWindowResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }

            animate() {
                requestAnimationFrame(() => this.animate());
                
                const delta = this.clock.getDelta();
                const time = this.clock.getElapsedTime();
                
                if (this.isAnimating) {
                    // Animate sun rotation and pulsing glow
                    if (this.sun) {
                        this.sun.rotation.y += delta * 0.5;
                        
                        // Animate sun glow pulsing
                        if (this.sunGlow) {
                            this.sunGlow.material.opacity = 0.1 + Math.sin(time * 2) * 0.05;
                            this.sunGlow.rotation.y += delta * 0.2;
                        }
                    }
                    
                    // Animate planets
                    Object.keys(this.planets).forEach(planetKey => {
                        const planet = this.planets[planetKey];
                        
                        // Update orbit angle
                        planet.angle += delta * planet.speed * 0.1;
                        
                        // Update orbit group rotation
                        planet.orbitGroup.rotation.y = planet.angle;
                        
                        // Rotate planet on its axis
                        planet.mesh.rotation.y += delta * 2;
                        
                        // Add subtle floating animation for hovered planets
                        if (planet.mesh.userData.isHovered) {
                            planet.mesh.position.y = Math.sin(time * 4 + planet.pulsePhase) * 0.2;
                        } else {
                            planet.mesh.position.y += (0 - planet.mesh.position.y) * 0.1;
                        }
                    });
                    
                    // Animate stars rotation
                    if (this.stars) {
                        this.stars.rotation.y += delta * 0.02;
                        this.stars.rotation.x += delta * 0.01;
                    }
                    
                    // Animate orbit lines subtle pulsing
                    Object.values(this.orbitLines).forEach((line, index) => {
                        line.material.opacity = 0.2 + Math.sin(time + index) * 0.1;
                    });
                }
                
                // Update camera position smoothly
                this.updateCameraPosition();
                
                this.renderer.render(this.scene, this.camera);
            }
        }

        // Initialize the solar system when the page loads
        window.addEventListener('load', () => {
            new SolarSystem();
        });