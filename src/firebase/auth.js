import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  setPersistence,
} from 'firebase/auth';
import { firebaseApp, hasFirebaseConfig } from './config.js';

let authInstance = null;

if (hasFirebaseConfig && firebaseApp) {
  if (Platform.OS === 'web') {
    authInstance = getAuth(firebaseApp);
    setPersistence(authInstance, browserLocalPersistence).catch(() => {
      // Ignorar para no romper la sesión en navegadores restringidos.
    });
  } else {
    try {
      authInstance = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(firebaseApp);
    }
  }
}

export const auth = authInstance;
