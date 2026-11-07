import React, { useState, useMemo } from 'react';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Search,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Boxes,
  FileText,
  Send,
} from 'lucide-react';
import { LiveBooking, PackagingStatus, CustomerOrderSummary } from '../types';

interface OrderPackagingProps {
  liveBookings: LiveBooking[];
  onUpdatePackagingStatus: (id: string, newStatus: PackagingStatus) => void;
  onUpdateCustomerPackageStatus: (customerName: string, newStatus: PackagingStatus) => void;
  onOpenInvoiceModal: (order: CustomerOrderSummary) => void;
}

export const OrderPackaging: React.FC<OrderPackagingProps> = ({
  liveBookings,
  onUpdatePackagingStatus,
  onUpdateCustomerPackageStatus,
  onOpenInvoiceModal,
}) => {
  const [searchCustomer, setSearchCustomer] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Custom shipping & discounts stored locally per customer
  const [shippingFees, setShippingFees] = useState<Record<string, number>>({});
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  // Group paid live bookings by Customer Name
  const customerOrders: CustomerOrderSummary[] = useMemo(() => {
    // Only paid bookings go to fulfillment
    const paidBookings = liveBookings.filter((b) => b.paymentStatus === 'تم الدفع');

    const groups: Record<string, LiveBooking[]> = {};
    for (const b of paidBookings) {
      const cleanName = b.customerName.trim() || 'عميل بدون اسم';
      if (!groups[cleanName]) groups[cleanName] = [];
      groups[cleanName].push(b);
    }

    return Object.entries(groups).map(([name, items], idx) => {
      const subtotal = items.reduce((acc, it) => acc + it.total, 0);
      const totalPieces = items.reduce((acc, it) => acc + it.quantity, 0);
      const shipping = shippingFees[name] ?? 0;
      const discount = discounts[name] ?? 0;
      const grandTotal = Math.max(0, subtotal + shipping - discount);

      // determine dominant status
      const allStatuses = items.map((i) => i.packagingStatus);
      const packagingStatus: PackagingStatus = allStatuses.every((s) => s === 'تم الشحن')
        ? 'تم الشحن'
        : allStatuses.every((s) => s === 'تم التغليف' || s === 'تم الشحن')
        ? 'تم التغليف'
        : allStatuses.some((s) => s === 'جاري التجهيز')
        ? 'جاري التجهيز'
        : 'جاهز للتجهيز';

      return {
        customerName: name,
        bookings: items,
        totalPieces,
        subtotal,
        discount,
        shippingFee: shipping,
        grandTotal,
        packagingStatus,
        orderNumber: `ORD-${String(idx + 1).padStart(4, '0')}`,
      };
    });
  }, [liveBookings, shippingFees, discounts]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return customerOrders.filter((order) => {
      if (statusFilter !== 'all' && order.packagingStatus !== statusFilter) return false;
      if (searchCustomer) {
        const s = searchCustomer.toLowerCase();
        return (
          order.customerName.toLowerCase().includes(s) ||
          order.orderNumber.toLowerCase().includes(s) ||
          order.bookings.some((b) => b.productName.toLowerCase().includes(s) || b.productId.includes(s))
        );
      }
      return true;
    });
  }, [customerOrders, statusFilter, searchCustomer]);

  // Generate WhatsApp formatted text
  const sendWhatsApp = (order: CustomerOrderSummary) => {
    let text = `مرحبًا أ / ${order.customerName} 🌸\n`;
    text += `تفاصيل حجز أوردر اللايف لحضرتك من متجرنا:\n`;
    text += `رقم الأوردر: ${order.orderNumber}\n`;
    text += `--------------------------------\n`;

    order.bookings.forEach((item, i) => {
      text += `${i + 1}) ${item.productName} (كود: ${item.shortCode})\n`;
      text += `   الكمية: ${item.quantity} × ${item.unitPrice} ج.م = ${item.total} ج.م\n`;
    });

    text += `--------------------------------\n`;
    text += `الإجمالي قبل الشحن: ${order.subtotal} ج.م\n`;
    if (order.discount > 0) {
      text += `الخصم: -${order.discount} ج.م\n`;
    }
    if (order.shippingFee > 0) {
      text += `الشحن والتوصيل: +${order.shippingFee} ج.م\n`;
    }
    text += `المجموع النهائي المطلوب: ${order.grandTotal} ج.م\n\n`;
    text += `حالة التجهيز الحالية: ${order.packagingStatus}\n`;
    text += `سعداء جدًا بتعاملك معنا! 🚚🎁`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const PACKAGING_STATUS_OPTIONS: PackagingStatus[] = [
    'جاهز للتجهيز',
    'جاري التجهيز',
    'تم التغليف',
    'تم الشحن',
    'تم التسليم',
  ];

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-amber-500" />
            <span>إدارة الشحن والتغليف وفواتير العملاء</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يتم تجميع كافة قطع كل عميل المدفوعة في حزمة أوردر واحدة لسهولة التغليف وإصدار الفاتورة
          </p>
        </div>

        {/* Quick status filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            الكل ({customerOrders.length} عميل)
          </button>
          {PACKAGING_STATUS_OPTIONS.map((status) => {
            const count = customerOrders.filter((o) => o.packagingStatus === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          placeholder="ابحث باسم العميل (ام على، شوشو، ايمن...) أو رقم الأوردر أو اسم المنتج..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search className="w-5 h-5 text-slate-500 absolute right-3 top-3.5" />
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Boxes className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p className="text-sm">لا توجد طلبات مدفوعة مطابقة حالياً.</p>
            <p className="text-xs text-slate-600 mt-1">
              حجوزات اللايف التي يتم تغيير حالتها إلى "تم الدفع" تظهر هنا تلقائياً للتجهيز والشحن.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedCustomer === order.customerName;

            return (
              <div
                key={order.customerName}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-700"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{order.customerName}</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{order.totalPieces} قطع محجوزة ومدفوعة</span>
                        <span>•</span>
                        <span>
                          الإجمالي: {order.subtotal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Packaging Status Pill & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status dropdown */}
                    <select
                      value={order.packagingStatus}
                      onChange={(e) =>
                        onUpdateCustomerPackageStatus(order.customerName, e.target.value as PackagingStatus)
                      }
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
                    >
                      {PACKAGING_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    {/* Print Invoice Button */}
                    <button
                      onClick={() => onOpenInvoiceModal(order)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                      title="طباعة فاتورة العميل الرسمية"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>فاتورة</span>
                    </button>

                    {/* WhatsApp Share Button */}
                    <button
                      onClick={() => sendWhatsApp(order)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 transition-colors"
                      title="مشاركة تفاصيل الحساب على الواتساب"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </button>

                    {/* Expand/Collapse details */}
                    <button
                      onClick={() => setExpandedCustomer(isExpanded ? null : order.customerName)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      title="عرض أو إخفاء تفاصيل المنتجات"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Items List & Invoice Inputs */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-950/60 space-y-4">
                    {/* Items table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3">رقم الطلب</th>
                            <th className="py-2 px-3">الكود</th>
                            <th className="py-2 px-3">اسم المنتج</th>
                            <th className="py-2 px-3">الكمية</th>
                            <th className="py-2 px-3">سعر الوحدة</th>
                            <th className="py-2 px-3">الإجمالي</th>
                            <th className="py-2 px-3">حالة القطعة</th>
                            <th className="py-2 px-3">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {order.bookings.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-900/60">
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.id}</td>
                              <td className="py-2 px-3 font-mono text-amber-400">{item.productId}</td>
                              <td className="py-2 px-3 font-medium text-white">{item.productName}</td>
                              <td className="py-2 px-3 font-bold text-white">{item.quantity}</td>
                              <td className="py-2 px-3">{item.unitPrice} ج.م</td>
                              <td className="py-2 px-3 font-bold text-amber-300">{item.total} ج.م</td>
                              <td className="py-2 px-3">
                                <select
                                  value={item.packagingStatus}
                                  onChange={(e) =>
                                    onUpdatePackagingStatus(item.id, e.target.value as PackagingStatus)
                                  }
                                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                                >
                                  {PACKAGING_STATUS_OPTIONS.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-400">{item.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Invoice Adjustments (Shipping & Discount) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">مصاريف الشحن والتوصيل (ج.م):</label>
                        <input
                          type="number"
                          value={shippingFees[order.customerName] ?? 0}
                          onChange={(e) =>
                            setShippingFees((prev) => ({
                              ...prev,
                              [order.customerName]: Number(e.target.value),
                            }))
                          }
                          placeholder="0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">خصم خاص للعميل (ج.م):</label>
                        <input
                          type="number"
                          value={discounts[order.customerName] ?? 0}
                          onChange={(e) =>
                            setDiscounts((prev) => ({
                              ...prev,
                              [order.customerName]: Number(e.target.value),
                            }))
                          }
                          placeholder="0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300"
                        />
                      </div>

                      <div className="flex flex-col justify-end text-left sm:text-right">
                        <span className="text-slate-400 text-[11px]">الإجمالي النهائي للفاتورة:</span>
                        <span className="text-base font-bold text-emerald-400">
                          {order.grandTotal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
