import { Product, StoreSale, LiveBooking, PurchaseItem, DailyClosingRecord, PackagingStatus, LiveBookingStatus } from '../types';
import { initialProducts, initialSales, initialLiveBookings, initialPurchases, initialDailyClosings } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'sanad_store_products_v2',
  SALES: 'sanad_store_sales_v2',
  LIVE: 'sanad_store_live_bookings_v2',
  PURCHASES: 'sanad_store_purchases_v2',
  CLOSINGS: 'sanad_store_daily_closings_v2',
};

export const loadStoredData = () => {
  try {
    const rawProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const rawSales = localStorage.getItem(STORAGE_KEYS.SALES);
    const rawLive = localStorage.getItem(STORAGE_KEYS.LIVE);
    const rawPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    const rawClosings = localStorage.getItem(STORAGE_KEYS.CLOSINGS);

    return {
      products: rawProds ? (JSON.parse(rawProds) as Product[]) : initialProducts,
      sales: rawSales ? (JSON.parse(rawSales) as StoreSale[]) : initialSales,
      liveBookings: rawLive ? (JSON.parse(rawLive) as LiveBooking[]) : initialLiveBookings,
      purchases: rawPurchases ? (JSON.parse(rawPurchases) as PurchaseItem[]) : initialPurchases,
      dailyClosings: rawClosings ? (JSON.parse(rawClosings) as DailyClosingRecord[]) : initialDailyClosings,
    };
  } catch (err) {
    console.warn('Error reading from localStorage, using seed data', err);
    return {
      products: initialProducts,
      sales: initialSales,
      liveBookings: initialLiveBookings,
      purchases: initialPurchases,
      dailyClosings: initialDailyClosings,
    };
  }
};

export const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
};

export const clearAndResetStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.LIVE);
  localStorage.removeItem(STORAGE_KEYS.PURCHASES);
  localStorage.removeItem(STORAGE_KEYS.CLOSINGS);
  return {
    products: initialProducts,
    sales: initialSales,
    liveBookings: initialLiveBookings,
    purchases: initialPurchases,
    dailyClosings: initialDailyClosings,
  };
};

export { STORAGE_KEYS };
