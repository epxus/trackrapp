import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateProductSalesMetrics, calculateOrderSummary, filterSalesByPeriod, formatDateTime, getOrderProgress, getSalesPeriodRange, getTableStatusLabel, matchesKitchenItemFilters } from '../src/utils/orderUtils.js';

test('calculateOrderSummary aggregates totals and served items', () => {
  const summary = calculateOrderSummary([
    { quantity: 2, price: 90, status: 'served' },
    { quantity: 1, price: 70, status: 'pending' },
  ]);

  assert.equal(summary.subtotal, 250);
  assert.equal(summary.totalItems, 3);
  assert.equal(summary.servedItems, 2);
  assert.equal(summary.pendingItems, 1);
});

test('getOrderProgress returns 0 when there are no items', () => {
  assert.equal(getOrderProgress([]), 0);
});

test('getOrderProgress returns percentage of served items', () => {
  const progress = getOrderProgress([
    { quantity: 1, price: 90, status: 'served' },
    { quantity: 1, price: 70, status: 'pending' },
    { quantity: 2, price: 35, status: 'served' },
  ]);

  assert.equal(progress, 75);
});

test('getTableStatusLabel marks fully served orders as por_cobrar', () => {
  const result = getTableStatusLabel(
    { status: 'ocupada' },
    {
      status: 'open',
      items: [
        { status: 'served' },
        { status: 'served' },
      ],
    }
  );

  assert.equal(result, 'por_cobrar');
});


test('getTableStatusLabel marks pending items as pendiente', () => {
  const result = getTableStatusLabel(
    { status: 'ocupada' },
    {
      status: 'open',
      items: [
        { status: 'pending' },
        { status: 'served' },
      ],
    }
  );

  assert.equal(result, 'pendiente');
});

test('getTableStatusLabel marks preparing items as ocupada', () => {
  const result = getTableStatusLabel(
    { status: 'ocupada' },
    {
      status: 'open',
      items: [
        { status: 'preparing' },
      ],
    }
  );

  assert.equal(result, 'ocupada');
});


test('getTableStatusLabel keeps ready items as ocupada until they are served', () => {
  const result = getTableStatusLabel(
    { status: 'ocupada' },
    {
      status: 'open',
      items: [
        { status: 'ready' },
        { status: 'served' },
      ],
    }
  );

  assert.equal(result, 'ocupada');
});


test('getTableStatusLabel keeps open empty orders as ocupada', () => {
  const result = getTableStatusLabel(
    { status: 'por_cobrar' },
    {
      status: 'open',
      items: [],
    }
  );

  assert.equal(result, 'ocupada');
});

test('matchesKitchenItemFilters accepts all filters by default', () => {
  assert.equal(matchesKitchenItemFilters({ status: 'pending', station: 'Bebidas' }), true);
});

test('matchesKitchenItemFilters filters by status and station when provided', () => {
  assert.equal(matchesKitchenItemFilters({ status: 'ready', station: 'Bebidas' }, { status: 'ready', station: 'Bebidas' }), true);
  assert.equal(matchesKitchenItemFilters({ status: 'preparing', station: 'Freidora' }, { status: 'ready', station: 'Freidora' }), false);
  assert.equal(matchesKitchenItemFilters({ status: 'ready', station: 'Freidora' }, { status: 'ready', station: 'Bebidas' }), false);
});


test('formatDateTime formats ISO strings safely', () => {
  const value = formatDateTime('2026-03-31T18:54:00.000Z');
  assert.notEqual(value, '—');
});

test('formatDateTime formats Firestore-like timestamps safely', () => {
  const value = formatDateTime({ seconds: 1775364840, nanoseconds: 0 });
  assert.notEqual(value, '—');
});

test('formatDateTime returns em dash for invalid values', () => {
  assert.equal(formatDateTime('fecha-invalida'), '—');
});


test('aggregateProductSalesMetrics groups units and revenue by product', () => {
  const result = aggregateProductSalesMetrics([
    {
      orderId: 'order_1',
      itemsSnapshot: [
        { name: 'Hamburguesa clásica', quantity: 2, price: 90, station: 'Cocina caliente' },
        { name: 'Refresco', quantity: 1, price: 35, station: 'Bebidas' },
      ],
    },
    {
      orderId: 'order_2',
      itemsSnapshot: [
        { name: 'Hamburguesa clásica', quantity: 1, price: 90, station: 'Cocina caliente' },
      ],
    },
  ]);

  assert.equal(result.totalUnits, 4);
  assert.equal(result.uniqueProducts, 2);
  assert.equal(result.topProduct?.name, 'Hamburguesa clásica');
  assert.equal(result.topProduct?.unitsSold, 3);
  assert.equal(result.topProduct?.revenue, 270);
});


test('getSalesPeriodRange for today spans current day', () => {
  const now = new Date('2026-04-04T15:30:00.000Z');
  const { start, end } = getSalesPeriodRange('today', now);

  assert.equal(start.toISOString(), '2026-04-04T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-04-04T23:59:59.999Z');
});

test('filterSalesByPeriod filters current week starting monday', () => {
  const now = new Date('2026-04-04T15:30:00.000Z'); // Saturday
  const result = filterSalesByPeriod([
    { id: 'a', closedAt: '2026-03-30T10:00:00.000Z' }, // Monday current week
    { id: 'b', closedAt: '2026-04-02T12:00:00.000Z' }, // Thursday current week
    { id: 'c', closedAt: '2026-03-29T12:00:00.000Z' }, // Previous Sunday
  ], 'week', now);

  assert.deepEqual(result.map((sale) => sale.id), ['a', 'b']);
});

test('filterSalesByPeriod filters current month', () => {
  const now = new Date('2026-04-04T15:30:00.000Z');
  const result = filterSalesByPeriod([
    { id: 'a', closedAt: '2026-04-01T10:00:00.000Z' },
    { id: 'b', closedAt: '2026-04-04T12:00:00.000Z' },
    { id: 'c', closedAt: '2026-03-31T23:59:00.000Z' },
  ], 'month', now);

  assert.deepEqual(result.map((sale) => sale.id), ['a', 'b']);
});
