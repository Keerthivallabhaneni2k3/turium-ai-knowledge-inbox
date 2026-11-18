import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { requestJson } from "./services/api";
import Header from "./components/Header";
import Hero from "./components/Hero";
import LibraryStats from "./components/LibraryStats";
import Notification from "./components/Notification";
import SaveKnowledge from "./components/SaveKnowledge";
import SavedKnowledge from "./components/SavedKnowledge";
import ChatPanel from "./components/ChatPanel";
import EditModal from "./components/EditModal";
import Footer from "./components/Footer";

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
    } catch {
      setError(
        "Unable to load your library. Check that the backend is running.",
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

  const noteCount = items.filter((item) => item.source_type === "note").length;

  const urlCount = items.filter((item) => item.source_type === "url").length;

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
          : "Your note was saved and indexed successfully.",
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
          : "The webpage was fetched, saved and indexed successfully.",
      );

      setUrl("");
      await fetchItems();
    } catch (err) {
      console.error("URL ingestion failed:", err);

      setError(
        err.message === "fetch failed"
          ? "Unable to fetch this webpage. Please check the URL or try another website."
          : err.message || "Unable to save this webpage.",
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

    if (
      !editingItem ||
      !editTitle.trim() ||
      !editContent.trim() ||
      updatingItem
    ) {
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
          : "Your changes were saved and re-indexed successfully.",
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
      `Delete "${item.title}"? This will also remove its indexed content.`,
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
          : item,
      ),
    );
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsed = new Date(`${date.replace(" ", "T")}Z`);

    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString();
  };

  return (
    <div className="app-shell">
      <Header />

      <main className="main-content" id="top">
        <Hero />

        <LibraryStats
          totalCount={items.length}
          noteCount={noteCount}
          urlCount={urlCount}
        />

        <Notification
          notice={notice}
          error={error}
          onDismissNotice={() => setNotice("")}
          onDismissError={() => setError("")}
        />

        {/* TWO-COLUMN DASHBOARD */}
        <section className="dashboard-grid">
          {/* SAVE KNOWLEDGE */}
          <SaveKnowledge
            activeTab={activeTab}
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            url={url}
            setUrl={setUrl}
            saving={saving}
            onSaveNote={saveNote}
            onSaveUrl={saveUrl}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setNotice("");
            }}
          />

          <ChatPanel
            messages={messages}
            asking={asking}
            question={question}
            setQuestion={setQuestion}
            onAskQuestion={askQuestion}
            onToggleSources={toggleSources}
            chatWindowRef={chatWindowRef}
            inputRef={inputRef}
          />
        </section>

        {/* TIP IS NOW OUTSIDE THE DASHBOARD GRID */}
        <aside className="tip-card">
          <div className="tip-icon">✦</div>
          <div>
            <strong>A little tip</strong>
            <p>
              Save useful articles, notes and ideas. The more you add, the more
              your knowledge assistant can help you discover.
            </p>
          </div>
        </aside>

        <SavedKnowledge
          items={items}
          refreshing={refreshing}
          onRefresh={fetchItems}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={startEditingItem}
          onDelete={deleteItem}
          deletingItemId={deletingItemId}
          formatDate={formatDate}
        />
      </main>

      <EditModal
        editingItem={editingItem}
        updatingItem={updatingItem}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editContent={editContent}
        setEditContent={setEditContent}
        onSave={saveEditedItem}
        onClose={() => setEditingItem(null)}
      />

      <Footer />
    </div>
  );
}

export default App;
