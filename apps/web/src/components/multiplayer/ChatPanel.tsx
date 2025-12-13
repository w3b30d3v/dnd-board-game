'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore, type ChatMessage } from '@/stores/multiplayerStore';

interface ChatPanelProps {
  sessionId: string;
  onSendMessage: (content: string, isInCharacter: boolean) => void;
  onSendWhisper?: (targetUserId: string, content: string) => void;
  maxHeight?: string;
}

export function ChatPanel({
  sessionId,
  onSendMessage,
  onSendWhisper,
  maxHeight = '400px',
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isInCharacter, setIsInCharacter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, markMessagesRead } = useMultiplayerStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when panel is visible
  useEffect(() => {
    markMessagesRead();
  }, [markMessagesRead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input.trim(), isInCharacter);
    setInput('');
    inputRef.current?.focus();
  };

  const getMessageStyle = (message: ChatMessage) => {
    if (message.isSystem) {
      switch (message.level) {
        case 'error':
          return 'bg-red-500/10 text-red-400 border-l-2 border-red-500';
        case 'warning':
          return 'bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500';
        case 'success':
          return 'bg-green-500/10 text-green-400 border-l-2 border-green-500';
        default:
          return 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500';
      }
    }
    if (message.isWhisper) {
      return 'bg-purple-500/10 text-purple-300 border-l-2 border-purple-500 italic';
    }
    if (message.isInCharacter) {
      return 'bg-amber-500/10 text-amber-200';
    }
    return 'bg-bg-elevated';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto space-y-2 p-3"
        style={{ maxHeight }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`px-3 py-2 rounded-lg ${getMessageStyle(message)}`}
            >
              {!message.isSystem && (
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.isInCharacter ? `"${message.senderName}"` : message.senderName}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.isWhisper && (
                    <span className="text-xs text-purple-400">(whisper)</span>
                  )}
                </div>
              )}
              <p className="text-sm break-words">{message.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isInCharacter ? 'Speak in character...' : 'Type a message...'}
            className="flex-1 px-3 py-2 bg-bg-elevated rounded-lg border border-border
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                     text-sm placeholder:text-text-muted"
            maxLength={1000}
          />
          <button
            type="button"
            onClick={() => setIsInCharacter(!isInCharacter)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isInCharacter
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'bg-bg-elevated text-text-secondary border border-border hover:border-text-muted'
                      }`}
            title={isInCharacter ? 'Speaking in character' : 'Speaking out of character'}
          >
            IC
          </button>
          <motion.button
            type="submit"
            disabled={!input.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </motion.button>
        </div>
      </form>
    </div>
  );
}
