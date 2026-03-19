import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { supabase } from '../services/supabase';
import { Category, MenuItem } from '../types';

interface DBProduct extends Omit<MenuItem, 'categoryId'> {
  category_id: string;
}

const Menu = () => {
  const [produtos, setProdutos] = useState<DBProduct[]>([]);
  const [categoriasDB, setCategoriasDB] = useState<Category[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const { data: produtosData } = await supabase
        .from('produtos')
        .select('*');

      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*');

      console.log('PRODUTOS:', produtosData);
      console.log('CATEGORIAS:', categoriasData);

      if (produtosData) setProdutos(produtosData);
      if (categoriasData) setCategoriasDB(categoriasData);
    }

    carregarDados();
  }, []);

  const activeCategorias = categoriasDB.filter(c => c.active);
  const [selectedCategory, setSelectedCategory] = useState('');

  const activeCategory = selectedCategory || (activeCategorias.length > 0 ? activeCategorias[0].id : '');

  // Scroll category into view when clicked
  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-bold px-4 mb-4" style={{ color: 'var(--color-text)' }}>Cardápio</h2>

      {/* Category Sticky Header */}
      <div className="sticky top-0 z-40 py-2 border-b border-gray-100 shadow-sm" style={{ backgroundColor: 'var(--color-bg)', opacity: 0.95 }}>
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-2 pb-2">
          {activeCategorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors`}
              style={{
                backgroundColor: activeCategory === cat.id ? 'var(--color-primary)' : '#e5e7eb',
                color: activeCategory === cat.id ? '#ffffff' : '#374151'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-8 pb-20">
        {activeCategorias.map((category) => {
          const items = produtos.filter(item => item.category_id === category.id && item.available);
          if (items.length === 0) return null;

          return (
            <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
              <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: 'var(--color-text)' }}>
                <span className="w-1 h-6 rounded-full mr-2" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                {category.name}
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {items.map((item) => (
                  <ProductCard key={item.id} item={{ ...item, categoryId: item.category_id, images: item.images || [] } as MenuItem} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;