export interface Product {
  id: string; // ACC-0001
  shortCode: string; // 0001 or 1
  name: string;
  category: string;
  supplier: string;
  costPrice: number; // سعر الجملة / التكلفة
  sellPrice: number; // سعر البيع
  initialStock: number; // رصيد افتتاحي
  reorderLevel: number; // حد إعادة الطلب
  currentStock: number; // الرصيد الحالي
  notes?: string;
}

export type PaymentMethod = 'نقدى' | 'انستا' | 'محفظه الاكتروانى' | 'اجل';
export type SaleStatus = 'مكتملة' | 'ملغاة' | 'مرتجع';

export interface StoreSale {
  id: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  time?: string;
  sellerName: string; // ام ياسين, احمد, سيف
  productId: string;
  productName: string;
  quantity: number;
  listPrice: number;
  actualPrice: number;
  total: number;
  costPrice: number;
  profit: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  customerName?: string;
  notes?: string;
}

export type LiveBookingStatus = 'حجز مؤقت' | 'تم الدفع' | 'ملغي';
export type PackagingStatus = 'جاهز للتجهيز' | 'جاري التجهيز' | 'تم التغليف' | 'تم الشحن' | 'تم التسليم';

export interface LiveBooking {
  id: string; // LIVE-0001
  timestamp: string; // 06/11/2026 19:14
  shortCode: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  customerName: string; // ام على, شوشو, ايمن
  paymentStatus: LiveBookingStatus;
  packagingStatus: PackagingStatus;
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  date: string;
  supplier: string;
  productId: string;
  productName: string;
  quantity: number;
  newCostPrice: number;
  total: number;
  lastCostPrice: number;
  priceDiff: number;
  priceAlert?: string;
  notes?: string;
}

export interface DailyClosingRecord {
  id: string;
  date: string;
  status: 'مفتوحة' | 'مقفلة';
  storeCompletedSales: number;
  livePaidSales: number;
  totalSales: number;
  storeTransactionsCount: number;
  liveBookingsCount: number;
  totalDiscounts: number;
  netProfit: number;
  cashAmount: number;
  instaPayAmount: number;
  walletAmount: number;
  creditAmount: number;
  notes: string;
  closedAt?: string;
}

export interface CustomerOrderSummary {
  customerName: string;
  bookings: LiveBooking[];
  totalPieces: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
  packagingStatus: PackagingStatus;
  orderNumber: string;
  notes?: string;
}
