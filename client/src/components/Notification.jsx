function Notification({ notice, error, onDismissNotice, onDismissError }) {
  if (!notice && !error) {
    return null;
  }

  return (
    <div className="notification-container">
      {error && (
        <div className="alert error-alert" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={onDismissError}
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
            onClick={onDismissNotice}
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default Notification;