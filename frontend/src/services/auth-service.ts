/**
 * Authentication Service
 * Handles user login, registration, token verification, and logout
 */

import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'cashier';
  restaurantId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'cashier';
  restaurantId: string;
}

class AuthService {
  /**
   * User login with email/password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
      { skipAuth: true }
    );

    if (response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }

  /**
   * Register new user (admin-only)
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/register',
      data
    );

    if (response.token) {
      apiClient.setToken(response.token);
    }

    return response;
  }

  /**
   * Verify if token is valid
   */
  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await apiClient.post<{ valid: boolean; user?: User }>(
        '/auth/verify',
        {}
      );
      return response;
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      apiClient.clearToken();
    }
  }

  /**
   * Get current stored token
   */
  getToken(): string | null {
    return apiClient.getToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
