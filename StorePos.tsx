import React, { useState, useMemo } from 'react';
import {
  Store,
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  User,
  CreditCard,
  Truck,
  RotateCcw,
  AlertCircle,
  FileText,
  Percent,
} from 'lucide-react';
import { Product, StoreSale, PurchaseItem, PaymentMethod, SaleStatus } from '../types';
import { DEFAULT_SELLERS } from '../data/initialData';

interface StorePosProps {
  products: Product[];
  sales: StoreSale[];
  purchases: PurchaseItem[];
  onAddSale: (sale: Omit<StoreSale, 'id' | 'profit' | 'total'>) => void;
  onCancelSale: (id: string) => void;
  onAddPurchase: (purchase: Omit<PurchaseItem, 'id' | 'priceDiff' | 'total'>) => void;
}

export const StorePos: React.FC<StorePosProps> = ({
  products,
  sales,
  purchases,
  onAddSale,
  onCancelSale,
  onAddPurchase,
}) => {
  const [subTab, setSubTab] = useState<'sales' | 'purchases'>('sales');

  // Sale form states
  const [sellerName, setSellerName] = useState(DEFAULT_SELLERS[0]);
  const [customSeller, setCustomSeller] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [actualPrice, setActualPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقدى');
  const [saleNotes, setSaleNotes] = useState('');

  // Purchase form states
  const [purSearchQuery, setPurSearchQuery] = useState('');
  const [selectedPurProduct, setSelectedPurProduct] = useState<Product | null>(null);
  const [purSupplier, setPurSupplier] = useState('');
  const [purQty, setPurQty] = useState(1);
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [purNotes, setPurNotes] = useState('');

  // Matched products for sale
  const matchedSaleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.shortCode === q ||
          p.shortCode.startsWith(q) ||
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, products]);

  const selectSaleProduct = (p: Product) => {
    setSelectedProduct(p);
    setActualPrice(p.sellPrice);
    setQuantity(1);
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('يرجى اختيار المنتج');
      return;
    }
    if (quantity < 1) {
      alert('الكمية يجب أن تكون 1 على الأقل');
      return;
    }
    if (quantity > selectedProduct.currentStock) {
      alert(`الرصيد المتوفر في المخزون (${selectedProduct.currentStock}) أقل من المطلوب (${quantity})`);
      return;
    }

    const effectiveSeller = customSeller.trim() || sellerName;

    onAddSale({
      date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      sellerName: effectiveSeller,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Number(quantity),
      listPrice: selectedProduct.sellPrice,
      actualPrice: Number(actualPrice),
      costPrice: selectedProduct.costPrice,
      paymentMethod,
      status: 'مكتملة',
      notes: saleNotes.trim(),
    });

    // Reset
    setSelectedProduct(null);
    setSearchQuery('');
    setSaleNotes('');
    setQuantity(1);
    alert('تم تسجيل عملية البيع وخصم الكمية من المخزون بنجاح!');
  };

  // Matched products for purchase
  const matchedPurProducts = useMemo(() => {
    const q = purSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.shortCode === q ||
          p.shortCode.startsWith(q) ||
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [purSearchQuery, products]);

  const selectPurProduct = (p: Product) => {
    setSelectedPurProduct(p);
    setPurSupplier(p.supplier || '');
    setNewCostPrice(p.costPrice);
    setPurQty(1);
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurProduct) {
      alert('يرجى اختيار المنتج');
      return;
    }
    if (purQty < 1) {
      alert('الكمية يجب أن تكون 1 على الأقل');
      return;
    }

    onAddPurchase({
      date: new Date().toLocaleDateString('en-GB'),
      supplier: purSupplier.trim() || 'مورد عام',
      productId: selectedPurProduct.id,
      productName: selectedPurProduct.name,
      quantity: Number(purQty),
      newCostPrice: Number(newCostPrice),
      lastCostPrice: selectedPurProduct.costPrice,
      notes: purNotes.trim(),
    });

    setSelectedPurProduct(null);
    setPurSearchQuery('');
    setPurNotes('');
    setPurQty(1);
    alert('تم تسجيل الشراء وزيادة رصيد المخزون بنجاح!');
  };

  // Sales totals for today
  const salesStats = useMemo(() => {
    const completed = sales.filter((s) => s.status === 'مكتملة');
    const totalRev = completed.reduce((acc, s) => acc + s.total, 0);
    const totalProfit = completed.reduce((acc, s) => acc + s.profit, 0);
    const count = completed.length;
    return { totalRev, totalProfit, count };
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Sub tabs: In-store sales vs purchases */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('sales')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              subTab === 'sales'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>كاشير مبيعات المحل اليوم</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">{salesStats.count}</span>
          </button>

          <button
            onClick={() => setSubTab('purchases')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              subTab === 'purchases'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>توريد بضاعة ومشتريات</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">{purchases.length}</span>
          </button>
        </div>

        {subTab === 'sales' && (
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-slate-400">
              مبيعات المحل اليوم:{' '}
              <strong className="text-emerald-400 text-sm">
                {salesStats.totalRev.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
              </strong>
            </span>
            <span className="text-slate-400">
              الأرباح:{' '}
              <strong className="text-amber-400 text-sm">
                {salesStats.totalProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
              </strong>
            </span>
          </div>
        )}
      </div>

      {subTab === 'sales' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* POS Input form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                <span>فاتورة بيع مباشرة بالمحل</span>
              </h3>
              <span className="text-xs text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900">
                تسجيل سريع
              </span>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              {/* Seller Picker */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">اسم البائع:</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_SELLERS.map((seller) => (
                    <button
                      key={seller}
                      type="button"
                      onClick={() => {
                        setSellerName(seller);
                        setCustomSeller('');
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        sellerName === seller && !customSeller
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {seller}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Search */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 block font-medium">
                  اختر المنتج (بالاسم أو الكود أو رقمه):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اكتب 105، ACC-0105، أو مجسم أرنوب..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>

                {!selectedProduct && matchedSaleProducts.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-48 overflow-y-auto">
                    {matchedSaleProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectSaleProduct(p)}
                        className="w-full text-right p-2.5 hover:bg-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{p.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{p.id}</span>
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-amber-400 block">{p.sellPrice} ج.م</span>
                          <span
                            className={`text-[10px] ${
                              p.currentStock > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            متبقي: {p.currentStock}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Product Card */}
              {selectedProduct && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                        {selectedProduct.id}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1">{selectedProduct.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        سعر القائمة: {selectedProduct.sellPrice} ج.م | التكلفة: {selectedProduct.costPrice} ج.م
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        selectedProduct.currentStock > 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      المتوفر: {selectedProduct.currentStock}
                    </span>
                  </div>

                  {/* Quantity & Selling price */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الكمية:</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.currentStock}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        سعر البيع الفعلي (ج.م):
                      </label>
                      <input
                        type="number"
                        value={actualPrice}
                        onChange={(e) => setActualPrice(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold"
                      />
                    </div>
                  </div>

                  {/* Profit preview */}
                  <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">الربح المتوقع:</span>
                    <span className="font-bold text-emerald-400">
                      {((actualPrice - selectedProduct.costPrice) * quantity).toLocaleString('ar-EG', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ج.م
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">طريقة الدفع:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['نقدى', 'انستا', 'محفظه الاكتروانى', 'اجل'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                        paymentMethod === method
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">ملاحظات / العميل:</label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="مثال: بيع داخلي، هيام، حمادة سعد..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!selectedProduct || selectedProduct.currentStock <= 0}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  إتمام البيع (
                  {((actualPrice || 0) * (quantity || 0)).toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  ج.م)
                </span>
              </button>
            </form>
          </div>

          {/* Sales History Feed */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">سجل مبيعات المحل اليوم</h3>
                <p className="text-xs text-slate-400">عمليات الكاشير المباشرة في الفرع</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-900 font-mono">
                {sales.length} عملية
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">رقم العملية</th>
                    <th className="py-2.5 px-3">البائع</th>
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3">الكمية</th>
                    <th className="py-2.5 px-3">السعر الفعلي</th>
                    <th className="py-2.5 px-3">الإجمالي</th>
                    <th className="py-2.5 px-3">الربح</th>
                    <th className="py-2.5 px-3">طريقة الدفع</th>
                    <th className="py-2.5 px-3">ملاحظات</th>
                    <th className="py-2.5 px-3 text-center">إلغاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        sale.status === 'ملغاة' ? 'opacity-50 line-through bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{sale.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{sale.sellerName}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-200">{sale.productName}</div>
                        <span className="font-mono text-[10px] text-slate-500">{sale.productId}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{sale.quantity}</td>
                      <td className="py-2.5 px-3">{sale.actualPrice} ج.م</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-300">
                        {sale.total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        {sale.profit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{sale.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        {sale.status !== 'ملغاة' && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من إلغاء عملية البيع ${sale.id} وإرجاع القطع للمخزون؟`)) {
                                onCancelSale(sale.id);
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                            title="إلغاء المعاملة وإرجاع للمخزون"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Purchases Sub-Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <span>تسجيل دخول بضاعة جديدة (تزويد المخزون)</span>
              </h3>
              <span className="text-xs text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-900">
                مشتريات
              </span>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-300 block font-medium">اختر المنتج المراد تزويده:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={purSearchQuery}
                    onChange={(e) => setPurSearchQuery(e.target.value)}
                    placeholder="ابحث بالكود أو الاسم..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>

                {!selectedPurProduct && matchedPurProducts.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-48 overflow-y-auto">
                    {matchedPurProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPurProduct(p)}
                        className="w-full text-right p-2.5 hover:bg-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{p.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{p.id}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-slate-400">التكلفة السابقة: {p.costPrice} ج.م</span>
                          <span className="text-[10px] text-teal-400 block">رصيد حالي: {p.currentStock}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPurProduct && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-teal-950 text-teal-300 rounded border border-teal-800">
                        {selectedPurProduct.id}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1">{selectedPurProduct.name}</h4>
                    </div>
                    <span className="text-xs text-slate-400">المورد: {selectedPurProduct.supplier}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">اسم المورد:</label>
                      <input
                        type="text"
                        value={purSupplier}
                        onChange={(e) => setPurSupplier(e.target.value)}
                        placeholder="عيد ورجب، ماجد، عاطف..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الكمية المستلمة:</label>
                      <input
                        type="number"
                        min="1"
                        value={purQty}
                        onChange={(e) => setPurQty(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      سعر الوحدة الجديد من المورد (ج.م):
                    </label>
                    <input
                      type="number"
                      value={newCostPrice}
                      onChange={(e) => setNewCostPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-teal-300 font-bold"
                    />

                    {newCostPrice > selectedPurProduct.costPrice && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        تنبيه: السعر الجديد أعلى من التكلفة السابقة بمقدار{' '}
                        {(newCostPrice - selectedPurProduct.costPrice).toFixed(2)} ج.م
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedPurProduct}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة للمخزون (إجمالي الفاتورة: {(newCostPrice * purQty).toFixed(2)} ج.م)</span>
              </button>
            </form>
          </div>

          {/* Purchases History */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">سجل المشتريات وتوريد البضاعة</h3>
                <p className="text-xs text-slate-400">فواتير دخول المنتجات وتحديث الأسعار</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal-950 text-teal-300 border border-teal-900 font-mono">
                {purchases.length} توريدة
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">الكود</th>
                    <th className="py-2.5 px-3">المورد</th>
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3">الكمية</th>
                    <th className="py-2.5 px-3">سعر الوحدة</th>
                    <th className="py-2.5 px-3">الإجمالي</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-teal-400">{pur.productId}</td>
                      <td className="py-2.5 px-3 text-slate-200">{pur.supplier || '-'}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{pur.productName}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{pur.quantity}</td>
                      <td className="py-2.5 px-3">{pur.newCostPrice} ج.م</td>
                      <td className="py-2.5 px-3 font-bold text-teal-300">
                        {pur.total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{pur.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
