import Dexie, { Table } from 'dexie';
import { Product, Sale, AppUser, Supplier, LoginLog, ProductLog, ErrorLog, Expense, CustomerAccount, CustomerTransaction } from './types';
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
  expenses!: Table<Expense, string>;
  customers!: Table<CustomerAccount, string>;

  constructor() {
    super('KioscoLasChicasDB');
    this.version(3).stores({
      products: 'id, barcode, category',
      sales: 'id, timestamp',
      suppliers: 'id',
      users: 'id, username',
      logs: 'id, userId, timestamp',
      productLogs: 'id, productId, action, timestamp',
      errorLogs: 'id, timestamp, type',
      expenses: 'id, timestamp, category',
      customers: 'id, name, phone'
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
  // 1. Seed default users first so login always works regardless of network sync status
  try {
    const adminUserExists = await db.users.where('username').equals('admin').first();
    const adminHash = await hashPassword('admin');
    if (!adminUserExists) {
      const adminUser: AppUser = { 
        id: 'admin-seed-' + Date.now(), 
        username: 'admin', 
        password: adminHash, 
        role: 'admin', 
        createdAt: new Date().toISOString() 
      };
      await db.users.put(adminUser);
      console.log('Default admin user seeded successfully.');
    } else {
      await db.users.update(adminUserExists.id, { password: adminHash, role: 'admin' });
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
  } catch (userErr) {
    console.error("Error seeding users:", userErr);
  }

  // 2. Check and seed default products
  try {
    const prodCount = await db.products.count();
    if (prodCount === 0) {
      await db.products.bulkPut(PRODUCTS);
      console.log('Default products seeded successfully.');
    }
  } catch (prodErr) {
    console.error("Error seeding products:", prodErr);
  }

  // 3. Attempt Supabase products and sales synchronization
  try {
    await supabaseProductsService.syncProductsFromSupabase();
    await supabaseSalesService.syncSalesFromSupabase();
  } catch (syncErr) {
    console.warn("Supabase initial sync skipped or offline:", syncErr);
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

  // --- Expenses (Caja Chica) ---
  async addExpense(expense: Expense) {
    await db.expenses.put(expense);
  },
  async deleteExpense(id: string) {
    await db.expenses.delete(id);
  },

  // --- Customers & Fiados ---
  async addCustomer(customer: CustomerAccount) {
    await db.customers.put(customer);
  },
  async updateCustomer(id: string, data: Partial<CustomerAccount>) {
    await db.customers.update(id, data);
  },
  async deleteCustomer(id: string) {
    await db.customers.delete(id);
  },
  async addCustomerTransaction(customerId: string, tx: CustomerTransaction) {
    const cust = await db.customers.get(customerId);
    if (cust) {
      const updatedTxs = [...(cust.transactions || []), tx];
      const newBalance = tx.type === 'debt' ? cust.balance + tx.amount : cust.balance - tx.amount;
      await db.customers.update(customerId, { balance: newBalance, transactions: updatedTxs });
    }
  },

  // --- Sales & Transactions ---
  async addSale(sale: Sale) {
    await db.sales.put(sale);
    await syncQueue.enqueueSale(sale);
  },
  async executeSaleTransaction(newSale: Sale, deductStock = true) {
    // Calcular costo total estimado si no vino especificado
    let costTotal = newSale.costTotal || 0;
    if (!costTotal && newSale.items) {
      costTotal = newSale.items.reduce((sum, item) => {
        const itemCost = typeof item.costPrice === 'number' && item.costPrice > 0 ? item.costPrice : item.price * 0.7;
        return sum + (itemCost * item.quantity);
      }, 0);
    }
    const saleToSave = { ...newSale, costTotal };

    // 1. Registrar la venta localmente de inmediato en Dexie
    await db.sales.put(saleToSave);

    if (deductStock) {
      // 2. Descontar stock de cada ítem (y de sub-ítems si es un Combo/Pack)
      for (const item of newSale.items) {
        const prod = await db.products.get(item.id);
        if (prod) {
          const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
          await db.products.update(item.id, { stock: newStock });

          // Si el producto es un combo, descontar el stock de sus componentes
          if (prod.isCombo && prod.comboItems && prod.comboItems.length > 0) {
            for (const subItem of prod.comboItems) {
              const componentProd = await db.products.get(subItem.productId);
              if (componentProd) {
                const subQtyNeeded = subItem.quantity * item.quantity;
                const subStock = Math.max(0, (componentProd.stock || 0) - subQtyNeeded);
                await db.products.update(subItem.productId, { stock: subStock });
              }
            }
          }
        }
      }
    }

    // 3. Si la venta fue a Cuenta Corriente (Fiado), registrar la deuda en el cliente
    if (newSale.paymentMethod === 'cuenta_corriente' && newSale.customerId) {
      const tx: CustomerTransaction = {
        id: `tx-${Date.now()}`,
        customerId: newSale.customerId,
        type: 'debt',
        amount: newSale.total,
        description: `Compra fiada #${newSale.id.slice(-6)}`,
        timestamp: newSale.timestamp,
        saleId: newSale.id
      };
      await dbService.addCustomerTransaction(newSale.customerId, tx);
    }

    // 4. Encolar / Sincronizar venta e inventarios con Supabase
    await syncQueue.enqueueSale(saleToSave);
  },

  // --- Devoluciones / Anulaciones ---
  async refundSale(saleId: string, reason: string, restoreStock = true) {
    const sale = await db.sales.get(saleId);
    if (!sale || sale.refunded) return;

    await db.sales.update(saleId, { refunded: true, refundReason: reason });

    if (restoreStock && sale.items) {
      for (const item of sale.items) {
        const prod = await db.products.get(item.id);
        if (prod) {
          await db.products.update(item.id, { stock: (prod.stock || 0) + item.quantity });

          if (prod.isCombo && prod.comboItems) {
            for (const subItem of prod.comboItems) {
              const componentProd = await db.products.get(subItem.productId);
              if (componentProd) {
                await db.products.update(subItem.productId, { stock: (componentProd.stock || 0) + (subItem.quantity * item.quantity) });
              }
            }
          }
        }
      }
    }

    // Si fue fiado, revertir el saldo al cliente
    if (sale.paymentMethod === 'cuenta_corriente' && sale.customerId) {
      const tx: CustomerTransaction = {
        id: `tx-refund-${Date.now()}`,
        customerId: sale.customerId,
        type: 'payment',
        amount: sale.total,
        description: `Anulación de compra #${sale.id.slice(-6)}: ${reason}`,
        timestamp: new Date().toISOString(),
        saleId: sale.id
      };
      await dbService.addCustomerTransaction(sale.customerId, tx);
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
    if (data.productLogs && Array.isArray(data.productLogs)) {
      await db.productLogs.clear();
      await db.productLogs.bulkPut(data.productLogs);
    }
    if (data.errorLogs && Array.isArray(data.errorLogs)) {
      await db.errorLogs.clear();
      await db.errorLogs.bulkPut(data.errorLogs);
    }
    if (data.expenses && Array.isArray(data.expenses)) {
      await db.expenses.clear();
      await db.expenses.bulkPut(data.expenses);
    }
    if (data.customers && Array.isArray(data.customers)) {
      await db.customers.clear();
      await db.customers.bulkPut(data.customers);
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

