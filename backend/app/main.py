
import hmac
from fastapi import Header
from app.config import TRASH_PASSWORD

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, APP_VERSION
from pydantic import BaseModel
from services.llm_service import ask_gemini
from fastapi import UploadFile, File, Form, HTTPException
from services.multimodal_service import ask_gemini_about_image
from vision.object_detector import detect_objects


from database import initialize_database, get_connection
from database import create_conversation, save_message
from database import move_conversation_to_trash
from database import get_deleted_conversations
from database import restore_conversation
from database import permanently_delete_conversation
from database import move_history_to_trash
from database import get_deleted_history
from database import restore_history
from database import permanently_delete_history

   
from services.multimodal_service import analyze_multimodal_input

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "An intelligent multi-modal virtual assistant "
        "using Large Language Models and Computer Vision."
    ),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    initialize_database()

# Allow the local React frontend to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Intelligent Multi-Modal Virtual Assistant API is running!",
        "version": APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": APP_NAME,
    }

class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat(request: ChatRequest):
    try:
        answer = ask_gemini(request.message)
        return {"answer": answer}
    except Exception:
        return {
            "error": "Unable to generate a response. Check your API key and backend logs."
        }
    
@app.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    question: str = Form("Describe this image in simple words."),
):
    if image.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be 5 MB or less.",
        )

    try:
        answer = ask_gemini_about_image(image_bytes, question)
        return {"answer": answer}
    except Exception as exc:
        print(f"Image analysis failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Image analysis failed. Check the backend terminal.",
        )
    
@app.post("/detect-objects")
async def detect_objects_api(
    image: UploadFile = File(...),
):
    if image.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be 5 MB or less.",
        )

    try:
        return detect_objects(image_bytes)
    except Exception as exc:
        print(f"Object detection failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Object detection failed. Check the backend terminal.",
        )

@app.post("/analyze-multimodal")
async def analyze_multimodal_api(
    image: UploadFile = File(...),
    question: str = Form("Describe this image and identify its objects."),
):
    if image.content_type not in [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be 5 MB or less.",
        )

    try:
        return analyze_multimodal_input(image_bytes, question)
    except Exception as exc:
        print(f"Multimodal analysis failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Multimodal analysis failed. Check the backend terminal.",
        )
    
from datetime import datetime
import json


