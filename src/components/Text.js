import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

export default function Text({ style, ...props }) {
  const flattenedStyle = StyleSheet.flatten(style) || {};
  let fontFamily = 'Inter_400Regular';
  const fontWeight = flattenedStyle.fontWeight || 'normal';

  if (fontWeight === 'bold' || fontWeight === '700') {
    fontFamily = 'Inter_700Bold';
  } else if (fontWeight === '600') {
    fontFamily = 'Inter_600SemiBold';
  } else if (fontWeight === '800' || fontWeight === '900') {
    fontFamily = 'Inter_800ExtraBold';
  }

  // We can pass fontWeight to RNText usually, but for custom fonts it is better to just rely on fontFamily
  return <RNText style={[flattenedStyle, { fontFamily }]} {...props} />;
}
