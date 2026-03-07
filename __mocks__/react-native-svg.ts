/** Mock for react-native-svg — renders SVG elements as plain Views for testing */
import React from 'react';
import { View } from 'react-native';

const createMockComponent = (name: string) => {
  const Component = (props: any) =>
    React.createElement(View, { ...props, testID: props.testID || name }, props.children);
  Component.displayName = name;
  return Component;
};

const Svg = (props: any) =>
  React.createElement(View, { ...props, testID: props.testID || 'svg' }, props.children);
Svg.displayName = 'Svg';

export default Svg;
export const Circle = createMockComponent('Circle');
export const Rect = createMockComponent('Rect');
export const Path = createMockComponent('Path');
export const Line = createMockComponent('Line');
export const Polyline = createMockComponent('Polyline');
export const Polygon = createMockComponent('Polygon');
export const G = createMockComponent('G');
export const Defs = createMockComponent('Defs');
export const LinearGradient = createMockComponent('LinearGradient');
export const RadialGradient = createMockComponent('RadialGradient');
export const Stop = createMockComponent('Stop');
export const ClipPath = createMockComponent('ClipPath');
export const Use = createMockComponent('Use');
