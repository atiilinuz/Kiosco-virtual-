import React, { useState } from 'react';
import { X, Smartphone, CreditCard, Banknote, CheckCircle2, Zap, ArrowLeft, ShieldCheck, Sparkles, Printer, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../utils';

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  type: 'tel' | 'sube';
}

interface ServiceRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onComplete: (monto: number, metodo: string, destinationNumber?: string) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 3000, 5000, 10000];

const ServiceRechargeModal: React.FC<ServiceRechargeModalProps> = ({ isOpen, onClose, service, onComplete }) => {
  const [step, setStep] = useState<'data' | 'payment' | 'success'>('data');
  const [formData, setFormData] = useState({ number: '', amount: '' });
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionTime, setTransactionTime] = useState<string>('');

  if (!isOpen || !service) return null;

  const numericAmount = parseFloat(formData.amount) || 0;
  const parsedPaidAmount = parseFloat(paidAmount) || 0;
  const change = parsedPaidAmount > numericAmount ? parsedPaidAmount - numericAmount : 0;

  const handleSubmitData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number.trim() || numericAmount <= 0) return;
    setStep('payment');
    setPaidAmount('');
  };

  const handleFinalize = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-AR') + ' - ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      setTransactionTime(dateStr);

      await onComplete(numericAmount, paymentMethod, formData.number);
      setStep('success');
    } catch (error) {
      console.error("Error al procesar recarga:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintTicket = () => {
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

    const date = new Date().toLocaleDateString('es-AR');
    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Ticket Recarga ${service.name}</title>
          <style>
            @page { 
              margin: 0; 
              size: 58mm auto;
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 5px; 
              width: 58mm; 
              max-width: 58mm;
              color: #000;
              line-height: 1.2;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 8px; }
            .header h2 { margin: 0; font-size: 15px; font-weight: 900; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; width: 100%; display: block; }
            .footer { margin-top: 15px; font-size: 10px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header center">
            <h2>KIOSCO LAS CHICAS</h2>
            <div style="font-size: 10px; margin-top: 4px;">
              Tel: 11 7103-3622
            </div>
            <div style="font-size: 11px; margin-top: 6px;">
              ${date} - ${time}
            </div>
          </div>

          <span class="divider"></span>

          <div class="center" style="margin: 8px 0;">
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">COMPROBANTE DE RECARGA</div>
            <div style="font-size: 13px; font-weight: 900; margin-top: 2px;">RECARGA ${service.name.toUpperCase()}</div>
          </div>

          <span class="divider"></span>

          <div style="margin: 6px 0;">
            <div style="font-size: 10px; text-transform: uppercase;">DESTINO / NÚMERO:</div>
            <div style="font-size: 14px; font-weight: 900; word-break: break-all; margin-top: 2px;">
              ${formData.number}
            </div>
          </div>

          <div style="margin: 6px 0; display: flex; justify-content: space-between;">
            <span>MEDIO DE PAGO:</span>
            <span class="bold" style="text-transform: uppercase;">${paymentMethod}</span>
          </div>

          ${paymentMethod === 'efectivo' && parsedPaidAmount > 0 ? `
            <div style="margin: 4px 0; display: flex; justify-content: space-between; font-size: 11px;">
              <span>ABONA CON:</span>
              <span>${formatCurrency(parsedPaidAmount)}</span>
            </div>
            <div style="margin: 4px 0; display: flex; justify-content: space-between; font-size: 11px;">
              <span>VUELTO:</span>
              <span>${formatCurrency(change)}</span>
            </div>
          ` : ''}

          <span class="divider"></span>

          <div style="margin-top: 8px; font-size: 15px;">
            <div style="display: flex; justify-content: space-between; font-weight: 900;">
              <span>TOTAL RECARGADO</span>
              <span>${formatCurrency(numericAmount)}</span>
            </div>
          </div>
          
          <div class="center footer">
            <p style="margin:0; font-weight: bold;">TRANSACCIÓN EXITOSA</p>
            <p style="margin:5px 0 0 0; font-size: 9px;">NO VÁLIDO COMO FACTURA FISCAL</p>
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

  const handleResetAndClose = () => {
    setStep('data');
    setFormData({ number: '', amount: '' });
    setPaidAmount('');
    setTransactionTime('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Service Color Top Bar */}
          <div className={`h-2.5 w-full ${service.color}`} />

          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/60">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2.5 shadow-xl bg-white border border-zinc-200 shrink-0">
                {service.icon}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Recarga {service.name}
                </h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  <Zap size={12} className="text-amber-400" />
                  Servicio Digital Instantáneo
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-2.5 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {step === 'data' && (
              <form onSubmit={handleSubmitData} className="space-y-6 animate-fade-in">
                {/* Destination Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 flex items-center justify-between">
                    <span>{service.type === 'tel' ? 'Número de Línea (sin 0 ni 15)' : 'Número de Tarjeta SUBE'}</span>
                    <span className="text-cyan-400 font-mono font-bold">Requerido</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      placeholder={service.placeholder}
                      className="w-full bg-black/80 border-2 border-zinc-800 focus:border-cyan-500 p-4 sm:p-5 rounded-2xl text-cyan-300 text-xl sm:text-2xl font-mono font-black tracking-widest outline-none transition-all shadow-inner placeholder:text-zinc-700"
                      value={formData.number}
                      onChange={e => setFormData({ ...formData, number: e.target.value })}
                    />
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                    Monto a Recargar
                  </label>

                  {/* Preset Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: preset.toString() })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formData.amount === preset.toString()
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                            : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        ${preset.toLocaleString('es-AR')}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-2xl">$</span>
                    <input
                      required
                      type="number"
                      min="100"
                      placeholder="0.00"
                      className="w-full bg-black/80 border-2 border-zinc-800 focus:border-fuchsia-500 p-4 pl-12 rounded-2xl text-white text-3xl sm:text-4xl font-black outline-none transition-all shadow-inner placeholder:text-zinc-800"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!formData.number.trim() || numericAmount <= 0}
                  className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${service.color}`}
                >
                  <span>Continuar al Pago</span>
                  <Zap size={20} className="fill-current" />
                </button>
              </form>
            )}

            {step === 'payment' && (
              <div className="space-y-6 animate-fade-in">
                {/* DESTINO CON TIPOGRAFÍA GIGANTE Y DESTACADA */}
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-4 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck size={80} className="text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5">
                      <Sparkles size={12} className="text-cyan-400" />
                      Destino de la Carga ({service.name})
                    </p>
                    <div className="bg-black/90 p-4 rounded-2xl border border-cyan-500/30 shadow-inner">
                      <p className="text-3xl sm:text-5xl font-mono font-black text-cyan-400 tracking-wider break-all leading-tight">
                        {formData.number}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-zinc-800/80" />

                  {/* TOTAL CARD CON HIGHLIGHT */}
                  <div className="bg-gradient-to-br from-fuchsia-600/20 to-violet-600/20 p-5 rounded-2xl border border-fuchsia-500/30 text-center">
                    <p className="text-fuchsia-300 text-xs font-black uppercase tracking-[0.2em] mb-1">Monto Total de Recarga</p>
                    <p className="text-4xl sm:text-5xl font-black text-white drop-shadow-md">
                      {formatCurrency(numericAmount)}
                    </p>
                  </div>
                </div>

                {/* MEDIO DE PAGO */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block text-center">
                    Seleccionar Medio de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'efectivo'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Banknote size={26} />
                      <span className="text-xs font-black uppercase tracking-wider">Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'transferencia'
                          ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.15)] font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      <CreditCard size={26} />
                      <span className="text-xs font-black uppercase tracking-wider">Transferencia</span>
                    </button>
                  </div>
                </div>

                {/* EFECTIVO: MONTO ABONADO Y VUELTO */}
                {paymentMethod === 'efectivo' && (
                  <div className="space-y-4 p-5 bg-zinc-950 border border-zinc-800 rounded-3xl animate-fade-in shadow-xl">
                    <label className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                      Abona con
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-2xl">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="Ej. 2000"
                        className="w-full bg-black border-2 border-zinc-700/60 rounded-2xl py-3.5 pl-12 pr-4 text-white font-black outline-none focus:border-cyan-500 text-3xl sm:text-4xl transition-all"
                      />
                    </div>

                    {/* Botones de billetes para cálculo rápido */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Monto rápido:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPaidAmount(numericAmount.toString())}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 text-xs font-bold rounded-lg transition-colors border border-zinc-700 cursor-pointer"
                        >
                          Exacto ({formatCurrency(numericAmount)})
                        </button>
                        {[1000, 2000, 5000, 10000, 20000].map((denomination) => (
                          <button
                            key={denomination}
                            type="button"
                            onClick={() => setPaidAmount(denomination.toString())}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                              denomination >= numericAmount
                                ? 'bg-zinc-800 hover:bg-cyan-600 hover:text-white text-cyan-400 border-zinc-700'
                                : 'bg-zinc-900 text-zinc-600 border-zinc-800 opacity-50'
                            }`}
                          >
                            ${denomination.toLocaleString('es-AR')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {parsedPaidAmount > 0 && (
                      <div className="flex flex-col items-center pt-4 border-t border-zinc-800 mt-4 gap-1.5 bg-black/60 rounded-2xl p-4">
                        <span className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Vuelto a entregar</span>
                        <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${change > 0 ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-zinc-500'}`}>
                          {formatCurrency(change)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ACCIONES FINALIZAR */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('data')}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>Volver</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isProcessing}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                  >
                    <CheckCircle2 size={20} />
                    <span>{isProcessing ? 'Procesando...' : 'Confirmar Recarga'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS & TICKET OPTION */}
            {step === 'success' && (
              <div className="space-y-6 animate-fade-in text-center py-2">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
                    <CheckCircle2 size={52} />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      ¡Recarga Confirmada!
                    </h3>
                    <p className="text-xs text-zinc-400 font-bold mt-1">
                      {transactionTime}
                    </p>
                  </div>
                </div>

                {/* RESUMEN DE LA VENTA / RECARGA */}
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-2xl text-left">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">
                      Destino de Carga ({service.name})
                    </span>
                    <div className="bg-black p-3.5 rounded-2xl border border-cyan-500/40">
                      <p className="text-2xl sm:text-4xl font-mono font-black text-cyan-400 tracking-wider text-center break-all">
                        {formData.number}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Monto Total</span>
                      <span className="text-xl sm:text-2xl font-black text-white">{formatCurrency(numericAmount)}</span>
                    </div>

                    <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Medio de Pago</span>
                      <span className="text-sm font-black text-emerald-400 uppercase">{paymentMethod}</span>
                    </div>
                  </div>

                  {paymentMethod === 'efectivo' && parsedPaidAmount > 0 && (
                    <div className="flex justify-between items-center bg-black/60 p-3.5 rounded-2xl border border-zinc-800/80 text-xs">
                      <div>
                        <span className="text-zinc-500 font-bold">Abonó con: </span>
                        <span className="text-white font-bold">{formatCurrency(parsedPaidAmount)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-bold">Vuelto: </span>
                        <span className="text-cyan-400 font-black text-sm">{formatCurrency(change)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCIONES: IMPRIMIR TICKET O NUEVA RECARGA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrintTicket}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 px-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider text-sm"
                  >
                    <Printer size={20} />
                    <span>Imprimir Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 px-5 rounded-2xl border border-zinc-700 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-sm"
                  >
                    <RotateCcw size={18} />
                    <span>Finalizar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ServiceRechargeModal;
