
export interface Product {
  id: string;
  barcode?: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  isPopular?: boolean;
  stock: number;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  device: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  userId: string;
  username: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface AIRecommendation {
  products: string[];
  reasoning: string;
}
