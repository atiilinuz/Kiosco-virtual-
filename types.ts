
export interface Product {
  id: string;
  barcode?: string;
  name: string;
  price: number;
  costPrice?: number;
  category: string;
  image: string;
  description: string;
  isPopular?: boolean;
  stock: number;
  minStock?: number;
  isCombo?: boolean;
  comboItems?: { productId: string; quantity: number }[];
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
  userName?: string;
  items: CartItem[];
  total: number;
  costTotal?: number;
  paymentMethod: string;
  timestamp: string;
  createdAt?: string;
  paidAmount?: number;
  change?: number;
  refunded?: boolean;
  refundReason?: string;
  customerId?: string;
  customerName?: string;
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

export interface ProductLog {
  id: string;
  productId: string;
  productName: string;
  action: 'create' | 'update' | 'delete';
  userId: string;
  username: string;
  timestamp: string;
  details: string;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: 'error' | 'warning' | 'conflict';
  component?: string;
  userId?: string;
  username?: string;
}

export interface Expense {
  id: string;
  amount: number;
  concept: string;
  category: 'proveedores' | 'servicios' | 'mercaderia' | 'varios';
  paymentMethod: string;
  timestamp: string;
  userId: string;
  username: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'debt' | 'payment';
  amount: number;
  description: string;
  timestamp: string;
  saleId?: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  balance: number;
  createdAt: string;
  notes?: string;
  transactions: CustomerTransaction[];
}

