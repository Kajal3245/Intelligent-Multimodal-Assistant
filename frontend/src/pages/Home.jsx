
import { Link } from "react-router-dom";
import "../App.css";

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">✦</div>
        <h2>OmniAssist</h2>
        <p className="muted">Multi-Modal AI Assistant</p>

        <p className="nav-label">WORKSPACE</p>

        <Link className="nav" to="/chat">
          ✧ AI Chat
        </Link>

        <Link className="nav" to="/image">
          ▧ Image Understanding
        </Link>

        <Link className="nav" to="/objects">
          ◈ Object Detection
        </Link>

        <Link className="nav" to="/history">
          ◷ Detection History
        </Link>

        <div className="sidebar-bottom">
          <span className="status-dot" /> Local AI backend
          <small>Gemini + YOLO</small>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">INTELLIGENT MULTI-MODAL ASSISTANT</p>
            <h1>Welcome to OmniAssist</h1>
          </div>
          <span className="online-badge">
            <span className="status-dot" /> Ready to assist
          </span>
        </header>

        <section className="workspace">
          <div className="welcome">
            <div className="welcome-icon">✦</div>
            <p className="eyebrow">YOUR INTELLIGENT WORKSPACE</p>
            <h2>Ask. Explore. Understand.</h2>
            <p>
              Your AI assistant for conversations, image understanding,
              and computer vision.
            </p>
          </div>

          <div className="home-cards">
            <Link className="home-card" to="/chat">
              <span>✧</span>
              <h3>AI Chat</h3>
              <p>Ask questions and get AI responses.</p>
            </Link>

            <Link className="home-card" to="/image">
              <span>▧</span>
              <h3>Image Understanding</h3>
              <p>Upload an image and ask questions about it.</p>
            </Link>

            <Link className="home-card" to="/objects">
              <span>◈</span>
              <h3>Object Detection</h3>
              <p>Detect objects and view confidence scores.</p>
            </Link>

            <Link className="home-card" to="/history">
              <span>◷</span>
              <h3>History</h3>
              <p>Revisit your previous results.</p>
            </Link>
          </div>
        </section>

        <footer className="page-footer">
          Intelligent Multi-Modal Virtual Assistant · Gemini + Computer Vision
        </footer>
      </section>
    </main>
  );
}
