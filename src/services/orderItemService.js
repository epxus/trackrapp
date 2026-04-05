import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { ORDER_ITEM_STATUS } from '../constants/statuses.js';
import { db } from '../firebase/client.js';
import { recalculateOrderTotals } from './ordersService.js';

function normalizeNotes(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function addOrderItem({
  orderId,
  menuItemId,
  nombreSnapshot,
  precioSnapshot,
  kitchenArea,
  cantidad,
  notas = '',
}) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!orderId) throw new Error('orderId es obligatorio.');
  if (!menuItemId) throw new Error('menuItemId es obligatorio.');
  if (!nombreSnapshot) throw new Error('nombreSnapshot es obligatorio.');
  if (!Number.isFinite(precioSnapshot) || precioSnapshot < 0) throw new Error('precioSnapshot no es válido.');
  if (!Number.isFinite(cantidad) || cantidad < 1) throw new Error('cantidad debe ser mayor o igual a 1.');

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);

    if (!snap.exists()) {
      throw new Error('La orden no existe.');
    }

    const orderData = snap.data();
    const nextItems = [
      ...(orderData.items ?? []),
      {
        id: `line_${Date.now()}`,
        menuItemId,
        name: nombreSnapshot,
        price: precioSnapshot,
        quantity: cantidad,
        station: kitchenArea,
        notes: normalizeNotes(notas),
        status: ORDER_ITEM_STATUS.PENDING,
        createdAt: new Date().toISOString(),
      },
    ];

    transaction.update(orderRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
    });
  });

  await recalculateOrderTotals(orderId);
}

export async function updateOrderItem(orderId, itemId, patch = {}) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!orderId) throw new Error('orderId es obligatorio.');
  if (!itemId) throw new Error('itemId es obligatorio.');

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);

    if (!snap.exists()) {
      throw new Error('La orden no existe.');
    }

    const orderData = snap.data();
    let found = false;

    const nextItems = (orderData.items ?? []).map((item) => {
      if (item.id !== itemId) return item;
      found = true;

      const nextQuantity = patch.quantity == null ? Number(item.quantity ?? 1) : Number(patch.quantity);
      if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
        throw new Error('La cantidad debe ser mayor o igual a 1.');
      }

      return {
        ...item,
        quantity: nextQuantity,
        notes: patch.notes == null ? normalizeNotes(item.notes) : normalizeNotes(patch.notes),
        updatedAt: new Date().toISOString(),
      };
    });

    if (!found) {
      throw new Error('El producto de la orden no existe.');
    }

    transaction.update(orderRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
    });
  });

  await recalculateOrderTotals(orderId);
}

export async function updateOrderItemStatus(orderId, itemId, status) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!orderId) throw new Error('orderId es obligatorio.');
  if (!itemId) throw new Error('itemId es obligatorio.');

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);

    if (!snap.exists()) {
      throw new Error('La orden no existe.');
    }

    const orderData = snap.data();
    const nextItems = (orderData.items ?? []).map((item) =>
      item.id === itemId
        ? {
            ...item,
            status,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    transaction.update(orderRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
    });
  });

  await recalculateOrderTotals(orderId);
}

export async function removeOrderItem(orderId, itemId) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!orderId) throw new Error('orderId es obligatorio.');
  if (!itemId) throw new Error('itemId es obligatorio.');

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);

    if (!snap.exists()) {
      throw new Error('La orden no existe.');
    }

    const orderData = snap.data();
    const nextItems = (orderData.items ?? []).filter((item) => item.id !== itemId);

    transaction.update(orderRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
    });
  });

  await recalculateOrderTotals(orderId);
}

export async function clearOrderItems(orderId) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!orderId) throw new Error('orderId es obligatorio.');

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);

    if (!snap.exists()) {
      throw new Error('La orden no existe.');
    }

    transaction.update(orderRef, {
      items: [],
      updatedAt: serverTimestamp(),
    });
  });

  await recalculateOrderTotals(orderId);
}
