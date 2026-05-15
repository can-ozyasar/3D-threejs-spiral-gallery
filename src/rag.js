// rag.js — Portfolio RAG chat widget
// Connects to the FastAPI backend at /api/chat
// Bilingual: respects the lang toggle from i18n.js

const RAG_URL = import.meta.env.VITE_RAG_URL || "http://localhost:8000";

const SESSION_ID = crypto.randomUUID();

const UI = {
  tr: {
    title: "Can'a Sor",
    subtitle: "YZ Asistan — Yalnızca CV bilgileri",
    placeholder: "Proje, deneyim veya beceriler hakkında sor…",
    send: "Gönder",
    thinking: "Düşünüyor…",
    error429: "Çok fazla soru. Lütfen bir dakika bekleyin.",
    error400: "Geçersiz giriş. Lütfen sorunuzu yeniden yazın.",
    errorGeneric: "Sunucuya bağlanılamadı. Daha sonra tekrar deneyin.",
    welcome:
      "Merhaba! Can'ın projeleri, deneyimi veya becerileri hakkında soru sorabilirsin.",
  },
  en: {
    title: "Ask Can",
    subtitle: "AI Assistant — CV content only",
    placeholder: "Ask about projects, experience or skills…",
    send: "Send",
    thinking: "Thinking…",
    error429: "Too many questions. Please wait a minute.",
    error400: "Invalid input. Please rephrase your question.",
    errorGeneric: "Could not reach the server. Try again later.",
    welcome:
      "Hi! You can ask me about Can's projects, experience, or technical skills.",
  },
};

function getLang() {
  return document.documentElement.lang === "en" ? "en" : "tr";
}

function t(key) {
  return UI[getLang()][key] || UI.tr[key];
}

// ─── Build DOM ────────────────────────────────────────────────────────────────
function buildWidget() {
  // Toggle button
  const toggle = document.createElement("button");
  toggle.id = "rag-toggle";
  toggle.setAttribute("aria-label", "RAG asistanı aç");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;

  // Panel
  const panel = document.createElement("div");
  panel.id = "rag-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "RAG Asistan");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="rag-header">
      <div>
        <span class="rag-title" id="rag-title"></span>
        <span class="rag-subtitle" id="rag-subtitle"></span>
      </div>
      <button class="rag-close" id="rag-close" aria-label="Kapat">×</button>
    </div>
    <div class="rag-messages" id="rag-messages" aria-live="polite"></div>
    <form class="rag-form" id="rag-form" autocomplete="off">
      <input
        class="rag-input"
        id="rag-input"
        type="text"
        maxlength="500"
        required
      />
      <button class="rag-send" id="rag-send" type="submit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>`;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);
  return { toggle, panel };
}

// ─── Messages ─────────────────────────────────────────────────────────────────
function addMessage(container, text, role) {
  const el = document.createElement("div");
  el.className = `rag-message rag-message--${role}`;
  el.textContent = text;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function addTyping(container) {
  const el = document.createElement("div");
  el.className = "rag-message rag-message--assistant rag-message--typing";
  el.innerHTML = `<span></span><span></span><span></span>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

// ─── API call ─────────────────────────────────────────────────────────────────
async function fetchAnswer(question) {
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

// ─── Init ─────────────────────────────────────────────────────────────────────
function initRAG() {
  const { toggle, panel } = buildWidget();
  const messages = document.getElementById("rag-messages");
  const form = document.getElementById("rag-form");
  const input = document.getElementById("rag-input");
  const sendBtn = document.getElementById("rag-send");
  const closeBtn = document.getElementById("rag-close");
  let isOpen = false;

  function updateLabels() {
    document.getElementById("rag-title").textContent = t("title");
    document.getElementById("rag-subtitle").textContent = t("subtitle");
    input.placeholder = t("placeholder");
    sendBtn.setAttribute("aria-label", t("send"));
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.classList.add("is-open");
    updateLabels();
    if (messages.children.length === 0) {
      addMessage(messages, t("welcome"), "assistant");
    }
    setTimeout(() => input.focus(), 300);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.classList.remove("is-open");
  }

  toggle.addEventListener("click", () => (isOpen ? closePanel() : openPanel()));
  closeBtn.addEventListener("click", closePanel);

  // Re-label on language switch
  document.addEventListener("click", (e) => {
    if (e.target.id === "lang-toggle" && isOpen) {
      setTimeout(updateLabels, 50);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    addMessage(messages, question, "user");
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;

    const typing = addTyping(messages);

    try {
      const answer = await fetchAnswer(question);
      typing.remove();
      addMessage(messages, answer, "assistant");
    } catch (err) {
      typing.remove();
      const code = err.message;
      const msg =
        code === "429"
          ? t("error429")
          : code === "400"
          ? t("error400")
          : t("errorGeneric");
      addMessage(messages, msg, "error");
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", initRAG);
