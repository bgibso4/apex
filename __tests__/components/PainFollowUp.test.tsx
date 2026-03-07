import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PainFollowUp } from '../../src/components/PainFollowUp';

describe('PainFollowUp', () => {
  const defaultProps = {
    runDate: '2026-03-06',
    durationMin: 30,
    onSave: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title "How\'s the pain today?"', () => {
    render(<PainFollowUp {...defaultProps} />);
    expect(screen.getByText(/how's the pain today/i)).toBeTruthy();
  });

  it('shows run context with day name and duration', () => {
    render(<PainFollowUp {...defaultProps} runDate="2026-03-06" durationMin={30} />);
    // Should show the day name (Friday for 2026-03-06)
    expect(screen.getByText(/friday/i)).toBeTruthy();
    expect(screen.getByText(/30/)).toBeTruthy();
  });

  it('shows distance when provided', () => {
    render(<PainFollowUp {...defaultProps} distance={3.5} />);
    expect(screen.getByText(/3\.5/)).toBeTruthy();
  });

  it('does not show distance when not provided', () => {
    render(<PainFollowUp {...defaultProps} />);
    const tree = screen.toJSON();
    const treeString = JSON.stringify(tree);
    // The distance pattern is " · X.X mi" — check that " mi" unit isn't present
    // (note: "min" for minutes is expected, so we check for " mi" with trailing quote)
    expect(treeString).not.toContain(' mi"');
  });

  it('renders all 11 pain dots (0-10)', () => {
    render(<PainFollowUp {...defaultProps} />);
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeTruthy();
    }
  });

  it('calls onSave with selected pain level when Save is pressed', () => {
    const onSave = jest.fn();
    render(<PainFollowUp {...defaultProps} onSave={onSave} />);

    // Select pain level 7
    fireEvent.press(screen.getByText('7'));

    // Press save
    const saveButton = screen.getByText(/save/i);
    fireEvent.press(saveButton);

    expect(onSave).toHaveBeenCalledWith(7);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is pressed', () => {
    const onDismiss = jest.fn();
    render(<PainFollowUp {...defaultProps} onDismiss={onDismiss} />);

    // The dismiss button is typically an × character
    const dismissButton = screen.getByText('×');
    fireEvent.press(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('selecting a pain dot updates the description text', () => {
    render(<PainFollowUp {...defaultProps} />);

    // Default should show "None" for pain level 0
    expect(screen.getByText(/none/i)).toBeTruthy();

    // Select a higher pain level and verify the description changes
    fireEvent.press(screen.getByText('5'));
    // Pain level 5 should not show "None" anymore
    expect(screen.queryByText(/none/i)).toBeNull();
  });

  it('default pain is 0 ("None")', () => {
    render(<PainFollowUp {...defaultProps} />);
    expect(screen.getByText(/none/i)).toBeTruthy();
  });
});
