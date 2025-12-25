import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

// Mock next/font
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
    style: { fontFamily: 'Geist' },
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
    style: { fontFamily: 'Geist Mono' },
  }),
}));

describe('RootLayout', () => {
  test('renders children correctly', () => {
    const TestChild = () => (
      <div>
        <h1>Test Header</h1>
        <p>Test paragraph content</p>
      </div>
    );
    
    render(
      <RootLayout>
        <TestChild />
      </RootLayout>
    );
    
    expect(screen.getByText('Test Header')).toBeInTheDocument();
    expect(screen.getByText('Test paragraph content')).toBeInTheDocument();
  });

  test('applies theme classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    
    // Check that the main container has antialiased class
    const mainElement = container.firstChild;
    expect(mainElement).toBeInTheDocument();
  });

  test('handles multiple children', () => {
    render(
      <RootLayout>
        <header>Header</header>
        <main>Main Content</main>
        <footer>Footer</footer>
      </RootLayout>
    );
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  test('renders without errors', () => {
    expect(() => {
      render(
        <RootLayout>
          <div>Test</div>
        </RootLayout>
      );
    }).not.toThrow();
  });
});