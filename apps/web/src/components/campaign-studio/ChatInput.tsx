'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isGenerating,
  placeholder = 'Describe your campaign vision...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Handle submit
  const handleSubmit = () => {
    if (message.trim() && !isGenerating) {
      onSend(message.trim());
      setMessage('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-bg-card/50 p-4">
      <div className="relative">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isGenerating}
          rows={1}
          className={`
            w-full resize-none rounded-xl border border-border bg-bg-elevated
            px-4 py-3 pr-14 text-text-primary placeholder-text-muted
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />

        {/* Send button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!message.trim() || isGenerating}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            absolute right-2 bottom-2 p-2 rounded-lg
            transition-all duration-200
            ${
              message.trim() && !isGenerating
                ? 'bg-primary text-bg-dark hover:bg-primary/90'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </motion.div>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">Enter</kbd> to send,{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">Shift+Enter</kbd> for new line
        </span>
        <span className={message.length > 2000 ? 'text-red-400' : ''}>
          {message.length}/2000
        </span>
      </div>
    </div>
  );
}

export default ChatInput;
