import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import axios from "axios";

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

  const [currentChatId, setCurrentChatId] =
    useState(
      chats.length
        ? chats[0].id
        : Date.now()
    );

  useEffect(() => {
    localStorage.setItem(
      "allChats",
      JSON.stringify(chats)
    );

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chats]);

  const currentChat = chats.find(
    (chat) => chat.id === currentChatId
  );

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
    const updatedChats = chats.filter(
      (chat) => chat.id !== id
    );

    if (updatedChats.length === 0) {
      const defaultChat = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      };

      setChats([defaultChat]);
      setCurrentChatId(defaultChat.id);
      return;
    }

    setChats(updatedChats);
    setCurrentChatId(updatedChats[0].id);
  };

  const renameChat = (id) => {
    const newTitle = prompt(
      "Enter chat name"
    );

    if (!newTitle) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              title: newTitle,
            }
          : chat
      )
    );
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;

    const userMessage = {
      sender: "user",
      text: currentMessage,
      time: new Date().toLocaleTimeString(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              title:
                chat.title === "New Chat"
                  ? currentMessage.slice(
                      0,
                      25
                    )
                  : chat.title,
              messages: [
                ...chat.messages,
                userMessage,
              ],
            }
          : chat
      )
    );

    setMessage("");

    try {
      const res = await axios.post(
        "https://megha-backend-kye1.onrender.com",
        {
          message: currentMessage,
        }
      );

      const botMessage = {
        sender: "bot",
        text: res.data.reply,
        time: new Date().toLocaleTimeString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  botMessage,
                ],
              }
            : chat
        )
      );
    } catch (error) {
      console.error(error);

      const errorMessage = {
        sender: "bot",
        text: "⚠️ Backend Error",
        time: new Date().toLocaleTimeString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  errorMessage,
                ],
              }
            : chat
        )
      );
    }
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.title
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="layout">

      <div className="sidebar">

        <h2>🤖 AI Chat</h2>

        <button
          className="new-chat-btn"
          onClick={createNewChat}
        >
          + New Chat
        </button>

        <input
          className="search-box"
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <p className="chat-count">
          Chats: {chats.length}
        </p>

        <div className="chat-history">

          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                currentChatId === chat.id
                  ? "active-chat"
                  : ""
              }`}
            >
              <div
                className="chat-title"
                onClick={() =>
                  setCurrentChatId(chat.id)
                }
              >
                {chat.title}
              </div>

              <div className="chat-actions">

                <button
                  onClick={() =>
                    renameChat(chat.id)
                  }
                >
                  ✏️
                </button>

                <button
                  onClick={() =>
                    deleteChat(chat.id)
                  }
                >
                  🗑️
                </button>

              </div>
            </div>
          ))}

        </div>

      </div>

      <div className="chat-container">

        <div className="chat-header">
          AI Assistant
        </div>

        <div className="messages">

          {currentChat?.messages.map(
            (msg, index) => (
              <div
                key={index}
                className={`message-row ${msg.sender}`}
              >
                <div className="avatar">
                  {msg.sender === "user"
                    ? "🧑"
                    : "🤖"}
                </div>

                <div
                  className={`message ${msg.sender}`}
                >
                  <div>{msg.text}</div>

                  <small>
                    {msg.time}
                  </small>
                </div>
              </div>
            )
          )}

          <div ref={messagesEndRef}></div>

        </div>

        <div className="input-box">

          <input
            type="text"
            placeholder="Ask anything..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

export default ChatBox;