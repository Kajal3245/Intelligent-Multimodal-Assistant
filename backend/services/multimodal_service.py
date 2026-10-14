
from io import BytesIO

from PIL import Image
from google.genai import types

from services.llm_service import get_gemini_client
from app.config import GEMINI_MODEL
from vision.object_detector import detect_objects


def ask_gemini_about_image(
    image_bytes: bytes,
    question: str,
) -> str:
    """Answer a question about an uploaded image."""

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    client = get_gemini_client()

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_text(text=question),
            image,
        ],
    )

    return response.text or "Sorry, I could not describe this image."


def analyze_multimodal_input(
    image_bytes: bytes,
    question: str,
) -> dict:
    """Combine Gemini image understanding and YOLO object detection."""

    image_answer = ask_gemini_about_image(image_bytes, question)
    object_results = detect_objects(image_bytes)

    return {
        "question": question,
        "image_answer": image_answer,
        "object_count": object_results["count"],
        "detected_objects": object_results["detections"],
    }
