import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors.js';
import { formatCurrency } from '../utils/orderUtils.js';
import { StatusPill } from './StatusPill.js';

export function TableCard({ table, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selectedCard]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Mesa</Text>
          <Text style={styles.number}>#{table.number}</Text>
        </View>
        <StatusPill label={table.status} />
      </View>

      <View style={styles.metricsRow}>
        <Metric title="Asientos" value={String(table.seats)} />
        <Metric title="Cuenta" value={formatCurrency(table.currentTotal ?? table.total ?? 0)} />
      </View>

      <Text style={styles.note}>{table.openedAt ? 'Con actividad reciente' : 'Disponible'}</Text>
    </Pressable>
  );
}

function Metric({ title, value }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
    marginRight: 12,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontSize: 12,
  },
  number: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    padding: 12,
    gap: 4,
  },
  metricTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  metricValue: {
    color: COLORS.text,
    fontWeight: '700',
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
