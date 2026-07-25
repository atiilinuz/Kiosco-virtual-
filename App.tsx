import React, { useState, useMemo, useRef, useEffect, Suspense, useCallback } from 'react';
import { Store, Zap, Scan, Calculator, ShoppingCart, LogOut, Search, Filter, X, Smartphone, Wifi, WifiOff, CreditCard, CloudOff, Mail, Phone, MessageCircle, LifeBuoy, Signal, Loader2, AlertCircle, CheckCircle2, RefreshCw, Keyboard, KeyboardOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { syncQueue } from './syncQueue';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import ErrorBoundary from './components/ErrorBoundary';
import { Product, CartItem, Supplier, AppUser, LoginLog, Sale } from './types';
import { db, initDB, dbService, auth, handleFirestoreError, OperationType } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { playAddSound, playSuccessSound } from './audio';

// Lazy Loading de componentes pesados
const POSModal = React.lazy(() => import('./components/POSModal'));
const CashClosureModal = React.lazy(() => import('./components/CashClosureModal'));
const SuccessOverlay = React.lazy(() => import('./components/SuccessOverlay'));
const ServiceRechargeModal = React.lazy(() => import('./components/ServiceRechargeModal'));
const Login = React.lazy(() => import('./components/Login'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const BarcodeScannerModal = React.lazy(() => import('./components/BarcodeScannerModal'));

type UserRole = 'guest' | 'admin' | 'user';

const SERVICES = [
  { 
    id: 'sube', 
    name: 'SUBE', 
    icon: <CreditCard size={24} className="text-blue-600" />,
    color: 'from-blue-600 to-blue-800', 
    placeholder: '6061...', 
    type: 'sube' as const 
  },
  { 
    id: 'claro', 
    name: 'Claro', 
    icon: <Signal size={24} className="text-red-600" />,
    color: 'from-red-600 to-red-800', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
  { 
    id: 'movistar', 
    name: 'Movistar', 
    icon: <Phone size={24} className="text-emerald-500" />,
    color: 'from-emerald-500 to-emerald-700', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
  { 
    id: 'personal', 
    name: 'Personal', 
    icon: <Wifi size={24} className="text-cyan-600" />,
    color: 'from-cyan-500 to-blue-600', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
  { 
    id: 'tuenti', 
    name: 'Tuenti', 
    icon: <MessageCircle size={24} className="text-pink-600" />,
    color: 'from-pink-600 to-fuchsia-600', 
    placeholder: '11...', 
    type: 'tel' as const 
  },
];

const AppContent: React.FC = () => {
  const [role, setRole] = useState<UserRole>('guest');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // Estados locales de datos (reactivos con Dexie)
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const sales = useLiveQuery(() => db.sales.toArray()) ?? [];
  const users = useLiveQuery(() => db.users.toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const loginLogs = useLiveQuery(() => db.logs.toArray()) ?? [];
  const productLogs = useLiveQuery(() => db.productLogs.toArray()) ?? [];
  const errorLogs = useLiveQuery(() => db.errorLogs.toArray()) ?? [];

  // Carrito (sigue en localStorage por ser volátil/sesión)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('kiosco_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVirtualKeyboardActive, setIsVirtualKeyboardActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('VENTA FINALIZADA');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rechargeService, setRechargeService] = useState<typeof SERVICES[0] | null>(null);
  const [cashClosureOpen, setCashClosureOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotification, setSyncNotification] = useState<{
    show: boolean;
    initialCount: number;
    currentCount: number;
    status: 'syncing' | 'completed' | 'error';
    errorMsg?: string;
  } | null>(null);

  const prevOnlineRef = useRef(navigator.onLine);

  // Suscribirse a la cola de sincronización para actualizar contadores en tiempo real
  useEffect(() => {
    const updateSyncState = async () => {
      const count = await syncQueue.getPendingCount();
      const processing = syncQueue.getIsProcessing();
      setPendingSyncCount(count);
      setIsSyncing(processing);

      setSyncNotification(prev => {
        if (!prev || !prev.show) return prev;
        
        // Si el contador llega a 0 y estábamos sincronizando, marcar como completado
        if (count === 0 && prev.status === 'syncing') {
          return {
            ...prev,
            currentCount: 0,
            status: 'completed'
          };
        }
        
        return {
          ...prev,
          currentCount: count
        };
      });
    };

    updateSyncState();

    const unsubscribe = syncQueue.subscribe(() => {
      updateSyncState();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Controlar eventos online/offline y disparar la notificación persistente
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      
      // Conexión recuperada!
      if (!prevOnlineRef.current) {
        const count = await syncQueue.getPendingCount();
        if (count > 0) {
          setSyncNotification({
            show: true,
            initialCount: count,
            currentCount: count,
            status: 'syncing'
          });
        }
        // Iniciar la sincronización inmediatamente
        syncQueue.processQueue();
      }
      prevOnlineRef.current = true;
    };

    const handleOffline = () => {
      setIsOnline(false);
      prevOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Si la app se monta en línea y ya tiene ítems acumulados pendientes, mostrar notificación
    const checkInitialPending = async () => {
      if (navigator.onLine) {
        const count = await syncQueue.getPendingCount();
        if (count > 0) {
          setSyncNotification({
            show: true,
            initialCount: count,
            currentCount: count,
            status: 'syncing'
          });
          syncQueue.processQueue();
        }
      }
    };
    checkInitialPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capturar errores globales no controlados y registrarlos en la base de datos local
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      dbService.logApplicationError(
        event.message || 'Error desconocido',
        event.error?.stack,
        'error',
        'Global Window',
        currentUser?.id,
        currentUser?.username
      ).catch(err => console.error('Failed to log global error', err));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack : undefined;
      dbService.logApplicationError(
        `Promesa rechazada no controlada: ${message}`,
        stack,
        'error',
        'Global Promise',
        currentUser?.id,
        currentUser?.username
      ).catch(err => console.error('Failed to log global rejection', err));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [currentUser]);

  useEffect(() => {
    // Forzar aparición del botón si es Android y Chrome
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isChrome = /chrome/.test(ua) && !/edge|edg|opr|brave/.test(ua);
    
    if (isAndroid && isChrome) {
      setShowInstallBtn(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si forzamos el botón pero el navegador no disparó el evento (ej. ya está instalada o faltan requisitos),
      // retornamos false para que el Login muestre la guía manual.
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
    return true;
  };

  // Inicializar DB
  useEffect(() => {
    initDB();
    setIsLoadingDB(false);
  }, []);

  // Sync Cart
  useEffect(() => {
    localStorage.setItem('kiosco_cart', JSON.stringify(cart));
  }, [cart]);

  // Funciones obsoletas, eliminadas ya que usamos useLiveQuery

  // Derived state
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(term) ||
                            (p.barcode && p.barcode.includes(term));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleLogin = useCallback(async (user: AppUser, device: string) => {
    setRole(user.role === 'admin' ? 'admin' : 'user');
    setCurrentUser(user);
    
    const newLog: LoginLog = {
        id: Date.now().toString(),
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
        device
    };
    await dbService.addLog(newLog);
  }, []);

  const handleLogout = useCallback(() => {
    setRole('guest');
    setCurrentUser(null);
    setCart([]);
  }, []);

  // Logout admin on visibility change (switching apps)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (currentUser && currentUser.role === 'admin') {
          handleLogout();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, handleLogout]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          return prev;
        }
        playAddSound();
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      playAddSound();
      return [...prev, { ...product, quantity: 1 }];
    });

    setSearchTerm('');
    if (searchInputRef.current) {
        searchInputRef.current.value = ''; 
        searchInputRef.current.focus();
    }
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > item.stock) {
          return { ...item, quantity: item.stock };
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
    
    setSearchTerm('');
    if (searchInputRef.current) {
        searchInputRef.current.value = ''; 
        searchInputRef.current.focus();
    }
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleCartCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsPOSOpen(true);
  }, []);

  const handleCompleteSale = useCallback(async (items: CartItem[], total: number, paymentMethod: string) => {
    const newSale: Sale = {
        id: `sale-${Date.now()}`,
        userId: currentUser?.id || 'unknown',
        username: currentUser?.username || 'unknown',
        items: [...items],
        total,
        paymentMethod,
        timestamp: new Date().toISOString()
    };
    
    // Registrar venta y descontar stock localmente
    try {
      await dbService.executeSaleTransaction(newSale);
      await syncQueue.enqueueSale(newSale);
    } catch (error) {
      console.error("Error registrando la venta:", error);
    }

    setCart([]);
    setIsPOSOpen(false);
    setIsScannerOpen(false);
    setSuccessMessage(paymentMethod === 'transferencia' ? 'PAGO RECIBIDO' : 'VENTA FINALIZADA');
    setShowSuccess(true);
    playSuccessSound();
    setTimeout(() => setShowSuccess(false), 2000);
    
    setTimeout(() => {
        if(searchInputRef.current) {
            searchInputRef.current.value = '';
            searchInputRef.current.focus();
        }
    }, 2100);
  }, [currentUser]);

  const handleServiceRecharge = useCallback(async (amount: number, method: string) => {
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
     
     // Registrar recarga virtual localmente
     try {
       await dbService.executeSaleTransaction(newSale);
       await syncQueue.enqueueSale(newSale);
     } catch (error) {
       console.error("Error registrando la recarga:", error);
     }

     setShowSuccess(true);
     setSuccessMessage("RECARGA EXITOSA");
     setTimeout(() => setShowSuccess(false), 2000);
  }, [currentUser, rechargeService]);

  // --- Handlers para AdminDashboard (Wrappers de DB) ---
  const handleImportProducts = async (newProds: Product[]) => {
      await dbService.bulkAddProducts(newProds);
      
      try {
        const username = currentUser?.username || 'Sistema';
        const userId = currentUser?.id || 'system';
        
        if (newProds.length === 1) {
          const prod = newProds[0];
          await dbService.addProductLog({
            id: `plog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            productId: prod.id,
            productName: prod.name,
            action: 'create',
            userId,
            username,
            timestamp: new Date().toISOString(),
            details: `Producto creado manualmente: ${prod.name} (Precio: $${prod.price}, Stock: ${prod.stock}, Categoría: ${prod.category})`
          });
        } else {
          await dbService.addProductLog({
            id: `plog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            productId: 'bulk',
            productName: 'Importación Masiva',
            action: 'create',
            userId,
            username,
            timestamp: new Date().toISOString(),
            details: `Importación masiva de ${newProds.length} productos en el inventario`
          });
        }
      } catch (e) {
        console.error('Error logging product import:', e);
      }
  };

  const handleUpdateProduct = async (p: Product) => {
      let details = `Producto actualizado`;
      try {
        const prev = await db.products.get(p.id);
        if (prev) {
          const changes: string[] = [];
          if (prev.name !== p.name) changes.push(`Nombre cambiado de "${prev.name}" a "${p.name}"`);
          if (prev.price !== p.price) changes.push(`Precio cambiado de $${prev.price} a $${p.price}`);
          if (prev.stock !== p.stock) changes.push(`Stock cambiado de ${prev.stock} a ${p.stock}`);
          if (prev.category !== p.category) changes.push(`Categoría cambiada de "${prev.category}" a "${p.category}"`);
          if (prev.barcode !== p.barcode) changes.push(`Código de barras cambiado de "${prev.barcode || 'Ninguno'}" a "${p.barcode || 'Ninguno'}"`);
          
          if (changes.length > 0) {
            details = changes.join(', ');
          } else {
            details = `Guardado sin cambios detectados`;
          }
        }
      } catch (e) {
        console.error('Error comparing product states:', e);
      }

      await dbService.updateProduct(p.id, p);

      try {
        await dbService.addProductLog({
          id: `plog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          productId: p.id,
          productName: p.name,
          action: 'update',
          userId: currentUser?.id || 'system',
          username: currentUser?.username || 'Sistema',
          timestamp: new Date().toISOString(),
          details
        });
      } catch (e) {
        console.error('Error logging product update:', e);
      }
  };

  const handleDeleteProduct = async (id: string) => {
      let prodName = 'Desconocido';
      try {
        const prod = await db.products.get(id);
        if (prod) {
          prodName = prod.name;
        }
      } catch (e) {
        console.error('Error retrieving product to delete:', e);
      }

      await dbService.deleteProduct(id);

      try {
        await dbService.addProductLog({
          id: `plog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          productId: id,
          productName: prodName,
          action: 'delete',
          userId: currentUser?.id || 'system',
          username: currentUser?.username || 'Sistema',
          timestamp: new Date().toISOString(),
          details: `Producto eliminado: "${prodName}" (ID: ${id})`
        });
      } catch (e) {
        console.error('Error logging product deletion:', e);
      }
  };
  
  const handleAddSupplier = async (s: Supplier) => {
      await dbService.addSupplier(s);
  };
  const handleUpdateSupplier = async (s: Supplier) => {
      await dbService.updateSupplier(s.id, s);
  };
  const handleDeleteSupplier = async (id: string) => {
      await dbService.deleteSupplier(id);
  };

  const handleAddUser = async (u: AppUser) => {
      await dbService.addUser(u);
  };
  const handleUpdateUser = async (u: AppUser) => {
      await dbService.updateUser(u.id, u);
  };
  const handleDeleteUser = async (id: string) => {
      await dbService.deleteUser(id);
  };

  if (isLoadingDB) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={40} /></div>;
  }

  if (role === 'guest') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={40} /></div>}>
        <Login users={users} onLogin={handleLogin} showInstallBtn={showInstallBtn} onInstallClick={handleInstallClick} isOnline={isOnline} />
      </Suspense>
    );
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
                productLogs={productLogs}
                errorLogs={errorLogs}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                sales={sales}
                isOnline={isOnline}
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
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
      />

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">
                    Hola, <span className="text-fuchsia-500">{currentUser?.username}</span>
                </h2>
                <button 
                    onClick={() => setCashClosureOpen(true)} 
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all border animate-blink-red-green hover:scale-105 active:scale-95"
                    id="btn-cierre-caja"
                >
                    <Calculator size={20} className="animate-pulse" /> CIERRE DE CAJA
                </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Search size={20} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode={isVirtualKeyboardActive ? "text" : "none"}
                  autoComplete="off" 
                  placeholder="Escaneá o escribí tu búsqueda..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-fuchsia-500 outline-none shadow-lg shadow-black/20 text-lg transition-all focus:ring-2 focus:ring-fuchsia-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={() => {
                    if (!isVirtualKeyboardActive) {
                      setIsVirtualKeyboardActive(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      const term = searchTerm.trim().toLowerCase();
                      const exactMatch = products.find(p => p.barcode && p.barcode.toLowerCase() === term) ||
                                         (filteredProducts.length === 1 ? filteredProducts[0] : null);
                      if (exactMatch) {
                        addToCart(exactMatch);
                      }
                    }
                  }}
                />
              </div>

              {/* Botón de control de teclado por debajo de la caja de búsqueda */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isVirtualKeyboardActive) {
                      setIsVirtualKeyboardActive(true);
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                      }, 50);
                    } else {
                      setIsVirtualKeyboardActive(false);
                      searchInputRef.current?.blur();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
                    isVirtualKeyboardActive
                      ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-fuchsia-900/30'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {isVirtualKeyboardActive ? (
                    <>
                      <KeyboardOff size={16} />
                      <span>Ocultar Teclado (Modo Escáner)</span>
                    </>
                  ) : (
                    <>
                      <Keyboard size={16} />
                      <span>Abrir Teclado Táctil</span>
                    </>
                  )}
                </button>

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <X size={14} />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            <CategoryFilter
                activeCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {SERVICES.map(service => (
                    <button
                        key={service.id}
                        onClick={() => setRechargeService(service)}
                        className={`
                            relative h-20 md:h-24 flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl 
                            border border-zinc-800 hover:border-white/20 transition-all active:scale-95 group overflow-hidden
                            bg-gradient-to-br ${service.color} bg-opacity-10 shadow-lg
                        `}
                    >
                        <div className="absolute inset-0 bg-zinc-900 z-0"></div>
                        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-10 z-0 group-hover:opacity-20 transition-opacity`}></div>
                        
                        <div className="relative z-10 w-full flex-1 flex items-center justify-center">
                             <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl p-1.5 shadow-md flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                {service.icon}
                             </div>
                        </div>

                        <span className="relative z-10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
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

       <Suspense fallback={null}>
         <POSModal
           isOpen={isPOSOpen}
           onClose={() => setIsPOSOpen(false)}
           items={cart}
           onCompleteSale={handleCompleteSale}
         />

         <BarcodeScannerModal
           isOpen={isScannerOpen}
           onClose={() => setIsScannerOpen(false)}
           allProducts={products}
           onCompleteSale={handleCompleteSale}
         />

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
       </Suspense>

       <AnimatePresence>
         {syncNotification?.show && (
           <motion.div
             initial={{ opacity: 0, y: 50, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="fixed bottom-24 right-4 z-50 max-w-sm w-full bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden"
           >
             {/* Progress bar tracker */}
             <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
               <motion.div 
                 className={`h-full transition-colors duration-500 ${syncNotification.status === 'completed' ? 'bg-emerald-500' : 'bg-fuchsia-500'}`}
                 initial={{ width: '0%' }}
                 animate={{ 
                   width: syncNotification.initialCount > 0 
                     ? `${((syncNotification.initialCount - syncNotification.currentCount) / syncNotification.initialCount) * 100}%` 
                     : '100%' 
                 }}
                 transition={{ duration: 0.4 }}
               />
             </div>

             <div className="flex gap-4 items-start pt-1">
               {/* Status Indicator Icon */}
               <div className="mt-1 shrink-0">
                 {syncNotification.status === 'syncing' && (
                   <div className="bg-fuchsia-500/10 p-2.5 rounded-2xl text-fuchsia-400">
                     <RefreshCw size={22} className="animate-spin" />
                   </div>
                 )}
                 {syncNotification.status === 'completed' && (
                   <div className="bg-emerald-500/10 p-2.5 rounded-2xl text-emerald-400">
                     <CheckCircle2 size={22} className="animate-bounce" />
                   </div>
                 )}
                 {syncNotification.status === 'error' && (
                   <div className="bg-red-500/10 p-2.5 rounded-2xl text-red-400">
                     <AlertCircle size={22} />
                   </div>
                 )}
               </div>

               {/* Notification Text details */}
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between">
                   <h4 className="text-sm font-black uppercase tracking-wider text-white">
                     {syncNotification.status === 'syncing' && "Sincronizando..."}
                     {syncNotification.status === 'completed' && "Sincronizado"}
                     {syncNotification.status === 'error' && "Error de Sincronización"}
                   </h4>
                   <button 
                     onClick={() => setSyncNotification(null)}
                     className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-zinc-800"
                   >
                     <X size={16} />
                   </button>
                 </div>

                 <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
                   {syncNotification.status === 'syncing' && (
                     <>
                       Se detectó conexión restablecida. Sincronizando{' '}
                       <span className="text-fuchsia-400 font-bold">
                         {syncNotification.initialCount - syncNotification.currentCount}
                       </span>{' '}
                       de{' '}
                       <span className="text-white font-black">
                         {syncNotification.initialCount}
                       </span>{' '}
                       operaciones locales pendientes...
                     </>
                   )}
                   {syncNotification.status === 'completed' && (
                     <>
                       ¡Conexión recuperada con éxito! Se han sincronizado todas las{' '}
                       <span className="text-emerald-400 font-black">
                         {syncNotification.initialCount}
                       </span>{' '}
                       operaciones locales pendientes.
                     </>
                   )}
                   {syncNotification.status === 'error' && (
                     <>
                       Ocurrió un problema al subir algunas operaciones: {syncNotification.errorMsg}
                     </>
                   )}
                 </p>

                 {/* Visual helper showing items queue count */}
                 {syncNotification.status === 'syncing' && (
                   <div className="mt-3 flex gap-2">
                     <span className="text-[10px] font-black uppercase text-zinc-400 bg-black/60 border border-zinc-800/80 px-2.5 py-1 rounded-lg animate-pulse">
                       En Cola: {syncNotification.currentCount} restantes
                     </span>
                   </div>
                 )}
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

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