import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SessionSummary } from '../../src/components/SessionSummary';

describe('SessionSummary', () => {
  it('renders exercise and set counts', () => {
    render(<SessionSummary exerciseCount={5} setCount={18} />);
    expect(screen.getByText('Workout Complete')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
    expect(screen.getByText('Sets')).toBeTruthy();
  });

  it('renders with zero counts', () => {
    render(<SessionSummary exerciseCount={0} setCount={0} />);
    expect(screen.getByText('Workout Complete')).toBeTruthy();
    expect(screen.getByText('Session Notes (optional)')).toBeTruthy();
  });
});
