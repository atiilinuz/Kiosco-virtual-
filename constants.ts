
import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Todos', icon: '🏪' },
  { id: 'golosinas', name: 'Golosinas', icon: '🍬' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'snacks', name: 'Snacks', icon: '🍟' },
  { id: 'comida', name: 'Comida', icon: '🍔' },
  { id: 'helados', name: 'Helados', icon: '🍦' },
  { id: 'almacen', name: 'Almacén', icon: '🥖' },
  { id: 'cigarrillos', name: 'Cigarrillos', icon: '🚬' },
  { id: 'recargas', name: 'Recargas', icon: '📱' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    barcode: '7790070411516',
    name: 'Coca Cola 500ml',
    price: 1200,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
    description: 'Bebida refrescante clásica, sabor original.',
    isPopular: true,
    stock: 24
  },
  {
    id: '2',
    barcode: '0000000000123',
    name: 'Tic-Tac Menta 16g',
    price: 600,
    category: 'golosinas',
    image: 'https://images.unsplash.com/photo-1582131507295-0984ab1cb2f2?auto=format&fit=crop&q=80&w=400',
    description: 'Pastillas de menta refrescantes.',
    isPopular: true,
    stock: 45
  },
  {
    id: '3',
    barcode: '7790060023682',
    name: 'Alfajor Guaymallén Chocolate',
    price: 450,
    category: 'golosinas',
    image: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?auto=format&fit=crop&q=80&w=400',
    description: 'Bañado en chocolate con dulce de leche.',
    isPopular: true,
    stock: 50
  },
  {
    id: '4',
    barcode: '7790310981854',
    name: 'Papas Lays Clásicas 150g',
    price: 2500,
    category: 'snacks',
    image: 'https://images.unsplash.com/photo-1566478431375-7385008cfbfd?auto=format&fit=crop&q=80&w=400',
    description: 'Papas fritas crujientes con sal.',
    isPopular: true,
    stock: 15
  },
  {
    id: '5',
    barcode: '7790580510006',
    name: 'Yerba Mate Playadito 500g',
    price: 3200,
    category: 'almacen',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=400',
    description: 'Yerba suave de molienda equilibrada.',
    stock: 12
  },
  {
    id: '6',
    barcode: '7790111111111',
    name: 'Chicles Beldent Menta',
    price: 800,
    category: 'golosinas',
    image: 'https://images.unsplash.com/photo-1559181567-c3190cb9959b?auto=format&fit=crop&q=80&w=400',
    description: 'Chicles sin azúcar sabor menta fresca.',
    stock: 100
  }
];
