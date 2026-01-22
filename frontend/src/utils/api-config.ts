/**
 * Obtiene la URL base de la API
 * 
 * Estrategia:
 * 1. Si VITE_API_URL está definido, usarlo (producción o configuración manual)
 * 2. En desarrollo:
 *    - Si estamos en el mismo dispositivo (localhost), usar proxy relativo
 *    - Si estamos en otro dispositivo (IP diferente), construir URL con IP del servidor
 */
export function getApiBaseUrl(): string {
  // 1. Prioridad: Variable de entorno explícita
  if (import.meta.env.VITE_API_URL) {
    let url = import.meta.env.VITE_API_URL;
    // Asegurar que termine en /api
    if (!url.endsWith('/api')) {
      url = url.endsWith('/') ? `${url}api` : `${url}/api`;
    }
    console.log('[API Config] Usando VITE_API_URL:', url);
    return url;
  }

  // 2. En producción, usar localhost por defecto
  if (import.meta.env.PROD) {
    const url = 'http://localhost:3000/api';
    console.log('[API Config] Producción, usando:', url);
    return url;
  }

  // 3. En desarrollo, detectar si estamos en el mismo dispositivo o en otro
  const currentHost = window.location.hostname;
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

  if (isLocalhost) {
    // Mismo dispositivo: usar proxy relativo
    const url = '/api';
    console.log('[API Config] Localhost detectado, usando proxy:', url);
    return url;
  } else {
    // Otro dispositivo: construir URL con el hostname actual y puerto del backend
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '3000';
    const url = `http://${currentHost}:${backendPort}/api`;
    console.log('[API Config] Otro dispositivo detectado:', url);
    return url;
  }
}



