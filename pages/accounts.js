(function() {
    const state = {
        currentPage: 0,
        itemsPerPage: 7,
        allAccounts: [],
        filteredAccounts: [],
        editMode: false,
        activeAccountId: null
    };

    const renderLayout = () => {
        document.getElementById('main-content-display').innerHTML = `
        <div class="animate-fade-in space-y-6 pb-12" style="direction: rtl;">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full transition-transform group-hover:scale-150"></div>
                    <p class="text-[9px] font-black text-slate-400 uppercase relative">إجمالي الأصول</p>
                    <h2 id="total-assets" class="text-xl font-black text-slate-800 relative">0.00</h2>
                </div>
                <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full transition-transform group-hover:scale-150"></div>
                    <p class="text-[9px] font-black text-slate-400 uppercase relative">الخصوم والالتزامات</p>
                    <h2 id="total-liabilities" class="text-xl font-black text-slate-800 relative">0.00</h2>
                </div>
                <div class="bg-emerald-500 p-5 rounded-[2rem] shadow-lg shadow-emerald-100">
                    <p class="text-[9px] font-black text-emerald-100 uppercase mb-1">صافي حقوق الملكية</p>
                    <h2 id="equity-val" class="text-xl font-black text-white italic">0.00</h2>
                </div>
                <div class="bg-slate-900 p-5 rounded-[2rem] shadow-xl">
                    <p class="text-[9px] font-black text-slate-500 uppercase mb-1">عدد الحسابات</p>
                    <h2 id="acc-count" class="text-xl font-black text-blue-400">0</h2>
                </div>
            </div>

            <div class="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <div class="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div class="relative flex-1">
                        <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                        <input type="text" id="acc-search" placeholder="ابحث بالاسم، الكود، أو النوع (أصول، مصروفات...)" 
                               class="w-full bg-slate-50 border-none h-12 rounded-2xl pr-11 pl-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    </div>
                    <button onclick="window.openAccountModal()" class="bg-blue-600 text-white h-12 px-8 rounded-2xl font-black text-xs hover:bg-slate-900 transition-all shadow-lg shadow-blue-100">
                        + إضافة حساب
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <div class="overflow-x-auto">
                    <table class="w-full text-right">
                        <thead>
                            <tr class="text-slate-400 text-[10px] font-black border-b border-slate-50 uppercase tracking-widest">
                                <th class="pb-4 pr-4">كود الحساب</th>
                                <th class="pb-4">اسم الحساب</th>
                                <th class="pb-4">التصنيف</th>
                                <th class="pb-4 text-center">الرصيد الحالي</th>
                                <th class="pb-4 text-left pl-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="accounts-list" class="divide-y divide-slate-50"></tbody>
                    </table>
                </div>
                <div id="acc-pagination" class="mt-6 flex justify-between items-center bg-slate-50 p-3 rounded-2xl"></div>
            </div>
        </div>

        <div id="acc-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] hidden items-center justify-center p-4">
            <div class="bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl animate-pop-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 id="modal-title" class="text-xl font-black text-slate-800">إضافة حساب جديد</h3>
                    <button onclick="window.closeAccountModal()" class="text-slate-300 hover:text-rose-500"><i class="fas fa-times-circle text-2xl"></i></button>
                </div>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" id="acc-code" placeholder="الكود" class="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                        <select id="acc-type" class="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="asset">أصول</option>
                            <option value="liability">خصوم</option>
                            <option value="equity">حقوق ملكية</option>
                            <option value="income">إيرادات</option>
                            <option value="expense">مصروفات</option>
                        </select>
                    </div>
                    <input type="text" id="acc-name" placeholder="اسم الحساب (مثلاً: البنك الأهلي)" class="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="bg-blue-50 p-4 rounded-2xl">
                        <p class="text-[9px] font-black text-blue-400 uppercase mb-2">الرصيد الافتتاحي (أول المدة)</p>
                        <input type="number" id="acc-balance" value="0" class="w-full bg-transparent border-none text-xl font-black text-blue-600 outline-none">
                    </div>
                </div>
                <button onclick="window.saveAccount()" class="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm mt-6 hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                    حفظ البيانات وتحديث الدليل
                </button>
            </div>
        </div>
        `;
    };

    // --- محرك الحسابات الذكي (High Performance Engine) ---

    window.loadAccountsData = async () => {
        try {
            // 1. جلب البيانات دفعة واحدة (أسرع 10 مرات من الحلقة)
            const [accounts, journals] = await Promise.all([
                db.accounts.toArray(),
                db.journal_items.toArray()
            ]);

            // 2. توزيع الحركات المالية على الحسابات في الذاكرة (Memory Mapping)
            const movementsMap = journals.reduce((map, item) => {
                map[item.account_id] = (map[item.account_id] || 0) + (Number(item.debit) || 0) - (Number(item.credit) || 0);
                return map;
            }, {});

            state.allAccounts = accounts.map(acc => ({
                ...acc,
                currentBalance: (Number(acc.balance) || 0) + (movementsMap[acc.id] || 0)
            }));

            state.filteredAccounts = [...state.allAccounts];
            updateFinanceUI();
            renderTable();
        } catch (err) { console.error("Account Engine Error:", err); }
    };

    const updateFinanceUI = async () => {
        const stats = state.allAccounts.reduce((acc, curr) => {
            if (curr.type === 'asset') acc.assets += curr.currentBalance;
            if (curr.type === 'liability') acc.liabilities += Math.abs(curr.currentBalance);
            return acc;
        }, { assets: 0, liabilities: 0 });

        // حساب الأرباح الحقيقية من القيود المحاسبية
        const realProfits = await calculateRealProfits();
        
        // حساب حقوق الملكية الصحيحة (الأصول - الخصوم + الأرباح - الخسائر)
        const correctedEquity = (stats.assets - stats.liabilities) + (realProfits.netIncome || 0);

        document.getElementById('total-assets').innerText = stats.assets.toLocaleString('en-US', {minimumFractionDigits: 2});
        document.getElementById('total-liabilities').innerText = stats.liabilities.toLocaleString('en-US', {minimumFractionDigits: 2});
        document.getElementById('equity-val').innerText = correctedEquity.toLocaleString('en-US', {minimumFractionDigits: 2});
        document.getElementById('acc-count').innerText = state.allAccounts.length;

        // عرض معلومات الأرباح الإضافية
        displayProfitInformation(realProfits);
    };

    // دالة حساب الأرباح الحقيقية من القيود المحاسبية
    async function calculateRealProfits() {
        try {
            // جلب جميع بنود القيود المحاسبية
            const journalItems = await db.journal_items.toArray();
            
            let totalRevenue = 0;
            let totalCOGS = 0;
            let totalExpenses = 0;
            let totalIncome = 0;

            // حساب الإيرادات والمصروفات من القيود
            for (const item of journalItems) {
                const account = await db.accounts.get(item.account_id);
                if (!account) continue;

                const debit = parseFloat(item.debit) || 0;
                const credit = parseFloat(item.credit) || 0;
                
                // حساب الرصيد الصافي للحساب
                let balance = credit - debit; // معظم حسابات الإيرادات والمصروفات دائنة
                
                if (account.type === 'income') {
                    if (account.code === '4001') {
                        // إيرادات المبيعات
                        totalRevenue += Math.abs(balance);
                    }
                    totalIncome += Math.abs(balance);
                } else if (account.type === 'expense') {
                    if (account.code === '5001') {
                        // تكلفة البضاعة المباعة
                        totalCOGS += Math.abs(balance);
                    } else {
                        // المصروفات الأخرى
                        totalExpenses += Math.abs(balance);
                    }
                }
            }

            // حساب الأرباح
            const grossProfit = totalRevenue - totalCOGS;
            const netIncome = grossProfit - totalExpenses;
            
            // حساب هامش الربع
            const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

            return {
                totalRevenue,
                totalCOGS,
                totalExpenses,
                grossProfit,
                netIncome,
                profitMargin,
                totalIncome
            };
        } catch (error) {
            console.error('Error calculating profits:', error);
            return {
                totalRevenue: 0,
                totalCOGS: 0,
                totalExpenses: 0,
                grossProfit: 0,
                netIncome: 0,
                profitMargin: 0,
                totalIncome: 0
            };
        }
    }

    // دالة عرض معلومات الأرباح
    async function displayProfitInformation(profits) {
        // إضافة قسم الأرباح إلى الواجهة إذا لم يكن موجوداً
        const existingProfitCard = document.getElementById('profit-information');
        if (!existingProfitCard) {
            const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4.gap-4');
            if (container) {
                const profitCard = document.createElement('div');
                profitCard.className = 'bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-[2rem] text-white shadow-xl border border-amber-200';
                profitCard.id = 'profit-information';
                profitCard.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-[9px] font-black text-amber-100 uppercase tracking-widest">معلومات الأرباح</p>
                            <h3 class="text-2xl font-bold mt-2" id="net-profit-display">0.00</h3>
                        </div>
                        <div class="bg-white/20 p-3 rounded-xl">
                            <i class="fas fa-chart-line text-xl"></i>
                        </div>
                    </div>
                    <div id="profit-details" class="space-y-2 text-amber-50"></div>
                `;
                
                // تحويل الشبكة إلى 5 أعمدة وإضافة البطاقة
                container.className = 'grid grid-cols-1 md:grid-cols-5 gap-4';
                container.appendChild(profitCard);
            }
        }

        // تحديث بيانات الأرباح
        const netProfitElement = document.getElementById('net-profit-display');
        const detailsElement = document.getElementById('profit-details');
        
        if (netProfitElement) {
            netProfitElement.innerText = profits.netIncome.toLocaleString('en-US', {minimumFractionDigits: 2});
        }
        
        if (detailsElement) {
            detailsElement.innerHTML = `
                <div class="flex justify-between text-sm">
                    <span>إجمالي الإيرادات:</span>
                    <span class="font-black">${profits.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>تكلفة البضاعة:</span>
                    <span class="font-black">${profits.totalCOGS.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm font-black border-t border-amber-400 pt-2">
                    <span>الربح الإجمالي:</span>
                    <span>${profits.grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>هامش الربع:</span>
                    <span class="font-black">${profits.profitMargin.toFixed(1)}%</span>
                </div>
            `;
        }
    }

    const renderTable = () => {
        const list = document.getElementById('accounts-list');
        const start = state.currentPage * state.itemsPerPage;
        const paged = state.filteredAccounts.slice(start, start + state.itemsPerPage);

        list.innerHTML = paged.map(acc => `
            <tr class="group hover:bg-slate-50/50 transition-all">
                <td class="py-5 pr-4 font-black text-slate-400 text-[10px] tracking-widest">${acc.code}</td>
                <td class="py-5 text-xs font-black text-slate-700">${acc.name_ar}</td>
                <td class="py-5">
                    <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase ${getTypeStyle(acc.type)}">
                        ${acc.type}
                    </span>
                </td>
                <td class="py-5 text-center">
                    <span class="font-black text-xs ${acc.currentBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                        ${acc.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                </td>
                <td class="py-5 text-left pl-4">
                    <div class="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                        <button onclick="window.editAccount(${acc.id})" class="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"><i class="fas fa-edit text-[9px]"></i></button>
                        <button onclick="window.deleteAccount(${acc.id})" class="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><i class="fas fa-trash text-[9px]"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination();
    };

    const getTypeStyle = (type) => {
        const styles = {
            asset: 'bg-blue-50 text-blue-600',
            liability: 'bg-rose-50 text-rose-600',
            equity: 'bg-emerald-50 text-emerald-600',
            income: 'bg-amber-50 text-amber-600',
            expense: 'bg-slate-100 text-slate-600'
        };
        return styles[type] || 'bg-slate-50 text-slate-400';
    };

    // --- العمليات (Actions) ---

    window.saveAccount = async () => {
        const data = {
            code: document.getElementById('acc-code').value,
            name_ar: document.getElementById('acc-name').value,
            type: document.getElementById('acc-type').value,
            balance: parseFloat(document.getElementById('acc-balance').value) || 0
        };

        if (!data.code || !data.name_ar) return alert("من فضلك أدخل كود واسم الحساب");

        // فحص تكرار الكود
        const exists = state.allAccounts.find(a => a.code === data.code && a.id !== state.activeAccountId);
        if (exists) return alert("هذا الكود مستخدم مسبقاً لحساب آخر!");

        if (state.editMode) {
            await db.accounts.update(state.activeAccountId, data);
        } else {
            await db.accounts.add(data);
        }
        
        window.closeAccountModal();
        window.loadAccountsData();
    };

    window.deleteAccount = async (id) => {
        const hasJournals = await db.journal_items.where('account_id').equals(id).count();
        if (hasJournals > 0) return alert("لا يمكن حذف حساب مرتبطة به قيود محاسبية! قم بحذف القيود أولاً.");
        
        if (confirm("هل أنت متأكد من حذف الحساب نهائياً؟")) {
            await db.accounts.delete(id);
            window.loadAccountsData();
        }
    };

    // الترقيم والبحث
    const renderPagination = () => {
        const pages = Math.ceil(state.filteredAccounts.length / state.itemsPerPage);
        const container = document.getElementById('acc-pagination');
        container.innerHTML = `
            <span class="text-[10px] font-black text-slate-400 uppercase">صفحة ${state.currentPage + 1} من ${pages || 1}</span>
            <div class="flex gap-2">
                <button onclick="window.changeAccPage(${state.currentPage - 1})" ${state.currentPage === 0 ? 'disabled' : ''} class="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-20"><i class="fas fa-chevron-right"></i></button>
                <button onclick="window.changeAccPage(${state.currentPage + 1})" ${state.currentPage >= pages - 1 ? 'disabled' : ''} class="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-20"><i class="fas fa-chevron-left"></i></button>
            </div>
        `;
    };

    window.changeAccPage = (p) => { state.currentPage = p; renderTable(); };

    // تهيئة الصفحة
    renderLayout();
    
    document.getElementById('acc-search').oninput = (e) => {
        const t = e.target.value.toLowerCase();
        state.filteredAccounts = state.allAccounts.filter(a => 
            a.name_ar.includes(t) || a.code.includes(t) || a.type.includes(t)
        );
        state.currentPage = 0;
        renderTable();
    };

    window.openAccountModal = () => {
        state.editMode = false;
        state.activeAccountId = null;
        document.getElementById('modal-title').innerText = "إضافة حساب جديد";
        document.getElementById('acc-code').value = "";
        document.getElementById('acc-name').value = "";
        document.getElementById('acc-balance').value = 0;
        document.getElementById('acc-modal').classList.replace('hidden', 'flex');
    };

    window.editAccount = async (id) => {
        const acc = await db.accounts.get(id);
        state.editMode = true;
        state.activeAccountId = id;
        document.getElementById('modal-title').innerText = "تعديل بيانات الحساب";
        document.getElementById('acc-code').value = acc.code;
        document.getElementById('acc-name').value = acc.name_ar;
        document.getElementById('acc-type').value = acc.type;
        document.getElementById('acc-balance').value = acc.balance;
        document.getElementById('acc-modal').classList.replace('hidden', 'flex');
    };

    window.closeAccountModal = () => document.getElementById('acc-modal').classList.replace('flex', 'hidden');

    window.loadAccountsData();
})();