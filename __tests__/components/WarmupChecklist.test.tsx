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

  it('renders title and all warmup items', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText('Warmup')).toBeTruthy();
    expect(screen.getByText('Jump Rope (5-7 min)')).toBeTruthy();
    expect(screen.getByText('Ankle Protocol')).toBeTruthy();
    expect(screen.getByText('Hip IR Work')).toBeTruthy();
  });

  it('renders Start Logging button', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText('Start Logging')).toBeTruthy();
  });

  it('calls onToggleRope when Jump Rope is pressed', () => {
    const onToggleRope = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggleRope={onToggleRope} />);
    fireEvent.press(screen.getByText('Jump Rope (5-7 min)'));
    expect(onToggleRope).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleAnkle when Ankle Protocol is pressed', () => {
    const onToggleAnkle = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggleAnkle={onToggleAnkle} />);
    fireEvent.press(screen.getByText('Ankle Protocol'));
    expect(onToggleAnkle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleHipIr when Hip IR Work is pressed', () => {
    const onToggleHipIr = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggleHipIr={onToggleHipIr} />);
    fireEvent.press(screen.getByText('Hip IR Work'));
    expect(onToggleHipIr).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when Start Logging is pressed', () => {
    const onContinue = jest.fn();
    render(<WarmupChecklist {...defaultProps} onContinue={onContinue} />);
    fireEvent.press(screen.getByText('Start Logging'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
