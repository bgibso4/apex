import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '../../src/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders label and count text', () => {
    const { getByText } = render(
      <ProgressBar label="Jump Rope" value={8} max={10} color="#22c55e" />
    );

    expect(getByText('Jump Rope')).toBeTruthy();
    expect(getByText('8 / 10')).toBeTruthy();
  });

  it('renders percentage when showPercentage is true', () => {
    const { getByText, queryByText } = render(
      <ProgressBar
        label="Compliance"
        value={3}
        max={4}
        color="#6366f1"
        showPercentage
      />
    );

    expect(getByText('Compliance')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(queryByText('3 / 4')).toBeNull();
  });

  it('handles zero max gracefully', () => {
    const { getByText } = render(
      <ProgressBar label="Empty" value={0} max={0} color="#6366f1" />
    );

    expect(getByText('Empty')).toBeTruthy();
    expect(getByText('0 / 0')).toBeTruthy();
  });

  it('handles zero max with showPercentage gracefully', () => {
    const { getByText } = render(
      <ProgressBar
        label="Empty"
        value={0}
        max={0}
        color="#6366f1"
        showPercentage
      />
    );

    expect(getByText('0%')).toBeTruthy();
  });
});
