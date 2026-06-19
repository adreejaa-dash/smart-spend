from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import re

from services.db import get_db
from services import openai_service

router = APIRouter()

CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Other"]


class CategorizeRequest(BaseModel):
    description: str


class AskRequest(BaseModel):
    question: str


def parse_question_filters(question: str) -> dict:
    """
    Simple keyword-based parser to extract date range and category from a question.
    Returns a MongoDB-compatible query dict.
    """
    query = {}
    now = datetime.utcnow()
    question_lower = question.lower()

    # --- Date parsing ---
    if "today" in question_lower:
        today = now.strftime("%Y-%m-%d")
        query["date"] = {"$gte": today, "$lte": today}
    elif "yesterday" in question_lower:
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        query["date"] = {"$gte": yesterday, "$lte": yesterday}
    elif "this week" in question_lower:
        week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
        query["date"] = {"$gte": week_start}
    elif "last week" in question_lower:
        last_week_end = (now - timedelta(days=now.weekday() + 1)).strftime("%Y-%m-%d")
        last_week_start = (now - timedelta(days=now.weekday() + 7)).strftime("%Y-%m-%d")
        query["date"] = {"$gte": last_week_start, "$lte": last_week_end}
    elif "this month" in question_lower:
        month_start = now.replace(day=1).strftime("%Y-%m-%d")
        query["date"] = {"$gte": month_start}
    elif "last month" in question_lower:
        first_of_this_month = now.replace(day=1)
        last_month_end = (first_of_this_month - timedelta(days=1)).strftime("%Y-%m-%d")
        last_month_start = (first_of_this_month - timedelta(days=1)).replace(day=1).strftime("%Y-%m-%d")
        query["date"] = {"$gte": last_month_start, "$lte": last_month_end}
    elif "this year" in question_lower:
        year_start = now.replace(month=1, day=1).strftime("%Y-%m-%d")
        query["date"] = {"$gte": year_start}
    elif "last year" in question_lower:
        last_year = now.year - 1
        query["date"] = {"$gte": f"{last_year}-01-01", "$lte": f"{last_year}-12-31"}
    else:
        # Check for month names
        months = {
            "january": "01", "february": "02", "march": "03", "april": "04",
            "may": "05", "june": "06", "july": "07", "august": "08",
            "september": "09", "october": "10", "november": "11", "december": "12"
        }
        for month_name, month_num in months.items():
            if month_name in question_lower:
                # Try to detect a year in the question
                year_match = re.search(r'\b(20\d{2})\b', question_lower)
                year = year_match.group(1) if year_match else str(now.year)
                query["date"] = {
                    "$gte": f"{year}-{month_num}-01",
                    "$lte": f"{year}-{month_num}-31",
                }
                break

    # --- Category parsing ---
    for cat in CATEGORIES:
        if cat.lower() in question_lower:
            query["category"] = cat
            break

    return query


@router.post("/categorize")
async def categorize(request: CategorizeRequest):
    if not request.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")
    try:
        category = await openai_service.categorize_description(request.description)
        return {"category": category}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/ask")
async def ask(request: AskRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        collection = get_db()

        # Parse date/category from question
        filters = parse_question_filters(request.question)

        # Fetch relevant expenses (limit to 200 for context window safety)
        cursor = collection.find(filters).sort("date", -1).limit(200)
        expenses = []
        async for doc in cursor:
            expenses.append({
                "date": doc.get("date", ""),
                "category": doc.get("category", ""),
                "amount": doc.get("amount", 0),
                "description": doc.get("description", ""),
            })

        # Get AI answer grounded in data
        answer = await openai_service.answer_question(request.question, expenses)
        return {"answer": answer, "expenses_analyzed": len(expenses)}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")
