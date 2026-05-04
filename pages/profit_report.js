/**
 * MENTRA ERP - Profit & Loss Report (Fixed & Integrated)
 * تقرير الأرباح والخسائر متصل بقاعدة البيانات الفعلية للفواتير
 */

(function() {
    // 1. تعريف والاتصال بقاعدة البيانات (مهم جداً لتعمل الصفحة)
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

    const state = {
        profitData: null,
        period: 'current-month',
        chartInstance: null
    };

    const renderLayout = () => {
        document.getElementById('main-content-display').innerHTML = `
        <div class="animate-fade-in space-y-6 pb-12" style="direction: rtl;">
            <!-- Header with Period Selection -->
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div class="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-black text-slate-800 mb-2">
                            <i class="fas fa-chart-line text-emerald-500 ml-2"></i>
                            تقرير الأرباح والخسائر
                        </h1>
                        <p class="text-sm text-slate-500 font-bold">تحليل مالي دقيق يعتمد على الفواتير المسجلة</p>
                    </div>
                    <div class="flex gap-3">
                        <select id="period-selector" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option value="current-month">الشهر الحالي</option>
                            <option value="last-month">الشهر السابق</option>
                            <option value="current-year">السنة الحالية</option>
                            <option value="all-time">كل الأوقات</option>
                        </select>
                        <button onclick="window.refreshProfitReport()" class="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-md">
                            <i class="fas fa-sync-alt ml-1"></i> تحديث التقرير
                        </button>
                    </div>
                </div>
            </div>

            <!-- Key Performance Indicators -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="kpi-cards">
                <!-- سيتم ملؤها ديناميكياً -->
            </div>

            <!-- Detailed Profit Breakdown -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Revenue Breakdown -->
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h2 class="text-lg font-black text-slate-800 mb-4">
                        <i class="fas fa-arrow-up text-green-500 ml-2"></i>
                        تفصيل الإيرادات
                    </h2>
                    <div id="revenue-breakdown" class="space-y-3">
                        <!-- سيتم ملؤها ديناميكياً -->
                    </div>
                </div>

                <!-- Expense Breakdown -->
                <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h2 class="text-lg font-black text-slate-800 mb-4">
                        <i class="fas fa-arrow-down text-red-500 ml-2"></i>
                        تفصيل التكاليف والمصروفات
                    </h2>
                    <div id="expense-breakdown" class="space-y-3">
                        <!-- سيتم ملؤها ديناميكياً -->
                    </div>
                </div>
            </div>

            <!-- Profit Margins Analysis -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-[2.5rem] shadow-xl text-white">
                <h2 class="text-xl font-black mb-6">
                    <i class="fas fa-percentage ml-2"></i>
                    تحليل هوامش الربح للفترة
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="margins-analysis">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
            </div>

            <!-- Transaction Details Table -->
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h2 class="text-lg font-black text-slate-800 mb-4">
                    <i class="fas fa-list-ul text-slate-500 ml-2"></i>
                    سجل العمليات المؤثرة (الفواتير)
                </h2>
                <div class="overflow-x-auto">
                    <table class="w-full text-right">
                        <thead>
                            <tr class="text-slate-400 text-[10px] font-black border-b border-slate-50 uppercase tracking-widest">
                                <th class="pb-4 pr-4">التاريخ</th>
                                <th class="pb-4">رقم الفاتورة</th>
                                <th class="pb-4">الوصف</th>
                                <th class="pb-4">التصنيف</th>
                                <th class="pb-4 text-center">تكلفة (مصروف)</th>
                                <th class="pb-4 text-center">إيراد (مبيعات)</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-table" class="divide-y divide-slate-50">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </tbody>
                    </table>
                </div>
            </div>
			
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
        </div>
        `;
    };

    // --- Profit Calculation Engine (Modified to read from Invoices) ---

    async function calculateProfitData() {
        try {
            if (!db.isOpen()) await db.open();
            
            const allInvoices = await db.invoices.toArray();
            
            const periodFilter = getPeriodFilter(state.period);
            
            let totalRevenue = 0;
            let totalCOGS = 0; // Cost of Goods Sold (المشتريات)
            let totalExpenses = 0; // المصروفات الأخرى
            let revenueBreakdown = {};
            let expenseBreakdown = {};
            let transactions = [];
            
            // معالجة الفواتير وحساب الأرباح
            for (const inv of allInvoices) {
                // فلترة حسب التاريخ
                if (!inv.date || !isInPeriod(inv.date, periodFilter)) continue;
                
                // تنظيف المبلغ من أي نصوص
                const amount = parseFloat(String(inv.total || '0').replace(/[^0-9.-]+/g, "")) || 0;
                if (amount === 0) continue;

                const typeStr = String(inv.type || '').toLowerCase().trim();
                const refNo = inv.invoice_number || `INV-${inv.id}`;
                
                // 1. المبيعات (الإيرادات)
                if (typeStr === 'sale' || typeStr === 'sales' || typeStr.includes('مبيع')) {
                    totalRevenue += amount;
                    revenueBreakdown['إيرادات المبيعات'] = (revenueBreakdown['إيرادات المبيعات'] || 0) + amount;
                    
                    transactions.push({
                        date: inv.date, ref: refNo, description: 'فاتورة مبيعات', account: 'إيراد',
                        debit: 0, credit: amount, type: 'income'
                    });
                } 
                // 2. المشتريات (تكلفة البضاعة المباعة)
                else if (typeStr === 'purchase' || typeStr === 'purchases' || typeStr.includes('مشتري')) {
                    totalCOGS += amount;
                    expenseBreakdown['تكلفة المشتريات'] = (expenseBreakdown['تكلفة المشتريات'] || 0) + amount;
                    
                    transactions.push({
                        date: inv.date, ref: refNo, description: 'فاتورة مشتريات', account: 'تكلفة/مشتريات',
                        debit: amount, credit: 0, type: 'expense'
                    });
                }
                // 3. المصروفات الأخرى (إن وجدت)
                else if (typeStr.includes('expense') || typeStr.includes('مصروف')) {
                    totalExpenses += amount;
                    expenseBreakdown['مصروفات تشغيلية'] = (expenseBreakdown['مصروفات تشغيلية'] || 0) + amount;
                    
                    transactions.push({
                        date: inv.date, ref: refNo, description: 'سند مصروفات', account: 'مصروفات',
                        debit: amount, credit: 0, type: 'expense'
                    });
                }
            }
            
            // حساب المؤشرات المالية
            const grossProfit = totalRevenue - totalCOGS; // مجمل الربح (المبيعات - المشتريات)
            const netIncome = grossProfit - totalExpenses; // صافي الربح
            
            const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
            const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
            const operatingMargin = totalRevenue > 0 ? ((totalRevenue - totalCOGS - totalExpenses) / totalRevenue) * 100 : 0;
            
            return {
                totalRevenue,
                totalCOGS,
                totalExpenses,
                grossProfit,
                netIncome,
                grossMargin,
                netMargin,
                operatingMargin,
                revenueBreakdown,
                expenseBreakdown,
                transactions,
                period: state.period
            };
            
        } catch (error) {
            console.error('Error calculating profit data:', error);
            return null;
        }
    }

    function getPeriodFilter(period) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        switch (period) {
            case 'current-month':
                return { startDate: new Date(currentYear, currentMonth, 1), endDate: new Date(currentYear, currentMonth + 1, 0) };
            case 'last-month':
                return { startDate: new Date(currentYear, currentMonth - 1, 1), endDate: new Date(currentYear, currentMonth, 0) };
            case 'current-year':
                return { startDate: new Date(currentYear, 0, 1), endDate: new Date(currentYear, 11, 31) };
            case 'all-time':
                return { startDate: new Date(2000, 0, 1), endDate: new Date(2100, 0, 1) }; // كل الأوقات
            default:
                return { startDate: new Date(currentYear, currentMonth, 1), endDate: new Date(currentYear, currentMonth + 1, 0) };
        }
    }

    function isInPeriod(dateString, periodFilter) {
        try {
            const date = new Date(dateString);
            return date >= periodFilter.startDate && date <= periodFilter.endDate;
        } catch(e) { return false; }
    }

    // --- UI Rendering Functions ---

    async function renderKPICards(profitData) {
        const container = document.getElementById('kpi-cards');
        
        container.innerHTML = `
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-[2rem] text-white shadow-xl">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-[10px] font-black text-green-100 uppercase">إجمالي الإيرادات (المبيعات)</p>
                        <h3 class="text-2xl font-bold mt-1">${profitData.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="text-sm">ج.م</span></h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-xl">
                        <i class="fas fa-arrow-up text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-[2rem] text-white shadow-xl">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-[10px] font-black text-red-100 uppercase">إجمالي التكاليف (المشتريات)</p>
                        <h3 class="text-2xl font-bold mt-1">${(profitData.totalCOGS + profitData.totalExpenses).toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="text-sm">ج.م</span></h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-xl">
                        <i class="fas fa-arrow-down text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[2rem] text-white shadow-xl">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-[10px] font-black text-blue-100 uppercase">الربح الإجمالي</p>
                        <h3 class="text-2xl font-bold mt-1">${profitData.grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="text-sm">ج.م</span></h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-xl">
                        <i class="fas fa-chart-bar text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-xl">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-[10px] font-black text-amber-100 uppercase">صافي الربح</p>
                        <h3 class="text-2xl font-bold mt-1">${profitData.netIncome.toLocaleString('en-US', {minimumFractionDigits: 2})} <span class="text-sm">ج.م</span></h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-xl">
                        <i class="fas fa-coins text-xl"></i>
                    </div>
                </div>
            </div>
        `;
    }

    function renderBreakdowns(profitData) {
        // تفصيل الإيرادات
        const revenueContainer = document.getElementById('revenue-breakdown');
        const totalRevenue = profitData.totalRevenue;
        
        revenueContainer.innerHTML = Object.entries(profitData.revenueBreakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([name, amount]) => {
                const percentage = totalRevenue > 0 ? (amount / totalRevenue * 100).toFixed(1) : 0;
                return `
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span class="font-black text-sm text-slate-700">${name}</span>
                        </div>
                        <div class="text-left">
                            <div class="font-black text-sm text-green-600">${amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                            <div class="text-[10px] text-green-500">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('') || '<p class="text-center text-slate-400 py-8 font-bold">لا توجد إيرادات مسجلة في هذه الفترة</p>';
        
        // تفصيل المصروفات
        const expenseContainer = document.getElementById('expense-breakdown');
        const totalExpenses = profitData.totalCOGS + profitData.totalExpenses;
        
        expenseContainer.innerHTML = Object.entries(profitData.expenseBreakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([name, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0;
                return `
                    <div class="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span class="font-black text-sm text-slate-700">${name}</span>
                        </div>
                        <div class="text-left">
                            <div class="font-black text-sm text-red-600">${amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                            <div class="text-[10px] text-red-500">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('') || '<p class="text-center text-slate-400 py-8 font-bold">لا توجد تكاليف/مشتريات مسجلة في هذه الفترة</p>';
    }

    function renderMarginsAnalysis(profitData) {
        const container = document.getElementById('margins-analysis');
        
        container.innerHTML = `
            <div class="text-center">
                <div class="text-3xl font-bold mb-2">${profitData.grossMargin.toFixed(1)}%</div>
                <p class="text-sm font-black text-emerald-100">هامش الربح الإجمالي</p>
                <div class="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div class="bg-white h-full rounded-full transition-all" style="width: ${Math.min(profitData.grossMargin, 100)}%"></div>
                </div>
            </div>
            
            <div class="text-center">
                <div class="text-3xl font-bold mb-2">${profitData.operatingMargin.toFixed(1)}%</div>
                <p class="text-sm font-black text-emerald-100">هامش التشغيل</p>
                <div class="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div class="bg-white h-full rounded-full transition-all" style="width: ${Math.min(profitData.operatingMargin, 100)}%"></div>
                </div>
            </div>
            
            <div class="text-center">
                <div class="text-3xl font-bold mb-2">${profitData.netMargin.toFixed(1)}%</div>
                <p class="text-sm font-black text-emerald-100">هامش الربح الصافي</p>
                <div class="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div class="bg-white h-full rounded-full transition-all" style="width: ${Math.min(profitData.netMargin, 100)}%"></div>
                </div>
            </div>
        `;
    }

    function renderTransactionsTable(profitData) {
        const tbody = document.getElementById('transactions-table');
        
        const sortedTransactions = profitData.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // ترتيب الأحدث أولاً
        
        tbody.innerHTML = sortedTransactions.map(transaction => `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td class="py-4 pr-4 font-black text-xs text-slate-500">${new Date(transaction.date).toLocaleDateString('ar-EG')}</td>
                <td class="py-4 text-xs font-black text-blue-600">${transaction.ref}</td>
                <td class="py-4 text-xs font-bold text-slate-700">${transaction.description}</td>
                <td class="py-4">
                    <span class="px-2 py-1 rounded-md text-[10px] font-black ${transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${transaction.account}
                    </span>
                </td>
                <td class="py-4 text-center">
                    <span class="font-black text-sm ${transaction.debit > 0 ? 'text-red-600' : 'text-slate-300'}">
                        ${transaction.debit > 0 ? transaction.debit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '-'}
                    </span>
                </td>
                <td class="py-4 text-center">
                    <span class="font-black text-sm ${transaction.credit > 0 ? 'text-green-600' : 'text-slate-300'}">
                        ${transaction.credit > 0 ? transaction.credit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '-'}
                    </span>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-bold">لا توجد فواتير أو عمليات مسجلة في هذه الفترة</td></tr>';
    }

    // --- Global Functions ---

    window.refreshProfitReport = async () => {
        const selector = document.getElementById('period-selector');
        if(selector) state.period = selector.value;
        
        state.profitData = await calculateProfitData();
        
        if (state.profitData) {
            await renderKPICards(state.profitData);
            renderBreakdowns(state.profitData);
            renderMarginsAnalysis(state.profitData);
            renderTransactionsTable(state.profitData);
        }
    };

    // --- Initialization ---

    async function init() {
        renderLayout();
        await refreshProfitReport();
        
        // ربط القائمة المنسدلة بدالة التحديث التلقائي عند التغيير
        const periodSelector = document.getElementById('period-selector');
        if (periodSelector) {
            periodSelector.addEventListener('change', window.refreshProfitReport);
        }
    }

    // بدء التطبيق
    init();
})();