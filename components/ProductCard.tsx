
import React from 'react';
import { Plus, Minus, Layers, ShoppingCart } from 'lucide-react';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  // Añadimos props opcionales para manejar la cantidad actual si ya está en el carrito
  currentQty?: number;
  onUpdateQuantity?: (id: string, delta: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  currentQty = 0, 
  onUpdateQuantity 
}) => {
  const isLowStock = product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`group bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden hover:border-fuchsia-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col ${isOutOfStock ? 'opacity-60' : ''}`}>
      {/* Imagen reducida y estilizada con Lazy Loading */}
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
        <img 
          src={product.image} 
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100 ${isOutOfStock ? 'grayscale' : ''}`}
        />
        {product.isPopular && (
          <div className="absolute top-2 left-2 bg-fuchsia-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
            TOP
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/5">
          <span className={`text-[9px] font-black ${isLowStock ? 'text-red-500' : 'text-zinc-400'}`}>
            STOCK: {product.stock}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex justify-between items-start mb-0.5">
            <span className="text-[9px] uppercase font-black text-fuchsia-500/80 tracking-[0.2em]">
              {product.category}
            </span>
            <span className="text-sm font-black text-white">
              {formatCurrency(product.price)}
            </span>
          </div>
          <h3 className="font-bold text-zinc-100 text-sm line-clamp-1 group-hover:text-fuchsia-400 transition-colors">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-1">
          {currentQty > 0 ? (
            /* CONTROL DE CANTIDAD EXPANDIDO */
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-1 w-full justify-between animate-fade-in">
              <button 
                onClick={() => onUpdateQuantity?.(product.id, -1)}
                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-90"
              >
                <Minus size={14} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-white">{currentQty}</span>
                <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter">UNID.</span>
              </div>
              <button 
                onClick={() => onUpdateQuantity?.(product.id, 1)}
                className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-90"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            /* BOTÓN INICIAL DE AGREGAR */
            <button 
              onClick={() => !isOutOfStock && onAddToCart(product)}
              disabled={isOutOfStock}
              className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 border ${
                isOutOfStock 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed' 
                : 'bg-zinc-950 hover:bg-fuchsia-600 border-zinc-800 hover:border-fuchsia-400 text-zinc-400 hover:text-white shadow-xl'
              }`}
            >
              <Plus size={14} />
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
