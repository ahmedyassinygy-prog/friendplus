import seedData from './seedData.json';
import { Product, StoreSale, LiveBooking, PurchaseItem, DailyClosingRecord } from '../types';

export const initialProducts: Product[] = seedData.products as Product[];

export const initialSales: StoreSale[] = seedData.sales as StoreSale[];

export const initialLiveBookings: LiveBooking[] = seedData.liveBookings as LiveBooking[];

export const initialPurchases: PurchaseItem[] = seedData.purchases as PurchaseItem[];

export const initialDailyClosings: DailyClosingRecord[] = [
  {
    id: 'CLOSE-2026-11-06',
    date: '06/11/2026',
    status: 'مقفلة',
    storeCompletedSales: 6150.00,
    livePaidSales: 5135.00,
    totalSales: 11285.00,
    storeTransactionsCount: 20,
    liveBookingsCount: 17,
    totalDiscounts: 6215.00,
    netProfit: 1670.00,
    cashAmount: 1800.00,
    instaPayAmount: 1200.00,
    walletAmount: 2850.00,
    creditAmount: 300.00,
    notes: 'تقفيل يومي رسمي ومطابق للخزينة والمحافظ الإلكترونية.',
    closedAt: '06/11/2026 23:59',
  }
];

export const ALL_CATEGORIES = Array.from(
  new Set(initialProducts.map((p) => p.category).filter(Boolean))
);

export const DEFAULT_SELLERS = ['ام ياسين', 'احمد', 'سيف'];
