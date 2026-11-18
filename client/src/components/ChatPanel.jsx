function ChatPanel({
  messages,
  asking,
  question,
  setQuestion,
  onAskQuestion,
  onToggleSources,
  chatWindowRef,
  inputRef,
}) {
  return (
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
              Ask anything about your saved notes and webpages. I'll find
              relevant information and provide source references.
            </p>
          </div>
        ) : (
          messages.map((chatMessage) => (
            <article
              className={`chat-message ${
                chatMessage.role === "user" ? "user-message" : "ai-message"
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
                    <div className="ai-message-name">Knowledge Inbox AI</div>

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
                          onClick={() => onToggleSources(chatMessage.id)}
                          aria-label={`Toggle sources for ${chatMessage.text.slice(0, 40)}`}
                        >
                          <span>Sources ({chatMessage.sources.length})</span>

                          <span>{chatMessage.showSources ? "−" : "+"}</span>
                        </button>

                        {chatMessage.showSources && (
                          <div className="sources-list">
                            {chatMessage.sources.map((source, index) => (
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
                                    Number(source.similarity),
                                  ) && (
                                    <span>
                                      {(
                                        Number(source.similarity) * 100
                                      ).toFixed(1)}
                                      % match
                                    </span>
                                  )}
                                </div>

                                {source.snippet && <p>{source.snippet}</p>}

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
                            ))}
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
            <div className="chat-avatar" aria-hidden="true">
              ✳
            </div>

            <div className="ai-message-content">
              <div className="ai-message-name">Knowledge Inbox AI</div>

              <div className="typing-indicator" aria-label="AI is thinking">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
      </div>

      <form className="chat-composer" onSubmit={onAskQuestion}>
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
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
  );
}

export default ChatPanel;
