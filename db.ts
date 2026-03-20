import Dexie, { Table } from 'dexie';
import { Product, Sale, AppUser, Supplier, LoginLog } from './types';
import { PRODUCTS } from './constants';
import { hashPassword } from './utils';

// Define class for the DB to ensure proper typing and access to Dexie methods like transaction
export class KioscoDB extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  users!: Table<AppUser>;
  suppliers!: Table<Supplier>;
  logs!: Table<LoginLog>;
  settings!: Table<{key: string, value: any}>;

  constructor() {
    super('KioscoLasChicasDB');
    (this as any).version(1).stores({
      products: 'id, barcode, category, name',
      sales: 'id, timestamp, userId, paymentMethod',
      users: 'id, username',
      suppliers: 'id, name',
      logs: 'id, userId, timestamp',
      settings: 'key'
    });
  }
}

export const db = new KioscoDB();

// Function to initialize default data
export const initDB = async () => {
  const productCount = await db.products.count();
  if (productCount === 0) {
    await db.products.bulkAdd(PRODUCTS);
  }

  const userCount = await db.users.count();
  if (userCount === 0) {
    // Default users with hashed passwords
    const adminHash = await hashPassword('123456');
    const userHash = await hashPassword('13579');
    
    await db.users.bulkAdd([
      { id: '1', username: 'Admin', password: adminHash, role: 'admin', createdAt: new Date().toISOString() },
      { id: '2', username: 'Prueba', password: userHash, role: 'user', createdAt: new Date().toISOString() },
    ]);
  }
};