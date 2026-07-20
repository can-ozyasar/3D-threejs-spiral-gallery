import { on, ChatEvent } from './chat-bus.js';

// Three.js (and its GLTF/Draco loaders) are the heaviest dependency here, so
// they're loaded lazily via dynamic import() inside initCharacter(), exactly
// like the spiral gallery in script.js — the gate's static HTML/CSS paints
// immediately, the 3D character streams in afterwards, off the critical path.
let THREE;
let GLTFLoader;
let DRACOLoader;
let RoomEnvironment;

// ---------------------------------------------------------------------------
// CONFIG — single source of truth for the character's asset, look and motion.
//
// The model is "RobotExpressive" — a small rigged mascot with real baked
// animation clips (Idle, Walking, Wave, ...). Motion is driven almost
// entirely by THREE.AnimationMixer crossfading between those clips (see
// STATE_CLIPS below); there is no hand-rolled procedural posing. Only the
// character's ground position/facing while wandering is driven by us —
// the clips themselves are in-place loops, same as the official three.js
// examples that ship this model.
// ---------------------------------------------------------------------------

const CONFIG = {
  modelUrl: '/models/axiom-placeholder.glb',
  dracoDecoderPath: '/vendor/draco/',
  // The authored rest pose is a T-pose roughly 4.46 units tall (FBX export,
  // not real-world scale) — scaled down so the animated (arms-down) figure
  // reads as a modest on-screen presence rather than a giant filling the
  // whole stage.
  modelScale: 0.35,
  clipCrossfadeSeconds: 0.35,
  // Free-roam bounds are derived every time from the live camera frustum
  // (see computeRoamHalfWidth) rather than a hand-picked list of spots, so
  // the character actually uses the whole full-screen stage on any viewport
  // instead of pacing a small fixed patch near the origin.
  roam: {
    marginFactor: 0.42, // fraction of the visible half-width actually used — kept modest so walks read as a short, purposeful stroll, not a dash across the whole screen
    zRange: [-0.5, 0.9],
    maxSampleAttempts: 8, // resamples before giving up on avoiding the chat island
    islandPadding: 24, // px kept clear around the chat island's on-screen box
  },
  waypointArriveEpsilon: 0.05,
  driftSpeed: 0.35, // units/sec while traveling between roam targets — unhurried
  turnSpeed: 3.5, // facing-rotation lerp factor while traveling — slower than 5 so turns don't snap
  idleWanderDelayMs: [10000, 20000],
  wanderCooldownMs: [5000, 9000],
  readingWpm: 200,
  talkMinSeconds: 1.6,
  talkMaxSeconds: 14,
  cameraFov: 35,
  // Framed for a standing ~1.6-unit-tall figure (feet near y=0, head near
  // y=1.55 after modelScale) rather than the old floating-bust framing.
  cameraPosition: [0, 0.65, 6.2],
  cameraLookAt: [0, 0.75, 0],
};

export const CharacterState = Object.freeze({
  IDLE: 'idle',
  LOOK_AROUND: 'lookAround',
  WALK: 'walk',
  WAVE: 'wave',
  LISTEN: 'listen',
  THINK: 'think',
  TALK: 'talk',
});

// Which baked clip plays for each state, and whether it loops. Non-looping
// clips (WAVE, LOOK_AROUND) auto-return to IDLE once the clip finishes
// (see playClipForState). TALK loops "Yes" (a nod) for as long as the
// estimated reading time of the answer lasts (see setState).
const STATE_CLIPS = {
  [CharacterState.IDLE]: { clip: 'Idle', loop: true },
  [CharacterState.WALK]: { clip: 'Walking', loop: true },
  [CharacterState.WAVE]: { clip: 'Wave', loop: false },
  [CharacterState.LISTEN]: { clip: 'Idle', loop: true },
  [CharacterState.THINK]: { clip: 'Idle', loop: true },
  [CharacterState.TALK]: { clip: 'Yes', loop: true },
  // "No" is a side-to-side head shake — close enough to a curious glance
  // around, and reusing an authored clip beats inventing a fake gesture.
  [CharacterState.LOOK_AROUND]: { clip: 'No', loop: false },
};

