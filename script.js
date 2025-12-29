import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Target date: January 1, 2026, 00:00:00
const targetDate = new Date('2026-01-01T00:00:00').getTime();
const yearStart = new Date('2025-01-01T00:00:00').getTime();

// DOM Elements
const daysElement = document.getElementById('days');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const messageElement = document.getElementById('message');
const progressBar = document.getElementById('progressBar');
const totalSecondsElement = document.getElementById('totalSeconds');
const percentageElement = document.getElementById('percentage');
const yearDisplay = document.getElementById('yearDisplay');
const titlePrefix = document.getElementById('titlePrefix');
const subtitle = document.getElementById('subtitle');
const finalCountdownOverlay = document.getElementById('finalCountdown');
const mainContainer = document.querySelector('.container');

let yearSwapped = false;
let lastFinalSecond = -1;

// Three.js Engine State
let scene, camera, renderer, composer;
let fireworksActive = false;
let fireworkInstances = [];
let particleGroups = [];

// Set initial year and wording based on date
if (new Date().getTime() < targetDate) {
    if (yearDisplay) yearDisplay.textContent = '2026';
    if (titlePrefix) titlePrefix.textContent = 'Countdown to';
    if (subtitle) subtitle.textContent = 'A New Era Begins';
} else {
    if (yearDisplay) yearDisplay.textContent = '2026';
    if (titlePrefix) titlePrefix.textContent = 'Happy New Year';
    if (subtitle) subtitle.textContent = 'Welcome to 2026!';
    yearSwapped = true;
}

// Create particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 3 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.2;
        particlesContainer.appendChild(particle);
    }
}

// Create sparkles around the title
function createTitleSparkle() {
    const container = document.getElementById('title-sparkles');
    if (!container) return;

    const sparkle = document.createElement('div');
    sparkle.className = 'title-sparkle';

    // Random position around the year
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    sparkle.style.left = x + '%';
    sparkle.style.top = y + '%';

    const size = Math.random() * 6 + 2;
    sparkle.style.width = size + 'px';
    sparkle.style.height = size + 'px';

    container.appendChild(sparkle);

    setTimeout(() => {
        sparkle.remove();
    }, 1500);
}

// Format number with leading zero
function formatNumber(num) {
    return num < 10 ? '0' + num : num;
}

// Format large numbers with commas
function formatLargeNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 800;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('fireworks'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Post-processing: Bloom for that cinematic "glow"
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // strength
        0.4, // radius
        0.85 // threshold
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}

initThreeJS();

// Update countdown
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        // Countdown finished
        daysElement.textContent = '00';
        hoursElement.textContent = '00';
        minutesElement.textContent = '00';
        secondsElement.textContent = '00';
        messageElement.textContent = '🎉 Welcome to 2026! 🎉';
        messageElement.classList.add('celebration-message');

        // Dynamic Year Swap and Wording Transition
        if (!yearSwapped && yearDisplay) {
            yearSwapped = true;

            // Hide final countdown overlay immediately
            if (finalCountdownOverlay) {
                finalCountdownOverlay.style.display = 'none';
            }
            if (mainContainer) {
                mainContainer.classList.remove('ui-dimmed');
            }

            yearDisplay.classList.add('year-flip');

            // Swap text halfway through the flip
            setTimeout(() => {
                yearDisplay.textContent = '2026';
                if (titlePrefix) titlePrefix.textContent = 'Happy New Year';
                if (subtitle) subtitle.textContent = 'Welcome to 2026!';
            }, 500);
        }

        // Add celebration animation
        document.querySelector('.countdown-grid').classList.add('celebration');

        // Start fireworks!
        if (!fireworksActive) {
            startFireworks();
        }

        return;
    }

    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update display
    daysElement.textContent = formatNumber(days);
    hoursElement.textContent = formatNumber(hours);
    minutesElement.textContent = formatNumber(minutes);
    secondsElement.textContent = formatNumber(seconds);

    // Calculate total seconds remaining
    const totalSeconds = Math.floor(distance / 1000);
    totalSecondsElement.textContent = formatLargeNumber(totalSeconds);

    // Calculate year progress
    const yearEnd = targetDate;
    const totalYearDuration = yearEnd - yearStart;
    const elapsed = now - yearStart;
    const percentage = Math.min(100, Math.max(0, (elapsed / totalYearDuration) * 100));

    progressBar.style.width = percentage + '%';
    percentageElement.textContent = percentage.toFixed(2) + '%';

    // Update message based on time remaining
    if (days > 30) {
        messageElement.textContent = 'The countdown to 2026 continues...';
    } else if (days > 7) {
        messageElement.textContent = 'Less than a month until 2026!';
    } else if (days > 1) {
        messageElement.textContent = 'Just days away from 2026!';
    } else if (days === 1) {
        messageElement.textContent = 'Tomorrow is 2026!';
    } else if (hours > 1) {
        messageElement.textContent = 'Hours until 2026!';
    } else {
        messageElement.textContent = 'Minutes until 2026!';
    }

    // Final 10-second dramatic countdown
    if (distance <= 10500 && distance > 0) {
        const remainingSeconds = Math.ceil(distance / 1000);
        showFinalCountdown(remainingSeconds);
    } else if (distance <= 0 || distance > 10500) {
        if (finalCountdownOverlay) {
            finalCountdownOverlay.style.display = 'none';
        }
        if (mainContainer) {
            mainContainer.classList.remove('ui-dimmed');
        }
    }
}


