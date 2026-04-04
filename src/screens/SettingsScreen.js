import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader.js';
import { InfoCard } from '../components/InfoCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { useAuth } from '../context/AuthContext.js';

const cards = [
  {
    title: 'Datos del negocio',
    description: 'Nombre comercial, horarios, moneda, impuestos y datos fiscales.',
  },
  {
    title: 'Mesas y zonas',
    description: 'Distribución del salón, numeración, capacidad y áreas especiales.',
  },
  {
    title: 'Roles y permisos',
    description: 'Accesos para dueño, caja, mesero y cocina.',
  },
  {
    title: 'Impresión y tickets',
    description: 'Formato de ticket, datos legales y envío a cocina.',
  },
];

export default function SettingsScreen() {
  const { signOut, usingFirebaseAuth, user } = useAuth();
  const { isUsingMockData, seedDemoData } = useAppData();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('No se pudo cerrar sesión', error.message);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="Ajustes" subtitle="Configuración, arquitectura y acciones técnicas de arranque." />

      <InfoCard
        tone={isUsingMockData ? 'warning' : 'success'}
        title={isUsingMockData ? 'Firebase pendiente' : 'Firebase activo'}
        description={isUsingMockData
          ? 'Completa el archivo .env con tus credenciales para conectar Auth y Firestore.'
          : 'La app ya está lista para trabajar con autenticación y tiempo real sobre Firestore.'}
      />

      <View style={styles.userCard}>
        <Text style={styles.userTitle}>Sesión actual</Text>
        <Text style={styles.userEmail}>{user?.email || 'Sin usuario'}</Text>
        <Text style={styles.userMeta}>{usingFirebaseAuth ? 'Autenticación real con Firebase' : 'Autenticación demo local'}</Text>
      </View>

      <SectionHeader title="Arquitectura base" subtitle="Bloques recomendados para el crecimiento del proyecto" />
      <View style={styles.cardsGrid}>
        {cards.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsBlock}>
        <Pressable onPress={seedDemoData} style={styles.primaryButton}>
          <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Cargar demo en Firestore</Text>
        </Pressable>
        <Pressable onPress={handleLogout} style={styles.secondaryButton}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.text} />
          <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 6,
  },
  userTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  userEmail: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  userMeta: {
    color: COLORS.textSecondary,
  },
  cardsGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsBlock: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '800',
  },
});
