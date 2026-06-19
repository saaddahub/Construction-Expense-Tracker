// src/screens/ReportsScreen.js
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKR, formatPKRFull, buildPieData, groupByMonth, buildCSV } from '../utils/helpers';
import { getStr } from '../i18n/strings';
import TimeFilterBar from '../components/TimeFilterBar';

const { width } = Dimensions.get('window');
const CHART_W = width - spacing.md * 2 - 32;

export default function ReportsScreen() {
  const { language, materials, expenses, settings, timeFilter, setTimeFilter, getFilteredExpenses, getTotalSpent } = useApp();
  const s = (key) => getStr(language, key);

  const filteredExpenses = getFilteredExpenses(timeFilter);
  const totalSpent = getTotalSpent(timeFilter);

  // Pie data
  const pieData = useMemo(() => buildPieData(materials, filteredExpenses, colors.chartColors), [materials, filteredExpenses]);

  // Monthly bar data (always last 6 months for trends)
  const monthlyData = useMemo(() => {
    const grouped = groupByMonth(expenses, 6);
    return grouped.map((d) => ({
      value: d.value,
      label: d.label,
      frontColor: colors.amber,
      gradientColor: colors.amberDark,
    }));
  }, [expenses]);

  // Stats
  const avgPerDay = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    const dates = filteredExpenses.map((e) => new Date(e.date).toDateString());
    const uniqueDays = new Set(dates).size || 1;
    return totalSpent / uniqueDays;
  }, [filteredExpenses, totalSpent]);

  const highestSingle = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return Math.max(...filteredExpenses.map((e) => e.total));
  }, [filteredExpenses]);

  const handleExport = async () => {
    try {
      const csv = buildCSV(expenses, materials);
      await Share.share({
        title: 'Construction Expenses',
        message: csv,
      });
    } catch (e) {
      Alert.alert(s('error'), 'Could not share report');
    }
  };

  const [focusedSlice, setFocusedSlice] = useState(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{s('reports')}</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="share-outline" size={20} color={colors.textOnAmber} />
          <Text style={styles.exportBtnText}>{s('exportCSV')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TimeFilterBar value={timeFilter} onChange={setTimeFilter} language={language} />

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s('totalSpent')}</Text>
            <Text style={[styles.statValue, { color: colors.amber }]}>{formatPKR(totalSpent)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s('totalEntries2')}</Text>
            <Text style={[styles.statValue, { color: colors.info }]}>{filteredExpenses.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s('avgPerDay')}</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{formatPKR(avgPerDay)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{s('highestDay')}</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>{formatPKR(highestSingle)}</Text>
          </View>
        </View>

        {/* Budget Tracker */}
        {settings.budget > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.sectionTitle}>{s('budget')}</Text>
              <Text style={styles.budgetTotal}>{formatPKRFull(settings.budget)}</Text>
            </View>
            <View style={styles.budgetBarOuter}>
              <View
                style={[
                  styles.budgetBarInner,
                  {
                    width: `${Math.min((totalSpent / settings.budget) * 100, 100)}%`,
                    backgroundColor: totalSpent > settings.budget ? colors.danger : colors.amber,
                  }
                ]}
              />
            </View>
            <View style={styles.budgetLabels}>
              <Text style={styles.budgetSpent}>{formatPKRFull(totalSpent)} {s('budgetUsed')}</Text>
              <Text style={styles.budgetRemain}>
                {settings.budget - totalSpent > 0
                  ? `${formatPKRFull(settings.budget - totalSpent)} ${s('remaining')}`
                  : language === 'ur' ? 'بجٹ ختم' : 'Over budget!'}
              </Text>
            </View>
          </View>
        )}

        {/* Pie Chart — Category Breakdown */}
        {pieData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{s('categoryBreakdown')}</Text>
            <View style={styles.pieCard}>
              <PieChart
                data={pieData}
                donut
                innerRadius={60}
                radius={90}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, fontSize: font.xs }}>{s('totalSpent')}</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: font.md, fontWeight: '800' }}>
                      {formatPKR(totalSpent)}
                    </Text>
                  </View>
                )}
                isAnimated
                animationDuration={700}
                onPress={(slice) => setFocusedSlice(slice)}
              />
              {/* Legend */}
              <View style={styles.legend}>
                {pieData.map((d, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{d.name}</Text>
                    <Text style={[styles.legendValue, { color: d.color }]}>{formatPKR(d.value)}</Text>
                    <Text style={styles.legendPct}>
                      {totalSpent > 0 ? `${Math.round((d.value / totalSpent) * 100)}%` : '0%'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Monthly Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{s('spendingTrend')} (6 months)</Text>
          <View style={styles.chartCard}>
            {monthlyData.some((d) => d.value > 0) ? (
              <BarChart
                data={monthlyData}
                width={CHART_W}
                height={200}
                barWidth={36}
                spacing={18}
                barBorderRadius={6}
                hideRules
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}
                noOfSections={4}
                formatYLabel={(v) => formatPKR(v)}
                isAnimated
                animationDuration={700}
                showGradient
                gradientColor={colors.amberDark}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyChartText}>{s('noExpenses')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top Categories */}
        {pieData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{s('topCategories')}</Text>
            <View style={styles.topCatCard}>
              {pieData.slice(0, 5).map((d, i) => (
                <View key={i} style={[styles.topCatRow, i < Math.min(pieData.length - 1, 4) && styles.topCatBorder]}>
                  <Text style={styles.topCatRank}>#{i + 1}</Text>
                  <View style={[styles.topCatDot, { backgroundColor: d.color }]} />
                  <Text style={styles.topCatName} numberOfLines={1}>{d.name}</Text>
                  <View style={styles.topCatBarWrap}>
                    <View style={[styles.topCatBar, { width: `${(d.value / pieData[0].value) * 100}%`, backgroundColor: d.color }]} />
                  </View>
                  <Text style={[styles.topCatValue, { color: d.color }]}>{formatPKR(d.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {filteredExpenses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={72} color={colors.textMuted} />
            <Text style={styles.emptyStateTitle}>{s('noExpenses')}</Text>
            <Text style={styles.emptyStateHint}>
              {language === 'ur' ? 'اخراجات شامل کریں تاکہ رپورٹ نظر آئے' : 'Add expenses to see reports here'}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 54, paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.bgCard,
  },
  headerTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.amber, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  exportBtnText: { color: colors.textOnAmber, fontSize: font.sm, fontWeight: '700' },
  scroll: { padding: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.bgCard,
    borderRadius: radius.lg, padding: spacing.md, alignItems: 'center',
  },
  statLabel: { color: colors.textMuted, fontSize: font.xs, marginBottom: 4 },
  statValue: { fontSize: font.xl, fontWeight: '800' },
  budgetCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  budgetTotal: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  budgetBarOuter: { height: 10, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.xs },
  budgetBarInner: { height: '100%', borderRadius: radius.full },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetSpent: { color: colors.textSecondary, fontSize: font.xs },
  budgetRemain: { color: colors.textMuted, fontSize: font.xs },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700', marginBottom: spacing.sm },
  pieCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  legend: { width: '100%', marginTop: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, color: colors.textSecondary, fontSize: font.sm },
  legendValue: { fontSize: font.sm, fontWeight: '700' },
  legendPct: { color: colors.textMuted, fontSize: font.xs, width: 36, textAlign: 'right' },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, overflow: 'hidden' },
  emptyChart: { height: 160, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyChartText: { color: colors.textMuted, fontSize: font.sm },
  topCatCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
  topCatRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  topCatBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  topCatRank: { color: colors.textMuted, fontSize: font.sm, width: 24 },
  topCatDot: { width: 8, height: 8, borderRadius: 4 },
  topCatName: { color: colors.textSecondary, fontSize: font.sm, width: 80 },
  topCatBarWrap: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  topCatBar: { height: '100%', borderRadius: radius.full },
  topCatValue: { fontSize: font.sm, fontWeight: '700', width: 64, textAlign: 'right' },
  emptyState: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyStateTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700' },
  emptyStateHint: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center' },
});
