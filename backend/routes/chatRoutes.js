const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// IMPROVED SYSTEM PROMPT with examples
const SYSTEM_PROMPT = {
  role: "system",
  content: `
You are an expert AI tutor who ALWAYS gives structured, beautiful answers.

**FORMATTING RULES (MANDATORY):**
1. Use 📌 **bold headings** for each section
2. Use bullet points (• or -) for lists
3. Use numbered steps for processes
4. Add 💡 **Example:** sections when relevant
5. Add ✅ **Summary:** at the end
6. Use line breaks between sections
7. NEVER give one-line answers

**EXAMPLE OF CORRECT FORMAT:**

📖 **Full Form:** HYPERTEXT MARKUP LANGUAGE

📌 **What it is:**
• Standard language for web pages
• Uses tags like <html>, <body>

💡 **Example:**
<h1>Hello World</h1>

✅ **Summary:** HTML structures web content

**Now follow this EXACT style for EVERY answer.**
`,
};

function trimHistory(history = []) {
  return history.slice(-6);
}

async function askAI(messages) {
  return await client.chat.completions.create({
    model: "meta/llama-3.1-8b-instruct",
    messages,
    temperature: 0.9,
    top_p: 0.95,
    max_tokens: 2000,
  });
}

router.post("/", async (req, res) => {
  try {
    let { message, history } = req.body;

    message = (message || "").trim();

    if (!message) {
      return res.status(400).json({
        reply: "❌ Message is required",
      });
    }

    // Inject format reminder into user message
    const enhancedMessage = `${message}\n\n[IMPORTANT: Please answer with headings, bullet points, examples, and a summary.]`;

    const safeHistory = trimHistory(history);

    const messages = [
      SYSTEM_PROMPT,
      ...safeHistory,
      {
        role: "user",
        content: enhancedMessage,
      },
    ];

    let response;

    try {
      response = await askAI(messages);
    } catch (err) {
      console.log("Retrying AI request...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await askAI(messages);
    }

    let reply = response?.choices?.[0]?.message?.content?.trim() || "⚠️ No response from AI";

    // FALLBACK: If reply is too short or has no structure, append a note
    if (reply.length < 100 && !reply.includes("•") && !reply.includes("📌")) {
      reply += "\n\n💡 **Tip:** I'll give more detailed answers next time. Ask me again!";
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chat Error:", error?.message || error);

    res.status(500).json({
      reply: "⚠️ Server busy. Please try again in a few seconds.",
    });
  }
});

module.exports = router;