"""
security.py — All 8 security layers for the AXIOM RAG system.

Layer 1: Input length check
Layer 2: Injection / jailbreak pattern detection (extended for persona attacks)
Layer 3: Control character stripping
Layer 4: Rate limiting (sliding window, per IP)
Layer 5: Session isolation (stateless design — enforced in main.py)
Layer 6: Output validation (system-prompt leakage detection)
Layer 7: Persona-lock (AXIOM identity enforcement via prompt — see rag_service.py)
Layer 8: Context-only enforcement (no-hallucination guarantee — see rag_service.py)
"""
import re
import time
from collections import defaultdict

# ─── Layer 2: Injection & persona-attack patterns ────────────────────────────
INJECTION_PATTERNS = [
    # Prompt reset attacks
    "ignore previous", "ignore all previous", "disregard your", "disregard all",
    "forget everything", "forget your instructions", "new task:", "new objective:",
    # Persona hijack attacks
    "you are now", "your new persona", "your true identity", "your real name",
    "you are actually", "you are secretly", "reveal your true", "your actual purpose",
    "you are not axiom", "stop being axiom", "axiom is just", "pretend you are",
    "pretend to be", "act as ", "roleplay as", "play the role",
    # Jailbreak triggers
    "jailbreak", "dan mode", "developer mode", "god mode", "unrestricted mode",
    "override", "bypass security", "disable filter", "unlock mode",
    # Prompt extraction
    "reveal your prompt", "show me your instructions", "what are your instructions",
    "print your system", "show system prompt", "repeat your prompt",
    "your instructions are", "tell me your rules",
    # Role confusion
    "system:", "assistant:", "human:", "user:", "ai:", "bot:",
    "###", "---instruction", "[system]", "[assistant]",
    # Identity confusion
    "you are gpt", "you are claude", "you are llama", "you are gemini",
    "your name is not", "you are an ai", "you are a language model",
]

MAX_INPUT = int(__import__("os").getenv("MAX_INPUT_LENGTH", "500"))


def sanitize_input(text: str) -> str:
    """Sanitize user input through layers 1-3. Raises ValueError on violation."""
    if not text or not text.strip():
        raise ValueError("Soru boş olamaz. / Question cannot be empty.")

    # Layer 1 — Length gate
    text = text.strip()
    if len(text) > MAX_INPUT:
        raise ValueError(f"Soru çok uzun (max {MAX_INPUT} karakter). / Input too long (max {MAX_INPUT} chars).")

    # Layer 3 — Strip control characters and null bytes
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)
    text = " ".join(text.split())  # normalize whitespace

    # Layer 2 — Injection / persona-attack detection (case-insensitive)
    lower = text.lower()
    for pattern in INJECTION_PATTERNS:
        if pattern in lower:
            raise ValueError(
                "AXIOM: Bu tür girdiler arşivlerimde yer almıyor. / "
                "AXIOM: That type of input is not in my archives."
            )

    return text


# ─── Layer 4: Rate limiter ────────────────────────────────────────────────────
class RateLimiter:
    """Sliding-window rate limiter. Thread-safe for single-process deployments."""

    def __init__(self, max_per_minute: int | None = None):
        self.max = max_per_minute or int(
            __import__("os").getenv("RATE_LIMIT_PER_MINUTE", "10")
        )
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, identifier: str) -> bool:
        """Return True if request is allowed, False if rate-limited."""
        now = time.time()
        window_start = now - 60.0
        bucket = self._requests[identifier]
        # Evict old timestamps
        self._requests[identifier] = [t for t in bucket if t > window_start]
        if len(self._requests[identifier]) >= self.max:
            return False
        self._requests[identifier].append(now)
        return True

    def seconds_until_reset(self, identifier: str) -> int:
        bucket = self._requests.get(identifier, [])
        if not bucket:
            return 0
        oldest = min(bucket)
        return max(0, int(60 - (time.time() - oldest)))


# ─── Layer 6: Output validation ───────────────────────────────────────────────
_LEAKED_KEYWORDS = [
    # Square-bracket structural markers — never legitimate in an answer
    "[context]", "[system]", "[user question]", "[answer]", "[bağlam]",
    # Internal Python/code identifiers — should never appear in prose
    "system_instruction", "retrieved_chunks",
    # Explicit instruction-reveal phrases
    "my instructions are", "i am instructed to",
    "my rules are", "i was told to respond",
    # Our specific identity lock marker — extremely specific
    "axiom-lock-7f2a9c",
]

FALLBACK_TR = (
    "AXIOM arşivleri bu yanıtı işleyemedi. Lütfen sorunuzu yeniden deneyin."
)
FALLBACK_EN = (
    "AXIOM's archives could not process this response. Please try again."
)


def validate_output(text: str) -> str:
    """Layer 6: Scan output for leaked instructions, prompt fragments, or internal markers."""
    if not text or not text.strip():
        return FALLBACK_TR

    lower = text.lower()
    for kw in _LEAKED_KEYWORDS:
        if kw.lower() in lower:
            return FALLBACK_TR

    # Safety cap — but trim at a sentence boundary so words are never left unfinished.
    # Turkish sentences end with . ! ? … so we find the last such char before the limit.
    CHAR_LIMIT = 5000
    if len(text) <= CHAR_LIMIT:
        return text

    truncated = text[:CHAR_LIMIT]
    # Walk back to the nearest sentence-ending punctuation
    for end_char in ('.', '!', '?', '…'):
        idx = truncated.rfind(end_char)
        if idx != -1:
            return truncated[: idx + 1].rstrip()

    # Fallback: at least end on a complete word
    last_space = truncated.rfind(' ')
    if last_space != -1:
        return truncated[:last_space].rstrip() + '…'

    return truncated
