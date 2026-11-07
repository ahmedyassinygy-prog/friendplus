import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { LiveStreamDesk } from './components/LiveStreamDesk';
import { StorePos } from './components/StorePos';
import { OrderPackaging } from './components/OrderPackaging';
import { InventoryManager } from './components/InventoryManager';
import { DailyClosingView } from './components/DailyClosingView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { InvoiceModal } from './components/InvoiceModal';
import { BusinessGuideModal } from './components/BusinessGuideModal';

import {
  Product,
  StoreSale,
  LiveBooking,
  PurchaseItem,
  DailyClosingRecord,
  PackagingStatus,
  LiveBookingStatus,
  CustomerOrderSummary,
} from './types';

import {
  loadStoredData,
  saveToStorage,
  clearAndResetStorage,
  STORAGE_KEYS,
} from './services/storage';

import { initAuth, googleSignIn, logout } from './services/firebaseAuth';

export default function App() {
  // Load persisted initial data
  const initial = useMemo(() => loadStoredData(), []);

  const [products, setProducts] = useState<Product[]>(initial.products);
  const [sales, setSales] = useState<StoreSale[]>(initial.sales);
  const [liveBookings, setLiveBookings] = useState<LiveBooking[]>(initial.liveBookings);
  const [purchases, setPurchases] = useState<PurchaseItem[]>(initial.purchases);
  const [dailyClosings, setDailyClosings] = useState<DailyClosingRecord[]>(initial.dailyClosings);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'live' | 'pos' | 'orders' | 'inventory' | 'closing'>('live');

  // Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<CustomerOrderSummary | null>(null);

  // Google Auth state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuthUser(user);
        setAccessToken(token);
      },
      () => {
        setAuthUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setAuthUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      alert('فشل تسجيل الدخول بحساب Google: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    setAccessToken(null);
  };

  // Synchronized Handlers & Business Logic:

  // 1. Add Live Booking
  const handleAddLiveBooking = (newBookingData: Omit<LiveBooking, 'id' | 'timestamp'>) => {
    const id = `LIVE-${String(liveBookings.length + 1).padStart(4, '0')}`;
    const timestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const newBooking: LiveBooking = {
      ...newBookingData,
      id,
      timestamp,
    };

    // Update stock: deduct the booked quantity
    const updatedProducts = products.map((p) => {
      if (p.id === newBooking.productId) {
        return {
          ...p,
          currentStock: Math.max(0, p.currentStock - newBooking.quantity),
        };
      }
      return p;
    });

    const updatedBookings = [newBooking, ...liveBookings];

    setProducts(updatedProducts);
    setLiveBookings(updatedBookings);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    saveToStorage(STORAGE_KEYS.LIVE, updatedBookings);
  };

  // 2. Update Live Booking Status (e.g. from حجز مؤقت to تم الدفع or ملغي)
  const handleUpdateLiveStatus = (bookingId: string, newStatus: LiveBookingStatus) => {
    const booking = liveBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    let updatedProducts = [...products];

    // If cancelling, return stock to inventory!
    if (newStatus === 'ملغي' && booking.paymentStatus !== 'ملغي') {
      updatedProducts = updatedProducts.map((p) => {
        if (p.id === booking.productId) {
          return {
            ...p,
            currentStock: p.currentStock + booking.quantity,
          };
        }
        return p;
      });
    } else if (booking.paymentStatus === 'ملغي' && newStatus !== 'ملغي') {
      // If re-activating from cancelled, re-deduct
      updatedProducts = updatedProducts.map((p) => {
        if (p.id === booking.productId) {
          return {
            ...p,
            currentStock: Math.max(0, p.currentStock - booking.quantity),
          };
        }
        return p;
      });
    }

    const updatedBookings = liveBookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus: newStatus,
          packagingStatus: newStatus === 'تم الدفع' ? 'جاهز للتجهيز' : b.packagingStatus,
        };
      }
      return b;
    });

    setProducts(updatedProducts);
    setLiveBookings(updatedBookings);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    saveToStorage(STORAGE_KEYS.LIVE, updatedBookings);
  };

  // 3. Add In-Store Direct Sale
  const handleAddStoreSale = (saleData: Omit<StoreSale, 'id' | 'profit' | 'total'>) => {
    const id = `SALE-${String(sales.length + 1).padStart(4, '0')}`;
    const total = saleData.actualPrice * saleData.quantity;
    const profit = (saleData.actualPrice - saleData.costPrice) * saleData.quantity;

    const newSale: StoreSale = {
      ...saleData,
      id,
      total,
      profit,
    };

    // Deduct stock
    const updatedProducts = products.map((p) => {
      if (p.id === newSale.productId) {
        return {
          ...p,
          currentStock: Math.max(0, p.currentStock - newSale.quantity),
        };
      }
      return p;
    });

    const updatedSales = [newSale, ...sales];

    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    saveToStorage(STORAGE_KEYS.SALES, updatedSales);
  };

  // 4. Cancel In-Store Sale (return item)
  const handleCancelSale = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status === 'ملغاة') return;

    // Return stock
    const updatedProducts = products.map((p) => {
      if (p.id === sale.productId) {
        return {
          ...p,
          currentStock: p.currentStock + sale.quantity,
        };
      }
      return p;
    });

    const updatedSales = sales.map((s) => (s.id === saleId ? { ...s, status: 'ملغاة' as const } : s));

    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    saveToStorage(STORAGE_KEYS.SALES, updatedSales);
  };

  // 5. Add Purchase (Restock)
  const handleAddPurchase = (purData: Omit<PurchaseItem, 'id' | 'priceDiff' | 'total'>) => {
    const id = `PUR-${String(purchases.length + 1).padStart(4, '0')}`;
    const total = purData.quantity * purData.newCostPrice;
    const priceDiff = purData.newCostPrice - purData.lastCostPrice;

    const newPurchase: PurchaseItem = {
      ...purData,
      id,
      total,
      priceDiff,
    };

    // Increase stock & update wholesale price
    const updatedProducts = products.map((p) => {
      if (p.id === newPurchase.productId) {
        return {
          ...p,
          currentStock: p.currentStock + newPurchase.quantity,
          costPrice: newPurchase.newCostPrice,
          supplier: newPurchase.supplier || p.supplier,
        };
      }
      return p;
    });

    const updatedPurchases = [newPurchase, ...purchases];

    setProducts(updatedProducts);
    setPurchases(updatedPurchases);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    saveToStorage(STORAGE_KEYS.PURCHASES, updatedPurchases);
  };

  // 6. Update Packaging Status per item
  const handleUpdatePackagingStatus = (bookingId: string, newStatus: PackagingStatus) => {
    const updatedBookings = liveBookings.map((b) =>
      b.id === bookingId ? { ...b, packagingStatus: newStatus } : b
    );
    setLiveBookings(updatedBookings);
    saveToStorage(STORAGE_KEYS.LIVE, updatedBookings);
  };

  // 7. Update Customer Entire Package Status
  const handleUpdateCustomerPackageStatus = (customerName: string, newStatus: PackagingStatus) => {
    const updatedBookings = liveBookings.map((b) =>
      b.customerName === customerName ? { ...b, packagingStatus: newStatus } : b
    );
    setLiveBookings(updatedBookings);
    saveToStorage(STORAGE_KEYS.LIVE, updatedBookings);
  };

  // 8. Add or Update Product
  const handleUpdateProduct = (updatedProduct: Product) => {
    const updatedList = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updatedList);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedList);
  };

  const handleAddProduct = (newProd: Omit<Product, 'id' | 'shortCode'>) => {
    const maxNum = products.reduce((max, p) => {
      const n = parseInt(p.shortCode, 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const nextNum = maxNum + 1;
    const id = `ACC-${String(nextNum).padStart(4, '0')}`;
    const shortCode = String(nextNum);

    const fullProduct: Product = {
      ...newProd,
      id,
      shortCode,
    };

    const updatedList = [fullProduct, ...products];
    setProducts(updatedList);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updatedList);
  };

  // 9. Lock Day (Daily Closing)
  const handleLockDay = (closingRecord: DailyClosingRecord) => {
    const existingIdx = dailyClosings.findIndex((c) => c.date === closingRecord.date);
    let updatedClosings = [...dailyClosings];
    if (existingIdx >= 0) {
      updatedClosings[existingIdx] = closingRecord;
    } else {
      updatedClosings = [closingRecord, ...dailyClosings];
    }
    setDailyClosings(updatedClosings);
    saveToStorage(STORAGE_KEYS.CLOSINGS, updatedClosings);
  };

  // 10. Reset demo data to seed
  const handleResetData = () => {
    if (confirm('هل تريد إعادة تعيين كافة البيانات إلى الحالة الافتراضية للشيت؟')) {
      const reset = clearAndResetStorage();
      setProducts(reset.products);
      setSales(reset.sales);
      setLiveBookings(reset.liveBookings);
      setPurchases(reset.purchases);
      setDailyClosings(reset.dailyClosings);
      alert('تم استعادة البيانات الأصلية بنجاح!');
    }
  };

  // Customer invoice selector from Live desk or Orders tab
  const handleSelectCustomerForInvoice = (customerName: string) => {
    const items = liveBookings.filter(
      (b) => b.customerName === customerName && b.paymentStatus === 'تم الدفع'
    );
    if (items.length === 0) {
      alert(`العميل (${customerName}) ليس لديه طلبات مدفوعة جاهزة للفاتورة حالياً.`);
      return;
    }
    const subtotal = items.reduce((acc, it) => acc + it.total, 0);
    const totalPieces = items.reduce((acc, it) => acc + it.quantity, 0);

    setInvoiceOrder({
      customerName,
      bookings: items,
      totalPieces,
      subtotal,
      discount: 0,
      shippingFee: 0,
      grandTotal: subtotal,
      packagingStatus: items[0]?.packagingStatus || 'جاهز للتجهيز',
      orderNumber: `ORD-${items[0]?.id || '0001'}`,
    });
  };

  // Counts for navbar badges
  const liveCount = liveBookings.filter((b) => b.paymentStatus === 'حجز مؤقت').length;
  const paidOrdersCount = new Set(
    liveBookings.filter((b) => b.paymentStatus === 'تم الدفع').map((b) => b.customerName)
  ).size;
  const lowStockCount = products.filter(
    (p) => p.currentStock <= p.reorderLevel
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        liveCount={liveCount}
        ordersCount={paidOrdersCount}
        lowStockCount={lowStockCount}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onResetData={handleResetData}
        isSheetsConnected={Boolean(accessToken)}
        userEmail={authUser?.email}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {activeTab === 'live' && (
          <LiveStreamDesk
            products={products}
            liveBookings={liveBookings}
            onAddLiveBooking={handleAddLiveBooking}
            onUpdateStatus={handleUpdateLiveStatus}
            onSelectCustomerForInvoice={handleSelectCustomerForInvoice}
          />
        )}

        {activeTab === 'pos' && (
          <StorePos
            products={products}
            sales={sales}
            purchases={purchases}
            onAddSale={handleAddStoreSale}
            onCancelSale={handleCancelSale}
            onAddPurchase={handleAddPurchase}
          />
        )}

        {activeTab === 'orders' && (
          <OrderPackaging
            liveBookings={liveBookings}
            onUpdatePackagingStatus={handleUpdatePackagingStatus}
            onUpdateCustomerPackageStatus={handleUpdateCustomerPackageStatus}
            onOpenInvoiceModal={(order) => setInvoiceOrder(order)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
          />
        )}

        {activeTab === 'closing' && (
          <DailyClosingView
            sales={sales}
            liveBookings={liveBookings}
            closings={dailyClosings}
            onLockDay={handleLockDay}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>نظام سَنَد الذكي لإدارة مبيعات المحل ولايف التيك توك والمخزون — تم الدمج والمزامنة مع Google Sheets 🚀</p>
      </footer>

      {/* Modals */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        userEmail={authUser?.email}
        accessToken={accessToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        products={products}
        sales={sales}
        liveBookings={liveBookings}
        dailyClosings={dailyClosings}
      />

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />

      <BusinessGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
