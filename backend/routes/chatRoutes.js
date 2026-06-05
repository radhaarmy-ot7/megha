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
You are an intelligent AI assistant.

Rules:
- Give clear, structured, and detailed answers
- Fix grammar mistakes before answering
- If question is unclear, interpret it intelligently
- Use headings, bullet points, and examples
- For coding: provide clean code + explanation
- For studies: exam-ready answers
- Be friendly, accurate, and helpful
`,
};

// trim input safety
function cleanMessage(msg) {
  return (msg || "").trim();
}

router.post("/", async (req, res) => {
  try {
    const message = cleanMessage(req.body.message);

    if (!message) {
      return res.status(400).json({
        reply: "Message is required",
      });
    }

    const completion = await client.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",

      messages: [
        SYSTEM_PROMPT,
        {
          role: "user",
          content: message,
        },
      ],

      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1200,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from AI";

    return res.json({ reply });
  } catch (error) {
    console.error("NVIDIA Error:", error?.message || error);

    return res.status(500).json({
      reply: "⚠️ Server is busy. Please try again in a few seconds.",
    });
  }
});

module.exports = router;