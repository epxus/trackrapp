import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { ORDER_STATUS, PAYMENT_METHOD, TABLE_STATUS } from '../constants/statuses.js';
import { db } from '../firebase/client.js';
import { calculateOrderSummary, getTableStatusLabel } from '../utils/orderUtils.js';

function mapDocs(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function resolveOrderStatus(currentStatus, items = []) {
  if (!items.length) return ORDER_STATUS.OPEN;

  const derivedTableStatus = getTableStatusLabel(null, {
    status: currentStatus,
    items,
  });

  if (derivedTableStatus === TABLE_STATUS.POR_COBRAR) {
    return ORDER_STATUS.READY_FOR_PAYMENT;
  }

  if (currentStatus === ORDER_STATUS.CLOSED || currentStatus === ORDER_STATUS.CANCELLED) {
    return currentStatus;
  }

  return ORDER_STATUS.OPEN;
}

export function subscribeToOrders(callback) {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export function subscribeToOpenOrders(callback) {
  if (!db) return () => {};

  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('status', 'in', [ORDER_STATUS.OPEN, ORDER_STATUS.READY_FOR_PAYMENT]),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export async function getOrderById(orderId) {
  if (!db || !orderId) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateOrder(orderId, payload) {
  if (!db || !orderId) return;
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function recalculateOrderTotals(orderId) {
  if (!db || !orderId) return null;

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  let summaryResult = null;

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('La orden no existe.');
    }

    const orderData = orderSnap.data();
    const items = orderData.items ?? [];
    const summary = calculateOrderSummary(items);
    const nextStatus = resolveOrderStatus(orderData.status, items);

    transaction.update(orderRef, {
      subtotal: summary.subtotal,
      total: summary.subtotal,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    if (orderData.tableId) {
      const tableRef = doc(db, COLLECTIONS.TABLES, orderData.tableId);
      const tableSnap = await transaction.get(tableRef);

      if (tableSnap.exists()) {
        const tableData = tableSnap.data();
        const nextTableStatus = getTableStatusLabel(tableData, {
          ...orderData,
          items,
          status: nextStatus,
        });

        transaction.update(tableRef, {
          currentTotal: summary.subtotal,
          status: nextTableStatus,
          updatedAt: serverTimestamp(),
        });
      }
    }

    summaryResult = summary;
  });

  return summaryResult;
}

export async function openOrder({ tableId, people = 1, openedBy, openedByName }) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!tableId) throw new Error('tableId es obligatorio.');
  if (!openedBy) throw new Error('openedBy es obligatorio.');
  if (!openedByName) throw new Error('openedByName es obligatorio.');
  if (!Number.isFinite(people) || people < 1) throw new Error('people debe ser mayor o igual a 1.');

  const tableRef = doc(db, COLLECTIONS.TABLES, tableId);
  const orderRef = doc(collection(db, COLLECTIONS.ORDERS));

  await runTransaction(db, async (transaction) => {
    const tableSnap = await transaction.get(tableRef);

    if (!tableSnap.exists()) {
      throw new Error('La mesa no existe.');
    }

    const tableData = tableSnap.data();

    if (tableData.status !== TABLE_STATUS.LIBRE || tableData.currentOrderId) {
      throw new Error('La mesa no está disponible para abrir una orden.');
    }

    transaction.set(orderRef, {
      tableId,
      status: ORDER_STATUS.OPEN,
      notes: '',
      openedAt: serverTimestamp(),
      openedBy,
      openedByName,
      people,
      subtotal: 0,
      total: 0,
      items: [],
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      currentOrderId: orderRef.id,
      currentTotal: 0,
      status: TABLE_STATUS.OCUPADA,
      openedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return { orderId: orderRef.id, tableId };
}

export async function closeOrder({ orderId, paymentMethod, closedBy, closedByName }) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!orderId) throw new Error('orderId es obligatorio.');
  if (!closedBy) throw new Error('closedBy es obligatorio.');
  if (!closedByName) throw new Error('closedByName es obligatorio.');
  if (!Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
    throw new Error('paymentMethod no es válido.');
  }

  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const saleRef = doc(collection(db, COLLECTIONS.SALES));
  let tableId = '';

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('La orden no existe.');
    }

    const orderData = orderSnap.data();

    if (orderData.status === ORDER_STATUS.CLOSED) {
      throw new Error('La orden ya fue cerrada.');
    }

    const tableRef = doc(db, COLLECTIONS.TABLES, orderData.tableId);
    const tableSnap = await transaction.get(tableRef);

    if (!tableSnap.exists()) {
      throw new Error('La mesa asociada no existe.');
    }

    const tableData = tableSnap.data();
    if (tableData.currentOrderId !== orderId) {
      throw new Error('La mesa no tiene asociada esta orden.');
    }

    const summary = calculateOrderSummary(orderData.items ?? []);

    transaction.set(saleRef, {
      orderId,
      tableId: orderData.tableId,
      tableNumber: tableData.number,
      subtotal: summary.subtotal,
      total: summary.subtotal,
      paymentMethod,
      closedBy,
      closedByName,
      itemsSnapshot: orderData.items ?? [],
      closedAt: serverTimestamp(),
    });

    transaction.update(orderRef, {
      subtotal: summary.subtotal,
      total: summary.subtotal,
      status: ORDER_STATUS.CLOSED,
      saleId: saleRef.id,
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      currentOrderId: null,
      currentTotal: 0,
      status: TABLE_STATUS.LIBRE,
      openedAt: null,
      updatedAt: serverTimestamp(),
    });

    tableId = orderData.tableId;
  });

  return { orderId, saleId: saleRef.id, tableId };
}

export function getNextItemStatus(status) {
  switch (status) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'served';
    default:
      return status;
  }
}
