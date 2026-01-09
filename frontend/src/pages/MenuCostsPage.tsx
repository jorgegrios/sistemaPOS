/**
 * Menu Costs Page
 * Calculate and manage costs of menu items based on ingredients
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { menuCostsService, MenuItemCostSummary, MenuItemIngredient, MenuItemCost } from '../services/menu-costs-service';
import { inventoryService, InventoryItem } from '../services/inventory-service';
import { menuService, Menu, MenuCategory } from '../services/menu-service';
import { toast } from 'sonner';

export const MenuCostsPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItemCostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItemCostSummary | null>(null);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [costDetails, setCostDetails] = useState<MenuItemCost | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    quantity: '',
    unit: 'g'
  });
  const [loadingCost, setLoadingCost] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuForCreate, setSelectedMenuForCreate] = useState<Menu | null>(null);
  const [menuDetail, setMenuDetail] = useState<any>(null);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    available: true
  });
  const [newItemIngredients, setNewItemIngredients] = useState<Array<{
    inventoryItemId: string;
    quantity: number;
    unit: string;
    ingredientName: string;
  }>>([]);
  const [tempIngredient, setTempIngredient] = useState({
    inventoryItemId: '',
    quantity: '',
    unit: 'g'
  });
  const [calculatedCost, setCalculatedCost] = useState(0);

  useEffect(() => {
    loadItems();
    loadInventoryItems();
    loadMenus();
  }, []);

  useEffect(() => {
    if (selectedMenuForCreate) {
      loadMenuDetail(selectedMenuForCreate.id);
    }
  }, [selectedMenuForCreate]);

  useEffect(() => {
    calculateNewItemCost();
  }, [newItemIngredients]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await menuCostsService.getAllMenuItemCosts();
      setItems(data);
    } catch (error: any) {
      console.error('Error loading menu costs:', error);
      toast.error('Error al cargar costos de platos');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryItems = async () => {
    try {
      if (!user?.restaurantId) return;
      const data = await inventoryService.getInventoryItems({ active: true });
      setInventoryItems(data);
    } catch (error: any) {
      console.error('Error loading inventory items:', error);
    }
  };

  const loadMenus = async () => {
    try {
      if (!user?.restaurantId) return;
      const response = await menuService.getMenus(user.restaurantId);
      const menusArray = Array.isArray(response) ? response : (response as any).menus || [];
      setMenus(menusArray);
      if (menusArray.length > 0 && !selectedMenuForCreate) {
        setSelectedMenuForCreate(menusArray[0]);
      }
    } catch (error: any) {
      console.error('Error loading menus:', error);
    }
  };

  const loadMenuDetail = async (menuId: string) => {
    try {
      if (!user?.restaurantId) return;
      const detail = await menuService.getMenuDetail(user.restaurantId, menuId);
      setMenuDetail(detail);
      // Auto-select first category if available
      if (detail.categories && detail.categories.length > 0 && !newItemForm.categoryId) {
        setNewItemForm({ ...newItemForm, categoryId: detail.categories[0].id });
      }
    } catch (error: any) {
      console.error('Error loading menu detail:', error);
    }
  };

  const calculateNewItemCost = () => {
    let total = 0;
    newItemIngredients.forEach(ing => {
      const invItem = inventoryItems.find(i => i.id === ing.inventoryItemId);
      if (invItem) {
        const recipeUnit = ing.unit.toLowerCase();
        const inventoryUnit = invItem.unit.toLowerCase();
        let cost = 0;

        if (recipeUnit === inventoryUnit) {
          cost = ing.quantity * invItem.costPerUnit;
        } else if ((recipeUnit === 'g' || recipeUnit === 'gram' || recipeUnit === 'gramos') && 
                   (inventoryUnit === 'kg' || inventoryUnit === 'kilogram' || inventoryUnit === 'kilogramos')) {
          cost = (ing.quantity / 1000) * invItem.costPerUnit;
        } else if ((recipeUnit === 'kg' || recipeUnit === 'kilogram' || recipeUnit === 'kilogramos') && 
                   (inventoryUnit === 'g' || inventoryUnit === 'gram' || inventoryUnit === 'gramos')) {
          cost = ing.quantity * (invItem.costPerUnit / 1000);
        } else if ((recipeUnit === 'ml' || recipeUnit === 'mililitro' || recipeUnit === 'mililitros') && 
                   (inventoryUnit === 'l' || inventoryUnit === 'litro' || inventoryUnit === 'litros')) {
          cost = (ing.quantity / 1000) * invItem.costPerUnit;
        } else if ((recipeUnit === 'l' || recipeUnit === 'litro' || recipeUnit === 'litros') && 
                   (inventoryUnit === 'ml' || inventoryUnit === 'mililitro' || inventoryUnit === 'mililitros')) {
          cost = ing.quantity * (invItem.costPerUnit / 1000);
        } else {
          cost = ing.quantity * invItem.costPerUnit;
        }

        total += cost;
      }
    });
    setCalculatedCost(total);
  };

  const handleAddTempIngredient = () => {
    if (!tempIngredient.inventoryItemId || !tempIngredient.quantity) {
      toast.error('Completa todos los campos');
      return;
    }

    const invItem = inventoryItems.find(i => i.id === tempIngredient.inventoryItemId);
    if (!invItem) {
      toast.error('Ingrediente no encontrado');
      return;
    }

    // Check if already added
    if (newItemIngredients.some(ing => ing.inventoryItemId === tempIngredient.inventoryItemId)) {
      toast.error('Este ingrediente ya fue agregado');
      return;
    }

    setNewItemIngredients([...newItemIngredients, {
      inventoryItemId: tempIngredient.inventoryItemId,
      quantity: parseFloat(tempIngredient.quantity),
      unit: tempIngredient.unit,
      ingredientName: invItem.name
    }]);

    setTempIngredient({ inventoryItemId: '', quantity: '', unit: 'g' });
  };

  const handleRemoveTempIngredient = (index: number) => {
    setNewItemIngredients(newItemIngredients.filter((_, i) => i !== index));
  };

  const handleCreateNewItem = async () => {
    if (!newItemForm.name || !newItemForm.price || !newItemForm.categoryId || !selectedMenuForCreate) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      // Create menu item
      const newItem = await menuService.createMenuItem({
        menuId: selectedMenuForCreate.id,
        categoryId: newItemForm.categoryId,
        name: newItemForm.name,
        description: newItemForm.description || undefined,
        price: parseFloat(newItemForm.price),
        available: newItemForm.available
      });

      // Add ingredients
      for (const ing of newItemIngredients) {
        await menuCostsService.addIngredient(newItem.id, {
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity,
          unit: ing.unit
        });
      }

      toast.success('Plato creado correctamente');
      setShowCreateModal(false);
      setNewItemForm({ name: '', description: '', price: '', categoryId: '', available: true });
      setNewItemIngredients([]);
      setCalculatedCost(0);
      await loadItems();
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast.error(error.message || 'Error al crear el plato');
    }
  };

  const handleSelectItem = async (item: MenuItemCostSummary) => {
    setSelectedItem(item);
    setShowAddIngredient(false);
    try {
      const ing = await menuCostsService.getMenuItemIngredients(item.id);
      setIngredients(ing);
      await calculateCost(item.id);
    } catch (error: any) {
      console.error('Error loading ingredients:', error);
      toast.error('Error al cargar ingredientes');
    }
  };

  const calculateCost = async (menuItemId: string) => {
    try {
      setLoadingCost(true);
      const cost = await menuCostsService.calculateMenuItemCost(menuItemId);
      setCostDetails(cost);
    } catch (error: any) {
      console.error('Error calculating cost:', error);
      toast.error('Error al calcular costo');
    } finally {
      setLoadingCost(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!selectedItem || !newIngredient.inventoryItemId || !newIngredient.quantity) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      await menuCostsService.addIngredient(selectedItem.id, {
        inventoryItemId: newIngredient.inventoryItemId,
        quantity: parseFloat(newIngredient.quantity),
        unit: newIngredient.unit
      });
      toast.success('Ingrediente agregado');
      setNewIngredient({ inventoryItemId: '', quantity: '', unit: 'g' });
      setShowAddIngredient(false);
      await handleSelectItem(selectedItem);
      await loadItems();
    } catch (error: any) {
      console.error('Error adding ingredient:', error);
      toast.error(error.message || 'Error al agregar ingrediente');
    }
  };

  const handleUpdateIngredient = async (id: string, quantity: number, unit: string) => {
    try {
      await menuCostsService.updateIngredient(id, { quantity, unit });
      toast.success('Ingrediente actualizado');
      if (selectedItem) {
        await handleSelectItem(selectedItem);
        await loadItems();
      }
    } catch (error: any) {
      console.error('Error updating ingredient:', error);
      toast.error('Error al actualizar ingrediente');
    }
  };

  const handleRemoveIngredient = async (id: string) => {
    if (!confirm('¿Eliminar este ingrediente?')) return;

    try {
      await menuCostsService.removeIngredient(id);
      toast.success('Ingrediente eliminado');
      if (selectedItem) {
        await handleSelectItem(selectedItem);
        await loadItems();
      }
    } catch (error: any) {
      console.error('Error removing ingredient:', error);
      toast.error('Error al eliminar ingrediente');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando costos de platos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">💰 Costos de Platos</h1>
          <p className="text-gray-600">Gestiona los ingredientes y calcula el costo de cada plato</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg border-2 border-green-400 btn-touch transition duration-200 active:scale-95"
        >
          + Crear Nuevo Plato
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: List of Menu Items */}
        <div className="bg-white rounded-xl shadow-lg border-4 border-blue-200 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Platos del Menú</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay platos disponibles</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 btn-touch ${
                    selectedItem?.id === item.id
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-400 shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">{item.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.profitPercentage >= 50
                        ? 'bg-green-100 text-green-700'
                        : item.profitPercentage >= 30
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.profitPercentage.toFixed(1)}% margen
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-bold text-gray-800 ml-2">${item.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Costo:</span>
                      <span className="font-bold text-gray-800 ml-2">${item.cost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {item.ingredientCount} {item.ingredientCount === 1 ? 'ingrediente' : 'ingredientes'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Ingredient Details */}
        <div className="bg-white rounded-xl shadow-lg border-4 border-green-200 p-4 sm:p-6">
          {!selectedItem ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Selecciona un plato para ver sus ingredientes</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedItem.name}</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Categoría: <span className="font-semibold">{selectedItem.categoryName}</span></span>
                </div>
              </div>

              {/* Cost Summary */}
              {costDetails && (
                <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border-2 border-green-300">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Precio de Venta</p>
                      <p className="text-lg font-bold text-gray-800">${costDetails.menuItemPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Costo Total</p>
                      <p className="text-lg font-bold text-red-600">${costDetails.totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Ganancia</p>
                      <p className={`text-lg font-bold ${
                        costDetails.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${costDetails.profitMargin.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Margen</p>
                      <p className={`text-lg font-bold ${
                        costDetails.profitPercentage >= 50
                          ? 'text-green-600'
                          : costDetails.profitPercentage >= 30
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {costDetails.profitPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredients List */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Ingredientes</h3>
                  <button
                    onClick={() => setShowAddIngredient(!showAddIngredient)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold btn-touch"
                  >
                    {showAddIngredient ? '✕ Cancelar' : '+ Agregar'}
                  </button>
                </div>

                {/* Add Ingredient Form */}
                {showAddIngredient && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Nuevo Ingrediente</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ingrediente
                        </label>
                        <select
                          value={newIngredient.inventoryItemId}
                          onChange={(e) => setNewIngredient({ ...newIngredient, inventoryItemId: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecciona un ingrediente</option>
                          {inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.unit}) - ${item.costPerUnit.toFixed(2)}/{item.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newIngredient.quantity}
                            onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unidad
                          </label>
                          <select
                            value={newIngredient.unit}
                            onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="g">Gramos (g)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="ml">Mililitros (ml)</option>
                            <option value="l">Litros (l)</option>
                            <option value="unidad">Unidad</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleAddIngredient}
                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold btn-touch"
                      >
                        Agregar Ingrediente
                      </button>
                    </div>
                  </div>
                )}

                {/* Ingredients List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {ingredients.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay ingredientes agregados</p>
                  ) : (
                    ingredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{ing.ingredientName}</h4>
                              <p className="text-xs text-gray-600">
                                {ing.quantity} {ing.unit} × ${ing.costPerUnit.toFixed(2)}/{ing.ingredientUnit}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveIngredient(ing.id)}
                              className="ml-2 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-semibold btn-touch"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={ing.quantity}
                              onChange={(e) => {
                                const newQty = parseFloat(e.target.value) || 0;
                                handleUpdateIngredient(ing.id, newQty, ing.unit);
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <select
                              value={ing.unit}
                              onChange={(e) => handleUpdateIngredient(ing.id, ing.quantity, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="l">l</option>
                              <option value="unidad">unidad</option>
                            </select>
                          </div>
                        </div>
                    ))
                  )}
                </div>
              </div>

              {loadingCost && (
                <div className="text-center py-4">
                  <div className="animate-spin text-2xl">⏳</div>
                  <p className="text-sm text-gray-600 mt-2">Calculando costo...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

