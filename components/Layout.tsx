import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingCart, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';

import SupabaseConfigBanner from './SupabaseConfigBanner';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { cartCount, restaurantInfo } = useStore();
  const isActive = (path: string) => location.pathname === path ? "text-primary font-bold" : "text-gray-500";

  // Don't show bottom nav on admin page
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative">
        <SupabaseConfigBanner />
        
        {/* iFood-style Header */}
        {!isAdminPage && (
          <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-primary" />
              <span className="font-semibold text-gray-800 flex-1 truncate">
                {restaurantInfo.address}
              </span>
              <Link to="/pedidos" className="text-primary text-xs font-bold uppercase">Mudar</Link>
            </div>
            
            {/* Search Placeholder Feel */}
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2 text-gray-400">
              <UtensilsCrossed size={18} />
              <span className="text-sm">O que você quer comer hoje?</span>
            </div>
          </header>
        )}

        <div className={isAdminPage ? "p-0" : "pb-24"}>
          {children}
        </div>

        {/* Mobile Bottom Navigation - Sticky - Hidden on Admin Page */}
        {!isAdminPage && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
              <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/')}`}>
                <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
                <span className="text-[10px] mt-1">Início</span>
              </Link>

              <Link to="/cardapio" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/cardapio')}`}>
                <UtensilsCrossed size={22} strokeWidth={location.pathname === '/cardapio' ? 2.5 : 2} />
                <span className="text-[10px] mt-1">Busca</span>
              </Link>

              <Link to="/carrinho" className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/carrinho')}`}>
                <div className="relative">
                  <ShoppingCart size={22} strokeWidth={location.pathname === '/carrinho' ? 2.5 : 2} />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key="cart-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[10px] mt-1">Carrinho</span>
              </Link>

              <Link to="/pedidos" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/pedidos')}`}>
                <MapPin size={22} strokeWidth={location.pathname === '/pedidos' ? 2.5 : 2} />
                <span className="text-[10px] mt-1">Pedidos</span>
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Layout;