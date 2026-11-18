
require("dotenv").config();

const db = require("./database/db");
const logger = require("./utils/logger");
const { searchSimilarChunks } = require("./services/searchService");

const testSearch = async () => {
  try {
    const question = "What technology helps developers build user interfaces?";

    logger.info("search_test_started", { question });

    const results = await searchSimilarChunks(question);

    logger.info("search_test_completed", {
      resultCount: results.length,
      results: results.map((result, index) => ({
        rank: index + 1,
        title: result.title,
        sourceType: result.sourceType,
        similarity: Number(result.score.toFixed(4)),
        content: result.text,
      })),
    });
  } catch (error) {
    logger.error("search_test_failed", {
      message: error.message,
    });
  } finally {
    db.close();
  }
};

testSearch();
