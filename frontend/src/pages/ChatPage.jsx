import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Plus, Settings, Sparkles, MessageSquare } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import { chatAPI } from '../api';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom using container scrollTo (prevents window scrolling)
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('rental_chat_session');
    if (savedSessionId) {
      loadExistingSession(savedSessionId);
    } else {
      startNewSession();
    }
  }, []);

  // Safety net to ensure the window viewport never scrolls/shifts
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-focus input when user starts typing anywhere on the screen
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore key combinations with Ctrl, Alt, Meta
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // Check if target is already an input/textarea
      const active = document.activeElement;
      if (active && (
        active.tagName === 'INPUT' || 
        active.tagName === 'TEXTAREA' || 
        active.isContentEditable
      )) {
        return;
      }

      // Check if input is disabled
      if (inputRef.current && inputRef.current.disabled) {
        return;
      }

      // If it's a single character key, focus the input and append it
      if (e.key.length === 1) {
        e.preventDefault(); // Prevent browser defaults (e.g. spacebar page scroll)
        if (inputRef.current) {
          inputRef.current.focus();
          setInputValue((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const suggestions = [
    { text: '🏠 Rent a flat', label: 'Rent flat/apartment' },
    { text: '🏢 Rent a shop / commercial office', label: 'Rent shop/office' },
    { text: '🔑 Buy flat or row house', label: 'Buy flat/house' },
    { text: '📍 Search by specific area/city', label: 'Search areas' }
  ];

  const handleSuggestionClick = async (text) => {
    if (isTyping || !sessionId) return;
    
    // Focus input so user stays engaged
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const data = await chatAPI.sendMessage(sessionId, text);
      if (data.success) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Send suggestion error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again. 😅',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const loadExistingSession = async (sid) => {
    try {
      const data = await chatAPI.getHistory(sid);
      if (data.success && data.messages.length > 0) {
        setSessionId(sid);
        setMessages(data.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
        })));
      } else {
        startNewSession();
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      startNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      setMessages([]);
      setIsTyping(true);
      const data = await chatAPI.startSession();
      if (data.success) {
        setSessionId(data.sessionId);
        localStorage.setItem('rental_chat_session', data.sessionId);
        setMessages([{
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please refresh the page to try again! 😅',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    localStorage.removeItem('rental_chat_session');
    setMessages([]);
    setSessionId(null);
    setIsLoading(true);
    startNewSession();
  };

  const handleSend = async () => {
    const msg = inputValue.trim();
    if (!msg || isTyping || !sessionId) return;

    const userMessage = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const data = await chatAPI.sendMessage(sessionId, msg);
      if (data.success) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again. 😅',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">🏠</div>
          <div className="loading-title">Starting RentalBot AI...</div>
          <div className="loading-progress-bar">
            <div className="loading-progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Background Effects */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-bot-avatar">
            <span style={{ fontSize: '22px' }}>🏠</span>
          </div>
          <div>
            <h1 className="chat-bot-name">RentalBot AI</h1>
            <div className="chat-status-row">
              <div className="chat-status-dot"></div>
              <span className="chat-status-text">Online</span>
            </div>
          </div>
        </div>
        <div className="chat-header-right">
          <button onClick={handleNewChat} className="chat-header-btn" title="New Chat">
            <Plus size={18} />
            <span className="chat-header-btn-text">New Chat</span>
          </button>
          <Link to="/admin" className="chat-header-btn" title="Admin Panel">
            <Settings size={18} />
          </Link>
        </div>
      </header>

      {/* Messages Area */}
      <main className="chat-messages-area" ref={messagesContainerRef}>
        <div className="chat-messages-inner">
          {messages.length === 0 && !isTyping && (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">🏠</div>
              <h2 className="chat-empty-title">Welcome to RentalBot AI</h2>
              <p className="chat-empty-subtitle">
                Your smart assistant to find the perfect property.
                Tell me what you're looking for!
              </p>
              <div className="suggestions-grid">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sug.text)}
                    className="suggestion-card"
                  >
                    <div className="suggestion-label">{sug.label}</div>
                    <div className="suggestion-text">{sug.text}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <ChatBubble
              key={index}
              message={msg.content}
              role={msg.role}
              timestamp={msg.timestamp}
            />
          ))}

          {isTyping && <TypingIndicator />}
        </div>
      </main>

      {/* Input Area */}
      <footer className="chat-input-area">
        <div className="chat-input-container">
          {messages.length > 0 && !isTyping && (
            <div className="chips-row">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(sug.text)}
                  className="chip-btn"
                >
                  {sug.text.split(' ')[0]} {sug.label}
                </button>
              ))}
            </div>
          )}
          <div className="chat-input-wrapper">
            <Sparkles size={18} style={{ color: '#6c5ce7', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="chat-input-field"
              disabled={isTyping}
              id="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="chat-send-btn"
              id="send-button"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="chat-disclaimer">
            <MessageSquare size={12} style={{ opacity: 0.5 }} />
            RentalBot AI helps you find properties. Your conversation is saved for follow-up.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
