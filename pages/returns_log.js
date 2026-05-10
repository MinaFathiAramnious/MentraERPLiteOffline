/**
 * MENTRA ERP - Returns Log & Analytics (v1.0 Pro)
 * سجل المرتجعات: إحصائيات، تفاصيل، وإلغاء حركات الإرجاع
 */

(function() {
    const displayArea = document.getElementById('main-content-display');
    const state = { 
        activeInvId: null, 
        filteredReturns: [],
        currentPage: 1,       
        itemsPerPage: 8,
        totalReturnedQty: 0 // إجمالي عدد القطع المرتجعة
    };

    // ستايلات الموبايل والـ Bottom Sheet
    const style = document.createElement('style');
    style.innerHTML = `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes slide-up-sheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-bottom-sheet { animation: slide-up-sheet 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    `;
    document.head.appendChild(style);

    const logHTML = `
    <div class="animate-fade-in pb-24 px-2 md:px-0 text-right font-sans" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الهيدر الرئيسي -->
        <div class="flex items-center justify-between gap-3 mb-5 md:mb-8">
            <div class="flex items-center gap-3 md:gap-4">
                <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-amber-500/30 shrink-0">
                    <i class="fas fa-history"></i>
                </div>
                <div>
                    <h2 class="text-lg sm:text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">سجل المرتجعات</h2>
                    <p class="text-[9px] sm:text-xs font-bold text-slate-500 mt-0.5 md:mt-1">متابعة البضاعة المستردة والأموال المدفوعة</p>
                </div>
            </div>

            <!-- أزرار التصدير (ديسكتوب) -->
            <div class="hidden sm:flex items-center gap-2 shrink-0">
                <button onclick="exportReturnsExcel()" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-2.5 md:py-3 rounded-xl font-black text-xs transition-all border border-emerald-100"><i class="fas fa-file-excel ml-1"></i> إكسيل</button>
                <button onclick="exportReturnsPDF()" class="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-2.5 md:py-3 rounded-xl font-black text-xs transition-all border border-rose-100"><i class="fas fa-file-pdf ml-1"></i> PDF</button>
            </div>
        </div>

        <!-- 📊 الكروت الإحصائية -->
        <div id="ret-stats-container" class="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-5 mb-5 md:mb-8">
            <!-- سيتم ملؤها ديناميكياً -->
        </div>

        <!-- شريط البحث والفلاتر -->
        <div class="bg-white p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3 mb-5 md:mb-8">
            <div class="flex flex-col md:flex-row gap-3">
                <div class="relative w-full md:flex-1">
                    <i class="fas fa-search absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="ret-log-search" oninput="window.loadReturnsLog(true)" 
                           placeholder="بحث برقم فاتورة المرتجع..." 
                           class="w-full bg-slate-50 p-3 md:p-3.5 pr-10 outline-none rounded-xl md:rounded-2xl border border-slate-200 focus:border-amber-500 font-bold text-xs md:text-sm text-slate-800 transition-all">
                </div>
                <div class="flex items-center gap-2 bg-slate-50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto hide-scrollbar">
                    <div class="flex items-center gap-1.5 shrink-0 px-2 w-full justify-between md:justify-start">
                        <span class="text-[10px] md:text-xs font-black text-slate-400">من</span>
                        <input type="date" id="ret-date-from" onchange="window.loadReturnsLog(true)" class="bg-transparent text-[10px] md:text-xs font-black outline-none text-slate-700 w-auto">
                        <span class="text-slate-300 mx-1">-</span>
                        <span class="text-[10px] md:text-xs font-black text-slate-400">إلى</span>
                        <input type="date" id="ret-date-to" onchange="window.loadReturnsLog(true)" class="bg-transparent text-[10px] md:text-xs font-black outline-none text-slate-700 w-auto">
                    </div>
                </div>
            </div>
            <!-- أزرار التصدير (موبايل) -->
            <div class="flex sm:hidden items-center gap-2 mt-1">
                <button onclick="exportReturnsExcel()" class="flex-1 bg-emerald-50 text-emerald-600 px-3 py-2.5 rounded-lg font-black text-[10px] border border-emerald-100 active:bg-emerald-100"><i class="fas fa-file-excel ml-1"></i> إكسيل</button>
                <button onclick="exportReturnsPDF()" class="flex-1 bg-rose-50 text-rose-600 px-3 py-2.5 rounded-lg font-black text-[10px] border border-rose-100 active:bg-rose-100"><i class="fas fa-file-pdf ml-1"></i> PDF</button>
            </div>
        </div>

        <!-- قائمة المرتجعات (Grid) -->
        <div id="returns-log-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5"></div>

        <!-- الترقيم (Pagination) -->
        <div class="flex justify-center items-center mt-6 md:mt-10">
            <div id="ret-pagination-controls" class="bg-white p-1.5 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-1"></div>
        </div>
    </div>

    <!-- نافذة تفاصيل المرتجع (Modal / Bottom Sheet) -->
    <div id="ret-details-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] hidden flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-300">
        <div class="bg-white w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-bottom-sheet md:animate-pop-in relative text-right pb-safe" dir="rtl">
            
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 md:hidden"></div>

            <div class="flex justify-between items-start mb-4 border-b border-slate-100 pb-3 md:pb-4 shrink-0">
                <div>
                    <h3 class="text-base md:text-xl font-black text-slate-900 flex items-center gap-2">
                        مرتجع <span id="ret-modal-no" class="text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded-md"></span>
                    </h3>
                    <p id="ret-modal-date" class="text-[10px] text-slate-500 font-bold mt-1"></p>
                </div>
                <button onclick="closeRetDetailsModal()" class="w-8 h-8 bg-slate-100 rounded-full text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center active:scale-90"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="flex-1 overflow-y-auto hide-scrollbar space-y-4">
                <div class="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                    <div id="ret-modal-items" class="space-y-2"></div>
                </div>

                <div class="bg-amber-50 border border-amber-100 p-4 rounded-xl flex justify-between items-center shadow-sm mt-4">
                    <span class="text-[10px] md:text-xs font-black text-amber-700 uppercase"><i class="fas fa-hand-holding-usd ml-1"></i> إجمالي المبلغ المردود</span>
                    <h2 id="ret-modal-total" class="text-lg md:text-2xl font-black text-amber-600 font-mono">0.00</h2>
                </div>
            </div>

            <div class="pt-3 md:pt-4 mt-2 border-t border-slate-100 shrink-0">
                <button onclick="confirmVoidReturn()" class="w-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white py-3.5 rounded-xl font-black border border-rose-100 active:scale-95 transition-all text-xs md:text-sm flex justify-center items-center gap-2">
                    <i class="fas fa-trash-restore"></i> إلغاء وحذف المرتجع (تسوية المخزن)
                </button>
            </div>
        </div>
    </div>
    `;

    displayArea.innerHTML = logHTML;

    // --- جلب البيانات ---
    window.loadReturnsLog = async (resetPage = false) => {
        if (resetPage) state.currentPage = 1;

        const from = document.getElementById('ret-date-from').value;
        const to = document.getElementById('ret-date-to').value;
        const search = document.getElementById('ret-log-search').value.toLowerCase().trim();

        // جلب الفواتير من نوع RETURN_SALE
        const allReturns = await db.invoices.where('type').equalsIgnoreCase('RETURN_SALE').reverse().toArray();
        
        const filtered = allReturns.filter(inv => {
            const d = inv.date.substring(0, 10);
            const dateMatch = (d >= from && d <= to);
            const searchMatch = inv.invoice_number.toLowerCase().includes(search);
            return dateMatch && searchMatch;
        });

        state.filteredReturns = filtered;

        // حساب الإحصائيات (نجلب العناصر لنعرف كم قطعة رجعت)
        let totalRefunded = 0;
        let totalQty = 0;

        // جلب جميع الـ items التابعة لهذه الفواتير لحساب عدد القطع
        const itemPromises = filtered.map(inv => db.invoice_items.where('invoice_id').equals(inv.id).toArray());
        const allItemsArrays = await Promise.all(itemPromises);
        
        allItemsArrays.forEach(items => {
            items.forEach(item => {
                totalQty += Math.abs(item.qty); // نستخدم القيمة المطلقة لضمان العرض السليم
            });
        });

        filtered.forEach(inv => {
            // المبالغ في المرتجعات تكون مسجلة بالسالب، لذلك نأخذ القيمة المطلقة للعرض
            totalRefunded += Math.abs(parseFloat(inv.total) || 0);
        });

        state.totalReturnedQty = totalQty;

        const formatMoney = (num) => num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        // تحديث كروت الإحصائيات
        document.getElementById('ret-stats-container').innerHTML = `
            <div class="col-span-2 md:col-span-1 bg-slate-900 p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-lg text-white relative overflow-hidden">
                <i class="fas fa-hand-holding-usd absolute -left-2 -bottom-2 text-6xl text-white/5"></i>
                <p class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-1">إجمالي الأموال المردودة</p>
                <div class="text-xl md:text-3xl font-black font-mono mb-1 truncate">${formatMoney(totalRefunded)}</div>
                <p class="text-[9px] md:text-[10px] font-bold text-amber-400 mt-1">خارجة من الصندوق</p>
            </div>

            <div class="col-span-1 bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border border-amber-100 shadow-sm relative">
                <p class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-1">عدد المرتجعات</p>
                <p class="text-lg md:text-2xl font-black text-amber-600 font-mono mb-1 truncate">${filtered.length}</p>
                <p class="text-[8px] md:text-[10px] font-bold text-amber-500">فاتورة مستردة</p>
            </div>

            <div class="col-span-1 bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border border-blue-100 shadow-sm relative">
                <p class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-1">القطع المستردة</p>
                <p class="text-lg md:text-2xl font-black text-blue-600 font-mono mb-1 truncate">${totalQty}</p>
                <p class="text-[8px] md:text-[10px] font-bold text-blue-500">عادت للمخزن</p>
            </div>
        `;

        window.renderRetPaginatedList();
    };

    // --- عرض القائمة ---
    window.renderRetPaginatedList = () => {
        const listContainer = document.getElementById('returns-log-list');
        const paginationContainer = document.getElementById('ret-pagination-controls');
        
        if (state.filteredReturns.length === 0) {
            listContainer.className = "w-full";
            listContainer.innerHTML = `<div class="text-center py-12 md:py-20 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"><i class="fas fa-undo text-4xl md:text-5xl mb-4 opacity-30 block"></i><span class="font-bold text-xs md:text-sm">لا توجد حركات مرتجعات</span></div>`;
            paginationContainer.parentElement.classList.add('hidden');
            return;
        }
        
        paginationContainer.parentElement.classList.remove('hidden');

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const currentItems = state.filteredReturns.slice(startIndex, endIndex);

        const formatMoney = (num) => Math.abs(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        listContainer.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5";
        listContainer.innerHTML = currentItems.map(inv => {
            return `
            <div class="bg-white p-3.5 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm border border-slate-100 active:bg-slate-50 transition-all cursor-pointer relative overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md" onclick="openReturnDetails(${inv.id})">
                <div class="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                
                <div class="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                    <div>
                        <span class="block text-xs md:text-sm font-black text-slate-800 font-mono tracking-tighter">#${inv.invoice_number}</span>
                        <span class="block text-[8px] md:text-[9px] font-bold text-slate-400 mt-0.5">${String(inv.date).substring(0, 16).replace('T', ' ')}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black border bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1">
                        <i class="fas fa-undo"></i> مسترد
                    </span>
                </div>
                
                <div class="mb-3">
                    <p class="font-bold text-slate-600 text-[10px] md:text-xs truncate"><i class="fas fa-user text-slate-300 ml-1"></i> ${inv.customer_vendor_name || 'عميل'}</p>
                </div>

                <div class="flex justify-between items-end mt-auto pt-1">
                    <div>
                        <p class="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-0.5">القيمة המردودة</p>
                        <p class="text-base md:text-lg font-black text-rose-600 font-mono leading-none">${formatMoney(Number(inv.total))}</p>
                    </div>
                    <div class="w-6 h-6 md:w-8 md:h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center shadow-sm">
                        <i class="fas fa-chevron-left text-[9px] md:text-[10px]"></i>
                    </div>
                </div>
            </div>
        `}).join('');

        const totalPages = Math.ceil(state.filteredReturns.length / state.itemsPerPage);
        
        paginationContainer.innerHTML = `
            <button onclick="changeRetLogPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-right text-sm"></i></button>
            <div class="px-4 md:px-6 py-2 flex items-center justify-center min-w-[70px]">
                <span class="text-[10px] md:text-xs font-bold text-slate-400 mr-1 hidden md:inline">صفحة</span>
                <span class="font-black text-sm md:text-base text-amber-600">${state.currentPage} / ${totalPages}</span>
            </div>
            <button onclick="changeRetLogPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-left text-sm"></i></button>
        `;
    };

    window.changeRetLogPage = (newPage) => {
        const totalPages = Math.ceil(state.filteredReturns.length / state.itemsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            state.currentPage = newPage;
            window.renderRetPaginatedList();
            if(window.innerWidth < 768) {
                document.getElementById('ret-log-search').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    // --- تفاصيل المرتجع وإلغاؤه ---
    window.openReturnDetails = async (id) => {
        state.activeInvId = id;
        const inv = await db.invoices.get(id);
        const items = await db.invoice_items.where('invoice_id').equals(id).toArray();
        
        document.getElementById('ret-modal-no').innerText = inv.invoice_number;
        document.getElementById('ret-modal-date').innerText = String(inv.date).substring(0, 16).replace('T', ' ');
        document.getElementById('ret-modal-total').innerText = Math.abs(parseFloat(inv.total)).toLocaleString('en-US', {minimumFractionDigits: 2});

        document.getElementById('ret-modal-items').innerHTML = items.map(item => `
            <div class="bg-white border border-slate-200 p-2.5 md:p-3 rounded-xl flex justify-between items-center shadow-sm">
                <div class="flex-1 min-w-0 pr-2">
                    <p class="font-black text-[11px] md:text-xs text-slate-800 truncate">${item.product_name || 'صنف مجهول'}</p>
                    <p class="text-[9px] md:text-[10px] font-bold text-slate-500 mt-0.5">${Math.abs(Number(item.price)).toLocaleString()} ج.م</p>
                </div>
                <div class="bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 shrink-0 text-center">
                    <span class="block text-[8px] font-bold text-amber-500 uppercase">الكمية</span>
                    <span class="font-black text-xs md:text-sm text-amber-700 font-mono">${Math.abs(item.qty)}</span>
                </div>
            </div>
        `).join('');

        document.getElementById('ret-details-modal').classList.remove('hidden');
    };

    window.closeRetDetailsModal = () => document.getElementById('ret-details-modal').classList.add('hidden');

    // الدالة الخطيرة: إلغاء المرتجع (تعكس التأثير)
    window.confirmVoidReturn = async () => {
        const res = await Swal.fire({
            title: 'إلغاء حركة المرتجع؟',
            text: "سيتم سحب البضاعة من المخزن مرة أخرى وإلغاء القيود العكسية.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            cancelButtonText: 'تراجع',
            confirmButtonText: 'نعم، قم بالإلغاء',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });
        
        if(!res.isConfirmed) return;
        
        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products, db.journal, db.journal_items], async () => {
                const inv = await db.invoices.get(state.activeInvId);
                const items = await db.invoice_items.where('invoice_id').equals(state.activeInvId).toArray();

                // 1. عكس المخزون (سحب القطع التي أضفناها بالخطأ)
                for (let item of items) {
                    const prod = await db.products.get(item.product_id);
                    if (prod) {
                        // item.qty مسجلة بالموجب في المرتجع، لذا نطرحها لنعكس التأثير
                        await db.products.update(prod.id, { stock_qty: Math.max(0, (parseFloat(prod.stock_qty)||0) - Math.abs(item.qty)) });
                    }
                }
                
                // 2. حذف عناصر الفاتورة
                await db.invoice_items.where('invoice_id').equals(state.activeInvId).delete();
                
                // 3. حذف القيود اليومية المرتبطة
                if(inv && inv.invoice_number) {
                    const linkedJournal = await db.journal.where('ref_no').equals(inv.invoice_number).first();
                    if(linkedJournal) {
                        await db.journal_items.where('journal_id').equals(linkedJournal.id).delete();
                        await db.journal.delete(linkedJournal.id);
                    }
                }
                
                // 4. حذف الفاتورة نفسها
                await db.invoices.delete(state.activeInvId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الإلغاء', text: 'تمت تسوية الدفاتر وسحب البضاعة من المخزن', timer: 2000, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeRetDetailsModal();
            window.loadReturnsLog();
        } catch (e) { Swal.fire({icon: 'error', title: 'خطأ', text: e.message}); }
    };

    // --- التصدير ---
    window.exportReturnsExcel = () => {
        if(state.filteredReturns.length === 0) return;
        const excelData = state.filteredReturns.map(inv => ({
            "رقم المرتجع": inv.invoice_number,
            "التاريخ": String(inv.date).substring(0, 16).replace('T', ' '),
            "العميل": inv.customer_vendor_name || 'عميل',
            "القيمة المردودة": Math.abs(Number(inv.total))
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        if(!ws['!views']) ws['!views'] = [];
        ws['!views'].push({rightToLeft: true});
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المرتجعات");
        XLSX.writeFile(wb, `سجل_المرتجعات_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    window.exportReturnsPDF = () => {
        if(state.filteredReturns.length === 0) return;
        let totalAmount = state.filteredReturns.reduce((acc, curr) => acc + Math.abs(Number(curr.total)), 0);

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html dir="rtl" lang="ar"><head><title>تقرير المرتجعات</title><style>
            body { font-family: Tahoma, sans-serif; padding: 20px; color: #1e293b; }
            h2 { color: #f59e0b; font-size: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { padding: 8px; border: 1px solid #cbd5e1; text-align: right; }
            th { background-color: #f1f5f9; }
            .summary { margin-top:20px; display: flex; justify-content: space-between; background: #fffbeb; padding: 10px; border-radius: 5px; font-weight: bold; color: #b45309; border: 1px solid #fde68a; }
            </style></head><body>
            <h2>سجل مرتجعات المبيعات</h2>
            <table><thead><tr><th>رقم المرتجع</th><th>التاريخ</th><th>العميل</th><th>القيمة المردودة</th></tr></thead><tbody>
            ${state.filteredReturns.map(inv => `<tr><td>${inv.invoice_number}</td><td>${String(inv.date).substring(0, 10)}</td><td>${inv.customer_vendor_name || 'عميل'}</td><td dir="ltr">${Math.abs(Number(inv.total)).toFixed(2)}</td></tr>`).join('')}
            </tbody></table>
            <div class="summary"><span>إجمالي عدد المرتجعات: ${state.filteredReturns.length}</span><span>إجمالي الأموال المردودة: ${totalAmount.toFixed(2)} ج.م</span></div>
            <script> window.onload = function() { window.print(); window.close(); } </script>
            </body></html>
        `);
        printWindow.document.close();
    };

    // --- الإعدادات الأولية ---
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('ret-date-from').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('ret-date-to').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    loadReturnsLog();
})();