export const mockBusinessConfig = {
  name: 'PedidoFlow',
  currency: 'MXN',
  allowAccountCreation: false,
};

export const mockMenuCategories = [
  { id: 'cat_1', name: 'Hamburguesas', active: true },
  { id: 'cat_2', name: 'Entradas', active: true },
  { id: 'cat_3', name: 'Bebidas', active: true },
  { id: 'cat_4', name: 'Postres', active: true },
];

export const mockMenuItems = [
  { id: 'menu_1', name: 'Hamburguesa clásica', category: 'Hamburguesas', price: 90, available: true, station: 'Cocina caliente' },
  { id: 'menu_2', name: 'Hamburguesa doble', category: 'Hamburguesas', price: 120, available: true, station: 'Cocina caliente' },
  { id: 'menu_3', name: 'Papas grandes', category: 'Entradas', price: 70, available: true, station: 'Freidora' },
  { id: 'menu_4', name: 'Aros de cebolla', category: 'Entradas', price: 75, available: true, station: 'Freidora' },
  { id: 'menu_5', name: 'Refresco', category: 'Bebidas', price: 35, available: true, station: 'Bebidas' },
  { id: 'menu_6', name: 'Agua mineral', category: 'Bebidas', price: 50, available: true, station: 'Bebidas' },
  { id: 'menu_7', name: 'Limonada', category: 'Bebidas', price: 45, available: true, station: 'Bebidas' },
  { id: 'menu_8', name: 'Brownie', category: 'Postres', price: 65, available: false, station: 'Postres' },
];

export const mockOrders = [
  {
    id: 'order_2',
    tableId: 'table_2',
    status: 'open',
    notes: '1 producto lleva más de 10 min',
    openedAt: '2026-03-31T19:18:00.000Z',
    subtotal: 245,
    items: [
      { id: 'line_21', name: 'Hamburguesa doble', quantity: 1, price: 120, notes: 'Sin jitomate', station: 'Cocina caliente', status: 'preparing' },
      { id: 'line_22', name: 'Papas grandes', quantity: 1, price: 70, notes: 'Extra queso', station: 'Freidora', status: 'pending' },
      { id: 'line_23', name: 'Refresco', quantity: 1, price: 35, notes: 'Sin hielo', station: 'Bebidas', status: 'ready' },
      { id: 'line_24', name: 'Limonada', quantity: 1, price: 20, notes: '', station: 'Bebidas', status: 'served' }
    ]
  },
  {
    id: 'order_4',
    tableId: 'table_4',
    status: 'open',
    notes: 'Dividir bebidas y alimentos al momento del cobro',
    openedAt: '2026-03-31T19:06:00.000Z',
    subtotal: 385,
    items: [
      { id: 'line_41', name: 'Hamburguesa clásica', quantity: 2, price: 90, notes: 'Una sin cebolla', station: 'Cocina caliente', status: 'preparing' },
      { id: 'line_42', name: 'Papas grandes', quantity: 1, price: 70, notes: 'Extra queso', station: 'Freidora', status: 'pending' },
      { id: 'line_43', name: 'Refresco', quantity: 1, price: 35, notes: 'Sin hielo', station: 'Bebidas', status: 'served' },
      { id: 'line_44', name: 'Agua mineral', quantity: 2, price: 50, notes: 'Sin observaciones', station: 'Bebidas', status: 'served' }
    ]
  },
  {
    id: 'order_5',
    tableId: 'table_5',
    status: 'open',
    notes: 'Cuenta casi lista',
    openedAt: '2026-03-31T18:51:00.000Z',
    subtotal: 510,
    items: [
      { id: 'line_51', name: 'Hamburguesa doble', quantity: 3, price: 120, notes: '', station: 'Cocina caliente', status: 'served' },
      { id: 'line_52', name: 'Agua mineral', quantity: 3, price: 50, notes: '', station: 'Bebidas', status: 'served' }
    ]
  },
  {
    id: 'order_7',
    tableId: 'table_7',
    status: 'open',
    notes: 'Requiere seguimiento inmediato',
    openedAt: '2026-03-31T18:58:00.000Z',
    subtotal: 320,
    items: [
      { id: 'line_71', name: 'Hamburguesa clásica', quantity: 2, price: 90, notes: '', station: 'Cocina caliente', status: 'preparing' },
      { id: 'line_72', name: 'Aros de cebolla', quantity: 1, price: 75, notes: '', station: 'Freidora', status: 'preparing' },
      { id: 'line_73', name: 'Refresco', quantity: 1, price: 35, notes: '', station: 'Bebidas', status: 'pending' },
      { id: 'line_74', name: 'Limonada', quantity: 1, price: 30, notes: '', station: 'Bebidas', status: 'served' }
    ]
  }
];

