// src/components/MaterialCard.js
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKR, groupByDay } from '../utils/helpers';
import { getStr } from '../i18n/strings';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.md * 4 - 90;

export default function MaterialCard({ material, total, expenses, language, onPress, onAddExpense }) {
  const s = (key) => getStr(language, key);

  // Mini bar chart — last 7 days
  const chartData = useMemo(() => {
    const grouped = groupByDay(expenses, 7);
    return grouped.map((d) => ({
      value: d.value,
      frontColor: material.color || colors.amber,
    }));
  }, [expenses, material.color]);

  const hasData = chartData.some((d) => d.value > 0);
  const displayName = language === 'ur' && material.nameUrdu ? material.nameUrdu : material.name;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: material.color || colors.amber }]} />

      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={[styles.iconWrapper, { backgroundColor: `${material.color}22` || colors.amberGlow }]}>
            <Ionicons
              name={material.icon || 'cube-outline'}
              size={22}
              color={material.color || colors.amber}
            />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.matName}>{displayName}</Text>
            {material.nameUrdu && language === 'en' && (
              <Text style={styles.matNameUrdu}>{material.nameUrdu}</Text>
            )}
            <Text style={styles.unit}>{material.unit}</Text>
          </View>
          <View style={styles.rightBlock}>
            <Text style={[styles.totalAmt, { color: material.color || colors.amber }]}>
              {formatPKR(total)}
            </Text>
            <TouchableOpacity
              style={[styles.addExpBtn, { backgroundColor: material.color || colors.amber }]}
              onPress={onAddExpense}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={18} color={colors.textOnAmber} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mini Chart */}
        {hasData ? (
          <View style={styles.chartWrapper}>
            <BarChart
              data={chartData}
              width={CHART_WIDTH}
              height={50}
              barWidth={Math.max(10, (CHART_WIDTH / 7) - 6)}
              spacing={4}
              barBorderRadius={3}
              hideRules
              hideAxesAndRules
              hideYAxisText
              isAnimated
              animationDuration={500}
            />
          </View>
        ) : (
          <View style={styles.noChartRow}>
            <Ionicons name="bar-chart-outline" size={14} color={colors.textMuted} />
            <Text style={styles.noChartText}>{s('noExpenses')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  iconWrapper: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  nameBlock: { flex: 1 },
  matName: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700' },
  matNameUrdu: { color: colors.textMuted, fontSize: font.xs, marginTop: 1 },
  unit: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
  rightBlock: { alignItems: 'flex-end', gap: 6 },
  totalAmt: { fontSize: font.lg, fontWeight: '800' },
  addExpBtn: { width: 28, height: 28, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  chartWrapper: { marginTop: 4, marginLeft: -4 },
  noChartRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  noChartText: { color: colors.textMuted, fontSize: font.xs },
});
