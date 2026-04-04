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
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { db } from '../firebase/client.js';

function mapDocs(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
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
    where('closedAt', '>=', start.toISOString()),
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

export async function getSalesByDateRange(startDateIso, endDateIso) {
  if (!db) return [];
  if (!startDateIso || !endDateIso) return [];

  const q = query(
    collection(db, COLLECTIONS.SALES),
    where('closedAt', '>=', startDateIso),
    where('closedAt', '<=', endDateIso),
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
