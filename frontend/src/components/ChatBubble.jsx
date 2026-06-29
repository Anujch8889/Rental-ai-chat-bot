import React from 'react';

const ChatBubble = ({ message, role, timestamp }) => {
  const isUser = role === 'user';

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`chat-bubble-container ${isUser ? 'user' : 'bot'}`}>
      <div className="chat-bubble-content" style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
        {/* Avatar */}
        {!isUser ? (
          <div className="chat-avatar-bot">
            🏠
          </div>
        ) : (
          <div className="chat-avatar-user">
            👤
          </div>
        )}

        {/* Message Bubble */}
        <div className={`bubble-text-panel ${isUser ? 'user' : 'bot'}`}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
          {timestamp && (
            <div className={`bubble-time ${isUser ? 'user' : 'bot'}`}>
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