const gateSection = document.querySelector('.intro-gate');

let scene, camera, renderer, clock, model;
let mixer = null;
let actions = {}; // clip name -> THREE.AnimationAction
let activeAction = null;
let currentState = null;
let talkTimeoutId = null;
let oneShotTimeoutId = null;
let wanderTimer = 0;
let wanderDelay = randomBetween(CONFIG.idleWanderDelayMs);
let wanderTarget = null;
let isPaused = false;
let prefersReducedMotion = false;
let lastAnswerLength = 40;

function randomBetween([min, max]) {
  return min + Math.random() * (max - min);
}

function estimateTalkSeconds(charCount) {
  const words = charCount / 5;
  const seconds = (words / CONFIG.readingWpm) * 60;
  return Math.min(Math.max(seconds, CONFIG.talkMinSeconds), CONFIG.talkMaxSeconds);
}

// ---------------------------------------------------------------------------
// State machine — each state maps to a baked animation clip (STATE_CLIPS).
// External (chat-driven) states always win over the autonomous idle wander;
// wandering resumes after a short cooldown once the character settles back
// to IDLE.
// ---------------------------------------------------------------------------

function setState(next, { force = false } = {}) {
  if (!model) return;
  if (next === currentState && !force) return;

  clearTimeout(talkTimeoutId);
  talkTimeoutId = null;
  clearTimeout(oneShotTimeoutId);
  oneShotTimeoutId = null;

  if (next !== CharacterState.WALK) {
    wanderTarget = null;
  }

  currentState = next;

  playClipForState(next);

  if (next === CharacterState.TALK) {
    // Hold the talk gesture roughly as long as the answer takes to read.
    talkTimeoutId = setTimeout(() => {
      setState(CharacterState.IDLE, { force: true });
    }, estimateTalkSeconds(lastAnswerLength) * 1000);
  }

  if (next !== CharacterState.WALK && next !== CharacterState.IDLE) {
    // Any externally-driven beat resets the wander cooldown so the character
    // doesn't wander off mid-conversation, settling back into ambient
    // wandering only a little while after things go quiet.
    wanderTimer = 0;
    wanderDelay = randomBetween(CONFIG.wanderCooldownMs);
  }
}

// ---------------------------------------------------------------------------
// Clip playback — crossfades into the clip for the given state. Looping
// clips (Idle/Walking/Yes) just keep running until setState picks something
// else. One-shot clips (Wave/No) schedule their own return to IDLE once the
// clip's natural duration elapses, independent of the TALK content-duration
// timer above.
// ---------------------------------------------------------------------------

function playClipForState(state) {
  if (!mixer) return;
  const config = STATE_CLIPS[state] || STATE_CLIPS[CharacterState.IDLE];
  const nextAction = actions[config.clip];
  if (!nextAction) return;

  nextAction.reset();
  nextAction.setLoop(config.loop ? THREE.LoopRepeat : THREE.LoopOnce, config.loop ? Infinity : 1);
  nextAction.clampWhenFinished = !config.loop;
  nextAction.enabled = true;

  if (activeAction && activeAction !== nextAction) {
    nextAction.crossFadeFrom(activeAction, CONFIG.clipCrossfadeSeconds, true);
  }
  nextAction.play();
  activeAction = nextAction;

  if (!config.loop) {
    const durationMs = (nextAction.getClip().duration / (nextAction.timeScale || 1)) * 1000;
    oneShotTimeoutId = setTimeout(() => {
      if (currentState === state) setState(CharacterState.IDLE, { force: true });
    }, durationMs);
  }
}

// ---------------------------------------------------------------------------
// Autonomous idle wander — free-roam drift that only runs while nothing
// chat-driven is happening, so the character feels alive between messages.
// Owns model.rotation.y (facing) exclusively while WALK is active; the
// Walking clip itself is an in-place loop, so this is what actually moves
// the character across the stage.
// ---------------------------------------------------------------------------

