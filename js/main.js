import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js?module";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js?module";

/* Scene */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(14, 10, 16);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* Lighting */
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(10, 15, 10);
scene.add(light);

/* Helper visuals */
const helperGroup = new THREE.Group();
scene.add(helperGroup);
helperGroup.visible = false;

const planeGroup = new THREE.Group();
scene.add(planeGroup);
planeGroup.visible = false;

/* Main Measurement Grid */
const grid = new THREE.GridHelper(40, 40, 0x2a3a46, 0x1b242c);
grid.position.y = 0;
helperGroup.add(grid);

/* Lattice Cage */
function addLatticeCage(width, height, depth, divisions, color) {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });

    const xStep = width / divisions;
    const yStep = height / divisions;
    const zStep = depth / divisions;

    const x0 = -width / 2;
    const y0 = -height / 2;
    const z0 = -depth / 2;

    const lines = [];
    function pushLine(a, b) {
        lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }

    // vertical stacks (X/Z grid, varying Y)
    for (let i = 0; i <= divisions; i++) {
        for (let k = 0; k <= divisions; k++) {
            const x = x0 + i * xStep;
            const z = z0 + k * zStep;
            pushLine(new THREE.Vector3(x, y0, z), new THREE.Vector3(x, y0 + height, z));
        }
    }

    // horizontal slices (X lines on Y/Z planes)
    for (let j = 0; j <= divisions; j++) {
        for (let k = 0; k <= divisions; k++) {
            const y = y0 + j * yStep;
            const z = z0 + k * zStep;
            pushLine(new THREE.Vector3(x0, y, z), new THREE.Vector3(x0 + width, y, z));
        }
    }

    // depth lines (Z lines on X/Y planes)
    for (let i = 0; i <= divisions; i++) {
        for (let j = 0; j <= divisions; j++) {
            const x = x0 + i * xStep;
            const y = y0 + j * yStep;
            pushLine(new THREE.Vector3(x, y, z0), new THREE.Vector3(x, y, z0 + depth));
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const cage = new THREE.LineSegments(geometry, material);
    group.add(cage);
    return group;
}

const CAPTURE_SECONDS = 20;
const CAGE_WIDTH = 20;
const CAGE_HEIGHT = 10;
const CAGE_DEPTH = 20;
const X_MIN = -CAPTURE_SECONDS / 2;
const X_MAX = CAPTURE_SECONDS / 2;
const Y_MIN = 0;
const Y_MAX = CAGE_HEIGHT / 2;
const Z_MIN = 0;
const Z_MAX = CAGE_DEPTH / 2;
const cage = addLatticeCage(CAGE_WIDTH, CAGE_HEIGHT, CAGE_DEPTH, 10, 0x1d9fd3);
helperGroup.add(cage);

/* Axes (subtle monochrome) */
function addAxisLine(dir, length, color, opacity = 0.6) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        dir.clone().multiplyScalar(length)
    ]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.Line(geometry, material);
    helperGroup.add(line);
}

addAxisLine(new THREE.Vector3(1, 0, 0), 10, 0x90c4d6, 0.75); // X
addAxisLine(new THREE.Vector3(0, 1, 0), 8, 0x90c4d6, 0.75);  // Y
addAxisLine(new THREE.Vector3(0, 0, 1), 10, 0x90c4d6, 0.75); // Z

/* Central plane guides (single lines per plane) */
const guideMaterial = new THREE.LineBasicMaterial({ color: 0x6ea6bb, transparent: true, opacity: 0.55 });
function addPlaneCenterLines(width, height, depth) {
    const lines = [];
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;

    // XY plane (Z = 0)
    lines.push(-halfW, 0, 0, halfW, 0, 0);
    lines.push(0, -halfH, 0, 0, halfH, 0);

    // XZ plane (Y = 0)
    lines.push(-halfW, 0, 0, halfW, 0, 0);
    lines.push(0, 0, -halfD, 0, 0, halfD);

    // YZ plane (X = 0)
    lines.push(0, -halfH, 0, 0, halfH, 0);
    lines.push(0, 0, -halfD, 0, 0, halfD);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const centerLines = new THREE.LineSegments(geometry, guideMaterial);
    helperGroup.add(centerLines);
}

addPlaneCenterLines(CAGE_WIDTH, CAGE_HEIGHT, CAGE_DEPTH);

/* Cartesian plane (0..20 on X, positive Y only) */
function addCartesianPlane(xMin, xMax, height, stepX, stepY, color) {
    const lines = [];
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });

    function pushLine(a, b) {
        lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }

    // X axis (xMin..xMax)
    pushLine(new THREE.Vector3(xMin, 0, 0), new THREE.Vector3(xMax, 0, 0));
    // Y axis (0..height)
    pushLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, height, 0));

    // vertical grid (X ticks)
    for (let x = xMin; x <= xMax; x += stepX) {
        pushLine(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, height, 0));
    }

    // horizontal grid (Y ticks)
    for (let y = stepY; y <= height; y += stepY) {
        pushLine(new THREE.Vector3(xMin, y, 0), new THREE.Vector3(xMax, y, 0));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    const grid = new THREE.LineSegments(geometry, material);
    planeGroup.add(grid);
}

addCartesianPlane(X_MIN, X_MAX, Y_MAX, 1, 1, 0x6ea6bb);

