
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Store, Zap, Scan, Maximize, Minimize, CloudOff, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenPOS: () => void;
  onOpenScanner: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  isSyncing?: boolean;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onOpenCart, onOpenPOS, onOpenScanner, searchTerm, onSearchChange, isOnline = true, pendingSyncCount = 0, isSyncing = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3 md:gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 text-fuchsia-500 font-bold text-xl md:text-2xl cursor-pointer shrink-0">
          <div className="bg-gradient-to-br from-fuchsia-600 to-violet-600 p-1.5 rounded-lg text-white">
            <Store size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="hidden sm:inline">Kiosco<span className="text-violet-400">Digital</span></span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-fuchsia-500/50 transition-all outline-none text-zinc-200 placeholder:text-zinc-600 md:pl-10 md:text-base md:placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Sync Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800/50 bg-zinc-900/50 transition-all">
          {!isOnline ? (
            <>
              <CloudOff size={16} className="text-red-400" />
              <span className="text-xs font-medium text-red-400">
                Offline {pendingSyncCount > 0 && `(${pendingSyncCount} pendientes)`}
              </span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw size={16} className="text-blue-400 animate-spin" />
              <span className="text-xs font-medium text-blue-400">Sincronizando...</span>
            </>
          ) : (
            <>
              <Cloud size={16} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">En línea</span>
            </>
          )}
        </div>

        {/* Buttons Group */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Fullscreen Toggle (New) */}
          <button 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all hidden sm:block"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          {/* Action Buttons Container - Visible only on Desktop (LG+) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Scanner Button - Se mantiene porque no está en la barra inferior */}
            <button 
              onClick={onOpenScanner}
              title="Escanear Código"
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-full transition-all flex items-center gap-2 group"
            >
              <Scan size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Scanner</span>
            </button>

            {/* POS y Cart se han movido a la barra inferior persistente para unificar UX */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
