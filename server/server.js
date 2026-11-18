const express = require("express");
const cors = require("cors");
require("dotenv").config();
const logger = require("./utils/logger");

const itemRoutes = require("./routes/itemRoutes");

const db = require("./database/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Turium AI Knowledge Inbox API is running!",
  });
});

app.use("/", itemRoutes);

// Database health check
app.get("/db-check", (req, res) => {
  try {
    const result = db.prepare("SELECT COUNT(*) AS count FROM items").get();

    res.status(200).json({
      success: true,
      message: "Database connected successfully!",
      savedItems: result.count,
    });
  } catch (error) {
    logger.error("database_check_failed", {
      message: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Server configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info("server_started", {
    port: PORT,
    url: `http://localhost:${PORT}`,
  });
});
