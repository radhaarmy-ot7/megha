import React, { useState } from "react";
import axios from "axios";

export default function ChatBox() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");

    try {
      const res = await axios.post(
        "https://YOUR_BACKEND_URL/chat",
        {
          message: input,
          history: updatedMessages,
        }
      );

      const botMessage = {
        role: "assistant",
        content: res.data.reply,
      };

      setMessages([...updatedMessages, botMessage]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "⚠️ Server error. Try again.",
        },
      ]);
    }
  };

  return (
    <div className="chat-container">

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === "user" ? "user" : "bot"}
          >
            {/* ✅ FIX: line breaks working */}
            <div style={{ whiteSpace: "pre-line" }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="input-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}