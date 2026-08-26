import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Bot,
  X,
  Send,
  Trash2,
  Sparkles,
  ChevronDown,
  User,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export function Chatbot() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);
  const isStaff = ['faculty', 'staff'].includes(role);

  const getInitialMessage = () => {
    const name = user?.name || user?.username || 'User';
    if (isAdmin) {
      return {
        id: 'init-admin',
        sender: 'ai',
        text: `👑 Welcome Administrator ${name}! I am your Executive AI Management Assistant.\n\nI can help you monitor university financial health, verify fee payments, manage faculty & students, track admission applications, and configure payment settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'Pending Payment Verifications',
          'Payment Configuration Settings',
          'Admission Applications',
          'Faculty & Staff Directory',
          'University Revenue & Fees'
        ]
      };
    } else if (isStaff) {
      return {
        id: 'init-staff',
        sender: 'ai',
        text: `👨‍🏫 Welcome Professor ${name}! I am your Faculty AI Academic Assistant.\n\nI can help you record student attendance, view your assigned cohort schedules, upload study materials, and enter assessment marks.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'Mark Student Attendance',
          'My Assigned Batches & Schedule',
          'Upload Study Materials',
          'Enter Assessment Marks',
          'Department Notices'
        ]
      };
    } else {
      return {
        id: 'init-student',
        sender: 'ai',
        text: `👋 Hello ${name}! I am your Student AI Academic Assistant.\n\nI can look up your attendance percentage, fee balance & payment receipts, exam marks, course study materials, and completion certificates.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'What is my attendance?',
          'How much fee is pending?',
          'What are my marks?',
          'Download study materials',
          'Show latest notices'
        ]
      };
    }
  };

  const [messages, setMessages] = useState([getInitialMessage()]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync initial message when user changes
  useEffect(() => {
    setMessages([getInitialMessage()]);
  }, [user]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(query);
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response?.reply || 'I processed your request. Please check the relevant module.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response?.suggested_actions || []
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ Error: ${err.message || 'Unable to communicate with the University AI service. Please verify your connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([getInitialMessage()]);
  };


  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="chatbot-floating-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open University AI Assistant"
          title="Open University AI Assistant"
        >
          <div className="chatbot-icon-pulse">
            <Bot size={22} color="#ffffff" />
          </div>
          <span className="chatbot-trigger-text">AI Assistant</span>
        </button>
      )}

      {/* Chatbot Popup Dialog */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="chatbot-header-avatar">
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                  University AI Assistant
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#cbd5e1' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span>Active • {user?.role ? user.role.toUpperCase() : 'USER'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={handleClearChat}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="chatbot-msg-avatar ai">
                    <Bot size={14} color="var(--primary-blue)" />
                  </div>
                )}

                <div className="chatbot-msg-content">
                  <div className={`chatbot-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'} ${msg.isError ? 'error-bubble' : ''}`}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {msg.text}
                    </div>
                  </div>

                  <div className={`chatbot-timestamp ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="chatbot-action-chips">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="chatbot-chip"
                          onClick={() => handleSendMessage(action)}
                        >
                          <Sparkles size={11} />
                          <span>{action}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="chatbot-msg-avatar user">
                    <User size={13} color="#ffffff" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="chatbot-message-row ai-row">
                <div className="chatbot-msg-avatar ai">
                  <Bot size={14} color="var(--primary-blue)" />
                </div>
                <div className="chatbot-bubble ai-bubble" style={{ padding: '0.65rem 0.85rem' }}>
                  <div className="chatbot-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="chatbot-footer">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                type="text"
                className="chatbot-input"
                placeholder="Ask about attendance, fees, marks, notices..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                maxLength={500}
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!inputValue.trim() || loading}
                title="Send query"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
            <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px', textAlign: 'center' }}>
              University data is role-protected. Press Enter to send.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