function updateWander(delta) {
  if (prefersReducedMotion) return;

  if (currentState === CharacterState.WALK && wanderTarget) {
    const target = wanderTarget;
    const pos = model.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const distance = Math.hypot(dx, dz);

    if (distance < CONFIG.waypointArriveEpsilon) {
      wanderTarget = null;
      setState(Math.random() < 0.35 ? CharacterState.LOOK_AROUND : CharacterState.IDLE);
      wanderTimer = 0;
      wanderDelay = randomBetween(CONFIG.idleWanderDelayMs);
      return;
    }

    const step = Math.min(CONFIG.driftSpeed * delta, distance);
    pos.x += (dx / distance) * step;
    pos.z += (dz / distance) * step;

    const targetAngle = Math.atan2(dx, dz);
    model.rotation.y += shortestAngleDelta(model.rotation.y, targetAngle) * Math.min(delta * CONFIG.turnSpeed, 1);
    return;
  }

  if (currentState !== CharacterState.IDLE) return;

  wanderTimer += delta * 1000;
  if (wanderTimer >= wanderDelay) {
    wanderTarget = pickRoamTarget();
    setState(CharacterState.WALK);
  }
}

// ---------------------------------------------------------------------------
// Free-roam target picking — bounds come from the live camera frustum (so
// the character actually ranges across the full-screen stage on any
// viewport), biased away from the chat island's on-screen box so the
// character never wanders behind the panel and appears to vanish.
// ---------------------------------------------------------------------------

function computeRoamHalfWidth() {
  const dist = camera.position.z; // camera looks straight down -z at the origin
  const vFovRad = THREE.MathUtils.degToRad(camera.fov);
  const halfHeight = Math.tan(vFovRad / 2) * dist;
  const halfWidth = halfHeight * camera.aspect;
  return halfWidth * CONFIG.roam.marginFactor;
}

function worldToScreenPoint(x, y, z) {
  const projected = new THREE.Vector3(x, y, z).project(camera);
  const gateRect = gateSection.getBoundingClientRect();
  return {
    x: gateRect.left + (projected.x * 0.5 + 0.5) * gateRect.width,
    y: gateRect.top + (1 - (projected.y * 0.5 + 0.5)) * gateRect.height,
  };
}

function overlapsChatIsland(screenX, screenY) {
  const island = document.querySelector('.axiom-island');
  if (!island) return false;
  const rect = island.getBoundingClientRect();
  const pad = CONFIG.roam.islandPadding;
  return (
    screenX > rect.left - pad &&
    screenX < rect.right + pad &&
    screenY > rect.top - pad &&
    screenY < rect.bottom + pad
  );
}

function pickRoamTarget() {
  const halfWidth = computeRoamHalfWidth();
  for (let attempt = 0; attempt < CONFIG.roam.maxSampleAttempts; attempt++) {
    const x = randomBetween([-halfWidth, halfWidth]);
    const z = randomBetween(CONFIG.roam.zRange);
    const screen = worldToScreenPoint(x, 0, z);
    if (!overlapsChatIsland(screen.x, screen.y)) {
      return new THREE.Vector3(x, 0, z);
    }
  }
  // Every sample landed on the chat island (small/narrow viewport) — the
  // island only ever sits right-aligned, so the opposite side is always clear.
  return new THREE.Vector3(-halfWidth * 0.6, 0, 0);
}

