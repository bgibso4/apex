import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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
};

describe('DaySelector', () => {
  it('renders week and block label', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText(/Week 3/)).toBeTruthy();
    expect(screen.getByText(/Hypertrophy/)).toBeTruthy();
  });

  it('shows "Change workout" link', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText(/Change workout/)).toBeTruthy();
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

  it('opens modal when "Change workout" is pressed', () => {
    render(<DaySelector {...defaultProps} />);
    fireEvent.press(screen.getByText(/Change workout/));
    // Modal shows the sheet title
    expect(screen.getByText('Change Workout')).toBeTruthy();
    // Shows workout names
    expect(screen.getByText(/Upper A/)).toBeTruthy();
    expect(screen.getByText(/Lower A/)).toBeTruthy();
  });

  it('renders workout name as hero title when provided', () => {
    render(<DaySelector {...defaultProps} workoutName="Upper A — Push" />);
    expect(screen.getByText('Upper A — Push')).toBeTruthy();
  });

  it('renders exercise count label when provided', () => {
    render(<DaySelector {...defaultProps} exerciseCountLabel="5 exercises" />);
    expect(screen.getByText('5 exercises')).toBeTruthy();
  });

  it('does not render hero title when workoutName is undefined', () => {
    render(<DaySelector {...defaultProps} />);
    // Week label should still be present
    expect(screen.getByText(/Week 3/)).toBeTruthy();
  });

  it('calls onSelectDay when a workout row is pressed', () => {
    const onSelectDay = jest.fn();
    render(<DaySelector {...defaultProps} onSelectDay={onSelectDay} />);
    fireEvent.press(screen.getByText(/Change workout/));
    fireEvent.press(screen.getByText(/Lower A/));
    expect(onSelectDay).toHaveBeenCalledWith('wednesday');
  });
});
