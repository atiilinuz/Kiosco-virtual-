import Dexie, { Table } from 'dexie';
import { Sale } from './types';
import { dbService } from './db';

export interface PendingSale {
  id?: number;
  sale: Sale;
  createdAt: string;
  attempts: number;
  status: 'pending' | 'failed' | 'syncing';
  lastError?: string;
}

class OfflineSyncDatabase extends Dexie {
  pendingSales!: Table<PendingSale>;

  constructor() {
    super('KioscoLasChicasOfflineDB');
    this.version(1).stores({
      pendingSales: '++id, createdAt, attempts, status'
    });
  }
}

export const syncDb = new OfflineSyncDatabase();

class SyncQueueManager {
  private isProcessing = false;
  private listeners: (() => void)[] = [];

  constructor() {
    // Escuchar el evento de conexión restaurada para iniciar sincronización
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncQueue] Conexión online detectada. Iniciando sincronización...');
        this.processQueue();
      });

      // Intervalo de seguridad por si falla el evento nativo
      setInterval(() => {
        if (navigator.onLine) {
          this.processQueue();
        }
      }, 20000);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getIsProcessing() {
    return this.isProcessing;
  }

  async getPendingCount(): Promise<number> {
    try {
      return await syncDb.pendingSales.count();
    } catch (e) {
      console.error('[SyncQueue] Error al contar ventas pendientes:', e);
      return 0;
    }
  }

  async enqueueSale(sale: Sale): Promise<void> {
    try {
      // Registrar en IndexedDB
      await syncDb.pendingSales.add({
        sale,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending'
      });
      console.log(`[SyncQueue] Venta encolada localmente: ${sale.id}`);
      this.notify();

      // Intentar procesar de inmediato si estamos online
      if (navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[SyncQueue] Error enqueuing sale:', error);
      // Intento de fallback desesperado en memoria o local storage
      try {
        const fallbackQueue = JSON.parse(localStorage.getItem('fallback_sync_queue') || '[]');
        fallbackQueue.push(sale);
        localStorage.setItem('fallback_sync_queue', JSON.stringify(fallbackQueue));
      } catch (localErr) {
        console.error('[SyncQueue] Fallback local storage también falló:', localErr);
      }
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    if (!navigator.onLine) {
      console.log('[SyncQueue] Dispositivo offline. Sincronización en espera.');
      return;
    }

    const count = await this.getPendingCount();
    if (count === 0) {
      return;
    }

    this.isProcessing = true;
    this.notify();

    console.log(`[SyncQueue] Iniciando sincronización de ${count} ventas pendientes...`);

    try {
      // Obtener todas las ventas pendientes
      const pendingItems = await syncDb.pendingSales
        .orderBy('id')
        .toArray();

      for (const item of pendingItems) {
        if (!navigator.onLine) {
          console.log('[SyncQueue] Se perdió la conexión durante el procesamiento. Abortando ciclo.');
          break;
        }

        if (!item.id) continue;

        // Marcar como procesando
        await syncDb.pendingSales.update(item.id, { status: 'syncing' });
        this.notify();

        try {
          console.log(`[SyncQueue] Sincronizando venta ${item.sale.id} (Intento #${item.attempts + 1})...`);
          
          // Intentar guardar en Firestore usando el servicio de base de datos
          await dbService.executeSaleTransaction(item.sale);

          // Si tiene éxito, remover de la cola
          await syncDb.pendingSales.delete(item.id);
          console.log(`[SyncQueue] Venta ${item.sale.id} sincronizada correctamente.`);
        } catch (err: any) {
          console.error(`[SyncQueue] Falló sincronización de venta ${item.sale.id}:`, err);
          
          const nextAttempts = item.attempts + 1;
          const errorMessage = err?.message || String(err);

          await syncDb.pendingSales.update(item.id, {
            attempts: nextAttempts,
            status: 'failed',
            lastError: errorMessage
          });

          // Si es un error de conexión, frenar procesamiento para evitar ciclos inútiles
          if (!navigator.onLine || errorMessage.includes('offline') || errorMessage.includes('network')) {
            console.log('[SyncQueue] Error de red detectado. Postergando cola.');
            break;
          }
        }
        this.notify();
      }
    } catch (queueErr) {
      console.error('[SyncQueue] Error general procesando cola:', queueErr);
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  // Integrar cola del fallback local storage en IndexedDB si existe
  async mergeLocalStorageFallback() {
    try {
      const raw = localStorage.getItem('fallback_sync_queue');
      if (raw) {
        const sales: Sale[] = JSON.parse(raw);
        if (sales.length > 0) {
          for (const sale of sales) {
            await this.enqueueSale(sale);
          }
          localStorage.removeItem('fallback_sync_queue');
          console.log(`[SyncQueue] Sincronizadas ${sales.length} ventas del localStorage fallback.`);
        }
      }
    } catch (e) {
      console.error('[SyncQueue] Error integrando fallback local storage:', e);
    }
  }
}

export const syncQueue = new SyncQueueManager();

// Iniciar migración de fallback en la carga del script
syncQueue.mergeLocalStorageFallback();
