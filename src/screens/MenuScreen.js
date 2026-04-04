import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { InfoCard } from '../components/InfoCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { StatCard } from '../components/StatCard.js';
import { StatusPill } from '../components/StatusPill.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { formatCurrency } from '../utils/orderUtils.js';

function promptMenuProduct() {
  if (typeof globalThis.prompt !== 'function') {
    throw new Error('La captura rápida de productos está disponible en Expo Web.');
  }

  const name = globalThis.prompt('Nombre del producto', 'Producto nuevo');
  if (name === null) return null;

  const category = globalThis.prompt('Categoría', 'General');
  if (category === null) return null;

  const priceValue = globalThis.prompt('Precio', '50');
  if (priceValue === null) return null;

  const station = globalThis.prompt('Estación / área', 'Cocina caliente');
  if (station === null) return null;

  const price = Number(priceValue);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Captura un precio válido.');
  }

  return {
    name: name.trim(),
    category: category.trim(),
    price,
    station: station.trim(),
    available: true,
  };
}

export default function MenuScreen() {
  const { menuItems, loadingData, createMenuProduct, toggleMenuAvailability } = useAppData();
  const [busyId, setBusyId] = useState(null);

  const grouped = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const category = item.category || 'General';
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const categories = Object.keys(grouped);
  const availableCount = menuItems.filter((item) => item.available).length;
  const pausedCount = menuItems.filter((item) => !item.available).length;

  const handleCreateProduct = async () => {
    try {
      const payload = promptMenuProduct();
      if (!payload) return;
      await createMenuProduct(payload);
    } catch (error) {
      Alert.alert('No se pudo crear el producto', error.message);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      setBusyId(item.id);
      await toggleMenuAvailability(item.id, !item.available);
    } catch (error) {
      Alert.alert('No se pudo actualizar el producto', error.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loadingData) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Cargando menú...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Menú"
        subtitle="Administra categorías, precios y disponibilidad de productos."
        rightContent={
          <Pressable onPress={handleCreateProduct} style={styles.headerButton}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </Pressable>
        }
      />

      <InfoCard
        tone="neutral"
        title="Menú conectado"
        description="Ya puedes crear productos desde Expo Web y pausar o reactivar artículos sin salir de la pantalla."
      />

      <View style={styles.grid}>
        <StatCard label="Productos" value={String(menuItems.length)} hint={`${categories.length} categorías`} icon={<Ionicons name="list-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Disponibles" value={String(availableCount)} hint="Listos para venta" icon={<Ionicons name="checkmark-circle-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Pausados" value={String(pausedCount)} hint="Ocultos temporalmente" icon={<Ionicons name="pause-circle-outline" size={18} color={COLORS.text} />} />
      </View>

      {categories.length ? (
        categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <SectionHeader title={category} subtitle={`${grouped[category].length} productos`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {grouped[category].map((item) => (
                <View key={item.id} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productTitle}>{item.name}</Text>
                    <StatusPill label={item.available ? 'available' : 'paused'} />
                  </View>
                  <Text style={styles.productStation}>{item.station}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                  <Pressable
                    onPress={() => handleToggleAvailability(item)}
                    disabled={busyId === item.id}
                    style={[styles.actionButton, busyId === item.id && styles.actionButtonDisabled]}
                  >
                    <Text style={styles.actionButtonText}>
                      {busyId === item.id ? 'Guardando...' : item.available ? 'Pausar' : 'Activar'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ))
      ) : (
        <EmptyState title="Sin productos" description="Agrega artículos al menú para empezar a tomar pedidos." />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: COLORS.textSecondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categorySection: {
    gap: 12,
  },
  horizontalList: {
    paddingRight: 8,
  },
  productCard: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
    marginRight: 12,
  },
  productHeader: {
    gap: 10,
  },
  productTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  productStation: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  productPrice: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 24,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.dark,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
