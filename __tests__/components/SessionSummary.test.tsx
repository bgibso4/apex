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

  it('shows duration in stat grid', () => {
    render(<SessionSummary {...defaultProps} duration="52:18" />);
    expect(screen.getByText('52:18')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
  });

  it('shows total volume in stat grid', () => {
    render(<SessionSummary {...defaultProps} totalVolume={12450} />);
    expect(screen.getByText('12,450')).toBeTruthy();
    expect(screen.getByText('Total lbs')).toBeTruthy();
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

  it('shows PR detail cards with descriptions', () => {
    const prs = [
      { id: '1', exercise_id: 'bench', record_type: 'e1rm' as const, rep_count: null,
        value: 263, previous_value: 250, session_id: 's1', date: '2026-03-07',
        exercise_name: 'Bench Press' },
    ];
    render(<SessionSummary {...defaultProps} prs={prs} />);
    expect(screen.getByText(/Bench Press/)).toBeTruthy();
    expect(screen.getByText(/263/)).toBeTruthy();
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
});
