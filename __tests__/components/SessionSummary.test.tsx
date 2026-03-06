import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SessionSummary } from '../../src/components/SessionSummary';

describe('SessionSummary', () => {
  it('renders exercise and set counts', () => {
    render(<SessionSummary exerciseCount={5} setCount={18} />);
    expect(screen.getByText('Session Complete')).toBeTruthy();
    expect(screen.getByText('5 exercises · 18 sets logged')).toBeTruthy();
  });

  it('renders with zero counts', () => {
    render(<SessionSummary exerciseCount={0} setCount={0} />);
    expect(screen.getByText('0 exercises · 0 sets logged')).toBeTruthy();
  });
});
