// PriceDisplay.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import PriceDisplay from './PriceDisplay';

describe('PriceDisplay', () => {
  const defaultProps = {
    fuelType: 'Diesel',
    price: 1.549,
    isBestPrice: false,
    isOverallBest: false,
  };

  test('renders fuel type and price', () => {
    render(<PriceDisplay {...defaultProps} />);
    
    expect(screen.getByText('Diesel')).toBeInTheDocument();
    expect(screen.getByText('€1.549')).toBeInTheDocument();
  });

  test('formats price correctly with 3 decimal places', () => {
    render(<PriceDisplay {...defaultProps} price={1.5} />);
    
    expect(screen.getByText('€1.500')).toBeInTheDocument();
  });

  test('shows best price badge when isBestPrice is true', () => {
    render(<PriceDisplay {...defaultProps} isBestPrice={true} />);
    
    expect(screen.getByText('Best Price')).toBeInTheDocument();
    expect(screen.getByText('Best Price')).toHaveClass('best-price-badge');
  });

  test('shows overall best badge when isOverallBest is true', () => {
    render(<PriceDisplay {...defaultProps} isOverallBest={true} />);
    
    expect(screen.getByText('Overall Best')).toBeInTheDocument();
    expect(screen.getByText('Overall Best')).toHaveClass('overall-best-badge');
  });

  test('shows both badges when both are true', () => {
    render(<PriceDisplay {...defaultProps} isBestPrice={true} isOverallBest={true} />);
    
    expect(screen.getByText('Best Price')).toBeInTheDocument();
    expect(screen.getByText('Overall Best')).toBeInTheDocument();
  });

  test('applies best-price CSS class when isBestPrice is true', () => {
    const { container } = render(<PriceDisplay {...defaultProps} isBestPrice={true} />);
    
    const priceDisplay = container.querySelector('.price-display');
    expect(priceDisplay).toHaveClass('best-price');
    expect(priceDisplay).not.toHaveClass('overall-best');
  });

  test('applies overall-best CSS class when isOverallBest is true', () => {
    const { container } = render(<PriceDisplay {...defaultProps} isOverallBest={true} />);
    
    const priceDisplay = container.querySelector('.price-display');
    expect(priceDisplay).toHaveClass('overall-best');
    expect(priceDisplay).not.toHaveClass('best-price');
  });

  test('applies both CSS classes when both are true', () => {
    const { container } = render(
      <PriceDisplay {...defaultProps} isBestPrice={true} isOverallBest={true} />
    );
    
    const priceDisplay = container.querySelector('.price-display');
    expect(priceDisplay).toHaveClass('best-price');
    expect(priceDisplay).toHaveClass('overall-best');
  });

  test('handles different fuel types', () => {
    const propsWithE5 = { ...defaultProps, fuelType: 'E5' };
    render(<PriceDisplay {...propsWithE5} />);
    
    expect(screen.getByText('E5')).toBeInTheDocument();
  });

  test('handles very low prices', () => {
    render(<PriceDisplay {...defaultProps} price={0.999} />);
    
    expect(screen.getByText('€0.999')).toBeInTheDocument();
  });

  test('handles high prices', () => {
    render(<PriceDisplay {...defaultProps} price={999.999} />);
    
    expect(screen.getByText('€999.999')).toBeInTheDocument();
  });
});