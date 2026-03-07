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
};

describe('DaySelector', () => {
  it('renders week and block label', () => {
    render(<DaySelector {...defaultProps} />);
    // Title format: "Week 3 — Hypertrophy"
    expect(screen.getByText(/Week 3/)).toBeTruthy();
    expect(screen.getByText(/Hypertrophy/)).toBeTruthy();
  });

  it('renders all training day chips with day name and template name', () => {
    render(<DaySelector {...defaultProps} />);
    // Chip text format: "Mon · Upper A"
    expect(screen.getByText(/Mon/)).toBeTruthy();
    expect(screen.getByText(/Wed/)).toBeTruthy();
    expect(screen.getByText(/Fri/)).toBeTruthy();
  });

  it('calls onSelectDay when a day chip is pressed', () => {
    const onSelectDay = jest.fn();
    render(<DaySelector {...defaultProps} onSelectDay={onSelectDay} />);
    fireEvent.press(screen.getByText(/Wed/));
    expect(onSelectDay).toHaveBeenCalledWith('wednesday');
  });

  it('shows template name on day chips', () => {
    render(<DaySelector {...defaultProps} />);
    // Template name is split on '—' and first part trimmed
    expect(screen.getByText(/Upper A/)).toBeTruthy();
    expect(screen.getByText(/Lower A/)).toBeTruthy();
  });
});
