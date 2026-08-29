import { supabase } from './supabaseClient';
import { Product } from '../types';
import { db } from '../db';
import { supabaseErrorNotifier } from './supabaseErrorNotifier';

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = 3500,
  errorMsg = 'Tiempo de espera agotado al conectar con Supabase (posible lentitud o fallo de red)'
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMsg));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export function toSupabaseRow(p: Product) {
  return {
    id: String(p.id || '').trim(),
    barcode: p.barcode ? String(p.barcode).trim() : null,
    name: String(p.name || '').trim(),
    price: Number(p.price) || 0,
    category: p.category ? String(p.category).trim() : 'Varios',
    image: p.image ? String(p.image).trim() : '',
    description: p.description ? String(p.description).trim() : '',
    is_popular: Boolean(p.isPopular),
    stock: Number(p.stock) || 0
  };
}

export function fromSupabaseRow(row: any): Product {
  return {
    id: String(row.id || '').trim(),
    barcode: row.barcode ? String(row.barcode) : undefined,
    name: String(row.name || ''),
    price: Number(row.price) || 0,
    category: String(row.category || 'Varios'),
    image: String(row.image || ''),
    description: String(row.description || ''),
    isPopular: Boolean(row.is_popular ?? row.isPopular ?? false),
    stock: Number(row.stock) || 0
  };
}

