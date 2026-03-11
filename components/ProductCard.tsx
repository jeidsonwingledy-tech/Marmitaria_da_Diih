import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useStore } from '../context/StoreContext';
import { ImageEditable } from './ui/ImageEditable';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  item: MenuItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { updateMenuItem } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to update the first image for admin consistency in the card view
  const handleImageUpdate = (newImg: string) => {
    // Replace first image or add if empty
    const newImages = [...(item.images || [])];
    if (newImages.length > 0) {
      newImages[0] = newImg;
    } else {
      newImages.push(newImg);
    }
    updateMenuItem(item.id, { images: newImages });
  };

  const mainImage = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300';

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="h-40 w-full overflow-hidden bg-gray-100 relative" onClick={(e) => e.stopPropagation()}>
          <ImageEditable
            src={mainImage}
            alt={item.name}
            onUpdate={handleImageUpdate}
            className="w-full h-full"
          />
          {item.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
              +{item.images.length - 1} fotos
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.name}</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
          <div className="flex justify-between items-center mt-auto">
            {item.price > 0 ? (
              <span className="font-bold text-lg text-primary">{formatCurrency(item.price)}</span>
            ) : (
              <span className="font-bold text-sm text-gray-400">A partir de {formatCurrency(0)}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="bg-secondary text-white p-2 rounded-lg hover:bg-black transition-colors active:scale-95"
              aria-label={`Configurar ${item.name}`}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal item={item} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};