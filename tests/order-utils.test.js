import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderSummary, getOrderProgress, getTableStatusLabel } from '../src/utils/orderUtils.js';

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
