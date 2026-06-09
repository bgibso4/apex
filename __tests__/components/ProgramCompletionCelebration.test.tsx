import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgramCompletionCelebration } from '../../src/components/ProgramCompletionCelebration';

describe('ProgramCompletionCelebration', () => {
  it('renders program name + stat line and fires onContinue on press', () => {
    const onContinue = jest.fn();
    const { getByText } = render(
      <ProgramCompletionCelebration
        programName="Functional Athlete"
        weeks={11} sessions={38} prs={6}
        onContinue={onContinue}
      />
    );
    expect(getByText('Functional Athlete')).toBeTruthy();
    expect(getByText(/11 weeks/)).toBeTruthy();
    fireEvent.press(getByText('Continue'));
    expect(onContinue).toHaveBeenCalled();
  });
});