export const mockTables = [
  { id: 'table_1', number: 1, name: 'Mesa 1', seats: 4, status: 'libre', currentOrderId: null, currentTotal: 0, openedAt: null },
  { id: 'table_2', number: 2, name: 'Mesa 2', seats: 2, status: 'pendiente', currentOrderId: 'order_2', currentTotal: 245, openedAt: '2026-03-31T19:18:00.000Z' },
  { id: 'table_3', number: 3, name: 'Mesa 3', seats: 4, status: 'libre', currentOrderId: null, currentTotal: 0, openedAt: null },
  { id: 'table_4', number: 4, name: 'Mesa 4', seats: 4, status: 'ocupada', currentOrderId: 'order_4', currentTotal: 385, openedAt: '2026-03-31T19:06:00.000Z' },
  { id: 'table_5', number: 5, name: 'Mesa 5', seats: 4, status: 'por_cobrar', currentOrderId: 'order_5', currentTotal: 510, openedAt: '2026-03-31T18:51:00.000Z' },
  { id: 'table_6', number: 6, name: 'Mesa 6', seats: 2, status: 'ocupada', currentOrderId: null, currentTotal: 190, openedAt: '2026-03-31T19:31:00.000Z' },
  { id: 'table_7', number: 7, name: 'Mesa 7', seats: 6, status: 'retrasada', currentOrderId: 'order_7', currentTotal: 320, openedAt: '2026-03-31T18:58:00.000Z' },
  { id: 'table_8', number: 8, name: 'Mesa 8', seats: 4, status: 'libre', currentOrderId: null, currentTotal: 0, openedAt: null }
];

export const mockSales = [
  {
    id: 'sale_1',
    orderId: 'closed_1',
    tableId: 'table_1',
    tableNumber: 1,
    total: 290,
    paymentMethod: 'Tarjeta',
    closedAt: '2026-03-31T18:54:00.000Z',
    itemsSnapshot: [
      { id: 'sale_1_item_1', name: 'Hamburguesa clásica', quantity: 2, price: 90, station: 'Cocina caliente', notes: 'Una sin cebolla' },
      { id: 'sale_1_item_2', name: 'Refresco', quantity: 2, price: 35, station: 'Bebidas', notes: 'Sin hielo' },
      { id: 'sale_1_item_3', name: 'Papas grandes', quantity: 1, price: 40, station: 'Freidora', notes: '' }
    ]
  },
  {
    id: 'sale_2',
    orderId: 'closed_6',
    tableId: 'table_6',
    tableNumber: 6,
    total: 420,
    paymentMethod: 'Efectivo',
    closedAt: '2026-03-31T18:41:00.000Z',
    itemsSnapshot: [
      { id: 'sale_2_item_1', name: 'Hamburguesa doble', quantity: 2, price: 120, station: 'Cocina caliente', notes: '' },
      { id: 'sale_2_item_2', name: 'Agua mineral', quantity: 2, price: 50, station: 'Bebidas', notes: '' },
      { id: 'sale_2_item_3', name: 'Papas grandes', quantity: 1, price: 80, station: 'Freidora', notes: 'Extra queso' }
    ]
  },
  {
    id: 'sale_3',
    orderId: 'closed_3',
    tableId: 'table_3',
    tableNumber: 3,
    total: 185,
    paymentMethod: 'Transferencia',
    closedAt: '2026-03-31T18:22:00.000Z',
    itemsSnapshot: [
      { id: 'sale_3_item_1', name: 'Brownie', quantity: 1, price: 65, station: 'Postres', notes: '' },
      { id: 'sale_3_item_2', name: 'Limonada', quantity: 2, price: 45, station: 'Bebidas', notes: '' },
      { id: 'sale_3_item_3', name: 'Papas grandes', quantity: 1, price: 30, station: 'Freidora', notes: '' }
    ]
  },
  {
    id: 'sale_4',
    orderId: 'closed_5',
    tableId: 'table_5',
    tableNumber: 5,
    total: 510,
    paymentMethod: 'Tarjeta',
    closedAt: '2026-03-31T17:59:00.000Z',
    itemsSnapshot: [
      { id: 'sale_4_item_1', name: 'Hamburguesa doble', quantity: 3, price: 120, station: 'Cocina caliente', notes: '' },
      { id: 'sale_4_item_2', name: 'Agua mineral', quantity: 3, price: 50, station: 'Bebidas', notes: '' }
    ]
  },
  {
    id: 'sale_5',
    orderId: 'closed_2',
    tableId: 'table_2',
    tableNumber: 2,
    total: 240,
    paymentMethod: 'Efectivo',
    closedAt: '2026-03-31T17:30:00.000Z',
    itemsSnapshot: [
      { id: 'sale_5_item_1', name: 'Hamburguesa clásica', quantity: 1, price: 90, station: 'Cocina caliente', notes: '' },
      { id: 'sale_5_item_2', name: 'Refresco', quantity: 2, price: 35, station: 'Bebidas', notes: '' },
      { id: 'sale_5_item_3', name: 'Aros de cebolla', quantity: 1, price: 80, station: 'Freidora', notes: '' }
    ]
  }
];
