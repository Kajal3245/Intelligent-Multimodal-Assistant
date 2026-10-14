
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

APP_NAME = "Intelligent Multi-Modal Virtual Assistant"
APP_VERSION = "1.0.0"

TRASH_PASSWORD = os.getenv("TRASH_PASSWORD")
