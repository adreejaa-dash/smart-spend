import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Other"]

CATEGORIZE_SYSTEM_PROMPT = f"""You are a smart expense categorizer. Given an expense description, 
respond with ONLY one of the following category names (no extra text, no punctuation, no explanation):
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


async def categorize_description(description: str) -> str:
    """Send description to OpenAI and get back a single category."""
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": CATEGORIZE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Expense description: {description}"},
            ],
            temperature=0.1,
            max_tokens=20,
        )
        category = response.choices[0].message.content.strip()
        # Validate the returned category
        if category not in CATEGORIES:
            return "Other"
        return category
    except Exception as e:
        raise RuntimeError(f"OpenAI categorization failed: {str(e)}")


async def answer_question(question: str, expenses: list) -> str:
    """Answer a user question grounded in the provided expense data."""
    try:
        if not expenses:
            expense_context = "No expense data found for the relevant time period or category."
        else:
            # Format expenses as compact text
            lines = []
            for e in expenses:
                lines.append(
                    f"- {e['date']} | {e['category']} | ₹{e['amount']:.2f} | {e['description']}"
                )
            expense_context = "\n".join(lines)

        user_message = f"""User question: {question}

Expense data:
{expense_context}"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ASK_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=500,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"OpenAI Q&A failed: {str(e)}")
