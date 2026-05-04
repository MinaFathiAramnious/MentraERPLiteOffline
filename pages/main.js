/**
 * MENTRA ERP - Unified Main Module & Database (Advanced Version)
 * تم دمج مهيئ قاعدة البيانات مع لوحة التحكم + فلتر التاريخ التفاعلي
 */

// ==========================================
// الجزء الأول: تهيئة قاعدة البيانات (Database Init)
// ==========================================

const db = new Dexie("MentraLocalCache");

// تحديث الهيكلة (Schema) - الإصدار 4
db.version(4).stores({
    settings: 'id, project_name, shop_name, phone, logo',
    local_users: '++id, username, full_name, role', 
    active_session: 'id, user_id, login_time',
    products: '++id, name_ar, sku, category, stock_qty, price, cost', 
    invoices: '++id, invoice_number, type, customer_vendor_id, date, total, status',
    invoice_items: '++id, invoice_id, product_id, price, qty, total_item',
    accounts: '++id, code, name_ar, type, balance',
    journal: '++id, date, ref_no, description, total',
    journal_items: '++id, journal_id, account_id, debit, credit',
    stock_movements: '++id, product_id, type, qty, date, ref_id'
});

db.on("ready", function () {
    const tables = db.tables.map(t => t.name);
    const requiredTables = ["products", "invoices", "invoice_items"];
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
        console.log("🚀 محرك MENTRA DB جاهز - الإصدار:", db.verno);
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
// الجزء الثاني: لوحة التحكم (Dashboard UI)
// ==========================================

function initDashboard() {
    if (typeof window.modernDashboard !== 'undefined') {
        console.log('Loading Modern Dashboard...');
    } else {
        console.log('Loading Interactive Dashboard...');
        renderDashboardUI();
    }
}

// 1. دالة بناء هيكل الواجهة (تعمل مرة واحدة فقط)
function renderDashboardUI() {
    const container = document.getElementById('main-content-display');
    if(!container) return; 

    // الحصول على تاريخ اليوم بصيغة YYYY-MM-DD لوضعه كقيمة افتراضية
    const today = new Date();
    const todayFormatted = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    container.innerHTML = `
        <div class="space-y-6">
            <!-- الهيدر مع فلتر التاريخ -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h2 class="text-xl font-bold text-slate-800">نظرة عامة على الأداء</h2>
                    <p class="text-sm text-slate-500" id="date-text-label">إحصائيات المبيعات ليوم: اليوم</p>
                </div>
                <div class="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <i class="fas fa-calendar-alt text-blue-600"></i>
                    <label for="dashboard-date" class="text-sm font-medium text-slate-700">اختر التاريخ:</label>
                    <input type="date" id="dashboard-date" value="${todayFormatted}" 
                           onchange="fetchAndUpdateStats(this.value)"
                           class="bg-transparent border-none outline-none text-slate-800 font-bold cursor-pointer">
                </div>
            </div>

            <!-- الكروت الرئيسية -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10"></div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                            <i class="fas fa-shopping-cart text-xl"></i>
                        </div>
                        <span class="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md" id="sales-count-display">0 فاتورة</span>
                    </div>
                    <div class="text-3xl font-black text-slate-800 tracking-tight" id="sales-total-display">0.00 <span class="text-lg text-slate-500 font-normal">ج.م</span></div>
                    <div class="text-sm text-slate-500 mt-1 font-medium">إجمالي مبيعات اليوم المحدد</div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-10"></div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                            <i class="fas fa-boxes text-xl"></i>
                        </div>
                        <span class="text-sm font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md" id="low-stock-display">0 نواقص</span>
                    </div>
                    <div class="text-3xl font-black text-slate-800 tracking-tight" id="products-count-display">0</div>
                    <div class="text-sm text-slate-500 mt-1 font-medium">إجمالي المنتجات المسجلة</div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10"></div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                            <i class="fas fa-warehouse text-xl"></i>
                        </div>
                        <span class="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">تقييم المخزون</span>
                    </div>
                    <div class="text-3xl font-black text-slate-800 tracking-tight" id="stock-value-display">0.00 <span class="text-lg text-slate-500 font-normal">ج.م</span></div>
                    <div class="text-sm text-slate-500 mt-1 font-medium">تكلفة المخزون الحالي</div>
                </div>
            </div>

            <!-- التنبيهات (حاوية ديناميكية) -->
            <div id="alerts-container"></div>

            <!-- الإجراءات السريعة -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-md">
                <h3 class="text-lg font-bold mb-4">إجراءات سريعة</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onclick="navigateToModule('sales')" class="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all border border-white/10 backdrop-blur-sm">
                        <i class="fas fa-plus-circle text-2xl mb-2 text-blue-200"></i>
                        <div class="text-sm font-medium">فاتورة مبيعات</div>
                    </button>
                    <button onclick="navigateToModule('purchases')" class="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all border border-white/10 backdrop-blur-sm">
                        <i class="fas fa-shopping-cart text-2xl mb-2 text-indigo-200"></i>
                        <div class="text-sm font-medium">فاتورة مشتريات</div>
                    </button>
                    <button onclick="createBackup()" class="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all border border-white/10 backdrop-blur-sm">
                        <i class="fas fa-download text-2xl mb-2 text-emerald-200"></i>
                        <div class="text-sm font-medium">نسخ احتياطي</div>
                    </button>
                    <button onclick="syncData()" class="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all border border-white/10 backdrop-blur-sm">
                        <i class="fas fa-sync text-2xl mb-2 text-sky-200"></i>
                        <div class="text-sm font-medium">مزامنة البيانات</div>
                    </button>
                </div>
            </div>

            <!-- معلومات النظام والنسخة السحابية -->
            <div class="space-y-4">
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 class="text-lg font-bold text-slate-800 mb-4">معلومات النظام</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="text-slate-500 mb-1">حالة الاتصال</div>
                            <div class="font-bold ${navigator.onLine ? 'text-green-600' : 'text-rose-600'}">
                                <i class="fas fa-${navigator.onLine ? 'wifi' : 'wifi-slash'} ml-1"></i>
                                ${navigator.onLine ? 'متصل بالإنترنت' : 'يعمل أوفلاين'}
                            </div>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="text-slate-500 mb-1">آخر نسخة احتياطية</div>
                            <div class="font-bold text-slate-700">
                                <i class="fas fa-clock ml-1 text-slate-400"></i>
                                ${localStorage.getItem('lastBackupTime') ? new Date(parseInt(localStorage.getItem('lastBackupTime'))).toLocaleDateString('ar-EG') : 'لم يتم عمل نسخة'}
                            </div>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div class="text-slate-500 mb-1">إصدار النظام</div>
                            <div class="font-bold text-slate-700">
                                <i class="fas fa-laptop-code ml-1 text-slate-400"></i>
                                MENTRA ERP Lite 2.1
                            </div>
                        </div>
                    </div>
                </div>

                <!-- إعلان النسخة السحابية -->
                <div class="bg-gradient-to-r from-slate-900 via-[#0f172a] to-blue-900 rounded-[1.8rem] p-1 shadow-lg">
                    <div class="bg-white/5 backdrop-blur-md rounded-[1.6rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5">
                        <div class="flex items-center gap-4 text-center md:text-right">
                            <div class="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shrink-0">
                                <i class="fas fa-cloud"></i>
                            </div>
                            <div>
                                <h4 class="text-white font-black text-sm md:text-base mb-1">هل تمتلك أكثر من فرع أو تستخدم الموبايل؟</h4>
                                <p class="text-blue-200/80 text-[10px] md:text-[11px] font-bold leading-relaxed max-w-sm">
                                    النسخة السحابية <span class="text-blue-400 border-b border-blue-400/30 pb-0.5">Mentra Business</span> تدعم تعدد الفروع والأجهزة والمزامنة اللحظية مع صلاحيات للموظفين.
                                </p>
                            </div>
                        </div>
                        <a href="https://wa.me/201211934816" target="_blank" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 group active:scale-95 shadow-lg shadow-blue-900/50">
                            <i class="fab fa-whatsapp text-lg text-emerald-400 group-hover:scale-110 transition-transform"></i>
                            تواصل مع المبيعات
                        </a>
                    </div>
                </div>
            </div>
			<BR>
        </div>
    `;

    // جلب البيانات لأول مرة بناءً على تاريخ اليوم
    fetchAndUpdateStats(todayFormatted);
}

// 2. دالة جلب وتحديث البيانات (تعمل عند بدء التشغيل + عند تغيير التاريخ)
window.fetchAndUpdateStats = async function(selectedDateStr) {
    try {
        if (!db.isOpen()) await db.open();

        // تحديث النص ليوضح للمستخدم التاريخ الذي يراه
        const dateLabel = document.getElementById('date-text-label');
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        if(selectedDateStr === todayStr) {
            dateLabel.innerHTML = 'إحصائيات المبيعات ليوم: <strong>اليوم</strong>';
        } else {
            dateLabel.innerHTML = `إحصائيات المبيعات ليوم: <strong><span dir="ltr">${selectedDateStr}</span></strong>`;
        }

        // جلب البيانات من الجداول
        const [allInvoices, products] = await Promise.all([
            db.invoices.toArray(),
            db.products.toArray()
        ]);

        // ==========================================
        // 1. فلترة مبيعات التاريخ المحدد فقط
        // ==========================================
        const targetSales = allInvoices.filter(inv => {
            const typeStr = String(inv.type || '').toLowerCase().trim();
            const isSale = typeStr === 'sale' || typeStr === 'sales' || typeStr.includes('مبيع');

            let isTargetDate = false;
            if (inv.date) {
                try {
                    const invDateObj = new Date(inv.date);
                    const invDateFormatted = invDateObj.getFullYear() + '-' + String(invDateObj.getMonth() + 1).padStart(2, '0') + '-' + String(invDateObj.getDate()).padStart(2, '0');
                    isTargetDate = (invDateFormatted === selectedDateStr);
                } catch (e) {}
            }
            return isSale && isTargetDate;
        });

        // حساب الإجمالي
        const totalSales = targetSales.reduce((sum, inv) => {
            let cleanNumberStr = String(inv.total || '0').replace(/[^0-9.-]+/g, "");
            return sum + (parseFloat(cleanNumberStr) || 0);
        }, 0);

        // ==========================================
        // 2. حساب المخزون (هذا يعتمد على الوضع الحالي دائماً وليس التاريخ)
        // ==========================================
        const totalStockValue = products.reduce((sum, p) => sum + ((Number(p.stock_qty) || 0) * (Number(p.cost) || 0)), 0);
        const lowStockProducts = products.filter(p => (Number(p.stock_qty) || 0) <= (p.min_stock || 5));

        // ==========================================
        // 3. تحديث الأرقام في الواجهة مباشرة
        // ==========================================
        document.getElementById('sales-count-display').innerText = `${targetSales.length} فاتورة`;
        document.getElementById('sales-total-display').innerHTML = `${totalSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span class="text-lg text-slate-500 font-normal">ج.م</span>`;
        
        document.getElementById('products-count-display').innerText = products.length;
        document.getElementById('low-stock-display').innerText = `${lowStockProducts.length} نواقص`;
        
        document.getElementById('stock-value-display').innerHTML = `${totalStockValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span class="text-lg text-slate-500 font-normal">ج.م</span>`;

        // 4. تحديث التنبيهات إذا كان هناك نواقص
        const alertsContainer = document.getElementById('alerts-container');
        if (lowStockProducts.length > 0) {
            alertsContainer.innerHTML = `
                <div class="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div>
                                <div class="font-bold text-rose-800">تنبيه انخفاض المخزون</div>
                                <div class="text-rose-600 text-sm font-medium">يوجد ${lowStockProducts.length} منتجات وصلت للحد الأدنى</div>
                            </div>
                        </div>
                        <button onclick="window.location.href='#Inventory'" class="bg-white border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors shadow-sm">
                            مراجعة المخزن
                        </button>
                    </div>
                </div>
            `;
        } else {
            alertsContainer.innerHTML = '';
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
};

// ==========================================
// الجزء الثالث: الدوال العامة (Global Actions)
// ==========================================

window.navigateToModule = function(moduleId) {
    if (typeof executeModuleLoad === 'function') {
        executeModuleLoad(moduleId, document.getElementById(`btn-${moduleId}`));
    } else {
        console.error('executeModuleLoad function not found');
        alert('لا يمكن تحميل الوحدة المطلوبة');
    }
};

window.createBackup = async function() {
    if (window.backupManager) {
        try {
            const result = await window.backupManager.createFullBackup({
                encrypt: false, compress: false,
                description: `نسخة يدوية - ${new Date().toLocaleString('ar-EG')}`
            });
            if (result.success) {
                if (window.Swal) window.Swal.fire({icon: 'success', title: 'تم', text: 'تم إنشاء النسخة', toast: true, position: 'top-start', showConfirmButton: false, timer: 3000});
                else alert('تم إنشاء النسخة الاحتياطية بنجاح');
            } else {
                throw new Error("Backup failed");
            }
        } catch (error) {
            if (window.Swal) window.Swal.fire({icon: 'error', title: 'خطأ', text: 'فشل إنشاء النسخة'});
            else alert('حدث خطأ أثناء النسخ الاحتياطي');
        }
    } else {
        alert('أداة النسخ الاحتياطي غير متوفرة حالياً');
    }
};

window.syncData = async function() {
    if (window.syncManager) {
        try {
            const result = await window.syncManager.performSync();
            if (result.success) {
                if (window.Swal) window.Swal.fire({icon: 'success', title: 'نجاح', text: `تمت مزامنة ${result.synced || 0} عنصر`, toast: true, position: 'top-start', showConfirmButton: false, timer: 3000});
                else alert(`تمت المزامنة بنجاح`);
            } else {
                throw new Error("Sync failed");
            }
        } catch (error) {
            if (window.Swal) window.Swal.fire({icon: 'error', title: 'خطأ', text: 'فشلت المزامنة'});
            else alert('حدث خطأ أثناء المزامنة');
        }
    } else {
        alert('نظام المزامنة غير متاح');
    }
};

// بدء تشغيل كل شيء بمجرد تحميل الملف
initDB();