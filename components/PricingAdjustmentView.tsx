import React, { useState } from 'react';
import { DollarSign, Percent, TrendingUp, CheckCircle2, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import { formatCurrency } from '../utils';

interface PricingAdjustmentViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

export const PricingAdjustmentView: React.FC<PricingAdjustmentViewProps> = ({ products, onUpdateProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adjustmentType, setAdjustmentType] = useState<'percent' | 'fixed'>('percent');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [roundToHundreds, setRoundToHundreds] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const valueNum = parseFloat(adjustmentValue) || 0;

  // Filtrar productos afectados
  const targetProducts = products.filter(p => selectedCategory === 'all' || p.category === selectedCategory);

  const calculateNewPrice = (currentPrice: number) => {
    let change = 0;
    if (adjustmentType === 'percent') {
      change = currentPrice * (valueNum / 100);
    } else {
      change = valueNum;
    }

    let newP = adjustmentDirection === 'increase' ? currentPrice + change : currentPrice - change;
    newP = Math.max(0, newP);

    if (roundToHundreds) {
      // Redondear al múltiplo de $10 o $50 más cercano para precios de kiosco sin monedas pequeñas
      newP = Math.round(newP / 10) * 10;
    }

    return newP;
  };

  const handleApplyAdjustment = async () => {
    if (valueNum <= 0) {
      alert('Ingrese un porcentaje o valor mayor a 0.');
      return;
    }

    if (!confirm(`¿Está seguro de aplicar este ajuste a los ${targetProducts.length} productos seleccionados? Esta acción actualizará los precios en la base de datos.`)) {
      return;
    }

    setIsApplying(true);
    let count = 0;

    try {
      for (const prod of targetProducts) {
        const updatedPrice = calculateNewPrice(prod.price);
        if (updatedPrice !== prod.price) {
          await onUpdateProduct({
            ...prod,
            price: updatedPrice,
            updatedAt: new Date().toISOString()
          });
          count++;
        }
      }

      setFeedback(`✓ ¡Ajuste de precios aplicado con éxito a ${count} productos!`);
      setAdjustmentValue('');
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      alert(`Error al actualizar precios: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <DollarSign size={28} />
          </div>
          Aumento / Ajuste Masivo de Precios
        </h1>
        <p className="text-zinc-400 mt-1">Actualice de forma ágil los precios de su catálogo por porcentaje o monto fijo</p>
      </div>

      {/* Control Card */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Categoría */}
          <div>
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Categoría a Modificar</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500 font-bold"
            >
              <option value="all">Todas las Categorías ({products.length} productos)</option>
              {CATEGORIES.map(cat => {
                const count = products.filter(p => p.category === cat.id).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({count} productos)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tipo de Ajuste */}
          <div>
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Tipo de Variación</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('percent')}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  adjustmentType === 'percent'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg'
                    : 'bg-black border-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                <Percent size={16} /> Porcentaje (%)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('fixed')}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  adjustmentType === 'fixed'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg'
                    : 'bg-black border-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                <DollarSign size={16} /> Monto Fijo ($)
              </button>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Dirección del Cambio</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentDirection('increase')}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustmentDirection === 'increase'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                    : 'bg-black border-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                <ArrowUpRight size={16} /> Aumento
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentDirection('decrease')}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustmentDirection === 'decrease'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg'
                    : 'bg-black border-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                <ArrowDownRight size={16} /> Descuento
              </button>
            </div>
          </div>
        </div>

        {/* Value Input and Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
          <div>
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">
              {adjustmentType === 'percent' ? 'Porcentaje a Aplicar (%)' : 'Monto Fijo a Sumar/Restar ($)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                placeholder={adjustmentType === 'percent' ? 'Ej. 10 (para +10%)' : 'Ej. 50 (para +$50)'}
                className="w-full bg-black border-2 border-zinc-700 rounded-xl p-3.5 pl-10 text-white font-black text-xl outline-none focus:border-emerald-500"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                {adjustmentType === 'percent' ? '%' : '$'}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-3 p-3.5 bg-black border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
              <input
                type="checkbox"
                checked={roundToHundreds}
                onChange={(e) => setRoundToHundreds(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-500 bg-zinc-900 border-zinc-700"
              />
              <div>
                <span className="text-xs font-bold text-white block">Redondear a múltiplos de $10</span>
                <span className="text-[10px] text-zinc-500 block">Evita vueltos con monedas de poco valor en el kiosco</span>
              </div>
            </label>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm rounded-2xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={18} /> {feedback}
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={handleApplyAdjustment}
          disabled={isApplying || valueNum <= 0}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-950/40 border border-emerald-400/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 text-base"
        >
          {isApplying ? (
            <>
              <RefreshCw className="animate-spin" size={20} /> Actualizando precios...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} /> APLICAR CAMBIO A {targetProducts.length} PRODUCTOS
            </>
          )}
        </button>
      </div>

      {/* Preview Table */}
      {valueNum > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-4">
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            Vista Previa de Nuevos Precios ({targetProducts.length} Ítems)
          </h3>

          <div className="overflow-x-auto max-h-96 rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-500 font-black uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio Actual</th>
                  <th className="p-3">Nuevo Precio</th>
                  <th className="p-3">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
                {targetProducts.map(p => {
                  const np = calculateNewPrice(p.price);
                  const diff = np - p.price;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/40">
                      <td className="p-3 font-bold text-white">{p.name}</td>
                      <td className="p-3 text-zinc-400 uppercase text-[10px]">{p.category}</td>
                      <td className="p-3 text-zinc-400 font-mono">{formatCurrency(p.price)}</td>
                      <td className="p-3 text-emerald-400 font-mono font-black">{formatCurrency(np)}</td>
                      <td className={`p-3 font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
