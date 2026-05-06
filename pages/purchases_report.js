/**
 * MENTRA ERP - Purchases Report Pro (v9.0 Smart Analytics & Export + Pagination)
 * الميزات: إحصائيات لحظية بالتاريخ، إدارة الديون والآجل، واجهة تفاعلية، تصدير، ترقيم (5 في 5)
 */

(function() {
    const displayArea = document.getElementById('main-content-display');
    const state = { 
        activeInvId: null, 
        editingItems: [],
        filteredPurchases: [],
        currentPage: 1,       // الصفحة الحالية
        itemsPerPage: 5       // عدد العناصر في كل صفحة
    };

    const reportHTML = `
    <div class="animate-fade-in space-y-6 md:space-y-8 pb-20 md:pb-16 px-2 md:px-0 text-right" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الهيدر وفلاتر البحث والتصدير -->
        <div class="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5 md:gap-6">
            
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center text-2xl shadow-lg shadow-rose-500/30 shrink-0">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div>
                    <h2 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">سجل المشتريات والموردين</h2>
                    <p class="text-xs font-bold text-slate-500 mt-1">تحليل فواتير الشراء والديون الآجلة</p>
                </div>
            </div>

            <div class="flex flex-col md:flex-row w-full xl:w-auto gap-3">
                <!-- فلاتر التاريخ -->
                <div class="flex items-center justify-between gap-2 bg-slate-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-slate-200 w-full md:w-auto">
                    <div class="flex items-center gap-2 px-2">
                        <span class="text-xs font-black text-slate-400">من</span>
                        <input type="date" id="rep-date-from" onchange="window.loadPurchases(true)" class="bg-transparent text-xs font-black text-slate-800 outline-none w-full md:w-auto cursor-pointer">
                    </div>
                    <div class="w-px h-6 bg-slate-300"></div>
                    <div class="flex items-center gap-2 px-2">
                        <span class="text-xs font-black text-slate-400">إلى</span>
                        <input type="date" id="rep-date-to" onchange="window.loadPurchases(true)" class="bg-transparent text-xs font-black text-slate-800 outline-none w-full md:w-auto cursor-pointer">
                    </div>
                </div>

                <!-- أزرار التصدير -->
                <div class="flex items-center gap-2 w-full md:w-auto">
                    <button onclick="exportPurchasesExcel()" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-3 md:py-3.5 rounded-xl font-black text-xs transition-all active:scale-95 border border-emerald-100">
                        <i class="fas fa-file-excel text-sm"></i> <span class="hidden md:inline">إكسيل</span>
                    </button>
                    <button onclick="exportPurchasesPDF()" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-3 md:py-3.5 rounded-xl font-black text-xs transition-all active:scale-95 border border-rose-100">
                        <i class="fas fa-file-pdf text-sm"></i> <span class="hidden md:inline">PDF</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 📊 إحصائيات المشتريات (تتحدث مع التاريخ) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" id="stats-container">
            <!-- سيتم ملؤها ديناميكياً بواسطة الجافاسكريبت -->
        </div>

        <!-- قائمة الفواتير المعروضة -->
        <div class="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-100 min-h-[300px]">
             <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h5 class="text-lg font-black text-slate-800 flex items-center gap-2">
                    <i class="fas fa-list-ul text-slate-400"></i> تفاصيل الفواتير للفترة المحددة
                </h5>
                <div class="relative w-full md:w-72">
                    <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="p-inv-search" oninput="window.loadPurchases(true)" placeholder="ابحث برقم الفاتورة..." class="bg-slate-50 w-full px-4 pr-11 py-3 rounded-xl text-sm font-bold outline-none border border-slate-200 focus:border-rose-500 focus:bg-white transition-all">
                </div>
            </div>
            
            <!-- List Grid -->
            <div id="purchases-report-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>

            <!-- أزرار الترقيم (Pagination) -->
            <div id="pagination-controls" class="mt-8 flex justify-center items-center gap-3"></div>
        </div>
    </div>

    <!-- نافذة المودال للتعديل (Responsive) -->
    <div id="edit-purchase-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] hidden flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-300">
        <div class="bg-white w-full max-w-3xl rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl animate-slide-up md:animate-pop-in relative overflow-y-auto max-h-[90vh] text-right" dir="rtl">
            
            <div class="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4">
                <div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900">إدارة الفاتورة</h3>
                    <p id="modal-inv-no" class="text-sm font-bold text-rose-500 mt-1 font-mono tracking-widest"></p>
                </div>
                <button onclick="closeEditModal()" class="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><i class="fas fa-times text-xl"></i></button>
            </div>

            <div class="space-y-6">
                <!-- قائمة الأصناف -->
                <div class="bg-slate-50 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-slate-100 max-h-[40vh] overflow-y-auto custom-scrollbar">
                    <div id="modal-items-body" class="space-y-3"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                         <span class="text-xs font-black text-slate-500 uppercase">حالة السداد:</span>
                         <select id="modal-inv-status" class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-rose-500">
                            <option value="paid">✅ مدفوعة بالكامل</option>
                            <option value="pending">⏳ متبقي آجل (دين)</option>
                         </select>
                    </div>
                    <div class="bg-slate-900 p-4 md:p-5 rounded-2xl flex justify-between items-center shadow-lg">
                        <span class="text-[11px] font-black text-slate-400 uppercase">الإجمالي النهائي</span>
                        <h2 id="modal-inv-total" class="text-2xl md:text-3xl font-black text-white font-mono">0.00</h2>
                    </div>
                </div>

                <div class="flex gap-3 pt-4 border-t border-slate-100">
                    <button onclick="saveSmartPurchaseEdit()" class="flex-[2] bg-emerald-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                        <i class="fas fa-check-circle text-lg"></i> حفظ وتحديث المخزن
                    </button>
                    <button onclick="confirmDeletePurchase()" class="flex-1 bg-rose-50 text-rose-600 p-4 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 text-sm border border-rose-100">
                        <i class="fas fa-trash-alt"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    </style>
    `;

    displayArea.innerHTML = reportHTML;

    // --- نظام جلب وعرض البيانات + الإحصائيات اللحظية ---
    // تم إضافة متغير resetPage لإعادة الترقيم لـ 1 عند البحث أو تغيير التاريخ
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

        // 1. حساب الإحصائيات (تُحسب على كافة النتائج وليس صفحة واحدة)
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
        
        document.getElementById('stats-container').innerHTML = `
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2rem] shadow-lg text-white relative overflow-hidden">
                <div class="absolute -left-4 -bottom-4 text-7xl text-white/5"><i class="fas fa-boxes"></i></div>
                <p class="text-[11px] font-black text-slate-400 uppercase mb-1">إجمالي المشتريات (الفترة المحددة)</p>
                <div class="text-3xl font-black font-mono mb-2">${formatMoney(totalVal)} <span class="text-sm text-slate-500 font-sans">ج.م</span></div>
                <div class="inline-block bg-white/10 px-3 py-1 rounded-lg text-xs font-bold text-slate-300">
                    <i class="fas fa-receipt ml-1"></i> ${filtered.length} فاتورة مسجلة
                </div>
            </div>

            <div class="bg-white border border-emerald-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-[11px] font-black text-slate-400 uppercase">ما تم سداده للموردين</p>
                        <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><i class="fas fa-check"></i></div>
                    </div>
                    <div class="text-2xl font-black text-slate-800 font-mono mb-1">${formatMoney(paidVal)}</div>
                    <p class="text-xs font-bold text-emerald-600">${paidCount} فاتورة مدفوعة</p>
                </div>
            </div>

            <div class="bg-white border border-rose-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-[11px] font-black text-slate-400 uppercase">متبقي آجل (ديون للموردين)</p>
                        <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><i class="fas fa-clock"></i></div>
                    </div>
                    <div class="text-2xl font-black text-rose-600 font-mono mb-1">${formatMoney(pendingVal)}</div>
                    <p class="text-xs font-bold text-rose-500">${pendingCount} فاتورة آجلة</p>
                </div>
            </div>
        `;

        // 3. عرض قائمة الفواتير والترقيم
        window.renderPaginatedList();
    };

    // --- دالة عرض القائمة والترقيم (مقطعة 5 عناصر للصفحة) ---
    window.renderPaginatedList = () => {
        const listContainer = document.getElementById('purchases-report-list');
        const paginationContainer = document.getElementById('pagination-controls');
        
        if (state.filteredPurchases.length === 0) {
            listContainer.className = "w-full";
            listContainer.innerHTML = `<div class="text-center py-16 opacity-60"><i class="fas fa-search text-5xl text-slate-300 mb-4 block"></i><span class="font-bold text-slate-500 text-sm">لا توجد فواتير شراء مطابقة لبحثك</span></div>`;
            paginationContainer.innerHTML = "";
            return;
        }

        // استخراج الجزء الخاص بالصفحة الحالية
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const currentItems = state.filteredPurchases.slice(startIndex, endIndex);

        const formatMoney = (num) => num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        listContainer.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4";
        listContainer.innerHTML = currentItems.map(inv => {
            const isPaid = inv.status === 'paid';
            const statusColor = isPaid ? 'emerald' : 'rose';
            const statusIcon = isPaid ? 'fa-check-circle' : 'fa-clock';
            const statusText = isPaid ? 'مدفوعة' : 'آجلة (دين)';

            return `
            <div class="bg-white border border-slate-100 p-5 rounded-2xl hover:shadow-md hover:border-${statusColor}-200 transition-all cursor-pointer group relative overflow-hidden" onclick="openPurchaseDetails(${inv.id})">
                <div class="absolute top-0 right-0 w-1 h-full bg-${statusColor}-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-4 border-b border-slate-50 pb-3">
                    <div>
                        <span class="block font-black text-slate-800 font-mono text-sm">${inv.invoice_number}</span>
                        <span class="text-[10px] font-bold text-slate-400 mt-0.5 block">${inv.date.substring(0, 16).replace('T', ' ')}</span>
                    </div>
                    <span class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-${statusColor}-50 text-${statusColor}-600">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </span>
                </div>
                
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase mb-0.5">إجمالي الفاتورة</p>
                        <p class="text-xl font-black text-slate-900 font-mono">${formatMoney(Number(inv.total))}</p>
                    </div>
                    <div class="w-8 h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                        <i class="fas fa-pen text-xs"></i>
                    </div>
                </div>
            </div>
        `}).join('');

        // حساب عدد الصفحات وعرض الأزرار
        const totalPages = Math.ceil(state.filteredPurchases.length / state.itemsPerPage);
        
        paginationContainer.innerHTML = `
            <button onclick="changePurchasesPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-sm transition-all"><i class="fas fa-chevron-right"></i></button>
            <span class="px-5 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-sm border border-rose-100">صفحة ${state.currentPage} من ${totalPages}</span>
            <button onclick="changePurchasesPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-sm transition-all"><i class="fas fa-chevron-left"></i></button>
        `;
    };

    // دالة تغيير الصفحة
    window.changePurchasesPage = (newPage) => {
        const totalPages = Math.ceil(state.filteredPurchases.length / state.itemsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            state.currentPage = newPage;
            window.renderPaginatedList();
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
        setTimeout(() => modal.firstElementChild.classList.remove('translate-y-full'), 10);
    };

    function renderModalItems() {
        document.getElementById('modal-items-body').innerHTML = state.editingItems.map((item, idx) => `
            <div class="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                <div class="flex-1">
                    <p class="font-black text-xs text-slate-800 line-clamp-1">${item.product_name || 'صنف مجهول'}</p>
                    <p class="text-[10px] font-bold text-slate-500 mt-1">سعر الشراء: ${Number(item.price).toLocaleString()} ج.م</p>
                </div>
                <div class="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span class="text-[10px] font-bold text-slate-400">الكمية:</span>
                    <input type="number" value="${item.qty}" onchange="updatePurchaseQty(${idx}, this.value)" 
                           class="w-14 p-1.5 bg-white border border-slate-200 rounded text-center font-black text-sm text-blue-600 focus:border-blue-500 outline-none transition-all">
                </div>
            </div>
        `).join('');
    }

    window.updatePurchaseQty = (idx, val) => {
        state.editingItems[idx].qty = parseFloat(val) || 0;
        const newTotal = state.editingItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
        document.getElementById('modal-inv-total').innerText = newTotal.toLocaleString('en-US', {minimumFractionDigits: 2});
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
            
            Swal.fire({icon: 'success', title: 'تم الحفظ', text: 'تم تحديث المشتريات والمخزن بنجاح', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeEditModal();
            window.loadPurchases(); // ريفريش للقائمة
        } catch (e) { Swal.fire({icon: 'error', title: 'خطأ', text: e.message}); }
    };

    window.confirmDeletePurchase = async () => {
        const res = await Swal.fire({
            title: 'حذف فاتورة الشراء؟',
            text: "سيتم حذف الفاتورة وخصم الكميات من المخزن. هل أنت متأكد؟",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonText: 'تراجع',
            confirmButtonText: 'نعم، احذف الفاتورة',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });
        
        if(!res.isConfirmed) return;
        
        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products, db.stock_movements], async () => {
                const inv = await db.invoices.get(state.activeInvId);
                const items = await db.invoice_items.where('invoice_id').equals(state.activeInvId).toArray();

                for (let item of items) {
                    const prod = await db.products.get(item.product_id);
                    if (prod) {
                        await db.products.update(prod.id, { stock_qty: Math.max(0, prod.stock_qty - item.qty) });
                    }
                }
                
                await db.invoice_items.where('invoice_id').equals(state.activeInvId).delete();
                await db.stock_movements.where('ref_id').equals(inv.invoice_number).delete();
                await db.invoices.delete(state.activeInvId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الحذف', text: 'تم حذف الفاتورة وتعديل رصيد المخزن', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeEditModal();
            window.loadPurchases(); // ريفريش للقائمة
        } catch (e) { Swal.fire({icon: 'error', title: 'خطأ', text: e.message}); }
    };

    window.closeEditModal = () => document.getElementById('edit-purchase-modal').classList.add('hidden');

    // --- التصدير (PDF & Excel) ---
    window.exportPurchasesExcel = () => {
        if(state.filteredPurchases.length === 0) {
            Swal.fire({icon: 'info', title: 'لا يوجد فواتير للتصدير', customClass: {popup: 'rounded-3xl'}}); return;
        }

        const excelData = state.filteredPurchases.map(inv => ({
            "رقم الفاتورة": inv.invoice_number,
            "التاريخ": String(inv.date).substring(0, 16).replace('T', ' '),
            "إجمالي التكلفة": Number(inv.total),
            "حالة الدفع": inv.status === 'paid' ? 'تم السداد' : 'آجلة'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        if(!ws['!views']) ws['!views'] = [];
        ws['!views'].push({rightToLeft: true});

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المشتريات");
        XLSX.writeFile(wb, `سجل_المشتريات_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    window.exportPurchasesPDF = () => {
        if(state.filteredPurchases.length === 0) {
            Swal.fire({icon: 'info', title: 'لا يوجد بيانات لتصديرها', customClass: {popup: 'rounded-3xl'}}); return;
        }

        let totalAmount = state.filteredPurchases.reduce((acc, curr) => acc + Number(curr.total), 0);
        let unpaidAmount = state.filteredPurchases.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total), 0);

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html dir="rtl" lang="ar">
            <head>
                <title>تقرير المشتريات</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
                    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
                    .header h2 { margin: 0; color: #e11d48; font-size: 24px;}
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                    th, td { padding: 10px; border: 1px solid #cbd5e1; text-align: right; }
                    th { background-color: #f1f5f9; color: #334155; }
                    .summary { display: flex; justify-content: space-between; background: #fff1f2; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 14px; border: 1px solid #ffe4e6;}
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>سجل فواتير المشتريات والموردين</h2>
                    <p>تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-EG')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>حالة الدفع</th>
                            <th>إجمالي التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.filteredPurchases.map(inv => `
                            <tr>
                                <td>${inv.invoice_number}</td>
                                <td>${String(inv.date).substring(0, 10)}</td>
                                <td>${inv.status === 'paid' ? 'مدفوعة' : 'متبقي آجل'}</td>
                                <td dir="ltr">${Number(inv.total).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="summary">
                    <span>إجمالي المشتريات: <span style="color:#e11d48">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                    <span>المديونيات الآجلة: <span style="color:#b91c1c">${unpaidAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                </div>
                <script> window.onload = function() { window.print(); window.close(); } </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- الإعدادات الأولية (تهيئة تواريخ الشهر الحالي) ---
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('rep-date-from').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('rep-date-to').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    // تشغيل الدالة لأول مرة
    window.loadPurchases();
})();
