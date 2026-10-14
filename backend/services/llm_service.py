
from google import genai

from app.config import GEMINI_API_KEY, GEMINI_MODEL


def get_gemini_client():
    """Create a Gemini client using the API key from .env."""
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is missing. Please check backend/.env."
        )

    return genai.Client(api_key=GEMINI_API_KEY)


def ask_gemini(question: str) -> str:
    """Send a question to Gemini and return its answer."""
    client = get_gemini_client()

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=question,
    )

    return response.text or "Sorry, I could not generate an answer."
