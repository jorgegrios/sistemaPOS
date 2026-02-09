/**
 * Authentication Service
 * Handles user login, registration, token verification, and logout
 */

import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen' | 'bartender';
  restaurantId: string;
  companyId: string;
  sessionTimeoutMinutes?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  companySlug?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  sessionTimeoutMinutes?: number;
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
      '/v1/auth/login',
      credentials,
      { skipAuth: true }
    );

    if (response.token) {
      apiClient.setToken(response.token);
      if (response.user?.restaurantId) {
        apiClient.setRestaurantId(response.user.restaurantId);
      }
      // Store session timeout setting
      if (response.sessionTimeoutMinutes) {
        localStorage.setItem('sessionTimeoutMinutes', response.sessionTimeoutMinutes.toString());
      }
    }

    return response;
  }

  /**
   * Register new user (admin-only)
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/v1/auth/register',
      data
    );

    if (response.token) {
      apiClient.setToken(response.token);
      if (response.user?.restaurantId) {
        apiClient.setRestaurantId(response.user.restaurantId);
      }
    }

    return response;
  }

  /**
   * Verify if token is valid
   */
  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await apiClient.post<{ valid: boolean; user?: User }>(
        '/v1/auth/verify',
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
      await apiClient.post('/v1/auth/logout', {});
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
   * Change user password
   */
  async changePassword(userId: string, currentPassword?: string, newPassword?: string): Promise<{ ok: boolean; message: string }> {
    return await apiClient.put<{ ok: boolean; message: string }>(
      `/v1/auth/users/${userId}/password`,
      { currentPassword, newPassword }
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get session timeout from localStorage
   */
  getSessionTimeout(): number {
    const stored = localStorage.getItem('sessionTimeoutMinutes');
    return stored ? parseInt(stored, 10) : 20; // Default 20 minutes
  }
}

export const authService = new AuthService();
