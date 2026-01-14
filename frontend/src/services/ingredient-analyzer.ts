/**
 * Ingredient Analyzer Agent
 * Analiza descripciones de platos para identificar ingredientes reales
 * Evita dividir incorrectamente nombres compuestos (ej: "filete de pescado fresco")
 */

export interface IngredientSuggestion {
  name: string;
  confidence: number;
  reason: string;
}

interface ParsedIngredient {
  text: string;
  startIndex: number;
  endIndex: number;
}

class IngredientAnalyzer {
  // Palabras descriptivas que NO son ingredientes
  private descriptiveWords = new Set([
    'fresco', 'fresca', 'frescos', 'frescas',
    'caliente', 'calientes',
    'frío', 'fría', 'fríos', 'frías',
    'crudo', 'cruda', 'crudos', 'crudas',
    'cocido', 'cocida', 'cocidos', 'cocidas',
    'asado', 'asada', 'asados', 'asadas',
    'a la plancha', 'a la parrilla', 'al vapor', 'al horno',
    'premium', 'selecto', 'seleccionado',
    'casero', 'casera', 'artesanal',
    'con', 'sin', 'incluye', 'viene', 'trae',
    'porción', 'porciones', 'rodajas', 'trozos',
    'empanizado', 'empanizada', 'rebosado', 'rebosada',
    'glaseado', 'glaseada', 'salteado', 'salteada'
  ]);

  // Adjetivos de calidad que van con ingredientes (no deben separarse)
  private qualityAdjectives = new Set([
    'fresco', 'fresca', 'premium', 'selecto', 'selecta',
    'artesanal', 'casero', 'casera', 'natural', 'orgánico', 'orgánica'
  ]);

  // Palabras que indican separación de ingredientes
  private separatorWords = new Set([
    'y', 'con', 'además', 'más', 'incluye', 'también',
    'o', 'ó', 'sin', 'menos', 'extra'
  ]);

  // Ingredientes comunes reconocidos (para mejorar confianza)
  private commonIngredients = new Set([
    'tomate', 'tomates', 'cebolla', 'cebollas',
    'lechuga', 'pollo', 'carne', 'pescado', 'marisco', 'mariscos',
    'queso', 'huevo', 'huevos',
    'ajo', 'perejil', 'cilantro',
    'pimiento', 'pimientos', 'pimentón',
    'champiñones', 'hongos', 'setas',
    'aguacate', 'palta',
    'limón', 'limones', 'lima',
    'aceite', 'sal', 'pimienta',
    'papas', 'papas fritas', 'patatas',
    'arroz', 'pasta', 'fideos',
    'pan', 'tortillas',
    'salsa', 'salsas', 'aderezo', 'aderezos'
  ]);

  /**
   * Analiza una descripción de plato y sugiere ingredientes
   */
  analyzeIngredients(description: string): IngredientSuggestion[] {
    if (!description || description.trim().length === 0) {
      return [];
    }

    const suggestions: IngredientSuggestion[] = [];
    const normalizedDesc = this.normalizeText(description);
    
    // Estrategia 1: Dividir por separadores comunes
    const parts = this.splitBySeparators(normalizedDesc);
    
    // Estrategia 2: Analizar cada parte para identificar ingredientes reales
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length < 2) continue;
      
