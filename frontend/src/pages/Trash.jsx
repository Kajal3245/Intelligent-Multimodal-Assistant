
import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";


const API = "https://intelligent-multimodal-assistant.onrender.com";

export default function Trash() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTrash(secret) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const headers = { "x-trash-password": secret };

      const [conversationResponse, historyResponse] = await Promise.all([
        fetch(`${API}/trash/conversations`, { headers }),
        fetch(`${API}/trash/history`, { headers }),
      ]);

      if (
        conversationResponse.status === 401 ||
        historyResponse.status === 401
      ) {
        throw new Error("Incorrect Trash password.");
      }

      if (!conversationResponse.ok || !historyResponse.ok) {
        throw new Error(
          `Could not load Trash. Conversations: HTTP ${conversationResponse.status}; History: HTTP ${historyResponse.status}.`
        );
      }

      const conversationData = await conversationResponse.json();
      const historyData = await historyResponse.json();

      if (
        !Array.isArray(conversationData) ||
        !Array.isArray(historyData)
      ) {
        throw new Error("Unexpected response from the server.");
      }

      setConversations(conversationData);
      setHistory(historyData);
      setPassword(secret);
      setUnlocked(true);
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
      setConversations([]);
      setHistory([]);
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }

  async function restoreChat(id) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/trash/conversations/${id}/restore`,
        {
          method: "POST",
          headers: { "x-trash-password": password },
        }
      );

      if (!response.ok) {
        throw new Error(`Restore failed (HTTP ${response.status}).`);
      }

      setNotice("Conversation restored successfully.");
      await loadTrash(password);
    } catch (err) {
      setError(err.message || "Could not restore conversation.");
    }
  }

  async function deleteChatForever(id) {
    const confirmed = window.confirm(
      "Permanently delete this conversation and all its messages? This cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/trash/conversations/${id}`,
        {
          method: "DELETE",
          headers: { "x-trash-password": password },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Permanent deletion failed (HTTP ${response.status}).`
        );
      }

      setNotice("Conversation permanently deleted.");
      await loadTrash(password);
    } catch (err) {
      setError(err.message || "Could not permanently delete conversation.");
    }
  }

  async function restoreHistoryItem(id) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/trash/history/${id}/restore`,
        {
          method: "POST",
          headers: { "x-trash-password": password },
        }
      );

      if (!response.ok) {
        throw new Error(`History restore failed (HTTP ${response.status}).`);
      }

      setNotice("Detection history restored successfully.");
      await loadTrash(password);
    } catch (err) {
      setError(err.message || "Could not restore detection history.");
    }
  }

  async function deleteHistoryForever(id) {
    const confirmed = window.confirm(
      "Permanently delete this detection history record? This cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API}/trash/history/${id}`, {
        method: "DELETE",
        headers: { "x-trash-password": password },
      });

      if (!response.ok) {
        throw new Error(
          `History deletion failed (HTTP ${response.status}).`
        );
      }

      setNotice("Detection history permanently deleted.");
      await loadTrash(password);
    } catch (err) {
      setError(err.message || "Could not permanently delete history.");
    }
  }

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
        <Link className="nav" to="/history">◷ Detection History</Link>
        <Link className="nav active" to="/trash">♲ Trash</Link>

        <div className="sidebar-bottom">
          <span className="status-dot" /> Local AI backend
          <small>Gemini + YOLO</small>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">PRIVATE STORAGE</p>
            <h1>Trash</h1>
          </div>
        </header>

        <section className="workspace">
          {!unlocked ? (
            <form
              className="answer-card"
              onSubmit={(event) => {
                event.preventDefault();
                loadTrash(password);
              }}
            >
              <h2>🔒 Password required</h2>
              <p>Enter your Trash password to view deleted items.</p>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter Trash password"
                autoComplete="current-password"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Checking..." : "Unlock Trash"}
              </button>
            </form>
          ) : (
            <>
              <div className="answer-card">
                <h2>Trash overview</h2>
                <p>Deleted conversations: {conversations.length}</p>
                <p>Deleted detection records: {history.length}</p>

                <button
                  type="button"
                  onClick={() => {
                    setUnlocked(false);
                    setPassword("");
                    setConversations([]);
                    setHistory([]);
                    setError("");
                    setNotice("");
                  }}
                >
                  Lock Trash
                </button>
              </div>

              <div className="answer-card">
                <h2>Deleted conversations</h2>
                <p>{conversations.length} conversation(s) in Trash.</p>
              </div>

              {conversations.length === 0 && (
                <p>No deleted conversations.</p>
              )}

              {conversations.map((conversation) => (
                <article className="answer-card" key={conversation.id}>
                  <h3>{conversation.title || "New chat"}</h3>
                  <p>
                    Deleted:{" "}
                    {conversation.deleted_at
                      ? new Date(
                          conversation.deleted_at.replace(" ", "T") + "Z"
                        ).toLocaleString()
                      : "Date unavailable"}
                  </p>

                  <div className="trash-actions">
                    <button
                      type="button"
                      onClick={() => restoreChat(conversation.id)}
                    >
                      ↩ Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteChatForever(conversation.id)}
                    >
                      🗑 Delete forever
                    </button>
                  </div>
                </article>
              ))}

              <div className="answer-card">
                <h2>Deleted detection history</h2>
                <p>{history.length} detection record(s) in Trash.</p>
              </div>

              {history.length === 0 && (
                <p>No deleted detection records.</p>
              )}

              {history.map((item) => {
                let details = item.details;

                if (typeof details === "string") {
                  try {
                    details = JSON.parse(details);
                  } catch {
                    details = {};
                  }
                }

                return (
                  <article className="answer-card" key={item.id}>
                    <p className="eyebrow">
                      {item.history_type || "Activity"}
                    </p>
                    <h3>{item.title || "Untitled detection"}</h3>

                    <p>
                      Deleted:{" "}
                      {item.deleted_at
                        ? new Date(
                            item.deleted_at.replace(" ", "T") + "Z"
                          ).toLocaleString()
                        : "Date unavailable"}
                    </p>

                    {details?.count !== undefined && (
                      <p>Objects detected: {details.count}</p>
                    )}

                    {Array.isArray(details?.detections) &&
                      details.detections.map((object, index) => (
                        <p key={index}>
                          {object.label || "Object"} —{" "}
                          {typeof object.confidence === "number"
                            ? `${(object.confidence * 100).toFixed(1)}% confidence`
                            : "Confidence unavailable"}
                        </p>
                      ))}

                    {details?.answer && <p>{details.answer}</p>}

                    <div className="trash-actions">
                      <button
                        type="button"
                        onClick={() => restoreHistoryItem(item.id)}
                      >
                        ↩ Restore
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteHistoryForever(item.id)}
                      >
                        🗑 Delete forever
                      </button>
                    </div>
                  </article>
                );
              })}
            </>
          )}

          {loading && <p>Loading...</p>}
          {error && <div className="error-card">{error}</div>}
          {notice && <div className="answer-card">{notice}</div>}
        </section>

        <footer className="page-footer">
          OmniAssist · Private Trash
        </footer>
      </section>
    </main>
  );
}