function showFinalCountdown(seconds) {
    if (seconds === lastFinalSecond || seconds <= 0) return;
    lastFinalSecond = seconds;

    if (finalCountdownOverlay) {
        finalCountdownOverlay.style.display = 'flex';
        finalCountdownOverlay.innerHTML = `<div class="countdown-number" data-number="${seconds}">${seconds}</div>`;

        if (mainContainer) {
            mainContainer.classList.add('ui-dimmed');
        }

        // Add a slight screen shake or additional effect for the last 3-2-1
        if (seconds <= 3) {
            document.body.style.animation = 'none';
            setTimeout(() => {
                document.body.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
            }, 10);
        }
    }
}

// Add pulse animation to time cards when value changes
let previousValues = { days: null, hours: null, minutes: null, seconds: null };

function addPulseAnimation() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) return;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const currentValues = { days, hours, minutes, seconds };
    const elements = {
        days: daysElement.parentElement,
        hours: hoursElement.parentElement,
        minutes: minutesElement.parentElement,
        seconds: secondsElement.parentElement
    };

    Object.keys(currentValues).forEach(key => {
        if (previousValues[key] !== null && previousValues[key] !== currentValues[key]) {
            elements[key].style.animation = 'none';
            setTimeout(() => {
                elements[key].style.animation = 'celebrate 0.5s ease-in-out';
            }, 10);
        }
        previousValues[key] = currentValues[key];
    });
}

// Initialize
createParticles();
updateCountdown();
addPulseAnimation();
setInterval(createTitleSparkle, 150);

// Update every second
setInterval(() => {
    updateCountdown();
    addPulseAnimation();
}, 1000);

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Add keyboard shortcuts for fun
document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});

// Add mouse move parallax effect
document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.gradient-orb');
    const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

    orbs.forEach((orb, index) => {
        const factor = (index + 1) * 30;
        const xOffset = x * factor;
        const yOffset = y * factor;
        const rotate = x * 10;

        orb.style.transform = `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg)`;
    });
});

