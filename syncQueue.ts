import Dexie, { Table } from 'dexie';
import { Sale, Product } from './types';
import { db } from './db';
import { supabase } from './services/supabaseClient';
import { supabaseSalesService, fromSupabaseSaleRow } from './services/supabaseSales';
import { supabaseProductsService, fromSupabaseRow } from './services/supabaseProducts';

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

export interface IntegrityCheckResult {
  success: boolean;
  message: string;
  productsSummary: {
    localTotal: number;
    remoteTotal: number;
    pushedToRemote: number;
    pulledFromRemote: number;
  };
  salesSummary: {
    localTotal: number;
    remoteTotal: number;
    pushedToRemote: number;
    pulledFromRemote: number;
  };
  pendingQueueProcessed: number;
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
  private isPaused = false;
  private isInterrupted = false;
  private listeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isPaused) {
          console.log('[SyncQueue] Conexión online restablecida. Sincronizando con Supabase...');
          this.processQueue();
          this.syncAllFromRemote();
        }
      });

      // Intervalo periódico de sincronización automática (cada 15 segundos)
      setInterval(() => {
        if (navigator.onLine && !this.isPaused) {
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

  isSyncPaused(): boolean {
    return this.isPaused;
  }

  interruptSync() {
    console.log('[SyncQueue] Sincronización interrumpida manualmente por el usuario.');
    this.isInterrupted = true;
    this.isPaused = true;
    this.isProcessing = false;
    this.notify();
  }

  pauseSync() {
    this.isPaused = true;
    this.notify();
  }

  resumeSync() {
    console.log('[SyncQueue] Reanudando sincronización con Supabase...');
    this.isPaused = false;
    this.isInterrupted = false;
    this.notify();
    if (navigator.onLine) {
      this.processQueue();
    }
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
    if (!navigator.onLine || this.isPaused) return;
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

      if (navigator.onLine && !this.isPaused) {
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

      if (navigator.onLine && !this.isPaused) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[SyncQueue] Error enqueuing product update:', error);
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused) {
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
    this.isInterrupted = false;
    this.notify();

    console.log(`[SyncQueue] Procesando cola: ${pendingSalesCount} ventas, ${pendingProductsCount} productos...`);

    try {
      // 1. Procesar Cambios de Productos pendientes
      const pendingProducts = await syncDb.pendingProducts.orderBy('id').toArray();
      for (const item of pendingProducts) {
        if (!navigator.onLine || this.isInterrupted || this.isPaused) break;
        if (!item.id) continue;

        await syncDb.pendingProducts.update(item.id, { status: 'syncing' });

        let success = false;
        if (item.action === 'delete') {
          if (item.productId && item.productId.trim()) {
            success = await supabaseProductsService.deleteProduct(item.productId, false);
          } else {
            success = true; // Invalid ID, drop item
          }
        } else {
          const fullProd = item.productId ? await db.products.get(item.productId) : null;
          if (fullProd && fullProd.id) {
            success = await supabaseProductsService.saveProduct(fullProd, false);
          } else if (item.productId && item.productData) {
            success = await supabaseProductsService.updateProduct(item.productId, item.productData, false);
          } else {
            success = true; // Drop unresolvable change
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
        if (!navigator.onLine || this.isInterrupted || this.isPaused) break;
        if (!item.id) continue;

        await syncDb.pendingSales.update(item.id, { status: 'syncing' });

        try {
          // Intentar guardar la venta en Supabase
          const success = await supabaseSalesService.saveSale(item.sale);

          // También actualizar los stocks resultantes de la venta en Supabase
          for (const cartItem of (item.sale.items || [])) {
            if (cartItem && cartItem.id) {
              const prod = await db.products.get(cartItem.id);
              if (prod && prod.id && String(prod.id).trim()) {
                await supabaseProductsService.updateProduct(prod.id, { stock: prod.stock });
              }
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

  // Validar integridad entre Dexie local y Supabase remote
  async validateIntegrityWithSupabase(): Promise<IntegrityCheckResult> {
    if (!navigator.onLine) {
      return {
        success: false,
        message: 'Sin conexión a Internet. Conéctese para validar integridad con Supabase.',
        productsSummary: { localTotal: 0, remoteTotal: 0, pushedToRemote: 0, pulledFromRemote: 0 },
        salesSummary: { localTotal: 0, remoteTotal: 0, pushedToRemote: 0, pulledFromRemote: 0 },
        pendingQueueProcessed: 0
      };
    }

    try {
      this.isProcessing = true;
      this.notify();

      // 1. Procesar elementos pendientes en la cola primero
      const pendingBefore = await this.getPendingCount();
      await this.processQueue();

      // 2. Obtener productos y ventas locales
      const localProducts = await db.products.toArray();
      const localSales = await db.sales.toArray();

      // 3. Obtener productos y ventas de Supabase
      const { data: remoteProductsData, error: prodErr } = await supabase.from('products').select('*');
      if (prodErr) throw new Error(`Error leyendo productos de Supabase: ${prodErr.message}`);

      const { data: remoteSalesData, error: salesErr } = await supabase.from('sales').select('*');
      if (salesErr) throw new Error(`Error leyendo ventas de Supabase: ${salesErr.message}`);

      const remoteProducts = (remoteProductsData || []).map(fromSupabaseRow);
      const remoteSales = (remoteSalesData || []).map(fromSupabaseSaleRow);

      const localProdMap = new Map(localProducts.map(p => [p.id, p]));
      const remoteProdMap = new Map(remoteProducts.map(p => [p.id, p]));

      let pushedProducts = 0;
      let pulledProducts = 0;

      // Reconciliar Productos: Local -> Remote
      for (const localP of localProducts) {
        if (!remoteProdMap.has(localP.id)) {
          // Registro faltante en Supabase -> Subir
          await supabaseProductsService.saveProduct(localP, false);
          pushedProducts++;
        } else {
          // Si difiere en stock o precio, forzar actualización con el estado local
          const remoteP = remoteProdMap.get(localP.id)!;
          if (remoteP.stock !== localP.stock || remoteP.price !== localP.price || remoteP.name !== localP.name) {
            await supabaseProductsService.saveProduct(localP, false);
            pushedProducts++;
          }
        }
      }

      // Reconciliar Productos: Remote -> Local
      for (const remoteP of remoteProducts) {
        if (!localProdMap.has(remoteP.id)) {
          // Registro huérfano localmente -> Descargar
          await db.products.put(remoteP);
          pulledProducts++;
        }
      }

      // Reconciliar Ventas: Local <-> Remote
      const localSaleMap = new Map(localSales.map(s => [s.id, s]));
      const remoteSaleMap = new Map(remoteSales.map(s => [s.id, s]));

      let pushedSales = 0;
      let pulledSales = 0;

      // Local -> Remote
      for (const localS of localSales) {
        if (!remoteSaleMap.has(localS.id)) {
          await supabaseSalesService.saveSale(localS);
          pushedSales++;
        }
      }

      // Remote -> Local
      for (const remoteS of remoteSales) {
        if (!localSaleMap.has(remoteS.id)) {
          await db.sales.put(remoteS);
          pulledSales++;
        }
      }

      const finalLocalProducts = await db.products.count();
      const finalLocalSales = await db.sales.count();

      return {
        success: true,
        message: `Validación de integridad completada con éxito. Se sincronizaron ${pushedProducts + pulledProducts} productos y ${pushedSales + pulledSales} ventas.`,
        productsSummary: {
          localTotal: finalLocalProducts,
          remoteTotal: remoteProducts.length + pushedProducts,
          pushedToRemote: pushedProducts,
          pulledFromRemote: pulledProducts
        },
        salesSummary: {
          localTotal: finalLocalSales,
          remoteTotal: remoteSales.length + pushedSales,
          pushedToRemote: pushedSales,
          pulledFromRemote: pulledSales
        },
        pendingQueueProcessed: pendingBefore
      };

    } catch (error: any) {
      console.error('[SyncQueue] Error en validación de integridad:', error);
      
      let friendlyMessage = error.message || String(error);
      if (friendlyMessage.includes('Failed to fetch') || friendlyMessage.includes('TypeError')) {
        friendlyMessage = 'No se pudo conectar con el servidor de Supabase. Posibles causas: 1) Sin conexión a Internet o bloqueada por cortafuegos/red, 2) Proyecto de Supabase pausado o inactivo en Supabase Dashboard, 3) URL o Llave de Supabase incorrecta en las variables de entorno. La aplicación continúa funcionando en modo local sin perder datos.';
      }

      return {
        success: false,
        message: `Error al validar integridad: ${friendlyMessage}`,
        productsSummary: { localTotal: 0, remoteTotal: 0, pushedToRemote: 0, pulledFromRemote: 0 },
        salesSummary: { localTotal: 0, remoteTotal: 0, pushedToRemote: 0, pulledFromRemote: 0 },
        pendingQueueProcessed: 0
      };
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }
}

export const syncQueue = new SyncQueueManager();
syncQueue.mergeLocalStorageFallback();
