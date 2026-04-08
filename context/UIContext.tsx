import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RestaurantInfo, Notification } from '../types';
import { INITIAL_RESTAURANT_INFO } from '../constants';
import { generateId } from '../utils/formatters';
import { supabase } from '../services/supabase';

interface UIContextType {
  restaurantInfo: RestaurantInfo;
  updateRestaurantInfo: (updates: Partial<RestaurantInfo>) => Promise<void>;
  notifications: Array<Notification & { type: 'success' | 'error' | 'info' }>;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(() => {
    const saved = localStorage.getItem('db_settings');
    return saved ? JSON.parse(saved) : INITIAL_RESTAURANT_INFO;
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Initial Data
  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'info').single();
        if (data && !error) {
          setRestaurantInfo(data as RestaurantInfo);
          localStorage.setItem('db_settings', JSON.stringify(data));
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      }
    };
    fetchSettings();

    if (!supabase) return;
    const channel = supabase.channel('settings-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.info' }, payload => {
        setRestaurantInfo(payload.new as RestaurantInfo);
        localStorage.setItem('db_settings', JSON.stringify(payload.new));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply Colors
  useEffect(() => {
    if (!restaurantInfo?.style) return;
    const root = document.documentElement;
    const style = restaurantInfo.style;
    root.style.setProperty('--color-primary', style.primaryColor || '#DC2626');
    root.style.setProperty('--color-price', style.priceColor || '#DC2626');
    root.style.setProperty('--color-bg', style.backgroundColor || '#F9FAFB');
    root.style.setProperty('--color-card', style.cardColor || '#FFFFFF');
    root.style.setProperty('--color-text', style.textColor || '#111827');
  }, [restaurantInfo]);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId();
    setNotifications(prev => {
      const updated = [...prev, { id, message, type }];
      return updated.length > 3 ? updated.slice(updated.length - 3) : updated;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateRestaurantInfo = useCallback(async (updates: Partial<RestaurantInfo>) => {
    setRestaurantInfo(prev => ({ ...prev, ...updates }));
    
    if (supabase) {
      try {
        const { error } = await supabase.from('settings').update(updates).eq('id', 'info');
        if (error) {
          notify('Erro ao salvar info: ' + error.message, 'error');
        } else {
          notify('Informações atualizadas!');
        }
      } catch (err) {
        notify('Erro ao salvar informações', 'error');
      }
    } else {
      localStorage.setItem('db_settings', JSON.stringify({ ...restaurantInfo, ...updates }));
    }
  }, [restaurantInfo, notify]);

  return (
    <UIContext.Provider value={{
      restaurantInfo,
      updateRestaurantInfo,
      notifications,
      notify,
      removeNotification,
      isLoading,
      setIsLoading
    }}>
      {children}
    </UIContext.Provider>
  );
};
