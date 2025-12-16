import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  organizations: Organization[];
  currentOrganizationId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, displayName?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getCurrentOrganization: () => Organization | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organizations: [],
    currentOrganizationId: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(new URL('/api/auth/me', getApiUrl()).toString(), {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          organizations: data.organizations || [],
          currentOrganizationId: data.currentOrganizationId,
          isLoading: false,
          isAuthenticated: true,
        });
        await AsyncStorage.setItem('isAuthenticated', 'true');
      } else {
        setState({
          user: null,
          organizations: [],
          currentOrganizationId: null,
          isLoading: false,
          isAuthenticated: false,
        });
        await AsyncStorage.removeItem('isAuthenticated');
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(new URL('/api/auth/login', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setState({
          user: data.user,
          organizations: data.organizations || [],
          currentOrganizationId: data.currentOrganizationId,
          isLoading: false,
          isAuthenticated: true,
        });
        await AsyncStorage.setItem('isAuthenticated', 'true');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string, email?: string) => {
    try {
      const response = await fetch(new URL('/api/auth/register', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, displayName, email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setState({
          user: data.user,
          organizations: [data.organization],
          currentOrganizationId: data.organization.id,
          isLoading: false,
          isAuthenticated: true,
        });
        await AsyncStorage.setItem('isAuthenticated', 'true');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(new URL('/api/auth/logout', getApiUrl()).toString(), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setState({
      user: null,
      organizations: [],
      currentOrganizationId: null,
      isLoading: false,
      isAuthenticated: false,
    });
    await AsyncStorage.removeItem('isAuthenticated');
  }, []);

  const switchOrganization = useCallback(async (orgId: string) => {
    try {
      const response = await fetch(new URL('/api/organizations/switch', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (response.ok) {
        setState(prev => ({ ...prev, currentOrganizationId: orgId }));
      }
    } catch (error) {
      console.error('Switch organization error:', error);
    }
  }, []);

  const getCurrentOrganization = useCallback(() => {
    return state.organizations.find(o => o.id === state.currentOrganizationId) || null;
  }, [state.organizations, state.currentOrganizationId]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        switchOrganization,
        refresh,
        getCurrentOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
