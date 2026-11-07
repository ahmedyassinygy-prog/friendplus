import React from 'react';
import {
  Radio,
  Store,
  PackageCheck,
  LayoutGrid,
  CalendarCheck,
  FileSpreadsheet,
  Briefcase,
  RotateCcw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'live' | 'pos' | 'orders' | 'inventory' | 'closing';
  setActiveTab: (tab: 'live' | 'pos' | 'orders' | 'inventory' | 'closing') => void;
  liveCount: number;
  ordersCount: number;
  lowStockCount: number;
  onOpenSheetsModal: () => void;
  onOpenGuideModal: () => void;
  onResetData: () => void;
  isSheetsConnected: boolean;
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  liveCount,
  ordersCount,
  lowStockCount,
  onOpenSheetsModal,
  onOpenGuideModal,
  onResetData,
  isSheetsConnected,
  userEmail,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner / Store identity & Tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">سَنَد — إدارة المحل ولايف التيك توك</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                مباشر
              </span>
            </div>
            <p className="text-xs text-slate-400">نظام إدارة مبيعات القطعة، الحجوزات السريعة، المخزون، والتقفيل اليومي</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Google Sheets Sync Button */}
          <button
            onClick={onOpenSheetsModal}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              isSheetsConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600 hover:bg-emerald-900'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
            title="ربط ومزامنة البيانات مع Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{isSheetsConnected ? 'Google Sheets (متصل)' : 'ربط Google Sheets'}</span>
            {userEmail && <span className="text-[10px] opacity-75 hidden sm:inline">({userEmail.split('@')[0]})</span>}
          </button>

          {/* Business Guide / Strategy */}
          <button
            onClick={onOpenGuideModal}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">رؤية مدير الأعمال</span>
            <span className="sm:hidden">الدليل</span>
          </button>

          {/* Reset Demo Data button */}
          <button
            onClick={onResetData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="استرجاع البيانات الأصلية للشيت"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 py-2 no-scrollbar">
        {/* Tab 1: Live Desk */}
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'live'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="relative">
            <Radio className="w-4 h-4 text-current" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-300 animate-ping" />
          </div>
          <span>مكتب لايف التيك توك</span>
          {liveCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'live' ? 'bg-white text-rose-600' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {liveCount} حجز
            </span>
          )}
        </button>

        {/* Tab 2: POS */}
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'pos'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4 text-current" />
          <span>كاشير المحل والمشتريات</span>
        </button>

        {/* Tab 3: Order Packaging & Invoices */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-current" />
          <span>الشحن والتغليف والفواتير</span>
          {ordersCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'orders' ? 'bg-white text-amber-600' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {ordersCount} طلب
            </span>
          )}
        </button>

        {/* Tab 4: Inventory */}
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-current" />
          <span>المخزون والمنتجات (323)</span>
          {lowStockCount > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'inventory' ? 'bg-rose-900 text-rose-200' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {lowStockCount} ناقص
            </span>
          )}
        </button>

        {/* Tab 5: Daily Closing */}
        <button
          onClick={() => setActiveTab('closing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'closing'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-current" />
          <span>التقفيل اليومي والخزينة</span>
        </button>
      </div>
    </header>
  );
};
