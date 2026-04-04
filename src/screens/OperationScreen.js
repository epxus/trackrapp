import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { EmptyState } from '../components/EmptyState.js';
import { InfoCard } from '../components/InfoCard.js';
import { OrderItemCard } from '../components/OrderItemCard.js';
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { StatCard } from '../components/StatCard.js';
import { StatusPill } from '../components/StatusPill.js';
import { TableCard } from '../components/TableCard.js';
import { COLORS } from '../constants/colors.js';
import { PAYMENT_METHOD } from '../constants/statuses.js';
import { useAppData } from '../context/AppDataContext.js';
import { calculateOrderSummary, formatCurrency, getOrderProgress } from '../utils/orderUtils.js';

export default function OperationScreen() {
  const {
    tables,
    orders,
    sales,
    menuItems,
    loadingData,
    isUsingMockData,
    openTableAccount,
    addMenuItemToTable,
    closeTableAccount,
  } = useAppData();

  const [selectedTableId, setSelectedTableId] = useState(null);
  const [busyAction, setBusyAction] = useState(false);
  const [isOpenAccountModalVisible, setIsOpenAccountModalVisible] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [peopleInput, setPeopleInput] = useState('2');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [notesInput, setNotesInput] = useState('');

  useEffect(() => {
    if (!tables.length) return;
    if (!selectedTableId) {
      const preferred = tables.find((table) => table.currentOrderId) || tables[0];
      setSelectedTableId(preferred.id);
      return;
    }
    if (!tables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) || tables[0],
    [tables, selectedTableId]
  );

  const selectedOrder = useMemo(
    () => orders.find((order) => order.tableId === selectedTable?.id && order.status !== 'closed') || null,
    [orders, selectedTable]
  );

  const availableMenuItems = useMemo(() => {
    const search = menuSearch.trim().toLowerCase();
    return menuItems
      .filter((item) => item.available)
      .filter((item) => {
        if (!search) return true;
        return (
          item.name.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.station.toLowerCase().includes(search)
        );
      });
  }, [menuItems, menuSearch]);

  useEffect(() => {
    if (!isProductModalVisible) return;
    if (!availableMenuItems.length) {
      setSelectedMenuItemId(null);
      return;
    }
    if (!selectedMenuItemId || !availableMenuItems.some((item) => item.id === selectedMenuItemId)) {
      setSelectedMenuItemId(availableMenuItems[0].id);
    }
  }, [availableMenuItems, isProductModalVisible, selectedMenuItemId]);

  const selectedMenuItem = useMemo(
    () => availableMenuItems.find((item) => item.id === selectedMenuItemId) || null,
    [availableMenuItems, selectedMenuItemId]
  );

  const selectedOrderSummary = useMemo(
    () => calculateOrderSummary(selectedOrder?.items ?? []),
    [selectedOrder]
  );

  const stats = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const activeTables = tables.filter((table) => table.currentOrderId).length;
    const openOrders = orders.filter((order) => order.status !== 'closed').length;
    const avgTicket = sales.length ? Math.round(totalSales / sales.length) : 0;
    return { totalSales, activeTables, openOrders, avgTicket };
  }, [tables, orders, sales]);

  const pendingOrders = useMemo(() => orders.filter((order) => order.status !== 'closed'), [orders]);

  const resetProductForm = () => {
    setMenuSearch('');
    setQuantityInput('1');
    setNotesInput('');
  };

  const openOpenAccountModal = () => {
    if (!selectedTable) return;
    setPeopleInput(String(selectedTable.seats || 2));
    setIsOpenAccountModalVisible(true);
  };

  const closeOpenAccountModal = () => {
    if (busyAction) return;
    setIsOpenAccountModalVisible(false);
    setPeopleInput(String(selectedTable?.seats || 2));
  };

  const openAddProductModal = () => {
    if (!selectedTable || !selectedOrder) return;
    resetProductForm();
    setSelectedMenuItemId(null);
    setIsProductModalVisible(true);
  };

  const closeAddProductModal = () => {
    if (busyAction) return;
    setIsProductModalVisible(false);
    resetProductForm();
  };

  const openCloseAccountModal = () => {
    if (!selectedTable || !selectedOrder) return;
    setIsCloseModalVisible(true);
  };

  const closeCloseAccountModal = () => {
    if (busyAction) return;
    setIsCloseModalVisible(false);
  };

  const handleConfirmOpenAccount = async () => {
    if (!selectedTable) return;

    const people = Number(peopleInput);
    if (!Number.isFinite(people) || people < 1) {
      Alert.alert('Cantidad inválida', 'Captura un número válido de personas para abrir la cuenta.');
      return;
    }

    try {
      setBusyAction(true);
      await openTableAccount(selectedTable.id, people);
      setIsOpenAccountModalVisible(false);
    } catch (error) {
      Alert.alert('No se pudo abrir la cuenta', error.message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedTable || !selectedOrder) return;

    const quantity = Number(quantityInput);
    if (!selectedMenuItem) {
      Alert.alert('Selecciona un producto', 'Debes elegir un producto disponible para agregarlo a la mesa.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      Alert.alert('Cantidad inválida', 'Captura una cantidad mayor o igual a 1.');
      return;
    }

    try {
      setBusyAction(true);
      await addMenuItemToTable({
        tableId: selectedTable.id,
        menuItemId: selectedMenuItem.id,
        quantity,
        notes: notesInput,
      });
      setIsProductModalVisible(false);
      resetProductForm();
    } catch (error) {
      Alert.alert('No se pudo agregar el producto', error.message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmCloseAccount = async () => {
    if (!selectedTable) return;

    try {
      setBusyAction(true);
      await closeTableAccount(selectedTable.id, PAYMENT_METHOD.EFECTIVO);
      setIsCloseModalVisible(false);
    } catch (error) {
      Alert.alert('No se pudo cerrar la cuenta', error.message);
    } finally {
      setBusyAction(false);
    }
  };

  if (loadingData) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Cargando operación...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Operación"
        subtitle="Mesas, pedidos y cuentas en una sola vista móvil."
        rightContent={
          <View style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
          </View>
        }
      />

      {isUsingMockData ? (
        <InfoCard
          tone="warning"
          title="Modo demo"
          description="La app compila y navega aunque todavía no configures Firebase. Cuando agregues credenciales, cambiará a tiempo real con Firestore."
        />
      ) : (
        <InfoCard
          tone="success"
          title="Firebase conectado"
          description="Ya puedes abrir cuentas, agregar productos y cerrar mesas usando Firestore en tiempo real."
        />
      )}

      <View style={styles.grid}>
        <StatCard
          label="Venta del día"
          value={formatCurrency(stats.totalSales)}
          hint={`${sales.length} ventas cerradas`}
          icon={<Ionicons name="wallet-outline" size={18} color={COLORS.text} />}
        />
        <StatCard
          label="Mesas activas"
          value={String(stats.activeTables)}
          hint={`${tables.length - stats.activeTables} libres`}
          icon={<Ionicons name="grid-outline" size={18} color={COLORS.text} />}
        />
        <StatCard
          label="Pedidos abiertos"
          value={String(stats.openOrders)}
          hint="Actualización en vivo"
          icon={<Ionicons name="restaurant-outline" size={18} color={COLORS.text} />}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(stats.avgTicket)}
          hint="Basado en ventas cerradas"
          icon={<Ionicons name="bar-chart-outline" size={18} color={COLORS.text} />}
        />
      </View>

      <SectionHeader title="Mesas" subtitle="Selecciona una para ver su cuenta" actionLabel={`${tables.length} mesas`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            selected={selectedTable?.id === table.id}
            onPress={() => setSelectedTableId(table.id)}
          />
        ))}
      </ScrollView>

      {selectedTable ? (
        <View style={styles.panel}>
          <SectionHeader
            title={`Mesa ${selectedTable.number}`}
            subtitle={`${selectedTable.seats} asientos · cuenta actual ${formatCurrency(selectedTable.currentTotal || 0)}`}
          />

          <View style={styles.tableSummaryRow}>
            <StatusPill label={selectedTable.status} />
            <Text style={styles.tableMeta}>{selectedTable.openedAt ? 'Cuenta abierta' : 'Sin pedido activo'}</Text>
          </View>

          {selectedOrder ? (
            <>
              <View style={styles.orderSummaryBox}>
                <SummaryCell label="Productos" value={String(selectedOrderSummary.totalItems)} />
                <SummaryCell label="Pendientes" value={String(selectedOrderSummary.pendingItems)} />
                <SummaryCell label="Servidos" value={String(selectedOrderSummary.servedItems)} />
                <SummaryCell label="Progreso" value={`${getOrderProgress(selectedOrder.items)}%`} />
              </View>

              <View style={styles.listBlock}>
                {selectedOrder.items.length ? (
                  selectedOrder.items.map((item) => <OrderItemCard key={item.id} item={item} />)
                ) : (
                  <EmptyState title="Sin productos" description="Esta cuenta está abierta, pero todavía no tiene productos." />
                )}
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={openAddProductModal}
                  style={[styles.secondaryButton, styles.flexButton, busyAction && styles.disabledButton]}
                  disabled={busyAction}
                >
                  <Text style={styles.secondaryButtonText}>{busyAction ? 'Procesando...' : 'Agregar producto'}</Text>
                </Pressable>
                <Pressable
                  onPress={openCloseAccountModal}
                  style={[styles.primaryButton, styles.flexButton, busyAction && styles.disabledButton]}
                  disabled={busyAction}
                >
                  <Text style={styles.primaryButtonText}>Cerrar cuenta</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <EmptyState title="Mesa sin pedido" description="Abre una cuenta para empezar a registrar consumo." />
              <Pressable onPress={openOpenAccountModal} style={[styles.primaryButton, busyAction && styles.disabledButton]} disabled={busyAction}>
                <Text style={styles.primaryButtonText}>{busyAction ? 'Abriendo...' : 'Abrir cuenta'}</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      <SectionHeader title="Pendientes" subtitle="Lo que sigue activo en cocina o sala" actionLabel={`${pendingOrders.length} abiertos`} />
      <View style={styles.listBlock}>
        {pendingOrders.length ? (
          pendingOrders.map((order) => {
            const table = tables.find((entry) => entry.id === order.tableId);
            return (
              <View key={order.id} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View>
                    <Text style={styles.pendingTitle}>Mesa {table?.number || '—'}</Text>
                    <Text style={styles.pendingSubtitle}>{order.notes || 'Sin observaciones'}</Text>
                  </View>
                  <StatusPill label={table?.status || 'ocupada'} />
                </View>
                <Text style={styles.pendingCount}>{calculateOrderSummary(order.items).pendingItems} productos pendientes</Text>
              </View>
            );
          })
        ) : (
          <EmptyState title="Sin pendientes" description="No hay pedidos abiertos por atender en este momento." />
        )}
      </View>

      <Modal visible={isOpenAccountModalVisible} transparent animationType="fade" onRequestClose={closeOpenAccountModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.compactModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Abrir cuenta</Text>
                <Text style={styles.modalSubtitle}>Mesa {selectedTable?.number} · hasta {selectedTable?.seats || 0} asientos</Text>
              </View>
              <Pressable onPress={closeOpenAccountModal} style={styles.modalCloseButton} disabled={busyAction}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <View style={styles.openAccountSummary}>
              <View style={styles.openAccountSummaryRow}>
                <Text style={styles.openAccountSummaryLabel}>Estado actual</Text>
                <StatusPill label={selectedTable?.status || 'libre'} />
              </View>
              <View style={styles.openAccountSummaryRow}>
                <Text style={styles.openAccountSummaryLabel}>Asientos sugeridos</Text>
                <Text style={styles.openAccountSummaryValue}>{selectedTable?.seats || 0}</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Personas en la mesa</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  onPress={() => setPeopleInput(String(Math.max(1, Number(peopleInput || '1') - 1)))}
                  style={styles.quantityButton}
                  disabled={busyAction}
                >
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </Pressable>
                <TextInput
                  value={peopleInput}
                  onChangeText={setPeopleInput}
                  keyboardType="number-pad"
                  style={styles.quantityInput}
                  placeholder="2"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Pressable
                  onPress={() => setPeopleInput(String(Math.max(1, Number(peopleInput || '1') + 1)))}
                  style={styles.quantityButton}
                  disabled={busyAction}
                >
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </Pressable>
              </View>
            </View>

            <InfoCard
              tone="success"
              title="Inicio de servicio"
              description="Al confirmar se abrirá una cuenta vacía para esta mesa y quedará lista para agregar productos."
            />

            <View style={styles.modalActions}>
              <Pressable onPress={closeOpenAccountModal} style={styles.modalSecondaryButton} disabled={busyAction}>
                <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmOpenAccount}
                style={[styles.modalPrimaryButton, busyAction && styles.disabledButton]}
                disabled={busyAction}
              >
                <Text style={styles.modalPrimaryButtonText}>{busyAction ? 'Abriendo...' : 'Abrir cuenta'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isProductModalVisible} transparent animationType="fade" onRequestClose={closeAddProductModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Agregar producto</Text>
                <Text style={styles.modalSubtitle}>
                  Mesa {selectedTable?.number} · {selectedOrderSummary.totalItems} productos actuales
                </Text>
              </View>
              <Pressable onPress={closeAddProductModal} style={styles.modalCloseButton} disabled={busyAction}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <TextInput
              value={menuSearch}
              onChangeText={setMenuSearch}
              placeholder="Buscar por nombre, categoría o estación"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
            />

            <ScrollView style={styles.productList} contentContainerStyle={styles.productListContent}>
              {availableMenuItems.length ? (
                availableMenuItems.map((item) => {
                  const isSelected = item.id === selectedMenuItemId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedMenuItemId(item.id)}
                      style={[styles.productOption, isSelected && styles.productOptionSelected]}
                    >
                      <View style={styles.productOptionHeader}>
                        <View style={styles.productOptionInfo}>
                          <Text style={styles.productOptionTitle}>{item.name}</Text>
                          <Text style={styles.productOptionMeta}>{item.category} · {item.station}</Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={22} color={COLORS.textSecondary} />
                        )}
                      </View>
                      <Text style={styles.productOptionPrice}>{formatCurrency(item.price)}</Text>
                    </Pressable>
                  );
                })
              ) : (
                <EmptyState title="Sin coincidencias" description="No hay productos disponibles con esa búsqueda." />
              )}
            </ScrollView>

            <View style={styles.formRow}>
              <View style={styles.fieldBlockCompact}>
                <Text style={styles.fieldLabel}>Cantidad</Text>
                <View style={styles.quantityRow}>
                  <Pressable
                    onPress={() => setQuantityInput(String(Math.max(1, Number(quantityInput || '1') - 1)))}
                    style={styles.quantityButton}
                    disabled={busyAction}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.text} />
                  </Pressable>
                  <TextInput
                    value={quantityInput}
                    onChangeText={setQuantityInput}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                    placeholder="1"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Pressable
                    onPress={() => setQuantityInput(String(Math.max(1, Number(quantityInput || '1') + 1)))}
                    style={styles.quantityButton}
                    disabled={busyAction}
                  >
                    <Ionicons name="add" size={18} color={COLORS.text} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldBlockCompact}>
                <Text style={styles.fieldLabel}>Importe estimado</Text>
                <View style={styles.amountPreview}>
                  <Text style={styles.amountPreviewText}>
                    {formatCurrency((selectedMenuItem?.price ?? 0) * Math.max(1, Number(quantityInput || '1')))}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Notas</Text>
              <TextInput
                value={notesInput}
                onChangeText={setNotesInput}
                placeholder="Ej. sin cebolla, extra queso..."
                placeholderTextColor={COLORS.textSecondary}
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={closeAddProductModal} style={styles.modalSecondaryButton} disabled={busyAction}>
                <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleAddProduct} style={[styles.modalPrimaryButton, busyAction && styles.disabledButton]} disabled={busyAction}>
                <Text style={styles.modalPrimaryButtonText}>{busyAction ? 'Agregando...' : 'Agregar a la mesa'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isCloseModalVisible} transparent animationType="fade" onRequestClose={closeCloseAccountModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cerrar cuenta</Text>
                <Text style={styles.modalSubtitle}>Mesa {selectedTable?.number} · cobro en efectivo</Text>
              </View>
              <Pressable onPress={closeCloseAccountModal} style={styles.modalCloseButton} disabled={busyAction}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </Pressable>
            </View>

            <View style={styles.closeSummaryCard}>
              <View style={styles.closeSummaryRow}>
                <Text style={styles.closeSummaryLabel}>Productos</Text>
                <Text style={styles.closeSummaryValue}>{selectedOrderSummary.totalItems}</Text>
              </View>
              <View style={styles.closeSummaryRow}>
                <Text style={styles.closeSummaryLabel}>Pendientes</Text>
                <Text style={styles.closeSummaryValue}>{selectedOrderSummary.pendingItems}</Text>
              </View>
              <View style={styles.closeSummaryRow}>
                <Text style={styles.closeSummaryLabel}>Método de pago</Text>
                <Text style={styles.cashPill}>Efectivo</Text>
              </View>
              <View style={[styles.closeSummaryRow, styles.closeSummaryTotalRow]}>
                <Text style={styles.closeSummaryTotalLabel}>Total a cobrar</Text>
                <Text style={styles.closeSummaryTotalValue}>{formatCurrency(selectedOrderSummary.subtotal)}</Text>
              </View>
            </View>

            <InfoCard
              tone="warning"
              title="Confirmación de cobro"
              description="Por ahora el cierre de cuenta quedará registrado únicamente como efectivo y liberará la mesa al confirmar."
            />

            <View style={styles.modalActions}>
              <Pressable onPress={closeCloseAccountModal} style={styles.modalSecondaryButton} disabled={busyAction}>
                <Text style={styles.modalSecondaryButtonText}>Volver</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmCloseAccount}
                style={[styles.modalPrimaryButton, busyAction && styles.disabledButton]}
                disabled={busyAction}
              >
                <Text style={styles.modalPrimaryButtonText}>{busyAction ? 'Cerrando...' : 'Cobrar en efectivo'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function SummaryCell({ label, value }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  horizontalList: {
    paddingRight: 8,
  },
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 16,
  },
  tableSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  orderSummaryBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCell: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
    padding: 12,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  listBlock: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
  pendingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  pendingTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  pendingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  pendingCount: {
    color: COLORS.text,
    fontWeight: '700',
  },
  openAccountSummary: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    padding: 14,
    gap: 12,
  },
  openAccountSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  openAccountSummaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  openAccountSummaryValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 16,
  },
  compactModalCard: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 14,
    color: COLORS.text,
  },
  productList: {
    maxHeight: 280,
  },
  productListContent: {
    gap: 12,
    paddingBottom: 4,
  },
  productOption: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
    gap: 10,
  },
  productOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  productOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  productOptionInfo: {
    flex: 1,
    gap: 4,
  },
  productOptionTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
  productOptionMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  productOptionPrice: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldBlockCompact: {
    flex: 1,
    minWidth: 180,
    gap: 8,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    color: COLORS.text,
    paddingHorizontal: 12,
    fontWeight: '700',
  },
  amountPreview: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  amountPreviewText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  notesInput: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalSecondaryButtonText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalPrimaryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  closeSummaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    padding: 16,
    gap: 12,
  },
  closeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  closeSummaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  closeSummaryValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  cashPill: {
    color: COLORS.success,
    fontWeight: '800',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  closeSummaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  closeSummaryTotalLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeSummaryTotalValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
});
