// EmptyState.test.tsx - Fixed version
import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

// Mock the icon with className support
jest.mock('react-icons/fa', () => ({
  FaGasPump: ({ className }: { className?: string }) => (
    <div data-testid="gas-pump-icon" className={className}>
      ⛽
    </div>
  ),
}));

describe('EmptyState', () => {
  test('renders empty state with icon', () => {
    render(<EmptyState />);
    
    const icon = screen.getByTestId('gas-pump-icon');
    expect(icon).toBeInTheDocument();
    expect(screen.getByText('No stations found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search location')).toBeInTheDocument();
  });

  test('has correct heading', () => {
    render(<EmptyState />);
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('No stations found');
  });

  test('has informative text', () => {
    render(<EmptyState />);
    
    const text = screen.getByText('Try adjusting your filters or search location');
    expect(text).toBeInTheDocument();
    expect(text.tagName).toBe('P');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<EmptyState />);
    
    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
    
    // Check that the icon element exists and has the className
    const icon = screen.getByTestId('gas-pump-icon');
    expect(icon).toHaveClass('empty-icon');
  });

  test('has proper semantic structure', () => {
    const { container } = render(<EmptyState />);
    
    // Should have icon, h3, and p elements
    const icon = screen.getByTestId('gas-pump-icon');
    const heading = container.querySelector('h3');
    const paragraph = container.querySelector('p');
    
    expect(icon).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(paragraph).toBeInTheDocument();
  });

  test('icon has empty-icon class', () => {
    render(<EmptyState />);
    
    const icon = screen.getByTestId('gas-pump-icon');
    expect(icon).toHaveClass('empty-icon');
  });
});