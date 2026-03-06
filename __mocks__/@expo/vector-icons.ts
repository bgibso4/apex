import React from 'react';
import { Text } from 'react-native';

const createMockIcon = (name: string) => {
  const Icon = ({ name: iconName, ...props }: any) =>
    React.createElement(Text, props, iconName || name);
  Icon.displayName = name;
  return Icon;
};

export const Ionicons = createMockIcon('Ionicons');
export const MaterialIcons = createMockIcon('MaterialIcons');
export const FontAwesome = createMockIcon('FontAwesome');
export const AntDesign = createMockIcon('AntDesign');
