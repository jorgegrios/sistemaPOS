/**
 * Product Customization Modal
 * Permite al mesero seleccionar/deseleccionar ingredientes y agregar adiciones
 */

import React, { useState, useEffect } from 'react';
import { Product, Modifier } from '../domains/products/service';

interface ProductIngredient {
  name: string;
  included: boolean; // Si está incluido por defecto
}

interface ProductCustomization {
  excludedIngredients: string[]; // Nombres de ingredientes excluidos
  additions: Array<{ modifierId: string; name: string; priceDelta: number }>; // Adiciones agregadas
}

interface ProductCustomizationModalProps {
  product: Product;
  availableModifiers?: Modifier[]; // Modificadores disponibles para adiciones
  includedIngredients?: string[]; // Ingredientes incluidos por defecto (parseados de description)
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customization: ProductCustomization) => void;
}

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  product,
  availableModifiers = [],
  includedIngredients = [],
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Parsear ingredientes de la descripción si no se proporcionan
  // Mejora: Separa mejor los ingredientes considerando múltiples separadores
  const parseIngredientsFromDescription = (description?: string): string[] => {
    if (!description) return [];
    
    let text = description.trim();
    
    // Remover palabras comunes al inicio como "incluye", "contiene", "con", etc.
    text = text.replace(/^(incluye|contiene|con|tiene|viene con|trae)\s*:?\s*/i, '');
    
    // Reemplazar múltiples separadores comunes por un separador único
    // "y", "con", ",", "y con", "más", "además", etc.
    text = text.replace(/\s*(y|con|y con|más|además|incluye|también|o|ó)\s+/gi, '|SEPARADOR|');
    
    // Separar por comas también
    text = text.replace(/,/g, '|SEPARADOR|');
    
    // Separar por el separador personalizado
    const parts = text.split('|SEPARADOR|').map(p => p.trim()).filter(p => p.length > 0);
    
    const ingredients: string[] = [];
    
    parts.forEach(part => {
      // Limpiar cada parte
      let cleaned = part.trim();
      
      // Remover números y cantidades al inicio (ej: "tres tacos" -> "tacos", "2 hamburguesas" -> "hamburguesas")
      cleaned = cleaned.replace(/^\d+\s+/, ''); // "2 hamburguesas" -> "hamburguesas"
      cleaned = cleaned.replace(/^(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|una|un)\s+/i, ''); // "tres tacos" -> "tacos"
      
      // Remover palabras comunes al inicio
      cleaned = cleaned.replace(/^(con|sin|de|la|el|las|los|del|de la|de los|de las)\s+/i, '');
      
      // Limpiar espacios múltiples
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      // Remover caracteres especiales innecesarios al inicio y final
      cleaned = cleaned.replace(/^[.,;:\-\s]+|[.,;:\-\s]+$/g, '');
      
      // Solo agregar si tiene al menos 2 caracteres y no es solo números
      if (cleaned && cleaned.length >= 2 && !/^\d+$/.test(cleaned)) {
        ingredients.push(cleaned);
      }
    });
    
    // Si aún no tenemos ingredientes, intentar dividir por espacios si la descripción es corta
    if (ingredients.length === 0 && description.length < 100 && !description.includes(',')) {
      const words = description.trim().split(/\s+/).filter(w => w.length > 3);
      if (words.length <= 5) {
        ingredients.push(...words);
      }
    }
    
    // Si todavía no tenemos ingredientes, usar la descripción completa (limpiada)
    if (ingredients.length === 0 && description.length < 100) {
      const cleaned = description.replace(/^(incluye|contiene|con)\s*:?\s*/i, '').trim();
      if (cleaned) {
        ingredients.push(cleaned);
      }
    }
    
    // Eliminar duplicados (case-insensitive)
    const uniqueIngredients: string[] = [];
    const seen = new Set<string>();
    
    ingredients.forEach(ing => {
      const lower = ing.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueIngredients.push(ing);
      }
    });
    
    return uniqueIngredients;
  };

  const defaultIngredients = includedIngredients.length > 0 
    ? includedIngredients 
    : parseIngredientsFromDescription(product.description);

  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set(defaultIngredients) // Todos seleccionados por defecto
  );
  
  const [selectedAdditions, setSelectedAdditions] = useState<Set<string>>(
    new Set() // Ninguna adición por defecto
  );

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedIngredients(new Set(defaultIngredients));
      setSelectedAdditions(new Set());
    }
  }, [isOpen, defaultIngredients]);

  const toggleIngredient = (ingredient: string) => {
    const newSet = new Set(selectedIngredients);
    if (newSet.has(ingredient)) {
      newSet.delete(ingredient);
    } else {
      newSet.add(ingredient);
    }
    setSelectedIngredients(newSet);
  };

  const toggleAddition = (modifierId: string) => {
    const newSet = new Set(selectedAdditions);
    if (newSet.has(modifierId)) {
      newSet.delete(modifierId);
    } else {
      newSet.add(modifierId);
    }
    setSelectedAdditions(newSet);
  };

  const handleConfirm = () => {
    // Ingredientes excluidos = ingredientes por defecto que NO están seleccionados
    const excludedIngredients = defaultIngredients.filter(
      ing => !selectedIngredients.has(ing)
    );

    // Adiciones seleccionadas
    const additions = Array.from(selectedAdditions)
      .map(modifierId => {
        const modifier = availableModifiers.find(m => m.id === modifierId);
        if (!modifier) return null;
        return {
          modifierId: modifier.id,
          name: modifier.name,
          priceDelta: modifier.priceDelta,
        };
      })
      .filter((add): add is { modifierId: string; name: string; priceDelta: number } => add !== null);

    onConfirm({
      excludedIngredients,
      additions,
    });
    onClose();
  };

  if (!isOpen) return null;

  // Calcular precio total con adiciones
  const additionsTotal = Array.from(selectedAdditions)
    .reduce((sum, modifierId) => {
      const modifier = availableModifiers.find(m => m.id === modifierId);
      return sum + (modifier?.priceDelta || 0);
    }, 0);

  const totalPrice = product.basePrice + additionsTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
              {product.description && (
                <p className="text-indigo-100 text-sm">{product.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Ingredientes Incluidos */}
          {defaultIngredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🍽️</span>
                <span>Ingredientes Incluidos</span>
              </h3>
              <div className="space-y-2">
                {defaultIngredients.map((ingredient, index) => {
                  const isSelected = selectedIngredients.has(ingredient);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleIngredient(ingredient)}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all duration-200 active:scale-95
                        min-h-[52px] flex items-center justify-between
                        ${isSelected
                          ? 'bg-green-50 border-green-400 shadow-md'
                          : 'bg-red-50 border-red-300 shadow-sm'
                        }
                      `}
                    >
                      <span className={`font-semibold ${isSelected ? 'text-green-800' : 'text-red-700 line-through'}`}>
                        {ingredient}
                      </span>
                      <span className={`
                        text-2xl transition-transform
                        ${isSelected ? 'text-green-600' : 'text-red-500'}
                      `}>
                        {isSelected ? '✓' : '✕'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Deselecciona los ingredientes que NO quieres incluir
              </p>
            </div>
          )}

          {/* Adiciones Disponibles */}
          {availableModifiers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">➕</span>
                <span>Adiciones Disponibles</span>
              </h3>
              <div className="space-y-2">
                {availableModifiers.map((modifier) => {
                  const isSelected = selectedAdditions.has(modifier.id);
                  return (
                    <button
                      key={modifier.id}
                      onClick={() => toggleAddition(modifier.id)}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all duration-200 active:scale-95
                        min-h-[52px] flex items-center justify-between
                        ${isSelected
                          ? 'bg-blue-50 border-blue-400 shadow-md'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex-1 text-left">
                        <span className={`font-semibold ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                          {modifier.name}
                        </span>
                        {modifier.priceDelta > 0 && (
                          <span className="text-sm text-gray-600 ml-2">
                            (+${modifier.priceDelta.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span className={`
                        text-2xl transition-transform
                        ${isSelected ? 'text-blue-600' : 'text-gray-400'}
                      `}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Si no hay ingredientes ni adiciones */}
          {defaultIngredients.length === 0 && availableModifiers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Este producto no tiene opciones de personalización</p>
            </div>
          )}
        </div>

        {/* Footer con precio y botones */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-700">Precio base:</span>
            <span className="text-lg font-bold text-gray-800">${product.basePrice.toFixed(2)}</span>
          </div>
          {additionsTotal > 0 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-blue-700">Adiciones:</span>
              <span className="text-lg font-bold text-blue-700">+${additionsTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-6 pt-4 border-t-2 border-gray-300">
            <span className="text-xl font-bold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-indigo-600">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 transition min-h-[52px]"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition min-h-[52px]"
            >
              Agregar al Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

