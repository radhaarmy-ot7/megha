const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    // 1. Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Message cannot be empty",
      });
    }

    // 2. Call AI API
    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000, // ⏱ prevents hanging requests
      }
    );

    // 3. Safe response extraction
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