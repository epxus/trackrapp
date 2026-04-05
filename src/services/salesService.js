import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { db } from '../firebase/client.js';

export const SALES_PAGE_SIZE = 20;

function mapDocs(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function normalizeDateInput(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') {
    return new Date((value.seconds * 1000) + Math.floor(Number(value.nanoseconds || 0) / 1_000_000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPeriodStart(period, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'today') {
    return start;
  }

  if (period === 'week') {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return start;
  }

  if (period === 'month') {
    start.setDate(1);
    return start;
  }

  return null;
}

function buildSalesQuery({ period = 'all', pageSize = SALES_PAGE_SIZE, cursor = null } = {}) {
  const base = [collection(db, COLLECTIONS.SALES)];
  const start = getPeriodStart(period);

  const clauses = [];
  if (start) {
    clauses.push(where('closedAt', '>=', Timestamp.fromDate(start)));
  }

  clauses.push(orderBy('closedAt', 'desc'));

  if (cursor) {
    clauses.push(startAfter(cursor));
  }

  clauses.push(limit(pageSize));
  return query(base[0], ...clauses);
}

export function subscribeToSales(callback, { limitCount = SALES_PAGE_SIZE } = {}) {
  if (!db) return () => {};
  const q = query(collection(db, COLLECTIONS.SALES), orderBy('closedAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export function subscribeToTodaySales(callback) {
  if (!db) return () => {};

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, COLLECTIONS.SALES),
    where('closedAt', '>=', Timestamp.fromDate(start)),
    orderBy('closedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export async function getSalesPage({ period = 'all', pageSize = SALES_PAGE_SIZE, cursor = null } = {}) {
  if (!db) {
    return { sales: [], cursor: null, hasMore: false };
  }

  const snapshot = await getDocs(buildSalesQuery({ period, pageSize, cursor }));
  const nextCursor = snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    sales: mapDocs(snapshot),
    cursor: nextCursor,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function getSaleById(saleId) {
  if (!db || !saleId) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.SALES, saleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getSalesByDateRange(startDateValue, endDateValue) {
  if (!db) return [];

  const startDate = normalizeDateInput(startDateValue);
  const endDate = normalizeDateInput(endDateValue);
  if (!startDate || !endDate) return [];

  const q = query(
    collection(db, COLLECTIONS.SALES),
    where('closedAt', '>=', Timestamp.fromDate(startDate)),
    where('closedAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('closedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return mapDocs(snapshot);
}

export async function createSale(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTIONS.SALES), {
    ...payload,
    closedAt: payload.closedAt || serverTimestamp(),
  });
}
