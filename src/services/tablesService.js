import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { TABLE_STATUS } from '../constants/statuses.js';
import { db } from '../firebase/client.js';

function mapDocs(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function subscribeToTables(callback) {
  if (!db) return () => {};
  const q = query(collection(db, COLLECTIONS.TABLES), orderBy('number', 'asc'));
  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export async function getTableById(tableId) {
  if (!db || !tableId) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.TABLES, tableId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createTable({ number, seats = 4, name, zone = 'Principal' }) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!Number.isFinite(number) || number < 1) {
    throw new Error('number debe ser mayor o igual a 1.');
  }
  if (!Number.isFinite(seats) || seats < 1) {
    throw new Error('seats debe ser mayor o igual a 1.');
  }

  const payload = {
    number,
    name: name?.trim() || `Mesa ${number}`,
    seats,
    zone: zone?.trim() || 'Principal',
    status: TABLE_STATUS.LIBRE,
    currentOrderId: null,
    currentTotal: 0,
    openedAt: null,
    updatedAt: serverTimestamp(),
  };

  return addDoc(collection(db, COLLECTIONS.TABLES), payload);
}

export async function updateTable(tableId, payload) {
  if (!db || !tableId) return;
  await updateDoc(doc(db, COLLECTIONS.TABLES, tableId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function resetTable(tableId) {
  if (!db || !tableId) return;

  await updateTable(tableId, {
    status: TABLE_STATUS.LIBRE,
    currentOrderId: null,
    currentTotal: 0,
    openedAt: null,
  });
}
