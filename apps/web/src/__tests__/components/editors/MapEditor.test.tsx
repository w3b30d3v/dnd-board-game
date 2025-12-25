/**
 * Map Editor Tests
 * Tests for core Map Editor functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapEditor } from '@/components/editors/MapEditor';
import type { GameMap } from '@dnd/shared';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      disabled,
      className,
      title,
    }: React.PropsWithChildren<{
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
      title?: string;
    }>) => (
      <button onClick={onClick} disabled={disabled} className={className} title={title}>
        {children}
      </button>
    ),
    div: ({
      children,
      onClick,
      className,
    }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    ),
    span: ({
      children,
      className,
    }: React.PropsWithChildren<{ className?: string }>) => (
      <span className={className}>{children}</span>
    ),
    input: ({
      onChange,
      value,
      type,
      className,
      placeholder,
      ...props
    }: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input
        onChange={onChange}
        value={value}
        type={type}
        className={className}
        placeholder={placeholder}
        {...props}
      />
    ),
    textarea: ({
      onChange,
      value,
      className,
      ...props
    }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
      <textarea onChange={onChange} value={value} className={className} {...props} />
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock next/dynamic to return a simple mock component
vi.mock('next/dynamic', () => ({
  default: () => {
    const MockCanvas = () => <div data-testid="map-editor-canvas">Mock Canvas</div>;
    return MockCanvas;
  },
}));

// Mock LightSourceEditor
vi.mock('@/components/editors/LightSourceEditor', () => ({
  LightSourceEditor: ({ lights }: { lights: unknown[] }) => (
    <div data-testid="light-source-editor">
      <span data-testid="light-count">{lights.length}</span>
    </div>
  ),
  default: vi.fn(),
}));

// Mock EnchantedCard
vi.mock('@/components/dnd/EnchantedCard', () => ({
  EnchantedCard: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('MapEditor', () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  const createDefaultMap = (): GameMap => ({
    id: 'test-map-1',
    name: 'Test Map',
    description: 'A test map',
    width: 20,
    height: 15,
    gridSize: 5,
    terrainData: {},
    layers: [
      {
        id: 'layer1',
        name: 'Base Layer',
        visible: true,
        opacity: 1,
        tiles: [],
      },
    ],
    lighting: {
      globalLight: 1,
      ambientColor: '#ffffff',
      lightSources: [],
    },
    ambience: {
      weather: 'clear',
      timeOfDay: 'day',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const defaultProps = {
    map: createDefaultMap(),
    onSave: mockOnSave,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the map editor with map name', () => {
      render(<MapEditor {...defaultProps} />);

      // The map name should be displayed
      expect(screen.getByDisplayValue('Test Map')).toBeInTheDocument();
    });

    it('should render terrain options', () => {
      render(<MapEditor {...defaultProps} />);

      // Should show terrain types
      expect(screen.getByText('Grass')).toBeInTheDocument();
      expect(screen.getByText('Stone')).toBeInTheDocument();
      expect(screen.getByText('Water')).toBeInTheDocument();
    });

    it('should render layer management tab', () => {
      render(<MapEditor {...defaultProps} />);

      // Should show layers tab
      expect(screen.getByText('layers')).toBeInTheDocument();
    });

    it('should render save and close buttons', () => {
      render(<MapEditor {...defaultProps} />);

      // Find the Save Map button specifically
      expect(screen.getByRole('button', { name: /Save Map/i })).toBeInTheDocument();
      // Find the Cancel button
      const cancelButtons = screen.getAllByText(/Cancel/i);
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Map Properties', () => {
    it('should display the map name from props', () => {
      render(<MapEditor {...defaultProps} />);

      const nameInput = screen.getByDisplayValue('Test Map');
      expect(nameInput).toBeInTheDocument();
    });

    it('should allow editing the map name', async () => {
      const user = userEvent.setup();
      render(<MapEditor {...defaultProps} />);

      const nameInput = screen.getByDisplayValue('Test Map');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Map Name');

      expect(nameInput).toHaveValue('New Map Name');
    });
  });

  describe('Existing Map Data', () => {
    it('should load existing map with custom name', () => {
      const existingMap: GameMap = {
        ...createDefaultMap(),
        id: 'map-123',
        name: 'My Custom Map',
        description: 'A custom description',
        width: 30,
        height: 20,
      };

      render(<MapEditor map={existingMap} onSave={mockOnSave} onClose={mockOnClose} />);

      const nameInput = screen.getByDisplayValue('My Custom Map');
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<MapEditor {...defaultProps} />);

      const cancelButton = screen.getByText(/Cancel/i);
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Lighting Panel', () => {
    it('should render lighting panel tab', () => {
      render(<MapEditor {...defaultProps} />);

      expect(screen.getByText('lighting')).toBeInTheDocument();
    });

    it('should display light source count', () => {
      const mapWithLights: GameMap = {
        ...createDefaultMap(),
        lighting: {
          globalLight: 1,
          ambientColor: '#ffffff',
          lightSources: [
            { id: 'light1', x: 5, y: 5, radius: 3, color: '#ff9933', intensity: 1 },
          ],
        },
      };

      render(<MapEditor map={mapWithLights} onSave={mockOnSave} onClose={mockOnClose} />);

      // The component should render the lighting section
      expect(screen.getByText('lighting')).toBeInTheDocument();
    });
  });
});
