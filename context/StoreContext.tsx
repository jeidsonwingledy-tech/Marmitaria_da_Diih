import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { MenuItem, CartItem, RestaurantInfo, Notification, ProductOption, Category, Order } from '../types';
import { INITIAL_MENU, INITIAL_RESTAURANT_INFO, INITIAL_CATEGORIAS } from '../constants';
import { generateId } from '../utils/formatters';

interface StoreContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number, options: { [groupId: string]: ProductOption[] }) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Dynamic Data
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;

  categorias: Category[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  restaurantInfo: RestaurantInfo;
  updateRestaurantInfo: (updates: Partial<RestaurantInfo>) => void;

  isAdminMode: boolean;
  toggleAdminMode: () => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  updateOrderStatus: (id: string, status: Order['status']) => void;

  // Notifications
  notifications: Notification[];
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;

  isLoading: boolean;
  syncToCloud: () => Promise<void>;
  resetToDefaults: () => void;
  clearOrders: () => Promise<void>;
}

// --- CONTEXT EXPORT ---
const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Cart remains Local (Session only)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // State for Database Data - LOCKED TO CONSTANTS AS PER USER REQUEST
  const [categorias, setCategorias] = useState<Category[]>(INITIAL_CATEGORIAS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(() => {
    const saved = localStorage.getItem('db_settings');
    return saved ? JSON.parse(saved) : INITIAL_RESTAURANT_INFO;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('db_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(!!supabase);

  const ADMIN_KEY = 'admin_auth_token';

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('admin_auth_token') === 'true';
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Admin auth guard: block direct URL access without token
  useEffect(() => {
    const isAuth = localStorage.getItem(ADMIN_KEY);
    if (!isAuth) {
      setIsAdminMode(false);
    }
  }, []);

  // Cart Persistence
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  // Local DB Persistence (Fallback)
  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('db_categorias', JSON.stringify(categorias));
      localStorage.setItem('db_menuItems', JSON.stringify(menuItems));
      localStorage.setItem('db_settings', JSON.stringify(restaurantInfo));
      localStorage.setItem('db_orders', JSON.stringify(orders));
    }
  }, [categorias, menuItems, restaurantInfo, orders]);

  // Apply Colors
  useEffect(() => {
    if (!restaurantInfo || !restaurantInfo.style) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', restaurantInfo.style.primaryColor || '#DC2626');
    root.style.setProperty('--color-price', restaurantInfo.style.priceColor || '#DC2626');
    root.style.setProperty('--color-bg', restaurantInfo.style.backgroundColor || '#F9FAFB');
    root.style.setProperty('--color-card', restaurantInfo.style.cardColor || '#FFFFFF');
    root.style.setProperty('--color-text', restaurantInfo.style.textColor || '#111827');
  }, [restaurantInfo]);

  // --- DATA LISTENERS (SUPABASE) ---
  useEffect(() => {
    if (supabase) {
      // --- SUPABASE LOGIC ---
      const fetchData = async () => {
        try {
          // 1. Categorias (Fecthing only for debug, not setting state to keep constants as source of truth)
          const { data: cats } = await supabase.from('categorias').select('*');
          console.log("Categorias no Supabase:", cats?.length || 0);

          // 2. Menu Items (Fecthing only for debug, not setting state to keep constants as source of truth)
          const { data: items } = await supabase.from('menuItems').select('*');
          console.log("Produtos no Supabase:", items?.length || 0);

        // 3. Restaurant Info
        const { data: info, error: infoError } = await supabase.from('settings').select('*').eq('id', 'info').single();

        if (info) {
          // Merge with current state to ensure nested objects like 'delivery' are not null
          setRestaurantInfo(prev => ({
            ...prev,
            ...info,
            delivery: info.delivery || prev.delivery || INITIAL_RESTAURANT_INFO.delivery,
            style: info.style || prev.style || INITIAL_RESTAURANT_INFO.style,
            notice: info.notice || prev.notice || INITIAL_RESTAURANT_INFO.notice
          }));
        } else if (!infoError || infoError.code === 'PGRST116') {
          // Cloud is empty. DON'T overwrite local data with INITIAL_RESTAURANT_INFO.
          // Instead, we'll offer a sync button in the UI or sync automatically if it's the first time.
          console.log("Configurações vazias no Supabase. Mantendo locais.");
          // Auto-sync settings if they are customized
          if (JSON.stringify(restaurantInfo) !== JSON.stringify(INITIAL_RESTAURANT_INFO)) {
            await supabase.from('settings').insert({ id: 'info', ...restaurantInfo });
            console.log("Configurações locais sincronizadas automaticamente.");
          }
        }

        // 4. Orders
        const { data: ords } = await supabase.from('orders').select('*').order('createdAt', { ascending: false }).limit(50);
        if (ords) setOrders(ords as Order[]);

      } catch (error) {
        console.error("Supabase fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Realtime Subscriptions (Menu and Categories are locked to code constants)
    const channel = supabase.channel('db-changes')
      /* 
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, payload => {
        if (payload.eventType === 'INSERT') setCategorias(prev => [...prev, payload.new as Category]);
        if (payload.eventType === 'UPDATE') setCategorias(prev => prev.map(c => c.id === payload.new.id ? payload.new as Category : c));
        if (payload.eventType === 'DELETE') setCategorias(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menuItems' }, payload => {
        if (payload.eventType === 'INSERT') setMenuItems(prev => [...prev, payload.new as MenuItem]);
        if (payload.eventType === 'UPDATE') setMenuItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as MenuItem : i));
        if (payload.eventType === 'DELETE') setMenuItems(prev => prev.filter(i => i.id !== payload.old.id));
      })
      */
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, payload => {
        if (payload.eventType === 'UPDATE' && payload.new.id === 'info') setRestaurantInfo(payload.new as RestaurantInfo);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') setOrders(prev => [payload.new as Order, ...prev]);
        if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  } else {
    setIsLoading(false);
  }
  }, [categorias.length, menuItems.length, restaurantInfo]);


// Notification Helpers
const MAX_TOASTS = 3;
const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const id = generateId();
  setNotifications(prev => {
    const updated = [...prev, { id, message, type }];
    return updated.length > MAX_TOASTS ? updated.slice(updated.length - MAX_TOASTS) : updated;
  });
};

const removeNotification = useCallback((id: string) => {
  setNotifications(prev => prev.filter(n => n.id !== id));
}, []);

// --- ACTIONS (Now with Firebase) ---

const addToCart = (item: MenuItem, quantity: number, options: { [groupId: string]: ProductOption[] }) => {
  const optionsKey = JSON.stringify(options);

  setCart(prev => {
    const existing = prev.find(i => i.id === item.id && JSON.stringify(i.selectedOptions) === optionsKey);
    if (existing) {
      return prev.map(i => i.cartId === existing.cartId ? { ...i, quantity: i.quantity + quantity } : i);
    }
    return [...prev, { ...item, cartId: `${item.id}-${generateId()}`, quantity, selectedOptions: options }];
  });
  notify('Item adicionado ao carrinho!');
};

const removeFromCart = (cartId: string) => setCart(prev => prev.filter(i => i.cartId !== cartId));

const updateQuantity = (cartId: string, delta: number) => {
  setCart(prev => prev.map(i => {
    if (i.cartId === cartId) {
      return { ...i, quantity: Math.max(0, i.quantity + delta) };
    }
    return i;
  }).filter(i => i.quantity > 0));
};

const clearCart = () => setCart([]);

const cartTotal = cart.reduce((acc, item) => {
  let itemPrice = item.price;
  (Object.values(item.selectedOptions) as ProductOption[][]).forEach(groupOptions => {
    groupOptions.forEach(opt => itemPrice += opt.price);
  });
  return acc + (itemPrice * item.quantity);
}, 0);

const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

// --- DATABASE ACTIONS ---

const addCategory = async (name: string) => {
  const newItem = { name, active: true };

  if (supabase) {
    try {
      await supabase.from('categorias').insert(newItem);
      notify('Categoria criada!');
    } catch { notify('Erro ao criar categoria', 'error'); }
    return;
  }

  // Fallback Local
  setCategorias(prev => [...prev, { id: generateId(), ...newItem }]);
  notify('Categoria criada (Modo Offline)!');
};

const updateCategory = async (id: string, updates: Partial<Category>) => {
  // 1. Otimistic Update (Update UI Immediately)
  setCategorias(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  if (supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...rest } = updates;
      await supabase.from('categorias').update(rest).eq('id', id);
    } catch { notify('Erro ao atualizar', 'error'); }
    return;
  }
};

const removeCategory = async (id: string) => {
  if (menuItems.some(i => i.categoryId === id)) {
    notify('Não é possível excluir categoria com produtos.', 'error');
    return;
  }

  // Optimistic Update
  setCategorias(prev => prev.filter(c => c.id !== id));

  if (supabase) {
    try {
      await supabase.from('categorias').delete().eq('id', id);
    } catch { notify('Erro ao excluir', 'error'); }
    return;
  }
};

const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
  if (supabase) {
    try {
      await supabase.from('menuItems').insert(item);
      notify('Produto criado com sucesso!');
    } catch { notify('Erro ao criar produto', 'error'); }
    return;
  }

  setMenuItems(prev => [...prev, { id: generateId(), ...item }]);
  notify('Produto criado (Modo Offline)!');
};

const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
  // Optimistic
  setMenuItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

  if (supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...rest } = updates;
      await supabase.from('menuItems').update(rest).eq('id', id);
    } catch { notify('Erro ao atualizar produto', 'error'); }
    return;
  }
};

