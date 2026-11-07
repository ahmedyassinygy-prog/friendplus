import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Download,
  Code2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Product, StoreSale, LiveBooking, DailyClosingRecord } from '../types';
import { createUnifiedStoreSheet, exportLocalCsv, APPS_SCRIPT_TEMPLATE } from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  accessToken: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  products: Product[];
  sales: StoreSale[];
  liveBookings: LiveBooking[];
  dailyClosings: DailyClosingRecord[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  accessToken,
  onLogin,
  onLogout,
  products,
  sales,
  liveBookings,
  dailyClosings,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCopiedScript, setHasCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'script' | 'export'>('sync');

  if (!isOpen) return null;

  const handleSyncToSheets = async () => {
    if (!accessToken) {
      alert('يرجى تسجيل الدخول بحساب Google أولاً للمزامنة');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setStatusMessage('جاري إنشاء شيت جديد منظم وتعبئة البيانات بـ 4 تبويبات...');

    try {
      const res = await createUnifiedStoreSheet(
        accessToken,
        products,
        sales,
        liveBookings,
        dailyClosings
      );

      setCreatedSheetUrl(res.spreadsheetUrl);
      setStatusMessage('تم إنشاء الشيت المنظم بنجاح على Google Drive الخاص بحسابك!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ أثناء مزامنة Google Sheets');
      setStatusMessage(null);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setHasCopiedScript(true);
    setTimeout(() => setHasCopiedScript(false), 2500);
  };

  const handleDownloadCsv = (type: 'products' | 'sales' | 'live' | 'closings') => {
    if (type === 'products') {
      const headers = ['الكود', 'اسم المنتج', 'التصنيف', 'المورد', 'سعر الجملة', 'سعر البيع', 'الرصيد'];
      const rows = products.map((p) => [p.id, p.name, p.category, p.supplier, p.costPrice, p.sellPrice, p.currentStock]);
      exportLocalCsv(`المنتجات_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } else if (type === 'sales') {
      const headers = ['رقم العملية', 'التاريخ', 'البائع', 'الكود', 'المنتج', 'الكمية', 'السعر', 'الإجمالي', 'الربح', 'طريقة الدفع'];
      const rows = sales.map((s) => [s.id, s.date, s.sellerName, s.productId, s.productName, s.quantity, s.actualPrice, s.total, s.profit, s.paymentMethod]);
      exportLocalCsv(`مبيعات_المحل_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } else if (type === 'live') {
      const headers = ['رقم الطلب', 'الوقت', 'العميل', 'الكود', 'المنتج', 'الكمية', 'السعر', 'الإجمالي', 'الحالة'];
      const rows = liveBookings.map((l) => [l.id, l.timestamp, l.customerName, l.productId, l.productName, l.quantity, l.unitPrice, l.total, l.paymentStatus]);
      exportLocalCsv(`حجوزات_اللايف_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } else {
      const headers = ['التاريخ', 'حالة اليومية', 'مبيعات المحل', 'مبيعات اللايف', 'الإجمالي', 'صافي الربح', 'الكاش'];
      const rows = dailyClosings.map((c) => [c.date, c.status, c.storeCompletedSales, c.livePaidSales, c.totalSales, c.netProfit, c.cashAmount]);
      exportLocalCsv(`التقفيل_اليومي_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إدارة وتكامل Google Sheets</h2>
              <p className="text-xs text-slate-400">مزامنة سحابية بـ 4 تبويبات فقط وحفظ تلقائي لبيانات المتجر</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'sync' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            المزامنة السحابية المباشرة
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'export' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            تحميل ملفات Excel / CSV
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'script' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            كود Google Apps Script
          </button>
        </div>

        {/* Tab 1: Live Cloud Sync */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            {/* Account Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${accessToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
                />
                <div>
                  <span className="text-xs text-slate-400 block">حالة حساب Google:</span>
                  <span className="text-sm font-bold text-white">
                    {accessToken ? (
                      <span className="text-emerald-400">متصل ({userEmail || 'حساب مفعل'})</span>
                    ) : (
                      'غير متصل (يتطلب تسجيل الدخول للربط)'
                    )}
                  </span>
                </div>
              </div>

              {accessToken ? (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
                >
                  تسجيل الخروج
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>تسجيل الدخول بحساب Google</span>
                </button>
              )}
            </div>

            {/* Architecture Explainer: 4 clean sheets instead of 8 */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>كيف يحل هذا الشيت الجديد الصداع القديم؟</span>
              </span>
              <p className="leading-relaxed">
                بدلاً من 8 شيتات منفصلة ومعقدة، يقوم السيستم تلقائيًا بإنشاء جدول واحد منظم ومريح يحتوي على 4 تبويبات فقط:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200">
                  1_المخزون_والمنتجات (323 منتج)
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200">
                  2_مبيعات_المحل_واللايف (حركات البيع)
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200">
                  3_التجهيز_والشحن_والفواتير (المدفوعة)
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200">
                  4_التقفيل_اليومي (الخزينة والأرباح)
                </div>
              </div>
            </div>

            {/* Sync Action */}
            <div className="pt-2">
              <button
                onClick={handleSyncToSheets}
                disabled={!accessToken || isCreating}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${isCreating ? 'animate-spin' : ''}`} />
                <span>
                  {isCreating
                    ? 'جاري إنشاء الشيت وتصدير البيانات...'
                    : 'إنشاء ومزامنة الشيت الآن على Google Drive'}
                </span>
              </button>
            </div>

            {/* Result / Success link */}
            {statusMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {createdSheetUrl && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">رابط الشيت المنظم:</span>
                  <span className="text-sm font-bold text-white">Google Spreadsheet جاهز للاستخدام</span>
                </div>
                <a
                  href={createdSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>فتح في Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Offline Excel/CSV Export */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">
              يمكنك في أي لحظة تنزيل نسخة احتياطية محلية من بيانات المتجر بصيغة CSV المتوافقة تمامًا مع Excel و Google Sheets:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDownloadCsv('products')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-right flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block font-semibold">المخزون والمنتجات</strong>
                  <span className="text-slate-500 text-[11px]">{products.length} منتج مكود</span>
                </div>
                <Download className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => handleDownloadCsv('sales')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-right flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block font-semibold">مبيعات المحل المباشرة</strong>
                  <span className="text-slate-500 text-[11px]">{sales.length} عملية بيع</span>
                </div>
                <Download className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                onClick={() => handleDownloadCsv('live')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-right flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block font-semibold">حجوزات لايف التيك توك</strong>
                  <span className="text-slate-500 text-[11px]">{liveBookings.length} حجز للعملاء</span>
                </div>
                <Download className="w-4 h-4 text-rose-400" />
              </button>

              <button
                onClick={() => handleDownloadCsv('closings')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-right flex items-center justify-between transition-colors"
              >
                <div>
                  <strong className="text-white block font-semibold">أرشيف التقفيل اليومي</strong>
                  <span className="text-slate-500 text-[11px]">{dailyClosings.length} يومية مقفلة</span>
                </div>
                <Download className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Google Apps Script Ready Code */}
        {activeTab === 'script' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                انسخ هذا الكود وضعه في (ملحقات Extensions {'>'} Apps Script) داخل الشيت:
              </span>
              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
              >
                {hasCopiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedScript ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] max-h-60 overflow-y-auto leading-relaxed select-all" dir="ltr">
              {APPS_SCRIPT_TEMPLATE}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
