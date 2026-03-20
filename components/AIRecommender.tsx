
import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { getSmartRecommendations } from '../services/geminiService';
import { Product, AIRecommendation } from '../types';
import { PRODUCTS } from '../constants';

interface AIRecommenderProps {
  onAddToCart: (product: Product) => void;
}

const AIRecommender: React.FC<AIRecommenderProps> = ({ onAddToCart }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    const result = await getSmartRecommendations(input);
    setRecommendation(result);
    setLoading(false);
  };

  const recommendedProducts = recommendation 
    ? PRODUCTS.filter(p => recommendation.products.includes(p.id))
    : [];

  return (
    <div className="bg-gradient-to-br from-fuchsia-700 via-fuchsia-800 to-violet-900 rounded-3xl p-6 md:p-10 text-white shadow-2xl shadow-fuchsia-950/30 mb-12 border border-fuchsia-500/20">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/20">
          <Sparkles size={16} className="text-fuchsia-300" />
          <span className="text-white">Asistente de Antojos IA</span>
        </div>
        
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
          ¿No sabés qué elegir? <span className="text-fuchsia-300">Dejá que la IA decida.</span>
        </h2>
        <p className="text-fuchsia-100 text-lg opacity-90">
          Decime cómo te sentís o qué tenés ganas de picar y te armo el combo ideal.
        </p>

        <form onSubmit={handleAsk} className="relative mt-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: 'Quiero algo dulce pero fresco para la tarde'"
            className="w-full bg-black/30 border-2 border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white placeholder:text-white/40 focus:bg-black/50 focus:border-fuchsia-400/50 outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-fuchsia-700 p-2 rounded-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-black/20"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
          </button>
        </form>

        {recommendation && (
          <div className="mt-10 animate-fade-in text-left bg-black/30 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
            <p className="text-fuchsia-50 font-medium italic mb-6 leading-relaxed opacity-90">
              "{recommendation.reasoning}"
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedProducts.map((p) => (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-4 text-slate-100 group hover:border-fuchsia-500/30 hover:shadow-lg transition-all">
                  <img src={p.image} className="w-14 h-14 rounded-lg object-cover" alt={p.name} />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm line-clamp-1">{p.name}</h4>
                    <p className="text-violet-400 font-bold text-sm">${p.price}</p>
                  </div>
                  <button 
                    onClick={() => onAddToCart(p)}
                    className="p-2 bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white rounded-lg hover:from-fuchsia-500 hover:to-violet-500 transition-all border border-fuchsia-400/20"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommender;