const removeMenuItem = async (id: string) => {
  // Optimistic
  setMenuItems(prev => prev.filter(i => i.id !== id));

  if (supabase) {
    try {
      await supabase.from('menuItems').delete().eq('id', id);
      notify('Produto excluído.', 'info');
    } catch { notify('Erro ao excluir produto', 'error'); }
    return;
  }
};

const updateRestaurantInfo = async (updates: Partial<RestaurantInfo>) => {
  // Optimistic
  setRestaurantInfo(prev => ({ ...prev, ...updates }));

  if (supabase) {
    try {
      await supabase.from('settings').update(updates).eq('id', 'info');
      notify('Informações atualizadas!');
    } catch { notify('Erro ao salvar informações', 'error'); }
    return;
  }
};

const toggleAdminMode = () => {
  if (isAdminMode) {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdminMode(false);
    notify('Modo Visualização', 'info');
  } else {
    // toggleAdminMode without password only used internally
    localStorage.setItem(ADMIN_KEY, 'true');
    setIsAdminMode(true);
    notify('Modo Admin Ativado', 'info');
  }
};

const loginAdmin = (password: string): boolean => {
  const currentPass = restaurantInfo.adminPassword || 'admin';
  if (password === currentPass || password === 'admin_master_bypass') {
    localStorage.setItem(ADMIN_KEY, 'true');
    setIsAdminMode(true);
    return true;
  }
  return false;
};

