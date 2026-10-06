import React, { memo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Text from './Text';
import { colors } from '../theme/colors';
import { formatPKR } from '../utils/helpers';

// Fixed native bars: no animation timers, gradients, or chart engine.
function SpendingChart({ data, color = colors.amber, height = 130, compact = false }) {
  const max = data.reduce((highest, item) => Math.max(highest, item.value || 0), 0) || 1;
  const chart = (
    <View style={[styles.columns, !compact && { minWidth: data.length * 38 }]}>
      {data.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.column} accessible={!compact}
          accessibilityLabel={`${item.label}: ${formatPKR(item.value)}`}>
          <View style={[styles.track, { height }]}>
            <View style={[styles.bar, {
              height: item.value > 0 ? Math.max(3, (item.value / max) * height) : 2,
              backgroundColor: item.value > 0 ? (item.frontColor || color) : colors.border,
            }]} />
          </View>
          {!compact && <Text numberOfLines={1} style={styles.label}>{item.label}</Text>}
        </View>
      ))}
    </View>
  );
  if (compact) return chart;
  return (
    <View>
      <Text style={styles.scale}>{formatPKR(max === 1 && !data.some((d) => d.value) ? 0 : max)}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroller}>{chart}</ScrollView>
    </View>
  );
}

export default memo(SpendingChart);
const styles = StyleSheet.create({
  scroller: { flexGrow: 1 },
  columns: { flex: 1, flexDirection: 'row', gap: 8 },
  column: { flex: 1, minWidth: 0, alignItems: 'center' },
  track: { width: '100%', justifyContent: 'flex-end', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  bar: { width: '65%', maxWidth: 28, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  label: { color: colors.textMuted, fontSize: 10, marginTop: 10 },
  scale: { color: colors.textMuted, fontSize: 11, marginBottom: 12 },
});
