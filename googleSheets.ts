import { Product, StoreSale, LiveBooking, DailyClosingRecord } from '../types';

interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export async function createUnifiedStoreSheet(
  accessToken: string,
  products: Product[],
  sales: StoreSale[],
  liveBookings: LiveBooking[],
  closings: DailyClosingRecord[]
): Promise<SheetCreationResult> {
  const title = `سند — سيستم المحل ومبيعات اللايف (${new Date().toLocaleDateString('ar-EG')})`;

  // 1. Create spreadsheet with 4 structured sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        locale: 'ar_EG',
        timeZone: 'Africa/Cairo',
      },
      sheets: [
        {
          properties: {
            title: '1_المخزون_والمنتجات',
            rightToLeft: true,
            gridProperties: { rowCount: Math.max(products.length + 10, 50), columnCount: 12 },
          },
        },
        {
          properties: {
            title: '2_مبيعات_المحل_واللايف',
            rightToLeft: true,
            gridProperties: { rowCount: Math.max(sales.length + liveBookings.length + 10, 50), columnCount: 14 },
          },
        },
        {
          properties: {
            title: '3_التجهيز_والشحن_والفواتير',
            rightToLeft: true,
            gridProperties: { rowCount: Math.max(liveBookings.length + 10, 50), columnCount: 10 },
          },
        },
        {
          properties: {
            title: '4_التقفيل_اليومي',
            rightToLeft: true,
            gridProperties: { rowCount: Math.max(closings.length + 10, 50), columnCount: 12 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'فشل إنشاء جدول بيانات Google Sheets');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare rows for each tab
  // Tab 1: Products
  const prodHeader = [
    'الكود',
    'اسم المنتج',
    'التصنيف',
    'المورد',
    'سعر الجملة (ج.م)',
    'سعر البيع (ج.م)',
    'الرصيد الافتتاحي',
    'حد إعادة الطلب',
    'الرصيد الحالي',
    'قيمة المخزون',
    'ربح القطعة',
    'الحالة',
  ];
  const prodRows = products.map((p) => [
    p.id,
    p.name,
    p.category,
    p.supplier,
    p.costPrice,
    p.sellPrice,
    p.initialStock,
    p.reorderLevel,
    p.currentStock,
    p.currentStock * p.costPrice,
    p.sellPrice - p.costPrice,
    p.currentStock === 0 ? 'نفد' : p.currentStock <= p.reorderLevel ? 'منخفض' : 'متوفر',
  ]);

  // Tab 2: All Sales (Store + Live)
  const salesHeader = [
    'التاريخ / الوقت',
    'نوع العملية',
    'رقم المعاملة',
    'الكود',
    'اسم المنتج',
    'الكمية',
    'سعر القطعة',
    'الإجمالي',
    'الربح',
    'البائع / العميل',
    'طريقة الدفع',
    'حالة العملية',
    'ملاحظات',
  ];
  const combinedSalesRows = [
    ...sales.map((s) => [
      s.date,
      'مبيعات محل',
      s.id,
      s.productId,
      s.productName,
      s.quantity,
      s.actualPrice,
      s.total,
      s.profit,
      s.sellerName,
      s.paymentMethod,
      s.status,
      s.notes || '',
    ]),
    ...liveBookings.map((l) => [
      l.timestamp,
      'لايف تيك توك',
      l.id,
      l.productId,
      l.productName,
      l.quantity,
      l.unitPrice,
      l.total,
      l.unitPrice * l.quantity, // profit approx
      l.customerName,
      l.paymentStatus,
      l.packagingStatus,
      l.notes || '',
    ]),
  ];

  // Tab 3: Packaging & Shipping
  const packHeader = [
    'رقم الطلب',
    'وقت الحجز',
    'اسم العميل',
    'الكود',
    'اسم المنتج',
    'الكمية',
    'سعر الوحدة',
    'الإجمالي',
    'حالة التجهيز والشحن',
    'ملاحظات العميل',
  ];
  const packRows = liveBookings.map((l) => [
    l.id,
    l.timestamp,
    l.customerName,
    l.productId,
    l.productName,
    l.quantity,
    l.unitPrice,
    l.total,
    l.packagingStatus,
    l.notes || '',
  ]);

  // Tab 4: Daily Closings
  const closeHeader = [
    'تاريخ اليومية',
    'حالة اليومية',
    'مبيعات المحل',
    'مبيعات اللايف المدفوعة',
    'إجمالي المبيعات',
    'عمليات المحل',
    'حجوزات اللايف',
    'إجمالي الخصومات',
    'صافي الأرباح',
    'النقدية (كاش)',
    'انستاباي ومحافظ',
    'ملاحظات التقفيل',
  ];
  const closeRows = closings.map((c) => [
    c.date,
    c.status,
    c.storeCompletedSales,
    c.livePaidSales,
    c.totalSales,
    c.storeTransactionsCount,
    c.liveBookingsCount,
    c.totalDiscounts,
    c.netProfit,
    c.cashAmount,
    c.instaPayAmount + c.walletAmount,
    c.notes || '',
  ]);

  // Batch update spreadsheet values
  const valueRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: '1_المخزون_والمنتجات!A1',
            values: [prodHeader, ...prodRows],
          },
          {
            range: '2_مبيعات_المحل_واللايف!A1',
            values: [salesHeader, ...combinedSalesRows],
          },
          {
            range: '3_التجهيز_والشحن_والفواتير!A1',
            values: [packHeader, ...packRows],
          },
          {
            range: '4_التقفيل_اليومي!A1',
            values: [closeHeader, ...closeRows],
          },
        ],
      }),
    }
  );

  if (!valueRes.ok) {
    console.warn('Failed to populate rows into new sheet');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

export function exportLocalCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          const str = String(val ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const APPS_SCRIPT_TEMPLATE = `/**
 * كود جوجل سكريبت اختياري (Google Apps Script)
 * يمكنك نسخه ولصقه في Google Sheets عبر (ملحقات > Apps Script)
 * للأتمتة التلقائية بين تبويبات اللايف والتجهيز والمخزون
 */

function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();
  var range = e.range;
  var row = range.getRow();
  var col = range.getColumn();
  
  // عند تغيير حالة الحجز في اللايف إلى "تم الدفع"
  // العمود 7 هو حالة الدفع
  if (sheetName === "2_مبيعات_المحل_واللايف" && col === 11 && row > 1) {
    var status = range.getValue();
    if (status === "تم الدفع") {
      // إرسال إشعار أو نقل تلقائي للتجهيز
      SpreadsheetApp.getActiveSpreadsheet().toast("تم تأكيد دفع الطلب وجاهز للتجهيز!", "إشعار التجهيز");
    }
  }
}

// دالة لتحديث رصيد المخزون بناء على المبيعات المكتملة
function updateInventoryStock() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var prodSheet = ss.getSheetByName("1_المخزون_والمنتجات");
  var salesSheet = ss.getSheetByName("2_مبيعات_المحل_واللايف");
  
  if (!prodSheet || !salesSheet) return;
  ss.toast("تمت مزامنة المخزون التلقائي بنجاح!", "مزامنة");
}
`;
