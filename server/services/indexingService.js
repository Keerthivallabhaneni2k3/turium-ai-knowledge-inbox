
const db = require("../database/db");
const { splitIntoChunks } = require("./chunkingService");
const { generateEmbedding } = require("./embeddingService");

const logger = require("../utils/logger");

const indexItem = async (itemId, content) => {
  const chunks = splitIntoChunks(content);

  if (chunks.length === 0) {
    throw new Error("No content available to index.");
  }

  const generatedChunks = [];

  // Generate embeddings for each chunk
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(
      chunk,
      "RETRIEVAL_DOCUMENT"
    );

    generatedChunks.push({
      text: chunk,
      embedding: JSON.stringify(embedding),
    });
  }

  // Replace existing chunks only after all embeddings succeed
  const saveChunks = db.transaction((records) => {
    db.prepare("DELETE FROM chunks WHERE item_id = ?").run(itemId);

    const insert = db.prepare(`
      INSERT INTO chunks (item_id, chunk_text, embedding)
      VALUES (?, ?, ?)
    `);

    for (const record of records) {
      insert.run(itemId, record.text, record.embedding);
    }
  });

  saveChunks(generatedChunks);

  logger.info("item_indexed", {
  itemId,
  chunkCount: generatedChunks.length,
});

  return generatedChunks.length;
};

module.exports = { indexItem };
