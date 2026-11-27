import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { DaySelector } from '../../src/components/DaySelector';

const defaultProps = {
  currentWeek: 3,
  blockName: 'Hypertrophy',
  blockColor: '#6366f1',
  selectedDay: 'monday',
  trainingDays: [
    { day: 'monday', template: { name: 'Upper A \u2014 Push', exercises: [{ exercise_id: 'a' }, { exercise_id: 'b' }] } },
    { day: 'wednesday', template: { name: 'Lower A \u2014 Squat', exercises: [{ exercise_id: 'c' }] } },
    { day: 'friday', template: { name: 'Upper B \u2014 Pull', exercises: [{ exercise_id: 'd' }, { exercise_id: 'e' }, { exercise_id: 'f' }] } },
  ],
  dayNames: { monday: 'Mon', wednesday: 'Wed', friday: 'Fri' } as Record<string, string>,
  onSelectDay: jest.fn(),
  todayKey: 'monday',
  workoutName: 'Upper A \u2014 Push',
  exerciseCountLabel: '2 exercises',
  exercises: [
    { name: 'Bench Press', detail: '4 \u00D7 8' },
    { name: 'Barbell Row', detail: '3 \u00D7 10' },
  ],
};

describe('DaySelector', () => {
  it('renders workout name in info card', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText('Upper A \u2014 Push')).toBeTruthy();
  });

  it('renders week and block label', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText(/Week 3/)).toBeTruthy();
    expect(screen.getByText(/Hypertrophy/)).toBeTruthy();
  });

  it('does not show "Change" link inside card (moved to parent)', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.queryByText('Change')).toBeNull();
    expect(screen.queryByText('Change workout')).toBeNull();
  });

  it('shows today badge when selectedDay matches todayKey', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText(/Mon — Today/)).toBeTruthy();
  });

  it('shows day name without today badge when not today', () => {
    render(<DaySelector {...defaultProps} selectedDay="wednesday" />);
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.queryByText(/Today/)).toBeNull();
  });

  it('shows exercise count as toggle row', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText('2 exercises')).toBeTruthy();
  });

  it('exercises are hidden by default', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  it('expands exercises when toggle is pressed', () => {
    render(<DaySelector {...defaultProps} />);
    fireEvent.press(screen.getByText('2 exercises'));
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Barbell Row')).toBeTruthy();
    expect(screen.getByText('4 \u00D7 8')).toBeTruthy();
  });

  it('collapses exercises when toggle is pressed again', () => {
    render(<DaySelector {...defaultProps} />);
    fireEvent.press(screen.getByText('2 exercises'));
    expect(screen.getByText('Bench Press')).toBeTruthy();
    fireEvent.press(screen.getByText('2 exercises'));
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  it('opens modal via ref.openChangeModal()', () => {
    const ref = React.createRef<import('../../src/components/DaySelector').DaySelectorHandle>();
    render(<DaySelector {...defaultProps} ref={ref} />);
    act(() => {
      ref.current!.openChangeModal();
    });
    expect(screen.getByText('Change Workout')).toBeTruthy();
    expect(screen.getAllByText(/Upper A/).length).toBeGreaterThanOrEqual(2); // card + modal
    expect(screen.getByText(/Lower A/)).toBeTruthy();
  });

  it('calls onSelectDay when a workout row is pressed', () => {
    const ref = React.createRef<import('../../src/components/DaySelector').DaySelectorHandle>();
    const onSelectDay = jest.fn();
    render(<DaySelector {...defaultProps} onSelectDay={onSelectDay} ref={ref} />);
    act(() => {
      ref.current!.openChangeModal();
    });
    fireEvent.press(screen.getByText(/Lower A/));
    expect(onSelectDay).toHaveBeenCalledWith('wednesday');
  });

  it('renders rest day context when no workoutName', () => {
    render(<DaySelector {...defaultProps} workoutName={undefined} exerciseCountLabel={undefined} exercises={undefined} />);
    expect(screen.getByText(/Week 3/)).toBeTruthy();
    expect(screen.getByText('Change workout')).toBeTruthy();
  });
});
