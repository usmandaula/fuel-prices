// RadiusSelector.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RadiusSelector from './RadiusSelector';

// Mock the icon
jest.mock('react-icons/fa', () => ({
  FaRuler: () => <div data-testid="ruler-icon">📏</div>,
}));

describe('RadiusSelector', () => {
  const mockOnRadiusChange = jest.fn();

  const defaultProps = {
    radius: 5,
    onRadiusChange: mockOnRadiusChange,
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders radius selector with current radius', () => {
    render(<RadiusSelector {...defaultProps} />);
    
    expect(screen.getByTestId('ruler-icon')).toBeInTheDocument();
    expect(screen.getByText('Radius')).toBeInTheDocument();
    expect(screen.getByText('5km')).toBeInTheDocument();
  });

test('renders all default radius buttons with km unit', () => {
  render(<RadiusSelector {...defaultProps} />);
  
  const defaultOptions = [1, 3, 5, 10, 15, 25];
  
  defaultOptions.forEach(option => {
    // Find the button by its text content
    const buttons = screen.getAllByRole('button');
    const button = buttons.find(btn => 
      btn.textContent?.includes(option.toString()) && btn.textContent?.includes('km')
    );
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(new RegExp(`${option}.*km`));
  });
});

  test('highlights active radius button', () => {
    render(<RadiusSelector {...defaultProps} radius={10} />);
    
    // The 10 button should have active class
    const tenKmButton = screen.getByText('10').closest('button');
    expect(tenKmButton).toHaveClass('active');
    
    // Other buttons should not have active class
    const fiveKmButton = screen.getByText('5').closest('button');
    expect(fiveKmButton).not.toHaveClass('active');
  });

  test('calls onRadiusChange when button is clicked', () => {
    render(<RadiusSelector {...defaultProps} />);
    
    const tenKmButton = screen.getByText('10').closest('button');
    fireEvent.click(tenKmButton!);
    
    expect(mockOnRadiusChange).toHaveBeenCalledWith(10);
    expect(mockOnRadiusChange).toHaveBeenCalledTimes(1);
  });

  test('uses custom options when provided', () => {
    const customOptions = [2, 4, 6, 8];
    render(
      <RadiusSelector 
        {...defaultProps} 
        options={customOptions} 
        radius={4}
      />
    );
    
    customOptions.forEach(option => {
      expect(screen.getByText(option.toString())).toBeInTheDocument();
    });
    
    // Default options should not be rendered
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('25')).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <RadiusSelector {...defaultProps} className="custom-class" />
    );
    
    const selector = container.querySelector('.radius-selector');
    expect(selector).toHaveClass('custom-class');
  });

  test('renders header with correct elements', () => {
    const { container } = render(<RadiusSelector {...defaultProps} />);
    
    const header = container.querySelector('.radius-header');
    expect(header).toBeInTheDocument();
    
    const icon = header?.querySelector('[data-testid="ruler-icon"]');
    const label = header?.querySelector('.radius-label');
    const currentRadius = header?.querySelector('.current-radius');
    
    expect(icon).toBeInTheDocument();
    expect(label).toHaveTextContent('Radius');
    expect(currentRadius).toHaveTextContent('5km');
  });

  test('buttons have title attribute', () => {
    render(<RadiusSelector {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    
    // Check that each button has a title (skip the first if there's another button)
    buttons.forEach((button, index) => {
      // The radius buttons start from index 1 if there's another button
      if (button.textContent?.match(/\d/)) {
        expect(button).toHaveAttribute('title');
        expect(button.getAttribute('title')).toMatch(/Search within \d+ kilometers/);
      }
    });
  });

  test('handles undefined onRadiusChange gracefully', () => {
    const propsWithoutCallback = { ...defaultProps, onRadiusChange: undefined };
    
    expect(() => {
      render(<RadiusSelector {...propsWithoutCallback} />);
    }).not.toThrow();
    
    // Should still render
    expect(screen.getByText('Radius')).toBeInTheDocument();
  });
});