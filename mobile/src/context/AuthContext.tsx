import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../api/types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  activeRole: UserRole;
  token: string | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = '@bhukkad_active_role';
const USER_STORAGE_KEY = '@bhukkad_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await api.init();
        const storedRole = (await AsyncStorage.getItem(ROLE_STORAGE_KEY)) as UserRole | null;
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (storedRole) {
          setActiveRole(storedRole);
        }
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Initialize default guest user
          const defaultUser: User = {
            id: 'guest-1',
            email: 'foodie@bhukkadverse.com',
            first_name: 'Ayush',
            last_name: 'Bhukkad',
            phone_number: '+91 98765 43210',
            role: storedRole || 'CUSTOMER',
            shop_id: 'shop-street-1',
          };
          setUser(defaultUser);
        }
      } catch (err) {
        console.warn('Error bootstrapping auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAuth();
  }, []);

  const login = async (email: string, role: UserRole = 'CUSTOMER') => {
    setIsLoading(true);
    try {
      const mockToken = 'mock-jwt-token-' + Date.now();
      await api.setToken(mockToken);
      setTokenState(mockToken);

      const newUser: User = {
        id: 'usr-' + Date.now(),
        email,
        first_name: email.split('@')[0],
        last_name: 'User',
        role,
        shop_id: role === 'VENDOR' ? 'shop-heritage-1' : undefined,
      };
      setUser(newUser);
      setActiveRole(role);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.setToken(null);
    setTokenState(null);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const switchRole = async (newRole: UserRole) => {
    setActiveRole(newRole);
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        token,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
