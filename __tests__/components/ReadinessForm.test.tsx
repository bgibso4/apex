import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ReadinessForm } from '../../src/components/ReadinessForm';

const defaultProps = {
  sleep: 3,
  soreness: 3,
  energy: 3,
  blockColor: '#6366f1',
  onSleepChange: jest.fn(),
  onSorenessChange: jest.fn(),
  onEnergyChange: jest.fn(),
  onContinue: jest.fn(),
};

describe('ReadinessForm', () => {
  it('renders readiness check title', () => {
    render(<ReadinessForm {...defaultProps} />);
    expect(screen.getByText('Readiness Check')).toBeTruthy();
  });

  it('renders all three readiness labels', () => {
    render(<ReadinessForm {...defaultProps} />);
    expect(screen.getByText('Sleep Quality')).toBeTruthy();
    expect(screen.getByText('Soreness')).toBeTruthy();
    expect(screen.getByText('Energy Level')).toBeTruthy();
  });

  it('renders 1-5 buttons for each category', () => {
    render(<ReadinessForm {...defaultProps} />);
    // Each category has buttons 1-5, so 15 buttons total
    // Plus the "Continue" button = 16
    const allButtons = screen.getAllByText(/^[1-5]$/);
    expect(allButtons).toHaveLength(15);
  });

  it('calls onContinue when Continue is pressed', () => {
    const onContinue = jest.fn();
    render(<ReadinessForm {...defaultProps} onContinue={onContinue} />);
    fireEvent.press(screen.getByText('Continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onSleepChange when a sleep button is pressed', () => {
    const onSleepChange = jest.fn();
    render(<ReadinessForm {...defaultProps} onSleepChange={onSleepChange} />);
    // Press the first "5" button (Sleep Quality row)
    const fiveButtons = screen.getAllByText('5');
    fireEvent.press(fiveButtons[0]);
    expect(onSleepChange).toHaveBeenCalledWith(5);
  });
});
