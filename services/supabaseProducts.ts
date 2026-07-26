import { supabase } from './supabaseClient';
import { Product } from '../types';
import { db } from '../db';

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
      const { data, error } = await supabase.from('products').select('*');
      
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
            const { error: upsertErr } = await supabase.from('products').upsert(rows);
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

  // Save/Upsert a product to Supabase
  async saveProduct(product: Product): Promise<boolean> {
    try {
      if (!product || !product.id || !String(product.id).trim()) {
        console.warn('[Supabase] Producto o ID inválido al guardar.');
        return false;
      }
      const row = toSupabaseRow(product);
      const { error } = await supabase.from('products').upsert(row);
      if (error) {
        console.warn('[Supabase] Aviso al guardar producto:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[Supabase] Excepción/Sin conexión al guardar producto:', err?.message || String(err));
      return false;
    }
  },

  // Update product in Supabase
  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
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

      const { error } = await supabase.from('products').update(patchObj).eq('id', cleanId);
      if (error) {
        console.warn('[Supabase] Aviso al actualizar producto:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[Supabase] Excepción/Sin conexión al actualizar producto:', err?.message || String(err));
      return false;
    }
  },

  // Delete product from Supabase
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const cleanId = id ? String(id).trim() : '';
      if (!cleanId) {
        console.warn('[Supabase] ID de producto no válido para eliminar:', id);
        return false;
      }

      const { error } = await supabase.from('products').delete().eq('id', cleanId);
      if (error) {
        console.warn('[Supabase] Aviso al eliminar producto:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[Supabase] Excepción/Sin conexión al eliminar producto:', err?.message || String(err));
      return false;
    }
  },

  // Bulk save products to Supabase
  async bulkSaveProducts(products: Product[]): Promise<boolean> {
    try {
      if (!products || products.length === 0) return true;
      const rows = products.map(toSupabaseRow).filter(r => r.id !== '');
      if (rows.length === 0) return true;

      const { error } = await supabase.from('products').upsert(rows);
      if (error) {
        console.warn('[Supabase] Aviso en guardado masivo:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[Supabase] Excepción/Sin conexión en guardado masivo:', err?.message || String(err));
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
