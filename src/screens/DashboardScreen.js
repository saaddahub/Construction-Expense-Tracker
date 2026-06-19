// src/screens/DashboardScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKRFull, formatPKR, groupByDay, formatDate } from '../utils/helpers';
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
    contractorPayments, getFilteredContractorPayments, getTotalPaidToContractor, deleteContractorPayment,
  } = useApp();
  const s = (key) => getStr(language, key);

  const [activeTab, setActiveTab] = useState('owner'); // 'owner' | 'contractor'

  // --- Owner Calculations ---
  const totalSpent = getTotalSpent(timeFilter);
  const budget = settings.budget || 0;
  const remainingBalance = budget - totalSpent; // Remaining Budget
  const budgetPct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  // --- Contractor Calculations ---
  const contractorPaymentsFiltered = getFilteredContractorPayments(timeFilter);
  const totalPaidToContractor = getTotalPaidToContractor(timeFilter);
  const contractAmount = settings.contractAmount || 0;
  const remainingContractAmount = contractAmount - totalPaidToContractor; // Remaining contract budget
  const contractPct = contractAmount > 0 ? Math.min((totalPaidToContractor / contractAmount) * 100, 100) : 0;

  // Bar chart data — last 7 days (based on active tab)
  const barData = useMemo(() => {
    if (activeTab === 'owner') {
      const grouped = groupByDay(expenses, 7);
      return grouped.map((d) => ({
        value: d.value,
        label: d.label,
        frontColor: colors.amber,
        gradientColor: colors.amberDark,
      }));
    } else {
      // Map contractor payments
      const grouped = groupByDay(contractorPayments, 7);
      return grouped.map((d) => ({
        value: d.value,
        label: d.label,
        frontColor: colors.info,
        gradientColor: '#4f46e5',
      }));
    }
  }, [expenses, contractorPayments, activeTab]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [expenses]);

  const recentPayments = useMemo(() => {
    return [...contractorPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [contractorPayments]);

  const handleDeletePayment = (pay) => {
    Alert.alert(
      s('delete'),
      language === 'ur'
        ? `${formatPKRFull(pay.amount)} کی ٹھیکیدار کی ادائیگی حذف کریں؟`
        : `Delete contractor payment of ${formatPKRFull(pay.amount)}?`,
      [
        { text: s('cancel'), style: 'cancel' },
        { text: s('delete'), style: 'destructive', onPress: () => deleteContractorPayment(pay.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <LinearGradient colors={['#1a1d27', colors.bg]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleBlock}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{s('appName')}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{settings.projectName || 'Construction Site'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: activeTab === 'owner' ? colors.amber : colors.info }]}
            onPress={() => {
              if (activeTab === 'owner') {
                navigation.navigate('AddExpense', {});
              } else {
                navigation.navigate('AddContractorPayment', {});
              }
            }}
          >
            <Ionicons name="add" size={28} color={activeTab === 'owner' ? colors.textOnAmber : '#fff'} />
          </TouchableOpacity>
        </View>

        {/* Sliding Tab Toggle (Owner vs. Contractor) */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'owner' && styles.toggleBtnActiveOwner]}
            onPress={() => setActiveTab('owner')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, activeTab === 'owner' && styles.toggleTextActive]}>
              🏗️ {s('owner')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'contractor' && styles.toggleBtnActiveContractor]}
            onPress={() => setActiveTab('contractor')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, activeTab === 'contractor' && styles.toggleTextActive]}>
              👷 {s('contractor')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Budget Display Card */}
        {activeTab === 'owner' ? (
          <LinearGradient
            colors={[colors.amberDark, colors.amber]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel} numberOfLines={1}>
              {budget > 0 ? s('remainingBalance') : s('totalSpent')}
            </Text>
            <Text style={styles.totalAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatPKRFull(budget > 0 ? remainingBalance : totalSpent)}
            </Text>

            {budget > 0 ? (
              <View style={styles.budgetRow}>
                <View style={styles.budgetBar}>
                  <View style={[styles.budgetFill, { width: `${budgetPct}%` }]} />
                </View>
                <Text style={styles.budgetPct} numberOfLines={1}>
                  {Math.round(budgetPct)}% {s('budgetUsed')}
                </Text>
              </View>
            ) : (
              <Text style={styles.noBudgetHint} numberOfLines={1}>{s('noBudgetSet')}</Text>
            )}

            {budget > 0 && (
              <View style={styles.subAmountsRow}>
                <View style={styles.subAmountBlock}>
                  <Text style={styles.subAmountLabel} numberOfLines={1}>{s('budget')}</Text>
                  <Text style={styles.subAmountValue} numberOfLines={1}>{formatPKR(budget)}</Text>
                </View>
                <View style={styles.subDivider} />
                <View style={styles.subAmountBlock}>
                  <Text style={styles.subAmountLabel} numberOfLines={1}>{s('totalSpent')}</Text>
                  <Text style={styles.subAmountValue} numberOfLines={1}>{formatPKR(totalSpent)}</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        ) : (
          /* Contractor Card */
          <LinearGradient
            colors={['#4f46e5', '#6366f1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel} numberOfLines={1}>
              {contractAmount > 0 ? s('remainingBalance') : s('totalPaid')}
            </Text>
            <Text style={styles.totalAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatPKRFull(contractAmount > 0 ? remainingContractAmount : totalPaidToContractor)}
            </Text>

            {contractAmount > 0 ? (
              <View style={styles.budgetRow}>
                <View style={styles.budgetBar}>
                  <View style={[styles.budgetFill, { width: `${contractPct}%`, backgroundColor: 'rgba(255,255,255,0.7)' }]} />
                </View>
                <Text style={styles.budgetPct} numberOfLines={1}>
                  {Math.round(contractPct)}% {s('budgetUsed')}
                </Text>
              </View>
            ) : (
              <Text style={styles.noBudgetHint} numberOfLines={1}>{s('noBudgetSet')}</Text>
            )}

            {contractAmount > 0 && (
              <View style={styles.subAmountsRow}>
                <View style={styles.subAmountBlock}>
                  <Text style={styles.subAmountLabel} numberOfLines={1}>{s('contractor')}</Text>
                  <Text style={styles.subAmountValue} numberOfLines={1}>{formatPKR(contractAmount)}</Text>
                </View>
                <View style={styles.subDivider} />
                <View style={styles.subAmountBlock}>
                  <Text style={styles.subAmountLabel} numberOfLines={1}>{s('totalPaid')}</Text>
                  <Text style={styles.subAmountValue} numberOfLines={1}>{formatPKR(totalPaidToContractor)}</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Time Filter Bar */}
        <TimeFilterBar value={timeFilter} onChange={setTimeFilter} language={language} />

        {/* Spending Trend Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📊 {activeTab === 'owner' ? s('spendingTrend') : `${s('contractor')} ${s('spendingTrend')}`}
          </Text>
          <View style={styles.chartCard}>
            {barData.some((d) => d.value > 0) ? (
              <BarChart
                data={barData}
                width={width - spacing.md * 4 - 20}
                height={150}
                barWidth={22}
                spacing={10}
                barBorderRadius={4}
                hideRules
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8 }}
                noOfSections={3}
                yAxisTextNumberOfLines={1}
                formatYLabel={(v) => formatPKR(v)}
                isAnimated
                animationDuration={500}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyChartText}>{s('noExpenses')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab Specific Content */}
        {activeTab === 'owner' ? (
          /* Owner View: Materials Categories list */
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

            {/* Recent Materials Expenses */}
            {recentExpenses.length > 0 && (
              <View style={[styles.section, { marginTop: spacing.md }]}>
                <Text style={styles.sectionTitle}>🕒 {s('recentExpenses')}</Text>
                <View style={styles.recentCard}>
                  {recentExpenses.map((exp, i) => {
                    const mat = materials.find((m) => m.id === exp.materialId);
                    return (
                      <View key={exp.id} style={[styles.recentRow, i < recentExpenses.length - 1 && styles.recentRowBorder]}>
                        <View style={[styles.recentDot, { backgroundColor: mat?.color || colors.amber }]} />
                        <View style={styles.recentInfo}>
                          <Text style={styles.recentMatName} numberOfLines={1}>{mat?.name || 'Unknown'}</Text>
                          <Text style={styles.recentDate} numberOfLines={1}>
                            {formatDate(exp.date)}
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
          </View>
        ) : (
          /* Contractor View: Contractor payments ledger */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👷 {s('contractor')}</Text>
            </View>

            {contractorPayments.length === 0 ? (
              <View style={styles.emptyMaterials}>
                <Ionicons name="people-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>{s('noPayments')}</Text>
                <Text style={styles.emptyHint}>{s('addPaymentHint')}</Text>
              </View>
            ) : (
              <View style={styles.recentCard}>
                {recentPayments.map((pay, i) => (
                  <View key={pay.id} style={[styles.recentRow, i < recentPayments.length - 1 && styles.recentRowBorder]}>
                    <View style={[styles.recentDot, { backgroundColor: colors.info }]} />
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentMatName} numberOfLines={1}>{pay.purpose}</Text>
                      <Text style={styles.recentDate} numberOfLines={1}>
                        {formatDate(pay.date)}
                        {pay.notes ? ` · ${pay.notes}` : ''}
                      </Text>
                    </View>
                    <View style={styles.contractorActions}>
                      <Text style={[styles.recentAmount, { color: colors.info }]}>{formatPKR(pay.amount)}</Text>
                      <View style={styles.actionIcons}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AddContractorPayment', { paymentId: pay.id })}
                          style={styles.smallIconBtn}
                        >
                          <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeletePayment(pay)}
                          style={styles.smallIconBtn}
                        >
                          <Ionicons name="trash-outline" size={14} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 50, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  titleBlock: { flex: 1, marginRight: spacing.sm },
  headerSubtitle: { color: colors.textMuted, fontSize: font.sm },
  headerTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800' },
  addBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: 3,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md - 2,
  },
  toggleBtnActiveOwner: {
    backgroundColor: colors.amber,
  },
  toggleBtnActiveContractor: {
    backgroundColor: colors.info,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.textOnAmber,
  },
  totalCard: {
    borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xs,
  },
  totalLabel: { color: 'rgba(0,0,0,0.55)', fontSize: font.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  totalAmount: { color: colors.textOnAmber, fontSize: font.xxxl, fontWeight: '800', marginBottom: spacing.xs },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.sm },
  budgetBar: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: radius.full, overflow: 'hidden' },
  budgetFill: { height: '100%', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.full },
  budgetPct: { color: 'rgba(0,0,0,0.6)', fontSize: font.xs, fontWeight: '700' },
  noBudgetHint: { color: 'rgba(0,0,0,0.5)', fontSize: font.xs, fontWeight: '600', marginTop: 4 },
  subAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  subAmountBlock: { flex: 1, alignItems: 'center' },
  subAmountLabel: { color: 'rgba(0,0,0,0.5)', fontSize: font.xs, fontWeight: '600' },
  subAmountValue: { color: colors.textOnAmber, fontSize: font.sm, fontWeight: '800', marginTop: 2 },
  subDivider: { width: 1, height: '70%', backgroundColor: 'rgba(0,0,0,0.15)' },
  scrollContent: { paddingHorizontal: spacing.md },
  section: { marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: font.md, fontWeight: '800', marginBottom: spacing.xs },
  viewAll: { color: colors.amber, fontSize: font.sm, fontWeight: '700' },
  chartCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, overflow: 'hidden',
  },
  emptyChart: { height: 130, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyChartText: { color: colors.textMuted, fontSize: font.sm },
  emptyMaterials: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.xxl, alignItems: 'center', gap: spacing.sm,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700' },
  emptyHint: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center' },
  recentCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.sm },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentDot: { width: 8, height: 8, borderRadius: radius.full },
  recentInfo: { flex: 1, marginRight: spacing.xs },
  recentMatName: { color: colors.textPrimary, fontSize: font.sm, fontWeight: '700' },
  recentDate: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
  recentAmount: { fontSize: font.sm, fontWeight: '800', color: colors.amber },
  contractorActions: { alignItems: 'flex-end', gap: 4 },
  actionIcons: { flexDirection: 'row', gap: 10 },
  smallIconBtn: { padding: 2 },
});
