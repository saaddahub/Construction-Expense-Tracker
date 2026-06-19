// src/screens/AddExpenseScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { getStr } from '../i18n/strings';
import { formatPKRFull, validateExpense } from '../utils/helpers';

export default function AddExpenseScreen({ navigation, route }) {
  const { language, materials, expenses, addExpense, updateExpense } = useApp();
  const s = (key) => getStr(language, key);

  const editId = route?.params?.expenseId;
  const preselectedMaterialId = route?.params?.materialId;
  const existingExp = editId ? expenses.find((e) => e.id === editId) : null;

  const [materialId, setMaterialId] = useState(existingExp?.materialId || preselectedMaterialId || '');
  const [quantity, setQuantity] = useState(existingExp ? String(existingExp.quantity) : '');
  const [pricePerUnit, setPricePerUnit] = useState(existingExp ? String(existingExp.pricePerUnit) : '');
  const [notes, setNotes] = useState(existingExp?.notes || '');
  const [date, setDate] = useState(existingExp?.date ? new Date(existingExp.date) : new Date());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === materialId),
    [materials, materialId]
  );

  const total = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(pricePerUnit) || 0;
    return q * p;
  }, [quantity, pricePerUnit]);

  const handleSave = async () => {
    const errs = validateExpense({ materialId, quantity, pricePerUnit }, language);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const expData = {
        materialId,
        quantity: parseFloat(quantity),
        unit: selectedMaterial?.unit || 'Pieces',
        pricePerUnit: parseFloat(pricePerUnit),
        date: date.toISOString(),
        notes: notes.trim(),
      };
      if (existingExp) {
        await updateExpense(editId, expData);
      } else {
        await addExpense(expData);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(s('error'), 'Failed to save expense');
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
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingExp ? s('editExpense') : s('addExpense')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{s('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Total Auto-Calculated Display */}
        {total > 0 && (
          <View style={styles.totalDisplay}>
            <Text style={styles.totalLabel}>{s('totalAmount')}</Text>
            <Text style={styles.totalAmt}>{formatPKRFull(total)}</Text>
            <Text style={styles.autoCalc}>{s('autoCalculated')}</Text>
          </View>
        )}

        {/* Material Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('selectMaterial')} *</Text>
          <TouchableOpacity
            style={[styles.pickerBtn, errors.materialId && styles.inputError]}
            onPress={() => setShowMaterialPicker(!showMaterialPicker)}
          >
            {selectedMaterial ? (
              <View style={styles.pickerValue}>
                <View style={[styles.matDot, { backgroundColor: selectedMaterial.color }]} />
                <Ionicons name={selectedMaterial.icon || 'cube-outline'} size={18} color={selectedMaterial.color} />
                <Text style={styles.pickerValueText}>
                  {language === 'ur' && selectedMaterial.nameUrdu ? selectedMaterial.nameUrdu : selectedMaterial.name}
                </Text>
                <Text style={styles.pickerUnit}>({selectedMaterial.unit})</Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>{s('selectMaterial')}</Text>
            )}
            <Ionicons name={showMaterialPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
          {errors.materialId && <Text style={styles.errorText}>{errors.materialId}</Text>}

          {/* Dropdown */}
          {showMaterialPicker && (
            <View style={styles.dropdown}>
              {materials.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.dropdownItem, materialId === m.id && styles.dropdownItemActive]}
                  onPress={() => {
                    setMaterialId(m.id);
                    setShowMaterialPicker(false);
                    setErrors((prev) => ({ ...prev, materialId: undefined }));
                  }}
                >
                  <View style={[styles.matDot, { backgroundColor: m.color }]} />
                  <Ionicons name={m.icon || 'cube-outline'} size={18} color={m.color} />
                  <Text style={[styles.dropdownLabel, materialId === m.id && { color: colors.amber }]}>
                    {language === 'ur' && m.nameUrdu ? m.nameUrdu : m.name}
                  </Text>
                  <Text style={styles.dropdownUnit}>({m.unit})</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>
              {s('quantity')} {selectedMaterial ? `(${selectedMaterial.unit})` : ''} *
            </Text>
            <TextInput
              style={[styles.input, errors.quantity && styles.inputError]}
              value={quantity}
              onChangeText={(v) => { setQuantity(v); setErrors((p) => ({ ...p, quantity: undefined })); }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
          </View>
          <Text style={styles.multiply}>×</Text>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>{s('pricePerUnit')} *</Text>
            <TextInput
              style={[styles.input, errors.pricePerUnit && styles.inputError]}
              value={pricePerUnit}
              onChangeText={(v) => { setPricePerUnit(v); setErrors((p) => ({ ...p, pricePerUnit: undefined })); }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            {errors.pricePerUnit && <Text style={styles.errorText}>{errors.pricePerUnit}</Text>}
          </View>
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
          {/* Quick date shortcuts */}
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
    backgroundColor: colors.amberGlow, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.amber,
  },
  totalLabel: { color: colors.textMuted, fontSize: font.sm },
  totalAmt: { color: colors.amber, fontSize: font.xxxl, fontWeight: '800', marginVertical: 4 },
  autoCalc: { color: colors.textMuted, fontSize: font.xs },
  section: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textPrimary, fontSize: font.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: font.xs, marginTop: 4 },
  pickerBtn: {
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerValue: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  matDot: { width: 8, height: 8, borderRadius: 4 },
  pickerValueText: { color: colors.textPrimary, fontSize: font.md, fontWeight: '600' },
  pickerUnit: { color: colors.textMuted, fontSize: font.sm },
  pickerPlaceholder: { color: colors.textMuted, fontSize: font.md },
  dropdown: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md, marginTop: 4,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  dropdownItemActive: { backgroundColor: colors.amberGlow },
  dropdownLabel: { color: colors.textPrimary, fontSize: font.sm, flex: 1 },
  dropdownUnit: { color: colors.textMuted, fontSize: font.xs },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  multiply: { color: colors.amber, fontSize: font.xxl, fontWeight: '700', marginTop: 36, paddingHorizontal: 4 },
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
