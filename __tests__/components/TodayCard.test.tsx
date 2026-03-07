import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TodayCard } from '../../src/components/TodayCard';

const mockTemplate = {
  name: 'Upper Body Strength',
  warmup: 'jump_rope,ankle_circles,hip_ir',
  exercises: [
    { exercise_id: 'bench_press', name: 'Bench Press', category: 'main', targets: [] },
    { exercise_id: 'overhead_press', name: 'Overhead Press', category: 'main', targets: [] },
    { exercise_id: 'barbell_row', name: 'Barbell Row', category: 'compound_accessory', targets: [] },
  ],
  conditioning_finisher: false,
} as any as import('../../src/types').DayTemplate;

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

  it('shows a quote on rest day', () => {
    render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
    const tree = JSON.stringify(screen.toJSON());
    // Quotes contain recovery/rest-related words
    expect(tree).toMatch(/grow|recover|stronger|rest|sleep|repair|adapt|earned|patience|progress|process|conquer|overtrain/i);
  });

  it('shows up-next preview when nextSessionName provided on rest day', () => {
    render(
      <TodayCard
        {...defaultProps}
        todayTemplate={undefined}
        nextSessionName="Upper Push & Conditioning"
        nextSessionLabel="Tomorrow"
      />,
    );
    expect(screen.getByText(/tomorrow/i)).toBeTruthy();
    expect(screen.getByText(/upper push/i)).toBeTruthy();
  });

  it('does not show up-next when nextSessionName not provided on rest day', () => {
    render(<TodayCard {...defaultProps} todayTemplate={undefined} />);
    expect(screen.queryByText(/tomorrow/i)).toBeNull();
  });
});
