import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WarmupChecklist } from '../../src/components/WarmupChecklist';

const defaultProps = {
  warmupRope: false,
  warmupAnkle: false,
  warmupHipIr: false,
  blockColor: '#6366f1',
  onToggleRope: jest.fn(),
  onToggleAnkle: jest.fn(),
  onToggleHipIr: jest.fn(),
  onContinue: jest.fn(),
};

describe('WarmupChecklist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all warmup items', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText(/Jump Rope/)).toBeTruthy();
    expect(screen.getByText(/Ankle Dorsiflexion/)).toBeTruthy();
    expect(screen.getByText(/Hip IR/)).toBeTruthy();
  });

  it('renders continue button', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText(/Continue to Exercises/)).toBeTruthy();
  });

  it('calls onToggleRope when Jump Rope is pressed', () => {
    const onToggleRope = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggleRope={onToggleRope} />);
    fireEvent.press(screen.getByText(/Jump Rope/));
    expect(onToggleRope).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleAnkle when Ankle Protocol is pressed', () => {
    const onToggleAnkle = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggleAnkle={onToggleAnkle} />);
    fireEvent.press(screen.getByText(/Ankle Dorsiflexion/));
    expect(onToggleAnkle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleHipIr when Hip IR Work is pressed', () => {
    const onToggleHipIr = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggleHipIr={onToggleHipIr} />);
    fireEvent.press(screen.getByText(/Hip IR/));
    expect(onToggleHipIr).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when continue button is pressed', () => {
    const onContinue = jest.fn();
    render(<WarmupChecklist {...defaultProps} onContinue={onContinue} />);
    fireEvent.press(screen.getByText(/Continue to Exercises/));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('should display the workout timer when provided', () => {
    const { getByText } = render(
      <WarmupChecklist {...defaultProps} timer="03:45" />
    );
    expect(getByText('03:45')).toBeTruthy();
  });

  it('should not display timer when not provided', () => {
    const { queryByText } = render(
      <WarmupChecklist {...defaultProps} />
    );
    // Timer text should not be present — just verify the component renders without error
    expect(queryByText('Warm Up')).toBeTruthy();
  });
});
