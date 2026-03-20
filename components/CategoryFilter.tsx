
import React from 'react';
import { CATEGORIES } from '../constants';

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar px-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`
            whitespace-nowrap px-8 py-4 rounded-full flex items-center gap-3 text-lg font-bold transition-all border shadow-md active:scale-95
            ${activeCategory === cat.id 
              ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white border-fuchsia-400 shadow-fuchsia-500/40 scale-105' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-fuchsia-500/50 hover:text-fuchsia-400 hover:bg-zinc-800'}
          `}
        >
          <span className="text-3xl drop-shadow-md">{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
