/**
 * Light Source Editor Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LightSourceEditor } from '@/components/editors/LightSourceEditor';
import type { LightSource } from '@dnd/shared';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      ...props
    }: React.PropsWithChildren<{ onClick?: () => void } & Record<string, unknown>>) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    div: ({
      children,
      onClick,
      ...props
    }: React.PropsWithChildren<{ onClick?: () => void } & Record<string, unknown>>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('LightSourceEditor', () => {
  const mockOnSelectLight = vi.fn();
  const mockOnUpdateLight = vi.fn();
  const mockOnDeleteLight = vi.fn();

  const defaultLights: LightSource[] = [
    { id: 'light1', x: 5, y: 10, radius: 5, color: '#ff9933', intensity: 0.8 },
    { id: 'light2', x: 15, y: 20, radius: 3, color: '#66ccff', intensity: 1.0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show help text when no lights are placed', () => {
      render(
        <LightSourceEditor
          lights={[]}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(
        screen.getByText(/No lights placed/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Select the Light tool/i)
      ).toBeInTheDocument();
    });
  });

  describe('Light List', () => {
    it('should render all lights in the list', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByText('(5, 10)')).toBeInTheDocument();
      expect(screen.getByText('(15, 20)')).toBeInTheDocument();
    });

    it('should show radius for each light', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByText('r:5')).toBeInTheDocument();
      expect(screen.getByText('r:3')).toBeInTheDocument();
    });

    it('should call onSelectLight when clicking a light', async () => {
      const user = userEvent.setup();
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      // Find the first light item in the list
      const lightItems = screen.getAllByText('(5, 10)');
      const listItem = lightItems[0].closest('div[class*="cursor-pointer"]');
      await user.click(listItem!);

      expect(mockOnSelectLight).toHaveBeenCalledWith('light1');
    });

    it('should deselect when clicking already selected light', async () => {
      const user = userEvent.setup();
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      // Find the light list item container (use getAllByText and pick the first one in the list)
      const lightItems = screen.getAllByText('(5, 10)');
      const listItem = lightItems[0].closest('div[class*="cursor-pointer"]');
      await user.click(listItem!);

      expect(mockOnSelectLight).toHaveBeenCalledWith(null);
    });
  });

  describe('Delete Button', () => {
    it('should call onDeleteLight when clicking delete', async () => {
      const user = userEvent.setup();
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      // Find delete buttons (they contain ✕)
      const deleteButtons = screen.getAllByText('✕');
      await user.click(deleteButtons[0]);

      expect(mockOnDeleteLight).toHaveBeenCalledWith('light1');
    });

    it('should not select light when clicking delete', async () => {
      const user = userEvent.setup();
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      const deleteButtons = screen.getAllByText('✕');
      await user.click(deleteButtons[0]);

      // onSelectLight should not be called with the light ID
      expect(mockOnSelectLight).not.toHaveBeenCalledWith('light1');
    });
  });

  describe('Light Properties Panel', () => {
    it('should show properties when a light is selected', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByText('Light Properties')).toBeInTheDocument();
      expect(screen.getByText('Position:')).toBeInTheDocument();
      // Use getAllByText since position appears in both the list and properties
      const positions = screen.getAllByText('(5, 10)');
      expect(positions.length).toBeGreaterThan(0);
    });

    it('should not show properties when no light is selected', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId={null}
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.queryByText('Light Properties')).not.toBeInTheDocument();
    });

    it('should show radius slider with current value', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByText(/Radius: 5 tiles/)).toBeInTheDocument();
    });

    it('should show intensity slider with current value', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByText(/Intensity: 80%/)).toBeInTheDocument();
    });

    it('should update radius when slider changes', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      // Find the radius slider (first range input)
      const sliders = screen.getAllByRole('slider');
      const radiusSlider = sliders[0];

      fireEvent.change(radiusSlider, { target: { value: '10' } });

      expect(mockOnUpdateLight).toHaveBeenCalledWith('light1', { radius: 10 });
    });

    it('should update intensity when slider changes', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      // Find the intensity slider (second range input)
      const sliders = screen.getAllByRole('slider');
      const intensitySlider = sliders[1];

      fireEvent.change(intensitySlider, { target: { value: '0.5' } });

      expect(mockOnUpdateLight).toHaveBeenCalledWith('light1', { intensity: 0.5 });
    });
  });

  describe('Color Selection', () => {
    it('should show color presets', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('should show color picker input', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      // Color input type
      const colorInput = document.querySelector('input[type="color"]');
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveValue('#ff9933');
    });

    it('should update color from color picker', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      const colorInput = document.querySelector('input[type="color"]')!;
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });

      expect(mockOnUpdateLight).toHaveBeenCalledWith('light1', { color: '#00ff00' });
    });
  });

  describe('Flicker Toggle', () => {
    it('should show flicker checkbox', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByLabelText(/Flicker effect/i)).toBeInTheDocument();
    });

    it('should update flicker when checkbox changes', async () => {
      const user = userEvent.setup();
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      const checkbox = screen.getByLabelText(/Flicker effect/i);
      await user.click(checkbox);

      expect(mockOnUpdateLight).toHaveBeenCalledWith('light1', { flicker: true });
    });
  });

  describe('Delete from Properties Panel', () => {
    it('should show delete button in properties panel', () => {
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      expect(screen.getByRole('button', { name: /Delete Light/i })).toBeInTheDocument();
    });

    it('should delete and deselect when clicking delete in properties', async () => {
      const user = userEvent.setup();
      render(
        <LightSourceEditor
          lights={defaultLights}
          selectedLightId="light1"
          onSelectLight={mockOnSelectLight}
          onUpdateLight={mockOnUpdateLight}
          onDeleteLight={mockOnDeleteLight}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete Light/i });
      await user.click(deleteButton);

      expect(mockOnDeleteLight).toHaveBeenCalledWith('light1');
      expect(mockOnSelectLight).toHaveBeenCalledWith(null);
    });
  });
});