/* Signal Point */
const sphereGroup = new THREE.Group();
const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.26, 1),
    new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x006f9b,
        emissiveIntensity: 0.8,
        metalness: 0.6,
        roughness: 0.2
    })
);
const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 24),
    new THREE.MeshBasicMaterial({
        color: 0x7be9ff,
        transparent: true,
        opacity: 0.2
    })
);
const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.02, 8, 64),
    new THREE.MeshBasicMaterial({
        color: 0x9ad7ff,
        transparent: true,
        opacity: 0.6
    })
);
ring.rotation.x = Math.PI / 2;

sphereGroup.add(core);
sphereGroup.add(halo);
sphereGroup.add(ring);
scene.add(sphereGroup);

/* Trail */
let trailPoints = [];
const trailGeometry = new THREE.BufferGeometry();
const trailMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 1
});
const trailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailLine);

/* Audio */
let audioContext;
let audioStream;
let analyser;
let dataArray;
let time = 0;
let peakAmplitude = 0;
let avgFrequency = 0;
let sampleCount = 0;
let captureStart = null;
let lastFrameTime = null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const planeBtn = document.getElementById("planeBtn");
const ampEl = document.getElementById("amp");
const freqEl = document.getElementById("freq");
const posEl = document.getElementById("pos");
const camEl = document.getElementById("cam");
const targetEl = document.getElementById("target");
const timeEl = document.getElementById("time");
const durationEl = document.getElementById("duration");
const peakEl = document.getElementById("peak");
const avgEl = document.getElementById("avgFreq");
const statusEl = document.getElementById("status");

startBtn.addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStream = stream;
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    trailPoints = [];
    trailGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(trailPoints, 3)
    );
    startBtn.style.display = "none";
    if (stopBtn) stopBtn.style.display = "inline-block";
    captureStart = performance.now();
    lastFrameTime = captureStart;
    peakAmplitude = 0;
    avgFrequency = 0;
    sampleCount = 0;
    time = 0;
    if (statusEl) statusEl.innerText = "Live Capture";
});

if (stopBtn) {
    stopBtn.addEventListener("click", async () => {
        if (audioStream) {
            audioStream.getTracks().forEach((track) => track.stop());
            audioStream = null;
        }
        if (audioContext) {
            await audioContext.close();
            audioContext = null;
        }
        analyser = null;
        dataArray = null;
        startBtn.style.display = "inline-block";
        stopBtn.style.display = "none";
        if (statusEl) statusEl.innerText = "Idle";
    });
}

if (planeBtn) {
    planeBtn.addEventListener("click", () => {
        planeGroup.visible = !planeGroup.visible;
        planeBtn.innerText = planeGroup.visible ? "OCULTAR PLANO" : "MOSTRAR PLANO";
    });
}


/* Amplitude */
function getAmplitude() {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
    }
    return Math.sqrt(sum / dataArray.length);
}


/* Frequency */
function getFrequency() {
    analyser.getByteFrequencyData(dataArray);
    let maxIndex = 0;
    for (let i = 1; i < dataArray.length; i++) {
        if (dataArray[i] > dataArray[maxIndex]) {
            maxIndex = i;
        }
    }
    const nyquist = audioContext.sampleRate / 2;
    return (maxIndex * nyquist) / dataArray.length;
}

/* Animation */
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (analyser) {
        const amplitude = getAmplitude();
        const frequency = getFrequency();

        ampEl.innerText = amplitude.toFixed(3);
        freqEl.innerText = Math.floor(frequency);

        const now = performance.now();
        if (!captureStart) {
            captureStart = now;
            lastFrameTime = now;
        }
        const elapsed = (now - captureStart) / 1000;
        const delta = lastFrameTime ? (now - lastFrameTime) / 1000 : 0;
        lastFrameTime = now;
        time += delta;

        const x = THREE.MathUtils.clamp(elapsed - CAPTURE_SECONDS / 2, X_MIN, X_MAX);
        const y = THREE.MathUtils.clamp(amplitude * 10, Y_MIN, Y_MAX);
        const z = THREE.MathUtils.clamp(frequency / 500, Z_MIN, Z_MAX);

        sphereGroup.position.set(x, y, z);
        if (posEl) posEl.innerText = `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;

        trailPoints.push(x, y, z);
        if (trailPoints.length > 5000) trailPoints.splice(0, 3);

        trailGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(trailPoints, 3)
        );

        peakAmplitude = Math.max(peakAmplitude, amplitude);
        sampleCount += 1;
        avgFrequency += (frequency - avgFrequency) / sampleCount;

        if (timeEl) timeEl.innerText = elapsed.toFixed(1);
        if (durationEl) durationEl.innerText = CAPTURE_SECONDS.toFixed(0);
        if (peakEl) peakEl.innerText = peakAmplitude.toFixed(3);
        if (avgEl) avgEl.innerText = Math.floor(avgFrequency);

        if (elapsed > CAPTURE_SECONDS) {
            if (audioStream) {
                audioStream.getTracks().forEach((track) => track.stop());
                audioStream = null;
            }
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
            analyser = null;
            dataArray = null;
            startBtn.style.display = "inline-block";
            if (stopBtn) stopBtn.style.display = "none";
            if (statusEl) statusEl.innerText = "Finalizado";
        }
    }

    renderer.render(scene, camera);
    if (camEl) camEl.innerText = `${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`;
    if (targetEl) targetEl.innerText = `${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)}`;
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
