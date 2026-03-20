
import React, { useState } from 'react';
import { X, Smartphone, CreditCard, Banknote, CheckCircle2, Wifi, Zap } from 'lucide-react';

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
  onComplete: (monto: number, metodo: string) => void;
}

const ServiceRechargeModal: React.FC<ServiceRechargeModalProps> = ({ isOpen, onClose, service, onComplete }) => {
  const [step, setStep] = useState<'data' | 'payment'>('data');
  const [formData, setFormData] = useState({ number: '', amount: '' });
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  if (!isOpen || !service) return null;

  const handleSubmitData = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleFinalize = () => {
    onComplete(parseFloat(formData.amount), paymentMethod);
    setStep('data');
    setFormData({ number: '', amount: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
        <div className={`h-2 w-full ${service.color}`} />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 shadow-lg bg-white">
                {service.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Recarga {service.name}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Servicio Digital Instantáneo</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 text-zinc-500 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {step === 'data' ? (
            <form onSubmit={handleSubmitData} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">
                  {service.type === 'tel' ? 'Número de Línea (sin 0 ni 15)' : 'Número de Tarjeta SUBE'}
                </label>
                <input 
                  required
                  type="number"
                  placeholder={service.placeholder}
                  className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-white text-xl font-bold outline-none focus:border-fuchsia-500/50 transition-all"
                  value={formData.number}
                  onChange={e => setFormData({...formData, number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Monto a Recargar</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-xl">$</span>
                  <input 
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 p-5 pl-10 rounded-2xl text-white text-3xl font-black outline-none focus:border-fuchsia-500/50 transition-all"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest ${service.color}`}
              >
                Continuar al Pago
              </button>
            </form>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6 text-center">
                <div>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Destino ({service.name})</p>
                   <p className="text-white font-black text-4xl tracking-tight break-all leading-none">{formData.number}</p>
                </div>
                
                <div className="w-full h-px bg-zinc-800" />

                <div>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Monto Total</p>
                   <p className="text-6xl font-black text-white tracking-tighter">${parseFloat(formData.amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center block">Seleccionar Medio de Pago</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'efectivo' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                  >
                    <Banknote size={24} />
                    <span className="text-[10px] font-black uppercase">Efectivo</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'transferencia' ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                  >
                    <CreditCard size={24} />
                    <span className="text-[10px] font-black uppercase">Transferencia</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('data')}
                  className="flex-1 bg-zinc-800 text-zinc-400 font-black py-5 rounded-2xl hover:text-white transition-all"
                >
                  VOLVER
                </button>
                <button 
                  onClick={handleFinalize}
                  className="flex-[2] bg-white text-black font-black py-5 rounded-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  CONFIRMAR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceRechargeModal;
