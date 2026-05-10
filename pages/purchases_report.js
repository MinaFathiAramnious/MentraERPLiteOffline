/**
 * MENTRA ERP - Purchases Report Pro (v10.5 Mobile-Optimized & Fully Responsive)
 * الميزات: متجاوب 100%، تصميم يشبه تطبيقات الموبايل، إدارة الديون، ترقيم، تصدير
 */

(function() {
    const displayArea = document.getElementById('main-content-display');
    const state = { 
        activeInvId: null, 
        editingItems: [],
        filteredPurchases: [],
        currentPage: 1,       
        itemsPerPage: 8       // زيادة العدد لـ 8 ليكون الشكل أفضل في الجريد
    };

    // إضافة ستايل خاص للموبايل (Safe Area & Hide Scrollbar & Bottom Sheet)
    const style = document.createElement('style');
    style.innerHTML = `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes slide-up-sheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-bottom-sheet { animation: slide-up-sheet 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    `;
    document.head.appendChild(style);

    const reportHTML = `
    <div class="animate-fade-in pb-24 px-2 md:px-0 text-right font-sans" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الهيدر الرئيسي -->
        <div class="flex items-center justify-between gap-3 mb-5 md:mb-8">
            <div class="flex items-center gap-3 md:gap-4">
                <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-rose-500/30 shrink-0">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div>
                    <h2 class="text-lg sm:text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">سجل المشتريات</h2>
                    <p class="text-[9px] sm:text-xs font-bold text-slate-500 mt-0.5 md:mt-1">تحليل فواتير الشراء والديون الآجلة</p>
                </div>
            </div>

            <!-- أزرار التصدير (تظهر في الديسكتوب والتابلت) -->
            <div class="hidden sm:flex items-center gap-2 shrink-0">
                <button onclick="exportPurchasesExcel()" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-2.5 md:py-3 rounded-xl font-black text-xs transition-all border border-emerald-100"><i class="fas fa-file-excel ml-1"></i> إكسيل</button>
                <button onclick="exportPurchasesPDF()" class="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-2.5 md:py-3 rounded-xl font-black text-xs transition-all border border-rose-100"><i class="fas fa-file-pdf ml-1"></i> PDF</button>
            </div>
        </div>

        <!-- 📊 الكروت الإحصائية (Grid ذكي للموبايل والديسكتوب) -->
        <div id="stats-container" class="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-5 mb-5 md:mb-8">
            <!-- سيتم ملؤها ديناميكياً -->
        </div>

        <!-- شريط الأدوات (بحث وفلاتر مدمجة للموبايل) -->
        <div class="bg-white p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3 mb-5 md:mb-8">
            
            <div class="flex flex-col md:flex-row gap-3">
                <!-- البحث الموحد -->
                <div class="relative w-full md:flex-1">
                    <i class="fas fa-search absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="p-inv-search" oninput="window.loadPurchases(true)" 
                           placeholder="بحث برقم الفاتورة..." 
                           class="w-full bg-slate-50 p-3 md:p-3.5 pr-10 outline-none rounded-xl md:rounded-2xl border border-slate-200 focus:border-rose-500 font-bold text-xs md:text-sm text-slate-800 transition-all">
                </div>

                <!-- الفلاتر السريعة -->
                <div class="flex items-center gap-2 bg-slate-50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto hide-scrollbar">
                    <div class="flex items-center gap-1.5 shrink-0 px-2 w-full justify-between md:justify-start">
                        <span class="text-[10px] md:text-xs font-black text-slate-400">من</span>
                        <input type="date" id="rep-date-from" onchange="window.loadPurchases(true)" class="bg-transparent text-[10px] md:text-xs font-black outline-none text-slate-700 w-auto">
                        <span class="text-slate-300 mx-1">-</span>
                        <span class="text-[10px] md:text-xs font-black text-slate-400">إلى</span>
                        <input type="date" id="rep-date-to" onchange="window.loadPurchases(true)" class="bg-transparent text-[10px] md:text-xs font-black outline-none text-slate-700 w-auto">
                    </div>
                </div>
            </div>

            <!-- أزرار التصدير (للموبايل فقط في الأسفل) -->
            <div class="flex sm:hidden items-center gap-2 mt-1">
                <button onclick="exportPurchasesExcel()" class="flex-1 bg-emerald-50 text-emerald-600 px-3 py-2.5 rounded-lg font-black text-[10px] border border-emerald-100 active:bg-emerald-100"><i class="fas fa-file-excel ml-1"></i> إكسيل</button>
                <button onclick="exportPurchasesPDF()" class="flex-1 bg-rose-50 text-rose-600 px-3 py-2.5 rounded-lg font-black text-[10px] border border-rose-100 active:bg-rose-100"><i class="fas fa-file-pdf ml-1"></i> PDF</button>
            </div>
        </div>

        <!-- قائمة الفواتير (Grid) -->
        <div id="purchases-report-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5"></div>

        <!-- الترقيم (Pagination) مخصص للموبايل والديسكتوب -->
        <div class="flex justify-center items-center mt-6 md:mt-10">
            <div id="pagination-controls" class="bg-white p-1.5 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-1"></div>
        </div>
    </div>

    <!-- المودال الذكي (Bottom Sheet للموبايل / Modal للديسكتوب) -->
    <div id="edit-purchase-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] hidden flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-300">
        <div class="bg-white w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-bottom-sheet md:animate-pop-in relative text-right pb-safe" dir="rtl">
            
            <!-- مؤشر السحب (للموبايل فقط) -->
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 md:hidden"></div>

            <!-- هيدر المودال -->
            <div class="flex justify-between items-start mb-4 border-b border-slate-100 pb-3 md:pb-4 shrink-0">
                <div>
                    <h3 class="text-base md:text-xl font-black text-slate-900 flex items-center gap-2">
                        فاتورة <span id="modal-inv-no" class="text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded-md"></span>
                    </h3>
                </div>
                <button onclick="closeEditModal()" class="w-8 h-8 bg-slate-100 rounded-full text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center active:scale-90"><i class="fas fa-times"></i></button>
            </div>
            
            <!-- المنطقة القابلة للتمرير -->
            <div class="flex-1 overflow-y-auto hide-scrollbar space-y-4">
                
                <!-- قائمة الأصناف -->
                <div class="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                    <div id="modal-items-body" class="space-y-2"></div>
                </div>

                <!-- الإعدادات والإجمالي -->
                <div class="grid grid-cols-2 gap-2 md:gap-4">
                    <div class="bg-white border border-slate-200 p-2 md:p-4 rounded-xl flex flex-col justify-center">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">حالة السداد</span>
                        <select id="modal-inv-status" class="bg-transparent font-bold text-xs md:text-sm text-slate-800 outline-none w-full">
                            <option value="paid">✅ مدفوعة بالكامل</option>
                            <option value="pending">⏳ آجل (دين مستحق)</option>
                        </select>
                    </div>
                    <div class="bg-slate-900 p-3 md:p-4 rounded-xl flex flex-col justify-center items-end shadow-md">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-0.5">الإجمالي النهائي</span>
                        <h2 id="modal-inv-total" class="text-lg md:text-2xl font-black text-emerald-400 font-mono truncate w-full text-left">0.00</h2>
                    </div>
                </div>
            </div>

            <!-- الأزرار السفلية (Sticky Footer) -->
            <div class="pt-3 md:pt-4 mt-2 border-t border-slate-100 flex gap-2 shrink-0">
                <button onclick="saveSmartPurchaseEdit()" class="flex-[2] bg-emerald-500 text-white py-3.5 rounded-xl font-black shadow-lg shadow-emerald-500/20 active:bg-emerald-600 active:scale-95 transition-all text-xs md:text-sm flex justify-center items-center gap-1.5">
                    <i class="fas fa-check-circle"></i> حفظ المخزن
                </button>
                <button onclick="confirmDeletePurchase()" class="flex-1 bg-rose-50 text-rose-600 py-3.5 rounded-xl font-black border border-rose-100 active:bg-rose-100 active:scale-95 transition-all text-xs md:text-sm flex justify-center items-center gap-1.5">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </div>
        </div>
    </div>
    `;

    displayArea.innerHTML = reportHTML;

    // --- نظام جلب وعرض البيانات + الإحصائيات اللحظية ---
    window.loadPurchases = async (resetPage = false) => {
        if (resetPage) state.currentPage = 1;

        const from = document.getElementById('rep-date-from').value;
        const to = document.getElementById('rep-date-to').value;
        const search = document.getElementById('p-inv-search').value.toLowerCase().trim();

        // جلب الداتا والفلترة
        const data = await db.invoices.where('type').equalsIgnoreCase('PURCHASE').reverse().toArray();
        const filtered = data.filter(inv => {
            const d = inv.date.substring(0, 10);
            const dateMatch = (d >= from && d <= to);
            const searchMatch = inv.invoice_number.toLowerCase().includes(search);
            return dateMatch && searchMatch;
        });

        state.filteredPurchases = filtered;

        // 1. حساب الإحصائيات 
        let totalVal = 0, paidVal = 0, pendingVal = 0;
        let paidCount = 0, pendingCount = 0;

        filtered.forEach(inv => {
            const amount = parseFloat(inv.total) || 0;
            totalVal += amount;
            if(inv.status === 'paid') {
                paidVal += amount;
                paidCount++;
            } else {
                pendingVal += amount;
                pendingCount++;
            }
        });

        const formatMoney = (num) => num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        // تصميم الكروت المتجاوب
        document.getElementById('stats-container').innerHTML = `
            <div class="col-span-2 md:col-span-1 bg-slate-900 p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-lg text-white relative overflow-hidden">
                <i class="fas fa-boxes absolute -left-2 -bottom-2 text-6xl text-white/5"></i>
                <p class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-1">إجمالي المشتريات</p>
                <div class="text-xl md:text-3xl font-black font-mono mb-1 truncate">${formatMoney(totalVal)}</div>
                <p class="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1">${filtered.length} فاتورة مسجلة</p>
            </div>

            <div class="col-span-1 bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border border-emerald-100 shadow-sm relative">
                <p class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-1">مسدد لموردين</p>
                <p class="text-lg md:text-2xl font-black text-emerald-600 font-mono mb-1 truncate">${formatMoney(paidVal)}</p>
                <p class="text-[8px] md:text-[10px] font-bold text-emerald-500">${paidCount} مدفوعة</p>
            </div>

            <div class="col-span-1 bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border border-rose-100 shadow-sm relative">
                <p class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-1">آجل (ديون)</p>
                <p class="text-lg md:text-2xl font-black text-rose-600 font-mono mb-1 truncate">${formatMoney(pendingVal)}</p>
                <p class="text-[8px] md:text-[10px] font-bold text-rose-500">${pendingCount} آجلة</p>
            </div>
        `;

        // 2. عرض قائمة الفواتير والترقيم
        window.renderPaginatedList();
    };

    // --- دالة عرض القائمة والترقيم ---
    window.renderPaginatedList = () => {
        const listContainer = document.getElementById('purchases-report-list');
        const paginationContainer = document.getElementById('pagination-controls');
        
        if (state.filteredPurchases.length === 0) {
            listContainer.className = "w-full";
            listContainer.innerHTML = `<div class="text-center py-12 md:py-20 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"><i class="fas fa-search text-4xl md:text-5xl mb-4 opacity-30 block"></i><span class="font-bold text-xs md:text-sm">لا توجد فواتير مطابقة</span></div>`;
            paginationContainer.parentElement.classList.add('hidden');
            return;
        }
        
        paginationContainer.parentElement.classList.remove('hidden');

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const currentItems = state.filteredPurchases.slice(startIndex, endIndex);

        const formatMoney = (num) => num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        listContainer.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5";
        listContainer.innerHTML = currentItems.map(inv => {
            const isPaid = inv.status === 'paid';
            const statusColor = isPaid ? 'emerald' : 'rose';
            const statusBg = isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100';
            const statusIcon = isPaid ? 'fa-check' : 'fa-clock';
            const statusText = isPaid ? 'مدفوعة' : 'آجلة';

            return `
            <div class="bg-white p-3.5 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm border border-slate-100 active:bg-slate-50 transition-all cursor-pointer relative overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg" onclick="openPurchaseDetails(${inv.id})">
                <div class="absolute top-0 right-0 w-1 h-full bg-${statusColor}-500"></div>
                
                <div class="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                    <div>
                        <span class="block text-xs md:text-sm font-black text-slate-800 font-mono tracking-tighter">#${inv.invoice_number}</span>
                        <span class="block text-[8px] md:text-[9px] font-bold text-slate-400 mt-0.5">${String(inv.date).substring(0, 16).replace('T', ' ')}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black border ${statusBg} flex items-center gap-1">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </span>
                </div>
                
                <div class="flex justify-between items-end mt-auto pt-2">
                    <div>
                        <p class="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-0.5">إجمالي الفاتورة</p>
                        <p class="text-base md:text-lg font-black text-slate-900 font-mono leading-none">${formatMoney(Number(inv.total))}</p>
                    </div>
                    <div class="w-6 h-6 md:w-8 md:h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center shadow-sm">
                        <i class="fas fa-chevron-left text-[9px] md:text-[10px]"></i>
                    </div>
                </div>
            </div>
        `}).join('');

        // أزرار الترقيم
        const totalPages = Math.ceil(state.filteredPurchases.length / state.itemsPerPage);
        
        paginationContainer.innerHTML = `
            <button onclick="changePurchasesPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-right text-sm"></i></button>
            <div class="px-4 md:px-6 py-2 flex items-center justify-center min-w-[70px]">
                <span class="text-[10px] md:text-xs font-bold text-slate-400 mr-1 hidden md:inline">صفحة</span>
                <span class="font-black text-sm md:text-base text-blue-600">${state.currentPage} / ${totalPages}</span>
            </div>
            <button onclick="changePurchasesPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-left text-sm"></i></button>
        `;
    };

    window.changePurchasesPage = (newPage) => {
        const totalPages = Math.ceil(state.filteredPurchases.length / state.itemsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            state.currentPage = newPage;
            window.renderPaginatedList();
            if(window.innerWidth < 768) {
                document.getElementById('p-inv-search').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };


    // --- نظام التعديل الذكي المخصص للموبايل ---
    window.openPurchaseDetails = async (id) => {
        state.activeInvId = id;
        const inv = await db.invoices.get(id);
        const items = await db.invoice_items.where('invoice_id').equals(id).toArray();
        
        state.editingItems = JSON.parse(JSON.stringify(items));

        document.getElementById('modal-inv-no').innerText = `${inv.invoice_number}`;
        document.getElementById('modal-inv-total').innerText = parseFloat(inv.total).toLocaleString('en-US', {minimumFractionDigits: 2});
        document.getElementById('modal-inv-status').value = inv.status;

        renderModalItems();
        const modal = document.getElementById('edit-purchase-modal');
        modal.classList.remove('hidden');
    };

    function renderModalItems() {
        document.getElementById('modal-items-body').innerHTML = state.editingItems.map((item, idx) => `
            <div class="bg-white border border-slate-200 p-2.5 md:p-3 rounded-xl flex justify-between items-center shadow-sm">
                <div class="flex-1 min-w-0 pr-2">
                    <p class="font-black text-[11px] md:text-xs text-slate-800 truncate">${item.product_name || 'صنف مجهول'}</p>
                    <p class="text-[9px] md:text-[10px] font-bold text-slate-500 mt-0.5">${Number(item.price).toLocaleString()} ج.م</p>
                </div>
                <!-- أزرار زيادة ونقصان (Touch Friendly) -->
                <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
                    <button onclick="adjustQty(${idx}, -1)" class="w-7 h-7 bg-white rounded border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-100"><i class="fas fa-minus text-[8px]"></i></button>
                    <span class="w-8 text-center font-black text-xs text-blue-600 font-mono">${item.qty}</span>
                    <button onclick="adjustQty(${idx}, 1)" class="w-7 h-7 bg-white rounded border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-100"><i class="fas fa-plus text-[8px]"></i></button>
                </div>
            </div>
        `).join('');
    }

    window.adjustQty = (idx, amount) => {
        const newQty = Math.max(0, state.editingItems[idx].qty + amount);
        state.editingItems[idx].qty = newQty;
        renderModalItems();
        const total = state.editingItems.reduce((s, i) => s + (i.qty * i.price), 0);
        document.getElementById('modal-inv-total').innerText = total.toLocaleString(undefined, {minimumFractionDigits: 2});
    };

    window.saveSmartPurchaseEdit = async () => {
        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products], async () => {
                let finalTotal = 0;
                for (let item of state.editingItems) {
                    const original = await db.invoice_items.get(item.id);
                    const diff = item.qty - original.qty; 
                    
                    const prod = await db.products.get(item.product_id);
                    if (prod) {
                        await db.products.update(prod.id, { stock_qty: (parseFloat(prod.stock_qty) || 0) + diff });
                    }
                    
                    await db.invoice_items.update(item.id, { qty: item.qty, total_item: item.qty * item.price });
                    finalTotal += (item.qty * item.price);
                }
                
                await db.invoices.update(state.activeInvId, { 
                    total: finalTotal, 
                    status: document.getElementById('modal-inv-status').value 
                });
            });
            
            Swal.fire({icon: 'success', title: 'تم الحفظ', text: 'تم تحديث المشتريات والمخزن', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeEditModal();
            window.loadPurchases(); 
        } catch (e) { Swal.fire({icon: 'error', title: 'خطأ', text: e.message}); }
    };

    window.confirmDeletePurchase = async () => {
        const res = await Swal.fire({
            title: 'حذف فاتورة الشراء؟',
            text: "سيتم الخصم من المخزن وتحديث الحسابات.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'تراجع',
            confirmButtonText: 'نعم، احذف',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });
        
        if(!res.isConfirmed) return;
        
        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products, db.stock_movements, db.journal, db.journal_items], async () => {
                const inv = await db.invoices.get(state.activeInvId);
                const items = await db.invoice_items.where('invoice_id').equals(state.activeInvId).toArray();

                for (let item of items) {
                    const prod = await db.products.get(item.product_id);
                    if (prod) {
                        await db.products.update(prod.id, { stock_qty: Math.max(0, prod.stock_qty - item.qty) });
                    }
                }
                
                await db.invoice_items.where('invoice_id').equals(state.activeInvId).delete();
                
                if(inv && inv.invoice_number) {
                    await db.stock_movements.where('ref_id').equals(inv.invoice_number).delete();
                    
                    const linkedJournal = await db.journal.where('ref_no').equals(inv.invoice_number).first();
                    if(linkedJournal) {
                        await db.journal_items.where('journal_id').equals(linkedJournal.id).delete();
                        await db.journal.delete(linkedJournal.id);
                    }
                }
                
                await db.invoices.delete(state.activeInvId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الحذف', text: 'تمت تسوية الدفاتر والمخزن', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeEditModal();
            window.loadPurchases();
        } catch (e) { Swal.fire({icon: 'error', title: 'خطأ', text: e.message}); }
    };

    window.closeEditModal = () => document.getElementById('edit-purchase-modal').classList.add('hidden');

    // --- التصدير (PDF & Excel) ---
    window.exportPurchasesExcel = () => {
        if(state.filteredPurchases.length === 0) return;
        const excelData = state.filteredPurchases.map(inv => ({
            "رقم الفاتورة": inv.invoice_number,
            "التاريخ": String(inv.date).substring(0, 16).replace('T', ' '),
            "التكلفة": Number(inv.total),
            "حالة الدفع": inv.status === 'paid' ? 'مسدد' : 'آجل'
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        if(!ws['!views']) ws['!views'] = [];
        ws['!views'].push({rightToLeft: true});
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المشتريات");
        XLSX.writeFile(wb, `مشتريات_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    window.exportPurchasesPDF = () => {
        if(state.filteredPurchases.length === 0) return;
        let totalAmount = state.filteredPurchases.reduce((acc, curr) => acc + Number(curr.total), 0);
        let unpaidAmount = state.filteredPurchases.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total), 0);

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html dir="rtl" lang="ar"><head><title>تقرير المشتريات</title><style>
            body { font-family: Tahoma, sans-serif; padding: 20px; color: #1e293b; }
            h2 { color: #e11d48; font-size: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { padding: 8px; border: 1px solid #cbd5e1; text-align: right; }
            th { background-color: #f1f5f9; }
            .summary { margin-top:20px; display: flex; justify-content: space-between; background: #fff1f2; padding: 10px; border-radius: 5px; font-weight: bold; }
            </style></head><body>
            <h2>سجل المشتريات والموردين</h2>
            <table><thead><tr><th>الفاتورة</th><th>التاريخ</th><th>الحالة</th><th>الإجمالي</th></tr></thead><tbody>
            ${state.filteredPurchases.map(inv => `<tr><td>${inv.invoice_number}</td><td>${String(inv.date).substring(0, 10)}</td><td>${inv.status === 'paid' ? 'مسدد' : 'آجل'}</td><td dir="ltr">${Number(inv.total).toFixed(2)}</td></tr>`).join('')}
            </tbody></table>
            <div class="summary"><span>المشتريات: ${totalAmount.toFixed(2)}</span><span>الديون: ${unpaidAmount.toFixed(2)}</span></div>
            <script> window.onload = function() { window.print(); window.close(); } </script>
            </body></html>
        `);
        printWindow.document.close();
    };

    // --- الإعدادات الأولية ---
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('rep-date-from').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('rep-date-to').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    loadPurchases();
})();
