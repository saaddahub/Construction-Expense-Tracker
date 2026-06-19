// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { getStr } from '../i18n/strings';

const VERSION = '1.0.0';

export default function SettingsScreen() {
  const { language, settings, toggleLanguage, updateSettings, clearAllData } = useApp();
  const s = (key) => getStr(language, key);

  const [budget, setBudget] = useState(settings.budget > 0 ? String(settings.budget) : '');
  const [contractAmount, setContractAmount] = useState(settings.contractAmount > 0 ? String(settings.contractAmount) : '');
  const [projectName, setProjectName] = useState(settings.projectName || '');

  const handleSaveBudget = async () => {
    const val = parseFloat(budget) || 0;
    await updateSettings({ budget: val });
    Alert.alert(s('success'), language === 'ur' ? 'بجٹ محفوظ ہو گیا' : 'Budget saved!');
  };

  const handleSaveContractAmount = async () => {
    const val = parseFloat(contractAmount) || 0;
    await updateSettings({ contractAmount: val });
    Alert.alert(s('success'), language === 'ur' ? 'ٹھیکیدار کا بجٹ محفوظ ہو گیا' : 'Contract amount saved!');
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) return;
    await updateSettings({ projectName: projectName.trim() });
    Alert.alert(s('success'), language === 'ur' ? 'نام محفوظ ہو گیا' : 'Project name saved!');
  };

  const handleClearAll = () => {
    Alert.alert(
      s('clearAllData'),
      s('clearConfirm'),
      [
        { text: s('cancel'), style: 'cancel' },
        {
          text: s('clearConfirmBtn'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setBudget('');
            setContractAmount('');
            setProjectName('');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{s('settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Language Toggle */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{s('general')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="language-outline" size={22} color={colors.amber} />
                <View>
                  <Text style={styles.rowTitle}>{s('language')}</Text>
                  <Text style={styles.rowSub}>{language === 'en' ? 'English' : 'اردو'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                <Text style={styles.langEn} numberOfLines={1}>EN</Text>
                <View style={[styles.langDivider, { backgroundColor: language === 'en' ? colors.amber : colors.info }]} />
                <Text style={styles.langUr} numberOfLines={1}>اردو</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Project Name */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{s('projectName')}</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder={s('enterProjectName')}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProject}>
              <Text style={styles.saveBtnText}>{s('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{s('setBudget')}</Text>
          <View style={styles.card}>
            <Text style={styles.inputHint}>
              {language === 'ur'
                ? 'کل بجٹ درج کریں (PKR میں)'
                : 'Enter your total budget for this project (PKR)'}
            </Text>
            <View style={styles.budgetRow}>
              <Text style={styles.currencySymbol}>₨</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={budget}
                onChangeText={setBudget}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget}>
              <Ionicons name="checkmark" size={18} color={colors.textOnAmber} />
              <Text style={styles.saveBtnText}>{s('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contractor Budget */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{s('contractAmount')}</Text>
          <View style={styles.card}>
            <Text style={styles.inputHint}>
              {language === 'ur'
                ? 'ٹھیکیدار کا کل کنٹریکٹ بجٹ درج کریں'
                : 'Enter total contract amount agreed with the Contractor'}
            </Text>
            <View style={styles.budgetRow}>
              <Text style={styles.currencySymbol}>₨</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={contractAmount}
                onChangeText={setContractAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContractAmount}>
              <Ionicons name="checkmark" size={18} color={colors.textOnAmber} />
              <Text style={styles.saveBtnText}>{s('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{s('aboutApp')}</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <View style={styles.aboutIcon}>
                <Ionicons name="construct" size={32} color={colors.amber} />
              </View>
              <View>
                <Text style={styles.aboutTitle}>تعمیر ٹریکر</Text>
                <Text style={styles.aboutSub}>Construction Tracker</Text>
                <Text style={styles.aboutVersion}>{s('version')} {VERSION}</Text>
              </View>
            </View>
            <Text style={styles.aboutDesc}>
              {language === 'ur'
                ? 'تعمیراتی سائٹ کے اخراجات ٹریک کرنے کی آسان ایپ'
                : 'Simple app to track your construction site expenses with detailed charts and reports.'}
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.danger }]}>{s('dangerZone')}</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={styles.dangerBtnText}>{s('clearAllData')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 54, paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.bgCard,
  },
  headerTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800' },
  scroll: { padding: spacing.md },
  group: { marginBottom: spacing.lg },
  groupLabel: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { color: colors.textPrimary, fontSize: font.md, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: font.xs },
  langToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: radius.full,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  langEn: { color: colors.textPrimary, fontSize: font.sm, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 8 },
  langDivider: { width: 2, height: '100%' },
  langUr: { color: colors.textPrimary, fontSize: font.sm, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 8 },
  inputHint: { color: colors.textMuted, fontSize: font.xs },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currencySymbol: { color: colors.amber, fontSize: font.xl, fontWeight: '800' },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    color: colors.textPrimary, fontSize: font.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.amber, borderRadius: radius.md,
    paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  saveBtnText: { color: colors.textOnAmber, fontSize: font.md, fontWeight: '700' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aboutIcon: {
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.amberGlow, justifyContent: 'center', alignItems: 'center',
  },
  aboutTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '800' },
  aboutSub: { color: colors.textMuted, fontSize: font.sm },
  aboutVersion: { color: colors.textMuted, fontSize: font.xs },
  aboutDesc: { color: colors.textSecondary, fontSize: font.sm, lineHeight: 20 },
  dangerBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: radius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.danger,
  },
  dangerBtnText: { color: colors.danger, fontSize: font.md, fontWeight: '700' },
});
