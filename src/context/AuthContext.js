import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ensureUserProfile,
  getCurrentUserProfile,
  registerWithEmail,
  signInWithEmail,
  signOutUser,
  subscribeToAuthChanges,
} from '../services/authService.js';
import { hasFirebaseConfig } from '../firebase/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function hydrateProfile(nextUser) {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await ensureUserProfile(nextUser);
    setProfile(nextProfile);
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      try {
        setLoading(true);
        setUser(authUser ?? null);
        await hydrateProfile(authUser ?? null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const authUser = await signInWithEmail(email, password);
      setUser(authUser);
      await hydrateProfile(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      const authUser = await registerWithEmail(email, password);
      setUser(authUser);
      await hydrateProfile(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user?.uid) return;
    const nextProfile = await getCurrentUserProfile(user.uid);
    setProfile(nextProfile);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      usingFirebaseAuth: hasFirebaseConfig,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
