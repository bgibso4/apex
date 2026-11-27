import { render } from '@testing-library/react-native';
import { FocusChips } from '../../src/components/FocusChips';

describe('FocusChips', () => {
  it('renders one uppercase chip per focus entry', () => {
    const { getByText } = render(<FocusChips focus={['hips', 'core', 'back']} />);
    expect(getByText('HIPS')).toBeTruthy();
    expect(getByText('CORE')).toBeTruthy();
    expect(getByText('BACK')).toBeTruthy();
  });

  it('renders nothing when focus is undefined', () => {
    const { toJSON } = render(<FocusChips />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when focus is empty', () => {
    const { toJSON } = render(<FocusChips focus={[]} />);
    expect(toJSON()).toBeNull();
  });
});
