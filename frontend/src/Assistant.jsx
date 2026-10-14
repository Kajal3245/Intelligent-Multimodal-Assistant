
import { useState, useEffect } from "react";
import "./App.css";


const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";




export default function Assistant({ initialMode = "chat" }) {
  const [mode, setMode] = useState(initialMode);
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [annotatedImage, setAnnotatedImage] = useState("");
  const [conversationId, setConversationId] = useState(null);
const [messages, setMessages] = useState([]);
const [conversations, setConversations] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);
async function loadConversations() {
  setHistoryLoading(true);

  try {
    const response = await fetch(`${API}/conversations`);

    if (!response.ok) {
      throw new Error("Could not load conversations");
    }

    const data = await response.json();
    setConversations(data);
  } catch (error) {
    console.error("Error loading conversations:", error);
  } finally {
    setHistoryLoading(false);
  }
}

useEffect(() => {
  loadConversations();
}
, []);

async function openConversation(id) {
  try {
    const response = await fetch(`${API}/conversations/${id}`);

    if (!response.ok) {
      throw new Error("Could not open this conversation");
    }

    const data = await response.json();

    setConversationId(data.conversation.id);
    setMessages(data.messages);
    setAnswer("");
    setError("");
  } catch (error) {
    setError(error.message || "Could not open conversation");
  }
}

  const [detections, setDetections] = useState([]);
const [detectionCount, setDetectionCount] = useState(0);
const [history, setHistory] = useState([]);
const [showHistory, setShowHistory] = useState(false);
useEffect(() => {
  async function loadHistory() {
    try {
      const response = await fetch(`${API}/history`);

      if (!response.ok) {
        throw new Error("Failed to load history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Could not load history:", err);
    }
  }

  loadHistory();
}, []);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [autoSpeak, setAutoSpeak] = useState(false);

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-Speech is not supported by this browser.");
      return;
    }

    if (!text || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguage;
    utterance.rate = 1;

    utterance.onerror = () => {
      setError("Speech could not be played. Please try again.");
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
  
function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ADD THE NEW FUNCTIONS HERE, BELOW stopSpeaking()

function pauseSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.pause();
  }
}

function resumeSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.resume();
  }
}



  
  async function sendChat(e) {
    e.preventDefault();

    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setAnswer("");

    const userMessage = message.trim();
    let activeConversationId = conversationId;

    try {
      if (!activeConversationId) {
        const createResponse = await fetch(`${API}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: userMessage.slice(0, 50),
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Could not create a conversation.");
        }

        const conversation = await createResponse.json();
        activeConversationId = conversation.id;
        setConversationId(conversation.id);
      }

      const userSaveResponse = await fetch(
        `${API}/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "user",
            content: userMessage,
          }),
        }
      );

      if (!userSaveResponse.ok) {
        throw new Error("Could not save your message.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "user", content: userMessage },
      ]);

      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.detail || data.error || "Request failed");
      }

      const aiAnswer = data.answer || "No answer received.";

      const assistantSaveResponse = await fetch(
        `${API}/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "assistant",
            content: aiAnswer,
          }),
        }
      );

      if (!assistantSaveResponse.ok) {
        throw new Error("The answer was generated but could not be saved.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: aiAnswer },
      ]);

      setAnswer(aiAnswer);
      if (autoSpeak) {
  speakText(aiAnswer);
}
      setMessage("");
      await loadConversations();
    } catch (err) {
      setError(err.message || "Could not complete the conversation.");
    } finally {
      setLoading(false);
    }
  }

  function downloadDetectionReport() {
    const lines = [
      "OmniAssist - Object Detection Report",
      "====================================",
      `Image: ${image?.name || "Uploaded image"}`,
      `Total objects detected: ${detectionCount}`,
      "",
      "Detection Details:",
      ...detections.map(
        (item, index) =>
          `${index + 1}. ${item.label} - ${(item.confidence * 100).toFixed(1)}% confidence | Box: x1=${item.box.x1}, y1=${item.box.y1}, x2=${item.box.x2}, y2=${item.box.y2}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "OmniAssist-Detection-Report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }


  async function analyzeImage(e) {
    e.preventDefault();
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    const form = new FormData();
    form.append("image", image);
    form.append("question", question || "Describe this image.");

    const endpoint =
      mode === "objects" ? "/detect-objects" : "/analyze-multimodal";

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Image analysis failed");
      

if (mode === "objects") {
  setAnnotatedImage(data.annotated_image || "");
  setDetections(data.detections || []);
  setDetectionCount(data.count || 0);

  try {
    const historyResponse = await fetch(`${API}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history_type: "object_detection",
        title: image.name,
        details: {
          imageName: image.name,
          count: data.count || 0,
          detections: data.detections || [],
        },
      }),
    });

    if (!historyResponse.ok) {
      throw new Error("Could not save detection history");
    }

    const savedRecord = await historyResponse.json();

    setHistory((previousHistory) => [
      {
        id: savedRecord.id,
        history_type: "object_detection",
        title: image.name,
        details: {
          imageName: image.name,
          count: data.count || 0,
          detections: data.detections || [],
        },
        created_at: new Date().toISOString(),
      },
      ...previousHistory,
    ]);
  } catch (err) {
    console.error("Could not save detection history:", err);
    setError("Detection worked, but history could not be saved.");
  }
}


    

setAnswer(
  mode === "objects"
    ? `Objects detected: ${data.count}\n\n${
        (data.detections || [])
          .map(
            (item) =>
              `${item.label} — ${(item.confidence * 100).toFixed(1)}% confidence`
          )
          .join("\n") || "No objects detected."
      }`
    : `Image understanding:\n${data.image_answer}\n\nDetected objects (${data.object_count}):\n${(data.detected_objects || [])
        .map(
          (item) =>
            `${item.label} — ${Math.round(item.confidence * 100)}% confidence`
        )
        .join("\n") || "No objects detected."}`
);


    } catch (err) {
      setError(err.message || "Could not analyze the image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">✦</div>
        <h2>OmniAssist</h2>
        <p className="muted">Multi-Modal AI Assistant</p>

        <p className="nav-label">WORKSPACE</p>
        
<button
  className="nav"
  onClick={() => (window.location.href = "/")}
>
  <span>⌂</span> Home
</button>

       

<button
  className={mode === "chat" ? "nav active" : "nav"}
  onClick={() => (window.location.href = "/chat")}
>
  <span>✧</span> AI Chat
</button>

<button
  className={mode === "image" ? "nav active" : "nav"}
  onClick={() => (window.location.href = "/image")}
>
  <span>▧</span> Image Understanding
</button>

<button
  className={mode === "objects" ? "nav active" : "nav"}
  onClick={() => (window.location.href = "/objects")}
>
  <span>◈</span> Object Detection
</button>

<button
  className="nav"
  onClick={() => (window.location.href = "/history")}
>
  <span>◷</span> Detection History
</button>

<div className="chat-history-section">
  <p className="nav-label">PREVIOUS CHATS</p>

  {historyLoading && <p className="muted">Loading chats...</p>}

  {!historyLoading && conversations.length === 0 && (
    <p className="muted">No previous chats yet</p>
  )}

  
{conversations.map((conversation) => (
  <div
    key={conversation.id}
    className="chat-history-row"
  >
    <button
      className={
        conversationId === conversation.id
          ? "nav active"
          : "nav"
      }
      onClick={() => openConversation(conversation.id)}
      title={conversation.title}
    >
      <span>◷</span>
      <span className="chat-title">{conversation.title}</span>
    </button>

    <button
      type="button"
      className="delete-chat-button"
      title="Move chat to Trash"
      onClick={async (e) => {
        e.stopPropagation();

        const confirmed = window.confirm(
          "Move this conversation to Trash?"
        );

        if (!confirmed) return;

        try {
          const response = await fetch(
            `${API}/conversations/${conversation.id}`,
            { method: "DELETE" }
          );

          if (!response.ok) {
            throw new Error("Could not move chat to Trash.");
          }

          if (conversationId === conversation.id) {
            setConversationId(null);
            setMessages([]);
            setAnswer("");
          }

          await loadConversations();
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      🗑
    </button>
  </div>
))}

</div>



        <button
  className="nav"
  onClick={() => setShowHistory(!showHistory)}
>
  <span>◷</span> Detection History ({history.length})
</button>

        <div className="sidebar-bottom">
          <span className="status-dot" /> Local AI backend
          <small>Gemini + YOLO</small>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">INTELLIGENT MULTI-MODAL ASSISTANT</p>
            <h1>
              {mode === "chat" ? "AI Conversation" :
               mode === "image" ? "Image Understanding" : "Object Detection"}
            </h1>
          </div>
          <span className="online-badge"><span className="status-dot" /> Ready to assist</span>
        </header>

        <section className="workspace">
            
  <div className="input-card">
    <label htmlFor="speech-language">SPEECH LANGUAGE</label>

    <select
      id="speech-language"
      value={speechLanguage}
      onChange={(e) => setSpeechLanguage(e.target.value)}
    >
      <option value="en-US">English</option>
      <option value="hi-IN">Hindi (हिन्दी)</option>
    </select>

    <label>
      <input
        type="checkbox"
        checked={autoSpeak}
        onChange={(e) => setAutoSpeak(e.target.checked)}
      />
      Automatically speak new AI answers
    </label>

    <button
      type="button"
      className="primary-button"
      onClick={() => speakText(answer)}
      disabled={!answer}
    >
      🔊 Listen to latest answer
    </button>

    <button
      type="button"
      onClick={stopSpeaking}
    >
      ⏹ Stop speaking
    </button>
    <button
  type="button"
  onClick={pauseSpeaking}
>
  ⏸ Pause
</button>

<button
  type="button"
  onClick={resumeSpeaking}
>
  ▶ Resume
</button>
  </div>

          <div className="welcome">
            <div className="welcome-icon">✦</div>
            <p className="eyebrow">YOUR INTELLIGENT WORKSPACE</p>
            <h2>
              {mode === "chat" ? "Ask. Explore. Understand." :
               mode === "image" ? "Give your images meaning." : "Discover what's in view."}
            </h2>
            <p>
              {mode === "chat"
                ? "Ask a question and get a thoughtful AI response."
                : mode === "image"
                ? "Upload a picture and ask the assistant to explain it."
                : "Upload a picture to detect objects and their locations."}
            </p>
          </div>

          {mode === "chat" ? (
            <form className="input-card" onSubmit={sendChat}>
              <label htmlFor="message">YOUR MESSAGE</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                rows="4"
              />
              <div className="form-footer">
                <span>Powered by Gemini</span>
                <button className="primary-button" disabled={loading || !message.trim()}>
                  {loading ? "Thinking..." : "Send message ↗"}
                </button>
              </div>
            </form>
          ) : (
            <form className="input-card" onSubmit={analyzeImage}>
              <label htmlFor="image">UPLOAD AN IMAGE</label>
              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image && (
                <div className="preview">
                  <img src={URL.createObjectURL(image)} alt="Selected upload preview" />
                  <span>{image.name}</span>
                </div>
              )}
              {mode === "image" && (
                <>
                  <label htmlFor="question">WHAT WOULD YOU LIKE TO KNOW?</label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Describe this image..."
                    rows="3"
                  />
                </>
              )}
              <div className="form-footer">
                <span>{mode === "objects" ? "YOLO object detection" : "Gemini + YOLO"}</span>
                <button className="primary-button" disabled={loading || !image}>
                  {loading ? "Analyzing..." : "Analyze image ↗"}
                </button>
              </div>
            </form>
          )}

          {error && <div className="error-card">{error}</div>}
          
{showHistory && (
  <section className="answer-card">
    <p className="eyebrow">DETECTION HISTORY</p>

    {history.length === 0 ? (
      <p>No detection history yet. Upload an image and run object detection first.</p>
    ) : (
      history.map((item) => (
        <div key={item.id} className="history-item">
          <h3>{item.imageName}</h3>
          <p>Total objects detected: {item.count}</p>
          <p>Date: {item.date}</p>

          {item.detections.length > 0 ? (
            <ul>
              {item.detections.map((object, index) => (
                <li key={index}>
                  {object.label} — {(object.confidence * 100).toFixed(1)}% confidence
                </li>
              ))}
            </ul>
          ) : (
            <p>No objects detected.</p>
          )}
        </div>
      ))
    )}
  </section>
)}

          

{(messages.length > 0 || answer) && mode === "chat" && (
  <section className="answer-card">
    <p className="eyebrow">CONVERSATION</p>

    {messages.map((item, index) => (
      <div className="history-item" key={item.id || index}>
        <p className="eyebrow">
          {item.role === "user" ? "YOU" : "ASSISTANT"}
        </p>
        <pre>{item.content}</pre>
      </div>
    ))}
  </section>
)}

{answer && mode !== "chat" && (
  <section className="answer-card">
    <p className="eyebrow">ASSISTANT RESPONSE</p>

    {mode === "objects" && annotatedImage && (
      <div className="annotated-result">
        <h3>Detected Objects</h3>

        <img
          src={annotatedImage}
          alt="Detected objects with bounding boxes"
          className="annotated-image"
        />

        <a
          href={annotatedImage}
          download="detected-image.jpg"
          className="download-button"
        >
          Download Annotated Image ↓
        </a>

        <button
          type="button"
          className="primary-button"
          onClick={downloadDetectionReport}
        >
          Download Detection Report
        </button>
      </div>
    )}

    <pre>{answer}</pre>
  </section>
)}

        </section>
        <footer className="page-footer">
          Intelligent Multi-Modal Virtual Assistant · Gemini + Computer Vision
        </footer>
      </section>
    </main>
  );
}
