// rag-core.js — AXIOM shared chat logic, reused by the corner FAB (rag.js)
// and the intro-gate floating island (rag-gate.js). Connects to the FastAPI
// backend at /api/chat. Bilingual: respects the lang toggle from i18n.js.
// Emits chat-bus lifecycle events so character.js can react to the chat
// without either side importing the other.

import { emit, ChatEvent } from "./chat-bus.js";

const RAG_URL = import.meta.env.VITE_RAG_URL || "";
export const SESSION_ID = crypto.randomUUID();

const UI = {
  tr: {
    title: "AXIOM",
    subtitle: "Yalnızca arşiv bilgileri",
    placeholder: "Can'ın projeleri, deneyimi veya becerileri hakkında sor…",
    send: "Gönder",
    thinking: "AXIOM arşivleri taranıyor…",
    error429: "Çok fazla soru. Lütfen bir dakika bekleyin.",
    error400: "AXIOM bu girdiyi tanımıyor. Lütfen sorunuzu yeniden yazın.",
    errorGeneric: "AXIOM şu an ulaşılamıyor. Daha sonra tekrar deneyin.",
    welcome:
      "Merhaba. Ben AXIOM — Can Özyaşar'ın araştırmalarını, projelerini ve deneyimlerini sessizce izleyen dijital izdüşümüyüm. Ne öğrenmek istersin?",
  },
  en: {
    title: "AXIOM",
    subtitle: "Archive knowledge only",
    placeholder: "Ask about Can's projects, experience or skills…",
    send: "Send",
    thinking: "AXIOM scanning archives…",
    error429: "Too many questions. Please wait a minute.",
    error400:
      "AXIOM does not recognise that input. Please rephrase your question.",
    errorGeneric: "AXIOM is unreachable right now. Try again later.",
    welcome:
      "Greetings. I am AXIOM — the digital presence who quietly watches over Can Özyaşar's research, projects, and experience. What would you like to know?",
  },
};

export function getLang() {
  return document.documentElement.lang === "en" ? "en" : "tr";
}
export function t(key) {
  return UI[getLang()][key] || UI.tr[key];
}

// ─── AXIOM icon — ring with a glowing core, mirrors the nav's `.nav__mark` motif
export const AXIOM_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="4" fill="currentColor"/>
</svg>`;

// ─── Message rendering ─────────────────────────────────────────────────────────
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function addMessage(container, text, role) {
  const el = document.createElement("div");
  el.className = `rag-message rag-message--${role}`;
  if (role === "assistant") {
    el.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
  } else {
    el.textContent = text;
  }
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

export function addTyping(container) {
  const el = document.createElement("div");
  el.className = "rag-message rag-message--assistant rag-message--typing";
  el.innerHTML = `<span class="rag-typing-icon">${AXIOM_ICON}</span><span></span><span></span><span></span>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

// ─── API call ─────────────────────────────────────────────────────────────────
export async function fetchAnswer(question) {
  const res = await fetch(`${RAG_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, session_id: SESSION_ID }),
  });

  if (res.status === 429) throw new Error("429");
  if (res.status === 400) throw new Error("400");
  if (!res.ok) throw new Error("generic");

  const data = await res.json();
  return data.answer;
}

// ─── Shared interior DOM (header/messages/form) ────────────────────────────────
// Scoped via root.querySelector (no ids) so multiple chat surfaces (FAB panel +
// gate island) can coexist in the DOM without id collisions.
export function mountChatInterior(root) {
  root.innerHTML = `
    <div class="rag-header">
      <div class="rag-header-identity">
        <span class="rag-icon">${AXIOM_ICON}</span>
        <div>
          <span class="rag-title"></span>
          <span class="rag-subtitle"></span>
        </div>
      </div>
      <button class="rag-close" type="button" aria-label="Kapat">×</button>
    </div>
    <div class="rag-messages" aria-live="polite"></div>
    <form class="rag-form" autocomplete="off">
      <input class="rag-input" type="text" maxlength="500" required />
      <button class="rag-send" type="submit" aria-label="Gönder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>`;

  return {
    root,
    titleEl: root.querySelector(".rag-title"),
    subtitleEl: root.querySelector(".rag-subtitle"),
    closeBtn: root.querySelector(".rag-close"),
    messages: root.querySelector(".rag-messages"),
    form: root.querySelector(".rag-form"),
    input: root.querySelector(".rag-input"),
    sendBtn: root.querySelector(".rag-send"),
  };
}

export function updateLabels(chat) {
  chat.titleEl.textContent = t("title");
  chat.subtitleEl.textContent = t("subtitle");
  chat.input.placeholder = t("placeholder");
  chat.sendBtn.setAttribute("aria-label", t("send"));
}

export function showWelcomeIfEmpty(chat) {
  if (chat.messages.children.length === 0) {
    addMessage(chat.messages, t("welcome"), "assistant");
    emit(ChatEvent.WELCOME_SHOWN);
  }
}

// ─── Submit + focus/blur wiring, shared by every chat surface ─────────────────
export function wireChatForm(chat) {
  chat.input.addEventListener("focus", () => emit(ChatEvent.LISTEN_START));
  chat.input.addEventListener("blur", () => emit(ChatEvent.LISTEN_END));

  chat.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = chat.input.value.trim();
    if (!question) return;

    addMessage(chat.messages, question, "user");
    chat.input.value = "";
    chat.input.disabled = true;
    chat.sendBtn.disabled = true;

    emit(ChatEvent.REQUEST_SENT, { question });
    const typing = addTyping(chat.messages);

    try {
      const answer = await fetchAnswer(question);
      typing.remove();
      addMessage(chat.messages, answer, "assistant");
      emit(ChatEvent.RESPONSE_RECEIVED, { length: answer.length });
    } catch (err) {
      typing.remove();
      const code = err.message;
      const msg =
        code === "429" ? t("error429") : code === "400" ? t("error400") : t("errorGeneric");
      addMessage(chat.messages, msg, "error");
      emit(ChatEvent.ERROR, { code });
    } finally {
      chat.input.disabled = false;
      chat.sendBtn.disabled = false;
      chat.input.focus();
    }
  });

  // Re-label on language switch
  document.addEventListener("click", (e) => {
    if (e.target.id === "lang-toggle") {
      setTimeout(() => updateLabels(chat), 50);
    }
  });
}
