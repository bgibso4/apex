import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SupersetGroup } from '../../src/components/SupersetGroup';

describe('SupersetGroup', () => {
  it('renders "Superset" badge for 2 exercises', () => {
    render(<SupersetGroup groupSize={2}><Text>child</Text></SupersetGroup>);
    expect(screen.getByText('Superset')).toBeTruthy();
  });

  it('renders "Tri-set" badge for 3 exercises', () => {
    render(<SupersetGroup groupSize={3}><Text>child</Text></SupersetGroup>);
    expect(screen.getByText('Tri-set')).toBeTruthy();
  });

  it('renders "Giant set" badge for 4+ exercises', () => {
    render(<SupersetGroup groupSize={4}><Text>child</Text></SupersetGroup>);
    expect(screen.getByText('Giant set')).toBeTruthy();
  });

  it('renders children', () => {
    render(<SupersetGroup groupSize={2}><Text testID="child">Hello</Text></SupersetGroup>);
    expect(screen.getByTestId('child')).toBeTruthy();
  });
});
