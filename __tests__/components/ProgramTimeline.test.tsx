import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgramTimeline } from '../../src/components/ProgramTimeline';
import { getBlockForWeek, getBlockColor } from '../../src/utils/program';

jest.mock('../../src/utils/program', () => ({
  getBlockForWeek: jest.fn(),
  getBlockColor: jest.fn(() => '#6366f1'),
}));

const mockedGetBlockForWeek = getBlockForWeek as jest.MockedFunction<
  typeof getBlockForWeek
>;
const mockedGetBlockColor = getBlockColor as jest.MockedFunction<
  typeof getBlockColor
>;

describe('ProgramTimeline', () => {
  const defaultBlocks = [
    { name: 'Hypertrophy', weeks: [1, 2, 3, 4] },
    { name: 'Strength', weeks: [5, 6, 7, 8] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetBlockForWeek.mockImplementation((week: number) => {
      if (week <= 4) return defaultBlocks[0];
      return defaultBlocks[1];
    });
    mockedGetBlockColor.mockReturnValue('#6366f1');
  });

  it('renders block labels truncated to 3 chars for long names', () => {
    render(
      <ProgramTimeline
        durationWeeks={8}
        blocks={defaultBlocks}
        currentWeek={1}
      />,
    );

    // "Hypertrophy" (11 chars > 5) should be truncated to "Hyp"
    expect(screen.getByText('Hyp')).toBeTruthy();
  });

  it('renders full label for short block names (<=5 chars)', () => {
    const shortBlocks = [
      { name: 'Power', weeks: [1, 2, 3, 4] },
      { name: 'Hypertrophy', weeks: [5, 6, 7, 8] },
    ];

    mockedGetBlockForWeek.mockImplementation((week: number) => {
      if (week <= 4) return shortBlocks[0];
      return shortBlocks[1];
    });

    render(
      <ProgramTimeline
        durationWeeks={8}
        blocks={shortBlocks}
        currentWeek={1}
      />,
    );

    // "Power" (5 chars <= 5) should render in full
    expect(screen.getByText('Power')).toBeTruthy();
  });

  it('renders segments for each block', () => {
    render(
      <ProgramTimeline
        durationWeeks={8}
        blocks={defaultBlocks}
        currentWeek={1}
      />,
    );

    // Both blocks should have visible labels
    // "Hypertrophy" -> "Hyp", "Strength" -> "Str"
    expect(screen.getByText('Hyp')).toBeTruthy();
    expect(screen.getByText('Str')).toBeTruthy();
  });
});
