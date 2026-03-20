
import React from 'react';
import { X, Printer } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
}

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, items, total }) => {
  if (!isOpen) return null;

  const date = new Date().toLocaleDateString('es-AR');
  const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const handleNativePrint = () => {
    const windowPrint = window.open('', '', 'width=400,height=600');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Ticket Kiosco</title>
          <style>
            @page { 
              margin: 0; 
              size: 58mm auto; /* Forzar tamaño papel térmico */
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 5px; 
              width: 58mm; /* Ancho físico impresora */
              max-width: 58mm;
              color: #000;
              line-height: 1.2;
              background: #fff;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 8px; }
            .header h2 { margin: 0; font-size: 16px; font-weight: 900; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; width: 100%; display: block; }
            
            /* Estructura de Ítems Optimizada para 58mm */
            .item-container { margin-bottom: 6px; }
            .item-name { 
              display: block; 
              font-weight: bold; 
              text-transform: uppercase; 
              font-size: 11px;
              margin-bottom: 2px;
            }
            .item-data { 
              display: flex; 
              justify-content: space-between; 
              font-size: 12px;
            }
            
            .total-section { margin-top: 10px; font-size: 16px; }
            .footer { margin-top: 15px; font-size: 10px; text-transform: uppercase; }
            
            /* Utilidad para ocultar elementos si es necesario */
            @media screen {
               body { background: #eee; display: flex; justify-content: center; }
               .ticket { background: #fff; padding: 10px; box-shadow: 0 0 5px rgba(0,0,0,0.2); }
            }
          </style>
        </head>
        <body>
          <div class="header center">
            <h2>KIOSCO LAS CHICAS</h2>
            <div style="font-size: 10px; margin-top: 4px;">
              Dirección del Local 123<br>
              Tel: 11 7103-3622
            </div>
            <div style="font-size: 11px; margin-top: 6px;">
              ${date} - ${time}
            </div>
          </div>

          <span class="divider"></span>

          <div class="items">
            ${items.map(item => `
              <div class="item-container">
                <span class="item-name">${item.name}</span>
                <div class="item-data">
                  <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                  <span class="bold">${formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <span class="divider"></span>

          <div class="total-section">
            <div style="display: flex; justify-content: space-between; font-weight: 900;">
              <span>TOTAL</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
          
          <div class="center footer">
            <p style="margin:0">GRACIAS POR SU COMPRA</p>
            <p style="margin:5px 0 0 0; font-size: 9px;">NO VÁLIDO COMO FACTURA FISCAL</p>
          </div>

          <script>
            // Auto imprimir y cerrar
            window.onload = function() { 
                window.focus();
                window.print(); 
                // Pequeño delay para asegurar que el comando de impresión se envió
                setTimeout(function() { window.close(); }, 500); 
            }
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm flex flex-col items-center animate-fade-in">
        {/* Actions Header */}
        <div className="w-full flex justify-between items-center mb-4 px-2 max-w-[320px]">
            <h3 className="text-white font-bold uppercase tracking-widest text-sm">Vista Previa (58mm)</h3>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* The Paper Ticket (Visual Representation) */}
        <div className="w-[300px] bg-white text-black shadow-2xl relative overflow-hidden font-mono text-xs">
            {/* Ragged Top */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-zinc-900 z-10" style={{background: 'linear-gradient(135deg, transparent 75%, #18181b 75%) 0 0, linear-gradient(-135deg, transparent 75%, #18181b 75%) 0 0', backgroundSize: '20px 20px'}}></div>
            
            <div className="p-5 pt-8 pb-8">
                <div className="text-center mb-4">
                    <h2 className="font-black text-lg uppercase leading-none mb-2">Kiosco Las Chicas</h2>
                    <p className="text-[10px] text-gray-600">Dirección del Local 123</p>
                    <p className="text-[10px] text-gray-600">Tel: 11 7103-3622</p>
                    <p className="text-[10px] mt-2 font-bold">{date} - {time}</p>
                </div>

                <div className="border-b border-dashed border-black mb-3 opacity-50"></div>

                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                            {/* Nombre completo arriba */}
                            <span className="font-bold uppercase text-[11px] mb-0.5 leading-tight">
                                {item.name}
                            </span>
                            {/* Cálculos abajo: Cantidad x Precio ... Subtotal */}
                            <div className="flex justify-between text-[11px] text-gray-800">
                                <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-b border-dashed border-black mt-3 mb-3 opacity-50"></div>

                <div className="flex justify-between items-center text-xl font-black mt-2">
                    <span>TOTAL</span>
                    <span>{formatCurrency(total)}</span>
                </div>

                <div className="text-center mt-6">
                    <p className="font-bold text-[10px] uppercase">Gracias por su compra</p>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase">No válido como factura fiscal</p>
                </div>
            </div>

            {/* Ragged Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-zinc-900 z-10 transform rotate-180" style={{background: 'linear-gradient(135deg, transparent 75%, #18181b 75%) 0 0, linear-gradient(-135deg, transparent 75%, #18181b 75%) 0 0', backgroundSize: '20px 20px'}}></div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 w-full max-w-[300px]">
            <button 
                onClick={handleNativePrint}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
                <Printer size={22} />
                IMPRIMIR TICKET
            </button>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
