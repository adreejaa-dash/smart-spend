from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routes.expenses import router as expenses_router
from routes.analytics import router as analytics_router
from routes.ai import router as ai_router

app = FastAPI(
    title="SmartSpend API",
    description="AI-powered expense tracker backend",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# Build the list of explicitly allowed origins.
# Always include local dev servers; add the production Vercel URL from env.
#
# IMPORTANT: allow_credentials=True is incompatible with allow_origins=["*"]
# per the CORS spec (browsers reject it). We therefore always build an explicit
# origin list. If FRONTEND_URL is not set on Render, OPTIONS preflight from
# Vercel returns 400 because the origin won't match — so FRONTEND_URL MUST
# be set in Render environment variables.
# ---------------------------------------------------------------------------

_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

_frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if _frontend_url:
    _allowed_origins.append(_frontend_url)
    # Accept both www and non-www variants
    if _frontend_url.startswith("https://") and not _frontend_url.startswith("https://www."):
        _allowed_origins.append(_frontend_url.replace("https://", "https://www.", 1))

# Log allowed origins at startup so you can verify in Render logs
print(f"[CORS] Allowed origins: {_allowed_origins}", flush=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register routers
app.include_router(expenses_router, tags=["Expenses"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(ai_router, tags=["AI"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "message": "SmartSpend API is running",
        "cors_origins": _allowed_origins,   # visible in browser / curl for debugging
    }
