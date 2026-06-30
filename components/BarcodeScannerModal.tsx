
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Trash2, Printer, CheckCircle2, ShoppingBag, CreditCard, Banknote, Plus, Minus, Loader2, Scan } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Product, CartItem } from '../types';
import TicketModal from './TicketModal';
import { formatCurrency } from '../utils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  onCompleteSale: (items: CartItem[], total: number, paymentMethod: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, allProducts, onCompleteSale }) => {
  const [scannedItems, setScannedItems] = useState<CartItem[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const total = useMemo(() => scannedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [scannedItems]);

  useEffect(() => {
    let timer: any = null;

    if (isOpen) {
      // Pequeño delay para asegurar que el DOM está listo
      timer = setTimeout(() => {
        try {
          const element = document.getElementById("reader");
          if (!element) {
              console.warn("Reader element not found, retrying...");
              return;
          }

          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.warn);
          }

          const scanner = new Html5QrcodeScanner(
            "reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true
            },
            false
          );
          
          scanner.render(onScanSuccess, onScanFailure);
          scannerRef.current = scanner;
        } catch (e) {
          console.error("Error initializing scanner", e);
        }
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (scannerRef.current) {
        try {
            scannerRef.current.clear().catch(e => console.warn("Scanner clear failed", e));
        } catch(e) {
            console.warn("Scanner cleanup failed", e);
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  const onScanSuccess = (decodedText: string) => {
    const product = allProducts.find(p => p.barcode === decodedText);
    
    if (product) {
      handleAddItem(product);
      setLastScanned(product.name);
      
      // Feedback visual y auditivo
      if (navigator.vibrate) navigator.vibrate(200);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch(e) {
        // Ignorar error de audio si no está permitido
      }

      setTimeout(() => setLastScanned(null), 2000);
    }
  };

  const onScanFailure = (error: any) => {
    // Ignoramos errores de frame vacío
  };

  const handleAddItem = (product: Product) => {
    setScannedItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setScannedItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(i => i.quantity > 0);
    });
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScannedItems([]);
    setPaymentMethod('efectivo');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={handleClose} />
        
        <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-fade-in">
          
          {/* Left Panel: Scanner */}
          <div className="flex-1 bg-black p-6 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 relative">
             <div className="flex justify-between items-center mb-4 md:hidden">
               <h3 className="font-black text-white flex items-center gap-2">
                 <Scan className="text-fuchsia-500" /> Scanner
               </h3>
               <button onClick={handleClose} className="p-2 bg-zinc-800 rounded-full text-white">
                 <X size={20} />
               </button>
             </div>

             <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800">
                <div id="reader" className="w-full h-full overflow-hidden [&>div]:!shadow-none [&>div]:!border-none [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
                
                {/* Overlay UI for Scanner */}
                <div className="absolute inset-0 pointer-events-none border-[30px] border-black/50 z-10 flex items-center justify-center">
                   <div className="w-64 h-64 border-2 border-fuchsia-500/50 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-fuchsia-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-fuchsia-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-fuchsia-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-fuchsia-500 -mb-1 -mr-1 rounded-br-xl"></div>
                   </div>
                </div>

                {lastScanned && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-black px-6 py-2 rounded-full shadow-lg z-20 animate-bounce">
                    + {lastScanned}
                  </div>
                )}
             </div>
             <p className="text-center text-zinc-500 text-xs mt-4 font-medium">Apunta la cámara al código de barras</p>
          </div>

          {/* Right Panel: List & Actions */}
          <div className="flex-1 flex flex-col bg-zinc-900 h-[50vh] md:h-auto">
             <div className="p-6 border-b border-zinc-800 hidden md:flex justify-between items-center">
               <div>
                 <h2 className="text-xl font-black text-white">Lista de Escaneo</h2>
                 <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Nueva Venta</p>
               </div>
               <button onClick={handleClose} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-full transition-colors">
                 <X size={24} />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {scannedItems.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                   <ShoppingBag size={48} className="opacity-20" />
                   <p className="font-bold text-sm">Escanea productos para comenzar</p>
                 </div>
               ) : (
                 scannedItems.map(item => (
                   <div key={item.id} className="bg-black/40 p-3 rounded-2xl flex items-center gap-3 border border-zinc-800/50">
                     <img src={item.image || undefined} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                     <div className="flex-1 min-w-0">
                       <p className="text-white font-bold text-sm truncate">{item.name}</p>
                       <p className="text-fuchsia-400 font-bold text-xs">{formatCurrency(item.price * item.quantity)}</p>
                     </div>
                     <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1">
                       <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 text-zinc-500 hover:text-white"><Minus size={14} /></button>
                       <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                       <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 text-zinc-500 hover:text-white"><Plus size={14} /></button>
                     </div>
                     <button onClick={() => handleRemoveItem(item.id)} className="text-zinc-600 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                   </div>
                 ))
               )}
             </div>

             <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4">
               {/* Totales */}
               <div className="flex justify-between items-end">
                 <span className="text-zinc-500 font-bold text-sm uppercase">Total</span>
                 <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
               </div>

               {/* Métodos de Pago */}
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setPaymentMethod('efectivo')}
                   className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'efectivo' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                 >
                   <Banknote size={18} /> <span className="text-xs font-black uppercase">Efectivo</span>
                 </button>
                 <button 
                   onClick={() => setPaymentMethod('transferencia')}
                   className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'transferencia' ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                 >
                   <CreditCard size={18} /> <span className="text-xs font-black uppercase">Transfer</span>
                 </button>
               </div>

               {/* Acciones */}
               <div className="grid grid-cols-1 gap-3 pt-2">
                 <button 
                   onClick={() => onCompleteSale(scannedItems, total, paymentMethod)}
                   disabled={scannedItems.length === 0}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                 >
                   <CheckCircle2 size={20} /> COBRAR AHORA
                 </button>
                 
                 <button 
                   onClick={() => setShowTicketPreview(true)}
                   disabled={scannedItems.length === 0}
                   className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                 >
                   <Printer size={18} /> Solo imprimir ticket
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>

      <TicketModal 
        isOpen={showTicketPreview} 
        onClose={() => setShowTicketPreview(false)} 
        items={scannedItems} 
        total={total} 
      />
    </>
  );
};

export default BarcodeScannerModal;
