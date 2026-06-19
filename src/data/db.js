// src/data/db.js
// All data persistence via AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MATERIALS: '@construction_materials',
  EXPENSES: '@construction_expenses',
  SETTINGS: '@construction_settings',
  LANGUAGE: '@construction_language',
  CONTRACTOR_PAYMENTS: '@construction_contractor_payments',
};

// Default preset materials (user can delete or add more)
const DEFAULT_MATERIALS = [
  { id: 'mat_cement', name: 'Cement', nameUrdu: 'سیمنٹ', icon: 'cube-outline', color: '#6366f1', unit: 'Bags', isDefault: true },
  { id: 'mat_bricks', name: 'Bricks', nameUrdu: 'اینٹیں', icon: 'apps-outline', color: '#f59e0b', unit: 'Pieces', isDefault: true },
  { id: 'mat_steel', name: 'Steel / Sarya', nameUrdu: 'سریا', icon: 'barbell-outline', color: '#ef4444', unit: 'KG', isDefault: true },
  { id: 'mat_sand', name: 'Sand', nameUrdu: 'ریت', icon: 'filter-outline', color: '#eab308', unit: 'Cubic Ft', isDefault: true },
  { id: 'mat_gravel', name: 'Gravel / Bajri', nameUrdu: 'بجری', icon: 'ellipse-outline', color: '#8b5cf6', unit: 'Cubic Ft', isDefault: true },
  { id: 'mat_labor', name: 'Labor', nameUrdu: 'مزدوری', icon: 'people-outline', color: '#10b981', unit: 'Days', isDefault: true },
];

