
export interface ProductOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface ProductOptionGroup {
  id: string;
  title: string;
  required: boolean;
  min: number; 
  max: number; 
  options: ProductOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  optionGroups: ProductOptionGroup[];
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  active: boolean; // Added active state
}

export interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  selectedOptions: { [groupId: string]: ProductOption[] };
}

export interface NeighborhoodFee {
  name: string;
  price: number;
}

export interface DeliveryConfig {
  freeShippingThreshold: number; // 0 to disable
  standardFee: number;
  neighborhoods: NeighborhoodFee[];
}

export interface StyleConfig {
  primaryColor: string;
  priceColor: string;
  backgroundColor: string; // App background
  cardColor: string; // Product card background
  textColor: string;
}

export interface RestaurantInfo {
  name: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  logo: string;
  banner: string;
  instagramUrl: string; // New
  facebookUrl: string; // New
  adminPassword?: string; // New (optional, stored in localstorage usually)
  
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixName: string; // New
  pixCity: string; // New
  
  businessHours: string;
  
  delivery: DeliveryConfig; // New
  style: StyleConfig; // New
  
  notice: {
    active: boolean;
    text: string;
  }; // New
}

export interface OrderDetails {
  customerName: string;
  address: string;
  number: string;
  neighborhood: string; // New
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro';
  needCutlery: string; // New field (Mandatory)
  changeFor?: string;
  notes: string;
  deliveryFee: number; // New
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any; // Firestore Timestamp or Date
  paymentMethod: string;
  address: string;
  neighborhood: string;
  number: string;
  changeFor?: string;
  notes?: string;
  needCutlery?: string;
  deliveryFee: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}