from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta

from services.db import get_db

router = APIRouter()


@router.get("/analytics/category-summary")
async def category_summary():
    """Aggregate total spend per category using MongoDB $group pipeline."""
    try:
        collection = get_db()
        pipeline = [
            {
                "$group": {
                    "_id": "$category",
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"total": -1}},
        ]
        results = []
        async for doc in collection.aggregate(pipeline):
            results.append({
                "category": doc["_id"],
                "total": round(doc["total"], 2),
                "count": doc["count"],
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch category summary: {str(e)}")


@router.get("/analytics/monthly-trend")
async def monthly_trend():
    """Aggregate total spend grouped by month for the last 12 months."""
    try:
        collection = get_db()
        # Calculate date 12 months ago
        twelve_months_ago = (datetime.utcnow() - timedelta(days=365)).strftime("%Y-%m-%d")

        pipeline = [
            # Filter to last 12 months
            {"$match": {"date": {"$gte": twelve_months_ago}}},
            # Extract year and month from the date string
            {
                "$addFields": {
                    "yearMonth": {"$substr": ["$date", 0, 7]}  # "YYYY-MM"
                }
            },
            {
                "$group": {
                    "_id": "$yearMonth",
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        results = []
        async for doc in collection.aggregate(pipeline):
            results.append({
                "month": doc["_id"],  # "YYYY-MM"
                "total": round(doc["total"], 2),
                "count": doc["count"],
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch monthly trend: {str(e)}")
