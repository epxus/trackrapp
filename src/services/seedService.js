import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/client.js';
import { mockBusinessConfig, mockMenuCategories, mockMenuItems, mockOrders, mockSales, mockTables } from '../mocks/mockData.js';

export async function seedFirestoreWithMockData() {
  if (!db) {
    throw new Error('Firebase no está configurado todavía.');
  }


  await setDoc(doc(db, 'business', 'config'), {
    ...mockBusinessConfig,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await Promise.all(
    mockMenuCategories.map((category) =>
      setDoc(doc(db, 'menuCategories', category.id), {
        ...category,
        updatedAt: serverTimestamp(),
      })
    )
  );

  await Promise.all(
    mockMenuItems.map((item) =>
      setDoc(doc(db, 'menuItems', item.id), {
        ...item,
        updatedAt: serverTimestamp(),
      })
    )
  );

  await Promise.all(
    mockTables.map((table) =>
      setDoc(doc(db, 'tables', table.id), {
        ...table,
        updatedAt: serverTimestamp(),
      })
    )
  );

  await Promise.all(
    mockOrders.map((order) =>
      setDoc(doc(db, 'orders', order.id), {
        ...order,
        updatedAt: serverTimestamp(),
      })
    )
  );

  await Promise.all(
    mockSales.map((sale) =>
      setDoc(doc(db, 'sales', sale.id), {
        ...sale,
        closedAt: sale.closedAt,
      })
    )
  );
}
