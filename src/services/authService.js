import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../constants/collections.js';
import { ROLES } from '../constants/roles.js';
import { auth, db, hasFirebaseConfig } from '../firebase/client.js';

const MOCK_USER_KEY = 'pedidoflow.mock.user';

function normalizeMockUser(email) {
  return {
    uid: 'mock-user',
    email,
    displayName: email?.split('@')[0] || 'Demo',
    role: ROLES.ADMIN,
    activo: true,
  };
}

export function subscribeToAuthChanges(callback) {
  if (hasFirebaseConfig && auth) {
    return onAuthStateChanged(auth, callback);
  }

  let mounted = true;

  AsyncStorage.getItem(MOCK_USER_KEY)
    .then((raw) => {
      if (!mounted) return;
      callback(raw ? JSON.parse(raw) : null);
    })
    .catch(() => callback(null));

  return () => {
    mounted = false;
  };
}

export async function signInWithEmail(email, password) {
  if (hasFirebaseConfig && auth) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  if (!email || !password || password.length < 6) {
    throw new Error('En modo demo usa correo válido y contraseña de al menos 6 caracteres.');
  }

  const mockUser = normalizeMockUser(email);
  await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
  return mockUser;
}

export async function registerWithEmail(email, password) {
  if (hasFirebaseConfig && auth) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(credential.user);
    return credential.user;
  }

  const mockUser = normalizeMockUser(email);
  await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
  return mockUser;
}

export async function signOutUser() {
  if (hasFirebaseConfig && auth) {
    await firebaseSignOut(auth);
    return;
  }

  await AsyncStorage.removeItem(MOCK_USER_KEY);
}

export async function ensureUserProfile(user) {
  if (!user) {
    throw new Error('Usuario inválido para asegurar perfil.');
  }

  const fallbackProfile = {
    id: user.uid,
    nombre: user.displayName ?? user.email?.split('@')[0] ?? 'Usuario',
    email: user.email ?? '',
    rol: user.role ?? ROLES.ADMIN,
    activo: true,
  };

  if (!hasFirebaseConfig || !db) {
    return fallbackProfile;
  }

  const ref = doc(db, COLLECTIONS.USERS, user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const payload = {
      nombre: fallbackProfile.nombre,
      email: fallbackProfile.email,
      rol: ROLES.ADMIN,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload, { merge: true });

    return {
      id: user.uid,
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
      activo: payload.activo,
    };
  }

  const data = snap.data();

  return {
    id: user.uid,
    nombre: data.nombre ?? fallbackProfile.nombre,
    email: data.email ?? fallbackProfile.email,
    rol: data.rol ?? ROLES.ADMIN,
    activo: Boolean(data.activo ?? true),
  };
}

export async function getCurrentUserProfile(uid) {
  if (!uid) return null;

  if (!hasFirebaseConfig || !db) {
    const raw = await AsyncStorage.getItem(MOCK_USER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      id: data.uid,
      nombre: data.displayName ?? 'Demo',
      email: data.email ?? '',
      rol: data.role ?? ROLES.ADMIN,
      activo: Boolean(data.activo ?? true),
    };
  }

  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: uid,
    nombre: data.nombre ?? 'Usuario',
    email: data.email ?? '',
    rol: data.rol ?? ROLES.ADMIN,
    activo: Boolean(data.activo ?? true),
  };
}
