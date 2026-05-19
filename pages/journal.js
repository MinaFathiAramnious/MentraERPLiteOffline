/**
 * MENTRA ERP - Journal Component (v4.6 - Fixed Dates & SweetAlert)
 * نظام إدارة القيود المحاسبية - إصلاح التواريخ والفلاتر
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

            <!-- شريط الفلترة والأدوات -->
            <div class="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <div class="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full lg:w-auto">
                    <span class="text-[10px] font-black text-slate-400 mr-2">من</span>
                    <input type="date" id="f-start" class="bg-transparent border-none text-xs font-bold outline-none p-1 text-slate-700">
                    <span class="text-[10px] font-black text-slate-400">إلى</span>
                    <input type="date" id="f-end" class="bg-transparent border-none text-xs font-bold outline-none p-1 text-slate-700">
                    
                    <button onclick="window.applyJournalFilter()" class="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 active:scale-95 transition-all">فلترة</button>
                    <button onclick="window.resetJournalFilter()" class="text-[10px] font-black text-slate-400 px-2 hover:text-slate-600">عرض الكل</button>
                </div>
                <button onclick="window.openJournalModal()" class="w-full lg:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                    <i class="fas fa-plus-circle"></i> قيد محاسبي جديد
                </button>
            </div>

            <!-- جدول عرض القيود -->
            <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                <table class="w-full text-right min-w-[600px]">
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

        <!-- نافذة إضافة القيد -->
        <div id="j-modal" class="hidden fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] items-center justify-center p-4">
            <div class="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-pop-in">
                <div class="p-6 border-b border-slate-50 flex justify-between items-center shrink-0">
                    <h3 class="font-black text-slate-800">إضافة قيد مزدوج جديد</h3>
                    <button onclick="window.closeJournalModal()" class="text-slate-300 hover:text-rose-500 transition-colors"><i class="fas fa-times-circle text-2xl"></i></button>
                </div>
                <div class="p-6 overflow-y-auto space-y-4 flex-1">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="date" id="m-date" class="bg-slate-50 p-4 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full">
                        <input type="text" id="m-ref" placeholder="رقم المرجع (اختياري)" class="bg-slate-50 p-4 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full">
                        <input type="text" id="m-desc" placeholder="وصف العملية..." class="bg-slate-50 p-4 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full">
                    </div>
                    <div id="m-rows" class="space-y-2 mt-4"></div>
                    <button onclick="window.addNewRow()" class="text-blue-600 font-black text-[10px] py-2 mt-2 hover:text-blue-800">+ إضافة طرف جديد</button>
                </div>
                <div class="p-6 bg-slate-50 rounded-b-[2.5rem] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div class="flex gap-8 w-full sm:w-auto justify-center sm:justify-start">
                        <div class="text-center sm:text-right"><p class="text-[9px] font-black text-slate-400">إجمالي المدين</p><p id="sum-debit" class="text-2xl font-black text-emerald-500">0.00</p></div>
                        <div class="text-center sm:text-right"><p class="text-[9px] font-black text-slate-400">إجمالي الدائن</p><p id="sum-credit" class="text-2xl font-black text-rose-500">0.00</p></div>
                    </div>
                    <button onclick="window.submitJournal()" id="save-btn" class="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 active:scale-95 transition-all opacity-50 pointer-events-none">ترحيل القيد</button>
                </div>
            </div>
        </div>
        `;
    };

    // --- المنطق البرمجي (Logic) ---

    window.loadJournalData = async () => {
        const body = document.getElementById('journal-body');
        if (!body) return;

        let allEntries = [];

        // الفلترة الذكية للتاريخ (تعالج صيغة ISO وتطابقها مع YYYY-MM-DD)
        if (state.startDate && state.endDate) {
            allEntries = await db.journal.filter(e => {
                // استخراج YYYY-MM-DD فقط من الداتا بيز
                const entryDate = String(e.date).substring(0, 10);
                return entryDate >= state.startDate && entryDate <= state.endDate;
            }).reverse().toArray();
        } else {
            allEntries = await db.journal.reverse().toArray();
        }

        const totalVol = allEntries.reduce((s, e) => s + (Number(e.total) || 0), 0);

        // تحديث الإحصائيات العلوية
        document.getElementById('stat-count').innerText = allEntries.length;
        document.getElementById('stat-total').innerText = totalVol.toLocaleString('en-US', {minimumFractionDigits: 2});

        // التحقق من توازن الدفاتر 
        const items = await db.journal_items.toArray();
        const dSum = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
        const cSum = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
        const isBalanced = Math.abs(dSum - cSum) < 0.01;
        
        const balanceCard = document.getElementById('status-card');
        const balanceText = document.getElementById('stat-balance');
        balanceText.innerText = isBalanced ? 'متزن ✅' : 'يوجد خلل ⚠️';
        balanceCard.className = isBalanced ? 'bg-slate-900 p-6 rounded-[2rem] shadow-xl transition-all' : 'bg-rose-600 p-6 rounded-[2rem] shadow-xl animate-pulse';

        // الترقيم (Pagination)
        const start = state.currentPage * state.itemsPerPage;
        const paged = allEntries.slice(start, start + state.itemsPerPage);
        
        // عرض البيانات مع إصلاح تنسيق التاريخ
        body.innerHTML = paged.length ? paged.map(e => {
            // تنظيف شكل التاريخ ليكون مقروء (مثال: 2026-05-19 18:36) بدلاً من ISO طويل
            const cleanDate = String(e.date).substring(0, 16).replace('T', ' ');

            return `
            <tr class="group hover:bg-blue-50/30 transition-all">
                <td class="p-4 font-black text-slate-400 text-[10px]"><span class="bg-slate-50 px-2 py-1 rounded font-mono">${e.ref_no}</span></td>
                <td class="p-4 text-xs font-bold text-slate-700" dir="ltr">${cleanDate}</td>
                <td class="p-4 text-xs text-slate-600 font-bold">${e.description || 'بدون وصف'}</td>
                <td class="p-4 text-center font-black text-blue-600 text-sm font-mono">${Number(e.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="p-4 text-left">
                    <button onclick="window.deleteEntry(${e.id})" class="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors active:scale-90"><i class="fas fa-trash-alt text-[10px]"></i></button>
                </td>
            </tr>
            `;
        }).join('') : `<tr><td colspan="5" class="p-16 text-center text-slate-400 font-bold"><i class="fas fa-file-invoice mb-3 text-3xl opacity-50 block"></i>لا توجد قيود مسجلة في هذه الفترة</td></tr>`;
        
        renderPagination(allEntries.length);
    };

    const renderPagination = (totalItems) => {
        const pages = Math.ceil(totalItems / state.itemsPerPage);
        const container = document.getElementById('pagination');
        container.innerHTML = `
            <span class="text-[10px] font-black text-slate-400">صفحة ${state.currentPage + 1} من ${pages || 1}</span>
            <div class="flex gap-1">
                <button onclick="window.changePage(${state.currentPage - 1})" ${state.currentPage === 0 ? 'disabled' : ''} class="w-8 h-8 rounded-lg bg-white border border-slate-200 disabled:opacity-30 active:scale-95"><i class="fas fa-chevron-right text-[10px]"></i></button>
                <button onclick="window.changePage(${state.currentPage + 1})" ${state.currentPage >= pages - 1 ? 'disabled' : ''} class="w-8 h-8 rounded-lg bg-white border border-slate-200 disabled:opacity-30 active:scale-95"><i class="fas fa-chevron-left text-[10px]"></i></button>
            </div>
        `;
    };

    // --- وظائف المودال (Modals) ---

    window.openJournalModal = async () => {
        state.accounts = await db.accounts.toArray();
        document.getElementById('m-rows').innerHTML = '';
        
        // تعيين تاريخ اليوم افتراضياً
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('m-date').value = today;
        document.getElementById('m-ref').value = '';
        document.getElementById('m-desc').value = '';

        document.getElementById('j-modal').classList.replace('hidden', 'flex');
        window.addNewRow(); window.addNewRow(); // ابدأ بصفين
    };

    window.addNewRow = () => {
        const row = document.createElement('div');
        row.className = "flex gap-2 animate-fade-in items-center";
        row.innerHTML = `
            <select class="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-blue-400 w-full min-w-[120px]">
                <option value="">-- اختر الحساب --</option>
                ${state.accounts.map(a => `<option value="${a.id}">${a.code} - ${a.name_ar}</option>`).join('')}
            </select>
            <input type="number" inputmode="decimal" placeholder="مدين" class="w-20 sm:w-28 bg-emerald-50/50 text-emerald-700 p-3.5 rounded-xl border border-emerald-100 font-bold text-xs d-in text-center outline-none focus:border-emerald-400" oninput="window.calcTotals()">
            <input type="number" inputmode="decimal" placeholder="دائن" class="w-20 sm:w-28 bg-rose-50/50 text-rose-700 p-3.5 rounded-xl border border-rose-100 font-bold text-xs c-in text-center outline-none focus:border-rose-400" oninput="window.calcTotals()">
            <button onclick="this.parentElement.remove(); window.calcTotals();" class="w-10 h-10 shrink-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><i class="fas fa-trash-alt text-sm"></i></button>
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

        if (d !== c || d <= 0) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'القيد غير متزن!', customClass: {popup: 'rounded-3xl'} });
            return;
        }

        // تحويل التاريخ من YYYY-MM-DD إلى صيغة ISO كاملة للحفاظ على تناسق الداتا بيز
        const selectedDate = document.getElementById('m-date').value;
        const isoDate = selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString();

        try {
            await db.transaction('rw', [db.journal, db.journal_items], async () => {
                const jId = await db.journal.add({
                    date: isoDate,
                    ref_no: document.getElementById('m-ref').value || 'JV-' + Date.now().toString().slice(-4),
                    description: document.getElementById('m-desc').value || 'قيد يدوي',
                    total: d,
                    type: 'MANUAL'
                });

                for (let r of rows) {
                    const accId = r.querySelector('select').value;
                    const debit = parseFloat(r.querySelector('.d-in').value) || 0;
                    const credit = parseFloat(r.querySelector('.c-in').value) || 0;
                    if (accId && (debit > 0 || credit > 0)) {
                        await db.journal_items.add({ journal_id: jId, account_id: Number(accId), debit, credit });
                    }
                }
            });

            window.closeJournalModal();
            window.loadJournalData();
            Swal.fire({ icon: 'success', title: 'تم الترحيل بنجاح', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء حفظ القيد', customClass: {popup: 'rounded-3xl'} });
        }
    };

    // --- وظائف عامة ---
    window.closeJournalModal = () => document.getElementById('j-modal').classList.replace('flex', 'hidden');
    
    window.changePage = (p) => { 
        state.currentPage = p; 
        window.loadJournalData(); 
    };
    
    window.applyJournalFilter = () => {
        state.startDate = document.getElementById('f-start').value;
        state.endDate = document.getElementById('f-end').value;
        state.currentPage = 0;
        window.loadJournalData();
    };
    
    window.resetJournalFilter = () => {
        state.startDate = state.endDate = null;
        document.getElementById('f-start').value = '';
        document.getElementById('f-end').value = '';
        state.currentPage = 0;
        window.loadJournalData();
    };
    
    window.deleteEntry = async (id) => {
        const res = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "حذف هذا القيد سيؤثر على ميزان المراجعة والميزانية العمومية.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });

        if (res.isConfirmed) {
            try {
                await db.transaction('rw', [db.journal, db.journal_items], async () => {
                    await db.journal.delete(id);
                    await db.journal_items.where('journal_id').equals(id).delete();
                });
                window.loadJournalData();
                Swal.fire({ icon: 'success', title: 'تم الحذف', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'حدث خطأ', text: e.message, customClass: {popup: 'rounded-3xl'} });
            }
        }
    };

    // --- الإعداد المبدئي (تهيئة الفلتر ليكون بداية ونهاية الشهر الحالي) ---
    const initDateFilters = () => {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        
        document.getElementById('f-start').value = start;
        document.getElementById('f-end').value = end;
        
        state.startDate = start;
        state.endDate = end;
    };

    // التشغيل الأولي
    renderLayout();
    initDateFilters(); // تعيين التواريخ الافتراضية
    window.loadJournalData();
})();