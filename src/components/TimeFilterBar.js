// src/components/TimeFilterBar.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';

import { colors, spacing, radius, font } from '../theme/colors';
import { getStr } from '../i18n/strings';

const FILTERS = [
  { key: 'day', labelKey: 'thisDay' },
  { key: 'week', labelKey: 'thisWeek' },
  { key: 'month', labelKey: 'thisMonth' },
  { key: 'year', labelKey: 'thisYear' },
  { key: 'all', labelKey: 'allTime' },
];

export default function TimeFilterBar({ value, onChange, language = 'en' }) {
  const s = (key) => getStr(language, key);
  return (
    <View style={styles.container}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === f.key }}
          style={[styles.btn, value === f.key && styles.btnActive]}
          onPress={() => onChange(f.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.label, value === f.key && styles.labelActive]}
            numberOfLines={2}
          >
            {s(f.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: 3,
    marginVertical: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: colors.bgElevated,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
