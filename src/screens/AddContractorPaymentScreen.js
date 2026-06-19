// src/screens/AddContractorPaymentScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, StatusBar, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { getStr } from '../i18n/strings';
import { formatPKRFull } from '../utils/helpers';

export default function AddContractorPaymentScreen({ navigation, route }) {
  const { language, contractorPayments, addContractorPayment, updateContractorPayment } = useApp();
  const s = (key) => getStr(language, key);

  const editId = route?.params?.paymentId;
  const existingPay = editId ? contractorPayments.find((p) => p.id === editId) : null;

  const [amount, setAmount] = useState(existingPay ? String(existingPay.amount) : '');
  const [purpose, setPurpose] = useState(existingPay?.purpose || '');
  const [notes, setNotes] = useState(existingPay?.notes || '');
  const [date, setDate] = useState(existingPay?.date ? new Date(existingPay.date) : new Date());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const parsedAmount = useMemo(() => {
    return parseFloat(amount) || 0;
  }, [amount]);

  const handleSave = async () => {
    const errs = {};
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      errs.amount = s('invalidNumber');
    }
    if (!purpose.trim()) {
      errs.purpose = s('fieldRequired');
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payData = {
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        date: date.toISOString(),
        notes: notes.trim(),
      };

      if (existingPay) {
        await updateContractorPayment(editId, payData);
      } else {
        await addContractorPayment(payData);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(s('error'), 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const formatDateDisplay = (d) => d.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });

  const adjustDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    if (d <= new Date()) setDate(d);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingPay ? s('editPayment') : s('addPayment')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{s('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Total Amount display */}
        {parsedAmount > 0 && (
          <View style={styles.totalDisplay}>
            <Text style={styles.totalLabel}>{s('amount')}</Text>
            <Text style={styles.totalAmt}>{formatPKRFull(parsedAmount)}</Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('amount')} (₨) *</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₨</Text>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.amount && styles.inputError]}
              value={amount}
              onChangeText={(v) => { setAmount(v); setErrors((p) => ({ ...p, amount: undefined })); }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        {/* Purpose Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('purpose')} *</Text>
          <TextInput
            style={[styles.input, errors.purpose && styles.inputError]}
            value={purpose}
            onChangeText={(v) => { setPurpose(v); setErrors((p) => ({ ...p, purpose: undefined })); }}
            placeholder={s('enterPurpose')}
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
          {errors.purpose && <Text style={styles.errorText}>{errors.purpose}</Text>}
        </View>

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('date')}</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateArrow} onPress={() => adjustDate(-1)}>
              <Ionicons name="chevron-back" size={22} color={colors.amber} />
            </TouchableOpacity>
            <View style={styles.dateDisplay}>
              <Ionicons name="calendar-outline" size={18} color={colors.amber} />
              <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
            </View>
            <TouchableOpacity style={styles.dateArrow} onPress={() => adjustDate(1)}>
              <Ionicons name="chevron-forward" size={22} color={colors.amber} />
            </TouchableOpacity>
          </View>
          {/* Quick shortcuts */}
          <View style={styles.dateShortcuts}>
            {['Today', 'Yesterday', '2 days ago'].map((label, i) => {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const isActive = date.toDateString() === d.toDateString();
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.dateShortcut, isActive && { backgroundColor: colors.amber }]}
                  onPress={() => setDate(d)}
                >
                  <Text style={[styles.dateShortcutText, isActive && { color: colors.textOnAmber }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('notes')}</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={s('notesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
          />
        </View>

        <View style={{ height: 60 }} />
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
  headerTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700' },
  saveText: { color: colors.amber, fontSize: font.md, fontWeight: '700' },
  scroll: { padding: spacing.md },
  totalDisplay: {
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.amberGlow,
  },
  totalLabel: { color: colors.textMuted, fontSize: font.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmt: { color: colors.amber, fontSize: font.xxl, fontWeight: '800', marginTop: 4 },
  section: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600', marginBottom: spacing.sm },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  currencySymbol: { color: colors.amber, fontSize: font.lg, fontWeight: '700', paddingLeft: spacing.md },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textPrimary, fontSize: font.md,
    borderWidth: 1, borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: font.xs, marginTop: 4 },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.md, overflow: 'hidden',
  },
  dateArrow: { padding: spacing.md },
  dateDisplay: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
  },
  dateText: { color: colors.textPrimary, fontSize: font.md, fontWeight: '600' },
  dateShortcuts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  dateShortcut: {
    flex: 1, padding: 8, borderRadius: radius.md,
    backgroundColor: colors.bgCard, alignItems: 'center',
  },
  dateShortcutText: { color: colors.textSecondary, fontSize: font.xs, fontWeight: '600' },
});
