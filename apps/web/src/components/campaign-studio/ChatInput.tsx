'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedFile {
  file: File;
  id: string;
  type: 'pdf' | 'txt' | 'doc';
}

interface ChatInputProps {
  onSend: (message: string, files?: File[], googleDocUrl?: string) => void;
  isGenerating: boolean;
  placeholder?: string;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatInput({
  onSend,
  isGenerating,
  placeholder = 'Describe your campaign vision...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return `${file.name}: Unsupported file type. Please upload PDF, TXT, or DOC files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 10MB.`;
    }
    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        const fileType = ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES];
        validFiles.push({
          file,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: fileType as 'pdf' | 'txt' | 'doc',
        });
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const validateGoogleDocUrl = (url: string): boolean => {
    const googleDocPattern = /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/[a-zA-Z0-9_-]+/;
    return googleDocPattern.test(url);
  };

  // Handle submit
  const handleSubmit = () => {
    const hasContent = message.trim() || files.length > 0 || googleDocUrl.trim();

    if (hasContent && !isGenerating) {
      // Validate Google Doc URL if provided
      if (googleDocUrl.trim() && !validateGoogleDocUrl(googleDocUrl.trim())) {
        setError('Invalid Google Docs URL. Please provide a valid sharing link.');
        return;
      }

      onSend(
        message.trim(),
        files.length > 0 ? files.map((f) => f.file) : undefined,
        googleDocUrl.trim() || undefined
      );

      // Reset state
      setMessage('');
      setFiles([]);
      setGoogleDocUrl('');
      setShowUrlInput(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = message.trim() || files.length > 0 || googleDocUrl.trim();

  return (
    <div className="border-t border-border bg-bg-card/50 p-4">
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File chips */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mb-3"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm"
              >
                <FileIcon type={file.type} />
                <span className="text-text-primary max-w-[150px] truncate">
                  {file.file.name}
                </span>
                <span className="text-text-muted text-xs">
                  ({(file.file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-text-muted hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Doc URL input */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={googleDocUrl}
                  onChange={(e) => setGoogleDocUrl(e.target.value)}
                  placeholder="Paste Google Docs sharing link..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-input-border bg-white text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {googleDocUrl && (
                  <button
                    onClick={() => setGoogleDocUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowUrlInput(false)}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Make sure the document is set to &quot;Anyone with the link can view&quot;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input area */}
      <div
        className={`relative rounded-xl border-2 transition-colors ${
          isDragOver
            ? 'border-primary border-dashed bg-primary/5'
            : 'border-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl z-10 pointer-events-none">
            <div className="text-primary font-medium">Drop files here</div>
          </div>
        )}

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
            w-full resize-none rounded-xl border border-input-border
            px-4 py-3 pr-28
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
          style={{
            minHeight: '48px',
            maxHeight: '200px',
            backgroundColor: '#FFFFFF',
            color: '#18181B'
          }}
        />

        {/* Action buttons */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* File upload button */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isGenerating}
            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            title="Upload file (PDF, TXT, DOC)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </motion.button>

          {/* Google Docs button */}
          <motion.button
            onClick={() => setShowUrlInput(!showUrlInput)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isGenerating}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              showUrlInput || googleDocUrl
                ? 'text-primary bg-primary/10'
                : 'text-text-muted hover:text-primary hover:bg-primary/10'
            }`}
            title="Import from Google Docs"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </motion.button>

          {/* Send button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!hasContent || isGenerating}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-2 rounded-lg
              transition-all duration-200
              ${
                hasContent && !isGenerating
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
        <span>
          <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">Enter</kbd> send,{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">Shift+Enter</kbd> new line
          {' '}&bull;{' '}Drag & drop files or click 📎
        </span>
        <span className={message.length > 2000 ? 'text-red-400' : ''}>
          {message.length}/2000
        </span>
      </div>
    </div>
  );
}

function FileIcon({ type }: { type: 'pdf' | 'txt' | 'doc' }) {
  const colors = {
    pdf: 'text-red-400',
    txt: 'text-blue-400',
    doc: 'text-blue-500',
  };

  return (
    <svg className={`w-4 h-4 ${colors[type]}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
}

export default ChatInput;
