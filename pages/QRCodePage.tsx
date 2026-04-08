import React from 'react';
import QRCode from 'react-qr-code';
import { useUI } from '../context/UIContext';

const QRCodePage = () => {
  const { restaurantInfo } = useUI();
  // In a real scenario, this would be the deployed URL. For now, it's the current window location.
  const appUrl = window.location.href.split('#')[0];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-secondary">
      <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8">
        <QRCode 
          value={appUrl} 
          size={200} 
          fgColor="#000000" 
          bgColor="#FFFFFF" 
          level="H" 
        />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-2">{restaurantInfo.name}</h1>
      <p className="text-gray-400 mb-8 max-w-xs">Escaneie para acessar nosso cardápio digital e fazer seu pedido.</p>
      
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full max-w-xs border border-white/20">
        <p className="text-gray-300 text-xs uppercase tracking-wider mb-1">Acesse pelo link</p>
        <p className="text-white font-mono text-sm truncate">{appUrl}</p>
      </div>
    </div>
  );
};

export default QRCodePage;
