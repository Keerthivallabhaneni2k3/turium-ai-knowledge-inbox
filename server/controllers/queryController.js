
const { searchSimilarChunks } = require("../services/searchService");
const { generateAnswer } = require("../services/answerService");

const logger = require("../utils/logger");

const queryKnowledgeBase = async (req, res) => {
  try {
    const { question } = req.body;

    // Validate question
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "A question is required (maximum 1000 characters).",
      });
    }

    // Retrieve relevant chunks
    const results = await searchSimilarChunks(
      question.trim(),
      5
    );

    // Filter weak matches
    const relevantResults = results.filter(
      (result) => result.score >= 0.60
    );

    // No relevant information found
    if (relevantResults.length === 0) {
      return res.status(200).json({
        success: true,
        question: question.trim(),
        answer:
          "I couldn't find relevant information in your saved content.",
        sources: [],
      });
    }

    // Assign citation numbers to retrieved chunks
    const answerSources = relevantResults.map(
      (result, index) => ({
        ...result,
        citation: index + 1,
      })
    );

    // Prepare sources for API response
    const sources = answerSources.map((source) => ({
      citation: source.citation,
      itemId: source.itemId,
      title: source.title,
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
      snippet: source.text,
      similarity: Number(source.score.toFixed(4)),
    }));

    // Generate AI answer using retrieved context
    const answer = await generateAnswer(
      question.trim(),
      answerSources
    );

    logger.info("knowledge_query_completed", {
  sourceCount: sources.length,
});

    return res.status(200).json({
      success: true,
      question: question.trim(),
      answer,
      sources,
    });

  } catch (error) {
    logger.error("knowledge_query_failed", {
  message: error.message,
});

    return res.status(500).json({
      success: false,
      message: "Unable to answer your question right now.",
    });
  }
};

module.exports = { queryKnowledgeBase };
