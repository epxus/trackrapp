import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors.js';
import { formatCurrency } from '../utils/orderUtils.js';
import { StatusPill } from './StatusPill.js';

export function OrderItemCard({ item, actionLabel, onPressAction, actionDisabled = false, actionTone = 'dark' }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.qtyWrap}>
          <Text style={styles.qty}>{item.quantity}x</Text>
        </View>
        <View style={styles.main}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.station}</Text>
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        </View>
        <View style={styles.right}>
          <Text style={styles.price}>{formatCurrency(item.quantity * item.price)}</Text>
          <StatusPill label={item.status} />
        </View>
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onPressAction}
          style={[styles.button, actionTone === 'light' ? styles.buttonLight : null, actionDisabled ? styles.buttonDisabled : null]}
          disabled={actionDisabled}
        >
          <Text style={[styles.buttonText, actionTone === 'light' ? styles.buttonTextLight : null]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  qtyWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qty: {
    fontWeight: '800',
    color: COLORS.text,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  name: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  meta: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  notes: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  price: {
    color: COLORS.text,
    fontWeight: '800',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.dark,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonLight: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  buttonTextLight: {
    color: COLORS.text,
  },
});
