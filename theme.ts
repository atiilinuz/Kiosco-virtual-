export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  id: string;
  name: string;
  mode: ThemeMode;
  tag: string;
  description: string;
  isDefault?: boolean;
  colors: {
    bg: string;
    card: string;
    cardHover: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    headerBg: string;
  };
}

export const DARK_PALETTES: ThemePalette[] = [
  {
    id: 'dark_classic',
    name: 'Kiosco Clásico (Actual)',
    mode: 'dark',
    tag: 'Por Defecto',
    isDefault: true,
    description: 'El diseño original de alto rendimiento con fondo negro puro y acentos fucsia/esmeralda.',
    colors: {
      bg: '#000000',
      card: '#18181b',
      cardHover: '#27272a',
      border: '#27272a',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      accentPrimary: '#d946ef',
      accentSecondary: '#8b5cf6',
      headerBg: 'rgba(0, 0, 0, 0.85)',
    },
  },
  {
    id: 'dark_midnight',
    name: 'Medianoche Azul',
    mode: 'dark',
    tag: 'Elegante',
    description: 'Tonos azul marino profundo con destellos zafiro y cian brillante.',
    colors: {
      bg: '#070b14',
      card: '#0d1527',
      cardHover: '#131f38',
      border: '#1e2d4a',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      accentPrimary: '#3b82f6',
      accentSecondary: '#06b6d4',
      headerBg: 'rgba(7, 11, 20, 0.85)',
    },
  },
  {
    id: 'dark_emerald',
    name: 'Esmeralda Nocturna',
    mode: 'dark',
    tag: 'Descanso Visual',
    description: 'Verdes bosque profundos combinados con menta y esmeralda de descanso visual.',
    colors: {
      bg: '#040f09',
      card: '#0a1f14',
      cardHover: '#103322',
      border: '#14422b',
      textPrimary: '#f0fdf4',
      textSecondary: '#86efac',
      accentPrimary: '#10b981',
      accentSecondary: '#34d399',
      headerBg: 'rgba(4, 15, 9, 0.85)',
    },
  },
  {
    id: 'dark_cyber',
    name: 'Cyber Púrpura',
    mode: 'dark',
    tag: 'Moderno',
    description: 'Estilo ciberpunk con violeta neón, morado intenso y destellos fucsia.',
    colors: {
      bg: '#0a0614',
      card: '#150d2b',
      cardHover: '#221644',
      border: '#311e5f',
      textPrimary: '#faf5ff',
      textSecondary: '#c084fc',
      accentPrimary: '#a855f7',
      accentSecondary: '#ec4899',
      headerBg: 'rgba(10, 6, 20, 0.85)',
    },
  },
  {
    id: 'dark_amber',
    name: 'Café & Ámbar Cálido',
    mode: 'dark',
    tag: 'Cálido',
    description: 'Fondo espresso tostado con acentos dorados y ámbar de gran calidez.',
    colors: {
      bg: '#120d09',
      card: '#1f1610',
      cardHover: '#31231a',
      border: '#443024',
      textPrimary: '#fef3c7',
      textSecondary: '#d97706',
      accentPrimary: '#f59e0b',
      accentSecondary: '#fbbf24',
      headerBg: 'rgba(18, 13, 9, 0.85)',
    },
  },
  {
    id: 'dark_ruby',
    name: 'Rubí & Carbón',
    mode: 'dark',
    tag: 'Intenso',
    description: 'Carbón con matices carmesí, ideal para kioscos dinámicos y nocturnos.',
    colors: {
      bg: '#120709',
      card: '#200d11',
      cardHover: '#33141b',
      border: '#4c1a24',
      textPrimary: '#fff1f2',
      textSecondary: '#fda4af',
      accentPrimary: '#ef4444',
      accentSecondary: '#f43f5e',
      headerBg: 'rgba(18, 7, 9, 0.85)',
    },
  },
];

