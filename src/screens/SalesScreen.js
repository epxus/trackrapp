import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { InfoCard } from '../components/InfoCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { StatCard } from '../components/StatCard.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { formatCurrency } from '../utils/orderUtils.js';

export default function SalesScreen() {
  const { sales, loadingData } = useAppData();

  const totals = useMemo(() => {
    const grandTotal = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const cardTotal = sales.filter((sale) => sale.paymentMethod === 'Tarjeta').reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const cashTotal = sales.filter((sale) => sale.paymentMethod === 'Efectivo').reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    return { grandTotal, cardTotal, cashTotal };
  }, [sales]);

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

      <SectionHeader title="Historial" subtitle="Ordenado de lo más reciente a lo más antiguo" />

      <View style={styles.listBlock}>
        {sales.length ? (
          sales.map((sale) => (
            <View key={sale.id} style={styles.saleCard}>
              <View style={styles.saleHeader}>
                <View>
                  <Text style={styles.saleTitle}>Mesa {sale.tableNumber}</Text>
                  <Text style={styles.saleSubtitle}>{sale.paymentMethod}</Text>
                </View>
                <Text style={styles.saleTotal}>{formatCurrency(sale.total)}</Text>
              </View>
              <Text style={styles.saleDate}>{new Date(sale.closedAt).toLocaleString('es-MX')}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="Sin ventas" description="Las cuentas cerradas aparecerán aquí para consulta e historial." />
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
});
