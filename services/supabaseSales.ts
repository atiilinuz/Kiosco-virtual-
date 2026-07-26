import { supabase } from './supabaseClient';
import { Sale } from '../types';
import { db } from '../db';

export function toSupabaseSaleRow(s: Sale) {
  return {
    id: s.id,
    user_id: s.userId || 'system',
    user_name: s.username || s.userName || 'Usuario',
    items: s.items || [],
    total: Number(s.total) || 0,
    payment_method: s.paymentMethod || 'efectivo',
    paid_amount: Number(s.paidAmount) || 0,
    change: Number(s.change) || 0,
    created_at: s.timestamp || s.createdAt || new Date().toISOString()
  };
}

export function fromSupabaseSaleRow(row: any): Sale {
  const ts = String(row.created_at || row.createdAt || row.timestamp || new Date().toISOString());
  const uname = String(row.user_name || row.userName || row.username || 'Usuario');
  return {
    id: String(row.id),
    userId: String(row.user_id || row.userId || 'system'),
    username: uname,
    userName: uname,
    items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
    total: Number(row.total) || 0,
    paymentMethod: (row.payment_method || row.paymentMethod || 'efectivo') as 'efectivo' | 'transferencia',
    paidAmount: Number(row.paid_amount || row.paidAmount || 0),
    change: Number(row.change) || 0,
    timestamp: ts,
    createdAt: ts
  };
}

export const supabaseSalesService = {
  // Push a single sale to Supabase
  async saveSale(sale: Sale): Promise<boolean> {
    try {
      const row = toSupabaseSaleRow(sale);
      const { error } = await supabase.from('sales').upsert(row);
      if (error) {
        console.warn('[Supabase Sales] Aviso al guardar venta:', error.message);
        return false;
      }
      console.log(`[Supabase Sales] Venta ${sale.id} sincronizada en Supabase.`);
      return true;
    } catch (err) {
      console.error('[Supabase Sales] Error guardando venta:', err);
      return false;
    }
  },

  // Download remote sales from Supabase to local Dexie DB
  async syncSalesFromSupabase(): Promise<Sale[]> {
    try {
      console.log('[Supabase Sales] Sincronizando ventas desde Supabase...');
      const { data, error } = await supabase.from('sales').select('*');
      
      if (error) {
        console.warn('[Supabase Sales] Aviso al traer ventas de Supabase:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const sales = data.map(fromSupabaseSaleRow);
        await db.sales.bulkPut(sales);
        console.log(`[Supabase Sales] ${sales.length} ventas descargadas desde Supabase a la base local.`);
        return sales;
      } else {
        // Push local sales to Supabase if Supabase sales table is empty
        const localSales = await db.sales.toArray();
        if (localSales.length > 0) {
          const rows = localSales.map(toSupabaseSaleRow);
          const { error: upsertErr } = await supabase.from('sales').upsert(rows);
          if (upsertErr) {
            console.warn('[Supabase Sales] Aviso al subir ventas locales iniciales:', upsertErr.message);
          } else {
            console.log(`[Supabase Sales] ${localSales.length} ventas locales iniciales subidas a Supabase.`);
          }
        }
        return localSales;
      }
    } catch (err) {
      console.error('[Supabase Sales] Error en syncSalesFromSupabase:', err);
      return [];
    }
  },

  // Subscribe to real-time sale creations or updates from other clients/devices
  subscribeToSales(onUpdate?: () => void) {
    try {
      const channel = supabase
        .channel('public:sales')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          async (payload) => {
            console.log('[Supabase Sales Realtime] Evento recibido:', payload.eventType);
            if (payload.eventType === 'DELETE' && payload.old?.id) {
              await db.sales.delete(String(payload.old.id));
            } else if (payload.new) {
              const remoteSale = fromSupabaseSaleRow(payload.new);
              await db.sales.put(remoteSale);
            }
            if (onUpdate) onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.error('[Supabase Sales Realtime] Error al suscribirse:', e);
      return () => {};
    }
  }
};
