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

  it('shows checkmark for completed sets', () => {
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} />);
    // Completed status shows "3/3 ✓" when collapsed, check marks in expanded
    expect(screen.getAllByText('\u2713').length).toBeGreaterThan(0);
  });

  // --- New tests for uncovered lines 117-139 ---

  it('calls onLongPressSet when pressing weight text of a completed set', () => {
    const onLongPressSet = jest.fn();
    const sets = makeSets(3, 'completed');
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onLongPressSet={onLongPressSet}
      />,
    );
    // Each completed set shows "135 lbs" — press the first one
    const weightTexts = screen.getAllByText('135 lbs');
    fireEvent.press(weightTexts[0]);
    expect(onLongPressSet).toHaveBeenCalledWith(0);
  });

  it('calls onLongPressSet when pressing reps text of a completed set', () => {
    const onLongPressSet = jest.fn();
    const sets = makeSets(3, 'completed');
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onLongPressSet={onLongPressSet}
      />,
    );
    // Each completed set shows "8" for reps — press the first one
    const repsTexts = screen.getAllByText('8');
    fireEvent.press(repsTexts[0]);
    expect(onLongPressSet).toHaveBeenCalledWith(0);
  });

  it('does not call onLongPressSet when pressing weight text of a pending set', () => {
    const onLongPressSet = jest.fn();
    const sets = makeSets(1, 'pending');
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onLongPressSet={onLongPressSet}
      />,
    );
    const weightTexts = screen.getAllByText('135 lbs');
    fireEvent.press(weightTexts[0]);
    expect(onLongPressSet).not.toHaveBeenCalled();
  });

  it('calls onCompleteSet when pressing the set action button', () => {
    const onCompleteSet = jest.fn();
    const sets = makeSets(2, 'pending');
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onCompleteSet={onCompleteSet}
      />,
    );
    // The set action buttons contain empty circles (View) for pending sets.
    // We need to find the TouchableOpacity buttons in the set action area.
    // The set row has: setNumber, weight text, reps text, and the action button.
    // Since pending sets show a circle View (no text), we target by the parent structure.
    // The "135 lbs" text and its siblings are in each set row.
    // Each set row's action button is a TouchableOpacity.
    // We can use getAllByText to find set numbers and navigate from there,
    // but it's easier to just check that the callback was wired correctly
    // by verifying the component renders and testing via the checkmark buttons.

    // First, let's complete a set by making it completed and pressing the checkmark
    const completedSets: SetState[] = [
      { setNumber: 1, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'completed' },
      { setNumber: 2, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'pending' },
    ];

    const { unmount } = render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={completedSets}
        onCompleteSet={onCompleteSet}
      />,
    );

    // The completed set shows a checkmark. Press it.
    const checkmarks = screen.getAllByText('\u2713');
    fireEvent.press(checkmarks[0]);
    expect(onCompleteSet).toHaveBeenCalledWith(0);
  });

  it('calls onLongPressSet when long-pressing the set action button', () => {
    const onLongPressSet = jest.fn();
    const sets: SetState[] = [
      { setNumber: 1, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'completed' },
    ];
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onLongPressSet={onLongPressSet}
      />,
    );

    // Long press the checkmark button
    const checkmarks = screen.getAllByText('\u2713');
    fireEvent(checkmarks[0], 'longPress');
    expect(onLongPressSet).toHaveBeenCalledWith(0);
  });

  it('treats completed_below status the same as completed for styling', () => {
    const sets: SetState[] = [
      {
        setNumber: 1,
        targetWeight: 135,
        targetReps: 8,
        actualWeight: 135,
        actualReps: 6,
        status: 'completed_below',
      },
    ];
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} />);

    // completed_below is treated as isCompleted: shows checkmark
    expect(screen.getAllByText('\u2713').length).toBeGreaterThan(0);

    // Weight text should be pressable (calls onLongPressSet for completed sets)
    const onLongPressSet = jest.fn();
    const { unmount } = render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onLongPressSet={onLongPressSet}
      />,
    );
    const weightTexts = screen.getAllByText('135 lbs');
    fireEvent.press(weightTexts[0]);
    expect(onLongPressSet).toHaveBeenCalledWith(0);
  });

  it('shows completed count correctly with mixed statuses', () => {
    const sets: SetState[] = [
      { setNumber: 1, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'completed' },
      { setNumber: 2, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 6, status: 'completed_below' },
      { setNumber: 3, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'pending' },
    ];
    render(<ExerciseCard {...defaultProps} sets={sets} />);
    // 2 out of 3 completed (completed + completed_below)
    expect(screen.getByText('2/3')).toBeTruthy();
  });

  it('calls onCompleteSet with correct index for second set', () => {
    const onCompleteSet = jest.fn();
    const sets: SetState[] = [
      { setNumber: 1, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'completed' },
      { setNumber: 2, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'completed' },
    ];
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onCompleteSet={onCompleteSet}
      />,
    );

    // Both sets are completed, so there are 2 checkmarks. Press the second one.
    const checkmarks = screen.getAllByText('\u2713');
    fireEvent.press(checkmarks[1]);
    expect(onCompleteSet).toHaveBeenCalledWith(1);
  });

  it('calls onLongPressSet with correct index when pressing weight of second completed set', () => {
    const onLongPressSet = jest.fn();
    const sets: SetState[] = [
      { setNumber: 1, targetWeight: 135, targetReps: 8, actualWeight: 135, actualReps: 8, status: 'completed' },
      { setNumber: 2, targetWeight: 135, targetReps: 8, actualWeight: 140, actualReps: 8, status: 'completed' },
    ];
    render(
      <ExerciseCard
        {...defaultProps}
        expanded={true}
        sets={sets}
        onLongPressSet={onLongPressSet}
      />,
    );

    // Press the weight text for set 2 (140 lbs)
    fireEvent.press(screen.getByText('140 lbs'));
    expect(onLongPressSet).toHaveBeenCalledWith(1);
  });
});
