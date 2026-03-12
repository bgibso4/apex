import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DaySelector } from '../../src/components/DaySelector';

const defaultProps = {
  currentWeek: 3,
  blockName: 'Hypertrophy',
  blockColor: '#6366f1',
  selectedDay: 'monday',
  trainingDays: [
    { day: 'monday', template: { name: 'Upper A \u2014 Push' } },
    { day: 'wednesday', template: { name: 'Lower A \u2014 Squat' } },
    { day: 'friday', template: { name: 'Upper B \u2014 Pull' } },
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

  it('expands day chips when "Change workout" is pressed', () => {
    render(<DaySelector {...defaultProps} />);
    // Chips not visible initially
    expect(screen.queryByText(/Upper A/)).toBeNull();
    // Tap "Change workout"
    fireEvent.press(screen.getByText(/Change workout/));
    // Chips now visible
    expect(screen.getByText(/Upper A/)).toBeTruthy();
    expect(screen.getByText(/Lower A/)).toBeTruthy();
  });

  it('calls onSelectDay and collapses when a chip is pressed', () => {
    const onSelectDay = jest.fn();
    render(<DaySelector {...defaultProps} onSelectDay={onSelectDay} />);
    fireEvent.press(screen.getByText(/Change workout/));
    fireEvent.press(screen.getByText(/Wed/));
    expect(onSelectDay).toHaveBeenCalledWith('wednesday');
    // Should collapse after selection
    expect(screen.queryByText(/Lower A/)).toBeNull();
  });
});
