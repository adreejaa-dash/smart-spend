from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from models.expense import ExpenseCreate, ExpenseUpdate
from services.db import get_db

router = APIRouter()


def expense_serializer(expense: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    created_at = expense.get("createdAt", None)
    if isinstance(created_at, datetime):
        created_at_str = created_at.isoformat()
    elif isinstance(created_at, str):
        created_at_str = created_at
    else:
        created_at_str = datetime.now(timezone.utc).isoformat()

    return {
        "id": str(expense["_id"]),
        "amount": expense["amount"],
        "category": expense["category"],
        "description": expense["description"],
        "date": expense["date"],
        "createdAt": created_at_str,
    }


@router.post("/expenses", status_code=201)
async def create_expense(expense: ExpenseCreate):
    try:
        collection = get_db()
        doc = expense.model_dump()
        doc["createdAt"] = datetime.now(timezone.utc)
        result = await collection.insert_one(doc)
        created = await collection.find_one({"_id": result.inserted_id})
        return expense_serializer(created)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create expense: {str(e)}")


@router.get("/expenses")
async def list_expenses(
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    try:
        collection = get_db()
        query = {}
        if category:
            query["category"] = category
        if start_date or end_date:
            query["date"] = {}
            if start_date:
                query["date"]["$gte"] = start_date
            if end_date:
                query["date"]["$lte"] = end_date

        cursor = collection.find(query).sort("date", -1)
        expenses = []
        async for doc in cursor:
            expenses.append(expense_serializer(doc))
        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch expenses: {str(e)}")


@router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, update: ExpenseUpdate):
    try:
        collection = get_db()
        obj_id = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        result = await collection.update_one({"_id": obj_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        updated = await collection.find_one({"_id": obj_id})
        return expense_serializer(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update expense: {str(e)}")


@router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(expense_id: str):
    try:
        obj_id = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    try:
        collection = get_db()
        result = await collection.delete_one({"_id": obj_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete expense: {str(e)}")
