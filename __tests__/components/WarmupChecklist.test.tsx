import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WarmupChecklist } from '../../src/components/WarmupChecklist';
import type { SessionProtocol } from '../../src/types';

const mockProtocols: SessionProtocol[] = [
  { id: 1, session_id: 's1', type: 'warmup', protocol_key: 'jump_rope', protocol_name: 'Jump Rope — 3 min', completed: false, sort_order: 0 },
  { id: 2, session_id: 's1', type: 'warmup', protocol_key: 'full_ankle', protocol_name: 'Full Ankle Protocol — 10 min', completed: false, sort_order: 1 },
  { id: 3, session_id: 's1', type: 'conditioning', protocol_key: null, protocol_name: 'Assault Bike', completed: false, sort_order: 2 },
];

const defaultProps = {
  protocols: mockProtocols,
  onToggle: jest.fn(),
  onContinue: jest.fn(),
};

describe('WarmupChecklist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders warmup protocol items from data', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText('Jump Rope — 3 min')).toBeTruthy();
    expect(screen.getByText('Full Ankle Protocol — 10 min')).toBeTruthy();
  });

  it('does not render conditioning items', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.queryByText('Assault Bike')).toBeNull();
  });

  it('renders continue button', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText(/Continue to Exercises/)).toBeTruthy();
  });

  it('calls onToggle with protocol id when pressed', () => {
    const onToggle = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggle={onToggle} />);
    fireEvent.press(screen.getByText('Jump Rope — 3 min'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('shows checked state for completed protocols', () => {
    const completed = mockProtocols.map((p, i) => i === 0 ? { ...p, completed: true } : p);
    render(<WarmupChecklist {...defaultProps} protocols={completed} />);
    expect(screen.getByText('\u2713')).toBeTruthy();
  });

  it('calls onContinue when continue button is pressed', () => {
    const onContinue = jest.fn();
    render(<WarmupChecklist {...defaultProps} onContinue={onContinue} />);
    fireEvent.press(screen.getByText(/Continue to Exercises/));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders with empty protocols list', () => {
    render(<WarmupChecklist protocols={[]} onToggle={jest.fn()} onContinue={jest.fn()} />);
    expect(screen.getByText(/Continue to Exercises/)).toBeTruthy();
  });

  it('displays the workout timer when provided', () => {
    render(<WarmupChecklist {...defaultProps} timer="03:45" />);
    expect(screen.getByText('03:45')).toBeTruthy();
  });
});