function shortestAngleDelta(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

// ---------------------------------------------------------------------------
// Chat-bus wiring — character.js only ever imports `on`/`ChatEvent`; it has
// no idea fetch or DOM chat internals exist.
// ---------------------------------------------------------------------------

function wireChatEvents() {
  on(ChatEvent.OPENED, () => setState(CharacterState.LOOK_AROUND, { force: true }));
  on(ChatEvent.WELCOME_SHOWN, () => setState(CharacterState.WAVE, { force: true }));
  on(ChatEvent.LISTEN_START, () => setState(CharacterState.LISTEN, { force: true }));
  on(ChatEvent.LISTEN_END, () => {
    if (currentState === CharacterState.LISTEN) setState(CharacterState.IDLE);
  });
  on(ChatEvent.REQUEST_SENT, () => setState(CharacterState.THINK, { force: true }));
  on(ChatEvent.RESPONSE_RECEIVED, (e) => {
    lastAnswerLength = e.detail?.length ?? lastAnswerLength;
    setState(CharacterState.TALK, { force: true });
  });
  on(ChatEvent.ERROR, () => setState(CharacterState.IDLE, { force: true }));
  on(ChatEvent.CLOSED, () => setState(CharacterState.IDLE, { force: true }));
}

// ---------------------------------------------------------------------------
// Resize / lifecycle
// ---------------------------------------------------------------------------

function onResize() {
  if (!camera || !renderer || !gateSection) return;
  const width = gateSection.clientWidth;
  const height = gateSection.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
}
window.addEventListener('resize', onResize);

function tick() {
  if (isPaused) return;

  if (renderer && camera && scene && clock) {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    updateWander(delta);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}

function showPosterFallback() {
  gateSection?.classList.add('is-fallback');
}

async function initCharacter() {
  if (!gateSection) return;

  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  THREE = await import('three');
  ({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
  ({ DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js'));
  ({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));

  const width = gateSection.clientWidth;
  const height = gateSection.clientHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, width / height, 0.1, 100);
  camera.position.set(...CONFIG.cameraPosition);
  camera.lookAt(...CONFIG.cameraLookAt);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.classList.add('intro-gate__canvas');
  gateSection.querySelector('.intro-gate__stage').before(renderer.domElement);

  // A soft generated "room" environment (not a real photo) gives any subtle
  // specular highlights on the character's materials something believable
  // to reflect, instead of flat unlit-looking plastic.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  // Soft three-point-ish lighting for a warm, cinematic (not flat) look.
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1a1408, 1.2));
  const key = new THREE.DirectionalLight(0xffe9c7, 1.8);
  key.position.set(2, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9a76a, 1.0);
  rim.position.set(-2, 1.5, -2);
  scene.add(rim);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(CONFIG.dracoDecoderPath);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const gltf = await loader.loadAsync(CONFIG.modelUrl);
  model = gltf.scene;
  model.scale.setScalar(CONFIG.modelScale);
  scene.add(model);

  mixer = new THREE.AnimationMixer(model);
  actions = {};
  gltf.animations.forEach((clip) => {
    actions[clip.name] = mixer.clipAction(clip);
  });

  clock = new THREE.Clock();
  wireChatEvents();

  if (prefersReducedMotion) {
    // A single frozen Idle frame rather than the raw T-pose bind pose.
    currentState = CharacterState.IDLE;
    playClipForState(CharacterState.IDLE);
    mixer.update(0);
    renderer.render(scene, camera);
  } else {
    setState(CharacterState.IDLE, { force: true });
    requestAnimationFrame(tick);
  }

  renderer.domElement.classList.add('is-ready');

  const observer = new IntersectionObserver(
    ([entry]) => {
      const wasPaused = isPaused;
      isPaused = !entry.isIntersecting;
      if (wasPaused && !isPaused && !prefersReducedMotion) requestAnimationFrame(tick);
    },
    { threshold: 0.05 }
  );
  observer.observe(gateSection);
}

function startCharacter() {
  // The 3D character is non-critical decoration; if the chunk fails to load,
  // the model fails to fetch, or WebGL init throws, fall back to a static
  // poster image rather than leaving a blank stage.
  initCharacter().catch((err) => {
    console.error('Character init failed:', err);
    showPosterFallback();
  });
}

if (gateSection) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(startCharacter, { timeout: 1500 });
  } else {
    requestAnimationFrame(() => requestAnimationFrame(startCharacter));
  }
}
