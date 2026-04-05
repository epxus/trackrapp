export function calculateOrderSummary(items = []) {
  return items.reduce(
    (summary, item) => {
      const quantity = Number(item.quantity ?? 0);
      const price = Number(item.price ?? 0);
      const lineTotal = quantity * price;
      const status = item.status ?? 'pending';

      summary.subtotal += lineTotal;
      summary.totalItems += quantity;

      if (status === 'served') {
        summary.servedItems += quantity;
      } else if (status === 'ready' || status === 'preparing' || status === 'pending') {
        summary.pendingItems += quantity;
      }

      return summary;
    },
    {
      subtotal: 0,
      totalItems: 0,
      pendingItems: 0,
      servedItems: 0,
    }
  );
}

export function getOrderProgress(items = []) {
  const { totalItems, servedItems } = calculateOrderSummary(items);
  if (!totalItems) return 0;
  return Math.round((servedItems / totalItems) * 100);
}

export function getTableStatusLabel(table, order) {
  if (!order || order.status === 'closed') return 'libre';

  const items = order.items ?? [];
  if (!items.length) return 'ocupada';

  const statuses = new Set(items.map((item) => item.status));

  if (statuses.has('pending')) return 'pendiente';
  if (statuses.has('preparing') || statuses.has('ready')) return 'ocupada';
  if (statuses.size && [...statuses].every((status) => status === 'served')) return 'por_cobrar';

  return table?.status ?? 'libre';
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function matchesKitchenItemFilters(item, filters = {}) {
  const { status = 'all', station = 'all' } = filters;
  const statusMatches = status === 'all' || item?.status === status;
  const stationMatches = station === 'all' || item?.station === station;
  return statusMatches && stationMatches;
}

export function parseDateValue(value) {
  if (!value) return null;

  let date = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value?.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value?.seconds === 'number') {
    const millis = (value.seconds * 1000) + Math.floor(Number(value.nanoseconds || 0) / 1_000_000);
    date = new Date(millis);
  } else {
    date = new Date(value);
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDateTime(value, locale = 'es-MX') {
  const date = parseDateValue(value);
  if (!date) return '—';
  return date.toLocaleString(locale);
}

export function getSalesPeriodRange(period = 'today', now = new Date()) {
  const current = parseDateValue(now) ?? new Date();
  const start = new Date(current);
  const end = new Date(current);

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'week') {
    const day = start.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function filterSalesByPeriod(sales = [], period = 'today', now = new Date()) {
  const { start, end } = getSalesPeriodRange(period, now);

  return sales.filter((sale) => {
    const saleDate = parseDateValue(sale?.closedAt);
    if (!saleDate) return false;
    return saleDate >= start && saleDate <= end;
  });
}

export function aggregateProductSalesMetrics(sales = [], orders = []) {
  const metricsMap = new Map();

  for (const sale of sales) {
    const saleItems = Array.isArray(sale?.itemsSnapshot) && sale.itemsSnapshot.length
      ? sale.itemsSnapshot
      : (orders.find((order) => order.id === sale?.orderId)?.items ?? []);

    for (const item of saleItems) {
      const name = item?.name || item?.nombreSnapshot || 'Producto';
      const quantity = Number(item?.quantity ?? item?.cantidad ?? 1);
      const unitPrice = Number(item?.price ?? item?.precioSnapshot ?? 0);
      const station = item?.station || item?.kitchenArea || 'Sin estación';
      const revenue = quantity * unitPrice;

      if (!metricsMap.has(name)) {
        metricsMap.set(name, {
          name,
          station,
          unitsSold: 0,
          revenue: 0,
          tickets: 0,
        });
      }

      const current = metricsMap.get(name);
      current.unitsSold += quantity;
      current.revenue += revenue;
      current.tickets += 1;
    }
  }

  const products = [...metricsMap.values()].sort((a, b) => {
    if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
    return b.revenue - a.revenue;
  });

  const totalUnits = products.reduce((sum, product) => sum + product.unitsSold, 0);
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
  const topProduct = products[0] ?? null;

  return {
    products,
    totalUnits,
    totalRevenue,
    uniqueProducts: products.length,
    topProduct,
  };
}
