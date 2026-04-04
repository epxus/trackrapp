import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { InfoCard } from '../components/InfoCard.js';
import { OrderItemCard } from '../components/OrderItemCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { StatCard } from '../components/StatCard.js';
import { StatusPill } from '../components/StatusPill.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { calculateOrderSummary } from '../utils/orderUtils.js';

export default function KitchenScreen() {
  const { tables, orders, advanceOrderItemStatus, loadingData } = useAppData();

  const openOrders = useMemo(() => orders.filter((order) => order.status !== 'closed'), [orders]);
  const preparingCount = openOrders.flatMap((order) => order.items).filter((item) => item.status === 'preparing').length;
  const readyCount = openOrders.flatMap((order) => order.items).filter((item) => item.status === 'ready').length;
  const pendingCount = openOrders.flatMap((order) => order.items).filter((item) => item.status === 'pending').length;

  if (loadingData) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Cargando cocina...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Cocina" subtitle="Actualiza el estado de cada producto y mantén el flujo en tiempo real." />

      <InfoCard
        tone="neutral"
        title="Flujo de estados"
        description="Cada botón avanza el ítem por pendiente → en preparación → listo → servido. En Firebase esto se sincroniza con la vista de operación."
      />

      <View style={styles.grid}>
        <StatCard label="Pendientes" value={String(pendingCount)} hint="Aún no arrancan" icon={<Ionicons name="time-outline" size={18} color={COLORS.text} />} />
        <StatCard label="En preparación" value={String(preparingCount)} hint="Cocina caliente y freidora" icon={<Ionicons name="flame-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Listos" value={String(readyCount)} hint="Esperando entrega" icon={<Ionicons name="checkmark-done-outline" size={18} color={COLORS.text} />} />
      </View>

      <SectionHeader title="Tickets activos" subtitle="Ordenados por mesa" actionLabel={`${openOrders.length} tickets`} />

      <View style={styles.listBlock}>
        {openOrders.length ? (
          openOrders.map((order) => {
            const table = tables.find((entry) => entry.id === order.tableId);
            return (
              <View key={order.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.ticketTitle}>Mesa {table?.number || '—'}</Text>
                    <Text style={styles.ticketSubtitle}>{calculateOrderSummary(order.items).pendingItems} pendientes por preparar o entregar</Text>
                  </View>
                  <StatusPill label={table?.status || 'ocupada'} />
                </View>
                <View style={styles.itemsList}>
                  {order.items.map((item) => (
                    <OrderItemCard
                      key={item.id}
                      item={item}
                      actionLabel="Avanzar estado"
                      onPressAction={() => advanceOrderItemStatus(order.id, item.id)}
                    />
                  ))}
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState title="Sin tickets" description="No hay órdenes abiertas en cocina por el momento." />
        )}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listBlock: {
    gap: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  ticketTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 18,
  },
  ticketSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  itemsList: {
    gap: 12,
  },
});
