import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Edit2,
  Tag,
  DollarSign,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Product } from '../types';
import { ALL_CATEGORIES } from '../data/initialData';

interface InventoryManagerProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'shortCode'>) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onUpdateProduct,
  onAddProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for new product
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newSellPrice, setNewSellPrice] = useState<number>(0);
  const [newInitialStock, setNewInitialStock] = useState<number>(1);
  const [newReorderLevel, setNewReorderLevel] = useState<number>(1);

  // Inventory Totals
  const inventoryStats = useMemo(() => {
    const totalCount = products.length;
    const totalValue = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
    const lowStockCount = products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel
    ).length;
    const outOfStockCount = products.filter((p) => p.currentStock <= 0).length;

    return {
      totalCount,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedStatus === 'available' && p.currentStock <= p.reorderLevel) return false;
      if (selectedStatus === 'low' && (p.currentStock <= 0 || p.currentStock > p.reorderLevel)) return false;
      if (selectedStatus === 'out' && p.currentStock > 0) return false;

      if (search) {
        const s = search.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(s) ||
          p.id.toLowerCase().includes(s) ||
          p.shortCode === s ||
          p.supplier.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [products, selectedCategory, selectedStatus, search]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('اسم المنتج مطلوب');
      return;
    }
    onAddProduct({
      name: newName.trim(),
      category: newCategory.trim() || 'عام',
      supplier: newSupplier.trim() || 'مورد عام',
      costPrice: Number(newCostPrice),
      sellPrice: Number(newSellPrice),
      initialStock: Number(newInitialStock),
      reorderLevel: Number(newReorderLevel),
      currentStock: Number(newInitialStock),
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewCategory('');
    setNewSupplier('');
    setNewCostPrice(0);
    setNewSellPrice(0);
    setNewInitialStock(1);
    setNewReorderLevel(1);
  };

  // Next auto-assigned code
  const nextAssignedCode = useMemo(() => {
    const maxNum = products.reduce((max, p) => {
      const n = parseInt(p.shortCode, 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    return `ACC-${String(maxNum + 1).padStart(4, '0')}`;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">عدد المنتجات المسجلة</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{inventoryStats.totalCount}</span>
            <span className="text-xs text-slate-400">صنف في الشيت</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">مكود وجاهز للبيع باللايف والمحل</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">قيمة المخزون الإجمالية</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-400">
              {inventoryStats.totalValue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400">ج.م</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">بسعر التكلفة الفعلي للقطع</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">منتجات قاربت على النفاد</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-400">{inventoryStats.lowStockCount}</span>
            <span className="text-xs text-slate-400">تحت حد إعادة الطلب</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">يوصى بطلبها من المورد</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">منتجات نفدت بالكامل</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-400">{inventoryStats.outOfStockCount}</span>
            <span className="text-xs text-slate-400">صنف رصيده صفر</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">ممنوع بيعها على اللايف</span>
        </div>
      </div>

      {/* Control bar: Search, filters, Add product */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج أو الكود الكامل أو الرقم (مثال: 86 أو ACC-0086)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">كل التصنيفات ({ALL_CATEGORIES.length})</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="available">متوفر فقط</option>
            <option value="low">منخفض (يحتاج طلب)</option>
            <option value="out">نفد من المخزون</option>
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج جديد ({nextAssignedCode})</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">الكود</th>
                <th className="py-3 px-3">اسم المنتج</th>
                <th className="py-3 px-3">التصنيف</th>
                <th className="py-3 px-3">المورد</th>
                <th className="py-3 px-3">سعر الجملة</th>
                <th className="py-3 px-3">سعر البيع</th>
                <th className="py-3 px-3">ربح القطعة</th>
                <th className="py-3 px-3">الرصيد الحالي</th>
                <th className="py-3 px-3">قيمة المخزون</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3 text-center">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredProducts.map((p) => {
                const profit = p.sellPrice - p.costPrice;
                const totalVal = p.currentStock * p.costPrice;
                const isOutOfStock = p.currentStock <= 0;
                const isLow = p.currentStock > 0 && p.currentStock <= p.reorderLevel;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {p.id}
                      <span className="block text-[10px] text-slate-500 font-normal">رقم: {p.shortCode}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-white block">{p.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{p.supplier || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.costPrice} ج.م</td>
                    <td className="py-2.5 px-3 font-bold text-white">{p.sellPrice} ج.م</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{profit.toFixed(2)} ج.م</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-sm font-bold ${
                          isOutOfStock ? 'text-rose-500' : isLow ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {p.currentStock}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-300">
                      {totalVal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                    </td>
                    <td className="py-2.5 px-3">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          نفد
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          منخفض
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          متوفر
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setEditingProduct({ ...p })}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                        title="تعديل السعر أو الرصيد"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">تعديل بيانات المنتج ({editingProduct.id})</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم المنتج:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">سعر الجملة (ج.م):</label>
                  <input
                    type="number"
                    value={editingProduct.costPrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">سعر البيع (ج.م):</label>
                  <input
                    type="number"
                    value={editingProduct.sellPrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sellPrice: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">الرصيد الفعلي الحالي:</label>
                  <input
                    type="number"
                    value={editingProduct.currentStock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, currentStock: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">حد إعادة الطلب:</label>
                  <input
                    type="number"
                    value={editingProduct.reorderLevel}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, reorderLevel: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">إضافة منتج جديد للمخزون</h3>
                <span className="text-xs text-amber-400 font-mono">الكود التلقائي المقترح: {nextAssignedCode}</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم المنتج *:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: مج ديزني ستيتش مجسم..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">التصنيف:</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="انتيكات، مجات، ألعاب..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">المورد:</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    placeholder="عيد ورجب، ماجد، عاطف..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">سعر الجملة (ج.م):</label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">سعر البيع (ج.م):</label>
                  <input
                    type="number"
                    value={newSellPrice}
                    onChange={(e) => setNewSellPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">الرصيد الافتتاحي:</label>
                  <input
                    type="number"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">حد إعادة الطلب:</label>
                  <input
                    type="number"
                    value={newReorderLevel}
                    onChange={(e) => setNewReorderLevel(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  إضافة للمخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
