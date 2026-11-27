import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgramSummaryView } from '../../src/components/ProgramSummaryView';
import type { ProgramSummary } from '../../src/db/programSummary';

const base: ProgramSummary = {
  programId: 'p1', programName: 'Functional Athlete', startDate: '2026-03-22', endDate: '2026-06-07',
  weeks: 11, sessionsCompleted: 38, sessionsPlanned: 40, adherencePct: 95,
  gains: [{ exerciseId: 'deadlift', name: 'Deadlift', startE1rm: 335, endE1rm: 375, deltaLb: 40, deltaPct: 12 }],
  prs: [{
    exerciseId: 'deadlift', name: 'Deadlift', recordType: 'e1rm', value: 389,
    repCount: null, weekNumber: 11, date: '2026-06-05',
    weightLb: 365, reps: 2,
  }],
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

it('PR detail shows weight × reps when weightLb and reps are present', () => {
  const { getByText } = render(<ProgramSummaryView summary={base} onPrimary={() => {}} onSecondary={() => {}} />);
  // The detail line should show "365 × 2 · Week 11"
  expect(getByText(/365/)).toBeTruthy();
  expect(getByText(/365 × 2/)).toBeTruthy();
});

it('PR detail falls back to Week label when weightLb/reps are null', () => {
  const summary: ProgramSummary = {
    ...base,
    prs: [{
      exerciseId: 'deadlift', name: 'Deadlift', recordType: 'e1rm', value: 389,
      repCount: null, weekNumber: 11, date: '2026-06-05',
      weightLb: null, reps: null,
    }],
  };
  // Should render without crashing; Week label should appear
  const { getByText } = render(<ProgramSummaryView summary={summary} onPrimary={() => {}} onSecondary={() => {}} />);
  expect(getByText(/Week 11/)).toBeTruthy();
});

it('formatDelta zero case has correct spacing: "±0 lb · 0%"', () => {
  const summary: ProgramSummary = {
    ...base,
    gains: [{ exerciseId: 'deadlift', name: 'Deadlift', startE1rm: 335, endE1rm: 335, deltaLb: 0, deltaPct: 0 }],
    prs: [],
  };
  const { getByText } = render(<ProgramSummaryView summary={summary} onPrimary={() => {}} onSecondary={() => {}} />);
  expect(getByText('±0 lb · 0%')).toBeTruthy();
});

it('formatDateRange: null startDate formats endDate with formatShort', () => {
  const summary: ProgramSummary = { ...base, startDate: null, endDate: '2026-06-07' };
  const { getByText } = render(<ProgramSummaryView summary={summary} onPrimary={() => {}} onSecondary={() => {}} />);
  // Should show "Jun 7" rather than the raw ISO string "2026-06-07"
  expect(getByText(/Jun 7/)).toBeTruthy();
});
