
import React, { useState, useRef, useMemo } from 'react';
import { 
  TrendingUp, Users, DollarSign, Package, BarChart3, 
  LogOut, FileUp, FileDown, CheckCircle2, AlertCircle, 
  PlusCircle, Scan, Image as ImageIcon, X, LayoutGrid, 
  User, Shield, Pencil, Trash2, Upload, Tag, AlignLeft, 
  Search, List, Layers, Clock, Smartphone, MapPin, Phone, 
  Download, Layout, Mail, ShieldAlert, Key,
  Barcode, Type, FileText, Camera, Info, HelpCircle, Code2,
  MessageCircle, ExternalLink, LifeBuoy, Zap, ChevronRight,
  MonitorSmartphone, Printer, Calculator, Sparkles,
  FileJson, FileSpreadsheet, ClipboardCheck, MousePointerClick,
  ArrowRight, ShoppingBag, Table, Trophy, Save, Filter, ArrowUpDown, AlertTriangle,
  Sun, Moon, Sunrise, Sunset, Database, HardDriveDownload, HardDriveUpload,
  RefreshCw, Play
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Product, Supplier, AppUser, LoginLog, Sale } from '../types';
import { CATEGORIES } from '../constants';
import { formatCurrency, compressImage, hashPassword } from '../utils';
import { dbService } from '../db';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { jsPDF } from 'jspdf';

