// rag.js — AXIOM: The Iron Owl — Portfolio RAG chat widget
// Connects to the FastAPI backend at /api/chat
// Bilingual: respects the lang toggle from i18n.js

const RAG_URL = import.meta.env.VITE_RAG_URL || "";
const SESSION_ID = crypto.randomUUID();

const UI = {
  tr: {
    title: "AXIOM",
    subtitle: "Demir Baykuş · Yalnızca arşiv bilgileri",
    placeholder: "Can'ın projeleri, deneyimi veya becerileri hakkında sor…",
    send: "Gönder",
    thinking: "AXIOM arşivleri taranıyor…",
    error429: "Çok fazla soru. Lütfen bir dakika bekleyin.",
    error400:
      "AXIOM bu girdiyi tanımıyor. Lütfen sorunuzu yeniden yazın.",
    errorGeneric: "AXIOM şu an ulaşılamıyor. Daha sonra tekrar deneyin.",
    welcome:
      "Merhaba. Ben AXIOM — Can Özyaşar'ın araştırmalarını, projelerini ve deneyimlerini sessizce gözlemleyen demir baykuşum. Ne öğrenmek istiyorsun?",
  },
  en: {
    title: "AXIOM",
    subtitle: "The Iron Owl · Archive knowledge only",
    placeholder: "Ask about Can's projects, experience or skills…",
    send: "Send",
    thinking: "AXIOM scanning archives…",
    error429: "Too many questions. Please wait a minute.",
    error400:
      "AXIOM does not recognise that input. Please rephrase your question.",
    errorGeneric: "AXIOM is unreachable right now. Try again later.",
    welcome:
      "Greetings. I am AXIOM — the iron owl who has silently observed every line of Can Özyaşar's research, projects, and experience. What would you like to know?",
  },
};

function getLang() {
  return document.documentElement.lang === "en" ? "en" : "tr";
}
function t(key) {
  return UI[getLang()][key] || UI.tr[key];
}

// ─── Owl SVG icon ─────────────────────────────────────────────────────────────
const OWL_SVG = `<svg width="22" height="22" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="36" rx="18" ry="22" fill="currentColor" opacity="0.15"/>
  <path d="M14 36C14 25 22 14 32 14C42 14 50 25 50 36C50 49 42 56 32 56C22 56 14 49 14 36Z" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="24" cy="32" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="40" cy="32" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="24" cy="32" r="2.5" fill="currentColor"/>
  <circle cx="40" cy="32" r="2.5" fill="currentColor"/>
  <path d="M28 38 Q32 42 36 38" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M20 18 L14 10 L22 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M44 18 L50 10 L42 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26 44 L24 52 M38 44 L40 52" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

// ─── Build DOM ────────────────────────────────────────────────────────────────
function buildWidget() {
  const toggle = document.createElement("button");
  toggle.id = "rag-toggle";
  toggle.setAttribute("aria-label", "AXIOM — Demir Baykuş asistanı aç");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = OWL_SVG;

  const panel = document.createElement("div");
  panel.id = "rag-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "AXIOM RAG Asistan");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="rag-header">
      <div class="rag-header-identity">
        <span class="rag-owl-icon">${OWL_SVG}</span>
        <div>
          <span class="rag-title" id="rag-title"></span>
          <span class="rag-subtitle" id="rag-subtitle"></span>
        </div>
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
      <button class="rag-send" id="rag-send" type="submit" aria-label="Gönder">
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
  // Use innerHTML for assistant messages to support line breaks in long answers
  if (role === "assistant") {
    // Convert newlines to <br> for readability
    el.innerHTML = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  } else {
    el.textContent = text;
  }
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function addTyping(container) {
  const el = document.createElement("div");
  el.className = "rag-message rag-message--assistant rag-message--typing";
  el.innerHTML = `<span class="rag-typing-owl">${OWL_SVG}</span><span></span><span></span><span></span>`;
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
