import React from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  X,
  Radio,
  Store,
  PackageCheck,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  Users,
  Layers,
} from 'lucide-react';

interface BusinessGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessGuideModal: React.FC<BusinessGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">رؤية ودليل مدير الأعمال الذكي</h2>
              <p className="text-xs text-slate-400">
                خريطة التبسيط الشامل: كيف تودع صداع الـ 8 شيتات وتدير متجرك ولايفاتك بـ 4 إدارات سلسة
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: The Root Cause of Headache */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
            <span>تشخيص الهيدك الذي كان لديك في جوجل شيت:</span>
          </div>
          <p className="leading-relaxed">
            كان لديك <strong>8 صفحات منفصلة</strong> (لوحة التحكم، المنتجات، المبيعات، المشتريات، البحث السريع،
            اللايف، الشحن، فاتورة العميل). المشكلة الكبرى أن معادلات VLOOKUP كانت تعتمد على كتابة الأسماء بدقة
            حرفية (مثل "ام على " بمسافة أو بدون)، وكان موظفوك يضطرون لكتابة البيانات مرتين، بالإضافة لعدم وجود
            حماية ضد بيع قطعة محجوزة على اللايف في نفس وقت بيعها بالمحل!
          </p>
        </div>

        {/* Section 2: The New 4-Workspaces Blueprint */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>الهيكل الجديد الموحد (4 صفحات بدلاً من 8):</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Dept 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <Radio className="w-4 h-4" />
                <span>1. مكتب لايف التيك توك السريع</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                مخصص للسرعة أثناء البث! كتابة رقم الكود المختصر فقط (مثال: <strong>113</strong>) يظهر المنتج
                ورصيده الفعلي مباشرة، بضغطة زر واحدة تسجل العميل، فيحجز القطعة ويمنع بيعها لأي شخص آخر.
              </p>
            </div>

            {/* Dept 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-indigo-400 text-sm">
                <Store className="w-4 h-4" />
                <span>2. كاشير المحل والمشتريات</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                يستخدمه البائعون (أم ياسين، أحمد، سيف) للبيع المباشر السريع وتحديد الخصومات وطريقة الدفع
                (كاش، انستاباي، فودافون كاش، آجل)، مع قسم إدخال فواتير المشتريات وتنبيه ارتفاع سعر المورد.
              </p>
            </div>

            {/* Dept 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                <PackageCheck className="w-4 h-4" />
                <span>3. الشحن والتجهيز وفواتير العملاء</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                تجميع تلقائي لكل قطع العميل المدفوعة (مثال: كل قطع <strong>ام على</strong> الـ 10 أو قطع{' '}
                <strong>شوشو</strong> الـ 5) في شاشة واحدة، مع طباعة الفاتورة أو إرسال الحساب للعميل على الواتساب بضغطة زر!
              </p>
            </div>

            {/* Dept 4 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sky-400 text-sm">
                <CalendarCheck className="w-4 h-4" />
                <span>4. المخزون والتقفيل اليومي والخزينة</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                متابعة الـ 323 صنفًا، ومعرفة قيمة المخزون (170,599 ج.م)، وتقفيل الوردية اليومية بنقرة واحدة
                دون مسح أي بيانات سابقة، مع مطابقة الكاش بالدرج وفلوس المحافظ وانستاباي.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Standard Operating Procedures (SOP) for Staff */}
        <div className="space-y-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>بروتوكول تشغيل الفريق أثناء اللايف (SOP):</span>
          </h3>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <p>
                <strong>المذيع في اللايف:</strong> يعرض القطعة ويقول في المايك رقم الكود بوضوح (مثال: "يا جماعة
                دي قطعة رقم 86 أو 113").
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <p>
                <strong>المساعد بجوار المذيع:</strong> يكتب <strong>113</strong> في خانة البحث فوراً. تظهر الشاشة
                مباشرة هل القطعة متوفرة أم نفدت. يكتب اسم العميل من الكومنت ويضغط <strong>حجز مؤقت</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <p>
                <strong>مسؤول التحصيل والرسائل:</strong> عندما يحول العميل على انستاباي أو فودافون كاش، يضغط على
                زر <strong>تم الدفع</strong>. تلقائياً تذهب القطعة لتبويب <strong>الشحن والتغليف</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <p>
                <strong>مسؤول التغليف:</strong> يفتح صفحة "الشحن والتغليف"، يجد كل قطع العميل مجمعة في باقة
                واحدة، يغلفها ويضغط "تم التغليف"، ويطبع الفاتورة ويسلمها للمندوب.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Web App vs Google Apps Script Answer */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 text-xs text-slate-300 space-y-2">
          <strong className="text-white font-bold block text-sm">
            إجابة لسؤالك: هل تقلبه تطبيق ويب أم تكتفي بجوجل سكريبت؟
          </strong>
          <p className="leading-relaxed">
            النموذج الذي بنيناه لك الآن هو <strong>الحل الذهبي المزدوج</strong>:
            واجهة تطبيق ويب سريعة وسهلة جداً لأي موظف بدون أخطاء شيتات، وفي نفس الوقت متصلة بـ{' '}
            <strong>Google Sheets</strong> لحفظ ومزامنة وتصدير بياناتك سحابياً دائماً! وبذلك تكون جمعت بين
            قوة وسرعة التطبيق، وأمان ومرونة جوجل شيتس.
          </p>
        </div>

        {/* Close Button */}
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            فهمت الخطة وسأبدأ العمل بالسيستم
          </button>
        </div>
      </div>
    </div>
  );
};
