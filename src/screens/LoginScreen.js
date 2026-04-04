import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { COLORS } from '../constants/colors.js';
import { useAuth } from '../context/AuthContext.js';

export default function LoginScreen() {
  const { signIn, usingFirebaseAuth } = useAuth();
  const [email, setEmail] = useState('admin@pedidoflow.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn(email.trim(), password);
    } catch (submitError) {
      setError(submitError.message || 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>PedidoFlow</Text>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>
            Accede al panel de operación, cocina, menú y ventas.
          </Text>

          {!usingFirebaseAuth ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Modo demo activo</Text>
              <Text style={styles.infoText}>Usa cualquier correo y una contraseña de al menos 6 caracteres.</Text>
            </View>
          ) : null}

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
              placeholder="******"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={handleSubmit} style={styles.button} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Entrar</Text>}
          </Pressable>

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkText}>Crear cuenta</Text>
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
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
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
  infoBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  infoTitle: {
    color: '#B45309',
    fontWeight: '800',
  },
  infoText: {
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