@app.post("/history")
def save_history(request: dict):
    history_type = request.get("history_type", "chat")
    title = request.get("title", "Untitled")
    details = request.get("details", {})

    connection = get_connection()

    cursor = connection.execute(
        """
        INSERT INTO history (history_type, title, details, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            history_type,
            title,
            json.dumps(details),
            datetime.now().isoformat(timespec="seconds"),
        ),
    )

    connection.commit()
    history_id = cursor.lastrowid
    connection.close()

    return {
        "message": "History saved successfully",
        "id": history_id,
    }

@app.get("/history")
def get_history():
    connection = get_connection()

    rows = connection.execute(
       "SELECT * FROM history WHERE is_deleted = 0 ORDER BY id DESC"
    ).fetchall()

    connection.close()

    return [
        {
            "id": row["id"],
            "history_type": row["history_type"],
            "title": row["title"],
            "details": json.loads(row["details"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]

from database import create_conversation, save_message


@app.post("/conversations")
def new_conversation(request: dict):
    title = request.get("title", "New chat")
    conversation_id = create_conversation(title)

    return {
        "id": conversation_id,
        "title": title,
    }


@app.post("/conversations/{conversation_id}/messages")
def add_conversation_message(conversation_id: int, request: dict):
    role = request.get("role", "")
    content = request.get("content", "")

    if role not in ["user", "assistant"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be user or assistant.",
        )

    if not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Message content cannot be empty.",
        )

    connection = get_connection()
    conversation = connection.execute(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    ).fetchone()
    connection.close()

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    save_message(conversation_id, role, content)

    return {"message": "Message saved successfully"}


@app.get("/conversations")
def list_conversations():
    connection = get_connection()
    rows = connection.execute(
        "SELECT id, title, created_at FROM conversations WHERE is_deleted = 0 ORDER BY id DESC"
    ).fetchall()
    connection.close()
    return [dict(row) for row in rows]


@app.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int):
    connection = get_connection()

    conversation = connection.execute(
        "SELECT id, title, created_at FROM conversations WHERE id = ?",
        (conversation_id,),
    ).fetchone()

    if conversation is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    messages = connection.execute(
        """
        SELECT id, role, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
        """,
        (conversation_id,),
    ).fetchall()

    connection.close()

    return {
        "conversation": dict(conversation),
        "messages": [dict(row) for row in messages],
    }


@app.post("/conversations")
def new_conversation(request: dict):
    title = request.get("title", "New chat")
    conversation_id = create_conversation(title)

    return {
        "id": conversation_id,
        "title": title,
    }


@app.post("/conversations/{conversation_id}/messages")
def add_conversation_message(conversation_id: int, request: dict):
    role = request.get("role", "")
    content = request.get("content", "")

    if role not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Invalid role.")

    if not content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    connection = get_connection()
    conversation = connection.execute(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    ).fetchone()
    connection.close()

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    save_message(conversation_id, role, content)

    return {"message": "Message saved successfully"}



@app.get("/conversations")
def list_conversations():
    connection = get_connection()

    rows = connection.execute(
        "SELECT id, title, created_at FROM conversations WHERE is_deleted = 0 ORDER BY id DESC"
    ).fetchall()

    connection.close()

    return [dict(row) for row in rows]



@app.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int):
    connection = get_connection()

    conversation = connection.execute(
        "SELECT id, title, created_at FROM conversations WHERE id = ?",
        (conversation_id,),
    ).fetchone()

    if conversation is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Conversation not found.")

    messages = connection.execute(
        """
        SELECT id, role, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
        """,
        (conversation_id,),
    ).fetchall()

    connection.close()

    return {
        "conversation": dict(conversation),
        "messages": [dict(row) for row in messages],
    }







def verify_trash_password(password):
    if not TRASH_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Trash password is not configured",
        )

    if not password or not hmac.compare_digest(
        password,
        TRASH_PASSWORD,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect Trash password",
        )




@app.delete("/conversations/{conversation_id}")
def delete_conversation_api(conversation_id: int):
    success = move_conversation_to_trash(conversation_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or already in Trash",
        )

    return {"message": "Conversation moved to Trash"}



@app.get("/trash/conversations")
def get_trash_conversations_api(
    x_trash_password: str = Header(default=""),
):
    verify_trash_password(x_trash_password)
    return get_deleted_conversations()



@app.post("/trash/conversations/{conversation_id}/restore")
def restore_conversation_api(
    conversation_id: int,
    x_trash_password: str = Header(default=""),
):
    verify_trash_password(x_trash_password)

    success = restore_conversation(conversation_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Deleted conversation not found",
        )

    return {"message": "Conversation restored successfully"}


@app.delete("/trash/conversations/{conversation_id}")
def permanently_delete_conversation_api(
    conversation_id: int,
    x_trash_password: str = Header(default=""),
):
    verify_trash_password(x_trash_password)

    success = permanently_delete_conversation(conversation_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found in Trash",
        )

    return {"message": "Conversation permanently deleted"}

@app.delete("/history/{history_id}")
def delete_history_item(history_id: int):
    success = move_history_to_trash(history_id)
    if not success:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"message": "History item moved to Trash"}


@app.get("/trash/history")
def get_history_trash(x_trash_password: str = Header(...)):
    verify_trash_password(x_trash_password)
    return get_deleted_history()


@app.post("/trash/history/{history_id}/restore")
def restore_history_item(
    history_id: int,
    x_trash_password: str = Header(...),
):
    verify_trash_password(x_trash_password)
    success = restore_history(history_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deleted history item not found")
    return {"message": "History item restored"}


@app.delete("/trash/history/{history_id}")
def permanently_delete_history_item(
    history_id: int,
    x_trash_password: str = Header(...),
):
    verify_trash_password(x_trash_password)
    success = permanently_delete_history(history_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deleted history item not found")
    return {"message": "History item permanently deleted"}



