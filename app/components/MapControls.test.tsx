import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapControls from './MapControls';
import { FaLayerGroup, FaEye, FaCompass, FaCar, FaLocationArrow } from 'react-icons/fa';

// Mock the react-icons
jest.mock('react-icons/fa', () => ({
  FaLayerGroup: () => <div data-testid="standard-icon">Standard</div>,
  FaEye: () => <div data-testid="satellite-icon">Satellite</div>,
  FaCompass: () => <div data-testid="terrain-icon">Terrain</div>,
  FaCar: () => <div data-testid="traffic-icon">Traffic</div>,
  FaLocationArrow: () => <div data-testid="recenter-icon">Recenter</div>,
}));

describe('MapControls', () => {
  const mockOnLayerChange = jest.fn();
  const mockOnToggleTraffic = jest.fn();
  const mockOnRecenter = jest.fn();

  const defaultProps = {
    onLayerChange: mockOnLayerChange,
    onToggleTraffic: mockOnToggleTraffic,
    onRecenter: mockOnRecenter,
    activeLayer: 'standard' as const,
    showTraffic: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all control buttons', () => {
    render(<MapControls {...defaultProps} />);
    
    expect(screen.getByTitle('Standard Map')).toBeInTheDocument();
    expect(screen.getByTitle('Satellite View')).toBeInTheDocument();
    expect(screen.getByTitle('Terrain View')).toBeInTheDocument();
    expect(screen.getByTitle('Show Traffic')).toBeInTheDocument();
    expect(screen.getByTitle('Recenter Map')).toBeInTheDocument();
  });

  test('applies active class to active layer button', () => {
    const { rerender } = render(<MapControls {...defaultProps} activeLayer="standard" />);
    const standardBtn = screen.getByTitle('Standard Map');
    expect(standardBtn).toHaveClass('active');

    rerender(<MapControls {...defaultProps} activeLayer="satellite" />);
    const satelliteBtn = screen.getByTitle('Satellite View');
    expect(satelliteBtn).toHaveClass('active');
    expect(standardBtn).not.toHaveClass('active');
  });

  test('calls onLayerChange with correct layer when buttons are clicked', () => {
    render(<MapControls {...defaultProps} />);
    
    fireEvent.click(screen.getByTitle('Standard Map'));
    expect(mockOnLayerChange).toHaveBeenCalledWith('standard');
    
    fireEvent.click(screen.getByTitle('Satellite View'));
    expect(mockOnLayerChange).toHaveBeenCalledWith('satellite');
    
    fireEvent.click(screen.getByTitle('Terrain View'));
    expect(mockOnLayerChange).toHaveBeenCalledWith('terrain');
  });

  test('applies active class to traffic button when showTraffic is true', () => {
    render(<MapControls {...defaultProps} showTraffic={true} />);
    const trafficBtn = screen.getByTitle('Show Traffic');
    expect(trafficBtn).toHaveClass('active');
  });

  test('calls onToggleTraffic when traffic button is clicked', () => {
    render(<MapControls {...defaultProps} />);
    
    fireEvent.click(screen.getByTitle('Show Traffic'));
    expect(mockOnToggleTraffic).toHaveBeenCalledTimes(1);
  });

  test('calls onRecenter when recenter button is clicked', () => {
    render(<MapControls {...defaultProps} />);
    
    fireEvent.click(screen.getByTitle('Recenter Map'));
    expect(mockOnRecenter).toHaveBeenCalledTimes(1);
  });

  test('renders in correct structure with control groups', () => {
    const { container } = render(<MapControls {...defaultProps} />);
    
    const mapControls = container.querySelector('.map-controls');
    expect(mapControls).toBeInTheDocument();
    
    const controlGroups = container.querySelectorAll('.controls-group');
    expect(controlGroups).toHaveLength(2);
    
    // First group should have 3 buttons (layers)
    const firstGroupButtons = controlGroups[0].querySelectorAll('.control-btn');
    expect(firstGroupButtons).toHaveLength(3);
    
    // Second group should have 2 buttons (traffic and recenter)
    const secondGroupButtons = controlGroups[1].querySelectorAll('.control-btn');
    expect(secondGroupButtons).toHaveLength(2);
  });
});