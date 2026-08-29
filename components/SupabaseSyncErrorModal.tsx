import React, { useState, useEffect } from 'react';
import { 
  CloudOff, RefreshCw, X, AlertTriangle, CheckCircle2, 
  HardDrive, ChevronDown, ChevronUp, ShieldCheck, Pause, Play, OctagonAlert
} from 'lucide-react';
import { supabaseErrorNotifier, SupabaseSyncErrorEvent } from '../services/supabaseErrorNotifier';
import { syncQueue } from '../syncQueue';

export const SupabaseSyncErrorModal: React.FC = () => {
  const [errorEvent, setErrorEvent] = useState<SupabaseSyncErrorEvent | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<'idle' | 'success' | 'failed' | 'paused'>('idle');
  const [showDetails, setShowDetails] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsubscribe = supabaseErrorNotifier.subscribe((event) => {
      setErrorEvent(event);
      setRetryResult('idle');
      setIsRetrying(false);
      setIsPaused(syncQueue.isSyncPaused());
    });
    return () => unsubscribe();
  }, []);

  if (!errorEvent) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryResult('idle');
    try {
      syncQueue.resumeSync();
      setIsPaused(false);
      const ok = await supabaseErrorNotifier.retry();
      if (ok) {
        setRetryResult('success');
        setTimeout(() => {
          supabaseErrorNotifier.dismiss();
        }, 1500);
      } else {
        setRetryResult('failed');
      }
    } catch (err) {
      setRetryResult('failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleTogglePause = () => {
    try {
      if (isPaused) {
        syncQueue.resumeSync();
        setIsPaused(false);
        setRetryResult('idle');
      } else {
        syncQueue.interruptSync();
        setIsPaused(true);
        setRetryResult('paused');
        setTimeout(() => {
          supabaseErrorNotifier.dismiss();
        }, 2000);
      }
    } catch (e) {
      console.error('Error al pausar/reanudar sincronización:', e);
      supabaseErrorNotifier.dismiss();
    }
  };

  const handleCancel = () => {
    supabaseErrorNotifier.dismiss();
  };

  const getOperationLabel = () => {
    switch (errorEvent.operation) {
      case 'save_product':
        return 'Guardado de Producto';
      case 'update_product':
        return 'Actualización de Producto';
      case 'delete_product':
        return 'Eliminación de Producto';
      case 'bulk_products':
        return 'Importación Masiva de Productos';
      case 'save_sale':
        return 'Registro de Venta';
      default:
        return 'Sincronización con Nube';
    }
  };

  return (
    <div 
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-[9999] animate-fade-in"
      role="dialog"
      aria-labelledby="supabase-error-title"
    >
      <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all space-y-4 text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <CloudOff size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 id="supabase-error-title" className="font-black text-sm md:text-base text-white flex items-center gap-2">
                Aviso de Conexión Supabase
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Nube
                </span>
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                {getOperationLabel()} • <strong className="text-zinc-200">{errorEvent.itemName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700/60 cursor-pointer shrink-0"
            title="Cerrar y continuar en modo local"
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Notification Content */}
        <div className="space-y-3">
          {/* Error Pill */}
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle size={15} className="shrink-0" />
              <span>Fallo de comunicación detectado:</span>
            </div>
            <p className="font-mono text-red-300 text-[11px] break-all pl-5">
              {errorEvent.errorMessage || 'TypeError: Failed to fetch'}
            </p>
          </div>

          {/* Local Safe Guarantee */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">
                ¡Tu información está segura en la memoria local!
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                El producto fue registrado en la base de datos de tu dispositivo (Dexie). Puedes seguir atendiendo y cobrando sin interrupciones ni demoras.
              </p>
            </div>
          </div>

          {/* Technical Details Accordion */}
          {errorEvent.errorDetails && (
            <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-black/40 text-xs">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-2.5 text-zinc-400 hover:text-zinc-200 transition-colors text-[11px] font-semibold cursor-pointer"
              >
                <span>Detalles del error de red</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showDetails && (
                <div className="p-2.5 border-t border-zinc-800/60 font-mono text-[11px] text-zinc-400 bg-zinc-950/60 leading-relaxed">
                  {errorEvent.errorDetails}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Status Feedback */}
        {retryResult === 'success' && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} />
            ¡Copia sincronizada exitosamente con Supabase!
          </div>
        )}

        {retryResult === 'failed' && (
          <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <AlertTriangle size={16} />
            El reintento falló. El servidor sigue sin responder.
          </div>
        )}

        {retryResult === 'paused' && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <OctagonAlert size={16} />
            Sincronización pausada. Operando 100% en modo local.
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Botón de Pausa / Reanudar Destacado */}
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={isRetrying}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer border ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 hover:scale-[1.01]'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 hover:scale-[1.01]'
            }`}
            title={isPaused ? 'Reanudar sincronización con la nube' : 'Pausar sincronización para evitar demoras'}
          >
            {isPaused ? (
              <>
                <Play size={16} className="fill-current" />
                <span>Reanudar Sincronización</span>
              </>
            ) : (
              <>
                <Pause size={16} className="fill-current" />
                <span>Pausar Sincronización</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all border border-zinc-700/60 cursor-pointer"
              title="Continuar en modo local"
            >
              <HardDrive size={15} />
              <span>Continuar Local</span>
            </button>

            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                isRetrying
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-wait'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border-zinc-700 hover:border-amber-500/40'
              }`}
            >
              <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
              <span>{isRetrying ? 'Probando...' : 'Reintentar'}</span>
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <p className="text-[10px] text-zinc-500 text-center leading-tight">
          Al presionar <strong>Pausar Sincronización</strong>, se detienen todas las peticiones a Supabase para que el sistema funcione con máxima fluidez sin depender de internet.
        </p>
      </div>
    </div>
  );
};
