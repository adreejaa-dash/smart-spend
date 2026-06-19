from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class Category(str, Enum):
    Food = "Food"
    Transport = "Transport"
    Bills = "Bills"
    Shopping = "Shopping"
    Entertainment = "Entertainment"
    Health = "Health"
    Other = "Other"


class ExpenseCreate(BaseModel):
    amount: float
    category: Category
    description: str
    date: str  # ISO date string e.g. "2026-06-15"


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[Category] = None
    description: Optional[str] = None
    date: Optional[str] = None


class ExpenseOut(BaseModel):
    id: str
    amount: float
    category: str
    description: str
    date: str
    createdAt: datetime

    class Config:
        populate_by_name = True
