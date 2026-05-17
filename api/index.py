"""
main.py — FastAPI application entry point.

Security layers applied per request:
  1-3. Input sanitization (security.py → sanitize_input)
  4.   Rate limiting (security.py → RateLimiter, per IP)
  5.   Session isolation (stateless: no cross-request context)
  6.   Output validation (security.py → validate_output)
"""
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

from api.security import RateLimiter, sanitize_input, validate_output
from api.rag_service import get_service

logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(message)s")
logger = logging.getLogger(__name__)

# ─── Startup / shutdown ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Building RAG index...")
    svc = get_service()
    logger.info("RAG index ready — server is accepting requests.")
    yield
    logger.info("Shutting down.")


# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Can Özyaşar — Portfolio RAG API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,   # Disable Swagger UI in production
    redoc_url=None,
)

# ─── CORS (Layer 5 complement) ───────────────────────────────────────────────
_allowed_origins = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,https://canozyasar.dev,https://www.canozyasar.dev",
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

# ─── Rate limiter (Layer 4) ──────────────────────────────────────────────────
_limiter = RateLimiter()


# ─── Schema ──────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=600)
    session_id: str = Field(default="anonymous", max_length=64)


class ChatResponse(BaseModel):
    answer: str


# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    svc = get_service()
    return {"status": "ok", "indexed_chunks": len(svc._chunk_embeddings)}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest):
    ip = request.client.host or "unknown"

    # Layer 4 — Rate limit
    if not _limiter.check(ip):
        wait = _limiter.seconds_until_reset(ip)
        raise HTTPException(
            status_code=429,
            detail=f"Çok fazla istek. {wait} saniye sonra tekrar deneyin. "
                   f"/ Too many requests. Try again in {wait} seconds.",
        )

    # Layers 1-3 — Sanitize
    try:
        clean_question = sanitize_input(body.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Layer 5 — Stateless: no session history stored or passed to LLM
    try:
        svc = get_service()
        raw_answer = svc.chat(clean_question)
    except Exception as e:
        logger.error(f"RAG error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Yanıt oluşturulurken bir hata oluştu. / An error occurred.",
        )

    # Layer 6 — Validate output
    answer = validate_output(raw_answer)

    return ChatResponse(answer=answer)


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )
