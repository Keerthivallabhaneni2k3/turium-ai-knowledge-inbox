function LibraryStats({ totalCount, noteCount, urlCount }) {
  return (
    <section className="stats-grid" aria-label="Library statistics">
      <article className="stat-card">
        <div className="stat-icon purple">✦</div>
        <div>
          <span>Total knowledge</span>
          <strong>{totalCount}</strong>
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
  );
}

export default LibraryStats;