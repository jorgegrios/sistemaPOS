/**
 * Ingredient Selector Modal
 * Permite seleccionar/editar ingredientes con ayuda del analizador inteligente
 */

import React, { useState, useEffect } from 'react';
import { ingredientAnalyzer, IngredientSuggestion } from '../services/ingredient-analyzer';

interface IngredientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ingredients: string[]) => void;
  initialDescription?: string;
  initialIngredients?: string[];
  productName?: string;
}

export const IngredientSelectorModal: React.FC<IngredientSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialDescription = '',
  initialIngredients = [],
  productName = ''
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set(initialIngredients.map(ing => ing.toLowerCase()))
  );
  const [customIngredient, setCustomIngredient] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisTimeout, setAnalysisTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialDescription) {
      setDescription(initialDescription);
      analyzeDescription(initialDescription);
    }
    if (initialIngredients.length > 0) {
      setSelectedIngredients(new Set(initialIngredients.map(ing => ing.toLowerCase())));
    }
  }, [initialDescription, initialIngredients]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    };
  }, []);

  const analyzeDescription = async (desc: string) => {
    if (!desc || desc.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setAnalyzing(true);
    try {
      // Simular pequeño delay para mostrar feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));
      const analyzed = ingredientAnalyzer.analyzeIngredients(desc);
      setSuggestions(analyzed);
    } catch (error) {
      console.error('Error analizando ingredientes:', error);
      setSuggestions([]);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Analizar automáticamente después de un delay cuando cambia la descripción
    if (description && description.trim().length >= 3) {
      // Limpiar timeout anterior si existe
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeDescription(description);
      }, 800);
      
      return () => {
        if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
          analysisTimeoutRef.current = null;
        }
      };
    } else {
      setSuggestions([]);
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    }
  }, [description]);

  const toggleIngredient = (ingredient: string) => {
    const normalized = ingredient.toLowerCase();
    const newSet = new Set(selectedIngredients);
    
    if (newSet.has(normalized)) {
      newSet.delete(normalized);
    } else {
      newSet.add(normalized);
    }
    
    setSelectedIngredients(newSet);
  };

  const addCustomIngredient = () => {
    if (!customIngredient.trim()) return;
    
    const trimmed = customIngredient.trim();
    if (ingredientAnalyzer.isValidIngredient(trimmed)) {
      const newSet = new Set(selectedIngredients);
      newSet.add(trimmed.toLowerCase());
      setSelectedIngredients(newSet);
      setCustomIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    const newSet = new Set(selectedIngredients);
    newSet.delete(ingredient.toLowerCase());
    setSelectedIngredients(newSet);
  };

  const handleConfirm = () => {
    const ingredients = Array.from(selectedIngredients).map(ing => 
      ing.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    );
    onConfirm(ingredients);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🤖</span>
            <span>Análisis Inteligente de Ingredientes</span>
          </h2>
          {productName && (
            <p className="text-indigo-100 mt-1 text-sm">
              Producto: <span className="font-semibold">{productName}</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción del plato:
            </label>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Ej: Filete de pescado fresco a la plancha con vegetales y arroz"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none min-h-[100px] text-sm"
            />
            {analyzing && (
              <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                <span className="animate-spin">⏳</span>
                Analizando descripción...
              </p>
            )}
          </div>

          {/* Sugerencias del analizador */}
          {suggestions.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h3 className="font-bold text-blue-800">
                  Ingredientes sugeridos por el analizador:
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, idx) => {
                  const isSelected = selectedIngredients.has(suggestion.name.toLowerCase());
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleIngredient(suggestion.name)}
                      className={`
                        p-3 rounded-lg border-2 transition-all text-left
                        ${isSelected
                          ? 'bg-green-100 border-green-400 shadow-md'
                          : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>
                            {isSelected && <span className="mr-1">✓</span>}
                            {suggestion.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {suggestion.reason}
                          </p>
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              suggestion.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                              suggestion.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              Confianza: {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agregar ingrediente personalizado */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>➕</span>
              <span>Agregar ingrediente personalizado:</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={customIngredient}
                onChange={(e) => setCustomIngredient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomIngredient();
                  }
                }}
                placeholder="Ej: Cebolla morada"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              />
              <button
                onClick={addCustomIngredient}
                disabled={!ingredientAnalyzer.isValidIngredient(customIngredient)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Ingredientes seleccionados */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span>
              <span>Ingredientes seleccionados ({selectedIngredients.size}):</span>
            </h3>
            {selectedIngredients.size === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <p className="text-yellow-800 text-sm">
                  No hay ingredientes seleccionados. Agrega ingredientes desde las sugerencias o manualmente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from(selectedIngredients).map((ingredient, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-300 rounded-lg"
                  >
                    <span className="font-semibold text-green-800 text-sm flex-1">
                      {ingredient.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-2 w-6 h-6 bg-red-400 text-white rounded flex items-center justify-center text-xs hover:bg-red-500 active:scale-95 transition min-h-[24px] min-w-[24px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 active:scale-95 transition min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIngredients.size === 0}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
          >
            Confirmar ({selectedIngredients.size} ingredientes)
          </button>
        </div>
      </div>
    </div>
  );
};

