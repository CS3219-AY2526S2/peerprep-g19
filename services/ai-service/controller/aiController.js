const axios = require("axios");
const aiService = require("../services/aiService");

const QUESTION_SERVICE_URL =
  process.env.QUESTION_SERVICE_URL || "http://localhost:8000";

  const explainQuestion = async (req, res) => {
    try {
      const { questionid, code } = req.body;

      if (!questionid || !code) {
        return res
          .status(400)
          .json({ message: "Question ID and code are required" });
      }

      const question = await axios.get(
        `${QUESTION_SERVICE_URL}/questions/${questionid}`,
      );
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const explanation = await aiService.explainQuestion(question, code);
      return res.status(200).json({ questionid, explanation });
    } catch (error) {
      if (error.response) {
        return res.status(502).json({
          message: "Failed to fetch question from question service",
          detail: error.response.data,
        });
      }
      return res.status(500).json({
        message: "Failed to explain question",
        detail: error.message,
      });
    }
  }
}

module.exports = { explainQuestion };