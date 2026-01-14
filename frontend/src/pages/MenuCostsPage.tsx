/**
 * Advanced Menu Costs Page
 * Complete cost calculation system including labor, overhead, packaging, and food cost management
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { 
  advancedCostingService,
  CostConfig,
  LaborPosition,
  OverheadCost,
  PackagingCost,
  CompleteCostCalculation,
  MenuItemCostSummary,
  MenuItemLabor,
  MenuItemPackaging,
  OverheadAllocationMethod
} from '../services/advanced-costing-service';
import { menuCostsService, MenuItemIngredient } from '../services/menu-costs-service';
import { inventoryService, InventoryItem } from '../services/inventory-service';
import { menuService, Menu, MenuCategory } from '../services/menu-service';
import { 
  dynamicPricingService,
  PriceRecommendation,
  PricingScenario,
  PriceElasticity,
  PricingConfig
} from '../services/dynamic-pricing-service';
import { toast } from 'sonner';

type TabType = 'platos' | 'config' | 'mano-obra' | 'overhead' | 'empaques' | 'reportes' | 'pricing';

export const MenuCostsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('platos');
  const [loading, setLoading] = useState(true);
  
  // Menu items
  const [items, setItems] = useState<MenuItemCostSummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItemCostSummary | null>(null);
  const [costCalculation, setCostCalculation] = useState<CompleteCostCalculation | null>(null);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [labor, setLabor] = useState<MenuItemLabor[]>([]);
  const [packaging, setPackaging] = useState<MenuItemPackaging[]>([]);
  
  // Configuration
  const [config, setConfig] = useState<CostConfig | null>(null);
  
  // Labor positions
  const [laborPositions, setLaborPositions] = useState<LaborPosition[]>([]);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborForm, setLaborForm] = useState({
    name: '',
    description: '',
    monthly_salary: '',
    hours_per_month: '160'
  });
  const [editingLabor, setEditingLabor] = useState<LaborPosition | null>(null);
  
  // Overhead costs
  const [overheadCosts, setOverheadCosts] = useState<OverheadCost[]>([]);
  const [overheadAllocation, setOverheadAllocation] = useState<OverheadAllocationMethod | null>(null);
  const [showOverheadModal, setShowOverheadModal] = useState(false);
  const [overheadForm, setOverheadForm] = useState({
    name: '',
    description: '',
    monthly_amount: '',
    category: ''
  });
  const [editingOverhead, setEditingOverhead] = useState<OverheadCost | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    method_type: 'per_plate' as 'fixed_percentage' | 'per_plate' | 'production_hours',
    fixed_percentage: '',
    per_plate_amount: '',
    production_hours_per_month: ''
  });
  
  // Packaging costs
  const [packagingCosts, setPackagingCosts] = useState<PackagingCost[]>([]);
  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [packagingForm, setPackagingForm] = useState({
    name: '',
    description: '',
    cost_per_unit: '',
    unit: 'unidad'
  });
  const [editingPackaging, setEditingPackaging] = useState<PackagingCost | null>(null);
  
  // Create new item
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
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMenuForCreate) {
      loadMenuDetail(selectedMenuForCreate.id);
    }
  }, [selectedMenuForCreate]);

  useEffect(() => {
    if (selectedItem) {
      loadItemDetails(selectedItem.id);
    }
  }, [selectedItem]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfig(),
        loadItems(),
        loadLaborPositions(),
        loadOverheadCosts(),
        loadPackagingCosts(),
        loadMenus(),
        loadInventoryItems()
      ]);
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const data = await advancedCostingService.getConfig();
      setConfig(data);
    } catch (error: any) {
      console.error('Error loading config:', error);
    }
  };

  const loadItems = async () => {
    try {
      const data = await advancedCostingService.getAllMenuItemCosts();
      setItems(data);
    } catch (error: any) {
      console.error('Error loading items:', error);
      toast.error('Error al cargar platos');
    }
  };

  const loadItemDetails = async (menuItemId: string) => {
    try {
      const [costCalc, ing, lab, pack] = await Promise.all([
        advancedCostingService.calculateCompleteCost(menuItemId),
        menuCostsService.getMenuItemIngredients(menuItemId),
        advancedCostingService.getMenuItemLabor(menuItemId),
        advancedCostingService.getMenuItemPackaging(menuItemId)
      ]);
      setCostCalculation(costCalc);
      setIngredients(ing);
      setLabor(lab);
      setPackaging(pack);
    } catch (error: any) {
      console.error('Error loading item details:', error);
      toast.error('Error al cargar detalles del plato');
    }
  };

  const loadLaborPositions = async () => {
    try {
      const data = await advancedCostingService.getLaborPositions();
      setLaborPositions(data);
    } catch (error: any) {
      console.error('Error loading labor positions:', error);
    }
  };

  const loadOverheadCosts = async () => {
    try {
      const [costs, allocation] = await Promise.all([
        advancedCostingService.getOverheadCosts(),
        advancedCostingService.getOverheadAllocation()
      ]);
      setOverheadCosts(costs);
      setOverheadAllocation(allocation);
    } catch (error: any) {
      console.error('Error loading overhead costs:', error);
    }
  };

  const loadPackagingCosts = async () => {
    try {
      const data = await advancedCostingService.getPackagingCosts();
      setPackagingCosts(data);
    } catch (error: any) {
      console.error('Error loading packaging costs:', error);
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
      if (detail.categories && detail.categories.length > 0 && !newItemForm.categoryId) {
        setNewItemForm({ ...newItemForm, categoryId: detail.categories[0].id });
      }
    } catch (error: any) {
      console.error('Error loading menu detail:', error);
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

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      await advancedCostingService.updateConfig(config);
      toast.success('Configuración guardada');
      await loadConfig();
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const handleSaveLabor = async () => {
    if (!laborForm.name || !laborForm.monthly_salary) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      if (editingLabor) {
        await advancedCostingService.updateLaborPosition(editingLabor.id, {
          name: laborForm.name,
          description: laborForm.description,
          monthly_salary: parseFloat(laborForm.monthly_salary),
          hours_per_month: parseFloat(laborForm.hours_per_month)
        });
        toast.success('Cargo actualizado');
      } else {
        await advancedCostingService.createLaborPosition({
          name: laborForm.name,
          description: laborForm.description,
          monthly_salary: parseFloat(laborForm.monthly_salary),
          hours_per_month: parseFloat(laborForm.hours_per_month)
        });
        toast.success('Cargo creado');
      }
      setShowLaborModal(false);
      setLaborForm({ name: '', description: '', monthly_salary: '', hours_per_month: '160' });
      setEditingLabor(null);
      await loadLaborPositions();
    } catch (error: any) {
      console.error('Error saving labor:', error);
      toast.error('Error al guardar cargo');
    }
  };

  const handleSaveOverhead = async () => {
    if (!overheadForm.name || !overheadForm.monthly_amount) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      if (editingOverhead) {
        await advancedCostingService.updateOverheadCost(editingOverhead.id, {
          name: overheadForm.name,
          description: overheadForm.description,
          monthly_amount: parseFloat(overheadForm.monthly_amount),
          category: overheadForm.category
        });
        toast.success('Costo indirecto actualizado');
      } else {
        await advancedCostingService.createOverheadCost({
          name: overheadForm.name,
          description: overheadForm.description,
          monthly_amount: parseFloat(overheadForm.monthly_amount),
          category: overheadForm.category
        });
        toast.success('Costo indirecto creado');
      }
      setShowOverheadModal(false);
      setOverheadForm({ name: '', description: '', monthly_amount: '', category: '' });
      setEditingOverhead(null);
      await loadOverheadCosts();
    } catch (error: any) {
      console.error('Error saving overhead:', error);
      toast.error('Error al guardar costo indirecto');
    }
  };

  const handleSaveAllocation = async () => {
    try {
      await advancedCostingService.setOverheadAllocation({
        method_type: allocationForm.method_type,
        fixed_percentage: allocationForm.fixed_percentage ? parseFloat(allocationForm.fixed_percentage) : undefined,
        per_plate_amount: allocationForm.per_plate_amount ? parseFloat(allocationForm.per_plate_amount) : undefined,
        production_hours_per_month: allocationForm.production_hours_per_month ? parseFloat(allocationForm.production_hours_per_month) : undefined
      });
      toast.success('Método de prorrateo guardado');
      setShowAllocationModal(false);
      await loadOverheadCosts();
    } catch (error: any) {
      console.error('Error saving allocation:', error);
      toast.error('Error al guardar método de prorrateo');
    }
  };

  const handleSavePackaging = async () => {
    if (!packagingForm.name || !packagingForm.cost_per_unit) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      if (editingPackaging) {
        await advancedCostingService.updatePackagingCost(editingPackaging.id, {
          name: packagingForm.name,
          description: packagingForm.description,
          cost_per_unit: parseFloat(packagingForm.cost_per_unit),
          unit: packagingForm.unit
        });
        toast.success('Empaque actualizado');
      } else {
        await advancedCostingService.createPackagingCost({
          name: packagingForm.name,
          description: packagingForm.description,
          cost_per_unit: parseFloat(packagingForm.cost_per_unit),
          unit: packagingForm.unit
        });
        toast.success('Empaque creado');
      }
      setShowPackagingModal(false);
      setPackagingForm({ name: '', description: '', cost_per_unit: '', unit: 'unidad' });
      setEditingPackaging(null);
      await loadPackagingCosts();
    } catch (error: any) {
      console.error('Error saving packaging:', error);
      toast.error('Error al guardar empaque');
    }
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

  const handleCreateNewItem = async () => {
    if (!newItemForm.name || !newItemForm.price || !newItemForm.categoryId || !selectedMenuForCreate) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      const newItem = await menuService.createMenuItem({
        menuId: selectedMenuForCreate.id,
        categoryId: newItemForm.categoryId,
        name: newItemForm.name,
        description: newItemForm.description || undefined,
        price: parseFloat(newItemForm.price),
        available: newItemForm.available
      });

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
      await loadItems();
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast.error(error.message || 'Error al crear el plato');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando sistema de costos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">💰 Sistema de Costos Avanzado</h1>
          <p className="text-gray-600">Gestión completa de costos: ingredientes, mano de obra, overhead y empaques</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg border-2 border-green-400 btn-touch transition duration-200 active:scale-95"
        >
          + Crear Nuevo Plato
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b-2 border-gray-200">
        {[
          { id: 'platos' as TabType, label: '📋 Platos', icon: '📋' },
          { id: 'config' as TabType, label: '⚙️ Configuración', icon: '⚙️' },
          { id: 'mano-obra' as TabType, label: '👨‍🍳 Mano de Obra', icon: '👨‍🍳' },
          { id: 'overhead' as TabType, label: '🏢 Costos Indirectos', icon: '🏢' },
          { id: 'empaques' as TabType, label: '📦 Empaques', icon: '📦' },
          { id: 'reportes' as TabType, label: '📊 Reportes', icon: '📊' },
          { id: 'pricing' as TabType, label: '🤖 Pricing IA', icon: '🤖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold rounded-t-lg btn-touch transition duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg border-4 border-blue-200 p-4 sm:p-6">
        {activeTab === 'platos' && (
          <PlatosTab
            items={items}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            costCalculation={costCalculation}
            ingredients={ingredients}
            labor={labor}
            packaging={packaging}
            laborPositions={laborPositions}
            packagingCosts={packagingCosts}
            onAddLabor={async (menuItemId, data) => {
              await advancedCostingService.addMenuItemLabor(menuItemId, data);
              toast.success('Mano de obra agregada');
              if (selectedItem) await loadItemDetails(selectedItem.id);
            }}
            onDeleteLabor={async (id) => {
              await advancedCostingService.deleteMenuItemLabor(id);
              toast.success('Mano de obra eliminada');
              if (selectedItem) await loadItemDetails(selectedItem.id);
            }}
            onAddPackaging={async (menuItemId, data) => {
              await advancedCostingService.addMenuItemPackaging(menuItemId, {
                ...data,
                channel: data.channel as 'all' | 'dine_in' | 'delivery' | 'takeout' | undefined
              });
              toast.success('Empaque agregado');
              if (selectedItem) await loadItemDetails(selectedItem.id);
            }}
            onDeletePackaging={async (id) => {
              await advancedCostingService.deleteMenuItemPackaging(id);
              toast.success('Empaque eliminado');
              if (selectedItem) await loadItemDetails(selectedItem.id);
            }}
            onAddIngredient={async (menuItemId, data) => {
              await menuCostsService.addIngredient(menuItemId, {
                inventoryItemId: data.inventoryItemId,
                quantity: data.quantity,
                unit: data.unit
              });
              toast.success('Ingrediente agregado');
              if (selectedItem) await loadItemDetails(selectedItem.id);
              await loadItems();
            }}
            onDeleteIngredient={async (id) => {
              await menuCostsService.removeIngredient(id);
              toast.success('Ingrediente eliminado');
              if (selectedItem) await loadItemDetails(selectedItem.id);
              await loadItems();
            }}
            inventoryItems={inventoryItems}
          />
        )}

        {activeTab === 'config' && (
          <ConfigTab
            config={config}
            onConfigChange={setConfig}
            onSave={handleSaveConfig}
          />
        )}

        {activeTab === 'mano-obra' && (
          <ManoObraTab
            laborPositions={laborPositions}
            onEdit={(pos) => {
              setEditingLabor(pos);
              setLaborForm({
                name: pos.name,
                description: pos.description || '',
                monthly_salary: pos.monthly_salary.toString(),
                hours_per_month: pos.hours_per_month.toString()
              });
              setShowLaborModal(true);
            }}
            onDelete={async (id) => {
              if (!confirm('¿Eliminar este cargo?')) return;
              await advancedCostingService.deleteLaborPosition(id);
              toast.success('Cargo eliminado');
              await loadLaborPositions();
            }}
            onAdd={() => {
              setEditingLabor(null);
              setLaborForm({ name: '', description: '', monthly_salary: '', hours_per_month: '160' });
              setShowLaborModal(true);
            }}
          />
        )}

        {activeTab === 'overhead' && (
          <OverheadTab
            overheadCosts={overheadCosts}
            allocation={overheadAllocation}
            onEdit={(cost) => {
              setEditingOverhead(cost);
              setOverheadForm({
                name: cost.name,
                description: cost.description || '',
                monthly_amount: cost.monthly_amount.toString(),
                category: cost.category || ''
              });
              setShowOverheadModal(true);
            }}
            onDelete={async (id) => {
              if (!confirm('¿Eliminar este costo indirecto?')) return;
              await advancedCostingService.deleteOverheadCost(id);
              toast.success('Costo indirecto eliminado');
              await loadOverheadCosts();
            }}
            onAdd={() => {
              setEditingOverhead(null);
              setOverheadForm({ name: '', description: '', monthly_amount: '', category: '' });
              setShowOverheadModal(true);
            }}
            onConfigureAllocation={() => {
              if (overheadAllocation) {
                setAllocationForm({
                  method_type: overheadAllocation.method_type,
                  fixed_percentage: overheadAllocation.fixed_percentage?.toString() || '',
                  per_plate_amount: overheadAllocation.per_plate_amount?.toString() || '',
                  production_hours_per_month: overheadAllocation.production_hours_per_month?.toString() || ''
                });
              }
              setShowAllocationModal(true);
            }}
          />
        )}

        {activeTab === 'empaques' && (
          <EmpaquesTab
            packagingCosts={packagingCosts}
            onEdit={(cost) => {
              setEditingPackaging(cost);
              setPackagingForm({
                name: cost.name,
                description: cost.description || '',
                cost_per_unit: cost.cost_per_unit.toString(),
                unit: cost.unit
              });
              setShowPackagingModal(true);
            }}
            onDelete={async (id) => {
              if (!confirm('¿Eliminar este empaque?')) return;
              await advancedCostingService.deletePackagingCost(id);
              toast.success('Empaque eliminado');
              await loadPackagingCosts();
            }}
            onAdd={() => {
              setEditingPackaging(null);
              setPackagingForm({ name: '', description: '', cost_per_unit: '', unit: 'unidad' });
              setShowPackagingModal(true);
            }}
          />
        )}

        {activeTab === 'reportes' && (
          <ReportesTab items={items} />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            items={items}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onRefresh={loadItems}
          />
        )}
      </div>

      {/* Modals */}
      {showLaborModal && (
        <LaborModal
          form={laborForm}
          onFormChange={setLaborForm}
          onSave={handleSaveLabor}
          onClose={() => {
            setShowLaborModal(false);
            setEditingLabor(null);
            setLaborForm({ name: '', description: '', monthly_salary: '', hours_per_month: '160' });
          }}
          editing={editingLabor}
        />
      )}

      {showOverheadModal && (
        <OverheadModal
          form={overheadForm}
          onFormChange={setOverheadForm}
          onSave={handleSaveOverhead}
          onClose={() => {
            setShowOverheadModal(false);
            setEditingOverhead(null);
            setOverheadForm({ name: '', description: '', monthly_amount: '', category: '' });
          }}
          editing={editingOverhead}
        />
      )}

      {showAllocationModal && (
        <AllocationModal
          form={allocationForm}
          onFormChange={setAllocationForm}
          onSave={handleSaveAllocation}
          onClose={() => setShowAllocationModal(false)}
        />
      )}

      {showPackagingModal && (
        <PackagingModal
          form={packagingForm}
          onFormChange={setPackagingForm}
          onSave={handleSavePackaging}
          onClose={() => {
            setShowPackagingModal(false);
            setEditingPackaging(null);
            setPackagingForm({ name: '', description: '', cost_per_unit: '', unit: 'unidad' });
          }}
          editing={editingPackaging}
        />
      )}

      {showCreateModal && (
        <CreateItemModal
          menus={menus}
          selectedMenu={selectedMenuForCreate}
          onMenuChange={setSelectedMenuForCreate}
          menuDetail={menuDetail}
          form={newItemForm}
          onFormChange={setNewItemForm}
          inventoryItems={inventoryItems}
          ingredients={newItemIngredients}
          tempIngredient={tempIngredient}
          onTempIngredientChange={setTempIngredient}
          onAddIngredient={handleAddTempIngredient}
          onRemoveIngredient={(index) => {
            setNewItemIngredients(newItemIngredients.filter((_, i) => i !== index));
          }}
          onSave={handleCreateNewItem}
          onClose={() => {
            setShowCreateModal(false);
            setNewItemForm({ name: '', description: '', price: '', categoryId: '', available: true });
            setNewItemIngredients([]);
          }}
        />
      )}
    </div>
  );
};