// Log welcome message
console.log('%c🎉 Welcome to the 2026 Countdown! 🎉', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cPress F to toggle fullscreen mode', 'font-size: 14px; color: #a0aec0;');

// Three.js Firework Class
class FireworkInstance {
    constructor() {
        this.hue = Math.random() * 360;
        this.color = new THREE.Color(`hsl(${this.hue}, 100%, 60%)`);

        // Starting position (bottom of screen in 3D)
        const x = (Math.random() - 0.5) * 1000;
        const y = -600;
        const z = (Math.random() - 0.5) * 400;

        this.position = new THREE.Vector3(x, y, z);
        this.targetY = (Math.random() * 400) + 100;
        this.velocity = new THREE.Vector3((Math.random() - 0.5) * 3, 12 + Math.random() * 5, (Math.random() - 0.5) * 2);
        this.gravity = 0.15;
        this.exploded = false;
        this.explosionType = Math.floor(Math.random() * 3);

        // Rocket sprite
        const spriteMap = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
        const material = new THREE.SpriteMaterial({
            map: spriteMap,
            color: this.color,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(15, 15, 1);
        this.sprite.position.copy(this.position);
        scene.add(this.sprite);
    }

    update() {
        if (!this.exploded) {
            this.velocity.y -= this.gravity;
            this.position.add(this.velocity);
            this.sprite.position.copy(this.position);

            // Explode if reached peak or target
            if (this.velocity.y <= 0 || this.position.y >= this.targetY) {
                this.explode();
            }
        }
    }

    explode() {
        this.exploded = true;
        scene.remove(this.sprite);
        createThreeJSExplosion(this.position, this.hue, this.explosionType);
    }
}

function createThreeJSExplosion(position, hue, type) {
    const count = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(`hsl(${hue}, 100%, 70%)`);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;

        let vx, vy, vz;
        if (type === 0) { // Volumetric Sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 4 + Math.random() * 8;
            vx = Math.sin(phi) * Math.cos(theta) * speed;
            vy = Math.sin(phi) * Math.sin(theta) * speed;
            vz = Math.cos(phi) * speed;
        } else if (type === 1) { // 3D Heart
            const t = (i / count) * Math.PI * 2;
            vx = 16 * Math.pow(Math.sin(t), 3);
            vy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            vz = (Math.random() - 0.5) * 10;
            const speed = 0.5;
            vx *= speed; vy *= speed;
        } else { // 3D Star
            const points = 5;
            const t = (i / count) * Math.PI * 2 * points;
            const r = (Math.floor((i / count) * points * 2) % 2 === 0) ? 10 : 5;
            vx = Math.cos(t) * r;
            vy = Math.sin(t) * r;
            vz = (Math.random() - 0.5) * 10;
        }

        velocities.push(new THREE.Vector3(vx, vy, vz));
        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    particleGroups.push({
        points,
        velocities,
        life: 1.0,
        decay: 0.005 + Math.random() * 0.01
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Update Rockets
    for (let i = fireworkInstances.length - 1; i >= 0; i--) {
        const fw = fireworkInstances[i];
        fw.update();
        if (fw.exploded) {
            fireworkInstances.splice(i, 1);
        }
    }

    // Update Particle Groups
    for (let i = particleGroups.length - 1; i >= 0; i--) {
        const group = particleGroups[i];
        const posAttr = group.points.geometry.attributes.position;

        group.life -= group.decay;
        group.points.material.opacity = group.life;

        for (let j = 0; j < group.velocities.length; j++) {
            const v = group.velocities[j];
            posAttr.array[j * 3] += v.x;
            posAttr.array[j * 3 + 1] += v.y;
            posAttr.array[j * 3 + 2] += v.z;

            v.y -= 0.1; // gravity
            v.multiplyScalar(0.97); // friction
        }
        posAttr.needsUpdate = true;

        if (group.life <= 0) {
            scene.remove(group.points);
            group.points.geometry.dispose();
            group.points.material.dispose();
            particleGroups.splice(i, 1);
        }
    }

    if (composer) {
        composer.render();
    }
}

animate();

function launchFirework() {
    if (fireworksActive) {
        fireworkInstances.push(new FireworkInstance());
    }
}

function startFireworks() {
    fireworksActive = true;

    // Interval for regular launches
    const launchInterval = setInterval(() => {
        if (fireworksActive) {
            launchFirework();
        } else {
            clearInterval(launchInterval);
        }
    }, 600);

    // Occasional bursts of multiple fireworks
    const burstInterval = setInterval(() => {
        if (fireworksActive) {
            for (let i = 0; i < 4; i++) {
                setTimeout(() => launchFirework(), i * 150);
            }
        } else {
            clearInterval(burstInterval);
        }
    }, 3000);

    // Stop after 30 seconds
    setTimeout(() => {
        fireworksActive = false;
    }, 30000);
}

