import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SessionSummary, SummaryExercise } from '../../src/components/SessionSummary';

const makeExercise = (overrides: Partial<SummaryExercise> = {}): SummaryExercise => ({
  name: 'Bench Press',
  sets: [
    { weight: 135, reps: 8, status: 'completed', rpe: 7 },
    { weight: 135, reps: 8, status: 'completed', rpe: 8 },
    { weight: 135, reps: 6, status: 'completed_below', rpe: 9 },
  ],
  rpe: 8,
  ...overrides,
});

describe('SessionSummary', () => {
  // --- Existing basic tests ---

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

  // --- sessionName and weekLabel ---

  it('renders sessionName when provided', () => {
    render(<SessionSummary exerciseCount={3} setCount={9} sessionName="Upper Body A" />);
    expect(screen.getByText('Upper Body A')).toBeTruthy();
  });

  it('renders sessionName with weekLabel', () => {
    render(
      <SessionSummary
        exerciseCount={3}
        setCount={9}
        sessionName="Upper Body A"
        weekLabel="Week 3"
      />,
    );
    expect(screen.getByText(/Upper Body A \u2014 Week 3/)).toBeTruthy();
  });

  it('does not render subtitle when sessionName is absent', () => {
    render(<SessionSummary exerciseCount={3} setCount={9} weekLabel="Week 3" />);
    expect(screen.queryByText(/Week 3/)).toBeNull();
  });

  // --- Duration ---

  it('renders duration value when provided', () => {
    render(<SessionSummary exerciseCount={3} setCount={9} duration="42:15" />);
    expect(screen.getByText('42:15')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
  });

  it('renders "--" as default when duration is not provided', () => {
    render(<SessionSummary exerciseCount={3} setCount={9} />);
    expect(screen.getByText('--')).toBeTruthy();
  });

  // --- totalVolume ---

  it('renders total volume with "Total lbs" label when totalVolume is provided', () => {
    render(<SessionSummary exerciseCount={3} setCount={9} totalVolume={12500} />);
    expect(screen.getByText('12,500')).toBeTruthy();
    expect(screen.getByText('Total lbs')).toBeTruthy();
  });

  it('falls back to exerciseCount when totalVolume is not provided', () => {
    render(<SessionSummary exerciseCount={4} setCount={12} />);
    // The third stat card should show exerciseCount with "Exercises" label
    const exercisesLabels = screen.getAllByText('Exercises');
    expect(exercisesLabels.length).toBe(2); // two stat cards show "Exercises"
  });

  // --- Notes saved indicator ---

  it('shows saved checkmark when notesSaved is true and notes are non-empty', () => {
    render(
      <SessionSummary
        exerciseCount={3}
        setCount={9}
        notes="Great session"
        notesSaved={true}
        onNotesChange={jest.fn()}
      />,
    );
    expect(screen.getByText(/\u2713 Saved/)).toBeTruthy();
  });

  it('does not show saved indicator when notesSaved is true but notes are empty', () => {
    render(
      <SessionSummary
        exerciseCount={3}
        setCount={9}
        notes=""
        notesSaved={true}
        onNotesChange={jest.fn()}
      />,
    );
    expect(screen.queryByText(/Saved/)).toBeNull();
  });

  it('does not show saved indicator when notesSaved is false', () => {
    render(
      <SessionSummary
        exerciseCount={3}
        setCount={9}
        notes="Some note"
        notesSaved={false}
        onNotesChange={jest.fn()}
      />,
    );
    expect(screen.queryByText(/Saved/)).toBeNull();
  });

  // --- onNotesChange callback ---

  it('calls onNotesChange when typing in the TextInput', () => {
    const onNotesChange = jest.fn();
    render(
      <SessionSummary
        exerciseCount={3}
        setCount={9}
        notes=""
        onNotesChange={onNotesChange}
      />,
    );
    const input = screen.getByPlaceholderText('How did the session feel overall?');
    fireEvent.changeText(input, 'Felt strong today');
    expect(onNotesChange).toHaveBeenCalledWith('Felt strong today');
  });

  // --- Exercise list rendering ---

  it('renders exercise section when exercises are provided', () => {
    const exercises = [makeExercise()];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);
    expect(screen.getByText('EXERCISES')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
  });

  it('does not render exercise section when exercises array is empty', () => {
    render(<SessionSummary exerciseCount={0} setCount={0} exercises={[]} />);
    expect(screen.queryByText('EXERCISES')).toBeNull();
  });

  it('does not render exercise section when exercises is undefined', () => {
    render(<SessionSummary exerciseCount={0} setCount={0} />);
    expect(screen.queryByText('EXERCISES')).toBeNull();
  });

  it('renders multiple exercises', () => {
    const exercises = [
      makeExercise({ name: 'Bench Press' }),
      makeExercise({ name: 'Squat' }),
      makeExercise({ name: 'Deadlift' }),
    ];
    render(<SessionSummary exerciseCount={3} setCount={9} exercises={exercises} />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
    expect(screen.getByText('Deadlift')).toBeTruthy();
  });

  // --- ExerciseRow: set count text and plural ---

  it('shows plural "sets" for multiple sets', () => {
    const exercises = [
      makeExercise({
        name: 'Squat',
        sets: [
          { weight: 225, reps: 5, status: 'completed' },
          { weight: 225, reps: 5, status: 'completed' },
        ],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={2} exercises={exercises} />);
    expect(screen.getByText(/2 sets/)).toBeTruthy();
  });

  it('shows singular "set" for one set', () => {
    const exercises = [
      makeExercise({
        name: 'Curl',
        sets: [{ weight: 30, reps: 12, status: 'completed' }],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);
    expect(screen.getByText(/1 set(?!s)/)).toBeTruthy();
  });

  // --- ExerciseRow: weight display ---

  it('shows weight in exercise summary when first set weight > 0', () => {
    const exercises = [
      makeExercise({
        sets: [{ weight: 185, reps: 5, status: 'completed' }],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);
    expect(screen.getByText(/185 lbs/)).toBeTruthy();
  });

  it('does not show weight when first set weight is 0', () => {
    const exercises = [
      makeExercise({
        name: 'Push-ups',
        sets: [{ weight: 0, reps: 20, status: 'completed' }],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);
    expect(screen.getByText(/1 set/)).toBeTruthy();
    // Should not contain "lbs" in the summary line
    expect(screen.queryByText(/0 lbs/)).toBeNull();
  });

  // --- ExerciseRow: Ad-hoc tag ---

  it('displays Ad-hoc tag when exercise is ad-hoc', () => {
    const exercises = [
      makeExercise({
        name: 'Face Pulls',
        isAdhoc: true,
        sets: [{ weight: 30, reps: 15, status: 'completed' }],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);
    expect(screen.getByText(/Ad-hoc/)).toBeTruthy();
  });

  it('does not display Ad-hoc tag when exercise is not ad-hoc', () => {
    const exercises = [makeExercise({ isAdhoc: false })];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);
    expect(screen.queryByText(/Ad-hoc/)).toBeNull();
  });

  // --- ExerciseRow: RPE display ---

  it('displays RPE on exercise row when exercise has rpe', () => {
    const exercises = [makeExercise({ rpe: 9 })];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);
    expect(screen.getByText('RPE 9')).toBeTruthy();
  });

  it('does not display RPE when exercise rpe is undefined', () => {
    const exercises = [makeExercise({ rpe: undefined })];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);
    expect(screen.queryByText(/RPE/)).toBeNull();
  });

  // --- ExerciseRow: expand arrow ---

  it('shows down arrow when collapsed', () => {
    const exercises = [makeExercise()];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);
    expect(screen.getByText('\u25BC')).toBeTruthy();
  });

  // --- ExerciseRow: tap to expand and show set table ---

  it('expands to show set table when exercise row is tapped', () => {
    const exercises = [makeExercise()];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);

    // Before tap: no set table headers
    expect(screen.queryByText('Weight')).toBeNull();

    // Tap the exercise row
    fireEvent.press(screen.getByText('Bench Press'));

    // After tap: set table headers appear
    expect(screen.getByText('Set')).toBeTruthy();
    expect(screen.getByText('Weight')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('RPE')).toBeTruthy();
  });

  it('shows up arrow when expanded', () => {
    const exercises = [makeExercise()];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);

    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.getByText('\u25B2')).toBeTruthy();
  });

  it('collapses set table on second tap', () => {
    const exercises = [makeExercise()];
    render(<SessionSummary exerciseCount={1} setCount={3} exercises={exercises} />);

    // Expand
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.getByText('Weight')).toBeTruthy();

    // Collapse
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.queryByText('Weight')).toBeNull();
    expect(screen.getByText('\u25BC')).toBeTruthy();
  });

  // --- Set table content ---

  it('shows set numbers, weight, reps, and RPE in expanded table', () => {
    const exercises = [
      makeExercise({
        sets: [
          { weight: 135, reps: 8, status: 'completed', rpe: 7 },
          { weight: 140, reps: 6, status: 'completed', rpe: 9 },
        ],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={2} exercises={exercises} />);

    fireEvent.press(screen.getByText('Bench Press'));

    // Set table headers are present
    expect(screen.getByText('Set')).toBeTruthy();
    expect(screen.getByText('Weight')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();

    // Weights from the set rows
    expect(screen.getByText('135')).toBeTruthy();
    expect(screen.getByText('140')).toBeTruthy();

    // RPE values from the set rows
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('shows em-dash for zero weight in expanded set table', () => {
    const exercises = [
      makeExercise({
        name: 'Pull-ups',
        sets: [{ weight: 0, reps: 10, status: 'completed', rpe: 8 }],
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);

    fireEvent.press(screen.getByText('Pull-ups'));

    // Weight should show em-dash for 0
    expect(screen.getByText('\u2014')).toBeTruthy();
  });

  it('shows em-dash for null RPE in expanded set table', () => {
    const exercises = [
      makeExercise({
        sets: [{ weight: 135, reps: 8, status: 'completed' }], // no rpe
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);

    fireEvent.press(screen.getByText('Bench Press'));

    // RPE should show em-dash when undefined
    expect(screen.getByText('\u2014')).toBeTruthy();
  });

  it('shows both em-dashes for zero weight and null RPE', () => {
    const exercises = [
      makeExercise({
        name: 'Bodyweight Dips',
        sets: [{ weight: 0, reps: 12, status: 'completed' }], // no rpe, zero weight
      }),
    ];
    render(<SessionSummary exerciseCount={1} setCount={1} exercises={exercises} />);

    fireEvent.press(screen.getByText('Bodyweight Dips'));

    // Should have 2 em-dashes: one for weight, one for RPE
    const dashes = screen.getAllByText('\u2014');
    expect(dashes.length).toBe(2);
  });
});
