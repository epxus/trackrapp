import React, { useMemo, useState } from 'react';
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
import { ScreenContainer } from '../components/ScreenContainer.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { StatCard } from '../components/StatCard.js';
import { StatusPill } from '../components/StatusPill.js';
import { COLORS } from '../constants/colors.js';
import { useAppData } from '../context/AppDataContext.js';
import { formatCurrency } from '../utils/orderUtils.js';

const DEFAULT_STATIONS = ['Cocina caliente', 'Freidora', 'Bebidas', 'Postres', 'Caja'];

export default function MenuScreen() {
  const {
    menuCategories,
    menuItems,
    loadingData,
    createMenuProduct,
    toggleMenuAvailability,
    saveMenuProduct,
    createMenuCategoryEntry,
    saveMenuCategory,
    toggleCategoryAvailability,
    removeMenuCategoryEntry,
  } = useAppData();

  const [busyId, setBusyId] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [search, setSearch] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '0',
    station: DEFAULT_STATIONS[0],
    available: true,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    active: true,
  });

  const categories = useMemo(
    () => [...menuCategories].sort((a, b) => a.name.localeCompare(b.name)),
    [menuCategories]
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set([
      ...categories.map((item) => item.name),
      ...menuItems.map((item) => item.category).filter(Boolean),
    ])).sort((a, b) => a.localeCompare(b)),
    [categories, menuItems]
  );

  const categoryUsage = useMemo(
    () => categoryOptions.reduce((acc, categoryName) => {
      acc[categoryName] = menuItems.filter((item) => item.category === categoryName).length;
      return acc;
    }, {}),
    [categoryOptions, menuItems]
  );

  const grouped = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const filteredItems = menuItems.filter((item) => {
      if (!searchValue) return true;
      return (
        item.name.toLowerCase().includes(searchValue) ||
        item.category.toLowerCase().includes(searchValue) ||
        item.station.toLowerCase().includes(searchValue)
      );
    });

    return filteredItems.reduce((acc, item) => {
      const category = item.category || 'General';
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [menuItems, search]);

  const groupedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  const availableCount = menuItems.filter((item) => item.available).length;
  const pausedCount = menuItems.filter((item) => !item.available).length;
  const activeCategoriesCount = categories.filter((item) => item.active).length;

  const stations = useMemo(
    () => Array.from(new Set([...DEFAULT_STATIONS, ...menuItems.map((item) => item.station).filter(Boolean)])).sort((a, b) => a.localeCompare(b)),
    [menuItems]
  );

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      category: categoryOptions[0] || '',
      price: '0',
      station: stations[0] || DEFAULT_STATIONS[0],
      available: true,
    });
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({
      name: '',
      active: true,
    });
  };

  const openCreateProductModal = () => {
    resetProductForm();
    setIsProductModalVisible(true);
  };

  const openEditProductModal = (item) => {
    setEditingProductId(item.id);
    setProductForm({
      name: item.name || '',
      category: item.category || '',
      price: String(item.price ?? 0),
      station: item.station || stations[0] || DEFAULT_STATIONS[0],
      available: Boolean(item.available),
    });
    setIsProductModalVisible(true);
  };

  const openCreateCategoryModal = () => {
    resetCategoryForm();
    setIsCategoryModalVisible(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || '',
      active: Boolean(category.active),
    });
    setIsCategoryModalVisible(true);
  };

  const closeProductModal = () => {
    if (savingProduct) return;
    setIsProductModalVisible(false);
    resetProductForm();
  };

  const closeCategoryModal = () => {
    if (savingCategory) return;
    setIsCategoryModalVisible(false);
    resetCategoryForm();
  };

  const handleSaveProduct = async () => {
    try {
      if (!productForm.category) {
        throw new Error('Selecciona una categoría antes de guardar el producto.');
      }

      setSavingProduct(true);
      const payload = {
        menuItemId: editingProductId,
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        station: productForm.station,
        available: productForm.available,
      };

      if (editingProductId) {
        await saveMenuProduct(payload);
      } else {
        await createMenuProduct(payload);
      }

      closeProductModal();
    } catch (error) {
      Alert.alert('No se pudo guardar el producto', error.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      setSavingCategory(true);
      const payload = {
        categoryId: editingCategoryId,
        name: categoryForm.name,
        active: categoryForm.active,
      };

      if (editingCategoryId) {
        await saveMenuCategory(payload);
      } else {
        await createMenuCategoryEntry(payload);
      }

      closeCategoryModal();
    } catch (error) {
      Alert.alert('No se pudo guardar la categoría', error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      setBusyId(`product_${item.id}`);
      await toggleMenuAvailability(item.id, !item.available);
    } catch (error) {
      Alert.alert('No se pudo actualizar el producto', error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleCategory = async (category) => {
    try {
      setBusyId(`category_${category.id}`);
      await toggleCategoryAvailability(category.id, !category.active);
    } catch (error) {
      Alert.alert('No se pudo actualizar la categoría', error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCategory = async (category) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Deseas eliminar la categoría ${category.name}? Solo podrá eliminarse si no tiene productos asignados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyId(`delete_${category.id}`);
              await removeMenuCategoryEntry(category.id);
            } catch (error) {
              Alert.alert('No se pudo eliminar la categoría', error.message);
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  if (loadingData) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Cargando menú...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Menú"
        subtitle="Administra categorías, precios y disponibilidad de productos."
        rightContent={
          <View style={styles.headerButtonsRow}>
            <Pressable onPress={openCreateCategoryModal} style={[styles.headerButton, styles.secondaryHeaderButton]}>
              <Ionicons name="pricetags-outline" size={18} color={COLORS.text} />
            </Pressable>
            <Pressable onPress={openCreateProductModal} style={styles.headerButton}>
              <Ionicons name="add" size={20} color={COLORS.white} />
            </Pressable>
          </View>
        }
      />

      <InfoCard
        tone="neutral"
        title="Catálogo conectado"
        description="Ahora puedes administrar categorías reales y asignarlas a productos desde la misma pantalla del menú."
      />

      <View style={styles.searchCard}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar producto, categoría o estación"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.grid}>
        <StatCard label="Productos" value={String(menuItems.length)} hint={`${categories.length} categorías`} icon={<Ionicons name="list-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Disponibles" value={String(availableCount)} hint="Listos para venta" icon={<Ionicons name="checkmark-circle-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Pausados" value={String(pausedCount)} hint="Ocultos temporalmente" icon={<Ionicons name="pause-circle-outline" size={18} color={COLORS.text} />} />
        <StatCard label="Categorías activas" value={String(activeCategoriesCount)} hint="Usables en producto" icon={<Ionicons name="pricetags-outline" size={18} color={COLORS.text} />} />
      </View>

      <View style={styles.categorySection}>
        <SectionHeader
          title="Categorías"
          subtitle="Crea, edita, pausa o elimina categorías sin depender de productos existentes."
          actionLabel="Nueva categoría"
          onPressAction={openCreateCategoryModal}
        />

        {categories.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {categories.map((category) => {
              const linkedCount = categoryUsage[category.name] ?? 0;
              const isBusy = busyId === `category_${category.id}` || busyId === `delete_${category.id}`;
              return (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.productHeader}>
                    <View>
                      <Text style={styles.productTitle}>{category.name}</Text>
                      <Text style={styles.productStation}>{linkedCount} productos vinculados</Text>
                    </View>
                    <StatusPill label={category.active ? 'available' : 'paused'} />
                  </View>

                  <View style={styles.productActions}>
                    <Pressable onPress={() => openEditCategoryModal(category)} style={styles.secondaryActionButton}>
                      <Text style={styles.secondaryActionButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleCategory(category)}
                      disabled={isBusy}
                      style={[styles.secondaryActionButton, isBusy && styles.actionButtonDisabled]}
                    >
                      <Text style={styles.secondaryActionButtonText}>
                        {isBusy && busyId === `category_${category.id}` ? 'Guardando...' : category.active ? 'Pausar' : 'Activar'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteCategory(category)}
                      disabled={isBusy || linkedCount > 0}
                      style={[
                        styles.deleteButton,
                        (isBusy || linkedCount > 0) && styles.actionButtonDisabled,
                      ]}
                    >
                      <Text style={styles.deleteButtonText}>{isBusy && busyId === `delete_${category.id}` ? 'Borrando...' : 'Eliminar'}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState title="Sin categorías" description="Crea tu primera categoría para organizar el menú y asignarla a productos." />
        )}
      </View>

      <View style={styles.categoryChipWrap}>
        {categoryOptions.length ? categoryOptions.map((category) => (
          <View key={category} style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{category}</Text>
          </View>
        )) : null}
      </View>

      {groupedCategories.length ? (
        groupedCategories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <SectionHeader title={category} subtitle={`${grouped[category].length} productos`} actionLabel="Nuevo producto" onPressAction={openCreateProductModal} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {grouped[category].map((item) => (
                <View key={item.id} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productTitle}>{item.name}</Text>
                    <StatusPill label={item.available ? 'available' : 'paused'} />
                  </View>
                  <Text style={styles.productStation}>{item.station}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                  <View style={styles.productActions}>
                    <Pressable onPress={() => openEditProductModal(item)} style={styles.secondaryActionButton}>
                      <Text style={styles.secondaryActionButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleAvailability(item)}
                      disabled={busyId === `product_${item.id}`}
                      style={[styles.actionButton, busyId === `product_${item.id}` && styles.actionButtonDisabled]}
                    >
                      <Text style={styles.actionButtonText}>
                        {busyId === `product_${item.id}` ? 'Guardando...' : item.available ? 'Pausar' : 'Activar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))
      ) : (
        <EmptyState title="Sin productos" description="Agrega artículos al menú para empezar a tomar pedidos." />
      )}

      <Modal visible={isCategoryModalVisible} transparent animationType="fade" onRequestClose={closeCategoryModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}</Text>
            <Text style={styles.modalDescription}>
              Administra categorías reales del menú. Si cambias el nombre de una categoría, los productos vinculados también se actualizan.
            </Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={categoryForm.name}
              onChangeText={(value) => setCategoryForm((current) => ({ ...current, name: value }))}
              placeholder="Ej. Hamburguesas"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <Pressable
              onPress={() => setCategoryForm((current) => ({ ...current, active: !current.active }))}
              style={styles.switchRow}
            >
              <View>
                <Text style={styles.switchTitle}>Categoría activa</Text>
                <Text style={styles.switchSubtitle}>Puedes pausarla para dejarla fuera del alta de productos.</Text>
              </View>
              <View style={[styles.switchIndicator, categoryForm.active ? styles.switchIndicatorActive : null]}>
                <View style={[styles.switchDot, categoryForm.active ? styles.switchDotActive : null]} />
              </View>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable onPress={closeCategoryModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSaveCategory} style={styles.confirmButton} disabled={savingCategory}>
                <Text style={styles.confirmButtonText}>{savingCategory ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isProductModalVisible} transparent animationType="fade" onRequestClose={closeProductModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingProductId ? 'Editar producto' : 'Nuevo producto'}</Text>
            <Text style={styles.modalDescription}>
              Captura los datos del producto y asígnalo a una categoría real para que quede disponible en el menú operativo.
            </Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={productForm.name}
              onChangeText={(value) => setProductForm((current) => ({ ...current, name: value }))}
              placeholder="Ej. Hamburguesa doble"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Categoría</Text>
            {categoryOptions.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stationList}>
                {categoryOptions.map((category) => {
                  const active = productForm.category === category;
                  return (
                    <Pressable
                      key={category}
                      onPress={() => setProductForm((current) => ({ ...current, category }))}
                      style={[styles.stationChip, active && styles.stationChipActive]}
                    >
                      <Text style={[styles.stationChipText, active && styles.stationChipTextActive]}>{category}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <InfoCard tone="warning" title="Sin categorías" description="Crea una categoría antes de guardar productos en el menú." />
            )}

            <Text style={styles.fieldLabel}>Precio</Text>
            <TextInput
              value={productForm.price}
              onChangeText={(value) => setProductForm((current) => ({ ...current, price: value.replace(/[^0-9.]/g, '') }))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Estación</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stationList}>
              {stations.map((station) => {
                const active = productForm.station === station;
                return (
                  <Pressable
                    key={station}
                    onPress={() => setProductForm((current) => ({ ...current, station }))}
                    style={[styles.stationChip, active && styles.stationChipActive]}
                  >
                    <Text style={[styles.stationChipText, active && styles.stationChipTextActive]}>{station}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => setProductForm((current) => ({ ...current, available: !current.available }))}
              style={styles.switchRow}
            >
              <View>
                <Text style={styles.switchTitle}>Disponible para venta</Text>
                <Text style={styles.switchSubtitle}>Puedes dejarlo pausado y activarlo después.</Text>
              </View>
              <View style={[styles.switchIndicator, productForm.available ? styles.switchIndicatorActive : null]}>
                <View style={[styles.switchDot, productForm.available ? styles.switchDotActive : null]} />
              </View>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable onPress={closeProductModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSaveProduct} style={[styles.confirmButton, !categoryOptions.length && styles.actionButtonDisabled]} disabled={savingProduct || !categoryOptions.length}>
                <Text style={styles.confirmButtonText}>{savingProduct ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
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
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryHeaderButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  categorySection: {
    gap: 12,
  },
  horizontalList: {
    paddingRight: 8,
  },
  categoryCard: {
    width: 280,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
    marginRight: 12,
  },
  productCard: {
    width: 238,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
    marginRight: 12,
  },
  productHeader: {
    gap: 10,
  },
  productTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
  },
  productStation: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  productPrice: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 24,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.dark,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryActionButtonText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
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
  stationList: {
    paddingVertical: 4,
    gap: 8,
  },
  stationChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stationChipActive: {
    backgroundColor: COLORS.dark,
    borderColor: COLORS.dark,
  },
  stationChipText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
  },
  stationChipTextActive: {
    color: COLORS.white,
  },
  switchRow: {
    marginTop: 4,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  switchSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    maxWidth: 220,
  },
  switchIndicator: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    padding: 3,
    justifyContent: 'center',
  },
  switchIndicatorActive: {
    backgroundColor: COLORS.success,
  },
  switchDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  switchDotActive: {
    alignSelf: 'flex-end',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
