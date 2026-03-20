import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Store, Zap, Scan, Calculator, ShoppingCart, LogOut, Search, Filter, X, Smartphone, Wifi, WifiOff, CreditCard, CloudOff, Mail, Phone, MessageCircle, LifeBuoy, Signal, Loader2 } from 'lucide-react';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import POSModal from './components/POSModal';
import CashClosureModal from './components/CashClosureModal';
import SuccessOverlay from './components/SuccessOverlay';
import ServiceRechargeModal from './components/ServiceRechargeModal';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { Product, CartItem, Supplier, AppUser, LoginLog, Sale } from './types';
import { db, initDB } from './db';
import { useLiveQuery } from 'dexie-react-hooks'; // Importante: Asumimos dexie-react-hooks para reactividad fácil, si no, usaremos useEffect

// Lazy Loading de componentes pesados
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const BarcodeScannerModal = React.lazy(() => import('./components/BarcodeScannerModal'));

type UserRole = 'guest' | 'admin' | 'user';

const SERVICES = [
  { 
    id: 'sube', 
    name: 'SUBE', 
    icon: <CreditCard size={48} className="text-blue-600" />,
    color: 'from-blue-600 to-blue-800', 
    placeholder: '6061...', 
    type: 'sube' as const 
  },
  { 
    id: 'claro', 
    name: 'Claro', 
    icon: <Signal size={48} className="text-red-600" />,
    color: 'from-red-600 to-red-800', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
  { 
    id: 'movistar', 
    name: 'Movistar', 
    icon: <Phone size={48} className="text-emerald-500" />,
    color: 'from-emerald-500 to-emerald-700', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
  { 
    id: 'personal', 
    name: 'Personal', 
    icon: <Wifi size={48} className="text-cyan-600" />,
    color: 'from-cyan-500 to-blue-600', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
  { 
    id: 'tuenti', 
    name: 'Tuenti', 
    icon: <MessageCircle size={48} className="text-pink-600" />,
    color: 'from-pink-600 to-fuchsia-600', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
];

const AppContent: React.FC = () => {
  const [role, setRole] = useState<UserRole>('guest');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // Estados locales de datos (sincronizados con DB)
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);

  // Carrito (sigue en localStorage por ser volátil/sesión)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('kiosco_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('VENTA FINALIZADA');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rechargeService, setRechargeService] = useState<typeof SERVICES[0] | null>(null);
  const [cashClosureOpen, setCashClosureOpen] = useState(false);

  // Inicializar DB y Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const [prods, sls, usrs, supps, lgs] = await Promise.all([
          db.products.toArray(),
          db.sales.toArray(),
          db.users.toArray(),
          db.suppliers.toArray(),
          db.logs.toArray()
        ]);
        setProducts(prods);
        setSales(sls);
        setUsers(usrs);
        setSuppliers(supps);
        setLoginLogs(lgs);
      } catch (err) {
        console.error("Error loading DB", err);
      } finally {
        setIsLoadingDB(false);
      }
    };
    loadData();
  }, []);

  // Sync Cart
  useEffect(() => {
    localStorage.setItem('kiosco_cart', JSON.stringify(cart));
  }, [cart]);

  // Funciones CRUD envolventes para actualizar estado y DB
  const refreshProducts = async () => setProducts(await db.products.toArray());
  const refreshUsers = async () => setUsers(await db.users.toArray());
  const refreshSuppliers = async () => setSuppliers(await db.suppliers.toArray());

  // Derived state
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleLogin = async (user: AppUser, device: string) => {
    setRole(user.role === 'admin' ? 'admin' : 'user');
    setCurrentUser(user);
    
    const newLog: LoginLog = {
        id: Date.now().toString(),
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
        device
    };
    await db.logs.add(newLog);
    setLoginLogs(await db.logs.toArray());
  };

  const handleLogout = () => {
    setRole('guest');
    setCurrentUser(null);
    setCart([]);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setSearchTerm('');
    if (searchInputRef.current) {
        searchInputRef.current.value = ''; 
        searchInputRef.current.focus();
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
    
    setSearchTerm('');
    if (searchInputRef.current) {
        searchInputRef.current.value = ''; 
        searchInputRef.current.focus();
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCartCheckout = () => {
    setIsCartOpen(false);
    setIsPOSOpen(true);
  };

  const handleCompleteSale = async (items: CartItem[], total: number, paymentMethod: string) => {
    const newSale: Sale = {
        id: `sale-${Date.now()}`,
        userId: currentUser?.id || 'unknown',
        username: currentUser?.username || 'unknown',
        items: [...items],
        total,
        paymentMethod,
        timestamp: new Date().toISOString()
    };
    
    // Transacción atómica
    await (db as any).transaction('rw', db.sales, db.products, async () => {
      await db.sales.add(newSale);
      for (const item of items) {
        const product = await db.products.get(item.id);
        if (product) {
          await db.products.update(item.id, { stock: product.stock - item.quantity });
        }
      }
    });

    // Actualizar estados locales
    setSales(await db.sales.toArray());
    setProducts(await db.products.toArray());

    setCart([]);
    setIsPOSOpen(false);
    setIsScannerOpen(false);
    setSuccessMessage(paymentMethod === 'transferencia' ? 'PAGO RECIBIDO' : 'VENTA FINALIZADA');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    setTimeout(() => {
        if(searchInputRef.current) {
            searchInputRef.current.value = '';
            searchInputRef.current.focus();
        }
    }, 2100);
  };

  const handleServiceRecharge = async (amount: number, method: string) => {
     const newSale: Sale = {
        id: `service-${Date.now()}`,
        userId: currentUser?.id || 'unknown',
        username: currentUser?.username || 'unknown',
        items: [{
            id: rechargeService?.id || 'service',
            name: `Recarga ${rechargeService?.name}`,
            price: amount,
            quantity: 1,
            category: 'servicios',
            image: '',
            description: 'Recarga virtual',
            stock: 9999
        }],
        total: amount,
        paymentMethod: method,
        timestamp: new Date().toISOString()
     };
     
     await db.sales.add(newSale);
     setSales(await db.sales.toArray());

     setShowSuccess(true);
     setSuccessMessage("RECARGA EXITOSA");
     setTimeout(() => setShowSuccess(false), 2000);
  };

  // --- Handlers para AdminDashboard (Wrappers de DB) ---
  const handleImportProducts = async (newProds: Product[]) => {
      await db.products.bulkPut(newProds);
      await refreshProducts();
  };
  const handleUpdateProduct = async (p: Product) => {
      await db.products.put(p);
      await refreshProducts();
  };
  const handleDeleteProduct = async (id: string) => {
      await db.products.delete(id);
      await refreshProducts();
  };
  
  const handleAddSupplier = async (s: Supplier) => {
      await db.suppliers.add(s);
      await refreshSuppliers();
  };
  const handleUpdateSupplier = async (s: Supplier) => {
      await db.suppliers.put(s);
      await refreshSuppliers();
  };
  const handleDeleteSupplier = async (id: string) => {
      await db.suppliers.delete(id);
      await refreshSuppliers();
  };

  const handleAddUser = async (u: AppUser) => {
      await db.users.add(u);
      await refreshUsers();
  };
  const handleUpdateUser = async (u: AppUser) => {
      await db.users.put(u);
      await refreshUsers();
  };
  const handleDeleteUser = async (id: string) => {
      await db.users.delete(id);
      await refreshUsers();
  };

  if (isLoadingDB) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={40} /></div>;
  }

  if (role === 'guest') {
    return <Login users={users} onLogin={handleLogin} />;
  }

  if (role === 'admin') {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={40} /></div>}>
            <AdminDashboard
                onLogout={handleLogout}
                products={products}
                onImportProducts={handleImportProducts}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                suppliers={suppliers}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                users={users}
                loginLogs={loginLogs}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                sales={sales}
            />
        </Suspense>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPOS={() => setIsPOSOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">
                    Hola, <span className="text-fuchsia-500">{currentUser?.username}</span>
                </h2>
                <button onClick={() => setCashClosureOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors border border-zinc-800">
                    <Calculator size={16} /> CIERRE DE CAJA
                </button>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Search size={20} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                autoComplete="off" 
                placeholder="Escaneá o escribí tu búsqueda..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-fuchsia-500 outline-none shadow-lg shadow-black/20 text-lg transition-all focus:ring-2 focus:ring-fuchsia-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <CategoryFilter
                activeCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                {SERVICES.map(service => (
                    <button
                        key={service.id}
                        onClick={() => setRechargeService(service)}
                        className={`
                            relative h-40 md:h-48 flex flex-col items-center justify-center gap-3 p-4 rounded-[2rem] 
                            border border-zinc-800 hover:border-white/20 transition-all active:scale-95 group overflow-hidden
                            bg-gradient-to-br ${service.color} bg-opacity-10 shadow-lg
                        `}
                    >
                        <div className="absolute inset-0 bg-zinc-900 z-0"></div>
                        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-10 z-0 group-hover:opacity-20 transition-opacity`}></div>
                        
                        <div className="relative z-10 w-full flex-1 flex items-center justify-center">
                             <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl p-3 shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                {service.icon}
                             </div>
                        </div>

                        <span className="relative z-10 text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                            {service.name}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.slice(0, 6).map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        currentQty={cart.find(i => i.id === product.id)?.quantity || 0}
                        onUpdateQuantity={updateQuantity}
                    />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <p className="text-xl font-bold">No se encontraron productos</p>
                    <p className="text-sm text-zinc-500">Prueba buscar otro código o nombre</p>
                </div>
            )}
        </div>
      </main>

       <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 pb-[calc(0.5rem+env(safe-area-inset-bottom))] p-3 z-50 grid grid-cols-2 gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <button 
            onClick={() => setIsPOSOpen(true)} 
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all gap-1 active:scale-95 shadow-lg shadow-emerald-900/30 border border-emerald-500/20"
          >
              <Zap size={26} className="fill-current" />
              <span className="text-xs font-black uppercase tracking-widest">Cobrar</span>
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-all gap-1 active:scale-95 relative shadow-lg shadow-fuchsia-900/30 border border-fuchsia-500/20"
          >
              <div className="relative">
                 <ShoppingCart size={26} className="fill-current" />
                 {cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-white text-fuchsia-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-fuchsia-600 z-10 shadow-sm">
                      {cartCount}
                    </span>
                 )}
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Carrito</span>
          </button>
       </div>

       <Cart
         isOpen={isCartOpen}
         onClose={() => setIsCartOpen(false)}
         items={cart}
         onUpdateQuantity={updateQuantity}
         onRemove={removeFromCart}
         onCheckout={handleCartCheckout}
       />

       <POSModal
         isOpen={isPOSOpen}
         onClose={() => setIsPOSOpen(false)}
         items={cart}
         onCompleteSale={handleCompleteSale}
       />

       <Suspense fallback={null}>
         <BarcodeScannerModal
           isOpen={isScannerOpen}
           onClose={() => setIsScannerOpen(false)}
           allProducts={products}
           onCompleteSale={handleCompleteSale}
         />
       </Suspense>

       <CashClosureModal
         isOpen={cashClosureOpen}
         onClose={() => setCashClosureOpen(false)}
         currentUser={currentUser}
         sales={sales}
       />

       <ServiceRechargeModal
          isOpen={!!rechargeService}
          onClose={() => setRechargeService(null)}
          service={rechargeService}
          onComplete={handleServiceRecharge}
       />

       <SuccessOverlay
         isOpen={showSuccess}
         onClose={() => setShowSuccess(false)}
         message={successMessage}
       />

       <button
         onClick={handleLogout}
         title="Cerrar Sesión"
         className="fixed bottom-28 left-4 lg:left-6 z-40 p-3 lg:p-4 bg-red-500/10 text-red-500 rounded-2xl lg:rounded-full hover:bg-red-500 hover:text-white shadow-lg backdrop-blur-sm border border-red-500/20 transition-all opacity-50 hover:opacity-100"
       >
         <LogOut size={20} />
       </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;