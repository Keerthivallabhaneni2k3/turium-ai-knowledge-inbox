
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateAnswer = async (question, sources) => {
  const context = sources
    .map((source, index) => {
      return `
SOURCE [${index + 1}]
Title: ${source.title}
Content: ${source.text}
`;
    })
    .join("\n");

  const prompt = `
You are an AI assistant for a personal knowledge inbox.

Answer the user's question using ONLY the information
provided in the sources below.

Rules:
1. Do not invent facts.
2. If the sources do not contain the answer, say so.
3. Cite supporting sources using [1], [2], etc.
4. Keep the answer clear and concise.
5. Distinguish between facts in the sources and anything
   the sources do not establish.

SAVED SOURCES:
${context}

USER QUESTION:
${question}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  });

  const answer = response.text;

  if (!answer) {
    throw new Error("Gemini returned an empty answer.");
  }

  return answer;
};

module.exports = { generateAnswer };
