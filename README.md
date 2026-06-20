# SmartSpend — AI-Powered Expense Tracker

A full-stack personal finance app with AI-powered expense categorization and natural-language Q&A, powered by FastAPI, MongoDB, OpenAI, and React.

---

## Project Structure

```
smartspend/  
├── backend/        FastAPI + MongoDB + OpenAI
└── frontend/       React (Vite) + Recharts
```

---

## Backend Setup

### 1. Create & activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create or edit `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
OPENAI_API_KEY=sk-...your-key-here...
```

### 4. Run the backend

```bash
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Features

| Feature | Description |
|---|---|
| ➕ Add Expense | Form with AI auto-categorization on description blur |
| 📋 Expense List | Table with category & date filters, edit/delete |
| 📊 Dashboard | Pie chart (category) + line chart (monthly trend) |
| 🤖 Ask SmartSpend | Natural-language Q&A grounded in your real data |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/expenses` | Create expense |
| GET  | `/expenses` | List expenses (supports `category`, `start_date`, `end_date`) |
| PUT  | `/expenses/{id}` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense |
| GET  | `/analytics/category-summary` | Spend per category |
| GET  | `/analytics/monthly-trend` | Monthly trend (last 12 months) |
| POST | `/categorize` | AI categorize a description |
| POST | `/ask` | AI Q&A grounded in expense data |

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `OPENAI_API_KEY` | Your OpenAI API key |