export const LIGHT_PALETTES: ThemePalette[] = [
  {
    id: 'light_classic',
    name: 'Kiosco Blanco Puro',
    mode: 'light',
    tag: 'Limpio & Nítido',
    isDefault: true,
    description: 'Fondo blanco brillante con tarjetas nítidas, alto contraste y detalles fucsia/violeta.',
    colors: {
      bg: '#f8fafc',
      card: '#ffffff',
      cardHover: '#f1f5f9',
      border: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      accentPrimary: '#c026d3',
      accentSecondary: '#7c3aed',
      headerBg: 'rgba(255, 255, 255, 0.92)',
    },
  },
  {
    id: 'light_corporate',
    name: 'Azul Profesional Claro',
    mode: 'light',
    tag: 'Corporativo',
    description: 'Fondo azul cielo suave con tarjetas blancas y acentos azul zafiro comercial.',
    colors: {
      bg: '#f0f7ff',
      card: '#ffffff',
      cardHover: '#e0f2fe',
      border: '#bae6fd',
      textPrimary: '#0c4a6e',
      textSecondary: '#0369a1',
      accentPrimary: '#0284c7',
      accentSecondary: '#2563eb',
      headerBg: 'rgba(240, 247, 255, 0.92)',
    },
  },
  {
    id: 'light_mint',
    name: 'Menta & Salvia Fresco',
    mode: 'light',
    tag: 'Fresco',
    description: 'Ambiente refrescante y natural con tonos verde menta pastel y esmeralda.',
    colors: {
      bg: '#f0fdf4',
      card: '#ffffff',
      cardHover: '#dcfce7',
      border: '#bbf7d0',
      textPrimary: '#064e3b',
      textSecondary: '#047857',
      accentPrimary: '#059669',
      accentSecondary: '#10b981',
      headerBg: 'rgba(240, 253, 244, 0.92)',
    },
  },
  {
    id: 'light_warm',
    name: 'Crema & Canela Tostada',
    mode: 'light',
    tag: 'Acogedor',
    description: 'Fondo crema suave y toques caramelo/ámbar para un estilo cálido de comercio tradicional.',
    colors: {
      bg: '#faf7f2',
      card: '#ffffff',
      cardHover: '#f5efe6',
      border: '#e7dfd5',
      textPrimary: '#451a03',
      textSecondary: '#78350f',
      accentPrimary: '#d97706',
      accentSecondary: '#b45309',
      headerBg: 'rgba(250, 247, 242, 0.92)',
    },
  },
  {
    id: 'light_lavender',
    name: 'Lavanda & Lila Pastel',
    mode: 'light',
    tag: 'Suave',
    description: 'Estética delicada con base lila suave, tarjetas blancas y acentos violeta brillante.',
    colors: {
      bg: '#faf5ff',
      card: '#ffffff',
      cardHover: '#f3e8ff',
      border: '#e9d5ff',
      textPrimary: '#3b0764',
      textSecondary: '#6b21a8',
      accentPrimary: '#7c3aed',
      accentSecondary: '#9333ea',
      headerBg: 'rgba(250, 245, 255, 0.92)',
    },
  },
  {
    id: 'light_coral',
    name: 'Coral & Durazno Alegre',
    mode: 'light',
    tag: 'Vibrante',
    description: 'Tonos melocotón suaves y coral enérgico con máxima legibilidad en mostrador.',
    colors: {
      bg: '#fff7ed',
      card: '#ffffff',
      cardHover: '#ffedd5',
      border: '#fed7aa',
      textPrimary: '#431407',
      textSecondary: '#9a3412',
      accentPrimary: '#ea580c',
      accentSecondary: '#e11d48',
      headerBg: 'rgba(255, 247, 237, 0.92)',
    },
  },
];

export const ALL_PALETTES: ThemePalette[] = [...DARK_PALETTES, ...LIGHT_PALETTES];

const THEME_MODE_KEY = 'kiosco_theme_mode';
const THEME_PALETTE_KEY = 'kiosco_theme_palette';

export function getStoredTheme(): { mode: ThemeMode; paletteId: string } {
  try {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    const savedPalette = localStorage.getItem(THEME_PALETTE_KEY);

    const mode: ThemeMode = savedMode === 'light' ? 'light' : 'dark';
    const fallbackPalette = mode === 'light' ? 'light_classic' : 'dark_classic';
    const paletteId = savedPalette || fallbackPalette;

    // Verificar si existe la paleta
    const exists = ALL_PALETTES.some((p) => p.id === paletteId);
    return {
      mode,
      paletteId: exists ? paletteId : fallbackPalette,
    };
  } catch (e) {
    return { mode: 'dark', paletteId: 'dark_classic' };
  }
}

export function setStoredTheme(mode: ThemeMode, paletteId: string): void {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
    localStorage.setItem(THEME_PALETTE_KEY, paletteId);
  } catch (e) {
    console.error('Error guardando tema en localStorage:', e);
  }
}

export function applyTheme(mode: ThemeMode, paletteId: string): void {
  const palette = ALL_PALETTES.find((p) => p.id === paletteId) || (mode === 'light' ? LIGHT_PALETTES[0] : DARK_PALETTES[0]);

  setStoredTheme(mode, palette.id);

  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-palette', palette.id);

  // Set CSS custom properties
  root.style.setProperty('--theme-bg-primary', palette.colors.bg);
  root.style.setProperty('--theme-bg-card', palette.colors.card);
  root.style.setProperty('--theme-bg-card-hover', palette.colors.cardHover);
  root.style.setProperty('--theme-border', palette.colors.border);
  root.style.setProperty('--theme-text-primary', palette.colors.textPrimary);
  root.style.setProperty('--theme-text-secondary', palette.colors.textSecondary);
  root.style.setProperty('--theme-accent-primary', palette.colors.accentPrimary);
  root.style.setProperty('--theme-accent-secondary', palette.colors.accentSecondary);
  root.style.setProperty('--theme-header-bg', palette.colors.headerBg);

  // Update theme-color meta tag for browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', palette.colors.bg);
  }
}

export function initTheme(): void {
  const { mode, paletteId } = getStoredTheme();
  applyTheme(mode, paletteId);
}
