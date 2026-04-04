import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext.js';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(tabs)/operation' : '/(auth)/login'} />;
}
