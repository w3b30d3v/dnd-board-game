import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '@/components/campaign-studio/ChatInput';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

// Helper to get the send button (last button in the input area)
const getSendButton = () => {
  const buttons = screen.getAllByRole('button');
  return buttons[buttons.length - 1]; // Send button is the last one
};

describe('ChatInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea with placeholder', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText('Describe your campaign vision...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <ChatInput
          onSend={mockOnSend}
          isGenerating={false}
          placeholder="Custom placeholder"
        />
      );

      const textarea = screen.getByPlaceholderText('Custom placeholder');
      expect(textarea).toBeInTheDocument();
    });

    it('should render action buttons (file upload, google docs, send)', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // file upload, google docs, send
    });

    it('should render file upload button', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const fileButton = screen.getByTitle('Upload file (PDF, TXT, DOC)');
      expect(fileButton).toBeInTheDocument();
    });

    it('should render google docs button', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const googleDocsButton = screen.getByTitle('Import from Google Docs');
      expect(googleDocsButton).toBeInTheDocument();
    });

    it('should render helper text with keyboard shortcuts', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('Shift+Enter')).toBeInTheDocument();
    });

    it('should render character count', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      expect(screen.getByText('0/2000')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should update textarea value on input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');

      expect(textarea).toHaveValue('Test message');
    });

    it('should update character count on input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(screen.getByText('5/2000')).toBeInTheDocument();
    });

    it('should call onSend when clicking send button with message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');

      const sendButton = getSendButton();
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Test message', undefined, undefined);
    });

    it('should clear textarea after sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');

      const sendButton = getSendButton();
      await user.click(sendButton);

      expect(textarea).toHaveValue('');
    });

    it('should not call onSend with empty message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const sendButton = getSendButton();
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not call onSend with whitespace-only message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '   ');

      const sendButton = getSendButton();
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should send on Enter key press', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Test message', undefined, undefined);
    });

    it('should not send on Shift+Enter (new line)', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable textarea when isGenerating is true', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={true} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable action buttons when isGenerating is true', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={true} />);

      const fileButton = screen.getByTitle('Upload file (PDF, TXT, DOC)');
      const googleDocsButton = screen.getByTitle('Import from Google Docs');

      expect(fileButton).toBeDisabled();
      expect(googleDocsButton).toBeDisabled();
    });

    it('should not call onSend when isGenerating is true', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={true} />);

      const textarea = screen.getByRole('textbox');
      // Can't type when disabled, so set value directly
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const sendButton = getSendButton();
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should show loading spinner when isGenerating is true', () => {
      render(<ChatInput onSend={mockOnSend} isGenerating={true} />);

      // The send button should contain a spinning circle (SVG with circle element)
      const sendButton = getSendButton();
      const circle = sendButton.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('Message Trimming', () => {
    it('should trim whitespace from message before sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isGenerating={false} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '  Test message  ');

      const sendButton = getSendButton();
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Test message', undefined, undefined);
    });
  });
});
