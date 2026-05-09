/**
 * MENTRA ERP - Smart Profit, Loss & Cash Flow Report (v11.0 Pro Max + Pagination + Fully Responsive)
 * الميزات: متجاوب مع جميع الشاشات، بحث بالتاريخ، ترقيم العمليات، قراءة المصروفات من القيود
 */

(function() {
    // 1. الاتصال بقاعدة البيانات
    const db = new Dexie("MentraLocalCache");
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

    // حالة الصفحة للتحكم في الترقيم
    const state = {
        transactions: [],
        currentPage: 1,
        itemsPerPage: 5
    };

    const renderLayout = () => {
        // إعداد تواريخ الشهر الحالي كافتراضي
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDay.setHours(12);
        const todayStr = today.toISOString().split('T')[0];
        const firstDayStr = firstDay.toISOString().split('T')[0];

        document.getElementById('main-content-display').innerHTML = `
        <div class="animate-fade-in space-y-4 md:space-y-6 pb-12 px-2 sm:px-4 md:px-0" style="direction: rtl; -webkit-tap-highlight-color: transparent;">
            
            <!-- Header & Date Filter -->
            <div class="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6">
                <div class="flex items-center gap-3 md:gap-4 w-full xl:w-auto">
                    <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-indigo-500/30 shrink-0">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">تقرير الأرباح والسيولة</h1>
                        <p class="text-[10px] sm:text-xs font-bold text-slate-500 mt-1">تحليل مالي دقيق للفترة المحددة</p>
                    </div>
                </div>
                
                <!-- فلاتر البحث بالتاريخ المتقدمة (متجاوبة) -->
                <div class="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                    <div class="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2 rounded-xl md:rounded-2xl border border-slate-200 w-full md:w-auto">
                        <div class="flex gap-1 w-full sm:w-auto justify-center">
                            <button onclick="setProfitQuickDate('today')" class="flex-1 sm:flex-none bg-white border border-slate-200 px-3 py-2 rounded-lg md:rounded-xl text-[11px] font-black text-slate-700 hover:text-indigo-600 transition-all shadow-sm active:scale-95">اليوم</button>
                            <button onclick="setProfitQuickDate('month')" class="flex-1 sm:flex-none bg-white border border-slate-200 px-3 py-2 rounded-lg md:rounded-xl text-[11px] font-black text-slate-700 hover:text-indigo-600 transition-all shadow-sm active:scale-95">الشهر</button>
                        </div>
                        <div class="hidden sm:block w-px h-6 bg-slate-300 mx-1"></div>
                        <div class="flex items-center justify-between sm:justify-start gap-2 px-1 w-full sm:w-auto mt-2 sm:mt-0">
                            <input type="date" id="profit-date-from" value="${firstDayStr}" onchange="window.refreshProfitReport()" class="bg-transparent text-[11px] md:text-xs font-black outline-none text-slate-700 w-full cursor-pointer focus:text-indigo-600">
                            <span class="text-slate-300 font-black">-</span>
                            <input type="date" id="profit-date-to" value="${todayStr}" onchange="window.refreshProfitReport()" class="bg-transparent text-[11px] md:text-xs font-black outline-none text-slate-700 w-full cursor-pointer focus:text-indigo-600">
                        </div>
                    </div>
                    <button onclick="window.refreshProfitReport()" class="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl md:rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0">
                        <i class="fas fa-search"></i> بحث
                    </button>
                </div>
            </div>

            <!-- Smart KPI Section (Grid المتجاوب) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <!-- 1. المحاسبة (الربح الفعلي) -->
                <div class="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                    <div class="absolute -left-6 -top-6 w-24 h-24 md:w-32 md:h-32 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-700 z-0 opacity-50"></div>
                    
                    <h2 class="relative z-10 text-base md:text-lg font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                        <i class="fas fa-calculator text-emerald-500 text-lg md:text-xl"></i> الربح المحاسبي الفعلي
                    </h2>
                    <div class="relative z-10 space-y-2 md:space-y-3" id="accounting-kpis">
                        <!-- سيتم ملؤه ديناميكياً -->
                    </div>
                </div>

                <!-- 2. السيولة (الفلوس في الجيب) -->
                <div class="bg-gradient-to-br from-slate-900 to-[#0f172a] rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl relative overflow-hidden text-white group">
                    <div class="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                    <div class="absolute -left-6 -bottom-6 text-7xl md:text-8xl text-white/5 group-hover:-rotate-12 transition-transform duration-700"><i class="fas fa-wallet"></i></div>
                    
                    <h2 class="relative z-10 text-base md:text-lg font-black mb-4 md:mb-6 flex items-center gap-2">
                        <i class="fas fa-coins text-blue-400 text-lg md:text-xl"></i> تحليل السيولة النقدية (الدرج)
                    </h2>
                    <div class="relative z-10 space-y-2 md:space-y-3" id="cashflow-kpis">
                        <!-- سيتم ملؤه ديناميكياً -->
                    </div>
                </div>
            </div>

            <!-- Insights (توضيح ذكي) -->
            <div class="bg-indigo-50 border border-indigo-100 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 shadow-inner">
                <div class="bg-white text-indigo-600 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-2xl md:text-3xl shrink-0 shadow-sm animate-bounce-slow">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div class="text-center sm:text-right w-full">
                    <h3 class="font-black text-indigo-900 mb-1 md:mb-2 text-base md:text-lg">فهم أرقامك بشكل صحيح</h3>
                    <p id="insight-text" class="text-xs md:text-sm font-bold text-indigo-700/80 leading-relaxed"></p>
                </div>
            </div>

            <!-- Transaction Details Table -->
            <div class="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h2 class="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                        <i class="fas fa-exchange-alt text-slate-400"></i> سجل العمليات بالفترة
                    </h2>
                    <span id="transactions-count-badge" class="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-indigo-100 whitespace-nowrap self-end sm:self-auto">
                        0 عملية
                    </span>
                </div>
                
                <!-- Table Wrapper with Edge-to-Edge scroll on mobile -->
                <div class="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto custom-scrollbar pb-4">
                    <table class="w-full text-right min-w-[650px]">
                        <thead>
                            <tr class="text-slate-400 text-[10px] md:text-[11px] font-black border-b border-slate-50 uppercase tracking-widest whitespace-nowrap">
                                <th class="pb-3 md:pb-4 pr-2 md:pr-4">التاريخ</th>
                                <th class="pb-3 md:pb-4">رقم المرجع</th>
                                <th class="pb-3 md:pb-4">البيان / الوصف</th>
                                <th class="pb-3 md:pb-4 text-center">دفع (خارج)</th>
                                <th class="pb-3 md:pb-4 text-center">قبض (داخل)</th>
                                <th class="pb-3 md:pb-4 text-center">المصدر</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-table" class="divide-y divide-slate-50">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </tbody>
                    </table>
                </div>
                
                <!-- أزرار الترقيم المتجاوبة -->
                <div id="profit-pagination" class="mt-4 md:mt-6 flex flex-wrap justify-center items-center gap-2 md:gap-3"></div>
            </div>
            
            <!-- إعلان النسخة السحابية -->
            <div class="bg-gradient-to-r from-slate-900 via-[#0f172a] to-blue-900 rounded-[1.5rem] md:rounded-[2rem] p-1 shadow-lg mt-4">
                <div class="bg-white/5 backdrop-blur-md rounded-[1.3rem] md:rounded-[1.8rem] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-5">
                    <div class="flex flex-col sm:flex-row items-center gap-3 md:gap-4 text-center sm:text-right">
                        <div class="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shrink-0">
                            <i class="fas fa-cloud"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-black text-sm md:text-base mb-1">هل تمتلك أكثر من فرع؟</h4>
                            <p class="text-blue-200/80 text-[10px] md:text-[11px] font-bold leading-relaxed max-w-sm">
                                النسخة السحابية <span class="bg-blue-500/20 text-blue-300 px-1 rounded mx-1 whitespace-nowrap">Mentra Business</span> تدعم الفروع والمزامنة.
                            </p>
                        </div>
                    </div>
                    <a href="https://wa.me/201211934816" target="_blank" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 md:px-6 py-3 md:py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 group active:scale-95 whitespace-nowrap">
                        <i class="fab fa-whatsapp text-base md:text-lg text-emerald-400 group-hover:scale-110 transition-transform"></i>
                        تواصل للمبيعات
                    </a>
                </div>
            </div>
        </div>
        
        <style>
            .custom-scrollbar::-webkit-scrollbar { height: 4px; md:height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            @keyframes bounce-slow { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(5%); } }
            .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        </style>
        `;
    };

    // --- دوال مساعدة للتاريخ ---
    window.setProfitQuickDate = function(type) {
        const today = new Date();
        const toInput = document.getElementById('profit-date-to');
        const fromInput = document.getElementById('profit-date-from');
        
        toInput.value = today.toISOString().split('T')[0];

        if (type === 'today') {
            fromInput.value = today.toISOString().split('T')[0];
        } else if (type === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            firstDay.setHours(12); 
            fromInput.value = firstDay.toISOString().split('T')[0];
        }
        window.refreshProfitReport();
    };

    // --- المحرك المتقدم (حساب الأرباح + المشتريات + القيود اليومية) ---
    async function calculateProfitData() {
        try {
            if (!db.isOpen()) await db.open();
            
            // قراءة التواريخ من الحقول
            const fromStr = document.getElementById('profit-date-from').value;
            const toStr = document.getElementById('profit-date-to').value;
            
            const dateFrom = new Date(fromStr); dateFrom.setHours(0, 0, 0, 0);
            const dateTo = new Date(toStr); dateTo.setHours(23, 59, 59, 999);
            
            let totalRevenue = 0; 
            let totalCOGS = 0; 
            let totalPurchases = 0; 
            let totalExpenses = 0; 
            let transactions = [];
            
            // جلب الداتا بشكل متوازي
            const [allInvoices, allInvoiceItems, allProducts, allJournals] = await Promise.all([
                db.invoices.toArray(),
                db.invoice_items.toArray(),
                db.products.toArray(),
                db.journal.toArray() 
            ]);

            const productMap = new Map();
            allProducts.forEach(p => productMap.set(p.id, p));
            
            // 1. معالجة الفواتير
            for (const inv of allInvoices) {
                if (!inv.date) continue;
                const invDate = new Date(inv.date);
                if (invDate < dateFrom || invDate > dateTo) continue; 
                if (inv.status === 'cancelled' || inv.status === 'draft') continue; 
                
                const amount = parseFloat(String(inv.total || '0').replace(/[^0-9.-]+/g, "")) || 0;
                if (amount === 0) continue;

                const typeStr = String(inv.type || '').toLowerCase().trim();
                const refNo = inv.invoice_number || `INV-${inv.id}`;
                
                if (typeStr === 'sale' || typeStr === 'sales' || typeStr.includes('مبيع')) {
                    totalRevenue += amount;
                    
                    let invoiceCOGS = 0;
                    const items = allInvoiceItems.filter(item => item.invoice_id === inv.id);
                    for(const item of items) {
                        const product = productMap.get(item.product_id);
                        const unitCost = product ? (parseFloat(product.cost) || 0) : 0; 
                        invoiceCOGS += (unitCost * parseFloat(item.qty || 0));
                    }
                    totalCOGS += invoiceCOGS;

                    transactions.push({
                        date: inv.date, ref: refNo, description: 'مبيعات للعملاء', 
                        out: 0, in: amount, impact: 'فاتورة مبيعات', type: 'sale'
                    });
                } 
                else if (typeStr === 'purchase' || typeStr === 'purchases' || typeStr.includes('مشتري')) {
                    totalPurchases += amount;
                    transactions.push({
                        date: inv.date, ref: refNo, description: 'شراء بضاعة للمخزن', 
                        out: amount, in: 0, impact: 'فاتورة مشتريات', type: 'purchase'
                    });
                }
            }

            // 2. معالجة القيود اليومية
            for (const jrn of allJournals) {
                if (!jrn.date) continue;
                const jrnDate = new Date(jrn.date);
                if (jrnDate < dateFrom || jrnDate > dateTo) continue;

                const amount = parseFloat(String(jrn.total || '0').replace(/[^0-9.-]+/g, "")) || 0;
                if (amount === 0) continue;

                totalExpenses += amount;
                transactions.push({
                    date: jrn.date, 
                    ref: jrn.ref_no || `JRN-${jrn.id}`, 
                    description: jrn.description || 'مصروف عام / قيد يومي', 
                    out: amount, 
                    in: 0, 
                    impact: 'قيد مصروفات', 
                    type: 'expense'
                });
            }
            
            const grossProfit = totalRevenue - totalCOGS; 
            const netIncome = grossProfit - totalExpenses; 
            const netCashFlow = totalRevenue - totalPurchases - totalExpenses;
            
            return {
                totalRevenue, totalCOGS, totalPurchases, totalExpenses,
                grossProfit, netIncome, netCashFlow,
                transactions
            };
            
        } catch (error) {
            console.error('Error calculating:', error);
            return null;
        }
    }

    // --- تحديث الواجهة المتجاوبة ---
    function renderDashboards(data) {
        const formatMoney = (n) => Number(n).toLocaleString('en-US', {minimumFractionDigits: 2});

        // 1. الأرباح
        document.getElementById('accounting-kpis').innerHTML = `
            <div class="flex justify-between items-center bg-slate-50 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl">
                <span class="text-[10px] md:text-xs font-black text-slate-500 uppercase">إجمالي المبيعات</span>
                <span class="text-sm md:text-base font-black text-emerald-600 font-mono">${formatMoney(data.totalRevenue)}</span>
            </div>
            <div class="flex justify-between items-center bg-slate-50 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl">
                <span class="text-[10px] md:text-xs font-black text-slate-500 uppercase">(-) تكلفة المباع</span>
                <span class="text-sm md:text-base font-black text-rose-500 font-mono">${formatMoney(data.totalCOGS)}</span>
            </div>
            <div class="flex justify-between items-center bg-slate-50 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl">
                <span class="text-[10px] md:text-xs font-black text-slate-500 uppercase">(-) المصروفات</span>
                <span class="text-sm md:text-base font-black text-rose-500 font-mono">${formatMoney(data.totalExpenses)}</span>
            </div>
            <div class="flex justify-between items-center ${data.netIncome >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'} p-4 md:p-5 rounded-xl md:rounded-2xl mt-3 md:mt-4 shadow-sm">
                <span class="text-xs md:text-sm font-black ${data.netIncome >= 0 ? 'text-emerald-800' : 'text-rose-800'}">صافي الربح الفعلي</span>
                <span class="text-xl md:text-2xl font-black ${data.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-mono">${formatMoney(data.netIncome)}</span>
            </div>
        `;

        // 2. السيولة
        document.getElementById('cashflow-kpis').innerHTML = `
            <div class="flex justify-between items-center bg-white/5 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl">
                <span class="text-[10px] md:text-xs font-black text-slate-300 uppercase">دخل (مبيعات)</span>
                <span class="text-sm md:text-base font-black text-blue-400 font-mono">${formatMoney(data.totalRevenue)}</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border border-white/5">
                <span class="text-[10px] md:text-xs font-black text-slate-300 uppercase">خرج (شراء بضاعة)</span>
                <span class="text-sm md:text-base font-black text-rose-400 font-mono">${formatMoney(data.totalPurchases)}</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl">
                <span class="text-[10px] md:text-xs font-black text-slate-300 uppercase">خرج (مصروفات)</span>
                <span class="text-sm md:text-base font-black text-rose-400 font-mono">${formatMoney(data.totalExpenses)}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center ${data.netCashFlow >= 0 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-rose-500/20 border border-rose-500/30'} p-4 md:p-5 rounded-xl md:rounded-2xl mt-3 md:mt-4 gap-2">
                <span class="text-xs md:text-sm font-black text-white">السيولة (بالدرج)</span>
                <span class="text-xl md:text-2xl font-black ${data.netCashFlow >= 0 ? 'text-blue-300' : 'text-rose-400'} font-mono">${formatMoney(data.netCashFlow)}</span>
            </div>
        `;

        // 3. التوضيح الذكي
        const insightText = document.getElementById('insight-text');
        if (data.netIncome > 0 && data.netCashFlow < 0) {
            insightText.innerHTML = `أنت تحقق ربحاً تشغيلياً جيداً <b>(${formatMoney(data.netIncome)})</b>، ولكن درج النقدية بالسالب <b>(${formatMoney(data.netCashFlow)})</b> لشرائك بضاعة عالية القيمة. أموالك في أمان كبضاعة!`;
        } else if (data.netIncome > 0 && data.netCashFlow >= 0) {
            insightText.innerHTML = `أداء ممتاز! مبيعاتك تغطي التكاليف وتوفر سيولة وربحاً حقيقياً بقيمة <b>${formatMoney(data.netIncome)}</b>.`;
        } else if (data.netIncome <= 0 && data.totalExpenses > 0) {
            insightText.innerHTML = `تنبيه: التكاليف أعلى من المبيعات. يُرجى مراجعة <b>المصروفات (${formatMoney(data.totalExpenses)})</b> وتقليلها.`;
        } else {
            insightText.innerHTML = `قم بتسجيل مبيعات ومصروفات للحصول على تحليل دقيق.`;
        }
    }

    // --- دالة عرض الجدول بالترقيم ---
    function renderPaginatedTransactions() {
        const tbody = document.getElementById('transactions-table');
        const paginationContainer = document.getElementById('profit-pagination');
        const countBadge = document.getElementById('transactions-count-badge');

        countBadge.innerHTML = `<i class="fas fa-layer-group ml-1"></i> ${state.transactions.length} عملية`;

        if (state.transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 md:py-12 text-slate-400 font-bold"><i class="fas fa-folder-open text-3xl md:text-4xl mb-3 block opacity-30"></i><span class="text-xs md:text-sm">لا توجد عمليات مسجلة</span></td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const displayData = state.transactions.slice(startIndex, endIndex);

        tbody.innerHTML = displayData.map(t => {
            let badgeClass = '';
            if(t.type === 'sale') badgeClass = 'bg-blue-50 text-blue-600 border border-blue-100';
            else if(t.type === 'purchase') badgeClass = 'bg-amber-50 text-amber-600 border border-amber-100';
            else badgeClass = 'bg-rose-50 text-rose-600 border border-rose-100';
            
            return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group whitespace-nowrap">
                <td class="py-3 md:py-4 pr-2 md:pr-4 font-black text-[9px] md:text-[10px] text-slate-400 font-mono tracking-tighter">${new Date(t.date).toLocaleDateString('ar-EG')}</td>
                <td class="py-3 md:py-4 text-[11px] md:text-xs font-black text-slate-700">${t.ref}</td>
                <td class="py-3 md:py-4 font-bold text-[10px] md:text-xs text-slate-600 max-w-[150px] md:max-w-none overflow-hidden text-ellipsis">${t.description}</td>
                <td class="py-3 md:py-4 text-center">
                    <span class="font-black text-xs md:text-sm font-mono ${t.out > 0 ? 'text-rose-500' : 'text-slate-300'}">
                        ${t.out > 0 ? Number(t.out).toLocaleString(undefined, {minimumFractionDigits:2}) : '-'}
                    </span>
                </td>
                <td class="py-3 md:py-4 text-center">
                    <span class="font-black text-xs md:text-sm font-mono ${t.in > 0 ? 'text-emerald-500' : 'text-slate-300'}">
                        ${t.in > 0 ? Number(t.in).toLocaleString(undefined, {minimumFractionDigits:2}) : '-'}
                    </span>
                </td>
                <td class="py-3 md:py-4 text-center">
                    <span class="px-2 md:px-3 py-1 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black ${badgeClass}">${t.impact}</span>
                </td>
            </tr>
        `}).join('');

        const totalPages = Math.ceil(state.transactions.length / state.itemsPerPage);

        if (totalPages > 1) {
            paginationContainer.innerHTML = `
                <button onclick="changeProfitPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-sm transition-all text-xs"><i class="fas fa-chevron-right"></i></button>
                <span class="px-3 md:px-5 py-1.5 md:py-2 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl font-black text-[10px] md:text-sm border border-indigo-100 whitespace-nowrap">صفحة ${state.currentPage} من ${totalPages}</span>
                <button onclick="changeProfitPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-sm transition-all text-xs"><i class="fas fa-chevron-left"></i></button>
            `;
        } else {
            paginationContainer.innerHTML = '';
        }
    }

    window.changeProfitPage = (newPage) => {
        const totalPages = Math.ceil(state.transactions.length / state.itemsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            state.currentPage = newPage;
            renderPaginatedTransactions();
            
            // تمرير خفيف للأعلى عند تقليب الصفحات في الموبايل لراحة المستخدم
            if(window.innerWidth < 768) {
                document.getElementById('transactions-count-badge').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    window.refreshProfitReport = async () => {
        const data = await calculateProfitData();
        if (data) {
            renderDashboards(data);
            state.transactions = data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            state.currentPage = 1; 
            renderPaginatedTransactions();
        }
    };

    async function init() {
        renderLayout();
        await window.refreshProfitReport();
    }

    init();
})();