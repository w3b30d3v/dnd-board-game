import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveCampaignPreview } from '@/components/campaign-studio/LiveCampaignPreview';

// Mock framer-motion completely
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
    svg: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <svg {...props}>{children}</svg>
    ),
    path: (props: Record<string, unknown>) => <path {...props} />,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span>▼</span>,
  ChevronRight: () => <span>►</span>,
  Edit: () => <span>✏️</span>,
  RefreshCw: () => <span>🔄</span>,
  Trash2: () => <span>🗑️</span>,
  MapPin: () => <span>📍</span>,
  Users: () => <span>👥</span>,
  Sword: () => <span>⚔️</span>,
  Scroll: () => <span>📜</span>,
  Globe: () => <span>🌍</span>,
  MessageSquare: () => <span>💬</span>,
}));

describe('LiveCampaignPreview', () => {
  const mockOnItemClick = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnRegenerate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render campaign name', () => {
      render(
        <LiveCampaignPreview
          campaignName="Test Campaign"
          content={[]}
          onItemClick={mockOnItemClick}
          onEdit={mockOnEdit}
          onRegenerate={mockOnRegenerate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    it('should render default campaign name when empty', () => {
      render(
        <LiveCampaignPreview
          campaignName=""
          content={[]}
          onItemClick={mockOnItemClick}
          onEdit={mockOnEdit}
          onRegenerate={mockOnRegenerate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('New Campaign')).toBeInTheDocument();
    });

    it('should show item count of 0 when empty', () => {
      render(
        <LiveCampaignPreview
          campaignName="Test Campaign"
          content={[]}
          onItemClick={mockOnItemClick}
          onEdit={mockOnEdit}
          onRegenerate={mockOnRegenerate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('0 items created')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    it('should accept all required props', () => {
      expect(() =>
        render(
          <LiveCampaignPreview
            campaignName="Test"
            content={[]}
            onItemClick={mockOnItemClick}
            onEdit={mockOnEdit}
            onRegenerate={mockOnRegenerate}
            onDelete={mockOnDelete}
          />
        )
      ).not.toThrow();
    });

    it('should work with optional props omitted', () => {
      expect(() =>
        render(
          <LiveCampaignPreview
            campaignName="Test"
            content={[]}
          />
        )
      ).not.toThrow();
    });
  });
});
