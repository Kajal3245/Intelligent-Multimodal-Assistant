
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const API = "http://127.0.0.1:8000";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  async function deleteHistoryItem(id) {
    const confirmed = window.confirm(
      "Move this history item to Trash?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setHistory((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Unable to delete history item:", err);
      window.alert("Could not move this item to Trash. Please try again.");
    }
  }


  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const response = await fetch(`${API}/history`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected history response");
        }

        setHistory(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("History loading failed:", err);
          setError(err.message || "Unable to load history.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">✦</div>
        <h2>OmniAssist</h2>
        <p className="muted">Multi-Modal AI Assistant</p>

        <p className="nav-label">WORKSPACE</p>
        <Link className="nav" to="/">⌂ Home</Link>
        <Link className="nav" to="/chat">✧ AI Chat</Link>
        <Link className="nav" to="/image">▧ Image Understanding</Link>
        <Link className="nav" to="/objects">◈ Object Detection</Link>
        <Link className="nav active" to="/history">◷ Detection History</Link>
<Link className="nav" to="/trash">♲ Trash</Link>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Local AI backend
          <small>Gemini + YOLO</small>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR PREVIOUS ACTIVITY</p>
            <h1>Detection History</h1>
          </div>
          <span className="online-badge">
            <span className="status-dot" />
            Saved records: {history.length}
          </span>
        </header>

        <section className="workspace">
          {loading && <p>Loading history...</p>}

          {!loading && error && (
            <div className="error-card">
              <h3>Unable to load history</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="answer-card">
              <h3>No history yet</h3>
              <p>Your saved image detections will appear here.</p>
            </div>
          )}

          {!loading && !error && history.map((item) => (
            <article className="answer-card" key={item.id}>
              <p className="eyebrow">{item.history_type || "Activity"}</p>
              <h3>{item.title || "Untitled activity"}</h3>
              <p>
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : "Date unavailable"}
              </p>

              {item.details?.count !== undefined && (
                <p>Objects detected: {item.details.count}</p>
              )}

              {Array.isArray(item.details?.detections) &&
                item.details.detections.map((object, index) => (
                  <p key={index}>
                    {object.label || "Object"} —{" "}
                    {typeof object.confidence === "number"
                      ? `${(object.confidence * 100).toFixed(1)}% confidence`
                      : "Confidence unavailable"}
                  </p>
                ))}

              {item.details?.answer && <p>{item.details.answer}</p>}
              <button onClick={() => deleteHistoryItem(item.id)}>
  Move to Trash
</button>
            </article>
          ))}
        </section>

        <footer className="page-footer">
          OmniAssist · Your saved activity
        </footer>
      </section>
    </main>
  );
}
