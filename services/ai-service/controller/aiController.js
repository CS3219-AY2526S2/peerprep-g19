const aiService = require("../services/aiService");

class AIController {
    async explainQuestion(req, res) {
        try {
            const { question, code } = req.body;

            if (!question || !code) {
                return res.status(400).json({ message: "Question and code are required" });
            }

        }
    }
}