export const supabaseProductsService = {
  // Fetch products from Supabase and sync with local Dexie DB
  async syncProductsFromSupabase(): Promise<Product[]> {
    try {
      if (!navigator.onLine) return [];
      console.log('[Supabase] Intentando sincronizar productos desde Supabase...');
      const res: any = await withTimeout(supabase.from('products').select('*'), 5000);
      const { data, error } = res;
      
      if (error) {
        console.warn('[Supabase] Aviso o error consultando Supabase:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const products = data.map(fromSupabaseRow).filter(p => p.id !== '');
        if (products.length > 0) {
          await db.products.bulkPut(products);
          console.log(`[Supabase] Sincronizados ${products.length} productos desde Supabase a la base local.`);
        }
        return products;
      } else {
        const localProducts = await db.products.toArray();
        if (localProducts.length > 0) {
          console.log('[Supabase] Tabla de productos vacía en Supabase. Subiendo productos locales...');
          const rows = localProducts.map(toSupabaseRow).filter(r => r.id !== '');
          if (rows.length > 0) {
            const { error: upsertErr } = await withTimeout(supabase.from('products').upsert(rows), 6000);
            if (upsertErr) {
              console.warn('[Supabase] Error al subir catálogo inicial:', upsertErr.message);
            } else {
              console.log('[Supabase] Catálogo inicial subido exitosamente a Supabase.');
            }
          }
        }
        return localProducts;
      }
    } catch (err: any) {
      console.warn('[Supabase] Modo offline / Sin conexión con Supabase:', err?.message || String(err));
      return [];
    }
  },

  // Save/Upsert a product to Supabase with non-blocking error notification
  async saveProduct(product: Product, notifyOnError = true): Promise<boolean> {
    try {
      if (!product || !product.id || !String(product.id).trim()) {
        console.warn('[Supabase] Producto o ID inválido al guardar.');
        return false;
      }
      const row = toSupabaseRow(product);
      const res: any = await withTimeout(
        supabase.from('products').upsert(row),
        3500
      );

      if (res?.error) {
        const errorMsg = res.error.message || 'Error en respuesta de Supabase';
        console.warn('[Supabase] Aviso al guardar producto:', errorMsg);
        if (notifyOnError) {
          supabaseErrorNotifier.showError({
            operation: 'save_product',
            itemName: product.name || `ID ${product.id}`,
            errorMessage: errorMsg,
            errorDetails: `Código: ${res.error.code || 'Desconocido'} • ${errorMsg}`,
            retryAction: async () => {
              return await supabaseProductsService.saveProduct(product, false);
            }
          });
        }
        return false;
      }
      return true;
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      const isFetchErr = rawMsg.includes('Failed to fetch') || rawMsg.includes('fetch') || rawMsg.includes('NetworkError');
      const errorMsg = isFetchErr ? 'TypeError: Failed to fetch' : rawMsg;
      console.warn('[Supabase] Aviso al guardar producto:', rawMsg);

      if (notifyOnError) {
        supabaseErrorNotifier.showError({
          operation: 'save_product',
          itemName: product.name || `ID ${product.id}`,
          errorMessage: errorMsg,
          errorDetails: isFetchErr 
            ? 'No se pudo comunicar con el servidor de Supabase (Posible falta de conexión a internet o bloqueo de red). Los datos están protegidos en tu almacenamiento local.' 
            : rawMsg,
          retryAction: async () => {
            return await supabaseProductsService.saveProduct(product, false);
          }
        });
      }
      return false;
    }
  },

  // Update product in Supabase with non-blocking error notification
  async updateProduct(id: string, updates: Partial<Product>, notifyOnError = true): Promise<boolean> {
    try {
      const cleanId = id ? String(id).trim() : '';
      if (!cleanId) {
        console.warn('[Supabase] ID de producto no válido para actualizar:', id);
        return false;
      }

      const patchObj: any = {};
      if (updates.name !== undefined) patchObj.name = String(updates.name);
      if (updates.barcode !== undefined) patchObj.barcode = updates.barcode ? String(updates.barcode) : null;
      if (updates.price !== undefined) patchObj.price = Number(updates.price) || 0;
      if (updates.category !== undefined) patchObj.category = String(updates.category);
      if (updates.image !== undefined) patchObj.image = String(updates.image);
      if (updates.description !== undefined) patchObj.description = String(updates.description);
      if (updates.isPopular !== undefined) patchObj.is_popular = Boolean(updates.isPopular);
      if (updates.stock !== undefined) patchObj.stock = Number(updates.stock) || 0;

      if (Object.keys(patchObj).length === 0) {
        return true;
      }

      const res: any = await withTimeout(
        supabase.from('products').update(patchObj).eq('id', cleanId),
        3500
      );

      if (res?.error) {
        const errorMsg = res.error.message || 'Error en respuesta de Supabase';
        console.warn('[Supabase] Aviso al actualizar producto:', errorMsg);
        if (notifyOnError) {
          supabaseErrorNotifier.showError({
            operation: 'update_product',
            itemName: updates.name || `ID ${cleanId}`,
            errorMessage: errorMsg,
            errorDetails: `Código: ${res.error.code || 'Desconocido'} • ${errorMsg}`,
            retryAction: async () => {
              return await supabaseProductsService.updateProduct(id, updates, false);
            }
          });
        }
        return false;
      }
      return true;
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      const isFetchErr = rawMsg.includes('Failed to fetch') || rawMsg.includes('fetch') || rawMsg.includes('NetworkError');
      const errorMsg = isFetchErr ? 'TypeError: Failed to fetch' : rawMsg;
      console.warn('[Supabase] Aviso al actualizar producto:', rawMsg);

      if (notifyOnError) {
        supabaseErrorNotifier.showError({
          operation: 'update_product',
          itemName: updates.name || `ID ${id}`,
          errorMessage: errorMsg,
          errorDetails: isFetchErr 
            ? 'No se pudo comunicar con el servidor de Supabase (Posible falta de conexión a internet o bloqueo de red). Los datos están protegidos en tu almacenamiento local.' 
            : rawMsg,
          retryAction: async () => {
            return await supabaseProductsService.updateProduct(id, updates, false);
          }
        });
      }
      return false;
    }
  },

  // Delete product from Supabase
  async deleteProduct(id: string, notifyOnError = true): Promise<boolean> {
    try {
      const cleanId = id ? String(id).trim() : '';
      if (!cleanId) {
        console.warn('[Supabase] ID de producto no válido para eliminar:', id);
        return false;
      }

      const res: any = await withTimeout(
        supabase.from('products').delete().eq('id', cleanId),
        3500
      );

      if (res?.error) {
        const errorMsg = res.error.message || 'Error al eliminar en Supabase';
        console.warn('[Supabase] Aviso al eliminar producto:', errorMsg);
        if (notifyOnError) {
          supabaseErrorNotifier.showError({
            operation: 'delete_product',
            itemName: `ID ${cleanId}`,
            errorMessage: errorMsg,
            errorDetails: `Código: ${res.error.code || 'Desconocido'} • ${errorMsg}`,
            retryAction: async () => {
              return await supabaseProductsService.deleteProduct(id, false);
            }
          });
        }
        return false;
      }
      return true;
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      const isFetchErr = rawMsg.includes('Failed to fetch') || rawMsg.includes('fetch') || rawMsg.includes('NetworkError');
      const errorMsg = isFetchErr ? 'TypeError: Failed to fetch' : rawMsg;
      console.warn('[Supabase] Excepción al eliminar producto:', rawMsg);

      if (notifyOnError) {
        supabaseErrorNotifier.showError({
          operation: 'delete_product',
          itemName: `ID ${id}`,
          errorMessage: errorMsg,
          errorDetails: isFetchErr
            ? 'No se pudo comunicar con el servidor de Supabase. El producto ya fue eliminado de la memoria local.'
            : rawMsg,
          retryAction: async () => {
            return await supabaseProductsService.deleteProduct(id, false);
          }
        });
      }
      return false;
    }
  },

  // Bulk save products to Supabase
  async bulkSaveProducts(products: Product[], notifyOnError = true): Promise<boolean> {
    try {
      if (!products || products.length === 0) return true;
      const rows = products.map(toSupabaseRow).filter(r => r.id !== '');
      if (rows.length === 0) return true;

      const res: any = await withTimeout(
        supabase.from('products').upsert(rows),
        5000
      );

      if (res?.error) {
        const errorMsg = res.error.message || 'Error en guardado masivo';
        console.warn('[Supabase] Aviso en guardado masivo:', errorMsg);
        if (notifyOnError) {
          supabaseErrorNotifier.showError({
            operation: 'bulk_products',
            itemName: `${products.length} productos`,
            errorMessage: errorMsg,
            errorDetails: `Código: ${res.error.code || 'Desconocido'} • ${errorMsg}`,
            retryAction: async () => {
              return await supabaseProductsService.bulkSaveProducts(products, false);
            }
          });
        }
        return false;
      }
      return true;
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      const isFetchErr = rawMsg.includes('Failed to fetch') || rawMsg.includes('fetch') || rawMsg.includes('NetworkError');
      const errorMsg = isFetchErr ? 'TypeError: Failed to fetch' : rawMsg;
      console.warn('[Supabase] Excepción en guardado masivo:', rawMsg);

      if (notifyOnError) {
        supabaseErrorNotifier.showError({
          operation: 'bulk_products',
          itemName: `${products.length} productos`,
          errorMessage: errorMsg,
          errorDetails: isFetchErr 
            ? 'No se pudo comunicar con el servidor de Supabase. Todos los productos están guardados localmente.' 
            : rawMsg,
          retryAction: async () => {
            return await supabaseProductsService.bulkSaveProducts(products, false);
          }
        });
      }
      return false;
    }
  },

  // Subscribe to realtime updates on products table
  subscribeToProducts(onUpdate?: () => void) {
    try {
      const channel = supabase
        .channel('public:products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          async (payload) => {
            console.log('[Supabase Realtime] Evento recibido:', payload.eventType);
            if (payload.eventType === 'DELETE' && payload.old?.id) {
              await db.products.delete(String(payload.old.id));
            } else if (payload.new && payload.new.id) {
              const updatedProduct = fromSupabaseRow(payload.new);
              if (updatedProduct.id) {
                await db.products.put(updatedProduct);
              }
            }
            if (onUpdate) onUpdate();
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      };
    } catch (e) {
      console.warn('[Supabase Realtime] Error al suscribirse:', e);
      return () => {};
    }
  }
};
