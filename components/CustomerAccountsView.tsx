import React, { useState } from 'react';
import { UserCheck, Plus, Search, DollarSign, Phone, Send, History, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { CustomerAccount, CustomerTransaction } from '../types';
import { formatCurrency } from '../utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, dbService } from '../db';

export const CustomerAccountsView: React.FC = () => {
  const customers = useLiveQuery(() => db.customers.toArray()) ?? [];
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Forms
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Transaction Modal / State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'payment' | 'debt'>('payment');
  const [paymentDesc, setPaymentDesc] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const totalDebtAll = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCust: CustomerAccount = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      balance: 0,
      createdAt: new Date().toISOString(),
      transactions: []
    };

    await dbService.addCustomer(newCust);
    setName('');
    setPhone('');
    setAddress('');
    setShowAddCustomer(false);
  };

  const handleRegisterTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Ingrese un monto válido.');
      return;
    }

    const tx: CustomerTransaction = {
      id: `tx-${Date.now()}`,
      customerId: selectedCustomerId,
      type: paymentType,
      amount: amountNum,
      description: paymentDesc.trim() || (paymentType === 'payment' ? 'Entrega de Dinero / Pago' : 'Cargo Manual'),
      timestamp: new Date().toISOString()
    };

    await dbService.addCustomerTransaction(selectedCustomerId, tx);
    setPaymentAmount('');
    setPaymentDesc('');
    setShowPaymentModal(false);
  };

  const handleSendWhatsAppReminder = (customer: CustomerAccount) => {
    if (!customer.phone) {
      alert('Este cliente no tiene un teléfono registrado.');
      return;
    }

    const rawClean = customer.phone.replace(/[^0-9]/g, '');
    let targetPhone = rawClean;
    if (targetPhone.startsWith('0')) targetPhone = targetPhone.substring(1);
    if (!targetPhone.startsWith('54')) targetPhone = '54' + targetPhone;

    let msg = `Hola *${customer.name}*, te saludamos desde *Kiosco Las Chicas*. 👋\n\n`;
    msg += `Te compartimos el saldo actualizado de tu Cuenta Corriente:\n`;
    msg += `💰 *Saldo Pendiente:* ${formatCurrency(customer.balance)}\n\n`;
    msg += `¡Muchas gracias por elegirnos! 😊`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <UserCheck size={28} />
            </div>
            Gestión de Cuentas Corrientes (Fiados)
          </h1>
          <p className="text-zinc-400 mt-1">Lleve el registro exacto de clientes, fiados, cobros y entregas</p>
        </div>

        <button
          onClick={() => setShowAddCustomer(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-5 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-all text-sm"
        >
          <Plus size={18} /> Nuevo Cliente Fiado
        </button>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block mb-1">Total Clientes</span>
          <span className="text-3xl font-black text-white">{customers.length}</span>
        </div>
        <div className="bg-zinc-900 border border-indigo-500/30 bg-indigo-950/10 p-5 rounded-2xl">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-1">Total Deuda Acumulada</span>
          <span className="text-3xl font-black text-indigo-400">{formatCurrency(totalDebtAll)}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block mb-1">Clientes con Deuda</span>
          <span className="text-3xl font-black text-amber-400">{customers.filter(c => c.balance > 0).length}</span>
        </div>
      </div>

      {/* Main Grid: List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(cust => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedCustomerId === cust.id
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg'
                      : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-white text-sm">{cust.name}</h4>
                      {cust.phone && <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5"><Phone size={12} /> {cust.phone}</p>}
                    </div>
                    <span className={`font-black text-sm ${cust.balance > 0 ? 'text-indigo-400' : 'text-zinc-500'}`}>
                      {formatCurrency(cust.balance)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-8">No hay clientes registrados.</p>
            )}
          </div>
        </div>

        {/* Customer Detail */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6">
          {selectedCustomer ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                    {selectedCustomer.phone && <span>Tel: {selectedCustomer.phone}</span>}
                    {selectedCustomer.address && <span>Dir: {selectedCustomer.address}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCustomer.phone && (
                    <button
                      onClick={() => handleSendWhatsAppReminder(selectedCustomer)}
                      className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Send size={14} /> Recordatorio WhatsApp
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPaymentType('payment');
                      setShowPaymentModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition-all"
                  >
                    Registrar Pago / Cargo
                  </button>
                </div>
              </div>

              {/* Balance Box */}
              <div className="bg-black border border-indigo-500/30 p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block">Saldo Pendiente de Pago</span>
                  <span className="text-3xl font-black text-indigo-400">{formatCurrency(selectedCustomer.balance)}</span>
                </div>
                <button
                  onClick={() => dbService.deleteCustomer(selectedCustomer.id)}
                  className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                  title="Eliminar Cliente"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Transaction History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={16} /> Historial de Movimientos
                </h4>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 ? (
                    [...selectedCustomer.transactions].reverse().map(tx => (
                      <div key={tx.id} className="p-3.5 bg-black/50 border border-zinc-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white block">{tx.description}</span>
                          <span className="text-[10px] text-zinc-500">{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-sm ${tx.type === 'payment' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            {tx.type === 'payment' ? `- ${formatCurrency(tx.amount)}` : `+ ${formatCurrency(tx.amount)}`}
                          </span>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                            {tx.type === 'payment' ? 'Pago' : 'Fiado'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-600 italic py-4 text-center">Sin movimientos registrados aún.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-600 space-y-2">
              <UserCheck size={48} className="mx-auto text-zinc-800" />
              <p className="font-bold">Seleccione un cliente para ver su detalle y gestionar su saldo</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold text-white">Nuevo Cliente Fiado</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre y Apellido *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Teléfono (Ej. 1171033622)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Dirección (Opcional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCustomer(false)} className="flex-1 py-3 text-xs text-zinc-400 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment / Debt Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold text-white">Registrar Movimiento en Cta Cte</h3>
            <p className="text-xs text-zinc-400">Cliente: <strong className="text-white">{selectedCustomer.name}</strong></p>

            <form onSubmit={handleRegisterTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('payment')}
                  className={`p-3 rounded-xl text-xs font-bold border ${paymentType === 'payment' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black text-zinc-500 border-zinc-800'}`}
                >
                  Registrar Pago (Entrega)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('debt')}
                  className={`p-3 rounded-xl text-xs font-bold border ${paymentType === 'debt' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black text-zinc-500 border-zinc-800'}`}
                >
                  Agregar Deuda (Cargo)
                </button>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-lg font-black text-white outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Concepto / Nota (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Pago parcial en efectivo"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 text-xs text-zinc-400 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
