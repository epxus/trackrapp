import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { db } from '../firebase/client.js';

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

export function subscribeToSales(callback) {
  if (!db) return () => {};
  const q = query(collection(db, COLLECTIONS.SALES), orderBy('closedAt', 'desc'));
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
