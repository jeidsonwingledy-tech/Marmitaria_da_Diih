import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UIProvider, useUI } from './context/UIContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Location from './pages/Location';
import QRCodePage from './pages/QRCodePage';
import Admin from './pages/Admin';
import { ToastContainer } from './components/ui/Toast.tsx';

// Wrapper component to access context hooks
const AppContent = () => {
  const { notifications, removeNotification } = useUI();

  return (
    <>
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cardapio" element={<Menu />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/localizacao" element={<Location />} />
            <Route path="/pedidos" element={<QRCodePage />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </>
  );
};

const App = () => {
  return (
    <UIProvider>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <AppContent />
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export default App;