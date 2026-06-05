const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const SYSTEM_PROMPT = {
  role: "system",
  content: `
You are an expert AI tutor.

Rules:
- Give clear, structured, and detailed answers
- Use headings, bullet points, and examples
- Explain step-by-step like a teacher
- Fix grammar if needed
- If question is unclear, interpret it smartly
- Never give short answers
`,
};

// trim history to prevent crashes
function trimHistory(history = []) {
  return history.slice(-8);
}

// API CALL FUNCTION (with retry)
async function askAI(messages) {
  return await client.chat.completions.create({
    model: "meta/llama-3.1-8b-instruct",
    messages,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 1200,
  });
}

router.post("/", async (req, res) => {
  try {
    let { message, history } = req.body;

    message = (message || "").trim();

    if (!message) {
      return res.status(400).json({
        reply: "Message is required",
      });
    }

    const safeHistory = trimHistory(history);

    const messages = [
      SYSTEM_PROMPT,
      ...safeHistory,
      {
        role: "user",
        content: message,
      },
    ];

    let response;

    try {
      response = await askAI(messages);
    } catch (err) {
      console.log("Retrying AI request...");
      response = await askAI(messages);
    }

    const reply =
      response?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from AI";

    res.json({ reply });
  } catch (error) {
    console.error("Chat Error:", error?.message || error);

    res.status(500).json({
      reply: "⚠️ Server busy. Please try again in a few seconds.",
    });
  }
});

module.exports = router;