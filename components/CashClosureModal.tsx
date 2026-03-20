
import React from 'react';
import { X, Calculator, Banknote, CreditCard, ShoppingBag, Calendar, User, Printer } from 'lucide-react';
import { Sale, AppUser } from '../types';
import { formatCurrency } from '../utils';

interface CashClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  sales: Sale[];
}

const CashClosureModal: React.FC<CashClosureModalProps> = ({ isOpen, onClose, currentUser, sales }) => {
  if (!isOpen || !currentUser) return null;

  // Filtrar solo las ventas del día actual y del usuario actual
  const today = new Date().toLocaleDateString();
  const userSales = sales.filter(s => 
    s.userId === currentUser.id && 
    new Date(s.timestamp).toLocaleDateString() === today
  );
  
  const totals = userSales.reduce((acc, sale) => {
    acc.totalAmount += sale.total;
    acc.totalProducts += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'efectivo') {
      acc.cashTotal += sale.total;
    } else {
      acc.transferTotal += sale.total;
    }
    
    return acc;
  }, {
    totalAmount: 0,
    totalProducts: 0,
    cashTotal: 0,
    transferTotal: 0
  });

  const handlePrintClosure = () => {
    const windowPrint = window.open('', '', 'width=600,height=600');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Cierre de Caja - ${currentUser.username}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; font-size: 14px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
            .stat { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-size: 20px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0">CIERRE DE CAJA</h2>
            <p style="margin:5px 0">USUARIO: ${currentUser.username.toUpperCase()}</p>
            <p style="margin:0">${new Date().toLocaleString()}</p>
          </div>
          <div class="stat"><span>PRODUCTOS VENDIDOS:</span> <span>${totals.totalProducts}</span></div>
          <div class="stat"><span>OPERACIONES:</span> <span>${userSales.length}</span></div>
          <div class="stat"><span>EFECTIVO:</span> <span>${formatCurrency(totals.cashTotal)}</span></div>
          <div class="stat"><span>TRANSFER/OTROS:</span> <span>${formatCurrency(totals.transferTotal)}</span></div>
          <div class="total"><span>TOTAL GENERAL:</span> <span>${formatCurrency(totals.totalAmount)}</span></div>
          <div class="footer">
            SISTEMA KIOSCO LAS CHICAS<br>
            --------------------------
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-fuchsia-500/10 p-3 rounded-2xl">
              <Calculator className="text-fuchsia-500" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Cierre de Jornada</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Balance de Caja Personal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-full transition-colors">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 p-8 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <User size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Operador</span>
              </div>
              <p className="text-white font-bold">{currentUser.username}</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Fecha</span>
              </div>
              <p className="text-white font-bold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-zinc-950 rounded-2xl border border-zinc-800/50 group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Banknote size={24} />
                </div>
                <span className="font-bold text-zinc-300">Total en Efectivo</span>
              </div>
              <span className="text-xl font-black text-white">{formatCurrency(totals.cashTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-5 bg-zinc-950 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                  <CreditCard size={24} />
                </div>
                <span className="font-bold text-zinc-300">Total Transfer/Tarjeta</span>
              </div>
              <span className="text-xl font-black text-white">{formatCurrency(totals.transferTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-5 bg-zinc-950 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-500">
                  <ShoppingBag size={24} />
                </div>
                <span className="font-bold text-zinc-300">Productos Vendidos</span>
              </div>
              <span className="text-xl font-black text-white">{totals.totalProducts} un.</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-br from-fuchsia-600/20 to-violet-600/20 p-8 rounded-[2rem] border border-fuchsia-500/30 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <p className="text-fuchsia-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Total Recaudado en Sesión</p>
            <p className="text-5xl font-black text-white drop-shadow-lg">{formatCurrency(totals.totalAmount)}</p>
          </div>
        </div>

        <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 grid grid-cols-1 gap-4">
          <button 
            onClick={handlePrintClosure}
            className="flex items-center justify-center gap-3 bg-white text-black font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] hover:bg-zinc-100"
          >
            <Printer size={22} />
            IMPRIMIR REPORTE DE CIERRE
          </button>
          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            Al imprimir el reporte, asegúrese de entregarlo al administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default CashClosureModal;
