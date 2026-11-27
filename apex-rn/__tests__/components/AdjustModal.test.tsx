import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AdjustModal } from '../../src/components/AdjustModal';
import { FIELD_PROFILES } from '../../src/types/fields';

const defaultProps = {
  visible: true,
  values: { weight: 135, reps: 8 },
  blockColor: '#6366f1',
  onValueChange: jest.fn(),
  onSave: jest.fn(),
  onClose: jest.fn(),
};

describe('AdjustModal', () => {
  beforeEach(() => jest.clearAllMocks());

  // Default weight_reps rendering
  it('renders title and labels for default weight_reps fields', () => {
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

  // Weight +/- buttons
  it('calls onValueChange with weight +5 when pressing plus', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    fireEvent.press(screen.getByText('+5'));
    expect(onValueChange).toHaveBeenCalledWith('weight', 140);
  });

  it('calls onValueChange with weight -5 when pressing minus', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    fireEvent.press(screen.getByText('-5'));
    expect(onValueChange).toHaveBeenCalledWith('weight', 130);
  });

  it('does not go below 0 for weight', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} values={{ weight: 3, reps: 8 }} onValueChange={onValueChange} />);
    fireEvent.press(screen.getByText('-5'));
    expect(onValueChange).toHaveBeenCalledWith('weight', 0);
  });

  // Reps +/- buttons
  it('calls onValueChange with reps +1 when pressing plus', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    fireEvent.press(screen.getByText('+1'));
    expect(onValueChange).toHaveBeenCalledWith('reps', 9);
  });

  it('calls onValueChange with reps -1 when pressing minus', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    fireEvent.press(screen.getByText('-1'));
    expect(onValueChange).toHaveBeenCalledWith('reps', 7);
  });

  it('calls onSave when Save is pressed', () => {
    const onSave = jest.fn();
    render(<AdjustModal {...defaultProps} onSave={onSave} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // Custom text input
  it('renders a weight TextInput that accepts custom values', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    const weightInput = screen.getByTestId('weight-input');
    fireEvent.changeText(weightInput, '185');
    expect(onValueChange).toHaveBeenCalledWith('weight', 185);
  });

  it('renders a reps TextInput that accepts custom values', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    const repsInput = screen.getByTestId('reps-input');
    fireEvent.changeText(repsInput, '12');
    expect(onValueChange).toHaveBeenCalledWith('reps', 12);
  });

  it('clamps negative typed weight values to 0', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    const weightInput = screen.getByTestId('weight-input');
    fireEvent.changeText(weightInput, '-10');
    expect(onValueChange).toHaveBeenCalledWith('weight', 0);
  });

  it('clamps negative typed reps values to 0', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    const repsInput = screen.getByTestId('reps-input');
    fireEvent.changeText(repsInput, '-5');
    expect(onValueChange).toHaveBeenCalledWith('reps', 0);
  });

  it('ignores non-numeric weight input', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    const weightInput = screen.getByTestId('weight-input');
    fireEvent.changeText(weightInput, 'abc');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ignores non-numeric reps input', () => {
    const onValueChange = jest.fn();
    render(<AdjustModal {...defaultProps} onValueChange={onValueChange} />);
    const repsInput = screen.getByTestId('reps-input');
    fireEvent.changeText(repsInput, 'abc');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // Apply to all sets
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

  // Dynamic field profiles
  it('renders weight_distance fields', () => {
    render(
      <AdjustModal
        {...defaultProps}
        values={{ weight: 50, distance: 40 }}
        inputFields={FIELD_PROFILES.weight_distance}
      />
    );
    expect(screen.getByText('Weight (lbs)')).toBeTruthy();
    expect(screen.getByText('Distance (m)')).toBeTruthy();
    expect(screen.getByTestId('weight-input').props.value).toBe('50');
    expect(screen.getByTestId('distance-input').props.value).toBe('40');
    expect(screen.queryByTestId('reps-input')).toBeNull();
  });

  it('renders duration only field', () => {
    render(
      <AdjustModal
        {...defaultProps}
        values={{ duration: 45 }}
        inputFields={FIELD_PROFILES.duration}
      />
    );
    expect(screen.getByText('Duration (sec)')).toBeTruthy();
    expect(screen.getByTestId('duration-input').props.value).toBe('45');
    expect(screen.queryByTestId('weight-input')).toBeNull();
    expect(screen.queryByTestId('reps-input')).toBeNull();
  });

  it('renders distance_time fields', () => {
    render(
      <AdjustModal
        {...defaultProps}
        values={{ distance: 100, time: 30 }}
        inputFields={FIELD_PROFILES.distance_time}
      />
    );
    expect(screen.getByText('Distance (m)')).toBeTruthy();
    expect(screen.getByText('Time (m:ss)')).toBeTruthy();
    expect(screen.getByTestId('distance-input').props.value).toBe('100');
    expect(screen.getByTestId('time-input').props.value).toBe('30');
  });

  it('uses correct step sizes for distance field (+5/-5)', () => {
    const onValueChange = jest.fn();
    render(
      <AdjustModal
        {...defaultProps}
        values={{ weight: 50, distance: 40 }}
        inputFields={FIELD_PROFILES.weight_distance}
        onValueChange={onValueChange}
      />
    );
    // Distance has step of 5
    const plusButtons = screen.getAllByText('+5');
    // Both weight and distance have +5 step, press the second one (distance)
    fireEvent.press(plusButtons[1]);
    expect(onValueChange).toHaveBeenCalledWith('distance', 45);
  });

  it('uses correct step size for duration field (+5/-5)', () => {
    const onValueChange = jest.fn();
    render(
      <AdjustModal
        {...defaultProps}
        values={{ duration: 45 }}
        inputFields={FIELD_PROFILES.duration}
        onValueChange={onValueChange}
      />
    );
    fireEvent.press(screen.getByText('+5'));
    expect(onValueChange).toHaveBeenCalledWith('duration', 50);
  });

  it('renders reps_only fields', () => {
    render(
      <AdjustModal
        {...defaultProps}
        values={{ reps: 15 }}
        inputFields={FIELD_PROFILES.reps_only}
      />
    );
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByTestId('reps-input').props.value).toBe('15');
    expect(screen.queryByTestId('weight-input')).toBeNull();
  });
});
