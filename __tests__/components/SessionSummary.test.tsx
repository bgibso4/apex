import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SessionSummary } from '../../src/components/SessionSummary';

const defaultProps = {
  exerciseCount: 5,
  setCount: 18,
};

describe('SessionSummary', () => {
  it('renders exercise and set counts', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByText('Workout Complete')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
    expect(screen.getByText('Sets')).toBeTruthy();
  });

  it('renders with zero counts', () => {
    render(<SessionSummary exerciseCount={0} setCount={0} />);
    expect(screen.getByText('Workout Complete')).toBeTruthy();
    expect(screen.getByText('Session Notes (optional)')).toBeTruthy();
  });

  it('shows duration in summary row', () => {
    render(<SessionSummary {...defaultProps} duration="52:18" />);
    expect(screen.getByText('52:18')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
  });

  it('shows sets compliance when totalSets provided', () => {
    render(<SessionSummary {...defaultProps} totalSets={20} />);
    expect(screen.getByText('18/20')).toBeTruthy();
  });

  it('shows PR count with PRs label', () => {
    const prs = [
      { id: '1', exercise_id: 'bench', record_type: 'e1rm' as const, rep_count: null,
        value: 263, previous_value: 250, session_id: 's1', date: '2026-03-07',
        exercise_name: 'Bench Press' },
    ];
    render(<SessionSummary {...defaultProps} prs={prs} />);
    expect(screen.getByText('PRs')).toBeTruthy();
  });

  it('shows PR detail cards with trophy icon and descriptions', () => {
    const prs = [
      { id: '1', exercise_id: 'bench', record_type: 'e1rm' as const, rep_count: null,
        value: 263, previous_value: 250, session_id: 's1', date: '2026-03-07',
        exercise_name: 'Bench Press' },
    ];
    render(<SessionSummary {...defaultProps} prs={prs} />);
    expect(screen.getByText(/Bench Press/)).toBeTruthy();
    expect(screen.getByText(/263/)).toBeTruthy();
    expect(screen.getByText('Personal Records')).toBeTruthy();
  });

  it('shows Edit button and calls onEdit on press', () => {
    const onEdit = jest.fn();
    render(<SessionSummary {...defaultProps} onEdit={onEdit} />);
    const editBtn = screen.getByTestId('edit-button');
    fireEvent.press(editBtn);
    expect(onEdit).toHaveBeenCalled();
  });

  it('shows Delete button in edit mode', () => {
    const onDelete = jest.fn();
    render(<SessionSummary {...defaultProps} editMode={true} onDelete={onDelete} />);
    expect(screen.getByText('Delete Workout')).toBeTruthy();
  });

  it('shows Session Review card when sessionId and onViewSession provided', () => {
    const onViewSession = jest.fn();
    render(
      <SessionSummary
        {...defaultProps}
        sessionId="s123"
        onViewSession={onViewSession}
      />
    );
    expect(screen.getByText('Session Review')).toBeTruthy();
    fireEvent.press(screen.getByTestId('session-review-card'));
    expect(onViewSession).toHaveBeenCalledWith('s123');
  });

  it('shows protocol chips for warmup and conditioning', () => {
    render(
      <SessionSummary
        {...defaultProps}
        warmup={{ rope: true, ankle: true, hipIr: false }}
        conditioningFinisher="EMOM 10min"
        conditioningDone={true}
      />
    );
    expect(screen.getByText('Protocols')).toBeTruthy();
    expect(screen.getByText(/Jump Rope/)).toBeTruthy();
    expect(screen.getByText(/Hip IR/)).toBeTruthy();
    expect(screen.getByText(/Conditioning/)).toBeTruthy();
  });

  it('shows recent workouts section', () => {
    const recentSessions = [
      { id: 's1', name: 'Pull A', dateLabel: 'Mar 7', blockName: 'Strength Block', durationMin: 45, setCount: 18 },
      { id: 's2', name: 'Legs A', dateLabel: 'Mar 5', durationMin: 52, setCount: 20 },
    ];
    const onViewSession = jest.fn();
    const onViewAllWorkouts = jest.fn();
    render(
      <SessionSummary
        {...defaultProps}
        recentSessions={recentSessions}
        onViewSession={onViewSession}
        onViewAllWorkouts={onViewAllWorkouts}
      />
    );
    expect(screen.getByText('Recent Workouts')).toBeTruthy();
    expect(screen.getByText('Pull A')).toBeTruthy();
    expect(screen.getByText('Legs A')).toBeTruthy();
    expect(screen.getByText(/View all workouts/)).toBeTruthy();
  });
});
