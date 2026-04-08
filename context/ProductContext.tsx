import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MenuItem, Category } from '../types';
import { INITIAL_MENU, INITIAL_CATEGORIAS } from '../constants';
import { supabase } from '../services/supabase';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { generateId } from '../utils/formatters';

interface ProductContextType {
  menuItems: MenuItem[];
  categorias: Category[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { notify } = useUI();
  const { isAdminMode } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('db_menuItems');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [categorias, setCategorias] = useState<Category[]>(() => {
    const saved = localStorage.getItem('db_categorias');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIAS;
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingProducts(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        supabase.from('categorias').select('*'),
        supabase.from('menuItems').select('*')
      ]);

      if (catsRes.data) {
        setCategorias(catsRes.data as Category[]);
        localStorage.setItem('db_categorias', JSON.stringify(catsRes.data));
      }
      if (itemsRes.data) {
        setMenuItems(itemsRes.data as MenuItem[]);
        localStorage.setItem('db_menuItems', JSON.stringify(itemsRes.data));
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (!supabase || !isAdminMode) return;

    const channel = supabase.channel('products-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, payload => {
        setCategorias(prev => {
          let next;
          if (payload.eventType === 'INSERT') next = [...prev, payload.new as Category];
          else if (payload.eventType === 'UPDATE') next = prev.map(c => c.id === payload.new.id ? payload.new as Category : c);
          else if (payload.eventType === 'DELETE') next = prev.filter(c => c.id !== payload.old.id);
          else next = prev;
          localStorage.setItem('db_categorias', JSON.stringify(next));
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menuItems' }, payload => {
        setMenuItems(prev => {
          let next;
          if (payload.eventType === 'INSERT') next = [...prev, payload.new as MenuItem];
          else if (payload.eventType === 'UPDATE') next = prev.map(i => i.id === payload.new.id ? payload.new as MenuItem : i);
          else if (payload.eventType === 'DELETE') next = prev.filter(i => i.id !== payload.old.id);
          else next = prev;
          localStorage.setItem('db_menuItems', JSON.stringify(next));
          return next;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminMode, fetchData]);

  const addCategory = useCallback(async (name: string) => {
    const newItem = { name, active: true };
    if (supabase) {
      const { error } = await supabase.from('categorias').insert(newItem);
      if (error) notify('Erro: ' + error.message, 'error');
      else notify('Categoria criada!');
    } else {
      setCategorias(prev => [...prev, { id: generateId(), ...newItem }]);
    }
  }, [notify]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    setCategorias(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (supabase) {
      const { id: _, ...rest } = updates as any;
      await supabase.from('categorias').update(rest).eq('id', id);
    }
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    if (menuItems.some(i => i.categoryId === id)) {
      notify('Não é possível excluir categoria com produtos.', 'error');
      return;
    }
    setCategorias(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      await supabase.from('categorias').delete().eq('id', id);
    }
  }, [menuItems, notify]);

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    if (supabase) {
      const { error } = await supabase.from('menuItems').insert(item);
      if (error) notify('Erro: ' + error.message, 'error');
      else notify('Produto criado!');
    } else {
      setMenuItems(prev => [...prev, { id: generateId(), ...item }]);
    }
  }, [notify]);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (supabase) {
      const { id: _, ...rest } = updates as any;
      await supabase.from('menuItems').update(rest).eq('id', id);
    }
  }, []);

  const removeMenuItem = useCallback(async (id: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== id));
    if (supabase) {
      await supabase.from('menuItems').delete().eq('id', id);
    }
  }, []);

  return (
    <ProductContext.Provider value={{
      menuItems,
      categorias,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      addCategory,
      updateCategory,
      removeCategory,
      isLoadingProducts,
      refreshProducts: fetchData
    }}>
      {children}
    </ProductContext.Provider>
  );
};
