import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { InfoCard } from '../components/InfoCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { StatCard } from '../components/StatCard.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { formatCurrency, formatDateTime } from '../utils/orderUtils.js';

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function SalesScreen() {
  const { sales, orders, loadingData } = useAppData();
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const totals = useMemo(() => {
    const grandTotal = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const cardTotal = sales.filter((sale) => sale.paymentMethod === 'Tarjeta').reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const cashTotal = sales.filter((sale) => sale.paymentMethod === 'Efectivo').reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    return { grandTotal, cardTotal, cashTotal };
  }, [sales]);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === selectedSaleId) ?? null,
    [sales, selectedSaleId]
  );

  const selectedSaleItems = useMemo(() => {
    if (!selectedSale) return [];
    if (Array.isArray(selectedSale.itemsSnapshot) && selectedSale.itemsSnapshot.length) {
      return selectedSale.itemsSnapshot;
    }
    const relatedOrder = orders.find((order) => order.id === selectedSale.orderId);
    return relatedOrder?.items ?? [];
  }, [orders, selectedSale]);

  if (loadingData) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Cargando ventas...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Ventas" subtitle="Historial de cuentas cerradas y resumen del turno." />

      <InfoCard
        tone="success"
        title="Colección de ventas"
        description="Cada cierre de cuenta se mueve a sales con snapshot de ítems, método de pago y total final para reportes posteriores."
      />

      <View style={styles.grid}>
        <StatCard label="Total vendido" value={formatCurrency(totals.grandTotal)} hint={`${sales.length} tickets`} icon={<Ionicons name="wallet-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Tarjeta" value={formatCurrency(totals.cardTotal)} hint="Cobro electrónico" icon={<Ionicons name="card-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Efectivo" value={formatCurrency(totals.cashTotal)} hint="Caja física" icon={<Ionicons name="cash-outline" size={18} color={COLORS.text} />} />
      </View>

      <SectionHeader title="Historial" subtitle="Ordenado de lo más reciente a lo más antiguo" actionLabel="Toca una venta para verla" />

      <View style={styles.listBlock}>
        {sales.length ? (
          sales.map((sale) => (
            <Pressable key={sale.id} style={styles.saleCard} onPress={() => setSelectedSaleId(sale.id)}>
              <View style={styles.saleHeader}>
                <View>
                  <Text style={styles.saleTitle}>Mesa {sale.tableNumber}</Text>
                  <Text style={styles.saleSubtitle}>{sale.paymentMethod}</Text>
                </View>
                <View style={styles.saleHeaderRight}>
                  <Text style={styles.saleTotal}>{formatCurrency(sale.total)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </View>
              </View>
              <Text style={styles.saleDate}>{formatDateTime(sale.closedAt)}</Text>
            </Pressable>
          ))
        ) : (
          <EmptyState title="Sin ventas" description="Las cuentas cerradas aparecerán aquí para consulta e historial." />
        )}
      </View>

      <Modal visible={!!selectedSale} animationType="fade" transparent onRequestClose={() => setSelectedSaleId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Detalle de venta</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedSale ? `Mesa ${selectedSale.tableNumber} · ${selectedSale.paymentMethod}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedSaleId(null)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            {selectedSale ? (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailBlock}>
                  <DetailRow label="Total" value={formatCurrency(selectedSale.total)} />
                  <DetailRow label="Método" value={selectedSale.paymentMethod} />
                  <DetailRow label="Mesa" value={`Mesa ${selectedSale.tableNumber}`} />
                  <DetailRow label="Fecha" value={formatDateTime(selectedSale.closedAt)} />
                  <DetailRow label="Orden" value={selectedSale.orderId || '—'} />
                </View>

                <View style={styles.itemsBlock}>
                  <Text style={styles.itemsTitle}>Productos</Text>
                  {selectedSaleItems.length ? (
                    selectedSaleItems.map((item, index) => (
                      <View key={`${item.id || item.name}-${index}`} style={styles.saleItemRow}>
                        <View style={styles.saleItemInfo}>
                          <Text style={styles.saleItemName}>{`${item.quantity ?? 1}x ${item.name || item.nombreSnapshot || 'Producto'}`}</Text>
                          <Text style={styles.saleItemMeta}>{item.station || item.kitchenArea || 'Sin estación'}</Text>
                          {item.notes || item.notas ? (
                            <Text style={styles.saleItemNote}>{item.notes || item.notas}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.saleItemPrice}>{formatCurrency((item.price ?? item.precioSnapshot ?? 0) * (item.quantity ?? item.cantidad ?? 1))}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyItemsCard}>
                      <Text style={styles.emptyItemsText}>Esta venta no tiene snapshot de productos disponible.</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  saleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  saleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  saleSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  saleTotal: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  saleDate: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  modalBody: {
    padding: 20,
    gap: 18,
  },
  detailBlock: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  itemsBlock: {
    gap: 10,
  },
  itemsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  saleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  saleItemInfo: {
    flex: 1,
    gap: 4,
  },
  saleItemName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saleItemMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  saleItemNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  saleItemPrice: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyItemsCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    padding: 16,
  },
  emptyItemsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
