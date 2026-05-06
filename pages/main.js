/**
 * MENTRA ERP - Smart Dashboard (v10.0 Pro)
 * الميزات: ربط المصروفات بالقيود اليومية، حساب التكلفة والربح اللحظي، تنبيهات النواقص الذكية
 */

// ==========================================
// الجزء الأول: تهيئة قاعدة البيانات (Database Init)
// ==========================================

const db = new Dexie("MentraLocalCache");

db.version(4).stores({
    settings: 'id, project_name, shop_name, phone, logo',
    local_users: '++id, username, full_name, role', 
    active_session: 'id, user_id, login_time',
    products: '++id, name_ar, sku, category, stock_qty, price, cost', 
    invoices: '++id, invoice_number, type, customer_vendor_id, date, total, status',
    invoice_items: '++id, invoice_id, product_id, price, qty, total_item',
    accounts: '++id, code, name_ar, type, balance',
    journal: '++id, date, ref_no, description, total', // 👈 المصروفات هنا
    journal_items: '++id, journal_id, account_id, debit, credit',
    stock_movements: '++id, product_id, type, qty, date, ref_id'
});

db.on("ready", function () {
    const tables = db.tables.map(t => t.name);
    const requiredTables = ["products", "invoices", "invoice_items", "journal"];
    if (requiredTables.some(t => !tables.includes(t))) {
        console.warn("⚠️ جداول مفقودة! جاري إعادة بناء قاعدة البيانات للترقية...");
        return db.delete().then(() => location.reload());
    }
});

const dbUtils = {
    updateStock: async (productId, changeQty, mode = 'decrease') => {
        try {
            const product = await db.table('products').get(productId);
            if (product) {
                const newQty = (mode === 'decrease') 
                    ? (Number(product.stock_qty) || 0) - Number(changeQty)
                    : (Number(product.stock_qty) || 0) + Number(changeQty);
                await db.table('products').update(productId, { stock_qty: newQty });
            }
        } catch (err) { console.error("❌ خطأ في تحديث المخزن:", err); }
    },
    requestPersistence: async () => {
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
        }
    }
};

async function initDB() {
    try {
        await dbUtils.requestPersistence();
        await db.open();
        console.log("🚀 محرك MENTRA DB جاهز");
        initDashboard();
    } catch (err) {
        console.error("❌ فشل تشغيل القاعدة:", err);
        if (err.name === 'VersionError') {
            await db.delete();
            location.reload();
        }
    }
}

// ==========================================
// الجزء الثاني: بناء لوحة التحكم (Smart Dashboard)
// ==========================================

function initDashboard() {
    if (typeof window.modernDashboard !== 'undefined') {
        console.log('Loading Modern Dashboard...');
    } else {
        renderDashboardUI();
    }
}

