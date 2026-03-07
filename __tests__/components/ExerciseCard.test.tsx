import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ExerciseCard } from '../../src/components/ExerciseCard';
import type { SetState } from '../../src/components/ExerciseCard';

const makeSets = (count: number, status: SetState['status'] = 'pending'): SetState[] =>
  Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    targetWeight: 135,
    targetReps: 8,
    actualWeight: 135,
    actualReps: 8,
    status,
  }));

const defaultProps = {
  exerciseName: 'Bench Press',
  category: 'main',
  target: { sets: 3, reps: 8, percent: 75 } as any,
  sets: makeSets(3),
  expanded: false,
  blockColor: '#6366f1',
  onToggleExpand: jest.fn(),
  onCompleteSet: jest.fn(),
  onLongPressSet: jest.fn(),
  onSetRPE: jest.fn(),
};

describe('ExerciseCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders exercise name when collapsed', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
  });

  it('renders set status when collapsed', () => {
    render(<ExerciseCard {...defaultProps} />);
    // Collapsed status shows "0/3"
    expect(screen.getByText('0/3')).toBeTruthy();
  });

  it('renders exercise name when expanded', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
  });

  it('shows set numbers when expanded', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    // Set numbers rendered as "1", "2", "3"
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows last session info when provided', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} lastWeight={130} lastReps={8} />);
    expect(screen.getByText(/Last:/)).toBeTruthy();
    expect(screen.getByText(/130/)).toBeTruthy();
  });

  it('calls onToggleExpand on press', () => {
    const onToggleExpand = jest.fn();
    render(<ExerciseCard {...defaultProps} onToggleExpand={onToggleExpand} />);
    fireEvent.press(screen.getByText('Bench Press'));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('shows RPE selector when all sets are done', () => {
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} />);
    expect(screen.getByText('How hard was this?')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('does not show RPE selector when sets are pending', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.queryByText('How hard was this?')).toBeNull();
  });

  it('calls onSetRPE when pressing an RPE button', () => {
    const onSetRPE = jest.fn();
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} onSetRPE={onSetRPE} />);
    // "8" appears in both actualReps and RPE buttons; pick the last occurrence (RPE)
    const eights = screen.getAllByText('8');
    fireEvent.press(eights[eights.length - 1]);
    expect(onSetRPE).toHaveBeenCalledWith(8);
  });

  it('calls onLongPressCard on long press of the card', () => {
    const onLongPressCard = jest.fn();
    render(<ExerciseCard {...defaultProps} onLongPressCard={onLongPressCard} />);
    fireEvent(screen.getByText('Bench Press'), 'longPress');
    expect(onLongPressCard).toHaveBeenCalledTimes(1);
  });

  it('shows "+ Add note" link when expanded and no note exists', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.getByText('+ Add note')).toBeTruthy();
  });

  it('calls onNoteChange when note text is entered', () => {
    const onNoteChange = jest.fn();
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        onNoteChange={onNoteChange}
      />
    );
    fireEvent.press(screen.getByText('+ Add note'));
    const input = screen.getByPlaceholderText('Add a note for this exercise...');
    fireEvent.changeText(input, 'Left shoulder tight');
    expect(onNoteChange).toHaveBeenCalledWith('Left shoulder tight');
  });

  it('shows existing note text when note prop is provided', () => {
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        note="Grip failed on last set"
      />
    );
    expect(screen.getByDisplayValue('Grip failed on last set')).toBeTruthy();
  });

  it('shows checkmark for completed sets', () => {
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} />);
    // Completed status shows "3/3 ✓" when collapsed, check marks in expanded
    expect(screen.getAllByText('\u2713').length).toBeGreaterThan(0);
  });
});
