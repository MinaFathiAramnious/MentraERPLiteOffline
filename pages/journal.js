/**
 * MENTRA ERP - Journal Component (v4.5 - Ultra Stable Edition)
 * نظام إدارة القيود المحاسبية - النسخة الذكية المقاومة للأخطاء
 */

(function() {
    // الحالة الداخلية للتطبيق (State)
    const state = {
        currentPage: 0,
        itemsPerPage: 6,
        startDate: null,
        endDate: null,
        accounts: []
    };

    const renderLayout = () => {
        const displayArea = document.getElementById('main-content-display');
        if (!displayArea) return;

        displayArea.innerHTML = `
        <div class="animate-fade-in space-y-6 pb-12" style="direction: rtl;">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العمليات المسجلة</p>
                    <h2 id="stat-count" class="text-3xl font-black text-slate-800">0</h2>
                </div>
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي التداولات</p>
                    <h2 id="stat-total" class="text-3xl font-black text-blue-600">0.00</h2>
                </div>
                <div id="status-card" class="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex flex-col items-center justify-center transition-colors duration-500">
                    <p class="text-[10px] font-black text-slate-500 uppercase mb-1">سلامة الدفاتر</p>
                    <h2 id="stat-balance" class="text-xl font-black text-white italic">فحص...</h2>
                </div>
            </div>

            <div class="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <div class="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <input type="date" id="f-start" class="bg-transparent border-none text-xs font-bold outline-none p-1">
                    <span class="text-slate-300">|</span>
                    <input type="date" id="f-end" class="bg-transparent border-none text-xs font-bold outline-none p-1">
                    <button onclick="window.applyJournalFilter()" class="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all">فلترة</button>
                    <button onclick="window.resetJournalFilter()" class="text-[10px] font-black text-slate-400 px-2">الكل</button>
                </div>
                <button onclick="window.openJournalModal()" class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-blue-100">
                    <i class="fas fa-plus-circle ml-2"></i> قيد محاسبي جديد
                </button>
            </div>

            <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-hidden">
                <table class="w-full text-right">
                    <thead>
                        <tr class="text-slate-400 text-[10px] font-black uppercase border-b border-slate-50">
                            <th class="p-4">المرجع</th>
                            <th class="p-4">التاريخ</th>
                            <th class="p-4">البيان</th>
                            <th class="p-4 text-center">القيمة</th>
                            <th class="p-4 text-left">إجراء</th>
                        </tr>
                    </thead>
                    <tbody id="journal-body" class="divide-y divide-slate-50"></tbody>
                </table>
                <div id="pagination" class="mt-6 flex justify-between items-center bg-slate-50 p-3 rounded-2xl"></div>
            </div>
        </div>

        <div id="j-modal" class="hidden fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] items-center justify-center p-4">
            <div class="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-pop-in">
                <div class="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 class="font-black text-slate-800">إضافة قيد مزدوج جديد</h3>
                    <button onclick="window.closeJournalModal()" class="text-slate-300 hover:text-rose-500"><i class="fas fa-times-circle text-2xl"></i></button>
                </div>
                <div class="p-6 overflow-y-auto space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="date" id="m-date" class="bg-slate-50 p-4 rounded-xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500">
                        <input type="text" id="m-ref" placeholder="رقم المرجع" class="bg-slate-50 p-4 rounded-xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500">
                        <input type="text" id="m-desc" placeholder="وصف العملية..." class="bg-slate-50 p-4 rounded-xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div id="m-rows" class="space-y-2"></div>
                    <button onclick="window.addNewRow()" class="text-blue-600 font-black text-[10px] py-2">+ إضافة طرف جديد</button>
                </div>
                <div class="p-6 bg-slate-50 rounded-b-[2.5rem] flex justify-between items-center">
                    <div class="flex gap-8">
                        <div><p class="text-[9px] font-black text-slate-400">إجمالي المدين</p><p id="sum-debit" class="text-2xl font-black text-emerald-500">0.00</p></div>
                        <div><p class="text-[9px] font-black text-slate-400">إجمالي الدائن</p><p id="sum-credit" class="text-2xl font-black text-rose-500">0.00</p></div>
                    </div>
                    <button onclick="window.submitJournal()" id="save-btn" class="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all">ترحيل القيد</button>
                </div>
            </div>
        </div>
        `;
    };

    // --- المنطق البرمجي (Logic) ---

    window.loadJournalData = async () => {
        const body = document.getElementById('journal-body');
        if (!body) return;

        let collection = db.journal;
        if (state.startDate && state.endDate) {
            collection = db.journal.where('date').between(state.startDate, state.endDate, true, true);
        }

        const allEntries = await collection.reverse().toArray();
        const totalVol = allEntries.reduce((s, e) => s + (Number(e.total) || 0), 0);

        // تحديث الإحصائيات
        document.getElementById('stat-count').innerText = allEntries.length;
        document.getElementById('stat-total').innerText = totalVol.toLocaleString('en-US', {minimumFractionDigits: 2});

        // التحقق من توازن الدفاتر (فحص ذكي)
        const items = await db.journal_items.toArray();
        const dSum = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
        const cSum = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
        const isBalanced = Math.abs(dSum - cSum) < 0.01;
        
        const balanceCard = document.getElementById('status-card');
        const balanceText = document.getElementById('stat-balance');
        balanceText.innerText = isBalanced ? 'متزن ✅' : 'يوجد خلل ⚠️';
        balanceCard.className = isBalanced ? 'bg-slate-900 p-6 rounded-[2rem] shadow-xl transition-all' : 'bg-rose-600 p-6 rounded-[2rem] shadow-xl animate-pulse';

        // الترقيم
        const start = state.currentPage * state.itemsPerPage;
        const paged = allEntries.slice(start, start + state.itemsPerPage);
        
        body.innerHTML = paged.length ? paged.map(e => `
            <tr class="group hover:bg-blue-50/30 transition-all">
                <td class="p-4 font-black text-slate-400 text-[10px]">${e.ref_no}</td>
                <td class="p-4 text-xs font-bold text-slate-700">${e.date}</td>
                <td class="p-4 text-xs text-slate-500">${e.description}</td>
                <td class="p-4 text-center font-black text-blue-600 text-xs">${Number(e.total).toFixed(2)}</td>
                <td class="p-4 text-left">
                    <button onclick="window.deleteEntry(${e.id})" class="text-slate-300 hover:text-rose-500 transition-colors"><i class="fas fa-trash-alt text-[10px]"></i></button>
                </td>
            </tr>
        `).join('') : `<tr><td colspan="5" class="p-10 text-center text-slate-300 font-bold italic">لا توجد بيانات</td></tr>`;
        
        renderPagination(allEntries.length);
    };

    const renderPagination = (totalItems) => {
        const pages = Math.ceil(totalItems / state.itemsPerPage);
        const container = document.getElementById('pagination');
        container.innerHTML = `
            <span class="text-[10px] font-black text-slate-400">صفحة ${state.currentPage + 1} من ${pages || 1}</span>
            <div class="flex gap-1">
                <button onclick="window.changePage(${state.currentPage - 1})" ${state.currentPage === 0 ? 'disabled' : ''} class="w-8 h-8 rounded-lg bg-white border border-slate-200 disabled:opacity-30"><i class="fas fa-chevron-right text-[10px]"></i></button>
                <button onclick="window.changePage(${state.currentPage + 1})" ${state.currentPage >= pages - 1 ? 'disabled' : ''} class="w-8 h-8 rounded-lg bg-white border border-slate-200 disabled:opacity-30"><i class="fas fa-chevron-left text-[10px]"></i></button>
            </div>
        `;
    };

    // --- وظائف المودال (Modals) ---

    window.openJournalModal = async () => {
        state.accounts = await db.accounts.toArray();
        document.getElementById('m-rows').innerHTML = '';
        document.getElementById('m-date').valueAsDate = new Date();
        document.getElementById('j-modal').classList.replace('hidden', 'flex');
        window.addNewRow(); window.addNewRow(); // ابدأ بصفين
    };

    window.addNewRow = () => {
        const row = document.createElement('div');
        row.className = "flex gap-2 animate-fade-in";
        row.innerHTML = `
            <select class="flex-1 bg-slate-50 border-none rounded-xl p-3 text-[11px] font-bold outline-none">
                <option value="">-- اختر الحساب --</option>
                ${state.accounts.map(a => `<option value="${a.id}">${a.code} - ${a.name_ar}</option>`).join('')}
            </select>
            <input type="number" placeholder="مدين" class="w-24 bg-emerald-50 text-emerald-700 p-3 rounded-xl border-none font-bold text-xs d-in" oninput="window.calcTotals()">
            <input type="number" placeholder="دائن" class="w-24 bg-rose-50 text-rose-700 p-3 rounded-xl border-none font-bold text-xs c-in" oninput="window.calcTotals()">
            <button onclick="this.parentElement.remove(); window.calcTotals();" class="text-slate-300 hover:text-rose-500 px-2"><i class="fas fa-minus-circle"></i></button>
        `;
        document.getElementById('m-rows').appendChild(row);
    };

    window.calcTotals = () => {
        let d = 0, c = 0;
        document.querySelectorAll('.d-in').forEach(i => d += (parseFloat(i.value) || 0));
        document.querySelectorAll('.c-in').forEach(i => c += (parseFloat(i.value) || 0));
        document.getElementById('sum-debit').innerText = d.toFixed(2);
        document.getElementById('sum-credit').innerText = c.toFixed(2);
        
        const btn = document.getElementById('save-btn');
        const isReady = (d === c && d > 0);
        btn.style.opacity = isReady ? '1' : '0.5';
        btn.style.pointerEvents = isReady ? 'auto' : 'none';
    };

    window.submitJournal = async () => {
        const d = parseFloat(document.getElementById('sum-debit').innerText);
        const c = parseFloat(document.getElementById('sum-credit').innerText);
        const rows = document.querySelectorAll('#m-rows > div');

        if (d !== c || d <= 0) return alert("القيد غير متزن!");

        try {
            // استخدام Transaction لضمان سلامة البيانات
            await db.transaction('rw', [db.journal, db.journal_items], async () => {
                const jId = await db.journal.add({
                    date: document.getElementById('m-date').value,
                    ref_no: document.getElementById('m-ref').value || 'JV-' + Date.now().toString().slice(-4),
                    description: document.getElementById('m-desc').value || 'قيد يدوي',
                    total: d
                });

                for (let r of rows) {
                    const accId = r.querySelector('select').value;
                    const debit = parseFloat(r.querySelector('.d-in').value) || 0;
                    const credit = parseFloat(r.querySelector('.c-in').value) || 0;
                    if (accId) {
                        await db.journal_items.add({ journal_id: jId, account_id: Number(accId), debit, credit });
                    }
                }
            });

            window.closeJournalModal();
            window.loadJournalData();
            alert("تم الترحيل بنجاح ✅");
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء الحفظ!");
        }
    };

    // --- وظائف عامة ---
    window.closeJournalModal = () => document.getElementById('j-modal').classList.replace('flex', 'hidden');
    window.changePage = (p) => { state.currentPage = p; window.loadJournalData(); };
    window.applyJournalFilter = () => {
        state.startDate = document.getElementById('f-start').value;
        state.endDate = document.getElementById('f-end').value;
        state.currentPage = 0;
        window.loadJournalData();
    };
    window.resetJournalFilter = () => {
        state.startDate = state.endDate = null;
        document.getElementById('f-start').value = document.getElementById('f-end').value = '';
        window.loadJournalData();
    };
    window.deleteEntry = async (id) => {
        if (confirm("هل أنت متأكد من حذف هذا القيد؟ سيؤثر هذا على الميزانية.")) {
            await db.journal.delete(id);
            await db.journal_items.where('journal_id').equals(id).delete();
            window.loadJournalData();
        }
    };

    // التشغيل الأولي
    renderLayout();
    window.loadJournalData();
})();