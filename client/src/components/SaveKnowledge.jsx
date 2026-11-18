function SaveKnowledge({
  activeTab,
  title,
  setTitle,
  content,
  setContent,
  url,
  setUrl,
  saving,
  onSaveNote,
  onSaveUrl,
  onTabChange,
}) {
  return (
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

      <div className="tabs" role="tablist" aria-label="Save content type">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "note"}
          className={activeTab === "note" ? "tab active" : "tab"}
          onClick={() => onTabChange("note")}
        >
          Write a note
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "url"}
          className={activeTab === "url" ? "tab active" : "tab"}
          onClick={() => onTabChange("url")}
        >
          Save a URL
        </button>
      </div>

      {activeTab === "note" ? (
        <form className="capture-form" onSubmit={onSaveNote}>
          <label htmlFor="note-title">Title</label>

          <input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your note a title"
            maxLength={200}
            required
          />

          <label htmlFor="note-content">Content</label>

          <textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write or paste your knowledge here..."
            rows={5}
            required
          />

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save note"}
            <span>→</span>
          </button>
        </form>
      ) : (
        <form className="capture-form" onSubmit={onSaveUrl}>
          <label htmlFor="webpage-url">Webpage URL</label>

          <input
            id="webpage-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            required
          />

          <p className="url-helper">
            <span>◎</span> We'll extract and index the webpage content for you.
          </p>

          <button className="primary-button" type="submit" disabled={saving}>
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
  );
}

export default SaveKnowledge;