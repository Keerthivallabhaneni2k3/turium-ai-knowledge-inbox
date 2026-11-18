const db = require("../database/db");
const { extractUrlContent } = require("../services/urlService");
const { indexItem } = require("../services/indexingService");

const logger = require("../utils/logger");

// POST /ingest
const createItem = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const statement = db.prepare(`
      INSERT INTO items (title, content, source_type)
      VALUES (?, ?, ?)
    `);

    const result = statement.run(title.trim(), content.trim(), "note");
    const savedItem = db
      .prepare("SELECT * FROM items WHERE id = ?")
      .get(result.lastInsertRowid);

    let indexed = false;

    try {
      await indexItem(savedItem.id, savedItem.content);
      indexed = true;
    } catch (indexError) {
logger.error("note_indexing_failed", { itemId: savedItem.id, message: indexError.message });
    }

    return res.status(201).json({
      success: true,
      message: "Note saved successfully!",
      indexed,
      item: savedItem,
    });
  } catch (error) {
    logger.error("create_item_failed", { message: error.message });
    return res.status(500).json({
      success: false,
      message: "Unable to save note.",
    });
  }
};

// GET /items
const getItems = (req, res) => {
  try {
    const items = db
      .prepare("SELECT * FROM items ORDER BY created_at DESC, id DESC")
      .all();

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    logger.error("get_items_failed", { message: error.message });
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve saved items.",
    });
  }
};

// POST /ingest/url
const createUrlItem = async (req, res) => {
  try {
    const { url } = req.body;

    if (typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid URL is required.",
      });
    }

    const webpage = await extractUrlContent(url.trim());

    const statement = db.prepare(`
      INSERT INTO items (title, content, source_type, source_url)
      VALUES (?, ?, ?, ?)
    `);

    const result = statement.run(
      webpage.title,
      webpage.content,
      "url",
      webpage.url,
    );

    const savedItem = db
      .prepare("SELECT * FROM items WHERE id = ?")
      .get(result.lastInsertRowid);

    let indexed = false;

    try {
      await indexItem(savedItem.id, savedItem.content);
      indexed = true;
    } catch (indexError) {
      logger.error("url_indexing_failed", { itemId: savedItem.id, message: indexError.message });
    }

    return res.status(201).json({
      success: true,
      message: "URL content saved successfully!",
      indexed,
      item: savedItem,
    });
  } catch (error) {
    logger.error("url_ingestion_failed", { message: error.message });

    const isInvalidUrl =
      error.message.includes("Invalid URL") ||
      error.message.includes("Only HTTP") ||
      error.message.includes("Local URLs") ||
      error.message.includes("must point") ||
      error.message.includes("No readable content");

    return res.status(isInvalidUrl ? 400 : 502).json({
      success: false,
      message: error.message || "Unable to process URL.",
    });
  }
};

// PUT /items/:id
// Updates the saved item and rebuilds its searchable chunks/embeddings.
const updateItem = async (req, res) => {
  try {
    const itemId = Number(req.params.id);
    const { title, content } = req.body;

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid item ID is required.",
      });
    }

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const existingItem = db
      .prepare("SELECT * FROM items WHERE id = ?")
      .get(itemId);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Saved item not found.",
      });
    }

    // Update the item and remove its old chunks in one SQLite transaction.
    const updateAndClearChunks = db.transaction(() => {
      db.prepare(
        `
        UPDATE items
        SET title = ?, content = ?
        WHERE id = ?
      `,
      ).run(title.trim(), content.trim(), itemId);

      db.prepare("DELETE FROM chunks WHERE item_id = ?").run(itemId);
    });

    updateAndClearChunks();

    let indexed = false;

    try {
      await indexItem(itemId, content.trim());
      indexed = true;
    } catch (indexError) {
      // Do not leave a partially-created set of chunks behind.
      db.prepare("DELETE FROM chunks WHERE item_id = ?").run(itemId);
      logger.error("updated_item_indexing_failed", { itemId, message: indexError.message });
    }

    const updatedItem = db
      .prepare("SELECT * FROM items WHERE id = ?")
      .get(itemId);

    return res.status(200).json({
      success: true,
      message: "Saved item updated successfully.",
      indexed,
      item: updatedItem,
    });
  } catch (error) {
    logger.error("update_item_failed", { message: error.message });
    return res.status(500).json({
      success: false,
      message: "Unable to update saved item.",
    });
  }
};

// DELETE /items/:id
const deleteItem = (req, res) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid item ID is required.",
      });
    }

    const result = db.prepare("DELETE FROM items WHERE id = ?").run(itemId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Saved item not found.",
      });
    }

    // The chunks table uses ON DELETE CASCADE, so indexed chunks are removed too.
    return res.status(200).json({
      success: true,
      message: "Saved item and its indexed content deleted successfully.",
    });
  } catch (error) {
    logger.error("delete_item_failed", { message: error.message });
    return res.status(500).json({
      success: false,
      message: "Unable to delete saved item.",
    });
  }
};

module.exports = {
  createItem,
  getItems,
  createUrlItem,
  updateItem,
  deleteItem,
};
