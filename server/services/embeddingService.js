
const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL = "gemini-embedding-001";

const generateEmbedding = async (
  text,
  taskType = "RETRIEVAL_DOCUMENT"
) => {
  if (!text || !text.trim()) {
    throw new Error("Text cannot be empty for embedding.");
  }

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType,
      outputDimensionality: 768,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length === 0) {
    throw new Error("Gemini returned an empty embedding.");
  }

  return embedding;
};

module.exports = { generateEmbedding };