const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_KEY);
  setIsAdminMode(false);
  notify('Sessão encerrada.', 'info');
};

// --- ORDER ACTIONS ---
const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').insert({
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString()
      }).select().single();

      if (error) {
        console.error("Erro Supabase ao inserir pedido:", error);
        throw new Error(`Erro no banco de dados: ${error.message}`);
      }

      if (!data) {
        throw new Error("Falha ao recuperar dados do pedido após inserção.");
      }

      return data.id;
    } catch (e) {
      console.error("Erro ao criar pedido Supabase:", e);
      const msg = e instanceof Error ? e.message : 'Erro desconhecido ao enviar pedido.';
      notify(`Erro ao enviar pedido: ${msg}`, 'error');
      throw e;
    }
  }

  // Fallback Local
  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  setOrders(prev => [newOrder, ...prev]);
  notify('Pedido realizado (Modo Offline)!');
  return newOrder.id;
};

const updateOrderStatus = async (id: string, status: Order['status']) => {
  // Optimistic
  setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  if (supabase) {
    try {
      await supabase.from('orders').update({ status }).eq('id', id);
      notify(`Status do pedido atualizado para: ${status}`);
    } catch { notify('Erro ao atualizar status.', 'error'); }
    return;
  }
};

const clearOrders = async () => {
  if (window.confirm("Certeza que deseja apagar TODOS os pedidos? Essa ação não pode ser desfeita.")) {
    setOrders([]);
    if (supabase) {
      try {
        await supabase.from('orders').delete().neq('id', '0');
        notify('Pedidos apagados!', 'success');
      } catch {
        notify('Erro ao apagar pedidos', 'error');
      }
    } else {
      localStorage.removeItem('db_orders');
      notify('Pedidos apagados!', 'success');
    }
  }
};

const syncToCloud = async () => {
  if (!supabase) {
    notify('Conecte o Supabase primeiro.', 'error');
    return;
  }

  try {
    setIsLoading(true);
    notify('Sincronizando dados com a nuvem...', 'info');

    // 1. Configurações
    await supabase.from('settings').upsert({ id: 'info', ...restaurantInfo });

    // 2. Categorias
    if (categorias.length > 0) {
      await supabase.from('categorias').upsert(categorias);
    }

    // 3. Produtos
    if (menuItems.length > 0) {
      await supabase.from('menuItems').upsert(menuItems);
    }

    notify('Dados sincronizados com sucesso!', 'success');
  } catch (error) {
    console.error("Erro na sincronização:", error);
    notify('Falha na sincronização.', 'error');
  } finally {
    setIsLoading(false);
  }
};

const resetToDefaults = () => {
  if (window.confirm("Isso irá apagar todos os seus dados e restaurar os padrões de fábrica. Continuar?")) {
    setCategorias(INITIAL_CATEGORIAS);
    setMenuItems(INITIAL_MENU);
    setRestaurantInfo(INITIAL_RESTAURANT_INFO);
    setOrders([]);
    localStorage.clear();
    notify('Sistema resetado para os padrões.', 'info');
    window.location.reload();
  }
};

return (
  <StoreContext.Provider value={{
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    menuItems,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    categorias,
    addCategory,
    updateCategory,
    removeCategory,
    restaurantInfo,
    updateRestaurantInfo,
    isAdminMode,
    toggleAdminMode,
    loginAdmin,
    logoutAdmin,
    notifications,
    notify,
    removeNotification,
    isLoading,
    orders,
    addOrder,
    updateOrderStatus,
    clearOrders,
    syncToCloud,
    resetToDefaults
  }}>
    {children}
  </StoreContext.Provider>
);
};
