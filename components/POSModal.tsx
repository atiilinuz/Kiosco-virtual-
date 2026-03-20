
import React, { useState } from 'react';
import { X, Zap, Printer, CheckCircle2, ShoppingBag, Banknote, CreditCard } from 'lucide-react';
import { CartItem } from '../types';
import TicketModal from './TicketModal';
import { formatCurrency } from '../utils';

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onCompleteSale: (items: CartItem[], total: number, paymentMethod: string) => void;
}

const POSModal: React.FC<POSModalProps> = ({ isOpen, onClose, items, onCompleteSale }) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        
        <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl">
                <Zap className="text-emerald-500" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cierre de Venta</h2>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Terminal de Cobro</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <ShoppingBag size={48} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500">No hay productos seleccionados para vender.</p>
                <button onClick={onClose} className="text-emerald-500 font-bold hover:underline">Agregar productos</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Resumen</h3>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-zinc-950/30 p-3 rounded-xl border border-zinc-800/50">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{item.name}</span>
                        <span className="text-zinc-500 text-[10px] uppercase font-bold">{item.quantity} unidades</span>
                      </div>
                      <span className="text-white font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${paymentMethod === 'efectivo' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                    >
                      <Banknote size={24} />
                      <span className="text-xs font-bold uppercase">Efectivo</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${paymentMethod === 'transferencia' ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.1)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                    >
                      <CreditCard size={24} />
                      <span className="text-xs font-bold uppercase">Transferencia</span>
                    </button>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] text-center">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total a Cobrar</p>
                  <p className="text-4xl font-black text-white">{formatCurrency(total)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-6 bg-zinc-950 border-t border-zinc-800 grid grid-cols-1 gap-4">
              <button 
                onClick={() => onCompleteSale(items, total, paymentMethod)}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-950/30 transition-all active:scale-[0.98] border border-emerald-400/20"
              >
                <CheckCircle2 size={24} />
                FINALIZAR COBRO
              </button>
              <button 
                onClick={() => setShowTicketPreview(true)}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 hover:text-white font-bold py-3 rounded-xl transition-all"
              >
                <Printer size={18} />
                Solo imprimir ticket
              </button>
            </div>
          )}
        </div>
      </div>
      
      <TicketModal 
        isOpen={showTicketPreview} 
        onClose={() => setShowTicketPreview(false)} 
        items={items} 
        total={total} 
      />
    </>
  );
};

export default POSModal;
