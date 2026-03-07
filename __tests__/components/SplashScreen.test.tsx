import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { SplashScreen } from '../../src/components/SplashScreen';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders APEX wordmark', () => {
    render(<SplashScreen isReady={false} onFinished={jest.fn()} />);
    expect(screen.getByText('APEX')).toBeTruthy();
  });

  it('renders the creed quote', () => {
    render(<SplashScreen isReady={false} onFinished={jest.fn()} />);
    expect(screen.getByText(/mastery is a process/i)).toBeTruthy();
  });

  it('does not call onFinished before minimum duration even if ready', () => {
    const onFinished = jest.fn();
    render(<SplashScreen isReady={true} onFinished={onFinished} />);

    act(() => { jest.advanceTimersByTime(500); });
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('calls onFinished after minimum duration when ready', () => {
    const onFinished = jest.fn();
    render(<SplashScreen isReady={true} onFinished={onFinished} />);

    // 1500ms min duration + 400ms transition
    act(() => { jest.advanceTimersByTime(1900); });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('waits for isReady even after minimum duration', () => {
    const onFinished = jest.fn();
    const { rerender } = render(<SplashScreen isReady={false} onFinished={onFinished} />);

    act(() => { jest.advanceTimersByTime(2000); });
    expect(onFinished).not.toHaveBeenCalled();

    rerender(<SplashScreen isReady={true} onFinished={onFinished} />);
    // 400ms transition duration
    act(() => { jest.advanceTimersByTime(500); });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
