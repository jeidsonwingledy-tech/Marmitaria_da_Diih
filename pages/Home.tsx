import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Clock, ChevronRight, Search } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { ImageEditable } from '../components/ui/ImageEditable';
import { ProductCard } from '../components/ProductCard';
import { Category, MenuItem } from '../types';

const Home = () => {
  const { restaurantInfo, updateRestaurantInfo } = useUI();
  const { isAdminMode } = useAuth();
  const { menuItems, categorias } = useProducts();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Filter items based on selected category or show all highlights
  const displayedCategories = categorias.filter(c => c.active);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Restaurant Header Section */}
      <div className="relative h-48 w-full">
        <ImageEditable 
          src={restaurantInfo.banner} 
          alt="Banner" 
          onUpdate={(img) => updateRestaurantInfo({ banner: img })}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Restaurant Info Card */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col gap-3 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-white shadow-md -mt-10">
               <ImageEditable 
                src={restaurantInfo.logo} 
                alt="Logo" 
                onUpdate={(img) => updateRestaurantInfo({ logo: img })}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">{restaurantInfo.name}</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-yellow-600">4.8</span>
                <span className="mx-1">•</span>
                <span>Marmitaria</span>
                <span className="mx-1">•</span>
                <span>1.2km</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{restaurantInfo.businessHours || "10:30 - 14:30"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-600 font-bold uppercase">Aberto</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* iFood-style Search Bar Padding */}
      <div className="px-4 mt-6">
        <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3 text-gray-400">
          <Search size={20} />
          <span className="text-sm">O que você quer comer?</span>
        </div>
      </div>

      {/* iFood-style Circular Categories */}
      <div className="mt-8">
        <h2 className="px-4 text-sm font-bold text-gray-800 uppercase tracking-tight mb-4">Categorias</h2>
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-6 pb-4">
          {displayedCategories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
              className="flex flex-col items-center gap-2 min-w-[70px] transition-transform active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${selectedCategoryId === cat.id ? 'border-primary' : 'border-gray-100'}`}>
                <img 
                  src={cat.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className={`text-[11px] text-center font-medium ${selectedCategoryId === cat.id ? 'text-primary' : 'text-gray-600'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured / Menu Sections */}
      <div className="mt-6 px-4 space-y-10 pb-20">
        {displayedCategories
          .filter(cat => !selectedCategoryId || cat.id === selectedCategoryId)
          .map((cat) => {
            const items = menuItems.filter(i => i.categoryId === cat.id && i.available);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800">{cat.name}</h3>
                  <Link to="/cardapio" className="text-primary text-xs font-bold">Ver tudo</Link>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {items.slice(0, selectedCategoryId ? 50 : 3).map((item) => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Home;