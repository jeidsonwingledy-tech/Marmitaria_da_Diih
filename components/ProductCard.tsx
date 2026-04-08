import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useProducts } from '../context/ProductContext';

import { ImageEditable } from './ui/ImageEditable';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  item: MenuItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { updateMenuItem } = useProducts();
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
        className="bg-white py-4 flex gap-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Info Column */}
        <div className="flex-1 flex flex-col justify-between min-h-[100px]">
          <div>
            <h3 className="font-semibold text-[15px] text-gray-800 leading-snug group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
          
          <div className="mt-2 flex items-center gap-3">
            <span className="font-bold text-sm text-gray-800">
              {item.price > 0 ? formatCurrency(item.price) : 'Consulte'}
            </span>
            {item.price === 0 && (
              <span className="text-[10px] bg-red-50 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Sob Consulta
              </span>
            )}
          </div>
        </div>

        {/* Image Column */}
        <div className="w-28 h-24 rounded-lg overflow-hidden bg-gray-50 relative shrink-0">
          <ImageEditable
            src={mainImage}
            alt={item.name}
            onUpdate={handleImageUpdate}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1 right-1">
             <div className="bg-white shadow-sm p-1.5 rounded-full text-primary hover:scale-110 transition-transform">
                <Plus size={16} strokeWidth={3} />
             </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal item={item} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};