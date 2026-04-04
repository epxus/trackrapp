import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { db } from '../firebase/client.js';

function mapDocs(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function subscribeToMenuItems(callback) {
  if (!db) return () => {};
  const q = query(collection(db, COLLECTIONS.MENU_ITEMS), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export function subscribeToMenuCategories(callback) {
  if (!db) return () => {};
  const q = query(collection(db, COLLECTIONS.MENU_CATEGORIES), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => callback(mapDocs(snapshot)));
}

export async function createMenuItem({ name, category, price, station, available = true }) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!name?.trim()) throw new Error('El nombre del producto es obligatorio.');
  if (!category?.trim()) throw new Error('La categoría es obligatoria.');
  if (!station?.trim()) throw new Error('La estación es obligatoria.');
  if (!Number.isFinite(price) || price < 0) throw new Error('El precio no es válido.');

  return addDoc(collection(db, COLLECTIONS.MENU_ITEMS), {
    name: name.trim(),
    category: category.trim(),
    price,
    station: station.trim(),
    available: Boolean(available),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMenuItem(menuItemId, payload) {
  if (!db || !menuItemId) return;

  await updateDoc(doc(db, COLLECTIONS.MENU_ITEMS, menuItemId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleMenuItemAvailability(menuItemId, nextValue) {
  return updateMenuItem(menuItemId, {
    available: Boolean(nextValue),
  });
}

export async function createMenuCategory({ name, active = true }) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!name?.trim()) throw new Error('El nombre de la categoría es obligatorio.');

  return addDoc(collection(db, COLLECTIONS.MENU_CATEGORIES), {
    name: name.trim(),
    active: Boolean(active),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMenuCategory(categoryId, payload) {
  if (!db || !categoryId) return;

  await updateDoc(doc(db, COLLECTIONS.MENU_CATEGORIES, categoryId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleMenuCategoryAvailability(categoryId, nextValue) {
  return updateMenuCategory(categoryId, {
    active: Boolean(nextValue),
  });
}

export async function deleteMenuCategory(categoryId) {
  if (!db || !categoryId) return;
  await deleteDoc(doc(db, COLLECTIONS.MENU_CATEGORIES, categoryId));
}

export async function renameMenuItemsCategory(oldName, nextName) {
  if (!db) throw new Error('Firestore no está configurado.');
  if (!oldName?.trim() || !nextName?.trim() || oldName.trim() === nextName.trim()) return;

  const itemsQuery = query(
    collection(db, COLLECTIONS.MENU_ITEMS),
    where('category', '==', oldName.trim())
  );
  const itemsSnapshot = await getDocs(itemsQuery);
  if (itemsSnapshot.empty) return;

  const batch = writeBatch(db);
  itemsSnapshot.forEach((itemDoc) => {
    batch.update(itemDoc.ref, {
      category: nextName.trim(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}
