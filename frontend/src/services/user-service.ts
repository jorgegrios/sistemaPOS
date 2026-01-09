/**
 * User Service
 * Handles user management
 */

import { apiClient } from './api-client';
import { User } from './auth-service';

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'manager' | 'cashier' | 'waiter';
  phone?: string;
  permissions?: Record<string, boolean>;
}

export interface UpdateUserRequest {
  name?: string;
  role?: string;
  phone?: string;
  active?: boolean;
  permissions?: Record<string, boolean>;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

class UserService {
  async getUsers(filters?: {
    active?: boolean;
    role?: string;
  }): Promise<UserListItem[]> {
    const params = new URLSearchParams();
    if (filters?.active !== undefined) params.append('active', String(filters.active));
    if (filters?.role) params.append('role', filters.role);

    const query = params.toString();
    const response = await apiClient.get<{ users: UserListItem[] }>(
      `/auth/users${query ? `?${query}` : ''}`
    );
    return response.users;
  }

  async getUser(id: string): Promise<UserListItem> {
    const response = await apiClient.get<{ user: UserListItem }>(`/auth/users/${id}`);
    return response.user;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data);
    return response;
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<UserListItem> {
    const response = await apiClient.put<{ user: UserListItem }>(`/auth/users/${id}`, data);
    return response.user;
  }

  async changePassword(id: string, data: ChangePasswordRequest): Promise<void> {
    await apiClient.put(`/auth/users/${id}/password`, data);
  }
}

export const userService = new UserService();


