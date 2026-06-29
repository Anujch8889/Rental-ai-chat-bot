import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="typing-indicator-container">
      {/* AI Avatar */}
      <div className="chat-avatar-bot">
        🏠
      </div>

      {/* Typing Dots */}
      <div className="typing-bubble">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="typing-dot"
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
