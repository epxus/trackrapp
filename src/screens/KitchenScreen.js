import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { calculateOrderSummary, matchesKitchenItemFilters } from '../utils/orderUtils.js';

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'En preparación', value: 'preparing' },
  { label: 'Listos', value: 'ready' },
];

export default function KitchenScreen() {
  const { tables, orders, setOrderItemStatus, loadingData } = useAppData();
  const [busyItemId, setBusyItemId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('all');

  const openOrders = useMemo(() => orders.filter((order) => order.status !== 'closed'), [orders]);
  const kitchenOrders = useMemo(
    () =>
      openOrders
        .map((order) => ({
          ...order,
          activeItems: (order.items ?? []).filter((item) => item.status !== 'served' && item.status !== 'cancelled'),
        }))
        .filter((order) => order.activeItems.length > 0),
    [openOrders]
  );

  const stationOptions = useMemo(() => {
    const stations = kitchenOrders.flatMap((order) => order.activeItems.map((item) => item.station)).filter(Boolean);
    return ['all', ...new Set(stations)];
  }, [kitchenOrders]);

  const filteredKitchenOrders = useMemo(
    () =>
      kitchenOrders
        .map((order) => ({
          ...order,
          filteredItems: order.activeItems.filter((item) => matchesKitchenItemFilters(item, { status: statusFilter, station: stationFilter })),
        }))
        .filter((order) => order.filteredItems.length > 0),
    [kitchenOrders, statusFilter, stationFilter]
  );

  const filteredItems = useMemo(
    () => filteredKitchenOrders.flatMap((order) => order.filteredItems),
    [filteredKitchenOrders]
  );

  const preparingCount = filteredItems.filter((item) => item.status === 'preparing').length;
  const readyCount = filteredItems.filter((item) => item.status === 'ready').length;
  const pendingCount = filteredItems.filter((item) => item.status === 'pending').length;

  const handleKitchenAction = async (orderId, itemId, nextStatus) => {
    try {
      setBusyItemId(itemId);
      await setOrderItemStatus(orderId, itemId, nextStatus);
    } catch (error) {
      Alert.alert('No se pudo actualizar', error.message);
    } finally {
      setBusyItemId(null);
    }
  };

  const resolveActionProps = (item) => {
    if (item.status === 'pending') {
      return {
        label: 'Iniciar preparación',
        nextStatus: 'preparing',
        tone: 'dark',
        disabled: false,
      };
    }

    if (item.status === 'preparing') {
      return {
        label: 'Marcar listo',
        nextStatus: 'ready',
        tone: 'dark',
        disabled: false,
      };
    }

    if (item.status === 'ready') {
      return {
        label: 'Esperando entrega',
        nextStatus: null,
        tone: 'light',
        disabled: true,
      };
    }

    return {
      label: '',
      nextStatus: null,
      tone: 'light',
      disabled: true,
    };
  };

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
        description="Desde cocina ahora puedes iniciar preparación o marcar productos como listos. Filtra por estado o estación para concentrarte en una parte del servicio."
      />

      <View style={styles.grid}>
        <StatCard label="Pendientes" value={String(pendingCount)} hint="Aún no arrancan" icon={<Ionicons name="time-outline" size={18} color={COLORS.text} />} />
        <StatCard label="En preparación" value={String(preparingCount)} hint="Cocina caliente y freidora" icon={<Ionicons name="flame-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Listos" value={String(readyCount)} hint="Esperando entrega" icon={<Ionicons name="checkmark-done-outline" size={18} color={COLORS.text} />} />
      </View>

      <View style={styles.filtersCard}>
        <SectionHeader title="Filtros" subtitle="Refina tickets por estado y estación" />
        <Text style={styles.filterLabel}>Estado</Text>
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter.value)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.filterLabel}>Estación</Text>
        <View style={styles.filterRow}>
          {stationOptions.map((station) => {
            const active = stationFilter === station;
            const label = station === 'all' ? 'Todas' : station;
            return (
              <Pressable
                key={station}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStationFilter(station)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SectionHeader
        title="Tickets activos"
        subtitle="Ordenados por mesa"
        actionLabel={`${filteredKitchenOrders.length} tickets`}
      />

      <View style={styles.listBlock}>
        {filteredKitchenOrders.length ? (
          filteredKitchenOrders.map((order) => {
            const table = tables.find((entry) => entry.id === order.tableId);
            return (
              <View key={order.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.ticketTitle}>Mesa {table?.number || '—'}</Text>
                    <Text style={styles.ticketSubtitle}>{calculateOrderSummary(order.filteredItems).pendingItems} pendientes por preparar o entregar</Text>
                  </View>
                  <StatusPill label={table?.status || 'ocupada'} />
                </View>
                <View style={styles.itemsList}>
                  {order.filteredItems.map((item) => {
                    const action = resolveActionProps(item);
                    const isBusy = busyItemId === item.id;
                    return (
                      <OrderItemCard
                        key={item.id}
                        item={item}
                        actionLabel={isBusy ? 'Actualizando...' : action.label}
                        actionTone={action.tone}
                        actionDisabled={isBusy || action.disabled}
                        onPressAction={() => action.nextStatus && handleKitchenAction(order.id, item.id, action.nextStatus)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState title="Sin resultados" description="No hay productos que coincidan con los filtros actuales." />
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
  filtersCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  filterLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: COLORS.dark,
    borderColor: COLORS.dark,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: COLORS.white,
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
