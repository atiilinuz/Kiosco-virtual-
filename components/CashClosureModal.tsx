
import React from 'react';
import { X, Calculator, Banknote, CreditCard, ShoppingBag, Calendar, User, Printer, FileSpreadsheet, FileText } from 'lucide-react';
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
    // Eliminar iframe previo si existe
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.parentNode?.removeChild(iframe);
    }

    // Crear iframe oculto
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Cierre de Caja - ${currentUser.username}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; font-size: 14px; color: #000; background: #fff; }
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
        </body>
      </html>
    `);
    doc.close();

    // Disparar impresión nativa enfocando el iframe oculto
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 300);
  };

  const handleExportToExcel = () => {
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          .title { font-size: 16px; font-weight: bold; text-align: center; background-color: #10b981; color: #ffffff; padding: 10px; }
          .header { background-color: #18181b; color: #ffffff; font-weight: bold; }
          td, th { border: 1px solid #e4e4e7; padding: 8px; text-align: left; }
          .total { font-weight: bold; background-color: #f4f4f5; }
        </style>
      </head>
      <body>
        <table>
          <tr><th colspan="2" class="title">CIERRE DE CAJA - KIOSCO LAS CHICAS</th></tr>
          <tr><td><strong>Usuario:</strong></td><td>${currentUser.username.toUpperCase()}</td></tr>
          <tr><td><strong>Fecha y Hora:</strong></td><td>${new Date().toLocaleString()}</td></tr>
          <tr><td><strong>Productos Vendidos:</strong></td><td>${totals.totalProducts}</td></tr>
          <tr><td><strong>Operaciones/Ventas:</strong></td><td>${userSales.length}</td></tr>
          <tr><td colspan="2"></td></tr>
          <tr class="header"><th colspan="2">DETALLE DE RECAUDACIÓN</th></tr>
          <tr><td>Efectivo:</td><td>${formatCurrency(totals.cashTotal)}</td></tr>
          <tr><td>Transferencia / Tarjeta:</td><td>${formatCurrency(totals.transferTotal)}</td></tr>
          <tr class="total"><td>TOTAL RECAUDADO:</td><td>${formatCurrency(totals.totalAmount)}</td></tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cierre_caja_${currentUser.username}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToWord = () => {
    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .title { font-size: 20px; font-weight: bold; text-align: center; color: #d946ef; border-bottom: 2px solid #d946ef; padding-bottom: 10px; margin-bottom: 20px; }
          .section { font-size: 14px; font-weight: bold; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          td, th { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #f3f4f6; }
          .total { font-size: 16px; font-weight: bold; color: #111827; background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="title">REPORTE DE CIERRE DE CAJA</div>
        <p><strong>Operador:</strong> ${currentUser.username.toUpperCase()}</p>
        <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Cantidad de Ventas realizadas:</strong> ${userSales.length}</p>
        <p><strong>Cantidad total de productos vendidos:</strong> ${totals.totalProducts}</p>
        
        <div class="section">Resumen de Caja</div>
        <table>
          <thead>
            <tr>
              <th>Concepto de Pago</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Efectivo</td>
              <td>${formatCurrency(totals.cashTotal)}</td>
            </tr>
            <tr>
              <td>Transferencia / Tarjeta / Otros</td>
              <td>${formatCurrency(totals.transferTotal)}</td>
            </tr>
            <tr class="total">
              <td><strong>Total General Recaudado</strong></td>
              <td><strong>${formatCurrency(totals.totalAmount)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <p style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
          SISTEMA KIOSCO LAS CHICAS - Reporte de cierre autogenerado para control interno.
        </p>
      </body>
      </html>
    `;

    const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cierre_caja_${currentUser.username}_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 flex flex-col gap-4">
          <button 
            onClick={handlePrintClosure}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] hover:bg-zinc-100"
          >
            <Printer size={22} />
            IMPRIMIR REPORTE DE CIERRE
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleExportToExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold py-4 px-4 rounded-xl border border-emerald-500/25 transition-all active:scale-[0.98]"
              id="btn-export-excel"
              title="Exportar cierre de caja a un archivo Excel (.xls)"
            >
              <FileSpreadsheet size={20} />
              <span className="text-xs uppercase tracking-wider font-bold">Exportar Excel</span>
            </button>
            <button 
              onClick={handleExportToWord}
              className="flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-4 px-4 rounded-xl border border-blue-500/25 transition-all active:scale-[0.98]"
              id="btn-export-word"
              title="Exportar cierre de caja a un archivo Word (.doc)"
            >
              <FileText size={20} />
              <span className="text-xs uppercase tracking-wider font-bold">Exportar Word</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            Al imprimir o exportar el reporte, asegúrese de entregarlo al administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default CashClosureModal;
