// rag-gate.js — AXIOM's floating "island" chat panel inside the intro-gate.
// Thin shell around rag-core.js's shared chat logic/DOM, always visible
// (no open/close toggle) since it's the centerpiece of the intro screen.

import { emit, ChatEvent } from "./chat-bus.js";
import {
  mountChatInterior,
  updateLabels,
  showWelcomeIfEmpty,
  wireChatForm,
} from "./rag-core.js";

function initGate() {
  const stage = document.querySelector(".intro-gate:not([hidden]) .intro-gate__stage");
  if (!stage) return;

  const island = document.createElement("div");
  island.className = "axiom-island";
  island.setAttribute("role", "dialog");
  island.setAttribute("aria-label", "AXIOM Sohbet Asistanı");
  stage.appendChild(island);

  const chat = mountChatInterior(island);
  updateLabels(chat);
  showWelcomeIfEmpty(chat);
  emit(ChatEvent.OPENED);
  wireChatForm(chat);
}

document.addEventListener("DOMContentLoaded", initGate);
