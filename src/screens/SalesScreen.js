import React, { useEffect, useMemo, useState } from 'react';
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
import { SALES_PAGE_SIZE, getSalesByDateRange, getSalesPage } from '../services/salesService.js';
import { aggregateProductSalesMetrics, filterSalesByPeriod, formatCurrency, formatDateTime, getSalesPeriodRange } from '../utils/orderUtils.js';

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function SalesScreen() {
  const { sales, orders, loadingData, isUsingMockData } = useAppData();
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('today');
  const [historySales, setHistorySales] = useState([]);
  const [summarySales, setSummarySales] = useState([]);
  const [historyCursor, setHistoryCursor] = useState(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [mockVisibleCount, setMockVisibleCount] = useState(SALES_PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialHistory() {
      setSelectedSaleId(null);
      if (isUsingMockData) {
        const filtered = filterSalesByPeriod(sales, periodFilter);
        if (cancelled) return;
        setMockVisibleCount(SALES_PAGE_SIZE);
        setHistorySales(filtered.slice(0, SALES_PAGE_SIZE));
        setHistoryCursor(null);
        setHasMoreHistory(filtered.length > SALES_PAGE_SIZE);
        return;
      }

      setLoadingHistory(true);
      try {
        const page = await getSalesPage({ period: periodFilter, pageSize: SALES_PAGE_SIZE });
        if (cancelled) return;
        setHistorySales(page.sales);
        setHistoryCursor(page.cursor);
        setHasMoreHistory(page.hasMore);
      } catch (error) {
        if (!cancelled) {
          setHistorySales([]);
          setHistoryCursor(null);
          setHasMoreHistory(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadInitialHistory();

    return () => {
      cancelled = true;
    };
  }, [isUsingMockData, periodFilter, sales]);


  useEffect(() => {
    let cancelled = false;

    async function loadSummarySales() {
      if (isUsingMockData) {
        const filtered = filterSalesByPeriod(sales, periodFilter);
        if (cancelled) return;
        setSummarySales(filtered);
        return;
      }

      setLoadingSummary(true);
      try {
        const { start, end } = getSalesPeriodRange(periodFilter);
        const allSalesForPeriod = await getSalesByDateRange(start, end);
        if (cancelled) return;
        setSummarySales(allSalesForPeriod);
      } catch (error) {
        if (!cancelled) {
          setSummarySales([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSummary(false);
        }
      }
    }

    loadSummarySales();

    return () => {
      cancelled = true;
    };
  }, [isUsingMockData, periodFilter, sales]);

  const handleLoadMore = async () => {
    if (loadingMoreHistory || loadingHistory) return;

    if (isUsingMockData) {
      const filtered = filterSalesByPeriod(sales, periodFilter);
      const nextVisible = mockVisibleCount + SALES_PAGE_SIZE;
      setMockVisibleCount(nextVisible);
      setHistorySales(filtered.slice(0, nextVisible));
      setHasMoreHistory(filtered.length > nextVisible);
      return;
    }

    if (!historyCursor || !hasMoreHistory) return;

    setLoadingMoreHistory(true);
    try {
      const page = await getSalesPage({
        period: periodFilter,
        pageSize: SALES_PAGE_SIZE,
        cursor: historyCursor,
      });

      setHistorySales((current) => [...current, ...page.sales]);
      setHistoryCursor(page.cursor);
      setHasMoreHistory(page.hasMore);
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  const totals = useMemo(() => {
    const grandTotal = summarySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const cardTotal = summarySales.filter((sale) => sale.paymentMethod === 'Tarjeta').reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const cashTotal = summarySales.filter((sale) => sale.paymentMethod === 'Efectivo').reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    return { grandTotal, cardTotal, cashTotal };
  }, [summarySales]);

  const selectedSale = useMemo(
    () => historySales.find((sale) => sale.id === selectedSaleId) ?? null,
    [historySales, selectedSaleId]
  );

  const selectedSaleItems = useMemo(() => {
    if (!selectedSale) return [];
    if (Array.isArray(selectedSale.itemsSnapshot) && selectedSale.itemsSnapshot.length) {
      return selectedSale.itemsSnapshot;
    }
    const relatedOrder = orders.find((order) => order.id === selectedSale.orderId);
    return relatedOrder?.items ?? [];
  }, [orders, selectedSale]);

  const productMetrics = useMemo(() => aggregateProductSalesMetrics(summarySales, orders), [summarySales, orders]);

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
      <AppHeader title="Ventas" subtitle="Historial paginado de cuentas cerradas y resumen del turno." />

      <InfoCard
        tone="success"
        title="Colección de ventas"
        description="El historial carga por bloques, pero las métricas del período se calculan aparte para reflejar todo Hoy, Semana o Mes."
      />

      <View style={styles.filterRow}>
        {[
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: 'Semana' },
          { key: 'month', label: 'Mes' },
        ].map((option) => {
          const active = periodFilter === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setPeriodFilter(option.key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        <StatCard label="Total del período" value={formatCurrency(totals.grandTotal)} hint={`${summarySales.length} tickets del período`} icon={<Ionicons name="wallet-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Tarjeta" value={formatCurrency(totals.cardTotal)} hint="Cobro electrónico" icon={<Ionicons name="card-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Efectivo" value={formatCurrency(totals.cashTotal)} hint="Caja física" icon={<Ionicons name="cash-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Unidades vendidas" value={String(productMetrics.totalUnits)} hint={`${productMetrics.uniqueProducts} productos del período`} icon={<Ionicons name="bar-chart-outline" size={18} color={COLORS.text} />} />
      </View>

      <SectionHeader
        title="Métricas por producto"
        subtitle={`Ranking sobre todas las ventas del período · ${periodFilter === 'today' ? 'Hoy' : periodFilter === 'week' ? 'Semana actual' : 'Mes actual'}`}
        actionLabel={productMetrics.topProduct ? `Top: ${productMetrics.topProduct.name}` : undefined}
      />

      <View style={styles.productMetricsBlock}>
        {loadingSummary ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.inlineLoaderText}>Calculando métricas del período...</Text>
          </View>
        ) : productMetrics.products.length ? (
          productMetrics.products.slice(0, 8).map((product, index) => (
            <View key={`${product.name}-${index}`} style={styles.productMetricCard}>
              <View style={styles.productMetricHeader}>
                <View style={styles.productMetricTitleWrap}>
                  <Text style={styles.productMetricTitle}>{product.name}</Text>
                  <Text style={styles.productMetricStation}>{product.station}</Text>
                </View>
                <View style={styles.productMetricBadge}>
                  <Text style={styles.productMetricBadgeText}>#{index + 1}</Text>
                </View>
              </View>

              <View style={styles.productMetricStats}>
                <View style={styles.productMetricStat}>
                  <Text style={styles.productMetricLabel}>Unidades</Text>
                  <Text style={styles.productMetricValue}>{product.unitsSold}</Text>
                </View>
                <View style={styles.productMetricStat}>
                  <Text style={styles.productMetricLabel}>Ingresos</Text>
                  <Text style={styles.productMetricValue}>{formatCurrency(product.revenue)}</Text>
                </View>
                <View style={styles.productMetricStat}>
                  <Text style={styles.productMetricLabel}>Veces vendido</Text>
                  <Text style={styles.productMetricValue}>{product.tickets}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="Sin métricas" description="Las métricas por producto aparecerán cuando existan ventas cargadas para este período." />
        )}
      </View>

      <SectionHeader title="Historial" subtitle="Ordenado de lo más reciente a lo más antiguo" actionLabel="Toca una venta para verla" />

      <View style={styles.listBlock}>
        {loadingHistory ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.inlineLoaderText}>Cargando historial...</Text>
          </View>
        ) : historySales.length ? (
          <>
            {historySales.map((sale) => (
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
            ))}

            {hasMoreHistory ? (
              <Pressable style={[styles.loadMoreButton, loadingMoreHistory && styles.loadMoreButtonDisabled]} onPress={handleLoadMore} disabled={loadingMoreHistory}>
                {loadingMoreHistory ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loadMoreButtonText}>Cargar más ventas</Text>
                )}
              </Pressable>
            ) : (
              <Text style={styles.historyFootnote}>Ya se cargó todo el historial visible para este período.</Text>
            )}
            <Text style={styles.historyFootnote}>Historial cargado: {historySales.length} · Ventas totales del período: {summarySales.length}</Text>
          </>
        ) : (
          <EmptyState title="Sin ventas" description="No hay ventas registradas para el filtro seleccionado." />
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listBlock: {
    gap: 12,
  },
  productMetricsBlock: {
    gap: 12,
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  inlineLoaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  productMetricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  productMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productMetricTitleWrap: {
    flex: 1,
    gap: 4,
  },
  productMetricTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  productMetricStation: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  productMetricBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  productMetricBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  productMetricStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productMetricStat: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  productMetricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  productMetricValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
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
    fontSize: 16,
  },
  saleDate: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  loadMoreButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  historyFootnote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 16,
    paddingBottom: 8,
  },
  detailBlock: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  itemsBlock: {
    gap: 12,
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
