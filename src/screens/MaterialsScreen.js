// src/screens/MaterialsScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme/colors';
import { formatPKR } from '../utils/helpers';
import { getStr } from '../i18n/strings';

export default function MaterialsScreen({ navigation }) {
  const { language, materials, expenses, deleteMaterial, getTotalForMaterial } = useApp();
  const s = (key) => getStr(language, key);

  const handleDelete = (mat) => {
    const expCount = expenses.filter((e) => e.materialId === mat.id).length;
    Alert.alert(
      s('deleteMaterial'),
      language === 'ur'
        ? `"${mat.name}" اور اس کے ${expCount} اخراجات حذف ہو جائیں گے۔`
        : `Delete "${mat.name}" and its ${expCount} expense(s)?`,
      [
        { text: s('cancel'), style: 'cancel' },
        {
          text: s('delete'),
          style: 'destructive',
          onPress: () => deleteMaterial(mat.id),
        },
      ]
    );
  };

  const renderItem = ({ item: mat }) => {
    const total = getTotalForMaterial(mat.id, 'all');
    const expCount = expenses.filter((e) => e.materialId === mat.id).length;
    const displayName = language === 'ur' && mat.nameUrdu ? mat.nameUrdu : mat.name;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('MaterialDetail', { materialId: mat.id })}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${mat.color}22` }]}>
          <Ionicons name={mat.icon || 'cube-outline'} size={24} color={mat.color || colors.amber} />
        </View>
        <View style={styles.info}>
          <Text style={styles.matName}>{displayName}</Text>
          {mat.nameUrdu && language === 'en' && (
            <Text style={styles.matNameUrdu}>{mat.nameUrdu}</Text>
          )}
          <Text style={styles.entryCount}>{expCount} {s('totalEntries')} · {mat.unit}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.total, { color: mat.color || colors.amber }]}>{formatPKR(total)}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddMaterial', { materialId: mat.id })}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(mat)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{s('myMaterials')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMaterial', {})}
        >
          <Ionicons name="add" size={24} color={colors.textOnAmber} />
        </TouchableOpacity>
      </View>

      {materials.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={72} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{s('noMaterialsYet')}</Text>
          <Text style={styles.emptyHint}>{s('addMaterialHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgCard,
  },
  headerTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800' },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.amber, justifyContent: 'center', alignItems: 'center',
  },
  list: { padding: spacing.md, paddingBottom: 100 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  separator: { height: spacing.sm },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  matName: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700' },
  matNameUrdu: { color: colors.textMuted, fontSize: font.xs, marginTop: 1 },
  entryCount: { color: colors.textMuted, fontSize: font.xs, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 4 },
  total: { fontSize: font.md, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { padding: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700' },
  emptyHint: { color: colors.textMuted, fontSize: font.sm, textAlign: 'center', paddingHorizontal: spacing.xl },
});
