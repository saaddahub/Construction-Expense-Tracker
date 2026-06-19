// src/components/TimeFilterBar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
          style={[styles.btn, value === f.key && styles.btnActive]}
          onPress={() => onChange(f.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.label, value === f.key && styles.labelActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
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
    borderRadius: radius.full,
    padding: 3,
    marginVertical: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: colors.amber,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelActive: {
    color: colors.textOnAmber,
  },
});
