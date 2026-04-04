import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors.js';

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textSecondary,
  tabBarStyle: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    height: 72,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '700',
  },
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="operation"
        options={{
          title: 'Operación',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: 'Cocina',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
