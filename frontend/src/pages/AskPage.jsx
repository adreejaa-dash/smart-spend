import { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../api/ai';

const SUGGESTED_QUESTIONS = [
  'How much did I spend on food last month?',
  'What is my total spend this month?',
  'Which category am I spending the most on?',
  'How much did I spend on transport this year?',
  'What were my top 5 most expensive expenses?',
  'How much did I spend on bills in June?',
  'Show me my entertainment spending this month.',
];

export default function AskPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (question) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;

    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const { answer, expenses_analyzed } = await askQuestion(q);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: answer,
          meta: `Analyzed ${expenses_analyzed} expense${expenses_analyzed !== 1 ? 's' : ''}`,
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to get an answer. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '⚠️ Sorry, I ran into an issue. Please check your backend connection and try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🤖 Ask SmartSpend</h1>
        <p className="page-subtitle">
          Ask anything about your spending. Answers are grounded in your real expense data.
        </p>
      </div>

      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !loading ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Start a conversation</p>
              <p style={{ fontSize: '0.85rem', textAlign: 'center', maxWidth: 340 }}>
                Ask me about your spending habits, totals, trends, or any question about your expenses.
              </p>
              {/* Suggested questions */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 420 }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="btn btn-secondary"
                    style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.82rem' }}
                    onClick={() => sendMessage(q)}
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className={`chat-bubble chat-bubble-${msg.role}`}>
                    <div className="chat-bubble-label">
                      {msg.role === 'user' ? 'You' : '🤖 SmartSpend'}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    {msg.meta && (
                      <div style={{
                        marginTop: 8,
                        fontSize: '0.7rem',
                        opacity: 0.5,
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: 6,
                      }}>
                        {msg.meta}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {loading && (
                <div className="thinking-indicator">
                  <span>SmartSpend is thinking</span>
                  <div className="thinking-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Input Row */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            className="form-input chat-input"
            placeholder="Ask about your spending… (e.g. How much did I spend this month?)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            id="chat-send-btn"
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ flexShrink: 0 }}
          >
            {loading ? (
              <><span className="spinner" /> Thinking…</>
            ) : (
              '📨 Send'
            )}
          </button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
          Press Enter to send · Answers are based only on your stored expense data
        </p>
      </div>
    </div>
  );
}
