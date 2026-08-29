import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Check, Sparkles, Palette, RotateCcw, 
  Eye, CheckCircle2, Sliders, Smartphone, Laptop, Zap, Info 
} from 'lucide-react';
import { 
  ThemeMode, ThemePalette, DARK_PALETTES, LIGHT_PALETTES, 
  getStoredTheme, applyTheme 
} from '../theme';

interface ThemeSelectorProps {
  onThemeChanged?: (mode: ThemeMode, paletteId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeChanged }) => {
  const [currentMode, setCurrentMode] = useState<ThemeMode>('dark');
  const [currentPaletteId, setCurrentPaletteId] = useState<string>('dark_classic');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const { mode, paletteId } = getStoredTheme();
    setCurrentMode(mode);
    setCurrentPaletteId(paletteId);
  }, []);

  const handleModeChange = (mode: ThemeMode) => {
    setCurrentMode(mode);
    // Find default or first palette for that mode
    const palettes = mode === 'dark' ? DARK_PALETTES : LIGHT_PALETTES;
    const defaultPal = palettes.find(p => p.isDefault) || palettes[0];
    setCurrentPaletteId(defaultPal.id);
    applyTheme(mode, defaultPal.id);
    
    setFeedback(`Modo ${mode === 'dark' ? 'Oscuro' : 'Claro'} activado (${defaultPal.name})`);
    setTimeout(() => setFeedback(null), 3000);
    
    if (onThemeChanged) {
      onThemeChanged(mode, defaultPal.id);
    }
  };

  const handlePaletteSelect = (palette: ThemePalette) => {
    setCurrentMode(palette.mode);
    setCurrentPaletteId(palette.id);
    applyTheme(palette.mode, palette.id);
    
    setFeedback(`✓ Tema aplicado: ${palette.name}`);
    setTimeout(() => setFeedback(null), 3000);

    if (onThemeChanged) {
      onThemeChanged(palette.mode, palette.id);
    }
  };

  const handleResetToDefault = () => {
    const defaultPalette = DARK_PALETTES[0]; // Kiosco Clásico
    setCurrentMode('dark');
    setCurrentPaletteId(defaultPalette.id);
    applyTheme('dark', defaultPalette.id);
    
    setFeedback('✓ Restablecido al Kiosco Clásico original');
    setTimeout(() => setFeedback(null), 3000);

    if (onThemeChanged) {
      onThemeChanged('dark', defaultPalette.id);
    }
  };

  const activePalettes = currentMode === 'dark' ? DARK_PALETTES : LIGHT_PALETTES;
  const currentPalette = [...DARK_PALETTES, ...LIGHT_PALETTES].find(p => p.id === currentPaletteId) || DARK_PALETTES[0];

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-xl transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 rounded-2xl">
              <Palette size={24} />
            </div>
            Temas y Modo de Pantalla
          </h3>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">
            Personaliza la interfaz entre Modo Claro y Modo Oscuro con múltiples combinaciones de color.
          </p>
        </div>

        <button
          onClick={handleResetToDefault}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700/50 self-start sm:self-auto cursor-pointer"
          title="Restablecer al tema original"
        >
          <RotateCcw size={15} />
          Restablecer Tema
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          {feedback}
        </div>
      )}

      {/* Mode Selector Toggle (Dark vs Light) */}
      <div className="space-y-3">
        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block">
          1. Selecciona el Modo de Visualización
        </label>
        
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/60 rounded-2xl border border-zinc-800 max-w-md">
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-xs md:text-sm transition-all cursor-pointer ${
              currentMode === 'dark'
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Moon size={18} className={currentMode === 'dark' ? 'text-fuchsia-400' : ''} />
            <span>Modo Oscuro</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-bold">
              {DARK_PALETTES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-xs md:text-sm transition-all cursor-pointer ${
              currentMode === 'light'
                ? 'bg-white text-zinc-950 shadow-lg border border-zinc-200'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Sun size={18} className={currentMode === 'light' ? 'text-amber-500' : ''} />
            <span>Modo Claro</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-bold">
              {LIGHT_PALETTES.length}
            </span>
          </button>
        </div>
      </div>

      {/* Palette Combinations Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block">
            2. Elige una Combinación de Color ({currentMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'})
          </label>
          <span className="text-xs text-zinc-500">
            Tema activo: <strong className="text-white">{currentPalette.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePalettes.map((palette) => {
            const isSelected = currentPaletteId === palette.id;
            return (
              <div
                key={palette.id}
                onClick={() => handlePaletteSelect(palette)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-4 group ${
                  isSelected
                    ? 'border-fuchsia-500 bg-zinc-950 shadow-xl shadow-fuchsia-950/30'
                    : 'border-zinc-800/80 bg-black/40 hover:border-zinc-700 hover:bg-black/70'
                }`}
              >
                {/* Top Badge & Name */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-white text-sm group-hover:text-fuchsia-400 transition-colors flex items-center gap-1.5">
                      {palette.name}
                    </h4>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 whitespace-nowrap">
                      {palette.tag}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {palette.description}
                  </p>
                </div>

                {/* Color Swatches Preview */}
                <div className="pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Fondo */}
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: palette.colors.bg }}
                        title="Fondo principal"
                      />
                      {/* Tarjeta */}
                      <span
                        className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                        style={{ backgroundColor: palette.colors.card }}
                        title="Fondo de tarjetas"
                      />
                      {/* Acento 1 */}
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: palette.colors.accentPrimary }}
                        title="Acento primario"
                      />
                      {/* Acento 2 */}
                      <span
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: palette.colors.accentSecondary }}
                        title="Acento secundario"
                      />
                    </div>

                    {/* Status Badge */}
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={13} /> Activo
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        Seleccionar
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="p-5 bg-black/60 border border-zinc-800/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
            <Eye size={15} /> Vista Previa del Tema Actual: <strong className="text-white">{currentPalette.name}</strong>
          </span>
          <span className="text-[11px] text-zinc-500">
            {currentMode === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
          </span>
        </div>

        <div 
          className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all"
          style={{ 
            backgroundColor: currentPalette.colors.card, 
            borderColor: currentPalette.colors.border,
            color: currentPalette.colors.textPrimary
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm"
              style={{ backgroundColor: currentPalette.colors.accentPrimary }}
            >
              K
            </div>
            <div>
              <h5 className="font-bold text-xs" style={{ color: currentPalette.colors.textPrimary }}>
                Kiosco Digital Las Chicas
              </h5>
              <p className="text-[11px]" style={{ color: currentPalette.colors.textSecondary }}>
                Mostrador • Punto de Venta • Inventario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span 
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border"
              style={{ 
                backgroundColor: currentPalette.colors.cardHover, 
                borderColor: currentPalette.colors.border,
                color: currentPalette.colors.textPrimary 
              }}
            >
              $ 1.500,00
            </span>
            <button
              type="button"
              className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg text-white shadow-sm transition-all"
              style={{ backgroundColor: currentPalette.colors.accentPrimary }}
            >
              Cobrar Venta
            </button>
          </div>
        </div>
      </div>

      {/* Info Tip Footer */}
      <div className="flex items-start gap-3 p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/60 text-xs text-zinc-400">
        <Info size={18} className="text-fuchsia-400 shrink-0 mt-0.5" />
        <p>
          <strong>Consejo para el Kiosco:</strong> El <span className="text-zinc-200 font-semibold">Modo Claro</span> es ideal para locales muy iluminados o mostradores con luz solar directa, mientras que el <span className="text-zinc-200 font-semibold">Modo Oscuro</span> ahorra batería en pantallas OLED y reduce el cansancio visual en turnos tarde/noche.
        </p>
      </div>
    </div>
  );
};
