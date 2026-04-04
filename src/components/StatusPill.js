import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { STATUS_COLORS } from '../constants/colors.js';

export function StatusPill({ label }) {
  const key = String(label || '').toLowerCase();
  const palette = STATUS_COLORS[key] || { background: '#E2E8F0', text: '#334155' };

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}> 
      <Text style={[styles.text, { color: palette.text }]}>{humanizeLabel(label)}</Text>
    </View>
  );
}

function humanizeLabel(label) {
  const raw = String(label || '');
  return raw
    .replace(/_/g, ' ')
    .replace(/\w/g, (match) => match.toUpperCase());
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
