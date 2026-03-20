const axios = require("axios");

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = "gpt";
  }

  async explainQuestion(question, userCode) {}
  buildPrompt(question, userCode) {}
}

module.exports = new AIService();
