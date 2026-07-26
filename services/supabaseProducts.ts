import { supabase } from './supabaseClient';
import { Product } from '../types';
import { db } from '../db';

export function toSupabaseRow(p: Product) {
  return {
    id: p.id,
    barcode: p.barcode || null,
    name: p.name,
    price: Number(p.price) || 0,
    category: p.category || 'Varios',
    image: p.image || '',
    description: p.description || '',
    is_popular: p.isPopular ?? false,
    stock: Number(p.stock) || 0
  };
}

export function fromSupabaseRow(row: any): Product {
  return {
    id: String(row.id),
    barcode: row.barcode || undefined,
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
      console.log('[Supabase] Intentando sincronizar productos desde Supabase...');
      const { data, error } = await supabase.from('products').select('*');
      
      if (error) {
        console.warn('[Supabase] Aviso o error consultando Supabase:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const products = data.map(fromSupabaseRow);
        // Update Dexie local cache
        await db.products.bulkPut(products);
        console.log(`[Supabase] Sincronizados ${products.length} productos desde Supabase a la base local.`);
        return products;
      } else {
        // If Supabase table is empty, push existing local products to Supabase to seed remote DB
        const localProducts = await db.products.toArray();
        if (localProducts.length > 0) {
          console.log('[Supabase] Tabla de productos vacía en Supabase. Subiendo productos locales...');
          const rows = localProducts.map(toSupabaseRow);
          const { error: upsertErr } = await supabase.from('products').upsert(rows);
          if (upsertErr) {
            console.warn('[Supabase] Error al subir catálogo inicial:', upsertErr.message);
          } else {
            console.log('[Supabase] Catálogo inicial subido exitosamente a Supabase.');
          }
        }
        return localProducts;
      }
    } catch (err) {
      console.error('[Supabase] Error conectando con Supabase:', err);
      return [];
    }
  },

  // Save/Upsert a product to Supabase
  async saveProduct(product: Product): Promise<boolean> {
    try {
      const row = toSupabaseRow(product);
      const { error } = await supabase.from('products').upsert(row);
      if (error) {
        console.error('[Supabase] Error al guardar producto:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción al guardar producto:', err);
      return false;
    }
  },

  // Update product in Supabase
  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    try {
      const patchObj: any = {};
      if (updates.name !== undefined) patchObj.name = updates.name;
      if (updates.barcode !== undefined) patchObj.barcode = updates.barcode;
      if (updates.price !== undefined) patchObj.price = updates.price;
      if (updates.category !== undefined) patchObj.category = updates.category;
      if (updates.image !== undefined) patchObj.image = updates.image;
      if (updates.description !== undefined) patchObj.description = updates.description;
      if (updates.isPopular !== undefined) patchObj.is_popular = updates.isPopular;
      if (updates.stock !== undefined) patchObj.stock = updates.stock;

      const { error } = await supabase.from('products').update(patchObj).eq('id', id);
      if (error) {
        console.error('[Supabase] Error al actualizar producto:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción al actualizar producto:', err);
      return false;
    }
  },

  // Delete product from Supabase
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('[Supabase] Error al eliminar producto:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción al eliminar producto:', err);
      return false;
    }
  },

  // Bulk save products to Supabase
  async bulkSaveProducts(products: Product[]): Promise<boolean> {
    try {
      const rows = products.map(toSupabaseRow);
      const { error } = await supabase.from('products').upsert(rows);
      if (error) {
        console.error('[Supabase] Error en guardado masivo:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción en guardado masivo:', err);
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
            } else if (payload.new) {
              const updatedProduct = fromSupabaseRow(payload.new);
              await db.products.put(updatedProduct);
            }
            if (onUpdate) onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.error('[Supabase Realtime] Error al suscribirse:', e);
      return () => {};
    }
  }
};
