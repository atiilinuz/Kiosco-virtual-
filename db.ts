import Dexie, { Table } from 'dexie';
import { Product, Sale, AppUser, Supplier, LoginLog } from './types';
import { PRODUCTS } from './constants';
import { hashPassword } from './utils';

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

  constructor() {
    super('KioscoLasChicasDB');
    this.version(1).stores({
      products: 'id, barcode, category',
      sales: 'id, timestamp',
      suppliers: 'id',
      users: 'id, username',
      logs: 'id, userId, timestamp'
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
  },
  async updateProduct(id: string, product: Partial<Product>) {
    await db.products.update(id, product);
  },
  async deleteProduct(id: string) {
    await db.products.delete(id);
  },
  async bulkAddProducts(products: Product[]) {
    await db.products.bulkPut(products);
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
  },
  async executeSaleTransaction(newSale: Sale) {
    // 1. Registrar la venta localmente de inmediato
    await db.sales.put(newSale);

    // 2. Descontar stock de cada ítem de manera offline-resiliente
    for (const item of newSale.items) {
      const prod = await db.products.get(item.id);
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
        await db.products.update(item.id, { stock: newStock });
      }
    }
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
  }
};
