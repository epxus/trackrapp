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

export function formatDateTime(value, locale = 'es-MX') {
  if (!value) return '—';

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
    return '—';
  }

  return date.toLocaleString(locale);
}