const DEFAULT_SETTINGS = {
  budget: 0,
  contractAmount: 0,
  projectName: 'My Construction Site',
  currency: 'PKR',
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const db = {
  // ── Materials ──────────────────────────────────────────────
  getMaterials: async () => {
    try {
      const json = await AsyncStorage.getItem(KEYS.MATERIALS);
      if (json) return JSON.parse(json);
      // First run: save and return defaults
      await AsyncStorage.setItem(KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
      return DEFAULT_MATERIALS;
    } catch (e) {
      console.error('getMaterials error:', e);
      return DEFAULT_MATERIALS;
    }
  },

  addMaterial: async (material) => {
    try {
      const existing = await db.getMaterials();
      const newMat = {
        id: generateId(),
        name: material.name,
        nameUrdu: material.nameUrdu || '',
        icon: material.icon || 'cube-outline',
        color: material.color || '#6366f1',
        unit: material.unit || 'Pieces',
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [...existing, newMat];
      await AsyncStorage.setItem(KEYS.MATERIALS, JSON.stringify(updated));
      return newMat;
    } catch (e) {
      console.error('addMaterial error:', e);
      throw e;
    }
  },

  updateMaterial: async (id, updates) => {
    try {
      const existing = await db.getMaterials();
      const idx = existing.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error('Material not found');
      existing[idx] = { ...existing[idx], ...updates };
      await AsyncStorage.setItem(KEYS.MATERIALS, JSON.stringify(existing));
      return existing[idx];
    } catch (e) {
      console.error('updateMaterial error:', e);
      throw e;
    }
  },

  deleteMaterial: async (id) => {
    try {
      const existing = await db.getMaterials();
      const filtered = existing.filter((m) => m.id !== id);
      await AsyncStorage.setItem(KEYS.MATERIALS, JSON.stringify(filtered));
    } catch (e) {
      console.error('deleteMaterial error:', e);
      throw e;
    }
  },

  // ── Expenses ───────────────────────────────────────────────
  getExpenses: async () => {
    try {
      const json = await AsyncStorage.getItem(KEYS.EXPENSES);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('getExpenses error:', e);
      return [];
    }
  },

  addExpense: async (expense) => {
    try {
      const existing = await db.getExpenses();
      const qty = parseFloat(expense.quantity) || 0;
      const price = parseFloat(expense.pricePerUnit) || 0;
      const newExp = {
        id: generateId(),
        materialId: expense.materialId,
        quantity: qty,
        unit: expense.unit || 'Pieces',
        pricePerUnit: price,
        total: qty * price,
        date: expense.date || new Date().toISOString(),
        notes: expense.notes || '',
        createdAt: new Date().toISOString(),
      };
      const updated = [newExp, ...existing];
      await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(updated));
      return newExp;
    } catch (e) {
      console.error('addExpense error:', e);
      throw e;
    }
  },

  updateExpense: async (id, updates) => {
    try {
      const existing = await db.getExpenses();
      const idx = existing.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Expense not found');
      const qty = parseFloat(updates.quantity ?? existing[idx].quantity) || 0;
      const price = parseFloat(updates.pricePerUnit ?? existing[idx].pricePerUnit) || 0;
      existing[idx] = { ...existing[idx], ...updates, total: qty * price };
      await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(existing));
      return existing[idx];
    } catch (e) {
      console.error('updateExpense error:', e);
      throw e;
    }
  },

  deleteExpense: async (id) => {
    try {
      const existing = await db.getExpenses();
      const filtered = existing.filter((e) => e.id !== id);
      await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(filtered));
    } catch (e) {
      console.error('deleteExpense error:', e);
      throw e;
    }
  },

  deleteExpensesByMaterial: async (materialId) => {
    try {
      const existing = await db.getExpenses();
      const filtered = existing.filter((e) => e.materialId !== materialId);
      await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(filtered));
    } catch (e) {
      console.error('deleteExpensesByMaterial error:', e);
      throw e;
    }
  },

  // ── Settings ───────────────────────────────────────────────
  getSettings: async () => {
    try {
      const json = await AsyncStorage.getItem(KEYS.SETTINGS);
      return json ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: async (settings) => {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('saveSettings error:', e);
    }
  },

  // ── Language ───────────────────────────────────────────────
  getLanguage: async () => {
    try {
      const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
      return lang || 'en';
    } catch (e) {
      return 'en';
    }
  },

  saveLanguage: async (lang) => {
    try {
      await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
    } catch (e) {
      console.error('saveLanguage error:', e);
    }
  },

  // ── Contractor Payments ────────────────────────────────────
  getContractorPayments: async () => {
    try {
      const json = await AsyncStorage.getItem(KEYS.CONTRACTOR_PAYMENTS);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('getContractorPayments error:', e);
      return [];
    }
  },

  addContractorPayment: async (payment) => {
    try {
      const existing = await db.getContractorPayments();
      const newPay = {
        id: generateId(),
        amount: parseFloat(payment.amount) || 0,
        purpose: payment.purpose || '',
        purposeUrdu: payment.purposeUrdu || '',
        date: payment.date || new Date().toISOString(),
        notes: payment.notes || '',
        createdAt: new Date().toISOString(),
      };
      const updated = [newPay, ...existing];
      await AsyncStorage.setItem(KEYS.CONTRACTOR_PAYMENTS, JSON.stringify(updated));
      return newPay;
    } catch (e) {
      console.error('addContractorPayment error:', e);
      throw e;
    }
  },

  updateContractorPayment: async (id, updates) => {
    try {
      const existing = await db.getContractorPayments();
      const idx = existing.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Payment not found');
      existing[idx] = {
        ...existing[idx],
        ...updates,
        amount: parseFloat(updates.amount ?? existing[idx].amount) || 0,
      };
      await AsyncStorage.setItem(KEYS.CONTRACTOR_PAYMENTS, JSON.stringify(existing));
      return existing[idx];
    } catch (e) {
      console.error('updateContractorPayment error:', e);
      throw e;
    }
  },

  deleteContractorPayment: async (id) => {
    try {
      const existing = await db.getContractorPayments();
      const filtered = existing.filter((p) => p.id !== id);
      await AsyncStorage.setItem(KEYS.CONTRACTOR_PAYMENTS, JSON.stringify(filtered));
    } catch (e) {
      console.error('deleteContractorPayment error:', e);
      throw e;
    }
  },

  // ── Clear All ──────────────────────────────────────────────
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.MATERIALS,
        KEYS.EXPENSES,
        KEYS.SETTINGS,
        KEYS.LANGUAGE,
        KEYS.CONTRACTOR_PAYMENTS,
      ]);
    } catch (e) {
      console.error('clearAll error:', e);
    }
  },
};
