
import React from 'react';
import { X, Minus, Plus, ShoppingCart, Trash2, Receipt, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col transform transition-transform animate-slide-left border-l border-white/5">
        
        {/* HEADER RESPONSIVO */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20 pt-[calc(1.5rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <div className="bg-fuchsia-600/20 p-2.5 rounded-2xl text-fuchsia-500">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Mi Carrito</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{items.length} ARTÍCULOS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-full transition-all">
            <X size={26} />
          </button>
        </div>

        {/* LISTA DE PRODUCTOS CON ESPACIADO DE SEGURIDAD */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-80">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-4 py-20">
              <div className="bg-zinc-900/50 p-10 rounded-full border border-dashed border-zinc-800">
                <ShoppingCart size={64} className="opacity-20" />
              </div>
              <p className="text-xl font-black uppercase tracking-tighter">Carrito Vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-zinc-900/30 rounded-[2rem] border border-white/5 group hover:border-fuchsia-500/30 transition-all duration-300">
                <div className="relative">
                  <img src={item.image || undefined} alt={item.name} className="w-16 h-16 rounded-2xl object-cover border border-white/5" />
                  <div className="absolute -top-2 -right-2 bg-fuchsia-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-950">
                    {item.quantity}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-zinc-100 line-clamp-1 text-sm">{item.name}</h4>
                    <button onClick={() => onRemove(item.id)} className="text-zinc-800 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-black/50 border border-zinc-800 rounded-xl p-1">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 text-zinc-500 hover:text-white"><Minus size={14} /></button>
                      <span className="w-6 text-center font-black text-xs text-white">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 text-zinc-500 hover:text-white"><Plus size={14} /></button>
                    </div>
                    <p className="text-fuchsia-400 font-black text-sm">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* IMPORTE TOTAL GIGANTE Y ADAPTABLE */}
        {items.length > 0 && (
          <div className="absolute bottom-0 inset-x-0 p-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-zinc-950/95 backdrop-blur-3xl shadow-[0_-40px_80px_rgba(0,0,0,0.9)] z-30 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Receipt size={16} className="text-fuchsia-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Total a pagar</span>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-6 bg-fuchsia-600/10 blur-[40px] rounded-full animate-pulse" />
              <span className="relative text-7xl sm:text-8xl font-black text-white tracking-tighter tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            <button 
              onClick={onCheckout}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest text-sm"
            >
              Confirmar Pedido <ArrowRight size={20} />
            </button>

            <div className="mt-8 flex items-center justify-center gap-3 w-full opacity-30">
              <div className="h-px bg-zinc-800 flex-1" />
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.6em] font-black whitespace-nowrap">
                LAS CHICAS • KIOSCO DIGITAL
              </p>
              <div className="h-px bg-zinc-800 flex-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