// Componente para la pestaña de Platos
const PlatosTab: React.FC<{
  items: MenuItemCostSummary[];
  selectedItem: MenuItemCostSummary | null;
  onSelectItem: (item: MenuItemCostSummary | null) => void;
  costCalculation: CompleteCostCalculation | null;
  ingredients: MenuItemIngredient[];
  labor: MenuItemLabor[];
  packaging: MenuItemPackaging[];
  laborPositions: LaborPosition[];
  packagingCosts: PackagingCost[];
  onAddLabor: (menuItemId: string, data: { labor_position_id: string; preparation_time_minutes: number }) => Promise<void>;
  onDeleteLabor: (id: string) => Promise<void>;
  onAddPackaging: (menuItemId: string, data: { packaging_cost_id: string; quantity?: number; channel?: 'all' | 'dine_in' | 'delivery' | 'takeout' }) => Promise<void>;
  onDeletePackaging: (id: string) => Promise<void>;
  onAddIngredient: (menuItemId: string, data: { inventoryItemId: string; quantity: number; unit: string }) => Promise<void>;
  onDeleteIngredient: (id: string) => Promise<void>;
  inventoryItems: InventoryItem[];
}> = ({
  items,
  selectedItem,
  onSelectItem,
  costCalculation,
  ingredients,
  labor,
  packaging,
  laborPositions,
  packagingCosts,
  onAddLabor,
  onDeleteLabor,
  onAddPackaging,
  onDeletePackaging,
  onAddIngredient,
  onDeleteIngredient,
  inventoryItems
}) => {
  const [showAddLabor, setShowAddLabor] = useState(false);
  const [showAddPackaging, setShowAddPackaging] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [laborForm, setLaborForm] = useState({ labor_position_id: '', preparation_time_minutes: '' });
  const [packagingForm, setPackagingForm] = useState({ packaging_cost_id: '', quantity: '1', channel: 'all' });
  const [ingredientForm, setIngredientForm] = useState({ inventoryItemId: '', quantity: '', unit: 'g' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left: List of Menu Items */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Platos del Menú</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay platos disponibles</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 btn-touch ${
                  selectedItem?.id === item.id
                    ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-400 shadow-md'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg">{item.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.foodCostPercentage <= 30
                      ? 'bg-green-100 text-green-700'
                      : item.foodCostPercentage <= 40
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.foodCostPercentage.toFixed(1)}% FC
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-bold text-gray-800 ml-2">${item.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Costo:</span>
                    <span className="font-bold text-gray-800 ml-2">${item.costs.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {item.ingredientCount} ingredientes • ${item.profitMargin.toFixed(2)} ganancia
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Item Details */}
      <div>
        {!selectedItem ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Selecciona un plato para ver sus detalles</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedItem.name}</h2>

            {/* Complete Cost Summary */}
            {costCalculation && (
              <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-gray-800 mb-3">💰 Resumen de Costos</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Precio de Venta</p>
                    <p className="text-lg font-bold text-gray-800">${costCalculation.sellingPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Costo Total</p>
                    <p className="text-lg font-bold text-red-600">${costCalculation.costs.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Ganancia</p>
                    <p className={`text-lg font-bold ${
                      costCalculation.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${costCalculation.profitMargin.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Food Cost</p>
                    <p className={`text-lg font-bold ${
                      costCalculation.foodCostPercentage <= 30
                        ? 'text-green-600'
                        : costCalculation.foodCostPercentage <= 40
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {costCalculation.foodCostPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t-2 border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Desglose de Costos</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Ingredientes: <span className="font-semibold">${costCalculation.costs.ingredients.toFixed(2)}</span></div>
                    {costCalculation.config.includeLabor && (
                      <div>Mano de Obra: <span className="font-semibold">${costCalculation.costs.labor.toFixed(2)}</span></div>
                    )}
                    {costCalculation.config.includeOverhead && (
                      <div>Overhead: <span className="font-semibold">${costCalculation.costs.overhead.toFixed(2)}</span></div>
                    )}
                    {costCalculation.config.includePackaging && (
                      <div>Empaques: <span className="font-semibold">${costCalculation.costs.packaging.toFixed(2)}</span></div>
                    )}
                  </div>
                  {costCalculation.suggestedPrice > 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-green-200">
                      <p className="text-xs text-gray-600">Precio Sugerido (FC {costCalculation.targetFoodCostPercentage}%)</p>
                      <p className="text-xl font-bold text-blue-600">${costCalculation.suggestedPrice.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">🥘 Ingredientes</h3>
                <button
                  onClick={() => setShowAddIngredient(!showAddIngredient)}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold btn-touch"
                >
                  {showAddIngredient ? '✕' : '+'}
                </button>
              </div>
              {showAddIngredient && (
                <div className="mb-2 p-3 bg-blue-50 rounded border-2 border-blue-200">
                  <select
                    value={ingredientForm.inventoryItemId}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, inventoryItemId: e.target.value })}
                    className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Selecciona ingrediente</option>
                    {inventoryItems.filter(i => i.active).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit}) - ${parseFloat(item.costPerUnit.toString()).toFixed(2)}/{item.unit}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="number"
                      step="0.01"
                      value={ingredientForm.quantity}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                      placeholder="Cantidad"
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={ingredientForm.unit}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="unidad">unidad</option>
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      if (!ingredientForm.inventoryItemId || !ingredientForm.quantity) {
                        return;
                      }
                      await onAddIngredient(selectedItem.id, {
                        inventoryItemId: ingredientForm.inventoryItemId,
                        quantity: parseFloat(ingredientForm.quantity),
                        unit: ingredientForm.unit
                      });
                      setShowAddIngredient(false);
                      setIngredientForm({ inventoryItemId: '', quantity: '', unit: 'g' });
                    }}
                    className="w-full py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold btn-touch"
                  >
                    Agregar Ingrediente
                  </button>
                </div>
              )}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ingredients.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay ingredientes</p>
                ) : (
                  ingredients.map((ing) => (
                    <div key={ing.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{ing.ingredientName}</span>: {ing.quantity} {ing.unit}
                        {ing.costPerUnit && (
                          <span className="text-gray-600 ml-2">(${parseFloat(ing.costPerUnit.toString()).toFixed(2)}/{ing.ingredientUnit})</span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteIngredient(ing.id)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs btn-touch"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Labor */}
            {costCalculation?.config.includeLabor && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">👨‍🍳 Mano de Obra</h3>
                  <button
                    onClick={() => setShowAddLabor(!showAddLabor)}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold btn-touch"
                  >
                    {showAddLabor ? '✕' : '+'}
                  </button>
                </div>
                {showAddLabor && (
                  <div className="mb-2 p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <select
                      value={laborForm.labor_position_id}
                      onChange={(e) => setLaborForm({ ...laborForm, labor_position_id: e.target.value })}
                      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Selecciona cargo</option>
                      {laborPositions.filter(p => p.active).map(pos => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={laborForm.preparation_time_minutes}
                      onChange={(e) => setLaborForm({ ...laborForm, preparation_time_minutes: e.target.value })}
                      placeholder="Minutos"
                      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!laborForm.labor_position_id || !laborForm.preparation_time_minutes) {
                          return;
                        }
                        await onAddLabor(selectedItem.id, {
                          labor_position_id: laborForm.labor_position_id,
                          preparation_time_minutes: parseFloat(laborForm.preparation_time_minutes)
                        });
                        setShowAddLabor(false);
                        setLaborForm({ labor_position_id: '', preparation_time_minutes: '' });
                      }}
                      className="w-full py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold btn-touch"
                    >
                      Agregar
                    </button>
                  </div>
                )}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {labor.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay mano de obra asignada</p>
                  ) : (
                    labor.map((lab) => (
                      <div key={lab.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{lab.position_name}</span>: {lab.preparation_time_minutes} min
                          {lab.total_labor_cost && (
                            <span className="text-gray-600 ml-2">(${lab.total_labor_cost.toFixed(2)})</span>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteLabor(lab.id)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs btn-touch"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Packaging */}
            {costCalculation?.config.includePackaging && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">📦 Empaques</h3>
                  <button
                    onClick={() => setShowAddPackaging(!showAddPackaging)}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold btn-touch"
                  >
                    {showAddPackaging ? '✕' : '+'}
                  </button>
                </div>
                {showAddPackaging && (
                  <div className="mb-2 p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <select
                      value={packagingForm.packaging_cost_id}
                      onChange={(e) => setPackagingForm({ ...packagingForm, packaging_cost_id: e.target.value })}
                      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Selecciona empaque</option>
                      {packagingCosts.filter(p => p.active).map(pack => (
                        <option key={pack.id} value={pack.id}>{pack.name} (${parseFloat(pack.cost_per_unit.toString()).toFixed(2)})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={packagingForm.quantity}
                      onChange={(e) => setPackagingForm({ ...packagingForm, quantity: e.target.value })}
                      placeholder="Cantidad"
                      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={packagingForm.channel}
                      onChange={(e) => setPackagingForm({ ...packagingForm, channel: e.target.value })}
                      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="all">Todos los canales</option>
                      <option value="dine_in">Solo salón</option>
                      <option value="delivery">Solo domicilio</option>
                      <option value="takeout">Solo para llevar</option>
                    </select>
                    <button
                      onClick={async () => {
                        if (!packagingForm.packaging_cost_id) {
                          return;
                        }
                        await onAddPackaging(selectedItem.id, {
                          packaging_cost_id: packagingForm.packaging_cost_id,
                          quantity: parseFloat(packagingForm.quantity) || 1,
                          channel: packagingForm.channel as 'all' | 'dine_in' | 'delivery' | 'takeout'
                        });
                        setShowAddPackaging(false);
                        setPackagingForm({ packaging_cost_id: '', quantity: '1', channel: 'all' });
                      }}
                      className="w-full py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold btn-touch"
                    >
                      Agregar
                    </button>
                  </div>
                )}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {packaging.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay empaques asignados</p>
                  ) : (
                    packaging.map((pack) => (
                      <div key={pack.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{pack.packaging_name}</span>: {pack.quantity} {pack.channel}
                          {pack.total_packaging_cost && (
                            <span className="text-gray-600 ml-2">(${pack.total_packaging_cost.toFixed(2)})</span>
                          )}
                        </div>
                        <button
                          onClick={() => onDeletePackaging(pack.id)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs btn-touch"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de Configuración
const ConfigTab: React.FC<{
  config: CostConfig | null;
  onConfigChange: (config: CostConfig) => void;
  onSave: () => void;
}> = ({ config, onConfigChange, onSave }) => {
  if (!config) return <p className="text-gray-500">Cargando configuración...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configuración General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Food Cost Objetivo (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={config.target_food_cost_percentage}
            onChange={(e) => onConfigChange({ ...config, target_food_cost_percentage: parseFloat(e.target.value) || 30 })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <select
            value={config.currency}
            onChange={(e) => onConfigChange({ ...config, currency: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="MXN">MXN ($)</option>
            <option value="COP">COP ($)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Impuesto (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={config.tax_percentage}
            onChange={(e) => onConfigChange({ ...config, tax_percentage: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Redondeo
          </label>
          <select
            value={config.price_rounding_method}
            onChange={(e) => onConfigChange({ ...config, price_rounding_method: e.target.value as any })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="nearest">Más cercano</option>
            <option value="up">Redondear arriba</option>
            <option value="down">Redondear abajo</option>
            <option value="none">Sin redondeo</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-800">Incluir en Cálculo de Costos</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.include_labor_in_cost}
            onChange={(e) => onConfigChange({ ...config, include_labor_in_cost: e.target.checked })}
            className="w-5 h-5"
          />
          <span>Incluir Mano de Obra</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.include_overhead_in_cost}
            onChange={(e) => onConfigChange({ ...config, include_overhead_in_cost: e.target.checked })}
            className="w-5 h-5"
          />
          <span>Incluir Costos Indirectos (Overhead)</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.include_packaging_in_cost}
            onChange={(e) => onConfigChange({ ...config, include_packaging_in_cost: e.target.checked })}
            className="w-5 h-5"
          />
          <span>Incluir Empaques</span>
        </label>
      </div>

      <button
        onClick={onSave}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold btn-touch"
      >
        Guardar Configuración
      </button>
    </div>
  );
};

// Componente para la pestaña de Mano de Obra
const ManoObraTab: React.FC<{
  laborPositions: LaborPosition[];
  onEdit: (position: LaborPosition) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}> = ({ laborPositions, onEdit, onDelete, onAdd }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">👨‍🍳 Cargos de Trabajo</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold btn-touch"
        >
          + Agregar Cargo
        </button>
      </div>
      <div className="space-y-3">
        {laborPositions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay cargos registrados</p>
        ) : (
          laborPositions.map((pos) => (
            <div key={pos.id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">{pos.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(pos)}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-sm font-semibold btn-touch"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(pos.id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-semibold btn-touch"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {pos.description && <p className="text-sm text-gray-600 mb-2">{pos.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Salario Mensual:</span>
                  <span className="font-semibold ml-2">${parseFloat(pos.monthly_salary.toString()).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Horas/Mes:</span>
                  <span className="font-semibold ml-2">{parseFloat(pos.hours_per_month.toString())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Costo/Minuto:</span>
                  <span className="font-semibold ml-2">${parseFloat(pos.cost_per_minute.toString()).toFixed(4)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de Overhead
const OverheadTab: React.FC<{
  overheadCosts: OverheadCost[];
  allocation: OverheadAllocationMethod | null;
  onEdit: (cost: OverheadCost) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onConfigureAllocation: () => void;
}> = ({ overheadCosts, allocation, onEdit, onDelete, onAdd, onConfigureAllocation }) => {
  const totalMonthly = overheadCosts.filter(c => c.active).reduce((sum, c) => sum + parseFloat(c.monthly_amount.toString()), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">🏢 Costos Indirectos</h2>
        <div className="flex gap-2">
          <button
            onClick={onConfigureAllocation}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold btn-touch"
          >
            ⚙️ Configurar Prorrateo
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold btn-touch"
          >
            + Agregar Costo
          </button>
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <p className="text-sm text-gray-600">Total Mensual de Overhead</p>
        <p className="text-2xl font-bold text-blue-600">${totalMonthly.toFixed(2)}</p>
        {allocation && (
          <p className="text-xs text-gray-600 mt-2">
            Método: {allocation.method_type === 'fixed_percentage' ? 'Porcentaje Fijo' :
                     allocation.method_type === 'per_plate' ? 'Por Plato' : 'Por Horas de Producción'}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {overheadCosts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay costos indirectos registrados</p>
        ) : (
          overheadCosts.map((cost) => (
            <div key={cost.id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{cost.name}</h3>
                  {cost.category && (
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{cost.category}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(cost)}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-sm font-semibold btn-touch"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(cost.id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-semibold btn-touch"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {cost.description && <p className="text-sm text-gray-600 mb-2">{cost.description}</p>}
              <p className="text-lg font-semibold text-gray-800">${parseFloat(cost.monthly_amount.toString()).toFixed(2)}/mes</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de Empaques
const EmpaquesTab: React.FC<{
  packagingCosts: PackagingCost[];
  onEdit: (cost: PackagingCost) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}> = ({ packagingCosts, onEdit, onDelete, onAdd }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">📦 Costos de Empaques</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold btn-touch"
        >
          + Agregar Empaque
        </button>
      </div>
      <div className="space-y-3">
        {packagingCosts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay empaques registrados</p>
        ) : (
          packagingCosts.map((pack) => (
            <div key={pack.id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">{pack.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(pack)}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-sm font-semibold btn-touch"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(pack.id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-semibold btn-touch"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {pack.description && <p className="text-sm text-gray-600 mb-2">{pack.description}</p>}
              <p className="text-lg font-semibold text-gray-800">
                ${parseFloat(pack.cost_per_unit.toString()).toFixed(2)}/{pack.unit}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de Reportes
const ReportesTab: React.FC<{
  items: MenuItemCostSummary[];
}> = ({ items }) => {
  const profitable = items.filter(i => i.profitPercentage >= 50);
  const atRisk = items.filter(i => i.profitPercentage >= 30 && i.profitPercentage < 50);
  const losing = items.filter(i => i.profitPercentage < 30);

  const sortedByProfit = [...items].sort((a, b) => b.profitMargin - a.profitMargin);
  const sortedByFoodCost = [...items].sort((a, b) => a.foodCostPercentage - b.foodCostPercentage);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Reportes y Analítica</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <p className="text-sm text-gray-600">Platos Rentables</p>
          <p className="text-2xl font-bold text-green-600">{profitable.length}</p>
          <p className="text-xs text-gray-500">Margen ≥ 50%</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <p className="text-sm text-gray-600">En Riesgo</p>
          <p className="text-2xl font-bold text-yellow-600">{atRisk.length}</p>
          <p className="text-xs text-gray-500">Margen 30-50%</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
          <p className="text-sm text-gray-600">Pérdida</p>
          <p className="text-2xl font-bold text-red-600">{losing.length}</p>
          <p className="text-xs text-gray-500">Margen &lt; 30%</p>
        </div>
      </div>

      {/* Top Profitable */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">🏆 Top 5 Platos Más Rentables</h3>
        <div className="space-y-2">
          {sortedByProfit.slice(0, 5).map((item, index) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">#{index + 1}</span>
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">Ganancia: ${item.profitMargin.toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded font-semibold ${
                item.profitPercentage >= 50
                  ? 'bg-green-100 text-green-700'
                  : item.profitPercentage >= 30
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {item.profitPercentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Food Cost Issues */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">⚠️ Food Cost Fuera de Rango (&gt; 40%)</h3>
        <div className="space-y-2">
          {sortedByFoodCost.filter(i => i.foodCostPercentage > 40).map((item) => (
            <div key={item.id} className="p-3 bg-red-50 rounded border-2 border-red-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-600">FC: {item.foodCostPercentage.toFixed(1)}%</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded font-semibold">
                ${item.costs.total.toFixed(2)} costo
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente para la pestaña de Pricing Dinámico
const PricingTab: React.FC<{
  items: MenuItemCostSummary[];
  selectedItem: MenuItemCostSummary | null;
  onSelectItem: (item: MenuItemCostSummary | null) => void;
  onRefresh: () => Promise<void>;
}> = ({ items, selectedItem, onSelectItem, onRefresh }) => {
  const [recommendation, setRecommendation] = useState<PriceRecommendation | null>(null);
  const [scenarios, setScenarios] = useState<PricingScenario[]>([]);
  const [elasticity, setElasticity] = useState<PriceElasticity | null>(null);
  const [, setPricingConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    category_type: 'complement' as 'star' | 'anchor' | 'complement',
    min_margin_percentage: '',
    target_food_cost: '',
    price_floor: '',
    price_ceiling: '',
    psychological_price_points: '',
    enable_dynamic_pricing: true
  });

  useEffect(() => {
    if (selectedItem) {
      loadPricingData(selectedItem.id);
    }
  }, [selectedItem]);

  const loadPricingData = async (menuItemId: string) => {
    try {
      setLoading(true);
      const [rec, scen, elast, config] = await Promise.all([
        dynamicPricingService.getRecommendation(menuItemId).catch(() => null),
        dynamicPricingService.getScenarios(menuItemId).catch(() => []),
        dynamicPricingService.getElasticity(menuItemId).catch(() => null),
        dynamicPricingService.getPricingConfig(menuItemId).catch(() => null)
      ]);
      setRecommendation(rec);
      setScenarios(scen);
      setElasticity(elast);
      setPricingConfig(config);
      if (config) {
        setConfigForm({
          category_type: config.category_type || 'complement',
          min_margin_percentage: config.min_margin_percentage?.toString() || '',
          target_food_cost: config.target_food_cost?.toString() || '',
          price_floor: config.price_floor?.toString() || '',
          price_ceiling: config.price_ceiling?.toString() || '',
          psychological_price_points: config.psychological_price_points?.join(', ') || '',
          enable_dynamic_pricing: config.enable_dynamic_pricing
        });
      }
    } catch (error: any) {
      console.error('Error loading pricing data:', error);
      toast.error('Error al cargar datos de pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async () => {
    if (!recommendation) return;
    try {
      await dynamicPricingService.applyRecommendation(recommendation.recommendationId);
      toast.success('Precio aplicado correctamente');
      await onRefresh();
      if (selectedItem) {
        await loadPricingData(selectedItem.id);
      }
    } catch (error: any) {
      console.error('Error applying recommendation:', error);
      toast.error('Error al aplicar precio');
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedItem) return;
    try {
      const psychologicalPoints = configForm.psychological_price_points
        .split(',')
        .map(p => parseFloat(p.trim()))
        .filter(p => !isNaN(p));

      await dynamicPricingService.updatePricingConfig(selectedItem.id, {
        category_type: configForm.category_type,
        min_margin_percentage: configForm.min_margin_percentage ? parseFloat(configForm.min_margin_percentage) : undefined,
        target_food_cost: configForm.target_food_cost ? parseFloat(configForm.target_food_cost) : undefined,
        price_floor: configForm.price_floor ? parseFloat(configForm.price_floor) : undefined,
        price_ceiling: configForm.price_ceiling ? parseFloat(configForm.price_ceiling) : undefined,
        psychological_price_points: psychologicalPoints.length > 0 ? psychologicalPoints : undefined,
        enable_dynamic_pricing: configForm.enable_dynamic_pricing
      });
      toast.success('Configuración guardada');
      setShowConfigModal(false);
      await loadPricingData(selectedItem.id);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">🤖 Pricing Dinámico con IA</h2>
        {selectedItem && (
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold btn-touch"
          >
            ⚙️ Configurar
          </button>
        )}
      </div>

      {!selectedItem ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Selecciona un plato para ver recomendaciones de pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {items.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 text-left btn-touch"
              >
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-600">Precio: ${item.price.toFixed(2)}</p>
                <p className="text-sm text-gray-600">FC: {item.foodCostPercentage.toFixed(1)}%</p>
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Calculando recomendaciones...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Price Recommendation */}
          {recommendation && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-4 border-blue-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Recomendación de Precio</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Precio Actual</p>
                  <p className="text-2xl font-bold text-gray-800">${recommendation.currentPrice.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border-4 border-green-400">
                  <p className="text-sm text-gray-600 mb-1">Precio Recomendado</p>
                  <p className="text-2xl font-bold text-green-600">${recommendation.recommendedPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confianza: {recommendation.confidenceLevel.toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Rango</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${recommendation.minPrice.toFixed(2)} - ${recommendation.maxPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Food Cost</p>
                  <p className={`text-lg font-bold ${
                    recommendation.projectedFoodCost <= 30 ? 'text-green-600' :
                    recommendation.projectedFoodCost <= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {recommendation.projectedFoodCost.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Margen</p>
                  <p className="text-lg font-bold text-green-600">
                    {recommendation.projectedMarginPercentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Impacto Ventas</p>
                  <p className={`text-lg font-bold ${
                    recommendation.expectedSalesImpact >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {recommendation.expectedSalesImpact >= 0 ? '+' : ''}{recommendation.expectedSalesImpact.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Ganancia</p>
                  <p className="text-lg font-bold text-green-600">
                    ${recommendation.projectedMargin.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">📝 Explicación:</p>
                <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
              </div>
              <button
                onClick={handleApplyRecommendation}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold btn-touch"
              >
                ✅ Aplicar Precio Recomendado
              </button>
            </div>
          )}

          {/* Elasticity Info */}
          {elasticity && (
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <h4 className="font-bold text-gray-800 mb-2">📊 Elasticidad de Precio</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Coeficiente</p>
                  <p className="font-bold text-gray-800">{parseFloat(elasticity.elasticity_coefficient.toString()).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sensibilidad</p>
                  <p className={`font-bold ${
                    elasticity.price_sensitivity === 'elastic' ? 'text-red-600' :
                    elasticity.price_sensitivity === 'inelastic' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {elasticity.price_sensitivity === 'elastic' ? 'Elástica' :
                     elasticity.price_sensitivity === 'inelastic' ? 'Inelástica' : 'Unitaria'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Volumen Base</p>
                  <p className="font-bold text-gray-800">{elasticity.base_volume}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scenarios */}
          {scenarios.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Escenarios de Precio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarios.map((scenario, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      scenario.name.includes('Óptimo') ? 'bg-green-50 border-green-300' :
                      scenario.name.includes('Actual') ? 'bg-blue-50 border-blue-300' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h4 className="font-bold text-gray-800 mb-2">{scenario.name}</h4>
                    <p className="text-xs text-gray-600 mb-3">{scenario.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio:</span>
                        <span className="font-bold">${scenario.testPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volumen Proyectado:</span>
                        <span className="font-bold">{scenario.projectedVolume}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ingresos:</span>
                        <span className="font-bold text-green-600">${scenario.projectedRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ganancia Total:</span>
                        <span className="font-bold text-green-600">${scenario.projectedMarginTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Food Cost:</span>
                        <span className={`font-bold ${
                          scenario.projectedFoodCost <= 30 ? 'text-green-600' :
                          scenario.projectedFoodCost <= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {scenario.projectedFoodCost.toFixed(1)}%
                        </span>
                      </div>
                      {scenario.volumeChange !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cambio Volumen:</span>
                          <span className={`font-bold ${
                            scenario.volumeChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {scenario.volumeChange >= 0 ? '+' : ''}{scenario.volumeChange.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Configuración de Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Categoría</label>
                <select
                  value={configForm.category_type}
                  onChange={(e) => setConfigForm({ ...configForm, category_type: e.target.value as any })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                >
                  <option value="star">⭐ Estrella (Plato principal)</option>
                  <option value="anchor">⚓ Ancla (Atrae clientes)</option>
                  <option value="complement">🍽️ Complemento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margen Mínimo (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={configForm.min_margin_percentage}
                  onChange={(e) => setConfigForm({ ...configForm, min_margin_percentage: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Cost Objetivo (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={configForm.target_food_cost}
                  onChange={(e) => setConfigForm({ ...configForm, target_food_cost: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.price_floor}
                  onChange={(e) => setConfigForm({ ...configForm, price_floor: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Máximo</label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.price_ceiling}
                  onChange={(e) => setConfigForm({ ...configForm, price_ceiling: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precios Psicológicos (separados por comas)</label>
                <input
                  type="text"
                  value={configForm.psychological_price_points}
                  onChange={(e) => setConfigForm({ ...configForm, psychological_price_points: e.target.value })}
                  placeholder="Ej: 19.90, 29.90, 39.90"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={configForm.enable_dynamic_pricing}
                  onChange={(e) => setConfigForm({ ...configForm, enable_dynamic_pricing: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Habilitar Pricing Dinámico</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveConfig}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold btn-touch"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold btn-touch"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modales
const LaborModal: React.FC<{
  form: { name: string; description: string; monthly_salary: string; hours_per_month: string };
  onFormChange: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  editing: LaborPosition | null;
}> = ({ form, onFormChange, onSave, onClose, editing }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nuevo'} Cargo</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salario Mensual *</label>
            <input
              type="number"
              step="0.01"
              value={form.monthly_salary}
              onChange={(e) => onFormChange({ ...form, monthly_salary: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horas por Mes</label>
            <input
              type="number"
              step="0.1"
              value={form.hours_per_month}
              onChange={(e) => onFormChange({ ...form, hours_per_month: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold btn-touch"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const OverheadModal: React.FC<{
  form: { name: string; description: string; monthly_amount: string; category: string };
  onFormChange: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  editing: OverheadCost | null;
}> = ({ form, onFormChange, onSave, onClose, editing }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nuevo'} Costo Indirecto</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Mensual *</label>
            <input
              type="number"
              step="0.01"
              value={form.monthly_amount}
              onChange={(e) => onFormChange({ ...form, monthly_amount: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => onFormChange({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            >
              <option value="">Sin categoría</option>
              <option value="rent">Arriendo</option>
              <option value="utilities">Servicios Públicos</option>
              <option value="internet">Internet</option>
              <option value="software">Software</option>
              <option value="cleaning">Limpieza</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold btn-touch"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const AllocationModal: React.FC<{
  form: { method_type: string; fixed_percentage: string; per_plate_amount: string; production_hours_per_month: string };
  onFormChange: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ form, onFormChange, onSave, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Configurar Método de Prorrateo</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método *</label>
            <select
              value={form.method_type}
              onChange={(e) => onFormChange({ ...form, method_type: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            >
              <option value="per_plate">Por Plato</option>
              <option value="fixed_percentage">Porcentaje Fijo</option>
              <option value="production_hours">Por Horas de Producción</option>
            </select>
          </div>
          {form.method_type === 'fixed_percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.fixed_percentage}
                onChange={(e) => onFormChange({ ...form, fixed_percentage: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
          )}
          {form.method_type === 'per_plate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto por Plato</label>
              <input
                type="number"
                step="0.01"
                value={form.per_plate_amount}
                onChange={(e) => onFormChange({ ...form, per_plate_amount: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
          )}
          {form.method_type === 'production_hours' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Producción por Mes</label>
              <input
                type="number"
                step="0.1"
                value={form.production_hours_per_month}
                onChange={(e) => onFormChange({ ...form, production_hours_per_month: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold btn-touch"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const PackagingModal: React.FC<{
  form: { name: string; description: string; cost_per_unit: string; unit: string };
  onFormChange: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  editing: PackagingCost | null;
}> = ({ form, onFormChange, onSave, onClose, editing }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nuevo'} Empaque</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Unidad *</label>
            <input
              type="number"
              step="0.01"
              value={form.cost_per_unit}
              onChange={(e) => onFormChange({ ...form, cost_per_unit: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <select
              value={form.unit}
              onChange={(e) => onFormChange({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            >
              <option value="unidad">Unidad</option>
              <option value="g">Gramos</option>
              <option value="kg">Kilogramos</option>
              <option value="ml">Mililitros</option>
              <option value="l">Litros</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold btn-touch"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateItemModal: React.FC<{
  menus: Menu[];
  selectedMenu: Menu | null;
  onMenuChange: (menu: Menu | null) => void;
  menuDetail: any;
  form: { name: string; description: string; price: string; categoryId: string; available: boolean };
  onFormChange: (form: any) => void;
  inventoryItems: InventoryItem[];
  ingredients: Array<{ inventoryItemId: string; quantity: number; unit: string; ingredientName: string }>;
  tempIngredient: { inventoryItemId: string; quantity: string; unit: string };
  onTempIngredientChange: (ing: any) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({
  menus,
  selectedMenu,
  onMenuChange,
  menuDetail,
  form,
  onFormChange,
  inventoryItems,
  ingredients,
  tempIngredient,
  onTempIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  onSave,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Plato</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl btn-touch">✕</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menú</label>
              <select
                value={selectedMenu?.id || ''}
                onChange={(e) => {
                  const menu = menus.find(m => m.id === e.target.value);
                  onMenuChange(menu || null);
                  onFormChange({ ...form, categoryId: '' });
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              >
                {menus.map(menu => (
                  <option key={menu.id} value={menu.id}>{menu.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
              <select
                value={form.categoryId}
                onChange={(e) => onFormChange({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              >
                <option value="">Selecciona una categoría</option>
                {menuDetail?.categories?.map((cat: MenuCategory) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Plato *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                placeholder="Ej: Pollo a la Plancha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio de Venta *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => onFormChange({ ...form, price: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
            <div className="border-t-2 border-gray-200 pt-4">
              <h3 className="font-bold text-gray-800 mb-3">Ingredientes</h3>
              <div className="mb-3 p-3 bg-blue-50 rounded border-2 border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <select
                    value={tempIngredient.inventoryItemId}
                    onChange={(e) => onTempIngredientChange({ ...tempIngredient, inventoryItemId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Ingrediente</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={tempIngredient.quantity}
                    onChange={(e) => onTempIngredientChange({ ...tempIngredient, quantity: e.target.value })}
                    placeholder="Cantidad"
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={tempIngredient.unit}
                    onChange={(e) => onTempIngredientChange({ ...tempIngredient, unit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="unidad">unidad</option>
                  </select>
                </div>
                <button
                  onClick={onAddIngredient}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold btn-touch"
                >
                  + Agregar Ingrediente
                </button>
              </div>
              {ingredients.length > 0 && (
                <div className="space-y-2">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-sm">
                      <span>{ing.ingredientName}: {ing.quantity} {ing.unit}</span>
                      <button
                        onClick={() => onRemoveIngredient(index)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded btn-touch"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onSave}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold btn-touch"
            >
              Crear Plato
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold btn-touch"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
