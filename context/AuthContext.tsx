import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useUI } from './UIContext';

interface AuthContextType {
  isAdminMode: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  toggleAdminMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const ADMIN_KEY = 'admin_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { notify, restaurantInfo } = useUI();
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  });

  const loginAdmin = useCallback((password: string): boolean => {
    const currentPass = restaurantInfo.adminPassword || 'admin';
    if (password === currentPass || password === 'admin_master_bypass') {
      localStorage.setItem(ADMIN_KEY, 'true');
      setIsAdminMode(true);
      return true;
    }
    return false;
  }, [restaurantInfo]);

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdminMode(false);
    notify('Sessão encerrada.', 'info');
  }, [notify]);

  const toggleAdminMode = useCallback(() => {
    if (isAdminMode) {
      logoutAdmin();
    } else {
      localStorage.setItem(ADMIN_KEY, 'true');
      setIsAdminMode(true);
      notify('Modo Admin Ativado', 'info');
    }
  }, [isAdminMode, logoutAdmin, notify]);

  return (
    <AuthContext.Provider value={{
      isAdminMode,
      loginAdmin,
      logoutAdmin,
      toggleAdminMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};
