// src/context/AppContext.js
// Global state management for the app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../data/db';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [materials, setMaterials] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState({
    budget: 0,
    projectName: 'My Construction',
    currency: 'PKR',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month'); // 'day' | 'month' | 'year' | 'all'

  // Load all data on start
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [mats, exps, setts, lang] = await Promise.all([
        db.getMaterials(),
        db.getExpenses(),
        db.getSettings(),
        db.getLanguage(),
      ]);
      setMaterials(mats);
      setExpenses(exps);
      setSettings(setts);
      setLanguage(lang);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Material CRUD ---
  const addMaterial = useCallback(async (material) => {
    const newMat = await db.addMaterial(material);
    setMaterials((prev) => [...prev, newMat]);
    return newMat;
  }, []);

  const updateMaterial = useCallback(async (id, updates) => {
    const updated = await db.updateMaterial(id, updates);
    setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const deleteMaterial = useCallback(async (id) => {
    await db.deleteMaterial(id);
    // Also delete related expenses
    await db.deleteExpensesByMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setExpenses((prev) => prev.filter((e) => e.materialId !== id));
  }, []);

  // --- Expense CRUD ---
  const addExpense = useCallback(async (expense) => {
    const newExp = await db.addExpense(expense);
    setExpenses((prev) => [...prev, newExp]);
    return newExp;
  }, []);

  const updateExpense = useCallback(async (id, updates) => {
    const updated = await db.updateExpense(id, updates);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await db.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // --- Settings ---
  const updateSettings = useCallback(async (updates) => {
    const newSettings = { ...settings, ...updates };
    await db.saveSettings(newSettings);
    setSettings(newSettings);
  }, [settings]);

  const toggleLanguage = useCallback(async () => {
    const newLang = language === 'en' ? 'ur' : 'en';
    await db.saveLanguage(newLang);
    setLanguage(newLang);
  }, [language]);

  const clearAllData = useCallback(async () => {
    await db.clearAll();
    setMaterials([]);
    setExpenses([]);
    setSettings({ budget: 0, projectName: 'My Construction', currency: 'PKR' });
  }, []);

  // --- Computed values ---
  const getFilteredExpenses = useCallback((filter = timeFilter) => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      if (filter === 'day') {
        return d.toDateString() === now.toDateString();
      } else if (filter === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (filter === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  }, [expenses, timeFilter]);

  const getTotalSpent = useCallback((filter = timeFilter) => {
    return getFilteredExpenses(filter).reduce((sum, e) => sum + e.total, 0);
  }, [getFilteredExpenses, timeFilter]);

  const getExpensesForMaterial = useCallback((materialId, filter = 'all') => {
    return expenses
      .filter((e) => e.materialId === materialId)
      .filter((e) => {
        if (filter === 'all') return true;
        const now = new Date();
        const d = new Date(e.date);
        if (filter === 'day') return d.toDateString() === now.toDateString();
        if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filter === 'year') return d.getFullYear() === now.getFullYear();
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses]);

  const getTotalForMaterial = useCallback((materialId, filter = 'all') => {
    return getExpensesForMaterial(materialId, filter).reduce((sum, e) => sum + e.total, 0);
  }, [getExpensesForMaterial]);

  return (
    <AppContext.Provider
      value={{
        language,
        materials,
        expenses,
        settings,
        isLoading,
        timeFilter,
        setTimeFilter,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addExpense,
        updateExpense,
        deleteExpense,
        updateSettings,
        toggleLanguage,
        clearAllData,
        getFilteredExpenses,
        getTotalSpent,
        getExpensesForMaterial,
        getTotalForMaterial,
        reload: loadAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
