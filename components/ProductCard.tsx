
import React, { memo } from 'react';
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

const ProductCard: React.FC<ProductCardProps> = memo(({ 
  product, 
  onAddToCart, 
  currentQty = 0, 
  onUpdateQuantity 
}) => {
  const isLowStock = product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={`group bg-zinc-900/40 rounded-2xl border border-zinc-800/50 overflow-hidden hover:border-fuchsia-500/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col ${isOutOfStock ? 'opacity-60' : ''}`}>
      {/* Imagen reducida y estilizada con Lazy Loading */}
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950">
        <img 
          src={product.image || undefined} 
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100 ${isOutOfStock ? 'grayscale' : ''}`}
        />
        {product.isPopular && (
          <div className="absolute top-1.5 left-1.5 bg-fuchsia-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
            TOP
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/5">
          <span className={`text-[8px] font-black ${isLowStock ? 'text-red-500' : 'text-zinc-400'}`}>
            STOCK: {product.stock}
          </span>
        </div>
      </div>
      
      <div className="p-2.5 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <div className="flex justify-between items-start mb-0.5">
            <span className="text-[8px] uppercase font-black text-fuchsia-500/80 tracking-[0.2em]">
              {product.category}
            </span>
            <span className="text-xs md:text-sm font-black text-white">
              {formatCurrency(product.price)}
            </span>
          </div>
          <h3 className="font-bold text-zinc-100 text-xs md:text-sm line-clamp-1 group-hover:text-fuchsia-400 transition-colors">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center justify-between gap-1.5 mt-0.5">
          {currentQty > 0 ? (
            /* CONTROL DE CANTIDAD EXPANDIDO */
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 w-full justify-between animate-fade-in shadow-inner">
              <button 
                onClick={() => onUpdateQuantity?.(product.id, -1)}
                className="p-2 md:p-2.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500 rounded-lg transition-all active:scale-90"
              >
                <Minus size={18} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm md:text-base font-black text-white">{currentQty}</span>
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter">UNID.</span>
              </div>
              <button 
                onClick={() => onUpdateQuantity?.(product.id, 1)}
                className="p-2 md:p-2.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 hover:border-emerald-500 rounded-lg transition-all active:scale-90"
              >
                <Plus size={18} />
              </button>
            </div>
          ) : (
            /* BOTÓN INICIAL DE AGREGAR */
            <button 
              onClick={() => !isOutOfStock && onAddToCart(product)}
              disabled={isOutOfStock}
              className={`w-full py-2.5 md:py-3 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 border ${
                isOutOfStock 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 hover:border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
              }`}
            >
              <Plus size={16} />
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
