/**
 * Menu Page
 * Browse and manage menu items (admin only)
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { menuService, MenuItem, Menu } from '../services/menu-service';

export const MenuPage: React.FC = () => {
  const { user } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true);
        const menuList = await menuService.getMenus(user?.restaurantId || '');
        setMenus(menuList);
        if (menuList.length > 0) {
          setSelectedMenu(menuList[0]);
          const details = await menuService.getMenuDetail(
            user?.restaurantId || '',
            menuList[0].id
          );
          setItems(details.items || []);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load menu';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (user?.restaurantId) {
      loadMenus();
    }
  }, [user?.restaurantId]);

  const handleMenuChange = async (menu: Menu) => {
    try {
      setSelectedMenu(menu);
      const details = await menuService.getMenuDetail(user?.restaurantId || '', menu.id);
      setItems(details.items || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load menu';
      setError(errorMsg);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Menu</h1>
        <p className="text-gray-600">Browse restaurant menu items</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Loading menu...</p>
        </div>
      ) : (
        <>
          {/* Menu Selection */}
          {menus.length > 1 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Select Menu</h2>
              <div className="flex flex-wrap gap-2">
                {menus.map(menu => (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuChange(menu)}
                    className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                      selectedMenu?.id === menu.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-600">No items in this menu</p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition duration-200"
                >
                  {/* Item Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                      {!item.available && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Footer */}
                  <div className="p-6 flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      ${item.price.toFixed(2)}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded font-medium text-sm transition duration-200">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded font-medium text-sm transition duration-200">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
