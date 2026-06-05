const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// 🧠 SYSTEM PROMPT (FIXED FOR CHATGPT STYLE + FORMATTING)
const SYSTEM_PROMPT = {
  role: "system",
  content: `
You are a helpful AI assistant like ChatGPT.

VERY IMPORTANT RULES:
- Give simple, clear, structured answers
- Always use line breaks between points
- Use bullet points when needed
- Never write everything in one paragraph
- Keep answers easy to read
- Simple questions → short answers
- Study questions → detailed explanations
`
};

// 🧠 Trim history (prevents crashes)
function trimHistory(history = []) {
  return history.slice(-8);
}

// 🧠 AI CALL FUNCTION
async function askAI(messages) {
  return await client.chat.completions.create({
    model: "meta/llama-3.1-8b-instruct",
    messages,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 1200,
  });
}

// 🚀 MAIN ROUTE
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
      console.log("Retrying AI...");
      response = await askAI(messages);
    }

    const reply =
      response?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from AI";

    return res.json({ reply });
  } catch (error) {
    console.error("Backend Error:", error?.message || error);

    return res.status(500).json({
      reply: "⚠️ Server busy. Please try again later.",
    });
  }
});

module.exports = router;