// 1. بناء هيكل الشاشة
function renderDashboardUI() {
    const container = document.getElementById('main-content-display');
    if(!container) return; 

    // إعداد تواريخ اليوم كافتراضي
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    container.innerHTML = `
        <div class="animate-fade-in space-y-6 pb-12" style="direction: rtl; -webkit-tap-highlight-color: transparent;">
            <!-- الهيدر وفلتر التاريخ المتقدم -->
            <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                <div>
                    <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <i class="fas fa-chart-line text-blue-600"></i> ملخص الأداء المالي
                    </h2>
                    <p class="text-sm font-bold text-slate-500 mt-1" id="date-label">إحصائيات مبيعات وأرباح الفترة المحددة</p>
                </div>
                
                <div class="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    <div class="flex gap-2 w-full md:w-auto">
                        <button onclick="setQuickDate('today')" class="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-95">اليوم</button>
                        <button onclick="setQuickDate('month')" class="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-95">هذا الشهر</button>
                    </div>
                    <div class="hidden md:block w-px h-8 bg-slate-300"></div>
                    <div class="flex items-center gap-2 w-full md:w-auto">
                        <span class="text-xs font-black text-slate-400">من</span>
                        <input type="date" id="date-from" value="${todayStr}" onchange="fetchAndUpdateStats()" class="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-blue-500 w-full md:w-auto cursor-pointer">
                        <span class="text-xs font-black text-slate-400">إلى</span>
                        <input type="date" id="date-to" value="${todayStr}" onchange="fetchAndUpdateStats()" class="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-blue-500 w-full md:w-auto cursor-pointer">
                    </div>
                </div>
            </div>

            <!-- مؤشرات الأداء المالي (KPIs) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <!-- المبيعات -->
                <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[11px] font-black text-slate-400 uppercase">إجمالي المبيعات</p>
                                <div class="text-2xl font-black text-slate-800 mt-1 font-mono tracking-tighter" id="dash-sales">0.00</div>
                            </div>
                            <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner text-xl"><i class="fas fa-wallet"></i></div>
                        </div>
                        <p class="text-[11px] font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-lg" id="dash-sales-count"><i class="fas fa-file-invoice ml-1"></i> 0 فاتورة</p>
                    </div>
                </div>

                <!-- تكلفة البضاعة المباعة -->
                <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[11px] font-black text-slate-400 uppercase">تكلفة المبيعات (COGS)</p>
                                <div class="text-2xl font-black text-slate-800 mt-1 font-mono tracking-tighter" id="dash-cogs">0.00</div>
                            </div>
                            <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner text-xl"><i class="fas fa-box-open"></i></div>
                        </div>
                        <p class="text-[11px] font-bold text-amber-600">تكلفة البضاعة التي تم بيعها</p>
                    </div>
                </div>

                <!-- المصروفات (قيود يومية) -->
                <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-20 h-20 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-[11px] font-black text-slate-400 uppercase">المصروفات التشغيلية</p>
                                <div class="text-2xl font-black text-slate-800 mt-1 font-mono tracking-tighter" id="dash-expenses">0.00</div>
                            </div>
                            <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner text-xl"><i class="fas fa-arrow-down"></i></div>
                        </div>
                        <p class="text-[11px] font-bold text-rose-600 bg-rose-50 inline-block px-2 py-1 rounded-lg" id="dash-exp-count"><i class="fas fa-clipboard-list ml-1"></i> 0 قيد يومي</p>
                    </div>
                </div>

                <!-- صافي الربح (ديناميكي اللون) -->
                <div id="profit-card" class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 shadow-lg text-white relative overflow-hidden transition-colors">
                    <div class="absolute -right-4 -bottom-4 text-7xl text-white/10"><i class="fas fa-chart-pie"></i></div>
                    <div class="relative z-10">
                        <p class="text-[11px] font-black text-white/80 uppercase">صافي الربح الفعلي</p>
                        <div class="text-3xl font-black mt-1 mb-4 font-mono tracking-tighter" id="dash-profit">0.00</div>
                        
                        <!-- هامش الربح -->
                        <div class="w-full bg-white/20 rounded-full h-1.5 mb-1.5 overflow-hidden">
                            <div id="profit-margin-bar" class="bg-white h-1.5 rounded-full" style="width: 0%"></div>
                        </div>
                        <p class="text-xs font-bold text-white/90 flex justify-between items-center">
                            <span>هامش الربح التشغيلي:</span> 
                            <span id="dash-margin" class="font-black bg-white/20 px-2 rounded">0%</span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- قسم المخزون والتنبيهات -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- تقييم المخزن -->
                <div class="bg-gradient-to-br from-slate-900 to-[#0f172a] rounded-[2.5rem] p-6 shadow-xl text-white lg:col-span-1 relative overflow-hidden">
                    <div class="absolute -left-6 -bottom-6 text-8xl text-white/5"><i class="fas fa-warehouse"></i></div>
                    <h3 class="relative z-10 text-lg font-black mb-6 flex items-center gap-2"><i class="fas fa-warehouse text-blue-400"></i> حالة المخزون (الآن)</h3>
                    <div class="relative z-10 space-y-4">
                        <div class="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p class="text-[11px] font-black text-slate-400 uppercase">إجمالي قيمة البضاعة</p>
                            <div class="text-2xl font-black text-white mt-1 font-mono tracking-tighter" id="dash-stock-value">0.00 <span class="text-sm font-normal font-sans text-slate-400">ج.م</span></div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white/5 p-3 rounded-2xl text-center backdrop-blur-sm">
                                <div class="text-xl font-black text-blue-300 font-mono" id="dash-products-count">0</div>
                                <div class="text-[10px] font-bold text-slate-400 mt-1">منتج مسجل</div>
                            </div>
                            <!-- كارت النواقص مع تأثير النبض والتحويل الذكي -->
                            <div id="low-stock-card" class="bg-rose-500/20 border border-rose-500/30 p-3 rounded-2xl text-center cursor-pointer hover:bg-rose-500/40 hover:scale-105 transition-all duration-300 shadow-md backdrop-blur-sm" onclick="navigateToModule('Inventory')">
                                <div class="text-xl font-black text-rose-400 font-mono" id="dash-low-stock">0</div>
                                <div class="text-[10px] font-bold text-rose-300 mt-1"><i class="fas fa-external-link-alt ml-1"></i> نواقص (للجرد)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- الإجراءات السريعة -->
                <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 lg:col-span-2">
                    <h3 class="text-lg font-black text-slate-800 mb-5 flex items-center gap-2"><i class="fas fa-bolt text-amber-500"></i> إجراءات سريعة</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onclick="navigateToModule('sales')" class="group bg-slate-50 hover:bg-blue-600 p-5 rounded-3xl text-center transition-all border border-slate-100 active:scale-95 shadow-sm">
                            <div class="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <i class="fas fa-shopping-cart text-xl text-blue-600"></i>
                            </div>
                            <div class="text-[13px] font-black text-slate-700 group-hover:text-white">نقطة البيع</div>
                        </button>
                        
                        <button onclick="navigateToModule('purchases')" class="group bg-slate-50 hover:bg-indigo-600 p-5 rounded-3xl text-center transition-all border border-slate-100 active:scale-95 shadow-sm">
                            <div class="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <i class="fas fa-truck-loading text-xl text-indigo-600"></i>
                            </div>
                            <div class="text-[13px] font-black text-slate-700 group-hover:text-white">شراء بضاعة</div>
                        </button>

                        <button onclick="navigateToModule('settings')" class="group bg-slate-50 hover:bg-emerald-600 p-5 rounded-3xl text-center transition-all border border-slate-100 active:scale-95 shadow-sm">
                            <div class="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <i class="fas fa-download text-xl text-emerald-600"></i>
                            </div>
                            <div class="text-[13px] font-black text-slate-700 group-hover:text-white">نسخة احتياطية</div>
                        </button>

                        <button onclick="navigateToModule('system_info')" class="group bg-slate-50 hover:bg-sky-600 p-5 rounded-3xl text-center transition-all border border-slate-100 active:scale-95 shadow-sm">
                            <div class="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <i class="fas fa-sync text-xl text-sky-600"></i>
                            </div>
                            <div class="text-[13px] font-black text-slate-700 group-hover:text-white">مزامنة البيانات</div>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- إعلان النسخة السحابية -->
            <div class="bg-gradient-to-r from-slate-900 via-[#0f172a] to-blue-900 rounded-[2rem] p-1.5 shadow-lg mt-2">
                <div class="bg-white/5 backdrop-blur-md rounded-[1.7rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5">
                    <div class="flex items-center gap-4 text-center md:text-right">
                        <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shrink-0">
                            <i class="fas fa-cloud"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-black text-sm md:text-base mb-1">هل تبحث عن نظام يدعم تعدد الفروع والأجهزة معاً؟</h4>
                            <p class="text-blue-200/80 text-[11px] font-bold leading-relaxed max-w-md">
                                قم بالترقية للنسخة السحابية <span class="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] mx-1 uppercase">Pro</span> للحصول على مزامنة لحظية، جرد بالباركود عبر الموبايل، وصلاحيات للموظفين.
                            </p>
                        </div>
                    </div>
                    <a href="https://wa.me/201211934816" target="_blank" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-900/50 whitespace-nowrap">
                        <i class="fab fa-whatsapp text-lg"></i> تواصل مع المبيعات
                    </a>
                </div>
            </div>
        </div>
    `;

    fetchAndUpdateStats();
}

