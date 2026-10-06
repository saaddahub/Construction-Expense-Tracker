const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

function load(file, mocks = {}, DateType = Date) {
  const { code } = transformFileSync(path.join(__dirname, '..', file), {
    configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'Date', code)(
    (id) => mocks[id] || require(id), module, module.exports, DateType);
  return module.exports;
}

function storageFixture(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    multiRemove: async (keys) => keys.forEach((key) => values.delete(key)),
  };
  const open = () => load('src/data/db.js', { '@react-native-async-storage/async-storage': storage }).db;
  return { values, open };
}

test('existing installations retain settings and ledgers when Zakir is introduced', async () => {
  const oldSettings = { budget: 500000, contractAmount: 200000, naveedContractAmount: 70000, projectName: 'Existing project', currency: 'PKR' };
  const fixture = storageFixture({
    '@construction_settings': oldSettings,
    '@construction_contractor_payments': [{ id: 'old-c', amount: 12500 }],
    '@construction_naveed_payments': [{ id: 'old-n', amount: 3500 }],
    '@construction_expenses': [{ id: 'old-e', total: 800, materialId: 'cement' }],
    '@construction_materials': [{ id: 'cement', name: 'Custom cement', unit: 'Bags' }],
  });
  const before = new Map(fixture.values);
  const db = fixture.open();
  assert.deepEqual(await db.getSettings(), { ...oldSettings, zakirContractAmount: 0 });
  assert.deepEqual(await db.getZakirPayments(), []);
  assert.equal((await db.getContractorPayments())[0].amount, 12500);
  assert.equal((await db.getNaveedPayments())[0].amount, 3500);
  assert.equal((await db.getExpenses())[0].total, 800);
  assert.equal((await db.getMaterials())[0].name, 'Custom cement');
  assert.deepEqual(fixture.values, before, 'loading must not rewrite old data');
});

test('Zakir create/edit/delete persists across reload and keeps other ledgers intact', async () => {
  const fixture = storageFixture({
    '@construction_contractor_payments': [{ id: 'old-c', amount: 12500 }],
    '@construction_naveed_payments': [{ id: 'old-n', amount: 3500 }],
  });
  let db = fixture.open();
  const pay = await db.addZakirPayment({ amount: '25000', purpose: 'Foundation', date: '2026-10-05T10:00:00Z', notes: 'Advance' });
  assert.equal(pay.amount, 25000);
  assert.ok(pay.id && pay.createdAt);
  db = fixture.open();
  assert.deepEqual(await db.getZakirPayments(), [pay]);
  await db.updateZakirPayment(pay.id, { amount: '30000', purpose: 'Foundation stage 1' });
  db = fixture.open();
  const edited = (await db.getZakirPayments())[0];
  assert.equal(edited.amount, 30000);
  assert.equal(edited.purpose, 'Foundation stage 1');
  assert.equal(edited.date, pay.date);
  assert.equal(edited.notes, 'Advance');
  assert.equal((await db.getContractorPayments())[0].amount, 12500);
  assert.equal((await db.getNaveedPayments())[0].amount, 3500);
  await db.deleteZakirPayment(pay.id);
  assert.deepEqual(await fixture.open().getZakirPayments(), []);
});

test('contract budgets save together and reset includes Zakir', async () => {
  const fixture = storageFixture();
  const db = fixture.open();
  await db.saveSettings({ ...(await db.getSettings()), budget: 500000, contractAmount: 100000, naveedContractAmount: 200000, zakirContractAmount: 300000 });
  assert.equal((await fixture.open().getSettings()).zakirContractAmount, 300000);
  await db.addZakirPayment({ amount: 100, purpose: 'Test' });
  await db.addNaveedPayment({ amount: 200, purpose: 'Test' });
  await db.addContractorPayment({ amount: 300, purpose: 'Test' });
  await db.clearAll();
  assert.equal(fixture.values.size, 0);
  assert.equal((await db.getSettings()).zakirContractAmount, 0);
});

test('expense and material CRUD retains existing quantity and price calculations', async () => {
  const db = storageFixture().open();
  const material = await db.addMaterial({ name: 'Tiles', nameUrdu: 'ٹائل', unit: 'Pieces', icon: 'grid-outline', color: '#123456' });
  const expense = await db.addExpense({ materialId: material.id, quantity: '3.5', pricePerUnit: '1250', unit: material.unit });
  assert.equal(expense.total, 4375);
  await db.updateExpense(expense.id, { quantity: 4 });
  assert.equal((await db.getExpenses())[0].total, 5000);
  await db.updateMaterial(material.id, { name: 'Floor tiles' });
  assert.equal((await db.getMaterials()).find((item) => item.id === material.id).name, 'Floor tiles');
  await db.deleteExpensesByMaterial(material.id);
  await db.deleteMaterial(material.id);
  assert.equal((await db.getExpenses()).length, 0);
  assert.ok(!(await db.getMaterials()).some((item) => item.id === material.id));
});

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 2, 31, 12])); }
}
const helpers = load('src/utils/helpers.js', {}, FixedDate);

test('weekly charts include both expense totals and contractor payment amounts', () => {
  const today = new FixedDate().toISOString();
  const old = new Date(2026, 2, 1, 12).toISOString();
  const bars = helpers.groupByDay([{ date: today, total: 120 }, { date: today, amount: 300 }, { date: old, amount: 900 }], 7);
  assert.equal(bars.length, 7);
  assert.equal(bars[6].value, 420);
  assert.equal(bars.reduce((sum, bar) => sum + bar.value, 0), 420);
  assert.ok(bars.every((bar) => Number.isFinite(bar.value)));
});

test('monthly chart does not skip February when today is the 31st', () => {
  const bars = helpers.groupByMonth([{ date: new Date(2026, 1, 15).toISOString(), total: 200 }], 3);
  assert.deepEqual(bars.map((bar) => bar.label), ['Jan', 'Feb', 'Mar']);
  assert.equal(bars[1].value, 200);
});

test('large histories aggregate correctly and CSV export keeps source order', () => {
  const entries = Array.from({ length: 10000 }, (_, index) => ({
    id: String(index), materialId: 'mat-' + (index % 5), total: 10, quantity: 2, pricePerUnit: 5, unit: 'Bags',
    date: new Date(2026, 2, (index % 30) + 1).toISOString(),
  }));
  const index = helpers.indexExpenses(entries);
  assert.equal(index['mat-0'].count, 2000);
  assert.equal(index['mat-0'].total, 20000);
  assert.equal(helpers.groupByMonth(entries, 3)[2].value, 100000);
  const categories = Array.from({ length: 5 }, (_, i) => ({ id: 'mat-' + i, name: 'Material ' + i }));
  assert.equal(helpers.buildPieData(categories, entries, ['#fff']).reduce((sum, item) => sum + item.value, 0), 100000);
  const order = entries.map((item) => item.id);
  const csv = helpers.buildCSV(entries, categories);
  assert.ok(csv.startsWith('Date,Material,Quantity,Unit,Price/Unit,Total(PKR),Notes\n'));
  assert.equal(csv.split('\n').length, 10001);
  assert.deepEqual(entries.map((item) => item.id), order);
});

test('English and Urdu expose the same translation keys including Zakir', () => {
  const { strings, getStr } = load('src/i18n/strings.js');
  assert.deepEqual(Object.keys(strings.en).sort(), Object.keys(strings.ur).sort());
  assert.equal(getStr('en', 'zakir'), 'Zakir');
  assert.equal(getStr('ur', 'zakir'), 'ذاکر');
});
