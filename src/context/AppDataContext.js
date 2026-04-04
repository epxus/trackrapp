import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { hasFirebaseConfig } from '../firebase/client.js';
import { mockMenuItems, mockOrders, mockSales, mockTables } from '../mocks/mockData.js';
import { createMenuItem, subscribeToMenuItems, toggleMenuItemAvailability } from '../services/menuService.js';
import { addOrderItem, updateOrderItemStatus } from '../services/orderItemService.js';
import { closeOrder, openOrder, recalculateOrderTotals, subscribeToOrders } from '../services/ordersService.js';
import { subscribeToSales } from '../services/salesService.js';
import { seedFirestoreWithMockData } from '../services/seedService.js';
import { subscribeToTables } from '../services/tablesService.js';
import { useAuth } from './AuthContext.js';
import { calculateOrderSummary, getTableStatusLabel } from '../utils/orderUtils.js';
import { ORDER_STATUS, PAYMENT_METHOD, TABLE_STATUS } from '../constants/statuses.js';

const AppDataContext = createContext(null);
const ITEM_STATUS_FLOW = ['pending', 'preparing', 'ready', 'served'];

function cloneDemoState() {
  return {
    tables: JSON.parse(JSON.stringify(mockTables)),
    orders: JSON.parse(JSON.stringify(mockOrders)),
    menuItems: JSON.parse(JSON.stringify(mockMenuItems)),
    sales: JSON.parse(JSON.stringify(mockSales)),
  };
}

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) {
      setTables([]);
      setOrders([]);
      setMenuItems([]);
      setSales([]);
      setLoadingData(false);
      return undefined;
    }

    if (!hasFirebaseConfig) {
      const demoState = cloneDemoState();
      setTables(demoState.tables);
      setOrders(demoState.orders);
      setMenuItems(demoState.menuItems);
      setSales(demoState.sales);
      setLoadingData(false);
      return undefined;
    }

    setLoadingData(true);

    const unsubscribers = [
      subscribeToTables((nextTables) => {
        setTables(nextTables);
        setLoadingData(false);
      }),
      subscribeToOrders((nextOrders) => setOrders(nextOrders)),
      subscribeToMenuItems((nextItems) => setMenuItems(nextItems)),
      subscribeToSales((nextSales) => setSales(nextSales)),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [user]);

  const upsertLocalOrder = (nextOrder) => {
    setOrders((currentOrders) => {
      const exists = currentOrders.some((entry) => entry.id === nextOrder.id);
      if (!exists) {
        return [nextOrder, ...currentOrders];
      }
      return currentOrders.map((entry) => (entry.id === nextOrder.id ? nextOrder : entry));
    });
  };

  const openTableAccount = async (tableId, people = 1) => {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) {
      throw new Error('La mesa no existe.');
    }

    if (hasFirebaseConfig) {
      return openOrder({
        tableId,
        people,
        openedBy: user?.uid ?? 'unknown',
        openedByName: user?.displayName ?? user?.email ?? 'Mesero',
      });
    }

    const orderId = `order_${Date.now()}`;
    const openedAt = new Date().toISOString();
    const nextOrder = {
      id: orderId,
      tableId,
      status: ORDER_STATUS.OPEN,
      notes: '',
      openedAt,
      openedBy: user?.uid ?? 'demo',
      openedByName: user?.displayName ?? user?.email ?? 'Mesero demo',
      people,
      subtotal: 0,
      total: 0,
      items: [],
      updatedAt: openedAt,
    };

    upsertLocalOrder(nextOrder);
    setTables((currentTables) =>
      currentTables.map((entry) =>
        entry.id === tableId
          ? {
              ...entry,
              currentOrderId: orderId,
              currentTotal: 0,
              status: TABLE_STATUS.OCUPADA,
              openedAt,
            }
          : entry
      )
    );

    return { orderId, tableId };
  };

  const addMenuItemToTable = async ({ tableId, menuItemId, quantity = 1, notes = '' }) => {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) {
      throw new Error('La mesa no existe.');
    }

    const menuItem = menuItems.find((entry) => entry.id === menuItemId);
    if (!menuItem) {
      throw new Error('El producto no existe.');
    }

    if (!menuItem.available) {
      throw new Error('El producto está pausado.');
    }

    let order = orders.find((entry) => entry.tableId === tableId && entry.status !== ORDER_STATUS.CLOSED);

    if (!order) {
      const result = await openTableAccount(tableId, 1);
      const nextOrderId = result?.orderId;
      order = nextOrderId
        ? orders.find((entry) => entry.id === nextOrderId) || {
            id: nextOrderId,
            tableId,
            status: ORDER_STATUS.OPEN,
            items: [],
          }
        : null;
    }

    if (!order?.id) {
      throw new Error('No fue posible abrir la cuenta para la mesa.');
    }

    if (hasFirebaseConfig) {
      await addOrderItem({
        orderId: order.id,
        menuItemId: menuItem.id,
        nombreSnapshot: menuItem.name,
        precioSnapshot: Number(menuItem.price),
        kitchenArea: menuItem.station,
        cantidad: quantity,
        notas: notes,
      });
      return;
    }

    const nextItems = [
      ...(order.items ?? []),
      {
        id: `line_${Date.now()}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity,
        station: menuItem.station,
        notes: notes?.trim?.() || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    const summary = calculateOrderSummary(nextItems);
    const nextStatus = getTableStatusLabel(table, { ...order, items: nextItems, status: ORDER_STATUS.OPEN }) === TABLE_STATUS.POR_COBRAR
      ? ORDER_STATUS.READY_FOR_PAYMENT
      : ORDER_STATUS.OPEN;

    setOrders((currentOrders) =>
      currentOrders.map((entry) =>
        entry.id === order.id
          ? {
              ...entry,
              items: nextItems,
              subtotal: summary.subtotal,
              total: summary.subtotal,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : entry
      )
    );

    setTables((currentTables) =>
      currentTables.map((entry) =>
        entry.id === tableId
          ? {
              ...entry,
              currentOrderId: order.id,
              currentTotal: summary.subtotal,
              status: getTableStatusLabel(entry, { ...order, items: nextItems, status: nextStatus }),
              openedAt: entry.openedAt || new Date().toISOString(),
            }
          : entry
      )
    );
  };

  const advanceOrderItemStatus = async (orderId, itemId) => {
    const order = orders.find((entry) => entry.id === orderId);
    if (!order) return;

    const targetItem = (order.items ?? []).find((item) => item.id === itemId);
    if (!targetItem) return;

    const currentIndex = ITEM_STATUS_FLOW.indexOf(targetItem.status);
    const nextStatus = ITEM_STATUS_FLOW[Math.min(currentIndex + 1, ITEM_STATUS_FLOW.length - 1)];

    if (hasFirebaseConfig) {
      await updateOrderItemStatus(orderId, itemId, nextStatus);
      return;
    }

    const nextItems = (order.items ?? []).map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    const summary = calculateOrderSummary(nextItems);
    const nextOrderStatus = nextItems.every((item) => item.status === 'served')
      ? ORDER_STATUS.READY_FOR_PAYMENT
      : ORDER_STATUS.OPEN;

    setOrders((currentOrders) =>
      currentOrders.map((entry) =>
        entry.id === orderId
          ? {
              ...entry,
              items: nextItems,
              subtotal: summary.subtotal,
              total: summary.subtotal,
              status: nextOrderStatus,
              updatedAt: new Date().toISOString(),
            }
          : entry
      )
    );

    setTables((currentTables) =>
      currentTables.map((entry) =>
        entry.id === order.tableId
          ? {
              ...entry,
              status: getTableStatusLabel(entry, { ...order, items: nextItems, status: nextOrderStatus }),
              currentTotal: summary.subtotal,
            }
          : entry
      )
    );
  };

  const closeTableAccount = async (tableId, paymentMethod = PAYMENT_METHOD.EFECTIVO) => {
    const table = tables.find((entry) => entry.id === tableId);
    const order = orders.find((entry) => entry.tableId === tableId && entry.status !== ORDER_STATUS.CLOSED);
    if (!table || !order) {
      Alert.alert('Sin pedido activo', 'La mesa seleccionada no tiene una cuenta abierta.');
      return;
    }

    const summary = calculateOrderSummary(order.items ?? []);
    const salePayload = {
      orderId: order.id,
      tableId: table.id,
      tableNumber: table.number,
      total: summary.subtotal,
      paymentMethod,
      itemsSnapshot: order.items ?? [],
      closedAt: new Date().toISOString(),
    };

    if (hasFirebaseConfig) {
      await closeOrder({
        orderId: order.id,
        paymentMethod,
        closedBy: user?.uid ?? 'unknown',
        closedByName: user?.displayName ?? user?.email ?? 'Caja',
      });
      return;
    }

    setSales((currentSales) => [{ id: `sale_${Date.now()}`, ...salePayload }, ...currentSales]);
    setOrders((currentOrders) =>
      currentOrders.map((entry) =>
        entry.id === order.id
          ? {
              ...entry,
              status: ORDER_STATUS.CLOSED,
              closedAt: salePayload.closedAt,
            }
          : entry
      )
    );
    setTables((currentTables) =>
      currentTables.map((entry) =>
        entry.id === table.id
          ? { ...entry, status: TABLE_STATUS.LIBRE, currentOrderId: null, currentTotal: 0, openedAt: null }
          : entry
      )
    );
  };

  const createMenuProduct = async ({ name, category, price, station, available = true }) => {
    if (hasFirebaseConfig) {
      return createMenuItem({ name, category, price, station, available });
    }

    const nextItem = {
      id: `menu_${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      station: station.trim(),
      available: Boolean(available),
    };

    setMenuItems((currentItems) => [...currentItems, nextItem]);
    return nextItem;
  };

  const toggleMenuAvailability = async (menuItemId, nextValue) => {
    if (hasFirebaseConfig) {
      await toggleMenuItemAvailability(menuItemId, nextValue);
      return;
    }

    setMenuItems((currentItems) =>
      currentItems.map((item) =>
        item.id === menuItemId
          ? { ...item, available: Boolean(nextValue) }
          : item
      )
    );
  };

  const refreshOrderTotals = async (orderId) => {
    if (hasFirebaseConfig) {
      await recalculateOrderTotals(orderId);
      return;
    }

    const order = orders.find((entry) => entry.id === orderId);
    if (!order) return;

    const summary = calculateOrderSummary(order.items ?? []);
    const table = tables.find((entry) => entry.id === order.tableId);
    const nextStatus = (order.items ?? []).every((item) => item.status === 'served')
      ? ORDER_STATUS.READY_FOR_PAYMENT
      : ORDER_STATUS.OPEN;

    setOrders((currentOrders) =>
      currentOrders.map((entry) =>
        entry.id === orderId
          ? {
              ...entry,
              subtotal: summary.subtotal,
              total: summary.subtotal,
              status: nextStatus,
            }
          : entry
      )
    );

    if (table) {
      setTables((currentTables) =>
        currentTables.map((entry) =>
          entry.id === table.id
            ? {
                ...entry,
                currentTotal: summary.subtotal,
                status: getTableStatusLabel(entry, { ...order, items: order.items ?? [], status: nextStatus }),
              }
            : entry
        )
      );
    }
  };

  const seedDemoData = async () => {
    if (!hasFirebaseConfig) {
      Alert.alert('Modo demo', 'Ya estás viendo los datos mock localmente.');
      return;
    }

    try {
      await seedFirestoreWithMockData();
      Alert.alert('Listo', 'Se cargaron datos demo en Firestore.');
    } catch (error) {
      Alert.alert('No se pudo cargar demo', error.message);
    }
  };

  const value = useMemo(
    () => ({
      tables,
      orders,
      menuItems,
      sales,
      loadingData,
      isUsingMockData: !hasFirebaseConfig,
      openTableAccount,
      addMenuItemToTable,
      advanceOrderItemStatus,
      closeTableAccount,
      createMenuProduct,
      toggleMenuAvailability,
      refreshOrderTotals,
      seedDemoData,
    }),
    [tables, orders, menuItems, sales, loadingData, user]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData debe usarse dentro de AppDataProvider');
  }
  return context;
}
