import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader.js';
import { InfoCard } from '../components/InfoCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { useAuth } from '../context/AuthContext.js';
import { formatCurrency } from '../utils/orderUtils.js';

const cards = [
  {
    title: 'Datos del negocio',
    description: 'Nombre comercial, horarios, moneda, impuestos y datos fiscales.',
  },
  {
    title: 'Mesas y zonas',
    description: 'Distribución del salón, numeración, capacidad y áreas especiales.',
  },
  {
    title: 'Roles y permisos',
    description: 'Accesos para dueño, caja, mesero y cocina.',
  },
  {
    title: 'Impresión y tickets',
    description: 'Formato de ticket, datos legales y envío a cocina.',
  },
];

export default function SettingsScreen() {
  const { signOut, usingFirebaseAuth, user } = useAuth();
  const { isUsingMockData, seedDemoData, tables, createTableEntry, updateTableEntry, businessConfig, saveBusinessConfig } = useAppData();
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [form, setForm] = useState({
    number: '',
    name: '',
    seats: '4',
    zone: 'Principal',
  });

  const orderedTables = useMemo(
    () => [...tables].sort((a, b) => Number(a.number || 0) - Number(b.number || 0)),
    [tables]
  );

  const openCreateTableModal = () => {
    setEditingTableId(null);
    setForm({ number: String(orderedTables.length + 1), name: '', seats: '4', zone: 'Principal' });
    setIsTableModalVisible(true);
  };

  const openEditTableModal = (table) => {
    setEditingTableId(table.id);
    setForm({
      number: String(table.number ?? ''),
      name: table.name ?? '',
      seats: String(table.seats ?? 4),
      zone: table.zone ?? 'Principal',
    });
    setIsTableModalVisible(true);
  };

  const closeTableModal = () => {
    if (savingTable) return;
    setIsTableModalVisible(false);
    setEditingTableId(null);
  };

  const handleSaveTable = async () => {
    const number = Number(form.number);
    const seats = Number(form.seats);

    if (!Number.isFinite(number) || number < 1) {
      Alert.alert('Número inválido', 'La mesa debe tener un número mayor o igual a 1.');
      return;
    }

    if (!Number.isFinite(seats) || seats < 1) {
      Alert.alert('Capacidad inválida', 'La capacidad debe ser mayor o igual a 1.');
      return;
    }

    const duplicated = orderedTables.find(
      (table) => Number(table.number) === number && table.id !== editingTableId
    );
    if (duplicated) {
      Alert.alert('Mesa duplicada', 'Ya existe otra mesa con ese número.');
      return;
    }

    try {
      setSavingTable(true);
      const payload = {
        number,
        seats,
        name: form.name,
        zone: form.zone,
      };

      if (editingTableId) {
        await updateTableEntry(editingTableId, payload);
      } else {
        await createTableEntry(payload);
      }

      closeTableModal();
    } catch (error) {
      Alert.alert('No se pudo guardar la mesa', error.message);
    } finally {
      setSavingTable(false);
    }
  };

  const toggleAccountCreation = async () => {
    try {
      await saveBusinessConfig({
        allowAccountCreation: !businessConfig?.allowAccountCreation,
      });
    } catch (error) {
      Alert.alert('No se pudo actualizar la configuración', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('No se pudo cerrar sesión', error.message);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Ajustes"
        subtitle="Configuración, arquitectura y acciones técnicas de arranque."
        rightContent={
          <Pressable onPress={openCreateTableModal} style={styles.headerButton}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </Pressable>
        }
      />

      <InfoCard
        tone={isUsingMockData ? 'warning' : 'success'}
        title={isUsingMockData ? 'Firebase pendiente' : 'Firebase activo'}
        description={isUsingMockData
          ? 'Completa el archivo .env con tus credenciales para conectar Auth y Firestore.'
          : 'La app ya está lista para trabajar con autenticación y tiempo real sobre Firestore.'}
      />

      <View style={styles.userCard}>
        <Text style={styles.userTitle}>Sesión actual</Text>
        <Text style={styles.userEmail}>{user?.email || 'Sin usuario'}</Text>
        <Text style={styles.userMeta}>{usingFirebaseAuth ? 'Autenticación real con Firebase' : 'Autenticación demo local'}</Text>
      </View>


      <SectionHeader title="Operación del negocio" subtitle="Controla reglas globales sin tocar código" />
      <View style={styles.configCard}>
        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configTitle}>Creación de cuentas</Text>
            <Text style={styles.configDescription}>
              {businessConfig?.allowAccountCreation
                ? 'Actualmente está habilitada. Los meseros pueden abrir cuentas nuevas.'
                : 'Actualmente está deshabilitada. Solo podrás operar cuentas existentes.'}
            </Text>
          </View>
          <Pressable onPress={toggleAccountCreation} style={[styles.toggleButton, businessConfig?.allowAccountCreation ? styles.toggleButtonDanger : styles.toggleButtonSuccess]}>
            <Text style={styles.toggleButtonText}>
              {businessConfig?.allowAccountCreation ? 'Deshabilitar' : 'Habilitar'}
            </Text>
          </Pressable>
        </View>
      </View>

      <SectionHeader title="Arquitectura base" subtitle="Bloques recomendados para el crecimiento del proyecto" />
      <View style={styles.cardsGrid}>
        {cards.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Mesas y zonas" subtitle="Crea o edita mesas sin salir de la app" />
      <View style={styles.tableSummaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Mesas</Text>
          <Text style={styles.summaryValue}>{orderedTables.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Capacidad total</Text>
          <Text style={styles.summaryValue}>{orderedTables.reduce((sum, table) => sum + Number(table.seats || 0), 0)}</Text>
        </View>
      </View>

      <View style={styles.tableList}>
        {orderedTables.map((table) => (
          <View key={table.id} style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <View>
                <Text style={styles.tableTitle}>{table.name || `Mesa ${table.number}`}</Text>
                <Text style={styles.tableMeta}>Mesa #{table.number} · {table.zone || 'Principal'}</Text>
              </View>
              <Pressable onPress={() => openEditTableModal(table)} style={styles.editButton}>
                <Ionicons name="create-outline" size={16} color={COLORS.text} />
              </Pressable>
            </View>
            <View style={styles.tableFooter}>
              <Text style={styles.tableCapacity}>{table.seats || 0} personas</Text>
              <Text style={styles.tableAmount}>{formatCurrency(table.currentTotal || 0)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionsBlock}>
        <Pressable onPress={seedDemoData} style={styles.primaryButton}>
          <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Cargar demo en Firestore</Text>
        </Pressable>
        <Pressable onPress={handleLogout} style={styles.secondaryButton}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.text} />
          <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <Modal visible={isTableModalVisible} transparent animationType="fade" onRequestClose={closeTableModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingTableId ? 'Editar mesa' : 'Nueva mesa'}</Text>
            <Text style={styles.modalDescription}>Administra numeración, capacidad y zona del salón desde este formulario.</Text>

            <Text style={styles.fieldLabel}>Número de mesa</Text>
            <TextInput
              value={form.number}
              onChangeText={(value) => setForm((current) => ({ ...current, number: value.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Nombre visible</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Ej. Terraza 1"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Capacidad</Text>
            <TextInput
              value={form.seats}
              onChangeText={(value) => setForm((current) => ({ ...current, seats: value.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Zona</Text>
            <TextInput
              value={form.zone}
              onChangeText={(value) => setForm((current) => ({ ...current, zone: value }))}
              placeholder="Principal"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={closeTableModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSaveTable} style={styles.confirmButton} disabled={savingTable}>
                <Text style={styles.confirmButtonText}>{savingTable ? 'Guardando...' : 'Guardar mesa'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 6,
  },
  userTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  userEmail: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  userMeta: {
    color: COLORS.textSecondary,
  },
  cardsGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tableSummaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  summaryValue: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 24,
  },
  tableList: {
    gap: 12,
  },
  tableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tableTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  tableMeta: {
    marginTop: 4,
    color: COLORS.textSecondary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableCapacity: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  tableAmount: {
    color: COLORS.text,
    fontWeight: '800',
  },
  actionsBlock: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  fieldLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
