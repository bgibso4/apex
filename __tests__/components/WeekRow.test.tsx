import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WeekRow } from '../../src/components/WeekRow';

describe('WeekRow', () => {
  const defaultProps = {
    trainingDays: [
      { day: 'mon', template: { name: 'Upper Body' } },
      { day: 'wed', template: { name: 'Lower Body' } },
      { day: 'fri', template: { name: 'Full Body' } },
    ],
    todayKey: 'wed',
    completedDays: ['mon'],
    blockColor: '#6366f1',
    dayNames: {
      mon: 'Mon',
      wed: 'Wed',
      fri: 'Fri',
    } as Record<string, string>,
    onDayPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders day name labels from dayNames record', () => {
    render(<WeekRow {...defaultProps} />);

    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();
  });

  it('calls onDayPress when a day chip is pressed', () => {
    const onDayPress = jest.fn();
    render(<WeekRow {...defaultProps} onDayPress={onDayPress} />);

    const monLabel = screen.getByText('Mon');
    fireEvent.press(monLabel);

    expect(onDayPress).toHaveBeenCalledWith('mon');
  });

  it('shows checkmark for completed days', () => {
    render(<WeekRow {...defaultProps} />);

    // Completed days (mon) should show a checkmark icon
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows numbered indicators for upcoming days', () => {
    render(<WeekRow {...defaultProps} />);

    // Non-completed days should show numbered indicators (day index)
    // Wed is day 2, Fri is day 3 in the training days list
    const dayTwo = screen.queryByText('2');
    const dayThree = screen.queryByText('3');

    // At least one numbered indicator should be visible for upcoming days
    expect(dayTwo || dayThree).toBeTruthy();
  });
});
