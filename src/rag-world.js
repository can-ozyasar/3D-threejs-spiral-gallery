// rag-world.js — AXIOM Portal: teaser → ink-iris transition → a cinematic
// sky world. The chat itself is untouched — mountChatInterior/wireChatForm
// from rag-core.js are reused as-is, so the backend, security and bilingual
// wiring are exactly what they were before. Only the environment around it
// (sky, light, the ink-bird companion) is new.

import { on, ChatEvent } from "./chat-bus.js";
import { AXIOM_ICON, mountChatInterior, t } from "./rag-core.js";
import { createBird } from "./rag-bird.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Elle çizilmiş doodle siluetler — bulutların arkasında, uzakta süzülür.
// AXIOM'un kendisi artık ayrı, büyük bir mürekkep turnasıdır (rag-bird.js);
// bunlar sadece atmosferi dolduran uzak figürlerdir.
const SILHOUETTES = [
  { d: "M4,10 L28,4 L24,10 L28,16 Z", w: 32, h: 20 }, // kağıt uçak
  { d: "M14,2 L26,14 L14,26 L2,14 Z M14,2 L14,26 M2,14 L26,14", w: 28, h: 28 }, // uçurtma
  { d: "M2,14 C2,7 8,2 15,2 C22,2 28,7 28,14 M6,14 L2,20 M24,14 L28,20 M15,2 L15,-2", w: 30, h: 22 }, // kuş
];

