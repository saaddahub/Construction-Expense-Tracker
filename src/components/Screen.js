import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const TAB_EDGES = ['top', 'left', 'right'];
const ALL_EDGES = ['top', 'left', 'right', 'bottom'];

export default function Screen({ children, style, tab = false }) {
  return <SafeAreaView edges={tab ? TAB_EDGES : ALL_EDGES} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
