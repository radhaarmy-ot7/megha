const express = require("express");
const axios = require("axios");

const router = express.Router();

const SYSTEM_PROMPT = {
  role: "system",
  content: `
You are an expert AI tutor like ChatGPT.

Rules:
- Give detailed, structured, and clear answers
- Use headings, bullet points, and steps
- Explain like teaching a student
- Always include examples when possible
- Never give short or incomplete answers
- Break complex topics into simple parts
- Be accurate and helpful
`,
};

// 🔥 limit history to avoid slow / crash
function trimHistory(history = []) {
  return history.slice(-10); // keep last 10 messages only
}

// 🔥 retry function for stability
async function callAI(messages) {
  return await axios.post(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      model: "meta/llama-3.1-70b-instruct",
      messages,
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 1200,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 25000,
    }
  );
}

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Message cannot be empty",
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

    // 🔥 try once
    try {
      response = await callAI(messages);
    } catch (err) {
      console.warn("Retrying AI call...");
      // 🔥 retry once if fails
      response = await callAI(messages);
    }

    const botReply =
      response?.data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ No response from AI";

    return res.json({
      reply: botReply,
    });
  } catch (error) {
    console.error("Chat API Error:", error?.response?.data || error.message);

    return res.status(500).json({
      reply:
        "⚠️ Server is busy right now. Please try again in a few seconds.",
    });
  }
});

module.exports = router;