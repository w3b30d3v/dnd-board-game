'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/stores/campaignStudioStore';

const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: { opacity: 0, y: -10, scale: 0.95 },
};

interface ChatPanelProps {
  messages: Message[];
  isGenerating: boolean;
}

export function ChatPanel({ messages, isGenerating }: ChatPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] ${
                message.role === 'user'
                  ? 'bg-primary/20 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-bg-elevated border border-border rounded-2xl rounded-tl-sm'
              } p-4`}
            >
              {/* Assistant avatar and label */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-purple-400">
                    Campaign Guide
                  </span>
                </div>
              )}

              {/* User label */}
              {message.role === 'user' && (
                <div className="flex items-center justify-end gap-2 mb-2">
                  <span className="text-xs text-primary/70">You</span>
                </div>
              )}

              {/* Message content with markdown-like formatting */}
              <div className="prose prose-invert prose-sm max-w-none">
                <MessageContent content={message.content} />
              </div>

              {/* Generated content preview */}
              {message.generatedContent && message.generatedContent.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-text-muted">
                    Generated {message.generatedContent.length} content block(s)
                  </span>
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] mt-2 ${
                  message.role === 'user' ? 'text-primary/50 text-right' : 'text-text-muted'
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3 p-4"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-500"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <span className="text-text-secondary text-sm">
              Claude is crafting your campaign...
            </span>
          </div>
        </motion.div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

// Message content renderer with basic markdown
function MessageContent({ content }: { content: string }) {
  // Process markdown-like formatting
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\n\n|\n- )/g);

  return (
    <>
      {parts.map((part, index) => {
        // Bold text
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-text-primary">
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Italic text
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="italic text-text-secondary">
              {part.slice(1, -1)}
            </em>
          );
        }
        // Code/highlight
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 bg-bg-dark/50 rounded text-primary font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        // Paragraph break
        if (part === '\n\n') {
          return <br key={index} className="my-2" />;
        }
        // List item
        if (part === '\n- ') {
          return (
            <span key={index} className="block mt-1">
              <span className="text-primary mr-2">-</span>
            </span>
          );
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Format timestamp
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export default ChatPanel;
