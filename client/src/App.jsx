
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5001";

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
}

function App() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [updatingItem, setUpdatingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Automatically dismiss success feedback after a short delay.
  useEffect(() => {
    if (!notice) return undefined;

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  // Automatically dismiss error feedback after 4 seconds.
useEffect(() => {
  if (!error) return undefined;

  const timeoutId = window.setTimeout(() => {
    setError("");
  }, 4000);

  return () => window.clearTimeout(timeoutId);
}, [error]);

  const chatWindowRef = useRef(null);
  const inputRef = useRef(null);

  const fetchItems = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);

    try {
      const data = await requestJson("/items");

      if (data.success) {
        setItems(Array.isArray(data.items) ? data.items : []);
      }

      setError("");
    } catch (err) {
      setError(
        "Unable to load your library. Check that the backend is running."
      );
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const chatWindow = chatWindowRef.current;

    if (!chatWindow) return;

    chatWindow.scrollTo({
      top: chatWindow.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, asking]);

  const noteCount = items.filter(
    (item) => item.source_type === "note"
  ).length;

  const urlCount = items.filter(
    (item) => item.source_type === "url"
  ).length;

  const saveNote = async (event) => {
    event.preventDefault();

    if (!title.trim() || !content.trim() || saving) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const data = await requestJson("/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      setNotice(
        data.indexed === false
          ? "Your note was saved, but AI indexing could not be completed."
          : "Your note was saved and indexed successfully."
      );

      setTitle("");
      setContent("");
      await fetchItems();
    } catch (err) {
      setError(err.message || "Unable to save your note.");
    } finally {
      setSaving(false);
    }
  };

  const saveUrl = async (event) => {
    event.preventDefault();

    if (!url.trim() || saving) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const data = await requestJson("/ingest/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      setNotice(
        data.indexed === false
          ? "The webpage was saved, but AI indexing could not be completed."
          : "The webpage was fetched, saved and indexed successfully."
      );

      setUrl("");
      await fetchItems();
    } catch (err) {
  console.error("URL ingestion failed:", err);

  setError(
    err.message === "fetch failed"
      ? "Unable to fetch this webpage. Please check the URL or try another website."
      : err.message || "Unable to save this webpage."
  );
} finally {
      setSaving(false);
    }
  };

  const startEditingItem = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditContent(item.content || "");
    setOpenMenuId(null);
    setError("");
  };

  const saveEditedItem = async (event) => {
    event.preventDefault();

    if (!editingItem || !editTitle.trim() || !editContent.trim() || updatingItem) {
      return;
    }

    setUpdatingItem(true);
    setError("");

    try {
      const data = await requestJson(`/items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      setEditingItem(null);
      setNotice(
        data.indexed === false
          ? "Your changes were saved, but AI indexing could not be completed."
          : "Your changes were saved and re-indexed successfully."
      );
      await fetchItems();
    } catch (err) {
      setError(err.message || "Unable to update this item.");
    } finally {
      setUpdatingItem(false);
    }
  };

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This will also remove its indexed content.`
    );

    if (!confirmed) {
      setOpenMenuId(null);
      return;
    }

    setDeletingItemId(item.id);
    setOpenMenuId(null);
    setError("");

    try {
      await requestJson(`/items/${item.id}`, { method: "DELETE" });
      setNotice("Item deleted successfully.");
      await fetchItems();
    } catch (err) {
      setError(err.message || "Unable to delete this item.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const askQuestion = async (event) => {
    event.preventDefault();

    const submittedQuestion = question.trim();

    if (!submittedQuestion || asking) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: submittedQuestion,
      },
    ]);

    setQuestion("");
    setAsking(true);
    setError("");

    try {
      const data = await requestJson("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: submittedQuestion }),
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            data.answer ||
            "I couldn't generate an answer from your saved information.",
          sources: Array.isArray(data.sources) ? data.sources : [],
          showSources: false,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Sorry, I couldn't answer that. ${err.message}`,
          sources: [],
          showSources: false,
          isError: true,
        },
      ]);
    } finally {
      setAsking(false);
      inputRef.current?.focus();
    }
  };

  const toggleSources = (messageId) => {
    setMessages((current) =>
      current.map((item) =>
        item.id === messageId
          ? { ...item, showSources: !item.showSources }
          : item
      )
    );
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsed = new Date(`${date.replace(" ", "T")}Z`);

    return Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toLocaleDateString();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Knowledge Inbox home">
          <span className="brand-icon">✳</span>

          <span className="brand-copy">
            <strong>Knowledge Inbox</strong>
            <small>YOUR AI KNOWLEDGE SPACE</small>
          </span>
        </a>

        <div className="online-status">
          <span className="online-dot" /> AI WORKSPACE
        </div>
      </header>

      <main className="main-content" id="top">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR PERSONAL KNOWLEDGE ASSISTANT
            </span>

            <h1>
              Your knowledge,
              <br />
              <span>beautifully connected.</span>
            </h1>

            <p>
              Capture ideas. Connect information. Ask smarter questions.
            </p>
          </div>

          <div className="hero-decoration" aria-hidden="true">
            <div className="hero-orbit" />
            <div className="hero-orb">✳</div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Library statistics">
          <article className="stat-card">
            <div className="stat-icon purple">✦</div>
            <div>
              <span>Total knowledge</span>
              <strong>{items.length}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">▤</div>
            <div>
              <span>Saved notes</span>
              <strong>{noteCount}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon amber">◎</div>
            <div>
              <span>Webpages</span>
              <strong>{urlCount}</strong>
            </div>
          </article>
        </section>

        {/* SHARED NOTIFICATIONS */}
{(notice || error) && (
  <div className="notification-container">
    {error && (
      <div className="alert error-alert" role="alert">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => setError("")}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    )}

    {notice && (
      <div className="success-message" role="status">
        <span>{notice}</span>
        <button
          type="button"
          onClick={() => setNotice("")}
          aria-label="Dismiss success message"
        >
          ×
        </button>
      </div>
    )}
  </div>
)}

        {/* TWO-COLUMN DASHBOARD */}
        <section className="dashboard-grid">
          {/* SAVE KNOWLEDGE */}
          <section className="card capture-card">
            <div className="section-heading">
              <div>
                <span className="section-kicker">CAPTURE</span>
                <h2>Save knowledge</h2>
                <p>Keep your ideas and useful links together.</p>
              </div>

              <div className="heading-icon" aria-hidden="true">
                ✎
              </div>
            </div>

            <div
              className="tabs"
              role="tablist"
              aria-label="Save content type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "note"}
                className={activeTab === "note" ? "tab active" : "tab"}
                onClick={() => {
                  setActiveTab("note");
                  setNotice("");
                }}
              >
                Write a note
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "url"}
                className={activeTab === "url" ? "tab active" : "tab"}
                onClick={() => {
                  setActiveTab("url");
                  setNotice("");
                }}
              >
                Save a URL
              </button>
            </div>

            {activeTab === "note" ? (
              <form className="capture-form" onSubmit={saveNote}>
                <label htmlFor="note-title">Title</label>

                <input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your note a title"
                  maxLength={200}
                  required
                />

                <label htmlFor="note-content">Content</label>

                <textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or paste your knowledge here..."
                  rows={5}
                  required
                />

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save note"}
                  <span>→</span>
                </button>
              </form>
            ) : (
              <form className="capture-form" onSubmit={saveUrl}>
                <label htmlFor="webpage-url">Webpage URL</label>

                <input
                  id="webpage-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  required
                />

                <p className="url-helper">
                  <span>◎</span> We'll extract and index the webpage content
                  for you.
                </p>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Fetching webpage..." : "Save webpage"}
                  <span>→</span>
                </button>
              </form>
            )}

            {activeTab === "url" && (
              <div className="url-workflow">
                <span className="url-workflow-label">HOW IT WORKS</span>
                <div className="url-workflow-steps">
                  <div className="url-workflow-step">
                    <span className="url-workflow-icon" aria-hidden="true">◎</span>
                    <strong>Fetch</strong>
                  </div>
                  <span className="url-workflow-arrow" aria-hidden="true">→</span>
                  <div className="url-workflow-step">
                    <span className="url-workflow-icon" aria-hidden="true">▤</span>
                    <strong>Chunk</strong>
                  </div>
                  <span className="url-workflow-arrow" aria-hidden="true">→</span>
                  <div className="url-workflow-step">
                    <span className="url-workflow-icon" aria-hidden="true">✧</span>
                    <strong>Embed</strong>
                  </div>
                </div>
                <p className="url-workflow-caption">
                  Your webpage becomes searchable by meaning, not just keywords.
                </p>
              </div>
            )}

            
          </section>

          {/* AI ASSISTANT */}
          <section className="card ask-card">
            <div className="section-heading ai-section-heading">
              <div>
                <span className="section-kicker">AI ASSISTANT</span>
                <h2>Ask your knowledge</h2>
                <p>Answers grounded in your saved information.</p>
              </div>

              <div className="heading-icon ai-icon" aria-hidden="true">
                ✳
              </div>
            </div>

            <div
              ref={chatWindowRef}
              className="chat-window"
              aria-live="polite"
              aria-label="Conversation"
            >
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">✳</div>
                  <h3>Your knowledge assistant is ready</h3>
                  <p>
                    Ask anything about your saved notes and webpages. I'll
                    find relevant information and provide source references.
                  </p>
                </div>
              ) : (
                messages.map((chatMessage) => (
                  <article
                    className={`chat-message ${
                      chatMessage.role === "user"
                        ? "user-message"
                        : "ai-message"
                    }`}
                    key={chatMessage.id}
                  >
                    {chatMessage.role === "user" ? (
                      <>
                        <div className="chat-bubble user-bubble">
                          {chatMessage.text}
                        </div>
                        <span className="chat-caption">You</span>
                      </>
                    ) : (
                      <>
                        <div className="chat-avatar" aria-hidden="true">
                          ✳
                        </div>

                        <div className="ai-message-content">
                          <div className="ai-message-name">
                            Knowledge Inbox AI
                          </div>

                          <div
                            className={`chat-bubble ai-bubble${
                              chatMessage.isError ? " error-bubble" : ""
                            }`}
                          >
                            {chatMessage.text}
                          </div>

                          {chatMessage.sources?.length > 0 && (
                            <div className="sources-section">
                              <button
                                className="sources-toggle"
                                type="button"
                                aria-expanded={chatMessage.showSources}
                                onClick={() =>
                                  toggleSources(chatMessage.id)
                                }
                              >
                                <span>
                                  Sources ({chatMessage.sources.length})
                                </span>

                                <span>
                                  {chatMessage.showSources ? "−" : "+"}
                                </span>
                              </button>

                              {chatMessage.showSources && (
                                <div className="sources-list">
                                  {chatMessage.sources.map(
                                    (source, index) => (
                                      <article
                                        className="source-card"
                                        key={`${chatMessage.id}-${
                                          source.citation ?? index
                                        }`}
                                      >
                                        <div className="source-card-top">
                                          <strong>
                                            [{source.citation ?? index + 1}]{" "}
                                            {source.title}
                                          </strong>

                                          {Number.isFinite(
                                            Number(source.similarity)
                                          ) && (
                                            <span>
                                              {(
                                                Number(source.similarity) *
                                                100
                                              ).toFixed(1)}
                                              % match
                                            </span>
                                          )}
                                        </div>

                                        {source.snippet && (
                                          <p>{source.snippet}</p>
                                        )}

                                        {source.sourceUrl && (
                                          <a
                                            href={source.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            Open original webpage ↗
                                          </a>
                                        )}
                                      </article>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <span className="chat-caption">
                            Grounded in your saved knowledge
                          </span>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}

              {asking && (
                <div className="chat-message ai-message">
                  <div className="chat-avatar">✳</div>

                  <div className="ai-message-content">
                    <div className="ai-message-name">
                      Knowledge Inbox AI
                    </div>

                    <div
                      className="typing-indicator"
                      aria-label="AI is thinking"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="chat-composer" onSubmit={askQuestion}>
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Message Knowledge Inbox..."
                maxLength={1000}
                disabled={asking}
                aria-label="Type your question"
              />

              <button
                type="submit"
                disabled={!question.trim() || asking}
                aria-label="Send message"
                title="Send message"
              >
                ➤
              </button>
            </form>

            <p className="chat-footer-note">
              AI responses are based on your saved knowledge.
            </p>
          </section>
        </section>

        {/* TIP IS NOW OUTSIDE THE DASHBOARD GRID */}
        <aside className="tip-card">
          <div className="tip-icon">✦</div>
          <div>
            <strong>A little tip</strong>
            <p>
              Save useful articles, notes and ideas. The more you add, the
              more your knowledge assistant can help you discover.
            </p>
          </div>
        </aside>

        {/* SAVED KNOWLEDGE LIBRARY */}
        <section className="card saved-card">
          <div className="section-heading saved-heading">
            <div>
              <span className="section-kicker">YOUR LIBRARY</span>
              <h2>Saved knowledge</h2>
              <p>{items.length} items in your collection</p>
            </div>

            <button
              className="icon-button"
              type="button"
              onClick={() => fetchItems(true)}
              disabled={refreshing}
              title="Refresh saved items"
              aria-label="Refresh saved items"
            >
              {refreshing ? "…" : "↻"}
            </button>
          </div>

          <div className="saved-list">
            {items.length === 0 ? (
              <div className="empty-state">
                <div>▤</div>
                <strong>Your library is empty</strong>
                <p>Save your first note or webpage to get started.</p>
              </div>
            ) : (
              items.map((item) => (
                <article className="saved-item" key={item.id}>
                  <div className="saved-item-actions">
                    <button
                      className="item-menu-trigger"
                      type="button"
                      aria-label={`Actions for ${item.title}`}
                      aria-expanded={openMenuId === item.id}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                    >
                      ⋯
                    </button>

                    {openMenuId === item.id && (
                      <div className="item-action-menu">
                        <button
                          type="button"
                          onClick={() => startEditingItem(item)}
                        >
                          <span>✎</span> Edit
                        </button>
                        <button
                          type="button"
                          className="delete-action"
                          onClick={() => deleteItem(item)}
                          disabled={deletingItemId === item.id}
                        >
                          <svg
                            className="delete-bin-icon"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {deletingItemId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="saved-item-icon">
                    {item.source_type === "url" ? "◎" : "▤"}
                  </div>

                  <div className="saved-item-info">
                    <div className="saved-item-meta">

                      <span className="item-date">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <h3>{item.title}</h3>

                    <p>
                      {(item.content || "").slice(0, 130)}
                      {(item.content || "").length > 130 ? "..." : ""}
                    </p>

                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="source-link"
                      >
                        Open webpage ↗
                      </a>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {editingItem && (
        <div
          className="edit-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updatingItem) {
              setEditingItem(null);
            }
          }}
        >
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-item-title"
          >
            <div className="edit-modal-heading">
              <div>
                <span className="section-kicker">YOUR LIBRARY</span>
                <h2 id="edit-item-title">Edit {editingItem.source_type === "url" ? "webpage" : "note"}</h2>
                <p>Update the saved content in your knowledge inbox.</p>
              </div>
              <button
                className="edit-modal-close"
                type="button"
                onClick={() => setEditingItem(null)}
                disabled={updatingItem}
                aria-label="Close edit dialog"
              >
                ×
              </button>
            </div>

            <form className="edit-item-form" onSubmit={saveEditedItem}>
              <label htmlFor="edit-item-title-input">Title</label>
              <input
                id="edit-item-title-input"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                maxLength={200}
                required
              />

              <label htmlFor="edit-item-content-input">Content</label>
              <textarea
                id="edit-item-content-input"
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={8}
                required
              />

              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingItem(null)}
                  disabled={updatingItem}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={updatingItem || !editTitle.trim() || !editContent.trim()}
                >
                  {updatingItem ? "Saving changes..." : "Save changes"}
                  <span>→</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-brand">
          <span>✳</span> Knowledge Inbox
        </div>

        <span>Built with React, Express, SQLite &amp; Gemini AI</span>
        <span>Personal knowledge, powered by AI.</span>
      </footer>
    </div>
  );
}

export default App;
