// rag.js — AXIOM corner FAB. Owns only the toggle button and its open/closed
// bookkeeping; the actual chat surface (teaser → portal → sky world) lives in
// rag-world.js. Same button id/behavior as before, now opening onto the
// AXIOM Portal instead of a plain slide-out panel.

import { emit, ChatEvent } from "./chat-bus.js";
import { AXIOM_ICON, updateLabels, showWelcomeIfEmpty, wireChatForm } from "./rag-core.js";
import { buildAxiomPortal } from "./rag-world.js";

function buildToggle() {
  const toggle = document.createElement("button");
  toggle.id = "rag-toggle";
  toggle.setAttribute("aria-label", "AXIOM asistanını aç");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = AXIOM_ICON;
  document.body.appendChild(toggle);
  return toggle;
}

function initRAG() {
  const toggle = buildToggle();
  let isOpen = false;

  function setClosed() {
    isOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
    emit(ChatEvent.CLOSED);
  }

  const portal = buildAxiomPortal(setClosed);
  const chat = portal.chat;

  function open() {
    isOpen = true;
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    updateLabels(chat);
    showWelcomeIfEmpty(chat);
    emit(ChatEvent.OPENED);
    portal.openTeaserOrWorld(toggle);
  }

  function close() {
    portal.closeWorld();
    setClosed();
  }

  toggle.addEventListener("click", () => (isOpen ? close() : open()));
  chat.closeBtn.addEventListener("click", close);

  wireChatForm(chat);

  // Hide the FAB while the intro-gate is in view — the gate has its own
  // always-visible island chat surface (rag-gate.js), no need for both at once.
  const gate = document.getElementById("intro-gate");
  if (gate) {
    const observer = new IntersectionObserver(
      ([entry]) => document.body.classList.toggle("intro-gate-active", entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(gate);
  }
}

document.addEventListener("DOMContentLoaded", initRAG);