// onClose: dünya veya teaser HER ne şekilde kapanırsa kapansın (× düğmesi,
// Escape, arka plana tıklama, "Vazgeç") çağrılır — FAB'ın kendi is-open
// durumunu tek bir yerden senkron tutması için.
export function buildAxiomPortal(onClose) {
  let hasEntered = false;
  let originEl = null;

  // ── Teaser ────────────────────────────────────────────────────────────
  const teaser = document.createElement("div");
  teaser.className = "rag-teaser";
  teaser.setAttribute("role", "dialog");
  teaser.setAttribute("aria-modal", "true");
  teaser.hidden = true;
  teaser.innerHTML = `
    <div class="rag-teaser__backdrop"></div>
    <div class="rag-teaser__card">
      <span class="rag-teaser__icon">${AXIOM_ICON}</span>
      <p class="rag-teaser__eyebrow"></p>
      <h2 class="rag-teaser__title"></h2>
      <p class="rag-teaser__body"></p>
      <div class="rag-teaser__actions">
        <button type="button" class="rag-teaser__enter"></button>
        <button type="button" class="rag-teaser__cancel"></button>
      </div>
    </div>`;
  document.body.appendChild(teaser);

  const teaserEls = {
    eyebrow: teaser.querySelector(".rag-teaser__eyebrow"),
    title: teaser.querySelector(".rag-teaser__title"),
    body: teaser.querySelector(".rag-teaser__body"),
    enter: teaser.querySelector(".rag-teaser__enter"),
    cancel: teaser.querySelector(".rag-teaser__cancel"),
  };

  function labelTeaser() {
    teaserEls.eyebrow.textContent = t("teaserEyebrow");
    teaserEls.title.textContent = t("teaserTitle");
    teaserEls.body.textContent = t("teaserBody");
    teaserEls.enter.textContent = t("teaserEnter");
    teaserEls.cancel.textContent = t("teaserCancel");
  }
  labelTeaser();

  // ── World ─────────────────────────────────────────────────────────────
  const world = document.createElement("div");
  world.className = "rag-world";
  world.setAttribute("role", "dialog");
  world.setAttribute("aria-modal", "true");
  world.hidden = true;

  const silhouetteMarkup = SILHOUETTES.map((s, i) => `
    <svg class="rag-world__silhouette rag-world__silhouette--${i}" viewBox="0 0 ${s.w} ${s.h}" aria-hidden="true">
      <path d="${s.d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`).join("");

  // Her bulut kendi elemanı — tek tekrarlayan bir doku değil, net kümülüs
  // siluetleri. Negatif animation-delay ile gökyüzü ilk kareden itibaren
  // zaten dağılmış görünür (hepsi soldan aynı anda başlamaz).
  const cloudMarkup = [
    { depth: "back", top: 8, scale: 1.05, dur: 52, delay: -6 },
    { depth: "back", top: 17, scale: 0.8, dur: 52, delay: -30 },
    { depth: "mid", top: 27, scale: 1.3, dur: 36, delay: -10 },
    { depth: "mid", top: 39, scale: 0.95, dur: 36, delay: -24 },
    { depth: "front", top: 52, scale: 1.55, dur: 24, delay: -4 },
    { depth: "front", top: 62, scale: 1.1, dur: 24, delay: -15 },
  ].map((c) => `
    <div class="rag-cloud rag-cloud--${c.depth}" style="top:${c.top}%; left:-14%; animation-duration:${c.dur}s; animation-delay:${c.delay}s;">
      <div class="rag-cloud-shape" style="transform:scale(${c.scale})"></div>
    </div>`).join("");

  world.innerHTML = `
    <div class="rag-world__sky" aria-hidden="true">
      <div class="rag-world__sun"></div>
      <div class="rag-world__silhouettes">${silhouetteMarkup}</div>
      ${cloudMarkup}
      <div class="ink-dust"></div>
      <div class="rag-world__haze"></div>
    </div>
    <button type="button" class="rag-world__close">
      <span aria-hidden="true">×</span>
    </button>
    <div class="rag-world__stage"></div>
    <div class="rag-world__chat">
      <div class="rag-world__chat-glass"></div>
    </div>`;
  document.body.appendChild(world);

  const stage = world.querySelector(".rag-world__stage");
  const chatRoot = world.querySelector(".rag-world__chat");
  const chat = mountChatInterior(chatRoot.querySelector(".rag-world__chat-glass"));
  chatRoot.querySelector(".rag-world__chat-glass").classList.add("rag-world__chat-interior");
  const closeBtn = world.querySelector(".rag-world__close");
  closeBtn.setAttribute("aria-label", t("worldClose"));

  const bird = createBird(stage, { reduced });

  // ── Karakter tepkileri — chat-bus üzerinden, rag-core'a hiç dokunmadan ──
  on(ChatEvent.LISTEN_START, () => bird.setMood("listening"));
  on(ChatEvent.LISTEN_END, () => bird.setMood("idle"));
  on(ChatEvent.REQUEST_SENT, () => bird.setMood("thinking"));
  on(ChatEvent.RESPONSE_RECEIVED, () => bird.setMood("pleased"));
  on(ChatEvent.ERROR, () => bird.setMood("uneasy"));

  // ── Portal geçişi — FAB'ın konumundan büyüyen bir mürekkep çemberi ──────
  function positionIris() {
    if (!originEl) return;
    const r = originEl.getBoundingClientRect();
    world.style.setProperty("--iris-x", `${r.left + r.width / 2}px`);
    world.style.setProperty("--iris-y", `${r.top + r.height / 2}px`);
  }

  function openTeaserOrWorld(origin) {
    originEl = origin;
    if (hasEntered) {
      openWorld();
      return;
    }
    teaser.hidden = false;
    requestAnimationFrame(() => teaser.classList.add("is-open"));
    teaserEls.enter.focus();
  }

  function closeTeaser(notify = true) {
    teaser.classList.remove("is-open");
    setTimeout(() => { teaser.hidden = true; }, reduced ? 0 : 320);
    if (notify) onClose && onClose();
  }

  function openWorld() {
    const firstEntrance = !hasEntered;
    hasEntered = true;
    positionIris();
    world.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => world.classList.add("is-open")));
    bird.wake(firstEntrance);
    // Sahne düzeni: gökyüzü açılır → kuş süzülür → sohbet camı yükselir (sinematik giriş).
    const chatDelay = reduced ? 0 : firstEntrance ? 1000 : 420;
    setTimeout(() => chatRoot.classList.add("is-risen"), chatDelay);
    setTimeout(() => chat.input.focus(), chatDelay + (reduced ? 40 : 260));
  }

  // Kapanış çemberi geri sarmaz (clip-path'i tersine çevirmek opacity ile
  // yarışır) — .is-open'ı KORUYUP üstüne .is-closing eklenir, böylece
  // clip-path 150%'de sabit kalır ve yalnızca opacity temiz biçimde söner.
  function closeWorld(notify = true) {
    world.classList.add("is-closing");
    chatRoot.classList.remove("is-risen");
    bird.sleep();
    setTimeout(() => {
      world.hidden = true;
      world.classList.remove("is-open", "is-closing");
    }, reduced ? 0 : 280);
    if (notify) onClose && onClose();
  }

  teaserEls.enter.addEventListener("click", () => { closeTeaser(false); openWorld(); });
  teaserEls.cancel.addEventListener("click", () => closeTeaser());
  teaser.querySelector(".rag-teaser__backdrop").addEventListener("click", () => closeTeaser());
  closeBtn.addEventListener("click", () => closeWorld());

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!teaser.hidden) closeTeaser();
    else if (!world.hidden) closeWorld();
  });

  // Dil değişince teaser'ı da yeniden etiketle (rag-core zaten chat'i kendi güncelliyor).
  document.addEventListener("click", (e) => {
    if (e.target.id === "lang-toggle") {
      setTimeout(() => {
        labelTeaser();
        closeBtn.setAttribute("aria-label", t("worldClose"));
      }, 50);
    }
  });

  return {
    chat,
    closeBtn,
    openTeaserOrWorld,
    closeWorld: () => closeWorld(false),
  };
}
