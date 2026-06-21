"""
AI service using Google Gemini via the official google-genai SDK.
Migrated from OpenAI gpt-4o-mini due to quota exhaustion.
Preserves all existing function signatures and behavior.

Setup: Get a free API key at https://aistudio.google.com/apikey
       Add GEMINI_API_KEY=your-key to backend/.env
"""
import os
import asyncio
from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError, ServerError
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = "gemini-2.5-flash"

# Lazy-initialised client
_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Get a free key at https://aistudio.google.com/apikey and add it to backend/.env"
            )
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Other"]

CATEGORIZE_PROMPT = f"""You are a smart expense categorizer for an Indian user. Given an expense description, respond with ONLY one of the following category names (no extra text, no punctuation, no explanation):
{', '.join(CATEGORIES)}

If you cannot determine the category, respond with: Other"""

ASK_SYSTEM_PROMPT = """You are SmartSpend, a personal finance assistant for an Indian user.
All amounts are in Indian Rupees (INR). Always use the ₹ symbol when mentioning money.
You answer questions ONLY based on the expense data provided to you.
- If the data is sufficient to answer, provide a clear, helpful answer with specific amounts in ₹.
- If the data does not contain enough information to answer the question, say clearly:
  "I don't have enough data to answer that question."
- Do not make up numbers or guess beyond the provided data.
- Be concise and friendly."""


def _extract_text(response) -> str:
    """
    Safely extract text from a Gemini response.
    gemini-2.5-flash uses thinking tokens; response.text can be None
    when the response parts include thought parts before the text part.
    """
    if response.text is not None:
        return response.text.strip()

    # Fallback: walk candidates -> parts, skip thought parts
    try:
        for candidate in response.candidates:
            parts = candidate.content.parts or []
            text_parts = [
                p.text for p in parts
                if hasattr(p, "text") and p.text and not getattr(p, "thought", False)
            ]
            if text_parts:
                return " ".join(text_parts).strip()
    except Exception:
        pass

    return ""


def _classify_error(e: Exception) -> str:
    """
    Map google.genai exceptions to specific user-friendly messages.
    Uses only google.genai.errors — no google.api_core dependency.
    """
    code = getattr(e, "code", None)
    status = (getattr(e, "status", None) or "").upper()
    err_str = str(e).lower()

    # 429 / RESOURCE_EXHAUSTED
    if code == 429 or "resource_exhausted" in status or "quota" in err_str:
        return "AI quota exceeded. The Gemini API free-tier rate limit was reached. Please wait a minute and try again."

    # 401 / UNAUTHENTICATED
    if code == 401 or "unauthenticated" in status or ("invalid" in err_str and "key" in err_str):
        return "AI authentication failed. Please check that GEMINI_API_KEY is valid in backend/.env."

    # 400 / INVALID_ARGUMENT
    if code == 400 or "invalid_argument" in status:
        return "AI request was rejected as invalid. Please check your input."

    # 503 / UNAVAILABLE
    if code == 503 or "unavailable" in status:
        return "Gemini AI service is temporarily unavailable. Please try again shortly."

    # Network / connection errors (not from the API)
    if "network" in err_str or "connection" in err_str or "timeout" in err_str:
        return "Network error reaching Gemini. Check your internet connection and try again."

    if not GEMINI_API_KEY:
        return (
            "GEMINI_API_KEY is not set. "
            "Get a free key at https://aistudio.google.com/apikey and add it to backend/.env."
        )

    return f"AI service error: {str(e)}"


async def categorize_description(description: str) -> str:
    """Categorize an expense description using Gemini. Returns one of the CATEGORIES strings."""
    try:
        client = _get_client()
        prompt = f"{CATEGORIZE_PROMPT}\n\nExpense description: {description}"

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=20,
                # Disable thinking mode for fast single-token categorization
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        raw = _extract_text(response)
        if not raw:
            return "Other"

        # Validate — only return a known category
        for cat in CATEGORIES:
            if cat.lower() == raw.lower():
                return cat
        return "Other"

    except (APIError, ClientError, ServerError) as e:
        raise RuntimeError(_classify_error(e))
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(_classify_error(e))


async def answer_question(question: str, expenses: list) -> str:
    """Answer a natural-language spending question grounded in actual expense records."""
    try:
        client = _get_client()

        if not expenses:
            expense_context = "No expense data found for the relevant time period or category."
        else:
            lines = [
                f"- {e['date']} | {e['category']} | ₹{e['amount']:.2f} | {e['description']}"
                for e in expenses
            ]
            expense_context = "\n".join(lines)

        full_prompt = f"""{ASK_SYSTEM_PROMPT}

User question: {question}

Expense data:
{expense_context}"""

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=600,
            ),
        )

        text = _extract_text(response)
        return text if text else "I was unable to generate an answer. Please try again."

    except (APIError, ClientError, ServerError) as e:
        raise RuntimeError(_classify_error(e))
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(_classify_error(e))
