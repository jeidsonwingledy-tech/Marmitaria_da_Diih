import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
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
  const { notifications, removeNotification } = useStore();

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
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;