interface AdminDashboardProps {
  onLogout: () => void;
  products: Product[];
  onImportProducts: (products: Product[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  users: AppUser[];
  loginLogs: LoginLog[];
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  sales: Sale[];
  isOnline?: boolean;
}

const StatCard = ({ icon, title, value, accent }: any) => {
  const colors = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    fuchsia: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
    violet: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    zinc: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  };
  const color = colors[accent as keyof typeof colors] || colors.zinc;
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4 hover:scale-105 transition-transform shadow-lg">
      <div className={`p-4 rounded-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
};

const DetailedHelpItem = ({ title, icon, steps, example, tip, colorClass, borderClass, bgClass, textClass }: any) => (
  <div className={`
    relative overflow-hidden rounded-[2.5rem] bg-zinc-900/50 backdrop-blur-sm border border-zinc-800
    p-6 md:p-8 h-full flex flex-col group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl
    ${borderClass} hover:border-opacity-60
  `}>
    <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-15 transition-opacity duration-700 ease-out ${bgClass}`} />
    <div className="relative z-10 flex-1">
       <div className="flex items-center gap-4 mb-6">
         <div className={`p-4 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${textClass} shadow-lg`}>
            {icon}
         </div>
         <h3 className="text-xl font-black text-white group-hover:text-zinc-100 transition-colors">{title}</h3>
       </div>
       <ol className="space-y-5 relative">
         <div className={`absolute left-[11px] top-2 bottom-4 w-0.5 bg-zinc-800 group-hover:${bgClass} group-hover:opacity-40 transition-colors duration-500`} />
         {steps.map((step: string, i: number) => (
           <li key={i} className="flex gap-4 text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors relative group/item">
             <span className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center font-black text-[10px] ${textClass} group-hover/item:scale-110 transition-transform duration-300 shadow-md ring-4 ring-zinc-900/50`}>
               {i + 1}
             </span>
             <span className="pt-0.5 leading-relaxed">{step}</span>
           </li>
         ))}
       </ol>
       {example && (
         <div className="mt-8 bg-black/40 p-5 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700 transition-colors relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${bgClass} opacity-50`}></div>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
               <MonitorSmartphone size={12} /> Ejemplo Real
            </p>
            <p className="text-zinc-300 text-xs font-mono bg-zinc-900/50 p-2 rounded-lg border border-white/5">{example}</p>
         </div>
       )}
    </div>
    {tip && (
       <div className={`mt-8 pt-5 border-t border-zinc-800/50 flex gap-3 items-start group-hover:border-${colorClass}/20 transition-colors`}>
         <div className={`p-1.5 rounded-lg bg-${colorClass}/10 ${textClass}`}>
            <Sparkles size={14} className="animate-pulse" />
         </div>
         <p className="text-xs text-zinc-500 leading-relaxed"><span className={`font-bold ${textClass} opacity-80`}>Pro Tip:</span> {tip}</p>
       </div>
    )}
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, 
  products,
  onImportProducts, 
  onUpdateProduct,
  onDeleteProduct,
  suppliers, 
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  users,
  loginLogs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  sales = [],
  isOnline = true
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'suppliers' | 'users' | 'sync' | 'help'>('stats');
  const [editingPendingSale, setEditingPendingSale] = useState<any | null>(null);

  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [inventorySubTab, setInventorySubTab] = useState<'list' | 'manual' | 'excel' | 'json'>('list');
  const [userSubTab, setUserSubTab] = useState<'manage' | 'logs'>('manage');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  
  const [inventorySearch, setInventorySearch] = useState('');
  
  // Sales Table State
  const [salesSearch, setSalesSearch] = useState('');
  const [salesFilterPayment, setSalesFilterPayment] = useState('all');
  const [salesSortConfig, setSalesSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showTopProductsModal, setShowTopProductsModal] = useState(false);
  const [topProductsSearch, setTopProductsSearch] = useState('');
  
  const [manualProduct, setManualProduct] = useState({
    barcode: '', name: '', category: 'golosinas', description: '', price: '', stock: '', image: ''
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '', address: '', phone: '', email: '', description: ''
  });
  const [newUserForm, setNewUserForm] = useState({
    username: '', password: '', role: 'user' as 'admin' | 'user'
  });

  // --- Handlers para Backup y Restore ---
  const handleBackup = async () => {
    try {
      // Obtener datos directamente de IndexedDB (Dexie) para un respaldo 100% completo y seguro
      const allProducts = await db.products.toArray();
      const allSales = await db.sales.toArray();
      const allUsers = await db.users.toArray();
      const allSuppliers = await db.suppliers.toArray();
      const allLogs = await db.logs.toArray();

      const allData = {
        products: allProducts,
        sales: allSales,
        users: allUsers,
        suppliers: allSuppliers,
        logs: allLogs,
        timestamp: new Date().toISOString(),
        version: "2.9.1"
      };
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_kiosco_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error al generar backup: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("ADVERTENCIA: Restaurar un backup SOBREESCRIBIRÁ la base de datos actual. ¿Desea continuar?")) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = JSON.parse(evt.target?.result as string);
          await dbService.restoreDatabase(data);
          alert("Restauración completada. Por favor recargue la página.");
          window.location.reload();
        } catch (err) {
          alert("El archivo de backup es inválido.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Setup styles & colors (fuchsia/indigo look for the PDF headers)
      doc.setFillColor(24, 24, 27); // zinc-900 background block at top
      doc.rect(0, 0, 210, 42, "F");
      
      // Top header border line in fuchsia
      doc.setFillColor(217, 70, 239); 
      doc.rect(0, 40, 210, 2, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Kiosco Digital Las Chicas", 15, 18);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.text("Reporte Completo de Productos Más Vendidos", 15, 26);
      doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 15, 32);
      
      // Report Content
      doc.setTextColor(24, 24, 27);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RANKING DE VENTAS GENERAL", 15, 54);
      
      // Draw a line
      doc.setDrawColor(212, 212, 216); // zinc-300
      doc.setLineWidth(0.5);
      doc.line(15, 57, 195, 57);
      
      // Draw table headers
      doc.setFillColor(244, 244, 245); // zinc-100
      doc.rect(15, 62, 180, 8, "F");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(63, 63, 70); // zinc-700
      doc.text("POS", 18, 67);
      doc.text("PRODUCTO", 35, 67);
      doc.text("CANT. VENDIDA", 120, 67);
      doc.text("INGRESOS ESTIMADOS", 160, 67);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(39, 39, 42); // zinc-800
      let y = 77;
      
      const listToPrint = statsCalculations.allSoldProducts.slice(0, 15);
      
      listToPrint.forEach((prod, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          // Redraw headers on new page
          doc.setFillColor(244, 244, 245);
          doc.rect(15, y - 5, 180, 8, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(63, 63, 70);
          doc.text("POS", 18, y);
          doc.text("PRODUCTO", 35, y);
          doc.text("CANT. VENDIDA", 120, y);
          doc.text("INGRESOS ESTIMADOS", 160, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(39, 39, 42);
          y += 10;
        }
        
        // Alternate rows background
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y - 5, 180, 7, "F");
        }
        
        doc.text(`#${index + 1}`, 18, y);
        doc.text(prod.name.substring(0, 42), 35, y);
        doc.text(String(prod.qty), 125, y);
        doc.text(formatCurrency(prod.total), 160, y);
        
        y += 8;
      });

      // Draw simple embedded visual chart of Top 5 at the end
      if (y + 50 <= 270) {
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(24, 24, 27);
        doc.text("GRÁFICO: TOP 5 PRODUCTOS MÁS VENDIDOS (UNIDADES)", 15, y);
        y += 4;
        doc.setDrawColor(212, 212, 216);
        doc.line(15, y, 195, y);
        y += 10;
        
        const top5 = statsCalculations.allSoldProducts.slice(0, 5);
        const maxQty = top5[0]?.qty || 1;
        
        top5.forEach((prod, idx) => {
          const barWidth = (prod.qty / maxQty) * 110; // scale to max width 110mm
          doc.setFillColor(168, 85, 247); // purple-500 color bar
          doc.rect(55, y - 4, barWidth, 4.5, "F");
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(63, 63, 70);
          doc.text(prod.name.substring(0, 22), 15, y);
          
          doc.setFont("helvetica", "normal");
          doc.text(`${prod.qty} uds`, 55 + barWidth + 3, y);
          y += 7.5;
        });
      }
      
      doc.save(`top_ventas_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      alert("Error generating PDF: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleApiKeySave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    alert("API Key guardada localmente.");
  };

  // --- Handler de imagen con compresión ---
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        if (isEdit && editingProduct) {
           setEditingProduct({ ...editingProduct, image: compressedBase64 });
        } else {
          setManualProduct(prev => ({ ...prev, image: compressedBase64 }));
        }
      } catch (e) {
        alert("Error al procesar la imagen");
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      if (editingProduct.price < 0 || editingProduct.stock < 0) {
        alert("El precio y el stock no pueden ser negativos.");
        return;
      }
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      if (statsPeriod === 'day') return saleDate.toDateString() === now.toDateString();
      if (statsPeriod === 'week') return saleDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    });
  }, [sales, statsPeriod]);

  const statsCalculations = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const orders = filteredSales.length;
    const averageTicket = orders > 0 ? revenue / orders : 0;
    const productSales: Record<string, { name: string; qty: number; total: number; image: string }> = {};

    const salesByTime = [
      { id: '0-6', label: 'Madrugada (0-6)', min: 0, max: 6, icon: Moon, count: 0, total: 0, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      { id: '6-12', label: 'Mañana (6-12)', min: 6, max: 12, icon: Sunrise, count: 0, total: 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { id: '12-18', label: 'Tarde (12-18)', min: 12, max: 18, icon: Sun, count: 0, total: 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
      { id: '18-24', label: 'Noche (18-24)', min: 18, max: 24, icon: Sunset, count: 0, total: 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    // Day of week analysis structure (Dom=0, Lun=1, ...)
    const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const salesByDay = daysMap.map(day => ({ day, total: 0, count: 0 }));

    filteredSales.forEach(sale => {
      // Product Rankings
      sale.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, qty: 0, total: 0, image: item.image };
        }
        productSales[item.id].qty += item.quantity;
        productSales[item.id].total += item.price * item.quantity;
      });

      // Time slots
      const date = new Date(sale.timestamp);
      const hour = date.getHours();
      const timeSlot = salesByTime.find(slot => hour >= slot.min && hour < slot.max);
      if (timeSlot) {
        timeSlot.count += 1;
        timeSlot.total += sale.total;
      }

      // Day of week
      const dayIndex = date.getDay();
      salesByDay[dayIndex].total += sale.total;
      salesByDay[dayIndex].count += 1;
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const allSoldProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty);

    const maxDayTotal = Math.max(...salesByDay.map(d => d.total), 1);
    const bestDay = [...salesByDay].sort((a, b) => b.total - a.total)[0];

    // Comportamiento de ventas por hora durante el día actual
    const hourlySalesToday = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      total: 0,
      count: 0
    }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    sales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      if (saleDate >= todayStart && saleDate <= todayEnd) {
        const hour = saleDate.getHours();
        hourlySalesToday[hour].total += sale.total;
        hourlySalesToday[hour].count += 1;
      }
    });

    // Distribución del catálogo de productos
    const categoryDistribution: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Sin Categoría';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });
    const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    return { 
      revenue, 
      orders, 
      averageTicket, 
      topProducts, 
      allSoldProducts,
      salesByTime, 
      salesByDay, 
      maxDayTotal, 
      bestDay,
      hourlySalesToday,
      categoryData
    };
  }, [filteredSales, sales, products]);

  const processedSales = useMemo(() => {
    let result = [...sales];
    if (salesSearch) {
      const lowerSearch = salesSearch.toLowerCase();
      result = result.filter(s => 
        s.id.toLowerCase().includes(lowerSearch) || 
        s.username.toLowerCase().includes(lowerSearch) ||
        s.items.some(i => i.name.toLowerCase().includes(lowerSearch))
      );
    }
    if (salesFilterPayment !== 'all') {
      result = result.filter(s => s.paymentMethod.toLowerCase().includes(salesFilterPayment.toLowerCase()));
    }
    result.sort((a, b) => {
      let aValue: any = a[salesSortConfig.key as keyof Sale];
      let bValue: any = b[salesSortConfig.key as keyof Sale];
      if (salesSortConfig.key === 'timestamp') {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
      }
      if (aValue < bValue) return salesSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return salesSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [sales, salesSearch, salesFilterPayment, salesSortConfig]);

  const requestSalesSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (salesSortConfig.key === key && salesSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSalesSortConfig({ key, direction });
  };

  const processExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        const newProducts: Product[] = data.map((row: any, index) => ({
          id: `prod-${Date.now()}-${index}`,
          barcode: row.Codigo || '',
          name: row.Nombre || 'Sin nombre',
          price: Number(row.Precio) || 0,
          category: row.Categoria?.toLowerCase() || 'varios',
          image: row.Imagen || 'https://via.placeholder.com/150',
          description: row.Descripcion || '',
          stock: Number(row.Stock) || 0,
          isPopular: false
        }));
        onImportProducts(newProducts);
        setImportResult({ success: true, count: newProducts.length, message: `Se importaron ${newProducts.length} productos correctamente.` });
      } catch (error) {
        setImportResult({ success: false, count: 0, message: 'Error al procesar el archivo Excel.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const processJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('El JSON debe ser un array de productos.');
        const newProducts: Product[] = data.map((item: any, index) => ({
          id: item.id || `prod-json-${Date.now()}-${index}`,
          barcode: item.barcode || '',
          name: item.name || 'Sin nombre',
          price: Number(item.price) || 0,
          category: item.category || 'varios',
          image: item.image || '',
          description: item.description || '',
          stock: Number(item.stock) || 0,
          isPopular: !!item.isPopular
        }));
        onImportProducts(newProducts);
        setImportResult({ success: true, count: newProducts.length, message: `Se importaron ${newProducts.length} productos desde JSON.` });
      } catch (error) {
        setImportResult({ success: false, count: 0, message: 'Error al leer el archivo JSON. Verifique el formato.' });
      }
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(Number(manualProduct.price) < 0 || Number(manualProduct.stock) < 0) {
        alert("El precio y el stock no pueden ser negativos.");
        return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      ...manualProduct,
      price: Number(manualProduct.price),
      stock: Number(manualProduct.stock),
      isPopular: false
    };
    onImportProducts([newProduct]);
    setManualProduct({ barcode: '', name: '', category: 'golosinas', description: '', price: '', stock: '', image: '' });
    setImportResult({ success: true, count: 1, message: 'Producto agregado manualmente.' });
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplierId) {
      onUpdateSupplier({ id: editingSupplierId, ...supplierForm });
    } else {
      onAddSupplier({ id: `sup-${Date.now()}`, ...supplierForm });
    }
    setSupplierForm({ name: '', address: '', phone: '', email: '', description: '' });
    setEditingSupplierId(null);
    setShowSupplierForm(false);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierForm({ name: supplier.name, address: supplier.address, phone: supplier.phone, email: supplier.email, description: supplier.description });
    setEditingSupplierId(supplier.id);
    setShowSupplierForm(true);
  };

  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashedPassword = await hashPassword(newUserForm.password);
    onAddUser({ 
      id: `user-${Date.now()}`, 
      ...newUserForm, 
      password: hashedPassword,
      createdAt: new Date().toISOString() 
    }); 
    setNewUserForm({ username: '', password: '', role: 'user' });
  };

  const getStockStatusColor = (stock: number) => {
    if (stock < 10) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    if (stock <= 50) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 border-r border-zinc-800 bg-black flex flex-col fixed h-full z-50">
        <div className="p-4 flex flex-col items-center gap-3 border-b border-zinc-900 mb-4 shrink-0">
          <div className="flex items-center text-fuchsia-500" title="Admin Panel">
            <div className="bg-fuchsia-500/10 p-2.5 rounded-xl shrink-0 hover:scale-105 transition-transform">
               <Shield size={22} />
            </div>
          </div>
          {/* Status Indicator (Centered Dot) */}
          <div className="flex items-center justify-center p-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 select-none" title={isOnline ? "En línea" : "Modo Local"}>
            {isOnline ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
            )}
          </div>
        </div>
        
        <nav className="flex-1 space-y-2 px-2.5">
          {[
            { id: 'stats', label: 'Estadísticas', icon: <BarChart3 size={20} /> },
            { id: 'inventory', label: 'Inventario', icon: <Package size={20} /> },
            { id: 'suppliers', label: 'Proveedores', icon: <LayoutGrid size={20} /> },
            { id: 'users', label: 'Usuarios', icon: <Users size={20} /> },
            { id: 'sync', label: 'Base de Datos', icon: <Database size={20} /> },
            { id: 'help', label: 'Config/Ayuda', icon: <LifeBuoy size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-center py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white border border-zinc-800 shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        <div className="p-3.5 border-t border-zinc-900">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 p-4 md:p-8 max-w-[1600px] mx-auto relative">
        
        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                 <h1 className="text-3xl font-black text-white">Panel de Control</h1>
                 <p className="text-zinc-500 mt-1">Resumen de operaciones y rendimiento</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowTopProductsModal(true)}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-xs md:text-sm px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-yellow-900/10 flex items-center gap-2"
                >
                  <Trophy size={16} />
                  PRODUCTOS MÁS VENDIDOS
                </button>
                <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                  {(['day', 'week', 'month'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setStatsPeriod(period)}
                      className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold capitalize transition-all ${
                        statsPeriod === period ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {period === 'day' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                icon={<DollarSign size={24} />} 
                title="Ingresos Totales" 
                value={formatCurrency(statsCalculations.revenue)}
                accent="emerald"
              />
              <StatCard 
                icon={<ShoppingBag size={24} />} 
                title="Ventas Realizadas" 
                value={statsCalculations.orders} 
                accent="fuchsia"
              />
              <StatCard 
                icon={<TrendingUp size={24} />} 
                title="Ticket Promedio" 
                value={formatCurrency(Math.round(statsCalculations.averageTicket))}
                accent="violet"
              />
            </div>

            {/* TOP 5 AND COMPACT CATALOG */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* RANKING CHART (Top 5) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20">
                        <Trophy size={20} />
                      </div>
                      <h3 className="text-lg font-black text-white">Top 5 Más Vendidos</h3>
                    </div>
                    <button
                      onClick={() => setShowTopProductsModal(true)}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1"
                    >
                      <List size={14} />
                      Ver Todo
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {statsCalculations.topProducts.length > 0 ? (
                      statsCalculations.topProducts.map((prod, index) => (
                        <div key={index} className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-zinc-800/50">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-zinc-400 text-black' :
                            index === 2 ? 'bg-orange-700 text-white' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            #{index + 1}
                          </div>
                          <img loading="lazy" src={prod.image || undefined} alt={prod.name} className="w-8 h-8 rounded-lg object-cover bg-zinc-800" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-white truncate">{prod.name}</p>
                            <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                               <div 
                                 className="h-full bg-gradient-to-r from-fuchsia-600 to-violet-600" 
                                 style={{ width: `${(prod.qty / statsCalculations.topProducts[0].qty) * 100}%` }}
                               />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-xs text-white">{prod.qty}</p>
                            <p className="text-[8px] text-zinc-500 uppercase">Uds</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-zinc-600 text-xs">
                        <p>No hay datos suficientes en este período</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* COMPACT CATALOG DISTRIBUTION */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-2 bg-fuchsia-500/10 rounded-xl text-fuchsia-500 border border-fuchsia-500/20">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Distribución de Catálogo</h3>
                      <p className="text-[10px] text-zinc-500">Productos activos por categoría</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {statsCalculations.categoryData.length > 0 ? (
                      statsCalculations.categoryData.map((cat, index) => {
                        const totalProducts = products.length || 1;
                        const percentage = Math.round((cat.value / totalProducts) * 100);
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-zinc-300 capitalize">{cat.name}</span>
                              <span className="text-zinc-500">{cat.value} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-zinc-800/50">
                              <div 
                                className={`h-full bg-gradient-to-r ${
                                  index === 0 ? 'from-fuchsia-500 to-violet-500' :
                                  index === 1 ? 'from-violet-500 to-indigo-500' :
                                  index === 2 ? 'from-indigo-500 to-blue-500' : 'from-zinc-600 to-zinc-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-zinc-600 text-xs">
                        <p>No hay productos en el catálogo</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RECHARTS CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* RENDIMIENTO SEMANAL */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Rendimiento Semanal</h3>
                      <p className="text-[10px] text-zinc-500">
                        Mejor día: <span className="text-white font-bold">{statsCalculations.bestDay?.day || '-'}</span> ({formatCurrency(statsCalculations.bestDay?.total || 0)})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={statsCalculations.salesByDay}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                        labelClassName="text-white font-bold text-xs"
                        formatter={(value: any) => [`$${value}`, 'Ventas']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorWeekly)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* VENTAS POR HORA (HOY) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Ventas por Hora (Hoy)</h3>
                      <p className="text-[10px] text-zinc-500">Flujo transaccional en tiempo real</p>
                    </div>
                  </div>
                </div>

                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={statsCalculations.hourlySalesToday.filter((h) => {
                        const hrNum = parseInt(h.hour);
                        return hrNum >= 8 && hrNum <= 24;
                      })}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                        labelClassName="text-white font-bold text-xs"
                        formatter={(value: any) => [`$${value}`, 'Ingresos']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* TIME BREAKDOWN SECTION */}
            <div className="mt-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6 px-2">
                <Clock size={24} className="text-zinc-500" /> 
                Desglose por Horario
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statsCalculations.salesByTime.map((slot) => (
                  <div key={slot.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-5 flex items-center gap-4 hover:border-zinc-700 transition-all">
                    <div className={`p-4 rounded-2xl ${slot.bg} ${slot.color}`}>
                      <slot.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{slot.label}</p>
                      <p className="text-xl font-black text-white">{formatCurrency(slot.total)}</p>
                      <p className="text-xs text-zinc-500 font-bold mt-1">{slot.count} ventas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
             {/* ... Inventory logic ... */}
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
               <div>
                  <h2 className="text-2xl font-black text-white">Gestión de Inventario</h2>
                  <p className="text-zinc-500">Administra tus productos, precios y stock.</p>
               </div>
               
               <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                 {[
                   { id: 'list', icon: List, label: 'Lista' },
                   { id: 'manual', icon: PlusCircle, label: 'Manual' },
                   { id: 'excel', icon: FileSpreadsheet, label: 'Excel' },
                   { id: 'json', icon: FileJson, label: 'JSON' }
                 ].map(item => (
                   <button
                     key={item.id}
                     onClick={() => setInventorySubTab(item.id as any)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                       inventorySubTab === item.id 
                         ? 'bg-zinc-800 text-white shadow-md' 
                         : 'text-zinc-500 hover:text-white'
                     }`}
                   >
                     <item.icon size={16} />
                     <span className="hidden sm:inline">{item.label}</span>
                   </button>
                 ))}
               </div>
             </div>

             {/* INVENTORY: LIST VIEW */}
             {inventorySubTab === 'list' && (
               <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 overflow-hidden">
                 <div className="flex items-center gap-4 mb-6 bg-black p-3 rounded-2xl border border-zinc-800">
                   <Search size={20} className="text-zinc-500 ml-2" />
                   <input
                     type="text"
                     placeholder="Buscar por nombre o código..."
                     className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600"
                     value={inventorySearch}
                     onChange={(e) => setInventorySearch(e.target.value)}
                   />
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-zinc-800">
                        <tr>
                          <th className="p-4 pl-6">Visual</th>
                          <th className="p-4">Detalle Producto</th>
                          <th className="p-4">Categoría</th>
                          <th className="p-4">Precios (ARS)</th>
                          <th className="p-4">Inventario</th>
                          <th className="p-4 text-right pr-6">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {products
                          .filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.barcode?.includes(inventorySearch))
                          .slice(0, 100) // Virtualization Hack: Limit to 100 items render for speed
                          .map(product => (
                          <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors group">
                             {/* Visual */}
                             <td className="p-4 pl-6 w-20">
                               <img loading="lazy" src={product.image || undefined} className="w-12 h-12 rounded-xl object-cover bg-zinc-800 border border-zinc-800 group-hover:border-zinc-700 transition-colors" alt="" />
                             </td>
                             <td className="p-4">
                               <div className="flex flex-col">
                                 <p className="font-bold text-white text-sm mb-1">{product.name}</p>
                                 <div className="flex items-center gap-2">
                                    <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide">
                                      {product.barcode ? product.barcode.slice(0, 4) : 'CODE'}
                                    </span>
                                 </div>
                               </div>
                             </td>
                             <td className="p-4">
                               <span className="bg-zinc-800/50 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                 {product.category}
                               </span>
                             </td>
                             <td className="p-4">
                               <div className="flex flex-col">
                                 <span className="text-emerald-400 font-black text-base">{formatCurrency(product.price)}</span>
                               </div>
                             </td>
                             <td className="p-4">
                                <div className="flex flex-col gap-1.5 w-32">
                                   <div className="flex justify-between items-baseline">
                                      <span className="text-xs font-bold text-white">{product.stock} u.</span>
                                      <span className="text-[9px] font-bold text-zinc-600 uppercase">Stock</span>
                                   </div>
                                   <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${getStockStatusColor(product.stock)}`} 
                                        style={{ width: `${Math.min(product.stock, 100)}%` }}
                                      />
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 pr-6 text-right">
                               <div className="flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingProduct(product)} className="text-zinc-500 hover:text-white transition-colors">
                                    <Pencil size={18} />
                                  </button>
                                  <button onClick={() => onDeleteProduct(product.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                               </div>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
               </div>
             )}

             {/* INVENTORY: MANUAL ADD */}
             {inventorySubTab === 'manual' && (
                <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Agregar Producto Manualmente</h3>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    {/* ... (Existing manual add form) ... */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Código de Barras</label>
                        <input required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" value={manualProduct.barcode} onChange={e => setManualProduct({...manualProduct, barcode: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Nombre</label>
                        <input required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" value={manualProduct.name} onChange={e => setManualProduct({...manualProduct, name: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Precio</label>
                        <input required type="number" min="0" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" value={manualProduct.price} onChange={e => setManualProduct({...manualProduct, price: e.target.value})} />
                      </div>
                       <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Stock</label>
                        <input required type="number" min="0" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" value={manualProduct.stock} onChange={e => setManualProduct({...manualProduct, stock: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Categoría</label>
                      <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" value={manualProduct.category} onChange={e => setManualProduct({...manualProduct, category: e.target.value})}>
                        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Imagen (Se comprimirá automáticamente)</label>
                      <div className="flex gap-2">
                         <input className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" placeholder="https://..." value={manualProduct.image} onChange={e => setManualProduct({...manualProduct, image: e.target.value})} />
                         <label className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl cursor-pointer">
                            <Upload size={20} />
                            <input type="file" hidden accept="image/*" onChange={(e) => handleImageFileChange(e, false)} />
                         </label>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-4 rounded-xl mt-4">GUARDAR PRODUCTO</button>
                  </form>
                </div>
             )}
             
             {/* Excel/JSON Import */}
             {(inventorySubTab === 'excel' || inventorySubTab === 'json') && (
                <div className="max-w-xl mx-auto space-y-8 py-10">
                   <div className="text-center">
                      <div className="mx-auto w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 mb-6">
                         {inventorySubTab === 'excel' ? <FileSpreadsheet size={40} className="text-emerald-500" /> : <FileJson size={40} className="text-yellow-500" />}
                      </div>
                      <h3 className="text-2xl font-black text-white">Importar desde {inventorySubTab === 'excel' ? 'Excel' : 'JSON'}</h3>
                      <p className="text-zinc-500 mt-2">Selecciona tu archivo para actualizar el catálogo masivamente.</p>
                   </div>
                   <label className="block w-full border-2 border-dashed border-zinc-800 rounded-3xl p-10 hover:border-fuchsia-500/50 hover:bg-zinc-900/50 transition-all cursor-pointer group text-center">
                      <Upload className="mx-auto text-zinc-600 group-hover:text-fuchsia-500 mb-4 transition-colors" size={40} />
                      <span className="font-bold text-zinc-400 group-hover:text-white">Haz click para seleccionar archivo</span>
                      <input 
                        type="file" 
                        hidden 
                        accept={inventorySubTab === 'excel' ? ".xlsx, .xls" : ".json"} 
                        onChange={inventorySubTab === 'excel' ? processExcel : processJSON} 
                      />
                   </label>
                </div>
             )}
          </div>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6 animate-fade-in">
             {/* ... Suppliers content (unchanged logic) ... */}
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">Proveedores</h2>
                <button onClick={() => setShowSupplierForm(!showSupplierForm)} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                  {showSupplierForm ? <X size={18}/> : <PlusCircle size={18}/>}
                  {showSupplierForm ? 'Cancelar' : 'Nuevo Proveedor'}
                </button>
             </div>
             {showSupplierForm && (
               <form onSubmit={handleSupplierSubmit} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
                  <h3 className="font-bold text-white mb-4">{editingSupplierId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Nombre Empresa" className="bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                    <input placeholder="Teléfono" className="bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                    <input placeholder="Email" className="bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
                    <input placeholder="Dirección" className="bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
                  </div>
                  <textarea placeholder="Notas adicionales..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none h-24" value={supplierForm.description} onChange={e => setSupplierForm({...supplierForm, description: e.target.value})} />
                  <button type="submit" className="bg-white text-black font-black px-6 py-3 rounded-xl hover:bg-zinc-200">GUARDAR</button>
               </form>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {suppliers.map(sup => (
                 <div key={sup.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                        <LayoutGrid size={24} />
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleEditSupplier(sup)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><Pencil size={16}/></button>
                         <button onClick={() => onDeleteSupplier(sup.id)} className="p-2 hover:bg-red-500/20 rounded-full text-zinc-500 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{sup.name}</h3>
                    <div className="space-y-2 text-sm text-zinc-400">
                       <p className="flex items-center gap-2"><Phone size={14}/> {sup.phone || '-'}</p>
                       <p className="flex items-center gap-2"><Mail size={14}/> {sup.email || '-'}</p>
                       <p className="flex items-center gap-2"><MapPin size={14}/> {sup.address || '-'}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex gap-4 border-b border-zinc-800 pb-4">
                <button onClick={() => setUserSubTab('manage')} className={`pb-2 px-2 font-bold ${userSubTab === 'manage' ? 'text-fuchsia-500 border-b-2 border-fuchsia-500' : 'text-zinc-500'}`}>Gestionar Usuarios</button>
                <button onClick={() => setUserSubTab('logs')} className={`pb-2 px-2 font-bold ${userSubTab === 'logs' ? 'text-fuchsia-500 border-b-2 border-fuchsia-500' : 'text-zinc-500'}`}>Registros de Acceso</button>
             </div>

             {userSubTab === 'manage' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] h-fit">
                     <h3 className="font-bold text-white mb-6">Crear Nuevo Usuario</h3>
                     <form onSubmit={handleNewUserSubmit} className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-zinc-500 uppercase">Usuario</label>
                           <input required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-zinc-500 uppercase">Contraseña</label>
                           <input required type="password" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-zinc-500 uppercase">Rol</label>
                           <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})}>
                             <option value="user">Vendedor (User)</option>
                             <option value="admin">Administrador</option>
                           </select>
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-black py-3 rounded-xl hover:bg-zinc-200 mt-2">CREAR USUARIO</button>
                     </form>
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                     {users.map(user => (
                       <div key={user.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${user.role === 'admin' ? 'bg-fuchsia-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                {user.username.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-bold text-white">{user.username}</p>
                                <p className="text-xs text-zinc-500 font-bold uppercase">{user.role}</p>
                             </div>
                          </div>
                          {user.role !== 'admin' && (
                             <button onClick={() => onDeleteUser(user.id)} className="p-2 bg-zinc-950 text-zinc-500 hover:text-red-500 rounded-lg">
                                <Trash2 size={20} />
                             </button>
                          )}
                       </div>
                     ))}
                  </div>
               </div>
             )}
             {userSubTab === 'logs' && (
               <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-black tracking-widest">
                       <tr>
                         <th className="p-4">Fecha/Hora</th>
                         <th className="p-4">Usuario</th>
                         <th className="p-4">Dispositivo</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                       {[...loginLogs].reverse().map(log => (
                         <tr key={log.id} className="text-sm">
                            <td className="p-4 text-zinc-400">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-4 font-bold text-white">{log.username}</td>
                            <td className="p-4 text-zinc-500">{log.device}</td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
             )}
          </div>
        )}

        {/* SYNC/DATABASE TAB */}
        {activeTab === 'sync' && (
          <div className="space-y-8 animate-fade-in pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-white">Mantenimiento de Base de Datos</h1>
                <p className="text-zinc-500 mt-1">Monitorea estadísticas, realizá copias de seguridad locales e importá/exportá tus datos</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800/50 bg-zinc-900/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Base de Datos Local Activa (IndexedDB)</span>
              </div>
            </header>

            {/* Status Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4 hover:border-zinc-700 transition-all">
                <div className="p-4 rounded-2xl bg-fuchsia-500/10 text-fuchsia-500">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Productos</p>
                  <p className="text-xl font-black text-white">{products.length}</p>
                  <p className="text-xs text-zinc-500 mt-1">Registrados en inventario</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4 hover:border-zinc-700 transition-all">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Ventas Totales</p>
                  <p className="text-xl font-black text-white">{sales.length}</p>
                  <p className="text-xs text-zinc-500 mt-1">Registradas en el historial</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4 hover:border-zinc-700 transition-all">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Proveedores</p>
                  <p className="text-xl font-black text-white">{suppliers.length}</p>
                  <p className="text-xs text-zinc-500 mt-1">Registrados</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4 hover:border-zinc-700 transition-all">
                <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Usuarios</p>
                  <p className="text-xl font-black text-white">{users.length}</p>
                  <p className="text-xs text-zinc-500 mt-1">Cuentas con acceso</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card Panel */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black text-white mb-4">Herramientas de Control y Copias de Seguridad</h3>
              <p className="text-zinc-500 text-sm mb-6">Gestioná copias de seguridad manuales en formato JSON para guardar tus datos en tu computadora o celular, restaurar en caso de emergencias, o vaciar tu base de datos local para iniciar un nuevo ciclo.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={handleBackup}
                  className="flex items-center justify-center gap-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white py-4 px-6 rounded-2xl font-bold transition-all"
                >
                  <HardDriveDownload size={20} />
                  DESCARGAR RESPALDO (JSON)
                </button>

                <label 
                  className="flex items-center justify-center gap-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white py-4 px-6 rounded-2xl font-bold transition-all cursor-pointer text-center"
                >
                  <HardDriveUpload size={20} />
                  RESTAURAR RESPALDO (JSON)
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleRestore} 
                    className="hidden" 
                  />
                </label>

                <button 
                  onClick={async () => {
                    if (confirm("ADVERTENCIA CRÍTICA: ¿Estás seguro de que quieres limpiar toda la base de datos local? Se perderán permanentemente todos los productos, ventas, proveedores y usuarios locales.")) {
                      const input = prompt("Escribe 'ELIMINAR' para confirmar la destrucción de los datos locales:");
                      if (input === 'ELIMINAR') {
                        await db.products.clear();
                        await db.sales.clear();
                        await db.suppliers.clear();
                        await db.users.clear();
                        await db.logs.clear();
                        alert("Base de datos local vaciada con éxito. Recargando aplicación...");
                        window.location.reload();
                      }
                    }
                  }}
                  className="flex items-center justify-center gap-3 bg-red-600/15 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white py-4 px-6 rounded-2xl font-bold transition-all"
                >
                  <Trash2 size={20} />
                  VACIAR BASE DE DATOS
                </button>
              </div>
            </div>

            {/* Custom scrollbar styling embedded in page */}
            <style dangerouslySetInnerHTML={{__html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #27272a;
                border-radius: 9999px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #3f3f46;
              }
            `}} />

            {/* Local Database Transactions Registry */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Database size={24} className="text-violet-500" />
                  Registro de Ventas en Memoria Local (Mantenimiento)
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-zinc-950 text-zinc-500 border border-zinc-800">
                  {sales.length} registradas
                </span>
              </div>

              {sales.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800/80 rounded-3xl bg-black/10 flex flex-col items-center justify-center gap-4">
                  <div className="p-4 rounded-full bg-zinc-800 text-zinc-500">
                    <ShoppingBag size={40} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Sin Ventas Registradas</h4>
                    <p className="text-zinc-500 text-sm max-w-sm mx-auto">No hay ventas registradas en la base de datos local todavía. Realizá ventas en la caja registradora para verlas aquí.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto rounded-2xl border border-zinc-800/60 custom-scrollbar relative">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-zinc-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 pl-6">ID Venta</th>
                        <th className="p-4">Fecha/Hora</th>
                        <th className="p-4">Productos (Desplazable)</th>
                        <th className="p-4">Monto Total</th>
                        <th className="p-4">Vendedor</th>
                        <th className="p-4 text-right pr-6">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-sm bg-black/10">
                      {sales.slice().reverse().map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="p-4 pl-6 font-mono text-xs text-zinc-400">
                            #{item.id.slice(0, 8)}...
                          </td>
                          <td className="p-4">
                            <span className="text-zinc-300 font-bold block">{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span className="text-zinc-600 text-xs font-bold font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                          </td>
                          <td className="p-4 text-zinc-400">
                            <div className="max-w-[280px] max-h-[140px] overflow-y-auto pr-2 py-1 space-y-1.5 custom-scrollbar">
                              {item.items.map((it, idx) => (
                                <div key={idx} className="text-xs leading-tight">
                                  <span className="text-fuchsia-500 font-bold mr-1.5">{it.quantity}x</span> 
                                  <span className="text-zinc-300 font-medium">{it.name}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-black text-white text-base">
                            {formatCurrency(item.total)}
                            <span className="block text-[9px] text-zinc-500 uppercase font-black mt-0.5 tracking-wider">{item.paymentMethod}</span>
                          </td>
                          <td className="p-4 text-zinc-300 font-medium">
                            {item.username}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => setEditingPendingSale(item)}
                                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl hover:border-zinc-700 transition-all"
                                title="Editar detalles de la venta"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta venta del historial local? Esta acción no se puede deshacer.")) {
                                    await db.sales.delete(item.id);
                                    alert("Venta eliminada del historial local.");
                                  }
                                }}
                                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl hover:border-red-900/40 transition-all"
                                title="Eliminar del historial"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SALES DETAIL TABLE SECTION (Search and Filters) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <FileText size={24} className="text-fuchsia-500" /> 
                    Detalle de Ventas Históricas (Búsqueda y Filtros)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Utilizá el buscador para encontrar ventas por ID, vendedor o nombre de producto.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                   <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                      <input 
                        type="text" 
                        placeholder="Buscar ID, Usuario o Producto..." 
                        className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-fuchsia-500 outline-none"
                        value={salesSearch}
                        onChange={(e) => setSalesSearch(e.target.value)}
                      />
                   </div>
                   
                   <div className="relative">
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Filter size={14} /></div>
                     <select 
                       className="w-full md:w-auto bg-black border border-zinc-800 rounded-xl py-2.5 pl-9 pr-8 text-sm text-white focus:border-fuchsia-500 outline-none appearance-none cursor-pointer"
                       value={salesFilterPayment}
                       onChange={(e) => setSalesFilterPayment(e.target.value)}
                     >
                       <option value="all">Todos los Métodos</option>
                       <option value="efectivo">Efectivo</option>
                       <option value="transferencia">Transferencia</option>
                     </select>
                   </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[480px] overflow-y-auto rounded-2xl border border-zinc-800/60 custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-zinc-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 rounded-tl-xl pl-6">ID Venta</th>
                      <th className="p-4">Fecha/Hora</th>
                      <th className="p-4">Usuario</th>
                      <th className="p-4 w-1/3">Productos (Desplazable)</th>
                      <th className="p-4">Pago</th>
                      <th className="p-4 text-right rounded-tr-xl pr-6">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-sm bg-black/10">
                    {processedSales.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="p-8 text-center text-zinc-600 font-medium">No se encontraron ventas con los filtros actuales.</td>
                       </tr>
                    ) : (
                      processedSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4 pl-6 font-mono text-zinc-400 text-xs">#{sale.id.split('-')[1]?.slice(-6) || sale.id.slice(0,6)}</td>
                          <td className="p-4 text-zinc-300">
                            <div>{new Date(sale.timestamp).toLocaleDateString()}</div>
                            <div className="text-xs text-zinc-600 font-medium">{new Date(sale.timestamp).toLocaleTimeString()}</div>
                          </td>
                          <td className="p-4 font-bold text-white">{sale.username}</td>
                          <td className="p-4">
                            <div className="max-w-[280px] max-h-[140px] overflow-y-auto pr-2 py-1 space-y-1.5 custom-scrollbar">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="text-xs leading-tight">
                                  <span className="text-fuchsia-500 font-bold mr-1.5">{item.quantity}x</span> 
                                  <span className="text-zinc-300 font-medium">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                              sale.paymentMethod === 'efectivo' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-violet-500/10 text-violet-500 border-violet-500/20'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-white rounded-tr-xl pr-6">
                            {formatCurrency(sale.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HELP / SETTINGS TAB */}
        {activeTab === 'help' && (
           <div className="space-y-8 animate-fade-in pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Backup Tools */}
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem]">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                       <Database size={24} className="text-blue-500" />
                       Copia de Seguridad
                    </h3>
                    <p className="text-zinc-500 text-sm mb-6">Descarga toda la base de datos para no perder tu información.</p>
                    
                    <div className="space-y-4">
                       <button onClick={handleBackup} className="w-full flex items-center justify-center gap-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white py-4 rounded-xl font-bold transition-all border border-blue-500/20">
                          <HardDriveDownload size={20} />
                          DESCARGAR BACKUP (JSON)
                       </button>
                       <label className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white py-4 rounded-xl font-bold transition-all cursor-pointer">
                          <HardDriveUpload size={20} />
                          RESTAURAR BACKUP
                          <input type="file" hidden accept=".json" onChange={handleRestore} />
                       </label>
                    </div>
                 </div>

                 {/* API Key Config */}
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem]">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                       <Key size={24} className="text-yellow-500" />
                       Configuración API
                    </h3>
                    <p className="text-zinc-500 text-sm mb-6">Configura tu clave de Google Gemini para usar la IA.</p>
                    
                    <div className="space-y-4">
                       <input 
                         type="password" 
                         value={apiKey} 
                         onChange={(e) => setApiKey(e.target.value)} 
                         placeholder="Pegar API Key aquí..."
                         className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-yellow-500/50"
                       />
                       <button onClick={handleApiKeySave} className="w-full bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white py-4 rounded-xl font-bold transition-all border border-yellow-500/20">
                          GUARDAR CLAVE
                       </button>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DetailedHelpItem 
                  title="Soporte Técnico"
                  icon={<MessageCircle size={32}/>}
                  textClass="text-blue-400"
                  bgClass="bg-blue-500"
                  colorClass="blue-500"
                  borderClass="border-blue-500/20"
                  steps={[
                    "Desarrollador: Kedzierski Pablo Andrés",
                    "WhatsApp / Tel: 11 7103-3622",
                    "Email: pablokedzierski@gmail.com",
                    "Horario: Lunes a Viernes 9hs a 18hs"
                  ]}
                  example="WhatsApp: 11 7103-3622"
                  tip="Guarda el número en tus contactos para acceso rápido."
                />
                <DetailedHelpItem 
                  title="Cierre de Caja"
                  icon={<Calculator size={32}/>}
                  textClass="text-orange-400"
                  bgClass="bg-orange-500"
                  colorClass="orange-500"
                  borderClass="border-orange-500/20"
                  steps={[
                    "Ve al inicio y haz click en 'Cierre de Caja' (arriba a la derecha).",
                    "Verifica los totales de efectivo vs transferencia.",
                    "Imprime el ticket de cierre para el administrador."
                  ]}
                  tip="Haz un cierre al finalizar cada turno para mantener las cuentas claras."
                />
             </div>
           </div>
        )}

      </main>

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6">Editar Producto</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs text-zinc-500 font-bold uppercase">Nombre</label>
                       <input className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs text-zinc-500 font-bold uppercase">Precio</label>
                       <input type="number" min="0" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 font-bold uppercase">Código de Barras</label>
                        <input className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={editingProduct.barcode || ''} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 font-bold uppercase">Categoría</label>
                        <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs text-zinc-500 font-bold uppercase">Stock</label>
                    <input type="number" min="0" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs text-zinc-500 font-bold uppercase">Descripción</label>
                    <textarea className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none h-20 resize-none" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs text-zinc-500 font-bold uppercase">Imagen (Comprimida automáticamente)</label>
                    <div className="flex gap-4 items-center">
                       <img src={editingProduct.image || undefined} alt="" className="w-16 h-16 rounded-xl object-cover bg-zinc-800" />
                       <label className="bg-zinc-800 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-zinc-700">
                          Cambiar Imagen
                          <input type="file" hidden accept="image/*" onChange={(e) => handleImageFileChange(e, true)} />
                       </label>
                    </div>
                 </div>
                 <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold">CANCELAR</button>
                    <button type="submit" className="flex-1 py-3 bg-fuchsia-600 text-white rounded-xl font-bold hover:bg-fuchsia-500">GUARDAR CAMBIOS</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL DE PRODUCTOS MÁS VENDIDOS */}
      {showTopProductsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setShowTopProductsModal(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-fade-in text-white z-10 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowTopProductsModal(false)} 
              className="absolute top-6 right-6 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 border border-yellow-500/20">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Productos Más Vendidos</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Listado histórico completo de productos vendidos en total</p>
              </div>
            </div>

            {/* Search and Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 my-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Buscar entre los más vendidos..."
                  value={topProductsSearch}
                  onChange={(e) => setTopProductsSearch(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-yellow-500/50 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleExportPDF}
                className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 active:scale-95 transition-all uppercase tracking-wider"
              >
                <FileText size={16} />
                Exportar Reporte PDF
              </button>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
              {statsCalculations.allSoldProducts.length > 0 ? (
                (() => {
                  const filtered = statsCalculations.allSoldProducts.filter(p =>
                    p.name.toLowerCase().includes(topProductsSearch.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-zinc-600 text-sm">
                        No se encontraron productos coincidentes
                      </div>
                    );
                  }

                  return filtered.map((prod, index) => (
                    <div key={index} className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-zinc-800/50">
                      <div className="w-8 text-center text-xs font-black text-zinc-500">
                        #{index + 1}
                      </div>
                      <img loading="lazy" src={prod.image || undefined} alt={prod.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-800" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{prod.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">Total acumulado: {formatCurrency(prod.total)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-yellow-500">{prod.qty}</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-semibold">Unidades</p>
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="text-center py-12 text-zinc-600 text-sm">
                  Aún no se han registrado ventas de productos
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowTopProductsModal(false)}
              className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Pending Sale Edit Modal */}
      {editingPendingSale && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] w-full max-w-xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Editar Registro de Venta</h3>
              <button onClick={() => setEditingPendingSale(null)} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await db.sales.put({
                ...editingPendingSale,
                total: Number(editingPendingSale.total),
                items: editingPendingSale.items
              });
              setEditingPendingSale(null);
              alert("Venta actualizada con éxito en la base de datos.");
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">ID Venta</label>
                <input disabled className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-3 text-zinc-500 font-mono outline-none cursor-not-allowed" value={editingPendingSale.id} />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Método de Pago</label>
                <select 
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500" 
                  value={editingPendingSale.paymentMethod}
                  onChange={e => setEditingPendingSale({
                    ...editingPendingSale,
                    paymentMethod: e.target.value
                  })}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Monto Total ($)</label>
                <input 
                  type="number"
                  min="0"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500 font-bold" 
                  value={editingPendingSale.total}
                  onChange={e => setEditingPendingSale({
                    ...editingPendingSale,
                    total: Number(e.target.value)
                  })}
                />
              </div>

              {/* Items List inside Edit Modal */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Productos Vendidos</label>
                <div className="bg-black/55 rounded-xl border border-zinc-800/80 p-4 max-h-40 overflow-y-auto space-y-2">
                  {editingPendingSale.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300">
                        <span className="text-fuchsia-500 font-bold">{item.quantity}x</span> {item.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">{formatCurrency(item.price * item.quantity)}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const newItems = [...editingPendingSale.items];
                            newItems.splice(idx, 1);
                            const newTotal = newItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
                            setEditingPendingSale({
                              ...editingPendingSale,
                              items: newItems,
                              total: newTotal
                            });
                          }}
                          className="text-red-400 hover:text-red-500 transition-all"
                          title="Eliminar producto de la venta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {editingPendingSale.items.length === 0 && (
                    <p className="text-zinc-600 text-xs text-center italic">Sin productos en la venta</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEditingPendingSale(null)} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold">CANCELAR</button>
                <button type="submit" className="flex-1 py-3 bg-fuchsia-600 text-white rounded-xl font-bold hover:bg-fuchsia-500">GUARDAR CAMBIOS</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
