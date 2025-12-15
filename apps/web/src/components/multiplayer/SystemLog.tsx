'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore, type ChatMessage } from '@/stores/multiplayerStore';

interface SystemLogProps {
  maxHeight?: string;
  showSystemOnly?: boolean;
}

export function SystemLog({ maxHeight = '200px', showSystemOnly = true }: SystemLogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages } = useMultiplayerStore();

  // Filter to only system messages if requested
  const displayMessages = showSystemOnly
    ? messages.filter((m) => m.isSystem)
    : messages;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const getMessageStyle = (message: ChatMessage) => {
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
  };

  if (displayMessages.length === 0) {
    return (
      <div
        className="overflow-y-auto p-3 text-center text-text-muted text-sm"
        style={{ maxHeight }}
      >
        No system messages yet
      </div>
    );
  }

  return (
    <div className="overflow-y-auto space-y-2 p-3" style={{ maxHeight }}>
      <AnimatePresence mode="popLayout">
        {displayMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`px-3 py-2 rounded-lg text-sm ${getMessageStyle(message)}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-text-muted">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="break-words flex-1">{message.content}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
}
