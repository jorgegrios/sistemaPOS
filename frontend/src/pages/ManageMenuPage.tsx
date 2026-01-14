/**
 * Manage Menu Page
 * Create and manage menu categories and items
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { menuService, Menu, MenuCategory, MenuItem } from '../services/menu-service';
import { IngredientSelectorModal } from '../components/IngredientSelectorModal';
import { getApiBaseUrl } from '../utils/api-config';

export const ManageMenuPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuDetail, setMenuDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', displayOrder: 0 });
  const [menuForm, setMenuForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    available: true
  });
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  useEffect(() => {
    if (user?.restaurantId) {
      loadMenus();
    } else if (user === null && !authLoading) {
      toast.error('No estás autenticado. Por favor inicia sesión.');
    }
  }, [user?.restaurantId, user, authLoading]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await menuService.getMenus(user!.restaurantId!);
      // El API retorna { menus: [...] }, necesitamos extraer el array
      const menusArray = Array.isArray(response) ? response : (response as any).menus || [];
      setMenus(menusArray);
      if (menusArray.length > 0 && !selectedMenu) {
        setSelectedMenu(menusArray[0]);
        loadMenuDetail(menusArray[0].id);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      toast.error('Error loading menus');
      setMenus([]); // Asegurar que menus sea un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const loadMenuDetail = async (menuId: string) => {
    try {
      const detail = await menuService.getMenuDetail(user!.restaurantId!, menuId);
      setMenuDetail(detail);
    } catch (error) {
      toast.error('Error loading menu detail');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!selectedMenu) {
      toast.error('Por favor selecciona un menú primero');
      return;
    }
    
    if (!categoryForm.name || categoryForm.name.trim() === '') {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    if (!user?.restaurantId) {
      toast.error('No se pudo identificar el restaurante. Por favor inicia sesión nuevamente.');
      return;
    }

    try {
      console.log('Creating category:', {
        menuId: selectedMenu.id,
        name: categoryForm.name,
        displayOrder: categoryForm.displayOrder
      });

      const result = await menuService.createCategory(
        selectedMenu.id,
        categoryForm.name.trim(),
        categoryForm.displayOrder
      );

      console.log('Category created successfully:', result);
      toast.success('Categoría creada correctamente');
      setShowCategoryModal(false);
      setCategoryForm({ name: '', displayOrder: 0 });
      
      // Recargar el detalle del menú
      await loadMenuDetail(selectedMenu.id);
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage = error?.message || error?.error || 'Error desconocido al crear la categoría';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !itemForm.name || !itemForm.price) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      // Construir metadata con ingredientes e imagen
      const metadata: Record<string, any> = {};
      if (itemForm.imageUrl) {
        metadata.imageUrl = itemForm.imageUrl;
      }
      if (selectedIngredients.length > 0) {
        metadata.ingredients = selectedIngredients;
      }

      await menuService.createMenuItem({
        menuId: selectedMenu!.id,
        categoryId: selectedCategory,
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: parseFloat(itemForm.price),
        available: itemForm.available,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });

      toast.success('Item creado correctamente');
      setShowItemModal(false);
      setItemForm({ name: '', description: '', price: '', imageUrl: '', available: true });
      setSelectedIngredients([]);
      setSelectedCategory(null);
      loadMenuDetail(selectedMenu!.id);
    } catch (error: any) {
      toast.error(error.message || 'Error creating item');
    }
  };

  const handleIngredientsConfirmed = (ingredients: string[]) => {
    setSelectedIngredients(ingredients);
    setShowIngredientModal(false);
    toast.success(`${ingredients.length} ingredientes seleccionados`);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      await menuService.deleteMenuItem(itemId);
      toast.success('Item eliminado');
      loadMenuDetail(selectedMenu!.id);
    } catch (error) {
      toast.error('Error deleting item');
    }
  };

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || !user?.restaurantId) {
      toast.error('El nombre del menú es requerido');
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/menus/${user.restaurantId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('pos_token')}`
          },
          body: JSON.stringify({
            name: menuForm.name.trim(),
            description: menuForm.description.trim() || undefined
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creating menu');
      }

      const newMenu = await response.json();
      toast.success('Menú creado correctamente');
      setShowMenuModal(false);
      setMenuForm({ name: '', description: '' });
      await loadMenus();
      setSelectedMenu({ id: newMenu.id, name: newMenu.name, restaurantId: newMenu.restaurantId, categories: [], createdAt: new Date().toISOString() });
      await loadMenuDetail(newMenu.id);
    } catch (error: any) {
      console.error('Error creating menu:', error);
      toast.error(error.message || 'Error al crear el menú');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Cargando menús...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Gestionar Menú</h1>
          <p className="text-gray-600">Crea y administra categorías e items del menú</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMenuModal(true)}
            className="btn-primary px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
          >
            <span>➕</span>
            <span>{menus.length === 0 ? 'Crear Menú' : 'Crear Otro Menú'}</span>
          </button>
          {selectedMenu && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn-success px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
            >
              <span>➕</span>
              <span>Nueva Categoría</span>
            </button>
          )}
        </div>
      </div>

      {/* Menu Selector - Always visible */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {menus.length > 0 ? 'Seleccionar Menú' : 'No hay menús disponibles'}
            </label>
            {menus.length > 0 ? (
              <select
                value={selectedMenu?.id || ''}
                onChange={(e) => {
                  const menu = menus.find(m => m.id === e.target.value);
                  if (menu) {
                    setSelectedMenu(menu);
                    loadMenuDetail(menu.id);
                  }
                }}
                className="w-full sm:w-64 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Selecciona un menú --</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-500 text-sm">
                Crea tu primer menú para comenzar a agregar categorías e items
              </p>
            )}
          </div>
          {menus.length > 0 && (
            <button
              onClick={() => setShowMenuModal(true)}
              className="btn-success px-4 py-2 rounded-lg text-sm font-medium btn-touch"
            >
              + Crear Otro Menú
            </button>
          )}
        </div>
      </div>

      {/* Message when no menu selected */}
      {!selectedMenu && menus.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center mb-6">
          <p className="text-yellow-800 font-medium">
            ⚠️ Por favor selecciona un menú del selector arriba para crear categorías e items
          </p>
        </div>
      )}

      {/* Message when no menus exist */}
      {menus.length === 0 && !loading && !authLoading && user?.restaurantId && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center mb-6">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-blue-800 font-bold text-xl mb-2">
            No tienes menús creados aún
          </p>
          <p className="text-blue-600 mb-6 text-lg">
            Crea tu primer menú para comenzar a agregar categorías e items
          </p>
          <button
            onClick={() => setShowMenuModal(true)}
            className="btn-primary px-8 py-4 rounded-lg font-bold text-lg btn-touch shadow-lg hover:shadow-xl transition"
          >
            ➕ Crear Primer Menú
          </button>
        </div>
      )}

      {/* Categories and Items */}
      {menuDetail && selectedMenu && (
        <div className="space-y-6">
          {menuDetail.categories && menuDetail.categories.length > 0 ? (
            menuDetail.categories.map((category: MenuCategory & { items?: MenuItem[] }) => (
              <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">{category.name}</h2>
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowItemModal(true);
                    }}
                    className="btn-success px-4 py-2 rounded-lg text-sm font-medium btn-touch"
                  >
                    + Agregar Item
                  </button>
                </div>

                {category.items && category.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((item: MenuItem) => (
                      <div
                        key={item.id}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.available ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="btn-danger px-3 py-1 rounded text-sm btn-touch"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay items en esta categoría</p>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No hay categorías en este menú</p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
              >
                Crear Primera Categoría
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Nueva Categoría</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Desayunos, Almuerzos, Cocteles"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 rounded-lg btn-touch flex-1"
                >
                  Crear Categoría
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryForm({ name: '', displayOrder: 0 });
                  }}
                  className="btn-danger px-6 py-2 rounded-lg btn-touch"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nuevo Item</h2>
            <form onSubmit={handleCreateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Pollo a la Parrilla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Ej: Filete de pescado fresco a la plancha con vegetales y arroz"
                  />
                  <button
                    type="button"
                    onClick={() => setShowIngredientModal(true)}
                    className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>🤖</span>
                    <span>Analizar Ingredientes</span>
                  </button>
                  {selectedIngredients.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                      <p className="text-xs font-semibold text-green-800 mb-2">
                        Ingredientes identificados ({selectedIngredients.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedIngredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-medium"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowIngredientModal(true)}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Editar ingredientes →
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Imagen (opcional)
                  </label>
                  <input
                    type="url"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={itemForm.available}
                      onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-gray-700">Disponible</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 rounded-lg btn-touch flex-1"
                >
                  Crear Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemModal(false);
                    setItemForm({ name: '', description: '', price: '', imageUrl: '', available: true });
                    setSelectedIngredients([]);
                    setSelectedCategory(null);
                  }}
                  className="btn-danger px-6 py-2 rounded-lg btn-touch"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Selección de Ingredientes */}
      <IngredientSelectorModal
        isOpen={showIngredientModal}
        onClose={() => setShowIngredientModal(false)}
        onConfirm={handleIngredientsConfirmed}
        initialDescription={itemForm.description}
        initialIngredients={selectedIngredients}
        productName={itemForm.name}
      />

      {/* Create Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Crear Nuevo Menú</h2>
            <form onSubmit={handleCreateMenu}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Menú *
                  </label>
                  <input
                    type="text"
                    required
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Menú Principal, Menú de Desayunos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descripción del menú..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 rounded-lg btn-touch flex-1"
                >
                  Crear Menú
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false);
                    setMenuForm({ name: '', description: '' });
                  }}
                  className="btn-danger px-6 py-2 rounded-lg btn-touch"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Crear Nuevo Menú</h2>
            <form onSubmit={handleCreateMenu}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Menú *
                  </label>
                  <input
                    type="text"
                    required
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Menú Principal, Menú de Desayunos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descripción del menú..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 rounded-lg btn-touch flex-1"
                >
                  Crear Menú
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false);
                    setMenuForm({ name: '', description: '' });
                  }}
                  className="btn-danger px-6 py-2 rounded-lg btn-touch"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

