function EditModal({
  editingItem,
  updatingItem,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  onSave,
  onClose,
}) {
  if (!editingItem) {
    return null;
  }

  return (
    <div
      className="edit-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !updatingItem) {
          onClose();
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
            <h2 id="edit-item-title">
              Edit {editingItem.source_type === "url" ? "webpage" : "note"}
            </h2>
            <p>Update the saved content in your knowledge inbox.</p>
          </div>

          <button
            className="edit-modal-close"
            type="button"
            onClick={onClose}
            disabled={updatingItem}
            aria-label="Close edit dialog"
          >
            ×
          </button>
        </div>

        <form className="edit-item-form" onSubmit={onSave}>
          <label htmlFor="edit-item-title-input">Title</label>

          <input
            id="edit-item-title-input"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            maxLength={200}
            required
            autoFocus
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
              onClick={onClose}
              disabled={updatingItem}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                updatingItem || !editTitle.trim() || !editContent.trim()
              }
            >
              {updatingItem ? "Saving changes..." : "Save changes"}
              <span>→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditModal;