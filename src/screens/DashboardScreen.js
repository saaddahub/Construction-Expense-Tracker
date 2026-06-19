// src/screens/DashboardScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKRFull, formatPKR, groupByDay, groupByMonth, buildPieData } from '../utils/helpers';
import { getStr } from '../i18n/strings';
import { BarChart } from 'react-native-gifted-charts';
import MaterialCard from '../components/MaterialCard';
import TimeFilterBar from '../components/TimeFilterBar';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const {
    language, materials, expenses, settings,
    timeFilter, setTimeFilter,
    getTotalSpent, getFilteredExpenses, getTotalForMaterial,
  } = useApp();
  const s = (key) => getStr(language, key);

  const filteredExpenses = getFilteredExpenses(timeFilter);
  const totalSpent = getTotalSpent(timeFilter);
  const budget = settings.budget || 0;
  const budgetPct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remaining = budget > 0 ? budget - totalSpent : 0;

  // Bar chart data — last 7 days
  const barData = useMemo(() => {
    const grouped = groupByDay(expenses, 7);
    return grouped.map((d) => ({
      value: d.value,
      label: d.label,
      frontColor: colors.amber,
      gradientColor: colors.amberDark,
    }));
  }, [expenses]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [expenses]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <LinearGradient
        colors={['#1a1d27', colors.bg]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>{s('appName')}</Text>
            <Text style={styles.headerTitle}>{settings.projectName || 'Construction Site'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense', {})}
          >
            <Ionicons name="add" size={28} color={colors.textOnAmber} />
          </TouchableOpacity>
        </View>

        {/* Total Spent Card */}
        <LinearGradient
          colors={[colors.amberDark, colors.amber]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>{s('totalSpent')}</Text>
          <Text style={styles.totalAmount}>{formatPKRFull(totalSpent)}</Text>
          {budget > 0 && (
            <View style={styles.budgetRow}>
              <View style={styles.budgetBar}>
                <View style={[styles.budgetFill, { width: `${budgetPct}%` }]} />
              </View>
              <Text style={styles.budgetPct}>{Math.round(budgetPct)}% {s('budgetUsed')}</Text>
            </View>
          )}
          {budget > 0 && (
            <View style={styles.remainRow}>
              <Text style={styles.remainLabel}>{s('remaining')}</Text>
              <Text style={styles.remainAmt}>{formatPKRFull(remaining)}</Text>
            </View>
          )}
        </LinearGradient>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Filter */}
        <TimeFilterBar value={timeFilter} onChange={setTimeFilter} language={language} />

        {/* 7-Day Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 {s('spendingTrend')}</Text>
          <View style={styles.chartCard}>
            {barData.some((d) => d.value > 0) ? (
              <BarChart
                data={barData}
                width={width - spacing.md * 4 - 20}
                height={160}
                barWidth={28}
                spacing={12}
                barBorderRadius={4}
                hideRules
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                noOfSections={4}
                yAxisTextNumberOfLines={1}
                formatYLabel={(v) => formatPKR(v)}
                isAnimated
                animationDuration={600}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyChartText}>{s('noExpenses')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Material Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏗️ {s('myMaterials')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Materials')}>
              <Text style={styles.viewAll}>{s('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {materials.length === 0 ? (
            <View style={styles.emptyMaterials}>
              <Ionicons name="construct-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{s('noMaterials')}</Text>
              <Text style={styles.emptyHint}>{s('addFirstMaterial')}</Text>
            </View>
          ) : (
            materials.map((mat) => (
              <MaterialCard
                key={mat.id}
                material={mat}
                total={getTotalForMaterial(mat.id, timeFilter)}
                expenses={expenses.filter((e) => e.materialId === mat.id)}
                language={language}
                onPress={() => navigation.navigate('MaterialDetail', { materialId: mat.id })}
                onAddExpense={() => navigation.navigate('AddExpense', { materialId: mat.id })}
              />
            ))
          )}
        </View>

        {/* Recent Expenses */}
        {recentExpenses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕒 {s('recentExpenses')}</Text>
            <View style={styles.recentCard}>
              {recentExpenses.map((exp, i) => {
                const mat = materials.find((m) => m.id === exp.materialId);
                return (
                  <View key={exp.id} style={[styles.recentRow, i < recentExpenses.length - 1 && styles.recentRowBorder]}>
                    <View style={[styles.recentDot, { backgroundColor: mat?.color || colors.amber }]} />
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentMatName}>{mat?.name || 'Unknown'}</Text>
                      <Text style={styles.recentDate}>
                        {new Date(exp.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {exp.notes ? ` · ${exp.notes}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.recentAmount}>{formatPKR(exp.total)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 50, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerSubtitle: { color: colors.textMuted, fontSize: font.sm },
  headerTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700' },
  addBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.amber, justifyContent: 'center', alignItems: 'center',
  },
  totalCard: {
    borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.sm,
  },
  totalLabel: { color: 'rgba(0,0,0,0.6)', fontSize: font.sm, fontWeight: '600', marginBottom: 4 },
  totalAmount: { color: colors.textOnAmber, fontSize: font.xxxl, fontWeight: '800', marginBottom: spacing.sm },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  budgetBar: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radius.full, overflow: 'hidden' },
  budgetFill: { height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.full },
  budgetPct: { color: 'rgba(0,0,0,0.6)', fontSize: font.xs, fontWeight: '600' },
  remainRow: { flexDirection: 'row', justifyContent: 'space-between' },
  remainLabel: { color: 'rgba(0,0,0,0.6)', fontSize: font.sm },
  remainAmt: { color: colors.textOnAmber, fontSize: font.sm, fontWeight: '700' },
  scrollContent: { paddingHorizontal: spacing.md },
  section: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700', marginBottom: spacing.sm },
  viewAll: { color: colors.amber, fontSize: font.sm, fontWeight: '600' },
  chartCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, overflow: 'hidden',
  },
  emptyChart: { height: 140, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyChartText: { color: colors.textMuted, fontSize: font.sm },
  emptyMaterials: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.xxl, alignItems: 'center', gap: spacing.sm,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '600' },
  emptyHint: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center' },
  recentCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
  recentRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentDot: { width: 10, height: 10, borderRadius: radius.full },
  recentInfo: { flex: 1 },
  recentMatName: { color: colors.textPrimary, fontSize: font.sm, fontWeight: '600' },
  recentDate: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
  recentAmount: { color: colors.amber, fontSize: font.sm, fontWeight: '700' },
});
