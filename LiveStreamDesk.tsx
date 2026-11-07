import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Radio,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  User,
  Hash,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Receipt,
  Sparkles,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, LiveBooking, LiveBookingStatus } from '../types';

interface LiveStreamDeskProps {
  products: Product[];
  liveBookings: LiveBooking[];
  onAddLiveBooking: (booking: Omit<LiveBooking, 'id' | 'timestamp'>) => void;
  onUpdateStatus: (id: string, newStatus: LiveBookingStatus) => void;
  onSelectCustomerForInvoice: (customerName: string) => void;
}

// Simple Web Audio feedback
const playChime = (type: 'success' | 'alert') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
};

export const LiveStreamDesk: React.FC<LiveStreamDeskProps> = ({
  products,
  liveBookings,
  onAddLiveBooking,
  onUpdateStatus,
  onSelectCustomerForInvoice,
}) => {
  // Search inputs
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Booking fields
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [feedSearch, setFeedSearch] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // List of unique customer names for quick suggestions
  const existingCustomers = useMemo(() => {
    const names = liveBookings.map((b) => b.customerName).filter(Boolean);
    return Array.from(new Set(names));
  }, [liveBookings]);

  // Match products by short code, full code, or name
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return products
      .filter((p) => {
        const idLower = p.id.toLowerCase();
        const shortLower = p.shortCode.toLowerCase();
        const nameLower = p.name.toLowerCase();
        // exact or startsWith short code
        if (shortLower === q || shortLower.startsWith(q) || idLower.includes(q)) return true;
        // matching name
        return nameLower.includes(q);
      })
      .slice(0, 8);
  }, [query, products]);

  // When query changes, if there's an exact shortcode or code match, auto-select
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    // Check exact shortcode match like '113' or 'ACC-0113'
    const exact = products.find(
      (p) =>
        p.shortCode === q ||
        p.id.toLowerCase() === q ||
        `0${p.shortCode}` === q ||
        `00${p.shortCode}` === q
    );
    if (exact) {
      selectProduct(exact);
    }
  }, [query, products]);

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setUnitPrice(p.sellPrice);
    setQuantity(1);
  };

  const handleBooking = (status: LiveBookingStatus) => {
    if (!selectedProduct) {
      alert('يرجى اختيار المنتج أولاً');
      return;
    }
    if (!customerName.trim()) {
      alert('يرجى كتابة اسم العميل (مثال: ام على، شوشو)');
      return;
    }
    if (quantity < 1) {
      alert('الكمية يجب أن تكون 1 على الأقل');
      return;
    }
    if (quantity > selectedProduct.currentStock) {
      playChime('alert');
      alert(`الرصيد المتوفر في المخزون (${selectedProduct.currentStock}) أقل من المطلوب (${quantity})!`);
      return;
    }

    onAddLiveBooking({
      shortCode: selectedProduct.shortCode,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: Number(unitPrice),
      quantity: Number(quantity),
      total: Number(unitPrice) * Number(quantity),
      customerName: customerName.trim(),
      paymentStatus: status,
      packagingStatus: 'جاهز للتجهيز',
      notes: notes.trim(),
    });

    playChime('success');
    if (status === 'تم الدفع') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }

    // Reset inputs for next piece
    setNotes('');
    setQuery('');
    setSelectedProduct(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Filtered live feed
  const filteredFeed = useMemo(() => {
    return liveBookings.filter((item) => {
      if (filterStatus !== 'all' && item.paymentStatus !== filterStatus) return false;
      if (feedSearch) {
        const s = feedSearch.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(s) ||
          item.productName.toLowerCase().includes(s) ||
          item.productId.toLowerCase().includes(s) ||
          item.id.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [liveBookings, filterStatus, feedSearch]);

  // Live stream KPI stats
  const liveStats = useMemo(() => {
    const totalBookings = liveBookings.length;
    const paidList = liveBookings.filter((b) => b.paymentStatus === 'تم الدفع');
    const pendingList = liveBookings.filter((b) => b.paymentStatus === 'حجز مؤقت');
    const paidRevenue = paidList.reduce((acc, b) => acc + b.total, 0);
    const pendingRevenue = pendingList.reduce((acc, b) => acc + b.total, 0);
    const paidPieces = paidList.reduce((acc, b) => acc + b.quantity, 0);
    const uniqueClients = new Set(liveBookings.map((b) => b.customerName)).size;

    return {
      totalBookings,
      paidCount: paidList.length,
      pendingCount: pendingList.length,
      paidRevenue,
      pendingRevenue,
      paidPieces,
      uniqueClients,
    };
  }, [liveBookings]);

  return (
    <div className="space-y-6">
      {/* Top Live Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">مبيعات اللايف المدفوعة</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-400">
              {liveStats.paidRevenue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400">ج.م</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {liveStats.paidCount} قطعة تم تحصيلها وتأكيدها
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">حجوزات معلقة (بانتظار الدفع)</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-400">
              {liveStats.pendingRevenue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400">ج.م</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {liveStats.pendingCount} حجز مؤقت على الهواء
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">عدد القطع المباعة باللايف</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Flame className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{liveStats.paidPieces}</span>
            <span className="text-xs text-slate-400">قطعة تم تسليمها للشحن</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">إجمالي {liveStats.totalBookings} عملية حجز</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">عملاء لايف اليوم</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <User className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{liveStats.uniqueClients}</span>
            <span className="text-xs text-slate-400">عميل نشط</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">تجميع تلقائي لكل قطع العميل</span>
        </div>
      </div>

      {/* Main Interactive Work Area: Fast Booking Controller & Product Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Controller): Rapid Code / Name Search & Booking Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                <h2 className="font-bold text-base text-white">تسجيل حجز فوري في اللايف</h2>
              </div>
              <span className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-md font-mono">
                سرعة فائقة بالرقم
              </span>
            </div>

            {/* Step 1: Rapid Input Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                اكتب رقم القطعة (مثال: 113 أو 87) أو اسم المنتج:
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="مثال: 113 أو ACC-0113 أو هاري بوتر..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-base font-semibold"
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setSelectedProduct(null);
                    }}
                    className="absolute left-3 top-3.5 text-xs text-slate-400 hover:text-white"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Quick Dropdown Suggestions if not yet exact */}
              {!selectedProduct && searchResults.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl mt-1 divide-y divide-slate-800/80 max-h-48 overflow-y-auto z-20">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectProduct(item)}
                      className="w-full text-right px-3 py-2.5 hover:bg-slate-800/80 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-rose-950/60 text-rose-300 rounded border border-rose-900">
                          {item.id}
                        </span>
                        <span className="text-sm text-slate-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-400">{item.sellPrice} ج.م</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            item.currentStock > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          المتاح: {item.currentStock}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Spotlight Card */}
            {selectedProduct && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-rose-500/40 relative space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-rose-600 text-white rounded">
                        {selectedProduct.id}
                      </span>
                      <span className="text-xs text-slate-400">التصنيف: {selectedProduct.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedProduct.name}</h3>
                  </div>

                  {/* Stock Availability Pill */}
                  <div className="text-left">
                    {selectedProduct.currentStock <= 0 ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> نفد المخزون
                      </span>
                    ) : selectedProduct.currentStock <= selectedProduct.reorderLevel ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> متبقي: {selectedProduct.currentStock} قطع فقط!
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> المتاح: {selectedProduct.currentStock} قطعة
                      </span>
                    )}
                  </div>
                </div>

                {/* Reservation Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">اسم العميل (الذي حجز في الكومنت):</label>
                    <input
                      type="text"
                      list="customer-suggestions"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="ام على، شوشو..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                    <datalist id="customer-suggestions">
                      {existingCustomers.map((cust) => (
                        <option key={cust} value={cust} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">سعر البيع الفعلي للقطعة (ج.م):</label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">الكمية المطلوبة:</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold text-white text-base px-2">{quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => Math.min(selectedProduct.currentStock, q + 1))
                        }
                        className="w-8 h-8 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ملاحظات العميل (اختياري):</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="مثال: لون أزرق، ابوياسين..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Total Preview */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400">الإجمالي للحجز:</span>
                  <span className="text-base font-bold text-rose-400">
                    {(unitPrice * quantity).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </span>
                </div>

                {/* Instant Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleBooking('تم الدفع')}
                    disabled={selectedProduct.currentStock <= 0}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم الدفع فوراً</span>
                  </button>

                  <button
                    onClick={() => handleBooking('حجز مؤقت')}
                    disabled={selectedProduct.currentStock <= 0}
                    className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    <span>حجز مؤقت</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Frequent Customer Tags */}
          {existingCustomers.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 block mb-2">عملاء لايف دائمين (اضغط لاختيار الاسم):</span>
              <div className="flex flex-wrap gap-1.5">
                {existingCustomers.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCustomerName(c)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Stream Orders Feed Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>سجل حجوزات اللايف اليوم</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {liveBookings.length} عملية
                </span>
              </h3>
              <p className="text-xs text-slate-400">تحديث فوري للحالة وتجهيز تلقائي لطلبات الشحن</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterStatus('تم الدفع')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'تم الدفع' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                المدفوع ({liveStats.paidCount})
              </button>
              <button
                onClick={() => setFilterStatus('حجز مؤقت')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'حجز مؤقت' ? 'bg-amber-900/60 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                معلق ({liveStats.pendingCount})
              </button>
            </div>
          </div>

          {/* Search feed */}
          <div className="relative">
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="بحث في حجوزات اللايف بالعميل، اسم المنتج، أو الكود..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">رقم الطلب</th>
                  <th className="py-2.5 px-3">العميل</th>
                  <th className="py-2.5 px-3">المنتج</th>
                  <th className="py-2.5 px-3">الكمية</th>
                  <th className="py-2.5 px-3">السعر</th>
                  <th className="py-2.5 px-3">الإجمالي</th>
                  <th className="py-2.5 px-3">الحالة والدفع</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredFeed.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      لا توجد حجوزات مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredFeed.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{item.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <button
                          onClick={() => onSelectCustomerForInvoice(item.customerName)}
                          className="hover:underline hover:text-amber-300 flex items-center gap-1"
                          title="عرض فاتورة العميل المجمعة"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.customerName}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-200">{item.productName}</div>
                        <span className="font-mono text-[10px] text-slate-500">{item.productId}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{item.quantity}</td>
                      <td className="py-2.5 px-3">{item.unitPrice} ج.م</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">
                        {item.total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="py-2.5 px-3">
                        {item.paymentStatus === 'تم الدفع' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> تم الدفع
                          </span>
                        ) : item.paymentStatus === 'حجز مؤقت' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            <Clock className="w-3 h-3" /> حجز مؤقت
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            <XCircle className="w-3 h-3" /> ملغي
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {item.paymentStatus === 'حجز مؤقت' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'تم الدفع')}
                              className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold transition-colors"
                              title="تأكيد الدفع ونقل للتجهيز"
                            >
                              تأكيد الدفع
                            </button>
                          )}

                          {item.paymentStatus !== 'ملغي' && (
                            <button
                              onClick={() => {
                                if (confirm(`إلغاء حجز ${item.productName} للعميل ${item.customerName} وإعادة الكمية للمخزون؟`)) {
                                  onUpdateStatus(item.id, 'ملغي');
                                }
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                              title="إلغاء الحجز"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectCustomerForInvoice(item.customerName)}
                            className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-800"
                            title="فاتورة العميل"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
