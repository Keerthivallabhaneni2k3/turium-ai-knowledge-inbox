const express = require("express");

const router = express.Router();

const { queryKnowledgeBase } = require("../controllers/queryController");

const {
  createItem,
  getItems,
  createUrlItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

// Save a note or webpage
router.post("/ingest", createItem);
router.post("/ingest/url", createUrlItem);

// Update or delete an existing saved item
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);

// Ask questions using RAG
router.post("/query", queryKnowledgeBase);

// Retrieve saved notes and webpages
router.get("/items", getItems);

module.exports = router;