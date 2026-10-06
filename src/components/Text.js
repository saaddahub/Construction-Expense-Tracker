import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

// Native fonts support Urdu and English without loading extra font files.
export default function Text({ style, ...props }) {
  return <RNText style={[styles.base, style]} {...props} />;
}
const styles = StyleSheet.create({ base: { fontVariant: ['tabular-nums'] } });
