
require("dotenv").config();

const db = require("./database/db");
const logger = require("./utils/logger");
const { indexItem } = require("./services/indexingService");

const indexExistingItems = async () => {
  try {
    const items = db.prepare(`
      SELECT * FROM items ORDER BY id
    `).all();

    logger.info("bulk_indexing_started", {
      itemCount: items.length,
    });

    for (const item of items) {
      logger.info("item_indexing_started", {
        itemId: item.id,
        title: item.title,
      });

      const count = await indexItem(item.id, item.content);

      logger.info("item_indexing_completed", {
        itemId: item.id,
        chunkCount: count,
      });
    }

    logger.info("bulk_indexing_completed", {
      itemCount: items.length,
    });
  } catch (error) {
    logger.error("bulk_indexing_failed", {
      message: error.message,
    });

    process.exitCode = 1;
  } finally {
    db.close();
  }
};

indexExistingItems();
