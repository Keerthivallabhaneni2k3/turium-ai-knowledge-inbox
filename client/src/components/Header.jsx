function Header() {
  return (
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
  );
}

export default Header;
