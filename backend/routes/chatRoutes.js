const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;

    // 1. Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Message cannot be empty",
      });
    }

    // 2. System instruction (stronger + cleaner)
    const systemPrompt = {
      role: "system",
      content: `
You are a highly intelligent AI tutor like ChatGPT.

Rules:
- Give detailed, step-by-step explanations
- Use simple language for students
- Add examples when needed
- Use headings and bullet points
- Always be helpful and clear
- Break complex topics into easy parts
- Do not give short answers
      `,
    };

    // 3. Build conversation
    const messages = [
      systemPrompt,
      ...(Array.isArray(history) ? history : []),
      {
        role: "user",
        content: message,
      },
    ];

    // 4. Call NVIDIA API
    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: "meta/llama-3.1-70b-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    // 5. Extract reply
    const botReply =
      response?.data?.choices?.[0]?.message?.content ||
      "⚠️ No response from AI";

    return res.json({
      reply: botReply,
    });
  } catch (error) {
    console.error("Chat API Error:", error?.response?.data || error.message);

    return res.status(500).json({
      reply: "⚠️ Server error. Please try again later.",
    });
  }
});

module.exports = router;