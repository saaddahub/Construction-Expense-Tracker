// src/screens/AddMaterialScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, StatusBar, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { getStr } from '../i18n/strings';
import { MATERIAL_ICONS, UNITS, PRESET_COLORS } from '../utils/helpers';

export default function AddMaterialScreen({ navigation, route }) {
  const { language, materials, addMaterial, updateMaterial } = useApp();
  const s = (key) => getStr(language, key);

  const editId = route?.params?.materialId;
  const existing = editId ? materials.find((m) => m.id === editId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [nameUrdu, setNameUrdu] = useState(existing?.nameUrdu || '');
  const [unit, setUnit] = useState(existing?.unit || 'Bags');
  const [icon, setIcon] = useState(existing?.icon || 'cube-outline');
  const [color, setColor] = useState(existing?.color || PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert(s('error'), s('nameTooShort'));
      return;
    }
    setSaving(true);
    try {
      const data = { name: name.trim(), nameUrdu: nameUrdu.trim(), unit, icon, color };
      if (existing) {
        await updateMaterial(editId, data);
      } else {
        await addMaterial(data);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(s('error'), 'Failed to save material');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existing ? s('editMaterial') : s('addMaterial')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{s('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: `${color}22` }]}>
            <Ionicons name={icon} size={40} color={color} />
          </View>
          <Text style={[styles.previewName, { color }]}>{name || 'Material Name'}</Text>
          {nameUrdu ? <Text style={styles.previewNameUrdu}>{nameUrdu}</Text> : null}
        </View>

        {/* Name Fields */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('materialName')} *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cement"
            placeholderTextColor={colors.textMuted}
            maxLength={40}
          />
          <Text style={[styles.label, { marginTop: spacing.md }]}>{s('materialNameUrdu')}</Text>
          <TextInput
            style={[styles.input, { textAlign: 'right', fontFamily: 'System' }]}
            value={nameUrdu}
            onChangeText={setNameUrdu}
            placeholder="جیسے سیمنٹ"
            placeholderTextColor={colors.textMuted}
            maxLength={40}
          />
        </View>

        {/* Unit Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('unit')}</Text>
          <View style={styles.unitGrid}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && { backgroundColor: color, borderColor: color }]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitLabel, unit === u && { color: colors.textOnAmber, fontWeight: '700' }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('selectColor')}</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                onPress={() => setColor(c)}
              >
                {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{s('selectIcon')}</Text>
          <View style={styles.iconGrid}>
            {MATERIAL_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconChip, icon === ic && { backgroundColor: color, borderColor: color }]}
                onPress={() => setIcon(ic)}
              >
                <Ionicons name={ic} size={22} color={icon === ic ? colors.textOnAmber : colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
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
  preview: { alignItems: 'center', paddingVertical: spacing.xl },
  previewIcon: { width: 80, height: 80, borderRadius: radius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  previewName: { fontSize: font.xl, fontWeight: '800' },
  previewNameUrdu: { color: colors.textMuted, fontSize: font.md, marginTop: 4 },
  section: { marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 14, color: colors.textPrimary, fontSize: font.md,
    borderWidth: 1, borderColor: colors.border,
  },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  unitChip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  unitLabel: { color: colors.textSecondary, fontSize: font.sm },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  colorDot: {
    width: 40, height: 40, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconChip: {
    width: 48, height: 48, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
});
