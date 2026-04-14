const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  aiRateLimiter,
  aiDailyRateLimiter,
} = require("../middleware/rateLimiter");
const { explainQuestion } = require("../controller/aiController");

router.post(
  "/explain",
  authenticateToken,
  aiRateLimiter,
  aiDailyRateLimiter,
  explainQuestion,
);

module.exports = router;
