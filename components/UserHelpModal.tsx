import React, { useState } from 'react';
import { X, HelpCircle, ShoppingBag, Calculator, Keyboard, MessageCircle, Phone, Mail, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserHelpModal: React.FC<UserHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'closure' | 'shortcuts' | 'contact'>('sales');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-2xl border border-fuchsia-500/20">
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Centro de Ayuda y Guía Rápida</h3>
                <p className="text-xs text-zinc-400 font-medium">Instrucciones de uso y soporte del sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
              title="Cerrar ayuda"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-black/40 border-b border-zinc-800 p-2 gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'sales', label: 'Cerrar Venta', icon: ShoppingBag },
              { id: 'closure', label: 'Cierre de Caja', icon: Calculator },
              { id: 'shortcuts', label: 'Teclas / Atajos', icon: Keyboard },
              { id: 'contact', label: 'Soporte Técnico', icon: MessageCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-300">
            {/* TAB: CÓMO CERRAR UNA VENTA */}
            {activeTab === 'sales' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-base">
                  <ShoppingBag size={20} />
                  <h4>Pasos para realizar y completar una venta</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-bold text-white text-xs mb-1">Buscar o Escanear Productos</p>
                      <p className="text-xs text-zinc-400">Escaneá el código de barras o escribí el nombre en la caja de búsqueda superior. También podés tocar el producto directamente en la lista.</p>
                      <div className="mt-2 bg-black/50 p-2.5 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
                        💡 <span className="text-zinc-200 font-bold">Venta por cantidad:</span> Escribí <span className="text-fuchsia-400 font-bold">3*77900704...</span> para agregar 3 unidades de un producto en un solo paso.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-bold text-white text-xs mb-1">Iniciar el Cobro</p>
                      <p className="text-xs text-zinc-400">Presioná el botón <span className="text-emerald-400 font-bold">"COBRAR"</span> en la barra inferior (o presioná la tecla <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-white">[F4]</span> / <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-white">[F9]</span>).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="font-bold text-white text-xs mb-1">Seleccionar Medio de Pago y Vuelto</p>
                      <p className="text-xs text-zinc-400">Elegí entre <span className="text-emerald-400 font-bold">Efectivo</span> o <span className="text-cyan-400 font-bold">Transferencia / MercadoPago</span>. En efectivo podés ingresar el monto entregado por el cliente o tocar los botones de billetes rápidos ($1.000, $2.000, $5.000, $10.000) para calcular el vuelto exacto automáticamente.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-black text-xs flex items-center justify-center shrink-0">4</span>
                    <div>
                      <p className="font-bold text-white text-xs mb-1">Finalizar Venta e Imprimir Ticket</p>
                      <p className="text-xs text-zinc-400">Al hacer clic en "FINALIZAR VENTA", la transacción se guardará en la base de datos y se descontará el stock de los productos. Podrás imprimir el comprobante o iniciar una nueva venta de inmediato.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CIERRE DE CAJA */}
            {activeTab === 'closure' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <Calculator size={20} />
                  <h4>Procedimiento para el Cierre de Caja</h4>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-300 leading-relaxed">
                  El Cierre de Caja permite hacer un balance al finalizar el turno o la jornada de trabajo, agrupando la recaudación en efectivo y medios digitales.
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Apertura del Modal de Cierre</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Hacé clic en el botón animado <span className="text-red-400 font-bold">"CIERRE DE CAJA"</span> ubicado en el encabezado (al lado del saludo) o presioná <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-white">[F9]</span>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Revisión de Totales Recaudados</p>
                      <p className="text-xs text-zinc-400 mt-0.5">El sistema desglosará las ventas del turno en: <span className="text-emerald-400 font-bold">Total Efectivo</span>, <span className="text-cyan-400 font-bold">Total Transferencias</span>, la cantidad de tickets emitidos y los productos vendidos.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Impresión de Reporte de Cierre</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Podés imprimir el resumen físico para entregarlo al administrador o archivarlo en el negocio haciendo clic en <span className="text-white font-bold">"Imprimir Ticket de Cierre"</span>.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ATAJOS DE TECLADO (PC) */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                  <Keyboard size={20} />
                  <h4>Atajos de Teclado y Operación Rápida (PC)</h4>
                </div>

                <p className="text-xs text-zinc-400">Optimizá la velocidad de cobro utilizando las siguientes teclas directas en cualquier computadora:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">Ir a la Búsqueda</span>
                    <span className="font-mono bg-zinc-800 border border-zinc-700 text-fuchsia-400 px-2.5 py-1 rounded-lg text-xs font-bold">[F2] o [Ctrl+K]</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">Abrir pantalla Cobrar</span>
                    <span className="font-mono bg-zinc-800 border border-zinc-700 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold">[F4] / [F9]</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">Lector Escáner de Barras</span>
                    <span className="font-mono bg-zinc-800 border border-zinc-700 text-cyan-400 px-2.5 py-1 rounded-lg text-xs font-bold">[F8]</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">Abrir / Ocultar Carrito</span>
                    <span className="font-mono bg-zinc-800 border border-zinc-700 text-amber-400 px-2.5 py-1 rounded-lg text-xs font-bold">[F3]</span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between sm:col-span-2">
                    <span className="text-xs text-zinc-300 font-medium">Cerrar ventanas o Limpiar Búsqueda</span>
                    <span className="font-mono bg-zinc-800 border border-zinc-700 text-red-400 px-2.5 py-1 rounded-lg text-xs font-bold">[Escape]</span>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    Teclado en Pantalla (Dispositivos Táctiles / Tablets):
                  </p>
                  <p>Hacé clic en el botón <span className="text-fuchsia-400 font-bold">"Abrir Teclado Táctil"</span> debajo del buscador para desplegar el teclado en pantallas táctiles sin teclado físico.</p>
                </div>
              </div>
            )}

            {/* TAB: SOPORTE TÉCNICO */}
            {activeTab === 'contact' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                  <MessageCircle size={20} />
                  <h4>Soporte Técnico y Contacto Directo</h4>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Desarrollador del Sistema</p>
                      <p className="text-base font-black text-white">Kedzierski Pablo Andrés</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="https://wa.me/5491171033622"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 rounded-xl transition-all group"
                    >
                      <Phone size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">WhatsApp / Teléfono</p>
                        <p className="text-xs font-bold text-white">11 7103-3622</p>
                      </div>
                    </a>

                    <a
                      href="mailto:pablokedzierski@gmail.com"
                      className="flex items-center gap-3 p-3.5 bg-blue-950/40 border border-blue-800/60 hover:bg-blue-900/40 rounded-xl transition-all group"
                    >
                      <Mail size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase">Correo Electrónico</p>
                        <p className="text-xs font-bold text-white truncate">pablokedzierski@gmail.com</p>
                      </div>
                    </a>
                  </div>

                  <div className="pt-2 text-center sm:text-left text-xs text-zinc-500 font-medium">
                    🕒 <span className="text-zinc-400 font-bold">Horario de atención:</span> Lunes a Viernes de 9:00 hs a 18:00 hs
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default UserHelpModal;
