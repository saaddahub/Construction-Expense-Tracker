import React, { memo, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Text from './Text';
import SpendingChart from './SpendingChart';
import { colors, radius } from '../theme/colors';
import { formatPKR, groupByDay } from '../utils/helpers';
import { getStr } from '../i18n/strings';

function MaterialCard({ material, total, expenses, language, onOpen, onAdd }) {
  const chartData = useMemo(() => groupByDay(expenses, 7), [expenses]);
  const hasData = chartData.some((d) => d.value > 0);
  const name = language === 'ur' && material.nameUrdu ? material.nameUrdu : material.name;
  return (
    <View style={styles.card}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={name} style={styles.main}
        onPress={() => onOpen(material.id)} activeOpacity={0.7}>
        <View style={styles.icon}><Ionicons name={material.icon || 'cube-outline'} size={21} color={material.color || colors.amber} /></View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{language === 'en' && material.nameUrdu ? `${material.nameUrdu} · ` : ''}{material.unit}</Text>
          {!hasData && <Text style={styles.empty}>{getStr(language, 'noExpenses')}</Text>}
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>{formatPKR(total)}</Text>
          {hasData && <View style={styles.spark}><SpendingChart data={chartData} color={colors.textMuted} height={22} compact /></View>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${getStr(language, 'addExpense')}: ${name}`}
        style={styles.add} onPress={() => onAdd(material.id)}>
        <Ionicons name="add" size={20} color={colors.amber} />
      </TouchableOpacity>
    </View>
  );
}
export default memo(MaterialCard);
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, marginBottom: 8, paddingRight: 4, borderWidth: 1, borderColor: colors.borderLight },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingLeft: 12 },
  icon: { width: 30, alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  empty: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  right: { alignItems: 'flex-end', paddingLeft: 4, maxWidth: '40%' },
  total: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  spark: { width: 68, marginTop: 8 },
  add: { width: 44, height: 48, justifyContent: 'center', alignItems: 'center' },
});
