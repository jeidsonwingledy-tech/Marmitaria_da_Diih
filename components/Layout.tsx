import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingCart, MapPin, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';

import SupabaseConfigBanner from './SupabaseConfigBanner';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useStore();

  const isActive = (path: string) => location.pathname === path ? "text-primary font-bold" : "text-gray-500";

  // Don't show bottom nav on admin page
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative">
        <SupabaseConfigBanner />
        <div className="pb-20">
          {children}
        </div>

        {/* Mobile Bottom Navigation - Sticky - Hidden on Admin Page */}
        {!isAdminPage && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
            <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
              <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/')}`}>
                <Home size={22} />
                <span className="text-[10px] mt-1">Início</span>
              </Link>

              <Link to="/cardapio" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/cardapio')}`}>
                <UtensilsCrossed size={22} />
                <span className="text-[10px] mt-1">Cardápio</span>
              </Link>

              <Link to="/carrinho" className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/carrinho')}`}>
                <div className="relative">
                  <ShoppingCart size={22} />
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

              <Link to="/localizacao" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/localizacao')}`}>
                <MapPin size={22} />
                <span className="text-[10px] mt-1">Local</span>
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Layout;