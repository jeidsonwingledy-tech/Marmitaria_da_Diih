import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { MenuItem, CartItem, ProductOption } from '../types';
import { useUI } from './UIContext';
import { generateId } from '../utils/formatters';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number, options: { [groupId: string]: ProductOption[] }) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { notify } = useUI();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item: MenuItem, quantity: number, options: { [groupId: string]: ProductOption[] }) => {
    const optionsKey = JSON.stringify(options);

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && JSON.stringify(i.selectedOptions) === optionsKey);
      if (existing) {
        return prev.map(i => i.cartId === existing.cartId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, cartId: `${item.id}-${generateId()}`, quantity, selectedOptions: options }];
    });
    notify('Item adicionado ao carrinho!');
  }, [notify]);

  const removeFromCart = useCallback((cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.cartId === cartId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      let itemPrice = item.price;
      (Object.values(item.selectedOptions) as ProductOption[][]).forEach(groupOptions => {
        groupOptions.forEach(opt => itemPrice += opt.price);
      });
      return acc + (itemPrice * item.quantity);
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
