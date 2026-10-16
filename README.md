# OmniAssist — Intelligent Multi-Modal Virtual Assistant

## 1. Project Overview

OmniAssist is an intelligent multi-modal virtual assistant that combines Large Language Models (LLMs) and computer vision to help users interact with AI through text and images.

The application provides AI-powered conversations, image understanding, object detection, and text-to-speech in English and Hindi.
 ## 🌐 Live Demo

- **Chat:** [https://omniassist-frontend.vercel.app/chat](url)
- **Detection History:** https://omniassist-frontend.vercel.app/history
## 2. Features

- **AI Chat:** Ask questions and receive AI-generated answers using Google Gemini.
- **Image Understanding:** Upload an image and get an AI-generated description.
- **Object Detection:** Detect objects in images using YOLO.
- **Text-to-Speech:** Listen to AI answers in English and Hindi using the browser Speech Synthesis API.
- **Automatic Speaking:** Automatically read new AI chat answers aloud when enabled.
- **Speech Controls:** Listen, pause, resume, and stop speech.
- **Conversation History:** Save and reopen previous conversations.
- **Detection History:** Review saved object-detection results.
- **Trash Management:** Move supported records to Trash, restore them, or permanently delete them with password protection.

## 3. Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Browser Speech Synthesis API

### Backend
- Python
- FastAPI
- Uvicorn
- Google Gemini API
- Ultralytics YOLO

### Database
- SQLite

## 4. Project Structure

```text
Intelligent-Multimodal-Assistant/
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── database.py
│   ├── history.db
│   ├── .env
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── Assistant.jsx
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── index.html
└── README.md
```

*Note: This is the main structure. Additional files and folders may exist in your project.*

## 5. Requirements

- Python 3.12
- Node.js and npm
- A modern web browser
- A valid Google Gemini API key

## 6. Running the Backend

Open a terminal in the `backend` directory and run:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend API documentation is available at:

`http://127.0.0.1:8000/docs`

## 7. Running the Frontend

Open a second terminal in the `frontend` directory and run:

```powershell
npm install
npm run dev
```

Open the local URL shown in the terminal, usually:

`http://localhost:5173/`

## 8. Environment Configuration

Create or configure the backend `.env` file with the required environment variables:

```text
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
TRASH_PASSWORD=your_private_password
```

Replace the example values with your own private credentials. Never publish real API keys or passwords in a public repository.

## 9. Text-to-Speech

OmniAssist uses the browser's Speech Synthesis API to read AI-generated answers aloud. Users can select English or Hindi and control playback using Listen, Pause, Resume, and Stop. Available voices depend on the browser and operating system.

## 10. Project Objective

The objective of OmniAssist is to combine conversational AI and computer vision in a single application with an accessible interface and optional speech output.

## 11. Future Enhancements

- Voice input using speech recognition
- Improved language and voice selection
- Additional image-analysis features
- Enhanced user interface and accessibility
- More comprehensive automated testing

## 12. Conclusion

OmniAssist demonstrates the integration of a large language model, computer vision, a web interface, persistent history, and browser-based text-to-speech in one multi-modal assistant.
