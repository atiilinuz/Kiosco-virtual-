
import React, { useState, useRef, useEffect } from 'react';
import { Lock, User, Store, AlertCircle, Download, HelpCircle, ChevronRight, MoreVertical, PlusSquare, Smartphone, X, Eye, EyeOff } from 'lucide-react';
import { AppUser } from '../types';
import { verifyPassword } from '../utils';

interface LoginProps {
  users: AppUser[];
  onLogin: (user: AppUser, device: string) => void;
  showInstallBtn?: boolean;
  onInstallClick?: () => Promise<boolean> | boolean;
  isOnline?: boolean;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, showInstallBtn, onInstallClick, isOnline = true }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTogglePassword = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setShowPassword((prev) => {
      const next = !prev;
      if (next) {
        // Auto-hide after 4 seconds
        timeoutRef.current = setTimeout(() => {
          setShowPassword(false);
        }, 4000);
      }
      return next;
    });
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = "Desktop";
    if (/android/i.test(ua)) device = "Android Device";
    else if (/iPad|iPhone|iPod/.test(ua)) device = "iOS Device";
    return `${device} (${navigator.platform})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    const user = users.find(u => u.username === username);

    if (user) {
      const isValid = await verifyPassword(password, user.password);
      if (isValid) {
        onLogin(user, getDeviceInfo());
      } else {
         setError('Credenciales incorrectas. Intente de nuevo.');
      }
    } else {
      setError('Credenciales incorrectas. Intente de nuevo.');
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-8 p-10 bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-zinc-800 shadow-2xl shadow-fuchsia-900/20 animate-fade-in relative z-10">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-fuchsia-600 to-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-fuchsia-500/20 mb-6 transform hover:scale-105 transition-transform">
            <Store size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Kiosco <span className="text-fuchsia-500">Digital</span></h2>
          <p className="mt-2 text-zinc-500 font-medium">Panel de Gestión Las Chicas</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-fuchsia-500 transition-colors" size={20} />
              <input
                type="text"
                required
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:border-fuchsia-500/50 focus:ring-4 focus:ring-fuchsia-500/5 outline-none transition-all"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-fuchsia-500 transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-zinc-700 focus:border-fuchsia-500/50 focus:ring-4 focus:ring-fuchsia-500/5 outline-none transition-all"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-fuchsia-500 transition-colors p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                id="toggle-password-visibility"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-4 rounded-2xl border border-red-400/20 animate-shake">
              <AlertCircle size={18} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-black py-4 rounded-2xl shadow-2xl shadow-fuchsia-900/40 transition-all active:scale-[0.98] border border-fuchsia-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {verifying ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}
            <ChevronRight size={20} />
          </button>
        </form>
        
        <div className="text-center pt-8 border-t border-zinc-800/50 space-y-6">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black">
              Desarrollado por Kedzierski Pablo Andrés, para kiosco LAS CHICAS
            </p>
            {/* Version Badge */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[9px] text-zinc-500 font-mono font-bold tracking-widest mr-1">v2.9.1</span>
               <div className="w-[1px] h-3 bg-zinc-800 mx-1"></div>
               {isOnline ? (
                 <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                   <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Online
                 </span>
               ) : (
                 <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                   <span className="w-1 h-1 rounded-full bg-red-400"></span> Modo Local
                 </span>
               )}
            </div>
          </div>

          <div className="space-y-3">
            {showInstallBtn ? (
              <button 
                onClick={async () => {
                  if (onInstallClick) {
                    const handled = await onInstallClick();
                    if (!handled) setShowGuide(true);
                  }
                }}
                className="w-full group relative overflow-hidden bg-white text-black font-black py-4 rounded-2xl transition-all shadow-xl hover:bg-zinc-100 active:scale-95 flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Download size={22} className="text-emerald-600 group-hover:animate-bounce" />
                <span className="text-sm">DESCARGAR APP (ANDROID/APK)</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowGuide(true)}
                className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white py-4 rounded-2xl border border-zinc-800 transition-all flex items-center justify-center gap-2 group"
              >
                <HelpCircle size={18} className="text-fuchsia-500" />
                <span className="text-xs font-bold uppercase tracking-widest">¿Cómo instalar en mi celular?</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowGuide(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-fade-in text-white">
            <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Smartphone className="text-fuchsia-500" size={32} />
              </div>
              <h3 className="text-xl font-black">Guía de Instalación</h3>
              <p className="text-zinc-500 text-sm mt-1">Sigue estos pasos para tener la app</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-fuchsia-500 shrink-0">1</div>
                <div>
                  <p className="text-sm font-bold">Abre el menú de Chrome</p>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">Toca los 3 puntos <MoreVertical size={14} /> en la esquina superior.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-fuchsia-500 shrink-0">2</div>
                <div>
                  <p className="text-sm font-bold">Instalar Aplicación</p>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">Busca la opción "Instalar aplicación" o "Agregar a pantalla de inicio" <PlusSquare size={14} />.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-fuchsia-500 shrink-0">3</div>
                <div>
                  <p className="text-sm font-bold">¡Listo!</p>
                  <p className="text-xs text-zinc-500 mt-1">Aparecerá el icono en tu escritorio como cualquier otra app.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              className="w-full mt-10 bg-fuchsia-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-fuchsia-900/20"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
