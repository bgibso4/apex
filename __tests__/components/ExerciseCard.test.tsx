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

  it('renders exercise name and category', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('MAIN')).toBeTruthy();
  });

  it('renders target info', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByText(/3×8/)).toBeTruthy();
    expect(screen.getByText(/@ 75%/)).toBeTruthy();
  });

  it('does not show sets when collapsed', () => {
    render(<ExerciseCard {...defaultProps} expanded={false} />);
    expect(screen.queryByText('Set 1')).toBeNull();
  });

  it('shows sets when expanded', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.getByText('Set 1')).toBeTruthy();
    expect(screen.getByText('Set 2')).toBeTruthy();
    expect(screen.getByText('Set 3')).toBeTruthy();
  });

  it('shows suggested weight when expanded and weight > 0', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.getByText('Suggested: 135 lbs')).toBeTruthy();
  });

  it('shows last session info when provided', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} lastWeight={130} lastReps={8} />);
    expect(screen.getByText('Last: 130 × 8')).toBeTruthy();
  });

  it('calls onToggleExpand on press', () => {
    const onToggleExpand = jest.fn();
    render(<ExerciseCard {...defaultProps} onToggleExpand={onToggleExpand} />);
    fireEvent.press(screen.getByText('Bench Press'));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('calls onCompleteSet when pressing a pending set', () => {
    const onCompleteSet = jest.fn();
    render(<ExerciseCard {...defaultProps} expanded={true} onCompleteSet={onCompleteSet} />);
    fireEvent.press(screen.getByText('Set 1'));
    expect(onCompleteSet).toHaveBeenCalledWith(0);
  });

  it('does not call onCompleteSet when pressing a completed set', () => {
    const onCompleteSet = jest.fn();
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} onCompleteSet={onCompleteSet} />);
    fireEvent.press(screen.getByText('Set 1'));
    expect(onCompleteSet).not.toHaveBeenCalled();
  });

  it('calls onLongPressSet on long press', () => {
    const onLongPressSet = jest.fn();
    render(<ExerciseCard {...defaultProps} expanded={true} onLongPressSet={onLongPressSet} />);
    fireEvent(screen.getByText('Set 2'), 'longPress');
    expect(onLongPressSet).toHaveBeenCalledWith(1);
  });

  it('shows RPE selector when all sets are done', () => {
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} />);
    expect(screen.getByText('RPE')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('does not show RPE selector when sets are pending', () => {
    render(<ExerciseCard {...defaultProps} expanded={true} />);
    expect(screen.queryByText('RPE')).toBeNull();
  });

  it('calls onSetRPE when pressing an RPE bubble', () => {
    const onSetRPE = jest.fn();
    const sets = makeSets(3, 'completed');
    render(<ExerciseCard {...defaultProps} expanded={true} sets={sets} onSetRPE={onSetRPE} />);
    fireEvent.press(screen.getByText('8'));
    expect(onSetRPE).toHaveBeenCalledWith(8);
  });

  it('calls onLongPressCard on long press of the card', () => {
    const onLongPressCard = jest.fn();
    render(<ExerciseCard {...defaultProps} onLongPressCard={onLongPressCard} />);
    fireEvent(screen.getByText('Bench Press'), 'longPress');
    expect(onLongPressCard).toHaveBeenCalledTimes(1);
  });

  it('renders ad-hoc category correctly', () => {
    render(<ExerciseCard {...defaultProps} category="ad-hoc" target={undefined} />);
    expect(screen.getByText('AD-HOC')).toBeTruthy();
  });
});
