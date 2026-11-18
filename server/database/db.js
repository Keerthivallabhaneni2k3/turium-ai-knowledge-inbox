
const Database = require("better-sqlite3");
const path = require("path");

const logger = require("../utils/logger");

const dbPath = path.join(__dirname, "knowledge.db");

const db = new Database(dbPath);

// Improve database performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Saved notes and URLs
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('note', 'url')),
    source_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Text chunks and their embeddings
db.exec(`
  CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );
`);

logger.info("database_initialized", {
  database: "SQLite",
});

module.exports = db;
