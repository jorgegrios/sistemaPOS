/**
 * API Client - Base HTTP client with JWT token management
 * Handles authentication, request/response intercepting, and error handling
 */

import { getApiBaseUrl } from '../utils/api-config';

// Usar la función de configuración que detecta automáticamente la IP
// getApiBaseUrl already returns the full URL with /api/v1
const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'pos_token';
const REFRESH_TOKEN_KEY = 'pos_refresh_token';
const RESTAURANT_ID_KEY = 'pos_restaurant_id';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string = API_BASE_URL;

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Set JWT token
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Get stored Restaurant ID
   */
  getRestaurantId(): string | null {
    return localStorage.getItem(RESTAURANT_ID_KEY);
  }

  /**
   * Set Restaurant ID
   */
  setRestaurantId(id: string): void {
    localStorage.setItem(RESTAURANT_ID_KEY, id);
  }

  /**
   * Clear token and restaurant ID
   */
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(RESTAURANT_ID_KEY);
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const restaurantId = this.getRestaurantId();
    if (restaurantId) {
      headers['X-Restaurant-ID'] = restaurantId;
    }

    return headers;
  }

  /**
   * Generic request method
   */
  async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const {
      headers = {},
      method = 'GET',
      body,
      skipAuth = false
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const finalHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...(skipAuth ? {} : this.getAuthHeader())
    };

    try {
      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        // Handle 401 - unauthorized
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}`
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`[API Error] ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }
}

export const apiClient = new ApiClient();
