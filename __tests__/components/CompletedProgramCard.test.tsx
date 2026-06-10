import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompletedProgramCard } from '../../src/components/CompletedProgramCard';

it('renders name, stats and fires onViewSummary / onStartNew', () => {
  const onView = jest.fn();
  const onStart = jest.fn();
  const { getByText } = render(
    <CompletedProgramCard
      programName="Functional Athlete"
      dateRangeLabel="Mar 22 – Jun 7, 2026 · 11 weeks"
      prs={6} adherencePct={95}
      onViewSummary={onView}
      onStartNew={onStart}
    />
  );
  expect(getByText('Functional Athlete')).toBeTruthy();
  expect(getByText(/Adherence/)).toBeTruthy();

  fireEvent.press(getByText(/View full summary/));
  expect(onView).toHaveBeenCalled();

  fireEvent.press(getByText('Start a New Program'));
  expect(onStart).toHaveBeenCalled();
});
