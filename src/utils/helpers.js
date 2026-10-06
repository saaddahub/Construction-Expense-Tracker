// src/utils/helpers.js

/**
 * Format a number as PKR currency
 */
export const formatPKR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₨ 0';
  if (amount >= 10000000) return `₨ ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₨ ${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₨ ${(amount / 1000).toFixed(1)}K`;
  return `₨ ${Math.round(amount).toLocaleString()}`;
};

/**
 * Format full amount (no abbreviation)
 */
export const formatPKRFull = (amount) => {
  if (!amount) return '₨ 0';
  return `₨ ${Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Format date short
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
};

/**
 * Get month name
 */
export const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex] || '';
};

/**
 * Group expenses by day for charts
 */
// Index once per expense change rather than filtering and sorting for each row.
export const indexExpenses = (expenses) => {
  const index = Object.create(null);
  for (const expense of expenses) {
    const group = index[expense.materialId] || (index[expense.materialId] = { total: 0, count: 0, expenses: [] });
    group.total += expense.total;
    group.count += 1;
    group.expenses.push(expense);
  }
  return index;
};

export const groupByDay = (entries, days = 7) => {
  const totals = new Map();
  for (const entry of entries) {
    const key = new Date(entry.date).toDateString();
    totals.set(key, (totals.get(key) || 0) + (entry.total ?? entry.amount ?? 0));
  }
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    return { label: formatDateShort(date.toISOString()), value: totals.get(date.toDateString()) || 0 };
  });
};

export const groupByMonth = (entries, months = 6) => {
  const totals = new Map();
  for (const entry of entries) {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    totals.set(key, (totals.get(key) || 0) + (entry.total ?? entry.amount ?? 0));
  }
  return Array.from({ length: months }, (_, index) => {
    const date = new Date();
    // Start at the first so months shorter than today do not overflow.
    date.setDate(1);
    date.setMonth(date.getMonth() - (months - 1 - index));
    return { label: getMonthName(date.getMonth()), value: totals.get(`${date.getFullYear()}-${date.getMonth()}`) || 0 };
  });
};

export const buildPieData = (materials, expenses, chartColors) => {
  const index = indexExpenses(expenses);
  return materials.map((mat, i) => ({
    name: mat.name, value: index[mat.id]?.total || 0, color: mat.color || chartColors[i % chartColors.length],
  })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
};

/**
 * Validate expense form
 */
export const validateExpense = (form, lang = 'en') => {
  const errors = {};
  if (!form.materialId) errors.materialId = lang === 'ur' ? 'سامان منتخب کریں' : 'Select a material';
  if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0)
    errors.quantity = lang === 'ur' ? 'درست مقدار درج کریں' : 'Enter a valid quantity';
  if (!form.pricePerUnit || isNaN(form.pricePerUnit) || Number(form.pricePerUnit) <= 0)
    errors.pricePerUnit = lang === 'ur' ? 'درست قیمت درج کریں' : 'Enter a valid price';
  return errors;
};

/**
 * Available icons for material picker
 */
export const MATERIAL_ICONS = [
  'cube-outline', 'apps-outline', 'barbell-outline', 'filter-outline',
  'ellipse-outline', 'people-outline', 'construct-outline', 'flash-outline',
  'water-outline', 'flame-outline', 'hammer-outline', 'car-outline',
  'home-outline', 'business-outline', 'layers-outline', 'grid-outline',
  'leaf-outline', 'color-palette-outline', 'cut-outline', 'settings-outline',
];

/**
 * Available units
 */
export const UNITS = [
  'Bags', 'KG', 'Tons', 'Cubic Ft', 'Cubic M',
  'Pieces', 'Feet', 'Meters', 'Liters', 'Days', 'Hours', 'Lorry', 'Trolley',
];

/**
 * Preset colors for new materials
 */
export const PRESET_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#3b82f6', '#a855f7', '#64748b', '#d97706', '#0891b2',
];

/**
 * Export expenses to CSV string
 */
export const buildCSV = (expenses, materials) => {
  const header = 'Date,Material,Quantity,Unit,Price/Unit,Total(PKR),Notes\n';
  const rows = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((e) => {
      const mat = materials.find((m) => m.id === e.materialId);
      const matName = mat ? mat.name : 'Unknown';
      const date = formatDate(e.date);
      return `"${date}","${matName}",${e.quantity},"${e.unit}",${e.pricePerUnit},${e.total},"${e.notes || ''}"`;
    });
  return header + rows.join('\n');
};
