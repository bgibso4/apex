import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DaySelector } from '../../src/components/DaySelector';

const defaultProps = {
  currentWeek: 3,
  blockName: 'Hypertrophy',
  blockColor: '#6366f1',
  selectedDay: 'monday',
  trainingDays: [
    { day: 'monday', template: { name: 'Upper A — Push' } },
    { day: 'wednesday', template: { name: 'Lower A — Squat' } },
    { day: 'friday', template: { name: 'Upper B — Pull' } },
  ],
  dayNames: { monday: 'Mon', wednesday: 'Wed', friday: 'Fri' } as Record<string, string>,
  onSelectDay: jest.fn(),
};

describe('DaySelector', () => {
  it('renders week and block label', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText('Week 3 · Hypertrophy')).toBeTruthy();
  });

  it('renders all training day chips', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();
  });

  it('calls onSelectDay when a day chip is pressed', () => {
    const onSelectDay = jest.fn();
    render(<DaySelector {...defaultProps} onSelectDay={onSelectDay} />);
    fireEvent.press(screen.getByText('Wed'));
    expect(onSelectDay).toHaveBeenCalledWith('wednesday');
  });

  it('shows template name on day chips', () => {
    render(<DaySelector {...defaultProps} />);
    expect(screen.getByText('Upper A')).toBeTruthy(); // splits on '—'
    expect(screen.getByText('Lower A')).toBeTruthy();
  });
});
