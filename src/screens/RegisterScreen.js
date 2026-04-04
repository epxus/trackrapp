import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { COLORS } from '../constants/colors.js';
import { useAuth } from '../context/AuthContext.js';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      await signUp(email.trim(), password);
    } catch (submitError) {
      setError(submitError.message || 'No fue posible registrar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>Nuevo acceso</Text>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Registra al administrador principal o al primer usuario del negocio.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="correo@negocio.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="mínimo 6 caracteres"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={handleSubmit} style={styles.button} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkText}>Ya tengo cuenta</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
  },
  error: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
