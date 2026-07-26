import React, { useState } from 'react';
import { 
  X, Calculator, Banknote, CreditCard, ShoppingBag, Calendar, User, 
  Printer, FileSpreadsheet, FileText, ChevronDown, ChevronUp, AlertCircle, 
  CheckCircle2, Filter, Send, MessageSquare, Phone
} from 'lucide-react';
import { Sale, AppUser } from '../types';
import { formatCurrency } from '../utils';

interface CashClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  sales: Sale[];
}

const CashClosureModal: React.FC<CashClosureModalProps> = ({ isOpen, onClose, currentUser, sales }) => {
  const [userFilter, setUserFilter] = useState<'my_sales' | 'all_sales'>('my_sales');
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [showSalesList, setShowSalesList] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    return localStorage.getItem('kiosco_whatsapp_phone') || '';
  });

  if (!isOpen || !currentUser) return null;

  // Helper para extraer la fecha de la venta de forma robusta
  const parseSaleDate = (s: Sale): Date => {
    const raw = s.timestamp || s.createdAt || (s as any).created_at;
    if (!raw) return new Date();
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
  };

  const isUserMatch = (s: Sale) => {
    if (!currentUser) return true;
    const currId = String(currentUser.id || '').toLowerCase();
    const currName = String(currentUser.username || '').toLowerCase();
    
    const sUserId = String(s.userId || (s as any).user_id || '').toLowerCase();
    const sUsername = String(s.username || s.userName || (s as any).user_name || '').toLowerCase();

    // Coincidencia exacta por ID o Nombre de Usuario
    return (sUserId !== '' && sUserId === currId) || 
           (sUsername !== '' && sUsername === currName) ||
           sUserId === 'unknown' || 
           sUsername === 'usuario';
  };

  // Filtrar las ventas según el operador y la fecha seleccionados
  const filteredSales = sales.filter(s => {
    const sDate = parseSaleDate(s);
    const matchesDate = dateFilter === 'today' ? isToday(sDate) : true;
    const matchesUser = userFilter === 'all_sales' ? true : isUserMatch(s);
    return matchesDate && matchesUser;
  });

  // Ventas de hoy en el sistema independientemente del usuario (para la sugerencia inteligente)
  const allTodaySalesCount = sales.filter(s => isToday(parseSaleDate(s))).length;

  const totals = filteredSales.reduce((acc, sale) => {
    acc.totalAmount += sale.total;
    acc.totalProducts += (sale.items || []).reduce((sum, item) => sum + item.quantity, 0);
    
    const method = String(sale.paymentMethod || '').toLowerCase();
    if (method === 'cash' || method === 'efectivo') {
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
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.parentNode?.removeChild(iframe);
    }

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

    const salesDetailRows = filteredSales.map(s => `
      <tr>
        <td style="padding:4px 0; border-bottom:1px solid #eee;">${parseSaleDate(s).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td style="padding:4px 0; border-bottom:1px solid #eee;">${s.username || s.userName || 'Op'}</td>
        <td style="padding:4px 0; border-bottom:1px solid #eee;">${s.paymentMethod}</td>
        <td style="padding:4px 0; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(s.total)}</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Cierre de Caja - ${currentUser.username}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 15px; font-size: 13px; color: #000; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .stat { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            table { width: 100%; font-size: 11px; margin-top: 10px; border-collapse: collapse; }
            .footer { text-align: center; margin-top: 25px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0">CIERRE DE CAJA</h2>
            <p style="margin:4px 0; font-weight:bold;">OPERADOR: ${currentUser.username.toUpperCase()}</p>
            <p style="margin:0">${new Date().toLocaleString()}</p>
          </div>
          <div class="stat"><span>FILTRO FECHA:</span> <span>${dateFilter === 'today' ? 'HOY' : 'TODAS'}</span></div>
          <div class="stat"><span>PRODUCTOS VENDIDOS:</span> <span>${totals.totalProducts} un.</span></div>
          <div class="stat"><span>OPERACIONES / VENTAS:</span> <span>${filteredSales.length}</span></div>
          <div class="stat"><span>EFECTIVO:</span> <span>${formatCurrency(totals.cashTotal)}</span></div>
          <div class="stat"><span>TRANSFER / TARJETA:</span> <span>${formatCurrency(totals.transferTotal)}</span></div>
          <div class="total"><span>TOTAL RECAUDADO:</span> <span>${formatCurrency(totals.totalAmount)}</span></div>
          
          <h4 style="margin-top:20px; margin-bottom:5px; border-bottom:1px solid #000;">DESGLOSE DE VENTAS (${filteredSales.length})</h4>
          <table>
            <thead>
              <tr style="border-bottom:1px solid #000; text-align:left;">
                <th>Hora</th>
                <th>Usuario</th>
                <th>Pago</th>
                <th style="text-align:right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${salesDetailRows || '<tr><td colspan="4" style="text-align:center;">Sin ventas en el periodo</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            SISTEMA KIOSCO LAS CHICAS<br>
            --------------------------------
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 300);
  };

  // Exportar a CSV nativo que abre en Excel sin advertencias de formato
  const handleExportToCSV = () => {
    try {
      const headers = ['ID Venta', 'Fecha y Hora', 'Operador', 'Metodo Pago', 'Items', 'Total ($)'];
      const rows = filteredSales.map(s => {
        const dateStr = parseSaleDate(s).toLocaleString();
        const opName = s.username || s.userName || 'Usuario';
        const payMethod = s.paymentMethod || 'Efectivo';
        const qty = (s.items || []).reduce((acc, item) => acc + item.quantity, 0);
        return [
          `"${s.id}"`,
          `"${dateStr}"`,
          `"${opName}"`,
          `"${payMethod}"`,
          qty,
          s.total.toFixed(2)
        ].join(',');
      });

      const summaryHeader = [
        '',
        '--- RESUMEN DE CIERRE DE CAJA ---',
        `Operador: "${currentUser.username}"`,
        `Fecha de Emisión: "${new Date().toLocaleString()}"`,
        `Total Operaciones: ${filteredSales.length}`,
        `Total Productos: ${totals.totalProducts}`,
        `Efectivo Recaudado: "${totals.cashTotal.toFixed(2)}"`,
        `Transferencia/Tarjeta Recaudado: "${totals.transferTotal.toFixed(2)}"`,
        `TOTAL GENERAL: "${totals.totalAmount.toFixed(2)}"`
      ].join('\n');

      const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryHeader].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const fileName = `cierre_caja_${currentUser.username}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportFeedback(`✓ ¡Archivo CSV para Excel descargado! (${fileName})`);
      setTimeout(() => setExportFeedback(null), 6000);
    } catch (err: any) {
      alert(`Error al generar archivo CSV: ${err.message}`);
    }
  };

  // Exportar HTML/Word e intentar abrir la vista completa
  const handleExportToWord = () => {
    try {
      const salesTableRows = filteredSales.map(s => `
        <tr>
          <td>${s.id}</td>
          <td>${parseSaleDate(s).toLocaleString()}</td>
          <td>${s.username || s.userName || 'Usuario'}</td>
          <td>${s.paymentMethod}</td>
          <td>${(s.items || []).reduce((sum, i) => sum + i.quantity, 0)} un.</td>
          <td><strong>${formatCurrency(s.total)}</strong></td>
        </tr>
      `).join('');

      const docHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Cierre de Caja - ${currentUser.username}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; padding: 20px; }
            .title { font-size: 22px; font-weight: bold; text-align: center; color: #8b5cf6; border-bottom: 3px solid #8b5cf6; padding-bottom: 8px; margin-bottom: 20px; }
            .meta { background: #f4f4f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td, th { border: 1px solid #d4d4d8; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #e4e4e7; font-weight: bold; }
            .total-box { background-color: #f3e8ff; border: 2px solid #c084fc; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px; }
            .total-box h2 { margin: 0; color: #6b21a8; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="title">REPORTE DE CIERRE DE CAJA</div>
          <div class="meta">
            <p style="margin:2px 0"><strong>Operador:</strong> ${currentUser.username.toUpperCase()}</p>
            <p style="margin:2px 0"><strong>Fecha de Emisión:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin:2px 0"><strong>Operaciones realizadas:</strong> ${filteredSales.length}</p>
            <p style="margin:2px 0"><strong>Total unidades vendidas:</strong> ${totals.totalProducts}</p>
          </div>

          <h3>Resumen Financiero</h3>
          <table>
            <thead>
              <tr><th>Concepto</th><th>Monto</th></tr>
            </thead>
            <tbody>
              <tr><td>Efectivo</td><td>${formatCurrency(totals.cashTotal)}</td></tr>
              <tr><td>Transferencia / Tarjeta / Otros</td><td>${formatCurrency(totals.transferTotal)}</td></tr>
            </tbody>
          </table>

          <div class="total-box">
            <p style="margin:0; font-size:12px; text-transform:uppercase; font-weight:bold; color:#7e22ce;">Total General Recaudado</p>
            <h2>${formatCurrency(totals.totalAmount)}</h2>
          </div>

          <h3 style="margin-top: 30px;">Detalle de Ventas (${filteredSales.length})</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Metodo</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${salesTableRows || '<tr><td colspan="6" style="text-align:center;">Sin ventas registradas</td></tr>'}
            </tbody>
          </table>

          <p style="margin-top: 40px; text-align: center; font-size: 11px; color: #71717a;">
            SISTEMA KIOSCO LAS CHICAS - Cierre de caja generado automáticamente.
          </p>
        </body>
        </html>
      `;

      // 1. Descargar como Blob HTML/Word
      const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `cierre_caja_${currentUser.username}_${new Date().toISOString().slice(0, 10)}.doc`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 2. Abrir también la vista previa en nueva ventana para lectura instantánea
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(docHtml);
        newWin.document.close();
      }

      setExportFeedback(`✓ ¡Reporte Word descargado (${fileName}) y abierto en vista previa!`);
      setTimeout(() => setExportFeedback(null), 6000);
    } catch (err: any) {
      alert(`Error al generar reporte: ${err.message}`);
    }
  };

  const handleSendWhatsApp = () => {
    try {
      const formattedDate = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const formattedTime = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Construcción del mensaje formateado para WhatsApp con la premisa explícita
      const messageLines = [
        `📊 *REPORTE DE CIERRE DE CAJA*`,
        `🏪 *Kiosco Las Chicas*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Operador:* ${currentUser.username}`,
        `📅 *Fecha:* ${formattedDate} ${formattedTime}`,
        `🔎 *Filtro:* ${dateFilter === 'today' ? 'Ventas de Hoy' : 'Todas las fechas'} (${userFilter === 'my_sales' ? 'Mis ventas' : 'Todas las ventas'})`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💵 *Efectivo:* ${formatCurrency(totals.cashTotal)}`,
        `💳 *Transfer/Tarjeta:* ${formatCurrency(totals.transferTotal)}`,
        `🛍️ *Productos Vendidos:* ${totals.totalProducts} un.`,
        `🧾 *Operaciones:* ${filteredSales.length} ventas`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 *TOTAL RECAUDADO:* ${formatCurrency(totals.totalAmount)}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `_Reporte de Cierre de Caja generado automáticamente desde el Sistema Kiosco._`
      ];

      const fullMessage = messageLines.join('\n');
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

      if (cleanPhone) {
        localStorage.setItem('kiosco_whatsapp_phone', cleanPhone);
      }

      const encodedMsg = encodeURIComponent(fullMessage);
      const whatsappUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;

      window.open(whatsappUrl, '_blank');

      setExportFeedback(`✓ ¡Reporte de Cierre de Caja enviado/abierto en WhatsApp ${cleanPhone ? `al número ${cleanPhone}` : ''}!`);
      setTimeout(() => setExportFeedback(null), 6000);
    } catch (err: any) {
      alert(`Error al abrir WhatsApp: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-4">
            <div className="bg-fuchsia-500/10 p-3 rounded-2xl border border-fuchsia-500/20">
              <Calculator className="text-fuchsia-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Cierre de Jornada</h2>
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Balance de Caja en Tiempo Real</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X size={28} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          
          {/* Controls & Filters */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400 tracking-wider mb-1">
              <Filter size={14} className="text-fuchsia-400" />
              <span>Filtros del Cierre</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* User Filter Toggle */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">Operador:</label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold py-2 px-3 rounded-xl focus:border-fuchsia-500 outline-none cursor-pointer"
                >
                  <option value="my_sales">Mis ventas ({currentUser.username})</option>
                  <option value="all_sales">Todas las ventas (Todos los operadores)</option>
                </select>
              </div>

              {/* Date Filter Toggle */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">Rango de Fecha:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold py-2 px-3 rounded-xl focus:border-fuchsia-500 outline-none cursor-pointer"
                >
                  <option value="today">Ventas de Hoy ({new Date().toLocaleDateString()})</option>
                  <option value="all">Todas las fechas registradas</option>
                </select>
              </div>
            </div>

            {/* Smart Suggestion Banner if 0 sales filtered */}
            {filteredSales.length === 0 && allTodaySalesCount > 0 && userFilter === 'my_sales' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-3 text-amber-300 text-xs">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-bold">No tienes ventas filtradas bajo tu ID exclusivo hoy.</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Sin embargo, existen <strong>{allTodaySalesCount} ventas registradas hoy</strong> en el sistema. Puedes seleccionar &quot;Todas las ventas&quot; en el filtro de arriba para incluirlas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback message banner */}
          {exportFeedback && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold animate-fade-in">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <span>{exportFeedback}</span>
            </div>
          )}

          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <User size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Operador Activo</span>
              </div>
              <p className="text-white font-bold">{currentUser.username}</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Fecha Cierre</span>
              </div>
              <p className="text-white font-bold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Banknote size={22} />
                </div>
                <span className="font-bold text-zinc-300 text-sm">Total en Efectivo</span>
              </div>
              <span className="text-lg font-black text-emerald-400">{formatCurrency(totals.cashTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <CreditCard size={22} />
                </div>
                <span className="font-bold text-zinc-300 text-sm">Total Transfer / Tarjeta</span>
              </div>
              <span className="text-lg font-black text-violet-400">{formatCurrency(totals.transferTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-fuchsia-500/10 rounded-xl text-fuchsia-400 border border-fuchsia-500/20">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <span className="font-bold text-zinc-300 text-sm block">Productos y Operaciones</span>
                  <span className="text-xs text-zinc-500">{filteredSales.length} ventas en este periodo</span>
                </div>
              </div>
              <span className="text-lg font-black text-white">{totals.totalProducts} un.</span>
            </div>
          </div>

          {/* Grand Total Card */}
          <div className="bg-gradient-to-br from-fuchsia-600/20 via-zinc-900 to-violet-600/20 p-6 rounded-[2rem] border border-fuchsia-500/30 text-center relative overflow-hidden shadow-xl">
            <p className="text-fuchsia-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Total General Recaudado</p>
            <p className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{formatCurrency(totals.totalAmount)}</p>
          </div>

          {/* WhatsApp Share Card */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <MessageSquare size={16} />
                <span>Enviar Reporte por WhatsApp</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Formato listo con premisa y totales</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Número con código de país (Ej: +5491122334455)"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs py-2.5 pl-9 pr-3 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-lg hover:scale-[1.02]"
              >
                <Send size={15} />
                <span>Enviar a WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Collapsible Sales Breakdown */}
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
            <button
              type="button"
              onClick={() => setShowSalesList(!showSalesList)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
            >
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <ShoppingBag size={16} className="text-fuchsia-400" />
                Ver Detalle de Ventas Incluidas ({filteredSales.length})
              </span>
              {showSalesList ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
            </button>

            {showSalesList && (
              <div className="p-4 border-t border-zinc-800 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredSales.length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-4">No hay ventas registradas con los filtros seleccionados.</p>
                ) : (
                  filteredSales.map((s, idx) => (
                    <div key={s.id || idx} className="flex justify-between items-center text-xs p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{s.username || s.userName || 'Op'}</span>
                          <span className="text-[10px] text-zinc-500 font-normal">({parseSaleDate(s).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {(s.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-black text-emerald-400">{formatCurrency(s.total)}</span>
                        <span className="block text-[10px] text-zinc-500 uppercase">{s.paymentMethod}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-3">
          <button 
            onClick={handlePrintClosure}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] cursor-pointer text-sm"
          >
            <Printer size={20} />
            IMPRIMIR TICKET DE CIERRE
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleExportToCSV}
              className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold py-3.5 px-4 rounded-xl border border-emerald-500/25 transition-all active:scale-[0.98] cursor-pointer"
              title="Descargar archivo .CSV optimizado para abrir en Excel o Google Sheets"
            >
              <FileSpreadsheet size={18} />
              <span className="text-xs uppercase tracking-wider font-bold">Exportar Excel (.csv)</span>
            </button>
            <button 
              onClick={handleExportToWord}
              className="flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold py-3.5 px-4 rounded-xl border border-blue-500/25 transition-all active:scale-[0.98] cursor-pointer"
              title="Descargar reporte .DOC y abrir en pantalla"
            >
              <FileText size={18} />
              <span className="text-xs uppercase tracking-wider font-bold">Exportar Word / Vista</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            SISTEMA KIOSCO LAS CHICAS • CONTROL Y AUDITORÍA DE CAJA
          </p>
        </div>

      </div>
    </div>
  );
};

export default CashClosureModal;
