import { MenuItem, Category, RestaurantInfo } from './types';

export const INITIAL_RESTAURANT_INFO: RestaurantInfo = {
  name: "Marmitaria da Diih",
  phone: "(19) 95330-7669",
  whatsappNumber: "5519953307669",
  address: "Rua Exemplo, 123 - Centro",
  logo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  banner: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",

  pixKey: "",
  pixKeyType: "email",
  pixName: "Marmitaria da Diih",
  pixCity: "Amparo-SP",

  businessHours: "Segunda a Sábado: 10:30 às 14:30",

  delivery: {
    freeShippingThreshold: 150,
    standardFee: 5.00,
    neighborhoods: [
      { name: 'Centro', price: 5.00 },
      { name: 'Jardim das Flores', price: 7.00 },
      { name: 'Vila Nova', price: 8.00 }
    ]
  },

  style: {
    primaryColor: '#DC2626',
    priceColor: '#DC2626',
    backgroundColor: '#F9FAFB',
    cardColor: '#FFFFFF',
    textColor: '#111827'
  },

  notice: {
    active: true,
    text: "Estamos atendendo normalmente!"
  }
};

export const INITIAL_CATEGORIAS: Category[] = [
  { id: 'pratododia', name: 'Prato do Dia', active: true },
  { id: 'marmitas', name: 'Marmitas Tradicionais', active: true },
  { id: 'fit', name: 'Linha Fit & Saudável', active: true },
  { id: 'drinks', name: 'Bebidas Geladas', active: true },
  { id: 'desserts', name: 'Sobremesas', active: true },
];

export const INITIAL_MENU: MenuItem[] = [
  // Marmitas
  {
    id: '1',
    categoryId: 'marmitas',
    name: 'Bife Acebolado',
    description: 'Arroz branco soltinho, feijão carioca, bife de alcatra acebolado, fritas e farofa da casa.',
    price: 22.90,
    images: ['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    available: true,
    optionGroups: [
      {
        id: 'size',
        title: 'Tamanho',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'p', name: 'Pequena', price: 0, available: true },
          { id: 'm', name: 'Média', price: 4.00, available: true },
          { id: 'g', name: 'Grande', price: 7.00, available: true }
        ]
      }
    ]
  },
  {
    id: '4',
    categoryId: 'fit',
    name: 'Frango Grelhado',
    description: 'Arroz integral, mix de legumes no vapor (brócolis, cenoura, vagem) e filé de frango grelhado.',
    price: 19.90,
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    available: true,
    optionGroups: [
      {
        id: 'size',
        title: 'Tamanho',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'p', name: 'Pequena', price: 0, available: true },
          { id: 'm', name: 'Média', price: 4.00, available: true },
          { id: 'g', name: 'Grande', price: 7.00, available: true }
        ]
      }
    ]
  }
];