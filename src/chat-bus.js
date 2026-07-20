// chat-bus.js — tiny decoupling layer between the chat UI (rag.js/rag-gate.js)
// and the 3D character (character.js). Neither side imports the other.

export const ChatEvent = Object.freeze({
  OPENED: "axiom:chat-opened",
  CLOSED: "axiom:chat-closed",
  WELCOME_SHOWN: "axiom:welcome-shown",
  LISTEN_START: "axiom:listen-start",
  LISTEN_END: "axiom:listen-end",
  REQUEST_SENT: "axiom:request-sent",
  RESPONSE_RECEIVED: "axiom:response-received",
  ERROR: "axiom:error",
});

export function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler) {
  document.addEventListener(name, handler);
  return () => document.removeEventListener(name, handler);
}
