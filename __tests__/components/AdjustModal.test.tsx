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

  it('displays current weight and reps in TextInputs', () => {
    render(<AdjustModal {...defaultProps} />);
    const weightInput = screen.getByTestId('weight-input');
    const repsInput = screen.getByTestId('reps-input');
    expect(weightInput.props.value).toBe('135');
    expect(repsInput.props.value).toBe('8');
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

  // Task 3: Custom weight/reps input tests
  it('renders a weight TextInput that accepts custom values', () => {
    const onWeightChange = jest.fn();
    render(<AdjustModal {...defaultProps} onWeightChange={onWeightChange} />);
    const weightInput = screen.getByTestId('weight-input');
    fireEvent.changeText(weightInput, '185');
    expect(onWeightChange).toHaveBeenCalledWith(185);
  });

  it('renders a reps TextInput that accepts custom values', () => {
    const onRepsChange = jest.fn();
    render(<AdjustModal {...defaultProps} onRepsChange={onRepsChange} />);
    const repsInput = screen.getByTestId('reps-input');
    fireEvent.changeText(repsInput, '12');
    expect(onRepsChange).toHaveBeenCalledWith(12);
  });

  it('clamps negative typed weight values to 0', () => {
    const onWeightChange = jest.fn();
    render(<AdjustModal {...defaultProps} onWeightChange={onWeightChange} />);
    const weightInput = screen.getByTestId('weight-input');
    fireEvent.changeText(weightInput, '-10');
    expect(onWeightChange).toHaveBeenCalledWith(0);
  });

  it('clamps negative typed reps values to 0', () => {
    const onRepsChange = jest.fn();
    render(<AdjustModal {...defaultProps} onRepsChange={onRepsChange} />);
    const repsInput = screen.getByTestId('reps-input');
    fireEvent.changeText(repsInput, '-5');
    expect(onRepsChange).toHaveBeenCalledWith(0);
  });

  it('ignores non-numeric weight input', () => {
    const onWeightChange = jest.fn();
    render(<AdjustModal {...defaultProps} onWeightChange={onWeightChange} />);
    const weightInput = screen.getByTestId('weight-input');
    fireEvent.changeText(weightInput, 'abc');
    expect(onWeightChange).not.toHaveBeenCalled();
  });

  it('ignores non-numeric reps input', () => {
    const onRepsChange = jest.fn();
    render(<AdjustModal {...defaultProps} onRepsChange={onRepsChange} />);
    const repsInput = screen.getByTestId('reps-input');
    fireEvent.changeText(repsInput, 'abc');
    expect(onRepsChange).not.toHaveBeenCalled();
  });

  // Task 4: Apply to all sets tests
  it('shows "Apply to all sets" button when onApplyToAll provided', () => {
    const onApplyToAll = jest.fn();
    render(<AdjustModal {...defaultProps} onApplyToAll={onApplyToAll} />);
    expect(screen.getByText('Apply to all sets')).toBeTruthy();
  });

  it('hides "Apply to all sets" button when onApplyToAll not provided', () => {
    render(<AdjustModal {...defaultProps} />);
    expect(screen.queryByText('Apply to all sets')).toBeNull();
  });

  it('calls onApplyToAll on press', () => {
    const onApplyToAll = jest.fn();
    render(<AdjustModal {...defaultProps} onApplyToAll={onApplyToAll} />);
    fireEvent.press(screen.getByText('Apply to all sets'));
    expect(onApplyToAll).toHaveBeenCalledTimes(1);
  });
});
