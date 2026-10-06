// src/screens/MaterialDetailScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import Screen from '../components/Screen';

import Ionicons from '@expo/vector-icons/Ionicons';
import SpendingChart from '../components/SpendingChart';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKR, formatPKRFull, formatDate, groupByDay, groupByMonth } from '../utils/helpers';
import { getStr } from '../i18n/strings';

export default function MaterialDetailScreen({ navigation, route }) {
  const { language, materials, expenses, deleteExpense } = useApp();
  const s = (key) => getStr(language, key);

  const materialId = route?.params?.materialId;
  const material = materials.find((m) => m.id === materialId);

  const [chartMode, setChartMode] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'

  const matExpenses = useMemo(
    () => expenses
      .filter((e) => e.materialId === materialId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [expenses, materialId]
  );

  const totalAllTime = useMemo(
    () => matExpenses.reduce((s, e) => s + e.total, 0),
    [matExpenses]
  );

  const chartData = useMemo(() => {
    const grouped = chartMode === 'monthly'
      ? groupByMonth(matExpenses, 6)
      : groupByDay(matExpenses, chartMode === 'daily' ? 7 : 14);
    return grouped.map((d) => ({
      value: d.value,
      label: d.label,
      frontColor: material?.color || colors.amber,
    }));
  }, [matExpenses, chartMode, material]);

  const handleDeleteExpense = (exp) => {
    Alert.alert(
      s('delete'),
      language === 'ur'
        ? `${formatPKRFull(exp.total)} کا خرچ حذف کریں؟`
        : `Delete expense of ${formatPKRFull(exp.total)}?`,
      [
        { text: s('cancel'), style: 'cancel' },
        { text: s('delete'), style: 'destructive', onPress: () => deleteExpense(exp.id) },
      ]
    );
  };

  if (!material) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>Material not found</Text>
      </View>
    );
  }

  const displayName = language === 'ur' && material.nameUrdu ? material.nameUrdu : material.name;

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: `${material.color}44` }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={s('close')} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: `${material.color}22` }]}>
            <Ionicons name={material.icon || 'cube-outline'} size={22} color={material.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{displayName}</Text>
            <Text style={styles.headerUnit}>{material.unit}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: material.color }]}
          onPress={() => navigation.navigate('AddExpense', { materialId })}
        >
          <Ionicons name="add" size={22} color={colors.textOnAmber} />
        </TouchableOpacity>
      </View>

      <FlatList data={matExpenses} keyExtractor={(item) => item.id}
        initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
        showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
        ListHeaderComponent={<>
        {/* Total Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalCardLabel}>{s('totalSpentOn')} {displayName}</Text>
          <Text style={styles.totalCardAmt} numberOfLines={1} adjustsFontSizeToFit>{formatPKRFull(totalAllTime)}</Text>
          <Text style={styles.totalEntries}>{matExpenses.length} {s('totalEntries')}</Text>
        </View>

        {/* Chart */}
        {matExpenses.length > 0 && (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>{s('spendingChart')}</Text>
              <View style={styles.chartToggle}>
                {['daily', 'weekly', 'monthly'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.toggleBtn, chartMode === mode && { backgroundColor: material.color }]}
                    onPress={() => setChartMode(mode)}
                  >
                    <Text style={[styles.toggleLabel, chartMode === mode && { color: colors.textOnAmber }]}>
                      {s(mode)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              {chartData.some((d) => d.value > 0) ? (
                <SpendingChart data={chartData} height={150} />
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyChartText}>{s('noExpenses')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{s('expenseHistory')}</Text>
        </>}
        ListEmptyComponent={
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyHistoryText}>{s('noExpensesForMaterial')}</Text>
              <TouchableOpacity
                style={[styles.addFirstBtn, { backgroundColor: material.color }]}
                onPress={() => navigation.navigate('AddExpense', { materialId })}
              >
                <Ionicons name="add" size={18} color={colors.textOnAmber} />
                <Text style={styles.addFirstBtnText}>{s('addNewExpense')}</Text>
              </TouchableOpacity>
            </View>
        }
        renderItem={({ item: exp, index: i }) => (
              <View style={[styles.expItem, i < matExpenses.length - 1 && styles.expItemBorder]}>
                <View style={styles.expLeft}>
                  <Text style={[styles.expTotal, { color: material.color }]}>{formatPKRFull(exp.total)}</Text>
                  <Text style={styles.expDetails}>
                    {exp.quantity} {exp.unit} × {formatPKR(exp.pricePerUnit)}/unit
                  </Text>
                  {exp.notes ? <Text style={styles.expNotes}>{exp.notes}</Text> : null}
                </View>
                <View style={styles.expRight}>
                  <Text style={styles.expDate}>{formatDate(exp.date)}</Text>
                  <View style={styles.expActions}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('AddExpense', { expenseId: exp.id })}
                      accessibilityRole="button" accessibilityLabel={s('editExpense')} style={styles.actionButton}
                    >
                      <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(exp)}
                      accessibilityRole="button" accessibilityLabel={s('delete')} style={styles.actionButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.bgCard, borderBottomWidth: 2,
  },
  headerCenter: { flex: 1, marginHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700' },
  headerUnit: { color: colors.textMuted, fontSize: font.xs },
  addBtn: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, paddingBottom: 32 },
  totalCard: {
    borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg,
    alignItems: 'flex-start', marginBottom: spacing.lg, backgroundColor: colors.bgCard, borderColor: colors.border,
  },
  totalCardLabel: { color: colors.textMuted, fontSize: font.sm, marginBottom: 4 },
  totalCardAmt: { color: colors.textPrimary, fontSize: font.xxxl, fontWeight: '600', marginBottom: 4 },
  totalEntries: { color: colors.textMuted, fontSize: font.xs },
  chartSection: { marginBottom: spacing.lg },
  chartHeader: { flexWrap: 'wrap', gap: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700' },
  chartToggle: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: radius.full, padding: 3, gap: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 12, minHeight: 44, borderRadius: radius.full },
  toggleLabel: { color: colors.textMuted, fontSize: font.xs, fontWeight: '600' },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, overflow: 'hidden' },
  emptyChart: { height: 140, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyChartText: { color: colors.textMuted, fontSize: font.sm },
  historySection: { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
  expItem: { padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  expLeft: { flex: 1 },
  expTotal: { fontSize: font.lg, fontWeight: '600', marginBottom: 2 },
  expDetails: { color: colors.textSecondary, fontSize: font.sm },
  expNotes: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
  expRight: { maxWidth: '44%', alignItems: 'flex-end', gap: 6 },
  expDate: { color: colors.textMuted, fontSize: font.xs },
  actionButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  expActions: { flexDirection: 'row', gap: spacing.sm },
  emptyHistory: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyHistoryText: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center' },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  addFirstBtnText: { color: colors.textOnAmber, fontSize: font.sm, fontWeight: '700' },
});
