import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getApiUrl } from '@/lib/query-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  language?: string;
}

export interface Project {
  id: string;
  name: string;
  shortName: string | null;
  webhookKey: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getCurrentProject: () => Project | null;
  hasProjects: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    projects: [],
    currentProjectId: null,
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
          projects: data.projects || [],
          currentProjectId: data.currentProjectId,
          isLoading: false,
          isAuthenticated: true,
        });
        await AsyncStorage.setItem('isAuthenticated', 'true');
      } else {
        setState({
          user: null,
          projects: [],
          currentProjectId: null,
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(new URL('/api/auth/login', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setState({
          user: data.user,
          projects: data.projects || [],
          currentProjectId: data.currentProjectId,
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

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const response = await fetch(new URL('/api/auth/register', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setState({
          user: data.user,
          projects: data.projects || [],
          currentProjectId: data.currentProjectId,
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
      projects: [],
      currentProjectId: null,
      isLoading: false,
      isAuthenticated: false,
    });
    await AsyncStorage.removeItem('isAuthenticated');
  }, []);

  const switchProject = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(new URL('/api/auth/switch-project', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        setState(prev => ({ ...prev, currentProjectId: projectId }));
      }
    } catch (error) {
      console.error('Switch project error:', error);
    }
  }, []);

  const getCurrentProject = useCallback(() => {
    return state.projects.find(p => p.id === state.currentProjectId) || null;
  }, [state.projects, state.currentProjectId]);

  const hasProjects = state.projects.length > 0;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        switchProject,
        refresh,
        getCurrentProject,
        hasProjects,
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
