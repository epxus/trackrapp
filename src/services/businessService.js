import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { db } from '../firebase/firestore.js';

const BUSINESS_CONFIG_DOC = 'config';

export const DEFAULT_BUSINESS_CONFIG = {
  name: 'PedidoFlow',
  currency: 'MXN',
  allowAccountCreation: false,
  updatedAt: null,
};

export async function ensureBusinessConfig() {
  const ref = doc(db, COLLECTIONS.BUSINESS, BUSINESS_CONFIG_DOC);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        ...DEFAULT_BUSINESS_CONFIG,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return DEFAULT_BUSINESS_CONFIG;
  }

  return {
    ...DEFAULT_BUSINESS_CONFIG,
    ...snap.data(),
  };
}

export async function updateBusinessConfig(patch) {
  const ref = doc(db, COLLECTIONS.BUSINESS, BUSINESS_CONFIG_DOC);

  await setDoc(
    ref,
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeBusinessConfig(callback) {
  const ref = doc(db, COLLECTIONS.BUSINESS, BUSINESS_CONFIG_DOC);

  return onSnapshot(ref, async (snap) => {
    if (!snap.exists()) {
      const config = await ensureBusinessConfig();
      callback(config);
      return;
    }

    callback({
      ...DEFAULT_BUSINESS_CONFIG,
      ...snap.data(),
    });
  });
}
