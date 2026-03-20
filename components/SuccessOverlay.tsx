
import React from 'react';
import { CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';

interface SuccessOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ isOpen, onClose, message = "VENTA FINALIZADA" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop con desenfoque profundo */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-fade-in" />
      
      <div className="relative flex flex-col items-center text-center space-y-8 animate-scale-up">
        {/* Círculo de éxito animado */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
          <div className="bg-emerald-500 text-black p-6 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.4)] relative z-10">
            <CheckCircle2 size={80} strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">{message}</h2>
          <p className="text-emerald-400 font-bold tracking-widest text-sm">OPERACIÓN COMPLETADA CON ÉXITO</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 max-w-xs w-full">
          <div className="bg-zinc-800 p-3 rounded-2xl text-zinc-400">
            <ShoppingBag size={24} />
          </div>
          <div className="text-left">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Estado</p>
            <p className="text-white font-bold">Stock actualizado</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-emerald-50 active:scale-95 transition-all"
        >
          CONTINUAR VENDIENDO
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <style>{`
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default SuccessOverlay;
