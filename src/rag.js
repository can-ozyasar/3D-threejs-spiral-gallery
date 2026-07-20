// rag.js — AXIOM corner chat widget (FAB + slide-out panel).
// Thin shell around rag-core.js's shared chat logic/DOM. Same DOM ids and
// visual behavior as before; now also emits chat-bus events like every
// other AXIOM chat surface (see chat-bus.js / character.js).

import { emit, ChatEvent } from "./chat-bus.js";
import {
  AXIOM_ICON,
  mountChatInterior,
  updateLabels,
  showWelcomeIfEmpty,
  wireChatForm,
} from "./rag-core.js";

function buildWidget() {
  const toggle = document.createElement("button");
  toggle.id = "rag-toggle";
  toggle.setAttribute("aria-label", "AXIOM asistanını aç");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = AXIOM_ICON;

  const panel = document.createElement("div");
  panel.id = "rag-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "AXIOM Sohbet Asistanı");
  panel.setAttribute("aria-hidden", "true");

  document.body.appendChild(toggle);
  document.body.appendChild(panel);
  return { toggle, panel };
}

function initRAG() {
  const { toggle, panel } = buildWidget();
  const chat = mountChatInterior(panel);
  let isOpen = false;

  function openPanel() {
    isOpen = true;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    updateLabels(chat);
    showWelcomeIfEmpty(chat);
    emit(ChatEvent.OPENED);
    setTimeout(() => chat.input.focus(), 300);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
    emit(ChatEvent.CLOSED);
  }

  toggle.addEventListener("click", () => (isOpen ? closePanel() : openPanel()));
  chat.closeBtn.addEventListener("click", closePanel);

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
