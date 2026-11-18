function SavedKnowledge({
  items,
  refreshing,
  onRefresh,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
  deletingItemId,
  formatDate,
}) {
  return (
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
          onClick={() => onRefresh(true)}
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
                  aria-expanded={openMenuId === item.id} aria-haspopup="true"
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
                      onClick={() => onEdit(item)}
                    >
                      <span>✎</span> Edit
                    </button>

                    <button
                      type="button"
                      className="delete-action"
                      onClick={() => onDelete(item)}
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

                      {deletingItemId === item.id
                        ? "Deleting..."
                        : "Delete"}
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
  );
}

export default SavedKnowledge;
