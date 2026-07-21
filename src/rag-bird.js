// rag-bird.js — AXIOM's body in the sky world: a single ink-brush crane,
// not a mascot. It wanders on its own schedule (random waypoints, resting
// pauses, a mild curiosity/wariness toward the pointer) and only overrides
// that free movement briefly when the chat asks something of it — listening,
// thinking, pleased, uneasy. No fixed loop: every flight is a fresh choice.

const REST_BOUNDS = { xMin: 10, xMax: 90, yMin: 10, yMax: 44 };
const ATTENTIVE_BOUNDS = { xMin: 38, xMax: 62, yMin: 20, yMax: 34 };

// Üç katman, üç ayrı transform sorumluluğu (birbirine karışmasın diye):
// .rag-bird (dış) konum (left/top) taşır; .rag-bird__mood ruh hali jestini
// (flourish/flinch) CSS animasyonuyla oynar; .rag-bird__art yön/yatışı
// (facing/bank) JS'ten inline transform ile alır. Üçü de aynı elemanda
// olsaydı animasyon ile inline stil birbirinin üstüne yazardı.
const BIRD_SVG = `
  <div class="rag-bird__mood">
    <div class="rag-bird__art">
      <svg viewBox="0 0 140 90" aria-hidden="true">
        <path class="rag-bird__wing" d="M60,30 C46,8 20,-2 2,2 C16,14 30,24 46,34 C50,36 56,34 60,30 Z" />
        <path class="rag-bird__body" d="M10,60 C20,64 30,63 38,56 C50,46 58,34 66,24 C74,14 84,8 96,10 C104,11 110,14 120,12" />
        <path class="rag-bird__legs" d="M26,58 L14,76 M34,60 L24,80" />
      </svg>
    </div>
  </div>`;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

export function createBird(stage, { reduced }) {
  const el = document.createElement("div");
  el.className = "rag-bird";
  el.dataset.mood = "sleeping";
  el.innerHTML = BIRD_SVG;
  stage.appendChild(el);

  const art = el.querySelector(".rag-bird__art");
  const moodLayer = el.querySelector(".rag-bird__mood");
  const world = stage.parentElement;

  let x = 50;
  let y = 26;
  let mood = "sleeping";
  let flightTimer = null;
  let pauseTimer = null;
  const pointer = { x: 50, y: 30, active: false };

  function face(dx, dy) {
    const facing = dx >= 0 ? 1 : -1;
    const bank = clamp(dy * 0.9, -14, 14) * facing;
    art.style.transform = `scaleX(${facing}) rotate(${bank}deg)`;
  }

  function place(px, py, duration) {
    face(px - x, py - y);
    x = px;
    y = py;
    if (reduced) {
      el.style.transition = "none";
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      return;
    }
    el.style.transition = `left ${duration}s cubic-bezier(0.45,0,0.2,1), top ${duration}s cubic-bezier(0.45,0,0.2,1)`;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.classList.add("is-flying");
    clearTimeout(flightTimer);
    flightTimer = setTimeout(() => {
      el.classList.remove("is-flying");
      art.style.transform = art.style.transform.replace(/rotate\([^)]*\)/, "rotate(0deg)");
      scheduleNext();
    }, duration * 1000);
  }

  // Fareye çok yakınsa %60 ihtimalle ürkekçe uzaklaşır, %40 meraklanıp yaklaşır.
  function pickWaypoint(bounds) {
    let px = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
    let py = bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin);
    if (pointer.active && dist(pointer.x, pointer.y, x, y) < 22) {
      const flee = Math.random() < 0.6;
      px = flee ? x - (pointer.x - x) : pointer.x + (Math.random() * 10 - 5);
      py = flee ? y - (pointer.y - y) : pointer.y + (Math.random() * 6 - 3);
    }
    return { px: clamp(px, bounds.xMin, bounds.xMax), py: clamp(py, bounds.yMin, bounds.yMax) };
  }

  function scheduleNext() {
    if (reduced || mood === "sleeping") return;
    clearTimeout(pauseTimer);
    const isAlert = mood === "listening" || mood === "thinking";
    const pause = mood === "thinking" ? 350 + Math.random() * 450 : 1600 + Math.random() * 2600;
    pauseTimer = setTimeout(() => {
      if (mood === "sleeping") return;
      const bounds = isAlert ? ATTENTIVE_BOUNDS : REST_BOUNDS;
      const { px, py } = pickWaypoint(bounds);
      const duration = mood === "thinking" ? 0.85 + Math.random() * 0.55 : clamp(dist(px, py, x, y) / 22, 1.4, 3.2);
      place(px, py, duration);
    }, pause);
  }

  function setMood(next) {
    if (mood === "sleeping") return; // uyanmadan tepki alamaz
    clearTimeout(pauseTimer);
    clearTimeout(flightTimer);

    if (next === "pleased" || next === "uneasy") {
      const cls = next === "pleased" ? "rag-bird--flourish" : "rag-bird--flinch";
      moodLayer.classList.add(cls);
      setTimeout(() => moodLayer.classList.remove(cls), 650);
      mood = "idle";
    } else {
      mood = next;
    }
    el.dataset.mood = mood;
    scheduleNext();
  }

  function wake(firstEntrance) {
    mood = "idle";
    el.dataset.mood = "idle";
    if (firstEntrance) {
      x = -15;
      y = 22;
      el.style.transition = "none";
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      art.style.transform = "scaleX(1) rotate(-4deg)";
      if (reduced) { place(50, 24, 0); return; }
      requestAnimationFrame(() => place(50, 24, 1.6));
    } else {
      scheduleNext();
    }
  }

  function sleep() {
    mood = "sleeping";
    el.dataset.mood = "sleeping";
    clearTimeout(flightTimer);
    clearTimeout(pauseTimer);
    el.classList.remove("is-flying");
  }

  world.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    pointer.x = ((e.clientX - r.left) / r.width) * 100;
    pointer.y = ((e.clientY - r.top) / r.height) * 100;
    pointer.active = true;
  });
  world.addEventListener("pointerleave", () => { pointer.active = false; });

  return { setMood, wake, sleep };
}