      const analysis = this.analyzePart(trimmed, normalizedDesc);
      if (analysis.isIngredient) {
        suggestions.push({
          name: analysis.name,
          confidence: analysis.confidence,
          reason: analysis.reason
        });
      }
    }

    // Eliminar duplicados (case-insensitive)
    const uniqueSuggestions = this.removeDuplicates(suggestions);
    
    // Ordenar por confianza (mayor primero)
    return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Normaliza el texto para análisis
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?]/g, '');
  }

  /**
   * Divide el texto por separadores pero preserva frases compuestas
   */
  private splitBySeparators(text: string): string[] {
    // Primero, proteger frases compuestas comunes
    let protectedText = text;
    
    // Proteger frases como "filete de pescado", "a la plancha", etc.
    const phrases = [
      'filete de pescado',
      'filete de res',
      'pechuga de pollo',
      'costillas de cerdo',
      'a la plancha',
      'a la parrilla',
      'al vapor',
      'al horno',
      'papas fritas',
      'aros de cebolla',
      'queso parmesano',
      'queso mozzarella',
      'salsa ranchera',
      'salsa verde',
      'salsa roja'
    ];

    for (const phrase of phrases) {
      protectedText = protectedText.replace(
        new RegExp(phrase, 'gi'),
        phrase.replace(/\s+/g, '_PROTECTED_')
      );
    }

    // Dividir por separadores
    let parts = protectedText.split(/[,|]/);
    
    // Si no hay comas, intentar dividir por palabras separadoras
    if (parts.length === 1) {
      const separators = /\s+(y|con|además|más|incluye|también|sin)\s+/gi;
      parts = protectedText.split(separators);
    }

    // Restaurar frases protegidas y limpiar
    return parts.map(p => 
      p.replace(/_PROTECTED_/g, ' ')
       .trim()
       .replace(/^(y|con|además|más|incluye|también|sin)\s+/i, '')
       .trim()
    ).filter(p => p.length > 0);
  }

  /**
   * Analiza una parte del texto para determinar si es un ingrediente
   */
  private analyzePart(
    part: string, 
    fullDescription: string
  ): { isIngredient: boolean; name: string; confidence: number; reason: string } {
    const trimmed = part.trim();
    
    // Eliminar palabras descriptivas al inicio/final
    let cleaned = trimmed;
    const words = cleaned.split(/\s+/);
    
    // Remover palabras descriptivas del final
    while (words.length > 1 && this.descriptiveWords.has(words[words.length - 1])) {
      words.pop();
      cleaned = words.join(' ');
    }
    
    // Remover palabras descriptivas del inicio (excepto si es un ingrediente conocido con adjetivo)
    if (words.length > 1 && this.descriptiveWords.has(words[0])) {
      // Verificar si el resto es un ingrediente conocido
      const rest = words.slice(1).join(' ');
      if (!this.commonIngredients.has(rest.toLowerCase())) {
        cleaned = rest;
      }
    }

    // Verificar si es solo una palabra descriptiva
    if (this.descriptiveWords.has(cleaned.toLowerCase())) {
      return {
        isIngredient: false,
        name: cleaned,
        confidence: 0,
        reason: 'Es una palabra descriptiva, no un ingrediente'
      };
    }

    // Verificar si es un ingrediente común
    if (this.commonIngredients.has(cleaned.toLowerCase())) {
      return {
        isIngredient: true,
        name: this.capitalizeFirst(cleaned),
        confidence: 0.9,
        reason: 'Ingrediente común reconocido'
      };
    }

    // Verificar si contiene palabras de ingredientes conocidos
    const containsKnownIngredient = Array.from(this.commonIngredients).some(
      ing => cleaned.toLowerCase().includes(ing)
    );

    if (containsKnownIngredient) {
      return {
        isIngredient: true,
        name: this.capitalizeFirst(cleaned),
        confidence: 0.7,
        reason: 'Contiene un ingrediente conocido'
      };
    }

    // Verificar longitud mínima
    if (cleaned.length < 3) {
      return {
        isIngredient: false,
        name: cleaned,
        confidence: 0,
        reason: 'Texto muy corto para ser un ingrediente'
      };
    }

    // Verificar si es solo números
    if (/^\d+$/.test(cleaned)) {
      return {
        isIngredient: false,
        name: cleaned,
        confidence: 0,
        reason: 'Es un número, no un ingrediente'
      };
    }

    // Si no es una palabra descriptiva y tiene longitud razonable, probablemente es un ingrediente
    return {
      isIngredient: true,
      name: this.capitalizeFirst(cleaned),
      confidence: 0.5,
      reason: 'Texto válido que podría ser un ingrediente (revisar manualmente)'
    };
  }

  /**
   * Capitaliza la primera letra de cada palabra
   */
  private capitalizeFirst(text: string): string {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Elimina duplicados de sugerencias (case-insensitive)
   */
  private removeDuplicates(suggestions: IngredientSuggestion[]): IngredientSuggestion[] {
    const seen = new Set<string>();
    const unique: IngredientSuggestion[] = [];

    for (const suggestion of suggestions) {
      const key = suggestion.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(suggestion);
      }
    }

    return unique;
  }

  /**
   * Valida si un ingrediente sugerido es válido
   */
  isValidIngredient(ingredient: string): boolean {
    if (!ingredient || ingredient.trim().length < 2) {
      return false;
    }

    const normalized = ingredient.toLowerCase().trim();
    
    // No debe ser solo una palabra descriptiva
    if (this.descriptiveWords.has(normalized)) {
      return false;
    }

    // No debe ser solo números
    if (/^\d+$/.test(normalized)) {
      return false;
    }

    return true;
  }
}

export const ingredientAnalyzer = new IngredientAnalyzer();

