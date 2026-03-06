import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AdjustModal } from '../../src/components/AdjustModal';

const defaultProps = {
  visible: true,
  weight: 135,
  reps: 8,
  blockColor: '#6366f1',
  onWeightChange: jest.fn(),
  onRepsChange: jest.fn(),
  onSave: jest.fn(),
  onClose: jest.fn(),
};

describe('AdjustModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders title and labels', () => {
    render(<AdjustModal {...defaultProps} />);
    expect(screen.getByText('Adjust Set')).toBeTruthy();
    expect(screen.getByText('Weight (lbs)')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
  });

  it('displays current weight and reps', () => {
    render(<AdjustModal {...defaultProps} />);
    expect(screen.getByText('135')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });

  it('calls onWeightChange with +5 when pressing plus', () => {
    const onWeightChange = jest.fn();
    render(<AdjustModal {...defaultProps} onWeightChange={onWeightChange} />);
    fireEvent.press(screen.getByText('+5'));
    expect(onWeightChange).toHaveBeenCalledWith(140);
  });

  it('calls onWeightChange with -5 when pressing minus', () => {
    const onWeightChange = jest.fn();
    render(<AdjustModal {...defaultProps} onWeightChange={onWeightChange} />);
    fireEvent.press(screen.getByText('-5'));
    expect(onWeightChange).toHaveBeenCalledWith(130);
  });

  it('does not go below 0 for weight', () => {
    const onWeightChange = jest.fn();
    render(<AdjustModal {...defaultProps} weight={3} onWeightChange={onWeightChange} />);
    fireEvent.press(screen.getByText('-5'));
    expect(onWeightChange).toHaveBeenCalledWith(0);
  });

  it('calls onRepsChange with +1 when pressing plus', () => {
    const onRepsChange = jest.fn();
    render(<AdjustModal {...defaultProps} onRepsChange={onRepsChange} />);
    fireEvent.press(screen.getByText('+1'));
    expect(onRepsChange).toHaveBeenCalledWith(9);
  });

  it('calls onRepsChange with -1 when pressing minus', () => {
    const onRepsChange = jest.fn();
    render(<AdjustModal {...defaultProps} onRepsChange={onRepsChange} />);
    fireEvent.press(screen.getByText('-1'));
    expect(onRepsChange).toHaveBeenCalledWith(7);
  });

  it('calls onSave when Save is pressed', () => {
    const onSave = jest.fn();
    render(<AdjustModal {...defaultProps} onSave={onSave} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
