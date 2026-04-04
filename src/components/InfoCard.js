import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors.js';

const toneMap = {
  neutral: { backgroundColor: '#EFF6FF', textColor: '#1D4ED8' },
  warning: { backgroundColor: '#FFFBEB', textColor: '#B45309' },
  success: { backgroundColor: '#F0FDF4', textColor: '#15803D' },
};

export function InfoCard({ title, description, tone = 'neutral', actionLabel, onAction }) {
  const palette = toneMap[tone] || toneMap.neutral;

  return (
    <View style={[styles.card, { backgroundColor: palette.backgroundColor }]}> 
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.textColor }]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  content: {
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.dark,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
