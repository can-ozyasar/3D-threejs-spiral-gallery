// ink-fx.js — Saha Defteri mürekkep efektleri.
// 1) .ink-dust kapları: arka planda yavaşça gezinen mürekkep tozları.
// 2) Damla fırlaması: seçili öğelere hover'da küçük mürekkep damlaları saçılır.
// Her ikisi de prefers-reduced-motion'da tamamen devre dışıdır.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --- gezen mürekkep tozları -------------------------------------------- */

function spawnDust() {
  document.querySelectorAll('.ink-dust').forEach((host) => {
    const count = 14;
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement('span');
      const size = (2 + Math.random() * 3).toFixed(1);
      dot.style.cssText = [
        `left:${(Math.random() * 100).toFixed(2)}%`,
        `top:${(Math.random() * 100).toFixed(2)}%`,
        `width:${size}px`,
        `height:${size}px`,
        `--dx:${(Math.random() * 90 - 45).toFixed(0)}px`,
        `--dy:${(Math.random() * 80 - 40).toFixed(0)}px`,
        `--dur:${(9 + Math.random() * 10).toFixed(1)}s`,
        `--delay:${(-Math.random() * 12).toFixed(1)}s`,
      ].join(';');
      if (Math.random() < 0.2) dot.classList.add('is-marker');
      host.appendChild(dot);
    }
  });
}

/* --- hover'da damla fırlaması ------------------------------------------- */

const BURST_SELECTOR = [
  '.hero__actions a',
  '.blog-cta-pill',
  '#rag-toggle',
  '.nav__hr',
  '.hr-btn',
  '.project-tabs__button',
  '.conversation__email',
  '.exp-nav__arrow',
  '.exp-dot',
  '.practice__tags span',
].join(', ');

const COLORS = ['#2547c0', '#2547c0', '#2547c0', '#ffd84d', '#0f7a5c'];
const COOLDOWN_MS = 700;
const lastBurst = new WeakMap();

function burstAt(x, y, count = 8, spread = 34, sizeBase = 3) {
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'ink-burst-dot';
    const size = sizeBase + Math.random() * 4;
    dot.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${COLORS[(Math.random() * COLORS.length) | 0]};`;
    document.body.appendChild(dot);

    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.9;
    const dist = 22 + Math.random() * spread;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 10; // hafif yukarı eğilim: damla gibi
    dot
      .animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.95 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.25)`, opacity: 0 },
        ],
        { duration: 480 + Math.random() * 320, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }
      )
      .addEventListener('finish', () => dot.remove());
  }
}

function wireBursts() {
  document.addEventListener('pointerover', (event) => {
    const el = event.target.closest(BURST_SELECTOR);
    if (!el) return;
    const now = performance.now();
    if (now - (lastBurst.get(el) || 0) < COOLDOWN_MS) return;
    lastBurst.set(el, now);
    burstAt(event.clientX, event.clientY);
  });
}

/* --- doodle roket + mürekkep havai fişeği -------------------------------- */

const ROCKET_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true">
  <g fill="none" stroke="#2547c0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10,24 C17,13 30,11 41,24 C30,37 17,35 10,24 Z" fill="#fefefd" />
    <circle cx="27" cy="24" r="4" />
    <path d="M15,17 L8,10" />
    <path d="M15,31 L8,38" />
  </g>
  <g stroke="#eab308" stroke-width="2.6" stroke-linecap="round">
    <path d="M8,24 L-1,24" />
    <path d="M9,20 L3,17" />
    <path d="M9,28 L3,31" />
  </g>
