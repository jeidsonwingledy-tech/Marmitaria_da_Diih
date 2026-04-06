import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, QrCode, Instagram, Facebook } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ImageEditable } from '../components/ui/ImageEditable';

const Home = () => {
  const { restaurantInfo, updateRestaurantInfo, isAdminMode } = useStore();

  return (
    <div className="flex flex-col min-h-screen pb-16" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Hero Banner */}
      <div className="h-64 w-full relative">
        <ImageEditable 
          src={restaurantInfo.banner} 
          alt="Banner do Restaurante" 
          onUpdate={(img) => updateRestaurantInfo({ banner: img })}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-white shrink-0">
               <ImageEditable 
                src={restaurantInfo.logo} 
                alt="Logo" 
                onUpdate={(img) => updateRestaurantInfo({ logo: img })}
                className="w-full h-full"
                overlayText="Logo"
              />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">{restaurantInfo.name}</h1>
              <p className="text-gray-300 text-sm">A melhor comida caseira da região</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="p-6 space-y-4">
        {isAdminMode && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
             <p className="text-sm text-yellow-700 font-bold">Modo Edição Ativo</p>
             <p className="text-xs text-yellow-600">Clique nas imagens para alterá-las.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Link to="/cardapio" className="text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 transition-transform active:scale-95" style={{ backgroundColor: 'var(--color-primary)' }}>
            <span className="font-bold text-lg">Fazer Pedido</span>
            <span className="text-xs opacity-80">Ver Marmitas</span>
          </Link>
          
          <Link to="/qrcode" className="bg-[#111827] text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
            <QrCode size={32} />
            <span className="font-bold text-sm">QR Code</span>
          </Link>
        </div>

        {/* Social Media Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <a href={restaurantInfo.instagramUrl || "https://instagram.com"} target="_blank" rel="noreferrer" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
             <Instagram size={20} />
             <span className="font-bold text-sm">Instagram</span>
          </a>
          <a href={restaurantInfo.facebookUrl || "https://facebook.com"} target="_blank" rel="noreferrer" className="bg-[#1877F2] text-white p-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
             <Facebook size={20} />
             <span className="font-bold text-sm">Facebook</span>
          </a>
        </div>

        <div className="rounded-xl shadow-sm border border-gray-100 p-4 space-y-4" style={{ backgroundColor: 'var(--color-card)' }}>
          <Link to="/localizacao" className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg">
            <div className="bg-red-100 p-3 rounded-full" style={{ color: 'var(--color-primary)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Localização</h3>
              <p className="text-sm text-gray-500">{restaurantInfo.address}</p>
            </div>
          </Link>

          <a href={`https://wa.me/${restaurantInfo.whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">WhatsApp</h3>
              <p className="text-sm text-gray-500">{restaurantInfo.phone}</p>
            </div>
          </a>
        </div>
        
        <div className="bg-gray-100 p-6 rounded-xl text-center">
            <h3 className="font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Horário de Funcionamento</h3>
            <p className="text-gray-800 font-medium whitespace-pre-line text-sm">
                {restaurantInfo.businessHours || "Segunda a Sábado: 10:30 às 14:30"}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Home;