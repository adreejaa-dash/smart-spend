from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware   
from dotenv import load_dotenv

load_dotenv()

from routes.expenses import router as expenses_router
from routes.analytics import router as analytics_router
from routes.ai import router as ai_router

app = FastAPI(
    title="SmartSpend API",
    description="AI-powered expense tracker backend",
    version="1.0.0",
)

# CORS — allow the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(expenses_router, tags=["Expenses"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(ai_router, tags=["AI"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "SmartSpend API is running"}