// 2. دوال مساعدة لضبط التاريخ السريع
window.setQuickDate = function(type) {
    const today = new Date();
    const toInput = document.getElementById('date-to');
    const fromInput = document.getElementById('date-from');
    
    toInput.value = today.toISOString().split('T')[0];

    if (type === 'today') {
        fromInput.value = today.toISOString().split('T')[0];
    } else if (type === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDay.setHours(12); 
        fromInput.value = firstDay.toISOString().split('T')[0];
    }
    fetchAndUpdateStats();
};

// 3. المحرك الذكي لجلب وتحليل البيانات (تم تحديثه لقراءة القيود اليومية)
window.fetchAndUpdateStats = async function() {
    try {
        if (!db.isOpen()) await db.open();

        const fromStr = document.getElementById('date-from').value;
        const toStr = document.getElementById('date-to').value;
        
        const dateFrom = new Date(fromStr);
        dateFrom.setHours(0, 0, 0, 0);
        
        const dateTo = new Date(toStr);
        dateTo.setHours(23, 59, 59, 999);

        // جلب البيانات مع إضافة جدول القيود اليومية
        const [allInvoices, allInvoiceItems, products, allJournals] = await Promise.all([
            db.invoices.toArray(),
            db.invoice_items.toArray(),
            db.products.toArray(),
            db.journal.toArray() // 👈 قراءة المصروفات هنا
        ]);

        const productMap = new Map();
        products.forEach(p => productMap.set(p.id, p));

        let totalSales = 0, salesCount = 0;
        let totalCOGS = 0;
        let totalExpenses = 0, expCount = 0;

        // 3.أ. تحليل الفواتير (المبيعات)
        allInvoices.forEach(inv => {
            if (inv.status === 'cancelled' || inv.status === 'draft') return;
            if (!inv.date) return;

            const invDate = new Date(inv.date);
            if (invDate >= dateFrom && invDate <= dateTo) {
                const amount = parseFloat(String(inv.total || '0').replace(/[^0-9.-]+/g, "")) || 0;
                const typeStr = String(inv.type || '').toLowerCase().trim();

                // المبيعات (نحسب الإيراد + التكلفة)
                if (typeStr === 'sale' || typeStr === 'sales' || typeStr.includes('مبيع')) {
                    totalSales += amount;
                    salesCount++;
                    
                    const items = allInvoiceItems.filter(item => item.invoice_id === inv.id);
                    items.forEach(item => {
                        const product = productMap.get(item.product_id);
                        const unitCost = product ? (parseFloat(product.cost) || 0) : 0;
                        totalCOGS += (unitCost * parseFloat(item.qty || 0));
                    });
                }
            }
        });

        // 3.ب. تحليل المصروفات من القيود اليومية 👈 (الإضافة الجديدة)
        allJournals.forEach(jrn => {
            if (!jrn.date) return;
            const jrnDate = new Date(jrn.date);
            if (jrnDate >= dateFrom && jrnDate <= dateTo) {
                const amount = parseFloat(String(jrn.total || '0').replace(/[^0-9.-]+/g, "")) || 0;
                totalExpenses += amount;
                expCount++;
            }
        });

        // 4. الحسابات النهائية
        const netProfit = totalSales - totalCOGS - totalExpenses; // صافي الربح الدقيق
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

        // حسابات المخزون 
        const totalStockValue = products.reduce((sum, p) => sum + ((Number(p.stock_qty) || 0) * (Number(p.cost) || 0)), 0);
        const lowStockProducts = products.filter(p => (Number(p.stock_qty) || 0) <= (p.min_stock || 5));

        // 5. تحديث الواجهة DOM
        const formatMoney = (num) => Number(num).toLocaleString('en-US', {minimumFractionDigits: 2});

        document.getElementById('dash-sales').innerText = formatMoney(totalSales);
        document.getElementById('dash-sales-count').innerHTML = `<i class="fas fa-file-invoice ml-1"></i> ${salesCount} فاتورة`;
        
        document.getElementById('dash-cogs').innerText = formatMoney(totalCOGS);
        
        // تحديث كارت المصروفات
        document.getElementById('dash-expenses').innerText = formatMoney(totalExpenses);
        document.getElementById('dash-exp-count').innerHTML = `<i class="fas fa-clipboard-list ml-1"></i> ${expCount} قيد/مصروف`;

        const profitEl = document.getElementById('dash-profit');
        const profitCard = document.getElementById('profit-card');
        const marginEl = document.getElementById('dash-margin');
        const marginBar = document.getElementById('profit-margin-bar');

        profitEl.innerText = formatMoney(netProfit);
        marginEl.innerText = `${profitMargin.toFixed(1)}%`;
        marginBar.style.width = `${Math.min(Math.max(profitMargin, 0), 100)}%`;

        // تغيير لون كارت الربح إذا كان خسارة
        if (netProfit < 0) {
            profitCard.className = "bg-gradient-to-br from-rose-500 to-red-600 rounded-[2.5rem] p-6 shadow-lg text-white relative overflow-hidden transition-colors";
        } else {
            profitCard.className = "bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 shadow-lg text-white relative overflow-hidden transition-colors";
        }

        document.getElementById('dash-stock-value').innerHTML = `${formatMoney(totalStockValue)} <span class="text-sm font-normal text-slate-400 font-sans">ج.م</span>`;
        document.getElementById('dash-products-count').innerText = products.length;
        
        // تأثير النبض للمخزون
        document.getElementById('dash-low-stock').innerText = lowStockProducts.length;
        const lowStockCard = document.getElementById('low-stock-card');
        if (lowStockProducts.length > 0) {
            lowStockCard.classList.add('animate-pulse', 'border-rose-400', 'bg-rose-500/30');
            lowStockCard.classList.remove('border-rose-500/30', 'bg-rose-500/20');
        } else {
            lowStockCard.classList.remove('animate-pulse', 'border-rose-400', 'bg-rose-500/30');
            lowStockCard.classList.add('border-rose-500/30', 'bg-rose-500/20');
        }

    } catch (error) {
        console.error('Error calculating dashboard stats:', error);
    }
};

// ==========================================
// الجزء الثالث: الدوال العامة (Global Actions)
// ==========================================

window.navigateToModule = function(moduleId) {
    if (typeof executeModuleLoad === 'function') {
        // بحث ذكي عن الزر يتجاهل حالة الأحرف (capital/small) لتجنب الأخطاء
        const buttons = document.querySelectorAll('[id^="btn-"]');
        let targetBtn = Array.from(buttons).find(b => b.id.toLowerCase() === `btn-${moduleId.toLowerCase()}`);
        
        if (targetBtn) {
            executeModuleLoad(moduleId, targetBtn);
        } else {
            // كحل بديل في حال عدم العثور على الزر في القائمة الجانبية
            executeModuleLoad(moduleId, null);
        }
    } else {
        alert('يرجى اختيار الوحدة من القائمة الجانبية');
    }
};


// بدء تشغيل النظام
initDB();
