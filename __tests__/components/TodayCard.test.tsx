import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TodayCard } from '../../src/components/TodayCard';

const mockTemplate = {
  name: 'Upper Body Strength',
  exercises: [
    { name: 'Bench Press' },
    { name: 'Overhead Press' },
    { name: 'Barbell Row' },
  ],
  conditioning_finisher: false,
};

describe('TodayCard', () => {
  const defaultProps = {
    todayTemplate: undefined as any,
    isCompleted: false,
    blockColor: '#4A90D9',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Rest Day" when no template', () => {
    render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
    expect(screen.getByText(/rest day/i)).toBeTruthy();
  });

  it('shows recovery message on rest day', () => {
    render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
    // Should show some kind of recovery/rest message
    const tree = JSON.stringify(screen.toJSON());
    // Look for recovery-related messaging
    expect(tree.toLowerCase()).toMatch(/recov|rest|recharge/);
  });

  it('shows template name when template provided', () => {
    render(
      <TodayCard {...defaultProps} todayTemplate={mockTemplate} />
    );
    expect(screen.getByText('Upper Body Strength')).toBeTruthy();
  });

  it('shows "Today\'s Training" label', () => {
    render(
      <TodayCard {...defaultProps} todayTemplate={mockTemplate} />
    );
    expect(screen.getByText(/today's training/i)).toBeTruthy();
  });

  it('shows exercise count in subtitle', () => {
    render(
      <TodayCard {...defaultProps} todayTemplate={mockTemplate} />
    );
    // Should mention the number 3 (exercises)
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it('shows "Start Workout" button when not completed', () => {
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={mockTemplate}
        isCompleted={false}
      />
    );
    expect(screen.getByText(/start workout/i)).toBeTruthy();
  });

  it('calls onPress when start button pressed', () => {
    const onPress = jest.fn();
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={mockTemplate}
        isCompleted={false}
        onPress={onPress}
      />
    );
    fireEvent.press(screen.getByText(/start workout/i));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows "Completed" badge when isCompleted', () => {
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={mockTemplate}
        isCompleted={true}
      />
    );
    expect(screen.getByText(/completed/i)).toBeTruthy();
  });

  it('does not show "Start Workout" when completed', () => {
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={mockTemplate}
        isCompleted={true}
      />
    );
    expect(screen.queryByText(/start workout/i)).toBeNull();
  });

  it('shows session stats when completed and stats provided', () => {
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={mockTemplate}
        isCompleted={true}
        completedStats={{ durationMin: 52, setCount: 24 }}
      />,
    );
    expect(screen.getByText(/52 min/)).toBeTruthy();
    expect(screen.getByText(/24 sets/)).toBeTruthy();
  });

  it('does not show stats when completed but no stats provided', () => {
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={mockTemplate}
        isCompleted={true}
      />,
    );
    expect(screen.getByText(/completed/i)).toBeTruthy();
    expect(screen.queryByText(/min/)).toBeNull();
  });
});
