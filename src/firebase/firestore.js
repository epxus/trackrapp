import { getFirestore } from 'firebase/firestore';
import { firebaseApp, hasFirebaseConfig } from './config.js';

export const db = hasFirebaseConfig && firebaseApp ? getFirestore(firebaseApp) : null;
