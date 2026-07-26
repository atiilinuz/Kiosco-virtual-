import Dexie, { Table } from 'dexie';
import { Product, Sale, AppUser, Supplier, LoginLog, ProductLog, ErrorLog } from './types';
import { PRODUCTS } from './constants';
import { hashPassword } from './utils';
import { supabaseProductsService } from './services/supabaseProducts';
import { supabaseSalesService } from './services/supabaseSales';
import { syncQueue } from './syncQueue';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

class KioscoDatabase extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  suppliers!: Table<Supplier, string>;
  users!: Table<AppUser, string>;
  logs!: Table<LoginLog, string>;
  productLogs!: Table<ProductLog, string>;
  errorLogs!: Table<ErrorLog, string>;

  constructor() {
    super('KioscoLasChicasDB');
    this.version(2).stores({
      products: 'id, barcode, category',
      sales: 'id, timestamp',
      suppliers: 'id',
      users: 'id, username',
      logs: 'id, userId, timestamp',
      productLogs: 'id, productId, action, timestamp',
      errorLogs: 'id, timestamp, type'
    });
  }
}

export const db = new KioscoDatabase();

// No-op for Firebase Auth mock compatibility
export const auth = {
  currentUser: {
    uid: 'local-admin',
    email: 'local@laschicas.com',
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: []
  }
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Local Database Error: ', error);
  throw error;
}

// Function to initialize default data
export const initDB = async () => {
  try {
    // Check products
    const prodCount = await db.products.count();
    if (prodCount === 0) {
      await db.products.bulkPut(PRODUCTS);
      console.log('Default products seeded successfully.');
    }

    // Attempt Supabase products and sales synchronization
    await supabaseProductsService.syncProductsFromSupabase();
    await supabaseSalesService.syncSalesFromSupabase();

    // Check users
    const adminUserExists = await db.users.where('username').equals('admin').first();
    if (!adminUserExists) {
      const adminHash = await hashPassword('admin');
      const adminUser: AppUser = { 
        id: 'admin-seed-' + Date.now(), 
        username: 'admin', 
        password: adminHash, 
        role: 'admin', 
        createdAt: new Date().toISOString() 
      };
      await db.users.put(adminUser);
      console.log('Default admin user seeded successfully.');
    }

    const testUserExists = await db.users.where('username').equals('123456').first();
    if (!testUserExists) {
      const testHash = await hashPassword('123456');
      const testUser: AppUser = { 
        id: 'test-seed-' + Date.now(), 
        username: '123456', 
        password: testHash, 
        role: 'user', 
        createdAt: new Date().toISOString() 
      };
      await db.users.put(testUser);
      console.log('Default test user seeded successfully.');
    }
  } catch (error) {
    console.error("Could not seed local database:", error);
  }
};

export const dbService = {
  // --- Products ---
  async addProduct(product: Product) {
    await db.products.put(product);
    const ok = await supabaseProductsService.saveProduct(product);
    if (!ok) {
      await syncQueue.enqueueProductChange(product.id, product, 'upsert');
    }
  },
  async updateProduct(id: string, product: Partial<Product>) {
    await db.products.update(id, product);
    const ok = await supabaseProductsService.updateProduct(id, product);
    if (!ok) {
      await syncQueue.enqueueProductChange(id, product, 'upsert');
    }
  },
  async deleteProduct(id: string) {
    await db.products.delete(id);
    const ok = await supabaseProductsService.deleteProduct(id);
    if (!ok) {
      await syncQueue.enqueueProductChange(id, {}, 'delete');
    }
  },
  async bulkAddProducts(products: Product[]) {
    await db.products.bulkPut(products);
    const ok = await supabaseProductsService.bulkSaveProducts(products);
    if (!ok) {
      for (const p of products) {
        await syncQueue.enqueueProductChange(p.id, p, 'upsert');
      }
    }
  },

  // --- Suppliers ---
  async addSupplier(supplier: Supplier) {
    await db.suppliers.put(supplier);
  },
  async updateSupplier(id: string, supplier: Partial<Supplier>) {
    await db.suppliers.update(id, supplier);
  },
  async deleteSupplier(id: string) {
    await db.suppliers.delete(id);
  },

  // --- Users ---
  async addUser(user: AppUser) {
    await db.users.put(user);
  },
  async updateUser(id: string, user: Partial<AppUser>) {
    await db.users.update(id, user);
  },
  async deleteUser(id: string) {
    await db.users.delete(id);
  },

  // --- Logs ---
  async addLog(log: LoginLog) {
    await db.logs.put(log);
  },

  // --- Sales & Transactions ---
  async addSale(sale: Sale) {
    await db.sales.put(sale);
    await syncQueue.enqueueSale(sale);
  },
  async executeSaleTransaction(newSale: Sale, deductStock = true) {
    // 1. Registrar la venta localmente de inmediato en Dexie
    await db.sales.put(newSale);

    if (deductStock) {
      // 2. Descontar stock de cada ítem localmente
      for (const item of newSale.items) {
        const prod = await db.products.get(item.id);
        if (prod) {
          const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
          await db.products.update(item.id, { stock: newStock });
        }
      }
    }

    // 3. Encolar / Sincronizar venta e inventarios con Supabase
    await syncQueue.enqueueSale(newSale);
  },
  async restoreDatabase(data: any) {
    if (data.products && Array.isArray(data.products)) {
      await db.products.clear();
      await db.products.bulkPut(data.products);
    }
    if (data.sales && Array.isArray(data.sales)) {
      await db.sales.clear();
      await db.sales.bulkPut(data.sales);
    }
    if (data.users && Array.isArray(data.users)) {
      await db.users.clear();
      await db.users.bulkPut(data.users);
    }
    if (data.suppliers && Array.isArray(data.suppliers)) {
      await db.suppliers.clear();
      await db.suppliers.bulkPut(data.suppliers);
    }
    if (data.logs && Array.isArray(data.logs)) {
      await db.logs.clear();
      await db.logs.bulkPut(data.logs);
    }
    if (data.productLogs && Array.isArray(data.productLogs)) {
      await db.productLogs.clear();
      await db.productLogs.bulkPut(data.productLogs);
    }
    if (data.errorLogs && Array.isArray(data.errorLogs)) {
      await db.errorLogs.clear();
      await db.errorLogs.bulkPut(data.errorLogs);
    }
  },

  // --- Product Logs ---
  async addProductLog(log: ProductLog) {
    await db.productLogs.put(log);
  },
  async clearProductLogs() {
    await db.productLogs.clear();
  },

  // --- Error Logs ---
  async addErrorLog(log: ErrorLog) {
    await db.errorLogs.put(log);
  },
  async logApplicationError(message: string, stack?: string, type: 'error' | 'warning' | 'conflict' = 'error', component?: string, userId?: string, username?: string) {
    const log: ErrorLog = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      message,
      stack,
      type,
      component,
      userId,
      username
    };
    await db.errorLogs.put(log);
  },
  async clearErrorLogs() {
    await db.errorLogs.clear();
  }
};
