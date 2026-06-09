import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgramSummaryView } from '../../src/components/ProgramSummaryView';
import type { ProgramSummary } from '../../src/db/programSummary';

const base: ProgramSummary = {
  programId: 'p1', programName: 'Functional Athlete', startDate: '2026-03-22', endDate: '2026-06-07',
  weeks: 11, sessionsCompleted: 38, sessionsPlanned: 40, adherencePct: 95,
  gains: [{ exerciseId: 'deadlift', name: 'Deadlift', startE1rm: 335, endE1rm: 375, deltaLb: 40, deltaPct: 12 }],
  prs: [{ exerciseId: 'deadlift', name: 'Deadlift', recordType: 'e1rm', value: 389, repCount: null, weekNumber: 11, date: '2026-06-05' }],
};

it('renders gains, PRs, and CTAs; fires callbacks', () => {
  const onPrimary = jest.fn(); const onSecondary = jest.fn();
  const { getByText } = render(<ProgramSummaryView summary={base} onPrimary={onPrimary} onSecondary={onSecondary} />);
  expect(getByText('Deadlift')).toBeTruthy();
  expect(getByText(/\+40/)).toBeTruthy();
  expect(getByText('Start a new program')).toBeTruthy();
  fireEvent.press(getByText('Start a new program')); expect(onPrimary).toHaveBeenCalled();
  fireEvent.press(getByText('Back to Home')); expect(onSecondary).toHaveBeenCalled();
});

it('renders a regressed lift as a negative delta, not "+-"', () => {
  const summary: ProgramSummary = { ...base, gains: [{ exerciseId: 'ohp', name: 'Overhead Press', startE1rm: 140, endE1rm: 130, deltaLb: -10, deltaPct: -7 }] };
  const { getByText, queryByText } = render(<ProgramSummaryView summary={summary} onPrimary={() => {}} onSecondary={() => {}} />);
  expect(queryByText(/\+-/)).toBeNull();
  expect(getByText(/-10|−10/)).toBeTruthy();
});
