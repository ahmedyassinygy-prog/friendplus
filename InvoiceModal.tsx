import React from 'react';
import { Printer, Share2, X, ShoppingBag } from 'lucide-react';
import { CustomerOrderSummary } from '../types';

interface InvoiceModalProps {
  order: CustomerOrderSummary | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    let text = `فاتورة حساب متجر سَنَد للإكسسوارات\n`;
    text += `العميل: ${order.customerName}\n`;
    text += `رقم الفاتورة: ${order.orderNumber}\n`;
    text += `التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n`;
    text += `--------------------------------\n`;
    order.bookings.forEach((item, idx) => {
      text += `${idx + 1}. ${item.productName} (${item.quantity} × ${item.unitPrice}) = ${item.total} ج.م\n`;
    });
    text += `--------------------------------\n`;
    text += `الإجمالي: ${order.subtotal} ج.م\n`;
    if (order.discount > 0) text += `الخصم: -${order.discount} ج.م\n`;
    if (order.shippingFee > 0) text += `الشحن: +${order.shippingFee} ج.م\n`;
    text += `المبلغ الإجمالي المستحق: ${order.grandTotal} ج.م\n`;
    text += `شكرًا لتعاملك معنا وسعداء بخدمتك دائمًا! 🌸`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative print:m-0 print:p-0 print:border-none print:bg-white print:text-black">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
          <span className="text-xs font-semibold text-slate-400">معاينة وطباعة الفاتورة</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة (Ctrl+P)</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>إرسال واتساب</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Area */}
        <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md border border-slate-200 print:shadow-none print:border-none print:p-4">
          {/* Invoice Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">سَنَد للإكسسوارات والهدايا</h2>
              </div>
              <p className="text-xs text-slate-500">مبيعات المحل ولايف التيك توك — شحن وتوصيل لجميع المحافظات</p>
            </div>

            <div className="text-left font-mono text-xs">
              <span className="font-bold text-base text-rose-600 block">{order.orderNumber}</span>
              <span className="text-slate-500 block">{new Date().toLocaleDateString('ar-EG')}</span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-sans font-bold">
                {order.packagingStatus}
              </span>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block">اسم العميل:</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{order.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">مصدر الأوردر:</span>
              <strong className="text-xs text-slate-900 block mt-0.5">حجز مباشر من التيك توك لايف</strong>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b-2 border-slate-900 text-slate-900 font-bold">
                <tr>
                  <th className="py-2 px-2">م</th>
                  <th className="py-2 px-2">المنتج</th>
                  <th className="py-2 px-2">الكود</th>
                  <th className="py-2 px-2 text-center">الكمية</th>
                  <th className="py-2 px-2">سعر الوحدة</th>
                  <th className="py-2 px-2 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.bookings.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-2 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-900">{item.productName}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-600">{item.productId}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2.5 px-2">{item.unitPrice.toFixed(2)} ج.م</td>
                    <td className="py-2.5 px-2 text-left font-bold text-slate-900">
                      {item.total.toFixed(2)} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>الإجمالي قبل الخصم والشحن:</span>
              <span className="font-bold">{order.subtotal.toFixed(2)} ج.م</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم:</span>
                <span className="font-bold">-{order.discount.toFixed(2)} ج.م</span>
              </div>
            )}

            {order.shippingFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>مصاريف الشحن:</span>
                <span className="font-bold">+{order.shippingFee.toFixed(2)} ج.م</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
              <span>الإجمالي النهائي المطلوب:</span>
              <span className="text-rose-600">{order.grandTotal.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">شكرًا لتعاملكم مع سَنَد للإكسسوارات والهدايا 🌸</p>
            <p className="text-[11px]">يرجى مراجعة محتويات الشحنة عند الاستلام مع مندوب الشحن.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
