import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Text from '../components/Text';
import Screen from '../components/Screen';
import SpendingChart from '../components/SpendingChart';
import MaterialCard from '../components/MaterialCard';
import TimeFilterBar from '../components/TimeFilterBar';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKRFull, formatPKR, groupByDay, formatDate, indexExpenses } from '../utils/helpers';
import { getStr } from '../i18n/strings';

const ACCOUNTS = ['owner', 'contractor', 'naveed', 'zakir'];
const ROUTES = { contractor: 'AddContractorPayment', naveed: 'AddNaveedPayment', zakir: 'AddZakirPayment' };
const EMPTY = [];

export default function DashboardScreen({ navigation }) {
  const app = useApp();
  const { language, materials, expenses, settings, timeFilter, setTimeFilter } = app;
  const s = (key) => getStr(language, key);
  const [activeTab, setActiveTab] = useState('owner');
  const owner = activeTab === 'owner';
  const accounts = {
    contractor: { payments: app.contractorPayments, filtered: app.getFilteredContractorPayments, budget: settings.contractAmount, remove: app.deleteContractorPayment },
    naveed: { payments: app.naveedPayments, filtered: app.getFilteredNaveedPayments, budget: settings.naveedContractAmount, remove: app.deleteNaveedPayment },
    zakir: { payments: app.zakirPayments, filtered: app.getFilteredZakirPayments, budget: settings.zakirContractAmount, remove: app.deleteZakirPayment },
  };
  const account = accounts[activeTab];
  const source = owner ? expenses : account.payments;
  const filterRecords = owner ? app.getFilteredExpenses : account.filtered;
  const filtered = useMemo(() => filterRecords(timeFilter), [filterRecords, timeFilter]);
  const total = useMemo(() => filtered.reduce((sum, item) => sum + (owner ? item.total : item.amount), 0), [filtered, owner]);
  const budget = (owner ? settings.budget : account.budget) || 0;
  const remaining = budget - total;
  const pct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const bars = useMemo(() => groupByDay(source, 7), [source]);
  const recent = useMemo(() => [...source].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), [source]);
  const materialIndex = useMemo(() => indexExpenses(expenses), [expenses]);
  const filteredIndex = useMemo(() => owner ? indexExpenses(filtered) : {}, [filtered, owner]);
  const materialMap = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const openMaterial = useCallback((id) => navigation.navigate('MaterialDetail', { materialId: id }), [navigation]);
  const addExpense = useCallback((id) => navigation.navigate('AddExpense', { materialId: id }), [navigation]);
  const addEntry = () => navigation.navigate(owner ? 'AddExpense' : ROUTES[activeTab], {});

  const deletePayment = (pay) => Alert.alert(s('delete'),
    language === 'ur'
      ? `${s(activeTab)}: ${formatPKRFull(pay.amount)} کی ادائیگی حذف کریں؟`
      : `Delete ${s(activeTab)} payment of ${formatPKRFull(pay.amount)}?`,
    [{ text: s('cancel'), style: 'cancel' },
      { text: s('delete'), style: 'destructive', onPress: () => account.remove(pay.id) }]);

  const renderPayment = ({ item: pay }) => (
    <View style={styles.paymentRow}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{pay.purpose}</Text>
        <Text style={styles.rowMeta}>{formatDate(pay.date)}</Text>
        {!!pay.notes && <Text style={styles.rowMeta} numberOfLines={2}>{pay.notes}</Text>}
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.rowAmount}>{formatPKR(pay.amount)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={s('editPayment')} style={styles.iconButton}
            onPress={() => navigation.navigate(ROUTES[activeTab], { paymentId: pay.id })}>
            <Ionicons name="pencil-outline" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={s('deletePayment')} style={styles.iconButton}
            onPress={() => deletePayment(pay)}>
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Screen tab>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandIcon}><Ionicons name="construct-outline" size={20} color={colors.amber} /></View>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>{s('appName')}</Text>
            <Text style={styles.title} numberOfLines={1}>{settings.projectName}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={owner ? s('addExpense') : s('addPayment')}
            style={styles.addButton} onPress={addEntry}>
            <Ionicons name="add" size={26} color={colors.textOnAmber} />
          </TouchableOpacity>
        </View>
        <View style={styles.accounts}>
          {ACCOUNTS.map((key) => (
            <TouchableOpacity key={key} accessibilityRole="tab" accessibilityState={{ selected: activeTab === key }}
              style={[styles.account, activeTab === key && styles.accountActive]} onPress={() => setActiveTab(key)}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}
                style={[styles.accountText, activeTab === key && styles.accountTextActive]}>{s(key)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeading}>
            <Text style={styles.balanceLabel}>{budget > 0 ? s('remainingBalance') : owner ? s('totalSpent') : s('totalPaid')}</Text>
            <View style={styles.currency}><Text style={styles.currencyText}>PKR</Text></View>
          </View>
          <Text style={[styles.balance, budget > 0 && remaining < 0 && { color: colors.danger }]}
            numberOfLines={1} adjustsFontSizeToFit>{formatPKRFull(budget > 0 ? remaining : total)}</Text>
          {budget > 0 ? (
            <>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: remaining < 0 ? colors.danger : colors.amber }]} /></View>
              <View style={styles.balanceDetails}>
                <View style={styles.balanceColumn}><Text style={styles.meta}>{owner ? s('budget') : s(activeTab)}</Text><Text style={styles.detailValue}>{formatPKR(budget)}</Text></View>
                <View style={styles.balanceColumn}><Text style={styles.meta}>{owner ? s('totalSpent') : s('totalPaid')}</Text><Text style={styles.detailValue}>{formatPKR(total)}</Text></View>
                <Text style={styles.used}>{Math.round(pct)}% {s('budgetUsed')}</Text>
              </View>
            </>
          ) : <Text style={styles.meta}>{s('noBudgetSet')}</Text>}
        </View>
      </View>
      <FlatList
        data={owner ? materials : recent}
        keyExtractor={(item) => item.id}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <TimeFilterBar value={timeFilter} onChange={setTimeFilter} language={language} />
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{s('spendingTrend')}</Text>
              <Text style={styles.meta}>{s('last7Days')}</Text>
            </View>
            <View style={styles.chartCard}>
              {bars.some((d) => d.value > 0) ? <SpendingChart data={bars} height={100} /> : (
                <View style={styles.emptyChart}>
                  <Ionicons name="bar-chart-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.meta}>{owner ? s('noExpenses') : s('noPayments')}</Text>
                </View>
              )}
            </View>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{owner ? s('myMaterials') : s('recentPayments')}</Text>
              {owner && <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Materials')} style={styles.textButton}><Text style={styles.link}>{s('viewAll')}</Text><Ionicons name="arrow-forward" size={14} color={colors.amber} /></TouchableOpacity>}
            </View>
          </>
        }
        renderItem={owner ? ({ item }) => (
          <MaterialCard material={item} total={filteredIndex[item.id]?.total || 0}
            expenses={materialIndex[item.id]?.expenses || EMPTY} language={language}
            onOpen={openMaterial} onAdd={addExpense} />
        ) : renderPayment}
        ListEmptyComponent={<View style={styles.empty}>
          <Ionicons name={owner ? 'cube-outline' : 'receipt-outline'} size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{owner ? s('noMaterials') : s('noPayments')}</Text>
          <Text style={styles.emptyHint}>{owner ? s('addFirstMaterial') : s('addPaymentHint')}</Text>
        </View>}
        ListFooterComponent={owner && recent.length > 0 ? (
          <View>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{s('recentExpenses')}</Text></View>
            {recent.map((exp) => {
              const mat = materialMap.get(exp.materialId);
              return <View key={exp.id} style={styles.recentRow}>
                <View style={[styles.dot, { backgroundColor: mat?.color || colors.amber }]} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{language === 'ur' && mat?.nameUrdu ? mat.nameUrdu : mat?.name || 'Unknown'}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>{formatDate(exp.date)}{exp.notes ? ` · ${exp.notes}` : ''}</Text>
                </View>
                <Text style={styles.rowAmount}>{formatPKR(exp.total)}</Text>
              </View>;
            })}
          </View>
        ) : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  brandIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  eyebrow: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  title: { color: colors.textPrimary, fontSize: 19, fontWeight: '600', letterSpacing: -0.3 },
  addButton: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  accounts: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  account: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 2 },
  accountActive: { borderBottomColor: colors.amber },
  accountText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  accountTextActive: { color: colors.amber, fontWeight: '700' },
  balanceCard: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  balanceHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { color: colors.textSecondary, fontSize: 13 },
  currency: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  currencyText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  balance: { fontSize: 36, color: colors.textPrimary, fontWeight: '600', letterSpacing: -1, marginTop: 8, marginBottom: 14 },
  progressTrack: { height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  progressFill: { height: '100%' },
  balanceDetails: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balanceColumn: { flex: 1 },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', marginTop: 5 },
  used: { fontSize: 11, color: colors.amber },
  meta: { fontSize: 12, color: colors.textMuted },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  textButton: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 44 },
  link: { fontSize: 12, color: colors.amber },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.borderLight },
  emptyChart: { height: 92, alignItems: 'center', justifyContent: 'center', gap: 10 },
  empty: { padding: 24, alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radius.md },
  emptyTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  paymentRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowInfo: { flex: 1 },
  rowTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  rowMeta: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  rowAmount: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  paymentRight: { alignItems: 'flex-end' },
  actions: { flexDirection: 'row' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