</svg>`;

function launchRocket() {
  if (document.hidden) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const endX = w * 0.84;
  const endY = h * 0.16;

  const el = document.createElement('div');
  el.className = 'ink-rocket';
  el.innerHTML = ROCKET_SVG;
  el.style.offsetPath = `path('M -70 ${(h * 0.88).toFixed(0)} Q ${(w * 0.38).toFixed(0)} ${(h * 0.58).toFixed(0)} ${endX.toFixed(0)} ${endY.toFixed(0)}')`;
  document.body.appendChild(el);

  const dur = 2600;
  const flight = el.animate(
    [
      { offsetDistance: '0%', opacity: 0 },
      { offsetDistance: '6%', opacity: 1, offset: 0.06 },
      { offsetDistance: '97%', opacity: 1, offset: 0.93 },
      { offsetDistance: '100%', opacity: 0 },
    ],
    { duration: dur, easing: 'cubic-bezier(0.3, 0.1, 0.4, 1)' }
  );

  // uçuş boyunca arkada ince mürekkep izi
  const trail = setInterval(() => {
    const r = el.getBoundingClientRect();
    if (r.width) burstAt(r.left + r.width / 2, r.top + r.height / 2, 1, 6);
  }, 110);

  flight.addEventListener('finish', () => {
    clearInterval(trail);
    el.remove();
  });

  // varışta üç kademeli havai fişek
  setTimeout(() => {
    burstAt(endX, endY, 16, 96, 6);
    setTimeout(() => burstAt(endX + 34, endY - 22, 11, 68, 5), 160);
    setTimeout(() => burstAt(endX - 38, endY + 14, 11, 72, 5), 320);
  }, dur - 240);
}

function wireRocket() {
  // yalnızca ana sayfada (hero var) ve offset-path destekleyen tarayıcılarda
  if (!document.querySelector('.hero')) return;
  if (!(window.CSS && CSS.supports("offset-path", "path('M0 0 L1 1')"))) return;
  setTimeout(launchRocket, 4200);
  setInterval(launchRocket, 26000);
}

/* --- mürekkep girdabı: iletişimde damlalar e-postaya mıknatıs gibi çekilir --- */

function wireVortex() {
  const section = document.querySelector('.conversation');
  const emailEl = section && section.querySelector('.conversation__email');
  if (!section || !emailEl) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'ink-vortex';
  canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);
  const ctx = canvas.getContext('2d');

  // zengin mürekkep paleti: mavi ağırlıklı ama yeşil, sarı, kehribar,
  // damga kırmızısı, mor ve turkuaz da girdaba katılır
  const COLORS = [
    '37,71,192', '37,71,192', '15,122,92', '234,179,8',
    '156,107,16', '200,55,31', '112,72,232', '15,163,163',
  ];
  // biçim dağılımı: nokta, kare, üçgen, top ve nadiren mini bilgisayar
  const SHAPES = ['dot', 'dot', 'dot', 'square', 'square', 'tri', 'tri', 'ball', 'pc'];
  const COUNT = 52;
  const LINK_DIST = 92;
  let parts = [];
  let running = false;
  let rafId = 0;
  let W = 0;
  let H = 0;
  let boost = 1;

  function resize() {
    const r = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    const side = (Math.random() * 4) | 0;
    const t = Math.random();
    let x, y;
    if (side === 0) { x = t * W; y = -12; }
    else if (side === 1) { x = W + 12; y = t * H; }
    else if (side === 2) { x = t * W; y = H + 12; }
    else { x = -12; y = t * H; }
    const shape = SHAPES[(Math.random() * SHAPES.length) | 0];
    const base = shape === 'dot' ? 1.6 + Math.random() * 2.4 : 2.6 + Math.random() * 2.6;
    return {
      x, y, vx: 0, vy: 0,
      shape,
      r: shape === 'pc' ? 5 + Math.random() * 2 : base,
      rot: Math.random() * 6.2832,
      vr: (Math.random() - 0.5) * 0.09,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: 0.35 + Math.random() * 0.4,
    };
  }

  function drawParticle(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const col = `rgba(${p.c},${p.a})`;
    switch (p.shape) {
      case 'square':
        ctx.fillStyle = col;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        break;
      case 'tri':
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -p.r * 1.25);
        ctx.lineTo(p.r * 1.15, p.r * 0.85);
        ctx.lineTo(-p.r * 1.15, p.r * 0.85);
        ctx.closePath();
        ctx.fill();
        break;
      case 'ball':
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.15, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.arc(-p.r * 0.38, -p.r * 0.38, p.r * 0.34, 0, 6.2832);
        ctx.fill();
        break;
      case 'pc': {
        // mini bilgisayar doodle: ekran + ayak + taban
        const w = p.r;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.fillStyle = `rgba(${p.c},${(p.a * 0.25).toFixed(2)})`;
        ctx.beginPath();
        ctx.rect(-w, -w * 0.75, w * 2, w * 1.3);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, w * 0.55);
        ctx.lineTo(0, w * 0.95);
        ctx.moveTo(-w * 0.6, w * 0.95);
        ctx.lineTo(w * 0.6, w * 0.95);
        ctx.stroke();
        break;
      }
      default:
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, 6.2832);
        ctx.fill();
    }
    ctx.restore();
  }

  function targetPos() {
    const er = emailEl.getBoundingClientRect();
    const sr = section.getBoundingClientRect();
    return { x: er.left - sr.left + er.width / 2, y: er.top - sr.top + er.height / 2 };
  }

  emailEl.addEventListener('pointerenter', () => { boost = 3; });
  emailEl.addEventListener('pointerleave', () => { boost = 1; });

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const t = targetPos();

    for (const p of parts) {
      const dx = t.x - p.x;
      const dy = t.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d;
      const uy = dy / d;
      // mıknatıs çekimi + teğetsel girdap bileşeni
      const pull = (Math.min(0.5, 30 / d) + 0.02) * 0.85 * boost;
      const swirl = Math.min(0.85, 120 / d) * 0.4;
      p.vx += ux * pull - uy * swirl * 0.32;
      p.vy += uy * pull + ux * swirl * 0.32;
      p.vx *= 0.945;
      p.vy *= 0.945;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr + Math.hypot(p.vx, p.vy) * 0.006;
      if (d < 26) Object.assign(p, spawn()); // adrese emildi, kenardan yeniden doğar
    }

    // sinir ağı: yakın damlalar arasında ince mürekkep bağları
    ctx.lineWidth = 1;
    for (let i = 0; i < parts.length; i += 1) {
      for (let j = i + 1; j < parts.length; j += 1) {
        const a = parts[i];
        const b = parts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(37,71,192,${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of parts) drawParticle(p);

    rafId = requestAnimationFrame(tick);
  }

  // yalnızca bölüm görünürken çalışır — boşa rAF yakmaz
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        resize();
        if (!parts.length) parts = Array.from({ length: COUNT }, spawn);
        rafId = requestAnimationFrame(tick);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    },
    { threshold: 0.12 }
  );
  io.observe(section);
  window.addEventListener('resize', () => { if (running) resize(); });

  // Tuvalin CSS kutusu inset:0 ile her reflow'da otomatik takip eder, ama
  // çizim çözünürlüğü (canvas.width/height) yalnızca JS ile güncellenir.
  // Mobilde .conversation__row 3 sütundan 1 sütuna yığılınca bölüm boyu
  // ciddi değişiyor ama bu bir 'resize' olayı tetiklemez (adres çubuğu
  // kayması, kırılma noktası geçişi vb.) — tuval gerilip girdap mail'in
  // üstünden kayardı. ResizeObserver, sebep ne olursa olsun asıl kutu
  // boyu değiştiğinde haber verir.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => { if (running) resize(); });
    ro.observe(section);
  }
}

/* --- görünüme girince çizilen mürekkep öğeleri (.ink-draw, .ink-swipe) --- */

function wireInkReveal() {
  const els = document.querySelectorAll('.ink-draw, .ink-swipe');
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inked');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.55 }
  );
  els.forEach((el) => io.observe(el));
}

if (!reduced) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      spawnDust();
      wireBursts();
      wireInkReveal();
      wireRocket();
      wireVortex();
    });
  } else {
    spawnDust();
    wireBursts();
    wireInkReveal();
    wireRocket();
    wireVortex();
  }
}
