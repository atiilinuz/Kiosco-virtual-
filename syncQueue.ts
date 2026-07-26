import Dexie, { Table } from 'dexie';
import { Sale, Product } from './types';
import { db } from './db';
import { supabaseSalesService } from './services/supabaseSales';
import { supabaseProductsService } from './services/supabaseProducts';

export interface PendingSale {
  id?: number;
  sale: Sale;
  createdAt: string;
  attempts: number;
  status: 'pending' | 'failed' | 'syncing';
  lastError?: string;
}

export interface PendingProductUpdate {
  id?: number;
  productId: string;
  productData: Partial<Product>;
  action: 'upsert' | 'delete';
  createdAt: string;
  attempts: number;
  status: 'pending' | 'failed' | 'syncing';
}

class OfflineSyncDatabase extends Dexie {
  pendingSales!: Table<PendingSale>;
  pendingProducts!: Table<PendingProductUpdate>;

  constructor() {
    super('KioscoLasChicasOfflineDB_v2');
    this.version(1).stores({
      pendingSales: '++id, createdAt, attempts, status',
      pendingProducts: '++id, productId, action, createdAt, status'
    });
  }
}

export const syncDb = new OfflineSyncDatabase();

class SyncQueueManager {
  private isProcessing = false;
  private listeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncQueue] Conexión online restablecida. Sincronizando con Supabase...');
        this.processQueue();
        this.syncAllFromRemote();
      });

      // Intervalo periódico de sincronización automática (cada 15 segundos)
      setInterval(() => {
        if (navigator.onLine) {
          this.processQueue();
        }
      }, 15000);
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
      const salesCount = await syncDb.pendingSales.count();
      const productsCount = await syncDb.pendingProducts.count();
      return salesCount + productsCount;
    } catch (e) {
      console.error('[SyncQueue] Error al contar elementos pendientes:', e);
      return 0;
    }
  }

  // Descarga e integra cambios bidireccionales desde Supabase
  async syncAllFromRemote() {
    if (!navigator.onLine) return;
    try {
      await Promise.all([
        supabaseProductsService.syncProductsFromSupabase(),
        supabaseSalesService.syncSalesFromSupabase()
      ]);
      this.notify();
    } catch (err) {
      console.error('[SyncQueue] Error descargando cambios de Supabase:', err);
    }
  }

  async enqueueSale(sale: Sale): Promise<void> {
    try {
      await syncDb.pendingSales.add({
        sale,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending'
      });
      console.log(`[SyncQueue] Venta registrada en cola de sincronización: ${sale.id}`);
      this.notify();

      if (navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[SyncQueue] Error enqueuing sale:', error);
      try {
        const fallbackQueue = JSON.parse(localStorage.getItem('fallback_sync_queue') || '[]');
        fallbackQueue.push(sale);
        localStorage.setItem('fallback_sync_queue', JSON.stringify(fallbackQueue));
      } catch (localErr) {
        console.error('[SyncQueue] Fallback local storage falló:', localErr);
      }
    }
  }

  async enqueueProductChange(productId: string, productData: Partial<Product>, action: 'upsert' | 'delete'): Promise<void> {
    try {
      await syncDb.pendingProducts.add({
        productId,
        productData,
        action,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending'
      });
      console.log(`[SyncQueue] Cambio de producto encolado: ${productId} (${action})`);
      this.notify();

      if (navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[SyncQueue] Error enqueuing product update:', error);
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    if (!navigator.onLine) {
      console.log('[SyncQueue] Estado offline. Cola pausada.');
      return;
    }

    const pendingSalesCount = await syncDb.pendingSales.count();
    const pendingProductsCount = await syncDb.pendingProducts.count();

    if (pendingSalesCount === 0 && pendingProductsCount === 0) {
      return;
    }

    this.isProcessing = true;
    this.notify();

    console.log(`[SyncQueue] Procesando cola: ${pendingSalesCount} ventas, ${pendingProductsCount} productos...`);

    try {
      // 1. Procesar Cambios de Productos pendientes
      const pendingProducts = await syncDb.pendingProducts.orderBy('id').toArray();
      for (const item of pendingProducts) {
        if (!navigator.onLine) break;
        if (!item.id) continue;

        await syncDb.pendingProducts.update(item.id, { status: 'syncing' });

        let success = false;
        if (item.action === 'delete') {
          success = await supabaseProductsService.deleteProduct(item.productId);
        } else {
          const fullProd = await db.products.get(item.productId);
          if (fullProd) {
            success = await supabaseProductsService.saveProduct(fullProd);
          } else if (item.productData && item.productData.id) {
            success = await supabaseProductsService.updateProduct(item.productId, item.productData);
          }
        }

        if (success) {
          await syncDb.pendingProducts.delete(item.id);
          console.log(`[SyncQueue] Producto ${item.productId} sincronizado con Supabase.`);
        } else {
          await syncDb.pendingProducts.update(item.id, {
            attempts: item.attempts + 1,
            status: 'failed'
          });
        }
      }

      // 2. Procesar Ventas pendientes
      const pendingSales = await syncDb.pendingSales.orderBy('id').toArray();
      for (const item of pendingSales) {
        if (!navigator.onLine) break;
        if (!item.id) continue;

        await syncDb.pendingSales.update(item.id, { status: 'syncing' });

        try {
          // Intentar guardar la venta en Supabase
          const success = await supabaseSalesService.saveSale(item.sale);

          // También actualizar los stocks resultantes de la venta en Supabase
          for (const cartItem of item.sale.items) {
            const prod = await db.products.get(cartItem.id);
            if (prod) {
              await supabaseProductsService.updateProduct(prod.id, { stock: prod.stock });
            }
          }

          if (success) {
            await syncDb.pendingSales.delete(item.id);
            console.log(`[SyncQueue] Venta ${item.sale.id} sincronizada en Supabase exitosamente.`);
          } else {
            await syncDb.pendingSales.update(item.id, {
              attempts: item.attempts + 1,
              status: 'failed',
              lastError: 'Respuesta sin éxito de Supabase'
            });
          }
        } catch (err: any) {
          console.error(`[SyncQueue] Error al sincronizar venta ${item.sale.id}:`, err);
          await syncDb.pendingSales.update(item.id, {
            attempts: item.attempts + 1,
            status: 'failed',
            lastError: err?.message || String(err)
          });
        }
      }
    } catch (queueErr) {
      console.error('[SyncQueue] Error general durante la ejecución de la cola:', queueErr);
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

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
        }
      }
    } catch (e) {
      console.error('[SyncQueue] Error sincronizando fallback:', e);
    }
  }
}

export const syncQueue = new SyncQueueManager();
syncQueue.mergeLocalStorageFallback();
