
const db = require("../database/db");
const { generateEmbedding } = require("./embeddingService");

const cosineSimilarity = (vectorA, vectorB) => {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Embedding dimensions do not match.");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] ** 2;
    magnitudeB += vectorB[i] ** 2;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

const searchSimilarChunks = async (question, limit = 3) => {
  // Generate embedding for the user's question
  const questionEmbedding = await generateEmbedding(
    question,
    "RETRIEVAL_QUERY"
  );

  // Retrieve stored chunks with their original source details
  const storedChunks = db.prepare(`
    SELECT
      chunks.id AS chunk_id,
      chunks.item_id,
      chunks.chunk_text,
      chunks.embedding,
      items.title,
      items.source_type,
      items.source_url
    FROM chunks
    INNER JOIN items ON items.id = chunks.item_id
    WHERE chunks.embedding IS NOT NULL
  `).all();

  // Calculate similarity scores
  const results = storedChunks.map((chunk) => {
    const storedEmbedding = JSON.parse(chunk.embedding);

    return {
      chunkId: chunk.chunk_id,
      itemId: chunk.item_id,
      title: chunk.title,
      sourceType: chunk.source_type,
      sourceUrl: chunk.source_url,
      text: chunk.chunk_text,
      score: cosineSimilarity(
        questionEmbedding,
        storedEmbedding
      ),
    };
  });

  // Sort by relevance and return top matches
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

module.exports = {
  cosineSimilarity,
  searchSimilarChunks,
};
