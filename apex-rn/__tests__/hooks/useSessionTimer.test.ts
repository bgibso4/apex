import { renderHook, act } from '@testing-library/react-native';
import { useSessionTimer } from '../../src/hooks/useSessionTimer';

describe('useSessionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at 0:00 when no startTime provided', () => {
    const { result } = renderHook(() => useSessionTimer(null));
    expect(result.current.display).toBe('0:00');
    expect(result.current.seconds).toBe(0);
  });

  it('shows elapsed time from startTime', () => {
    const startTime = new Date(Date.now() - 90000).toISOString(); // 90 seconds ago
    const { result } = renderHook(() => useSessionTimer(startTime));
    // Should be approximately 1:30
    expect(result.current.display).toBe('1:30');
    expect(result.current.seconds).toBe(90);
  });

  it('updates every second', () => {
    const startTime = new Date().toISOString();
    const { result } = renderHook(() => useSessionTimer(startTime));
    expect(result.current.display).toBe('0:00');

    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.seconds).toBe(1);
    expect(result.current.display).toBe('0:01');
  });

  it('formats hours when >= 60 minutes', () => {
    const startTime = new Date(Date.now() - 3661000).toISOString(); // 1h 1m 1s ago
    const { result } = renderHook(() => useSessionTimer(startTime));
    expect(result.current.display).toBe('1:01:01');
  });

  it('returns 0 when not running', () => {
    const { result } = renderHook(() => useSessionTimer(null));
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.seconds).toBe(0);
  });
});
