import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserMenu from './UserMenu';
import './ChatInterface.css';

const PERSONAS = {
  hitesh: {
    id: 'hitesh',
    name: 'Hitesh Choudhary',
    description: 'Warm, encouraging teacher who loves chai and uses Hindi/Hinglish',
    color: '#ff6b35'
  },
  piyush: {
    id: 'piyush',
    name: 'Piyush Garg',
    description: 'Direct, practical educator focused on real-world projects and clean code',
    color: '#4ecdc4'
  }
};

const ChatInterface = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('hitesh');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePersonaSwitch = (persona) => {
    if (persona !== selectedPersona) {
      setSelectedPersona(persona);
      const switchMessage = {
        role: 'system',
        content: `Switched to ${PERSONAS[persona].name}`,
        timestamp: new Date().toISOString(),
        persona: persona
      };
      setMessages(prev => [...prev, switchMessage]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.filter(msg => msg.role !== 'system').map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const token = localStorage.getItem('accessToken');
      const config = {};
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await axios.post('/api/chat', {
        message: currentInput,
        persona: selectedPersona,
        conversationHistory: conversationHistory
      }, config);

      const assistantMessage = {
        role: 'assistant',
        content: response.data.data?.response || response.data.response,
        timestamp: response.data.data?.timestamp || response.data.timestamp,
        persona: selectedPersona,
        personaName: response.data.data?.personaName || response.data.personaName,
        tokensUsed: response.data.data?.tokensUsed || response.data.tokensUsed
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        onLogout();
        return;
      }
      
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        persona: selectedPersona,
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-interface">
      <header className="chat-header">
        <div className="header-content">
          <div className="header-text">
            <h1>AI Persona Chat</h1>
            <p>Welcome back, {user.firstName || user.username}!</p>
          </div>
          <div className="header-actions">
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="chat-container">
        <div className="persona-selector">
          {Object.values(PERSONAS).map(persona => (
            <button
              key={persona.id}
              onClick={() => handlePersonaSwitch(persona.id)}
              className={`persona-btn ${persona.id} ${selectedPersona === persona.id ? 'active' : ''}`}
            >
              <div className="persona-info">
                <span className="persona-name">{persona.name}</span>
                <span className="persona-desc">{persona.description}</span>
              </div>
            </button>
          ))}
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="persona-btn clear-btn"
            >
              Clear Chat
            </button>
          )}
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h3>Ready to learn, {user.firstName || user.username}? 👋</h3>
              <p>
                Choose a persona above and start your personalized programming journey. 
                Ask about coding concepts, career advice, project ideas, or just say hello!
              </p>
              <div className="conversation-starters">
                <h4>Try asking:</h4>
                <div className="starter-buttons">
                  <button 
                    className="starter-btn"
                    onClick={() => setInput("What's the difference between React hooks and class components?")}
                  >
                    "What's the difference between React hooks and class components?"
                  </button>
                  <button 
                    className="starter-btn"
                    onClick={() => setInput("How do I get started with full-stack development?")}
                  >
                    "How do I get started with full-stack development?"
                  </button>
                  <button 
                    className="starter-btn"
                    onClick={() => setInput("What programming languages should I learn first?")}
                  >
                    "What programming languages should I learn first?"
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              message.role === 'system' ? (
                <div key={index} className="system-message">
                  {message.content}
                </div>
              ) : (
                <div key={index} className={`message ${message.role} ${message.persona || ''}`}>
                  {message.role === 'assistant' && (
                    <div className="message-wrapper">
                      <div className={`persona-label ${message.persona}`}>
                        {message.personaName || PERSONAS[message.persona]?.name}
                      </div>
                      <div className="message-content">
                        {message.content}
                      </div>
                      {message.tokensUsed && (
                        <div className="message-meta">
                          {message.tokensUsed} tokens used
                        </div>
                      )}
                    </div>
                  )}
                  {message.role === 'user' && (
                    <div className="message-content">
                      {message.content}
                    </div>
                  )}
                </div>
              )
            ))
          )}
          
          {loading && (
            <div className="loading">
              <div className={`persona-label ${selectedPersona}`}>
                {PERSONAS[selectedPersona].name} is thinking...
              </div>
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form onSubmit={sendMessage} className="chat-input-form">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={`Ask ${PERSONAS[selectedPersona].name} anything about programming...`}
              className="chat-input"
              disabled={loading}
              rows="1"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="send-btn"
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <span>Send</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;