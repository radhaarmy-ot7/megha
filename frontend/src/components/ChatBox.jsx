import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function ChatBox() {
  const messagesEndRef = useRef(null);

  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("allChats");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: Date.now(),
            title: "New Chat",
            messages: [],
          },
        ];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    const saved = localStorage.getItem("allChats");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length ? parsed[0].id : Date.now();
  });

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  useEffect(() => {
    localStorage.setItem("allChats", JSON.stringify(chats));

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chats]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const updated = chats.filter((chat) => chat.id !== id);

    if (!updated.length) {
      const fallback = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      };

      setChats([fallback]);
      setCurrentChatId(fallback.id);
      return;
    }

    setChats(updated);
    setCurrentChatId(updated[0].id);
  };

  const renameChat = (id) => {
    const newTitle = prompt("Enter chat name");
    if (!newTitle) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    const tempId = Date.now();

    const userMessage = {
      sender: "user",
      text: currentMessage,
      time: new Date().toLocaleTimeString(),
    };

    const botTypingMessage = {
      id: tempId,
      sender: "bot",
      text: "✍️ Typing...",
      time: new Date().toLocaleTimeString(),
    };

    // Instant UI update
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              title:
                chat.title === "New Chat"
                  ? currentMessage.slice(0, 25)
                  : chat.title,
              messages: [...chat.messages, userMessage, botTypingMessage],
            }
          : chat
      )
    );

    setMessage("");

    try {
      const res = await axios.post(
        "https://megha-backend-kye1.onrender.com/chat",
        { message: currentMessage }
      );

      const botReply = {
        sender: "bot",
        text: res.data.reply,
        time: new Date().toLocaleTimeString(),
      };

      // Replace "Typing..." with real answer
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === tempId ? botReply : msg
                ),
              }
            : chat
        )
      );
    } catch (err) {
      const errorReply = {
        sender: "bot",
        text: "⚠️ Something went wrong. Try again.",
        time: new Date().toLocaleTimeString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.id === tempId ? errorReply : msg
                ),
              }
            : chat
        )
      );
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🤖 AI Chat</h2>

        <button className="new-chat-btn" onClick={createNewChat}>
          + New Chat
        </button>

        <input
          className="search-box"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="chat-history">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                currentChatId === chat.id ? "active" : ""
              }`}
            >
              <div
                className="chat-title"
                onClick={() => setCurrentChatId(chat.id)}
              >
                {chat.title}
              </div>

              <div className="chat-actions">
                <button onClick={() => renameChat(chat.id)}>✏️</button>
                <button onClick={() => deleteChat(chat.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="chat-container">
        <div className="chat-header">
          <span>🤖 AI Assistant</span>
          <button 
            onClick={() => copyToClipboard(currentChat?.messages.filter(m => m.sender === 'bot').map(m => m.text).join('\n\n') || '')}
            className="copy-all-btn"
          >
            📋 Copy All
          </button>
        </div>

        <div className="messages">
          {currentChat?.messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.sender}`}>
              <div className="avatar">
                {msg.sender === "user" ? "🧑" : "🤖"}
              </div>

              <div className={`message ${msg.sender}`}>
                {msg.sender === "bot" ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div>{msg.text}</div>
                )}
                <div className="message-footer">
                  <small>{msg.time}</small>
                  {msg.sender === "bot" && (
                    <button 
                      onClick={() => copyToClipboard(msg.text)}
                      className="copy-msg-btn"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef}></div>
        </div>

        <div className="input-box">
          <input
            placeholder="Ask anything... (I'll give structured answers with headings & bullet points)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button onClick={sendMessage}>Send ✨</button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;