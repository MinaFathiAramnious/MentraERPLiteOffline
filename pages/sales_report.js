/**
 * MENTRA ERP - Smart Sales & Inventory Master (v10.5 Mobile-Optimized)
 * الميزات: تصميم يشبه تطبيقات الموبايل الحقيقية، أرباح لحظية، مزامنة مخزن، فلاتر سريعة
 */

(function() {
    const displayArea = document.getElementById('main-content-display');
    const state = {
        allSales: [],
        filteredSales: [], 
        itemsPerPage: 12,  
        currentPage: 0
    };

    let activeInvoiceId = null;
    let editingItems = [];

    // إضافة ستايل خاص للموبايل (Safe Area & Hide Scrollbar)
    const style = document.createElement('style');
    style.innerHTML = `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes slide-up-sheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-bottom-sheet { animation: slide-up-sheet 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    `;
    document.head.appendChild(style);

    // --- 1. بناء هيكل الصفحة (UI) ---
    displayArea.innerHTML = `
    <div class="animate-fade-in pb-24 px-2 md:px-0 text-right font-sans" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الهيدر الرئيسي -->
        <div class="flex items-center justify-between gap-3 mb-5 md:mb-8">
            <div class="flex items-center gap-3 md:gap-4">
                <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                    <i class="fas fa-file-invoice-dollar"></i>
                </div>
                <div>
                    <h2 class="text-lg sm:text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">سجل المبيعات</h2>
                    <p class="text-[9px] sm:text-xs font-bold text-slate-500 mt-0.5 md:mt-1">إدارة الفواتير والتحصيل</p>
                </div>
            </div>
            
            <!-- أزرار التصدير (تظهر في الديسكتوب فقط هنا) -->
            <div class="hidden md:flex items-center gap-2 shrink-0">
                <button onclick="exportToExcel()" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-3 rounded-xl font-black text-xs transition-all border border-emerald-100"><i class="fas fa-file-excel ml-1"></i> إكسيل</button>
                <button onclick="exportToPDF()" class="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-3 rounded-xl font-black text-xs transition-all border border-rose-100"><i class="fas fa-file-pdf ml-1"></i> PDF</button>
            </div>
        </div>

        <!-- الكروت الإحصائية (Grid ذكي للموبايل) -->
        <div id="salesStats" class="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-5 mb-5 md:mb-8"></div>

        <!-- شريط الأدوات (بحث وفلاتر مدمجة للموبايل) -->
        <div class="bg-white p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3 mb-5 md:mb-8">
            
            <div class="flex flex-col md:flex-row gap-3">
                <!-- البحث الموحد -->
                <div class="relative w-full md:flex-1">
                    <i class="fas fa-search absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="searchInvoice" oninput="handleSearch(this.value)" 
                           placeholder="بحث برقم الفاتورة، العميل..." 
                           class="w-full bg-slate-50 p-3 md:p-3.5 pr-10 outline-none rounded-xl md:rounded-2xl border border-slate-200 focus:border-blue-500 font-bold text-xs md:text-sm text-slate-800 transition-all">
                </div>

                <!-- الفلاتر السريعة -->
                <div class="flex items-center gap-2 bg-slate-50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto hide-scrollbar">
                    <button onclick="setQuickSaleDate('today')" class="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-lg text-[10px] md:text-[11px] font-black text-slate-700 hover:text-blue-600 shadow-sm whitespace-nowrap active:scale-95">اليوم</button>
                    <button onclick="setQuickSaleDate('month')" class="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-lg text-[10px] md:text-[11px] font-black text-slate-700 hover:text-blue-600 shadow-sm whitespace-nowrap active:scale-95">الشهر</button>
                    <div class="w-px h-5 bg-slate-300 mx-1 shrink-0"></div>
                    <div class="flex items-center gap-1.5 shrink-0 px-1">
                        <input type="date" id="report-start" onchange="applyFilters()" class="bg-transparent text-[10px] md:text-xs font-black outline-none text-slate-700 w-[95px] md:w-auto">
                        <span class="text-slate-300">-</span>
                        <input type="date" id="report-end" onchange="applyFilters()" class="bg-transparent text-[10px] md:text-xs font-black outline-none text-slate-700 w-[95px] md:w-auto">
                    </div>
                </div>
            </div>

            <!-- أزرار التصدير (للموبايل فقط في الأسفل) -->
            <div class="flex md:hidden items-center gap-2 mt-1">
                <button onclick="exportToExcel()" class="flex-1 bg-emerald-50 text-emerald-600 px-3 py-2.5 rounded-lg font-black text-[10px] border border-emerald-100 active:bg-emerald-100"><i class="fas fa-file-excel ml-1"></i> إكسيل</button>
                <button onclick="exportToPDF()" class="flex-1 bg-rose-50 text-rose-600 px-3 py-2.5 rounded-lg font-black text-[10px] border border-rose-100 active:bg-rose-100"><i class="fas fa-file-pdf ml-1"></i> PDF</button>
            </div>
        </div>

        <!-- قائمة الفواتير (Cards) -->
        <div id="sales-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5"></div>

        <!-- الترقيم (Pagination) مخصص للموبايل -->
        <div class="flex justify-center items-center mt-6 md:mt-10">
            <div class="bg-white p-1.5 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-1">
                <button onclick="changePage(-1)" id="prevBtn" class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-right text-sm"></i></button>
                <div class="px-4 py-2 flex items-center justify-center min-w-[70px]">
                    <span id="pageNumber" class="font-black text-sm md:text-base text-blue-600">1</span>
                </div>
                <button onclick="changePage(1)" id="nextBtn" class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-left text-sm"></i></button>
            </div>
        </div>
    </div>

    <!-- المودال الذكي (Bottom Sheet للموبايل / Modal للديسكتوب) -->
    <div id="detailsModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-300">
        <div class="bg-white w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-bottom-sheet md:animate-pop-in relative text-right pb-safe" dir="rtl">
            
            <!-- مؤشر السحب (للموبايل فقط) -->
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 md:hidden"></div>

            <!-- هيدر المودال -->
            <div class="flex justify-between items-start mb-4 border-b border-slate-100 pb-3 md:pb-4 shrink-0">
                <div>
                    <h3 class="text-base md:text-xl font-black text-slate-900 flex items-center gap-2">
                        <span id="view-inv-no" class="text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md"></span>
                    </h3>
                    <p id="view-inv-date" class="text-[9px] md:text-xs font-bold text-slate-400 mt-1"></p>
                </div>
                <button onclick="closeDetailsModal()" class="w-8 h-8 bg-slate-100 rounded-full text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center active:scale-90"><i class="fas fa-times"></i></button>
            </div>
            
            <!-- المنطقة القابلة للتمرير -->
            <div class="flex-1 overflow-y-auto hide-scrollbar space-y-4">
                
                <!-- أرباح الفاتورة -->
                <div id="invoice-profit-badge" class="bg-emerald-50 border border-emerald-100 p-3 md:p-4 rounded-xl flex items-center justify-between">
                    <span class="text-[10px] md:text-xs font-black text-emerald-600 uppercase"><i class="fas fa-chart-line ml-1"></i> صافي ربح الفاتورة</span>
                    <span id="view-inv-profit" class="font-black text-sm md:text-base text-emerald-700 font-mono">0.00 ج.م</span>
                </div>

                <!-- قائمة الأصناف -->
                <div class="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                    <div id="invoice-items-list" class="space-y-2"></div>
                </div>

                <!-- الإعدادات والإجمالي -->
                <div class="grid grid-cols-2 gap-2 md:gap-4">
                    <div class="bg-white border border-slate-200 p-2 md:p-4 rounded-xl flex flex-col justify-center">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">حالة السداد</span>
                        <select id="view-inv-status" class="bg-transparent font-bold text-xs md:text-sm text-slate-800 outline-none w-full">
                            <option value="paid">✅ مدفوعة كاش</option>
                            <option value="pending">⏳ آجل (دين)</option>
                        </select>
                    </div>
                    <div class="bg-slate-900 p-3 md:p-4 rounded-xl flex flex-col justify-center items-end shadow-md">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-0.5">الإجمالي النهائي</span>
                        <h2 id="view-inv-total" class="text-lg md:text-2xl font-black text-emerald-400 font-mono truncate w-full text-left">0.00</h2>
                    </div>
                </div>
            </div>

            <!-- الأزرار السفلية (Sticky Footer) -->
            <div class="pt-3 md:pt-4 mt-2 border-t border-slate-100 flex gap-2 shrink-0">
                <button onclick="saveSmartEdit()" class="flex-[2] bg-blue-600 text-white py-3.5 rounded-xl font-black shadow-lg shadow-blue-500/20 active:bg-blue-700 active:scale-95 transition-all text-xs md:text-sm flex justify-center items-center gap-1.5">
                    <i class="fas fa-save"></i> حفظ المخزن
                </button>
                <button onclick="deleteInvoice()" class="flex-1 bg-rose-50 text-rose-600 py-3.5 rounded-xl font-black border border-rose-100 active:bg-rose-100 active:scale-95 transition-all text-xs md:text-sm flex justify-center items-center gap-1.5">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </div>
        </div>
    </div>
    `;

    // --- 2. وظائف جلب وعرض البيانات ---

    window.loadSalesData = async () => {
        const data = await db.invoices.where('type').equalsIgnoreCase('sale').reverse().toArray();
        state.allSales = data;
        state.filteredSales = data;
        window.applyFilters(); 
    };

    window.setQuickSaleDate = (type) => {
        const today = new Date();
        const endInput = document.getElementById('report-end');
        const startInput = document.getElementById('report-start');
        
        endInput.value = today.toISOString().split('T')[0];

        if (type === 'today') {
            startInput.value = today.toISOString().split('T')[0];
        } else if (type === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            firstDay.setHours(12); 
            startInput.value = firstDay.toISOString().split('T')[0];
        }
        window.applyFilters();
    };

    window.applyFilters = () => {
        const start = document.getElementById('report-start').value;
        const end = document.getElementById('report-end').value;
        let filtered = state.allSales;
        
        if (start && end) {
            filtered = filtered.filter(inv => {
                const invDate = String(inv.date).substring(0, 10);
                return invDate >= start && invDate <= end;
            });
        }
        
        state.filteredSales = filtered;
        state.currentPage = 0;
        renderSales(filtered);
    };

    window.handleSearch = (val) => {
        const term = val.toLowerCase().trim();
        const filtered = state.allSales.filter(inv => 
            inv.invoice_number.toLowerCase().includes(term) || 
            (inv.customer_vendor_name && inv.customer_vendor_name.toLowerCase().includes(term))
        );
        state.filteredSales = filtered;
        state.currentPage = 0;
        renderSales(filtered);
    };

    window.renderSales = (data) => {
        const container = document.getElementById('sales-list');
        const start = state.currentPage * state.itemsPerPage;
        const paged = data.slice(start, start + state.itemsPerPage);

        if(data.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 md:py-20 text-slate-400 bg-slate-50/50 rounded-2xl"><i class="fas fa-box-open text-4xl mb-3 opacity-30 block"></i><p class="font-bold text-xs">لا توجد مبيعات مطابقة لبحثك</p></div>`;
            updateStats(data);
            return;
        }

        container.innerHTML = paged.map(inv => {
            const isPaid = inv.status === 'paid';
            const statusColor = isPaid ? 'emerald' : 'rose';
            const statusBg = isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100';
            
            return `
            <div class="bg-white p-3.5 md:p-5 rounded-2xl shadow-sm border border-slate-100 active:bg-slate-50 transition-all cursor-pointer relative overflow-hidden flex flex-col" onclick="openDetails(${inv.id})">
                <div class="absolute top-0 right-0 w-1 h-full bg-${statusColor}-500"></div>
                
                <!-- Header -->
                <div class="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                    <div>
                        <span class="block text-xs font-black text-slate-800 font-mono tracking-tighter">#${inv.invoice_number}</span>
                        <span class="block text-[8px] font-bold text-slate-400 mt-0.5">${String(inv.date).substring(0, 16).replace('T', ' ')}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[8px] font-black border ${statusBg} flex items-center gap-1">
                        ${isPaid ? '<i class="fas fa-check"></i> مدفوع' : '<i class="fas fa-clock"></i> آجل'}
                    </span>
                </div>
                
                <!-- Customer -->
                <div class="mb-3 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><i class="fas fa-user text-[9px]"></i></div>
                    <div class="min-w-0 flex-1">
                        <p class="font-black text-slate-700 text-[10px] md:text-xs truncate">${inv.customer_vendor_name || 'عميل نقدي عام'}</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="flex justify-between items-end mt-auto pt-1">
                    <div>
                        <p class="text-[8px] font-black text-slate-400 uppercase mb-0.5">الإجمالي</p>
                        <p class="text-base md:text-lg font-black text-slate-900 font-mono leading-none">${Number(inv.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="w-6 h-6 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center shadow-sm">
                        <i class="fas fa-chevron-left text-[9px]"></i>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        updateStats(data);
        updatePagination(data.length);
    };

    // --- 3. وظائف التعديل الذكي والأرباح (Smart Edit & Profit) ---

    window.openDetails = async (id) => {
        activeInvoiceId = id;
        const inv = await db.invoices.get(id);
        let items = await db.invoice_items.where('invoice_id').equals(id).toArray();

        let invoiceTotalCost = 0;

        for (let item of items) {
            const p = await db.products.get(item.product_id);
            item.product_name = p ? p.name_ar : "صنف مجهول";
            const unitCost = p ? (Number(p.cost) || 0) : 0;
            invoiceTotalCost += (unitCost * item.qty);
        }

        editingItems = JSON.parse(JSON.stringify(items));
        
        document.getElementById('view-inv-no').innerText = inv.invoice_number;
        document.getElementById('view-inv-date').innerText = String(inv.date).substring(0, 16).replace('T', ' ');
        document.getElementById('view-inv-total').innerText = Number(inv.total).toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('view-inv-status').value = inv.status;

        const invoiceProfit = Number(inv.total) - invoiceTotalCost;
        const profitEl = document.getElementById('view-inv-profit');
        profitEl.innerText = `${invoiceProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م`;
        
        if(invoiceProfit < 0) {
            profitEl.className = "font-black text-sm text-rose-600 font-mono";
            document.getElementById('invoice-profit-badge').className = "mb-4 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center justify-between shadow-sm";
        } else {
            profitEl.className = "font-black text-sm text-emerald-700 font-mono";
            document.getElementById('invoice-profit-badge').className = "mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between shadow-sm";
        }

        renderModalItems();
        
        const modal = document.getElementById('detailsModal');
        modal.classList.remove('hidden');
    };

    window.renderModalItems = () => {
        document.getElementById('invoice-items-list').innerHTML = editingItems.map((item, idx) => `
            <div class="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center shadow-sm">
                <div class="flex-1 min-w-0 pr-2">
                    <p class="font-black text-[10px] md:text-xs text-slate-800 truncate">${item.product_name}</p>
                    <p class="text-[9px] font-bold text-slate-500 mt-0.5">${Number(item.price).toLocaleString()} ج.م للوحدة</p>
                </div>
                <!-- أزرار زيادة ونقصان مخصصة للمس (Touch Friendly) -->
                <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
                    <button onclick="adjustQty(${idx}, -1)" class="w-7 h-7 bg-white rounded border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-100"><i class="fas fa-minus text-[8px]"></i></button>
                    <span class="w-8 text-center font-black text-xs text-blue-600 font-mono">${item.qty}</span>
                    <button onclick="adjustQty(${idx}, 1)" class="w-7 h-7 bg-white rounded border border-slate-200 text-slate-500 flex items-center justify-center active:bg-slate-100"><i class="fas fa-plus text-[8px]"></i></button>
                </div>
            </div>
        `).join('');
    };

    window.adjustQty = (idx, amount) => {
        const newQty = Math.max(0, editingItems[idx].qty + amount);
        editingItems[idx].qty = newQty;
        renderModalItems();
        const total = editingItems.reduce((s, i) => s + (i.qty * i.price), 0);
        document.getElementById('view-inv-total').innerText = total.toLocaleString(undefined, {minimumFractionDigits: 2});
    };

    window.saveSmartEdit = async () => {
        try {
            for (let item of editingItems) {
                const original = await db.invoice_items.get(item.id);
                const diff = item.qty - original.qty; 
                const prod = await db.products.get(item.product_id);

                if (prod && diff > 0 && prod.stock_qty < diff) {
                    Swal.fire({icon: 'error', title: 'رصيد غير كافٍ', text: `المتاح من ${item.product_name}: ${prod.stock_qty}`, customClass: {popup: 'rounded-3xl'}});
                    return; 
                }
            }

            await db.transaction('rw', [db.invoices, db.invoice_items, db.products], async () => {
                let finalTotal = 0;
                for (let item of editingItems) {
                    const original = await db.invoice_items.get(item.id);
                    const diff = item.qty - original.qty;
                    const prod = await db.products.get(item.product_id);
                    
                    if (prod) await db.products.update(prod.id, { stock_qty: Number(prod.stock_qty) - diff });
                    await db.invoice_items.update(item.id, { qty: item.qty, total_item: item.qty * item.price });
                    finalTotal += (item.qty * item.price);
                }
                await db.invoices.update(activeInvoiceId, { total: finalTotal, status: document.getElementById('view-inv-status').value });
            });

            Swal.fire({icon: 'success', title: 'تم الحفظ', text: 'تم التعديل وتحديث المخزن', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeDetailsModal();
            loadSalesData();

        } catch (e) { 
            Swal.fire({icon: 'error', title: 'خطأ', text: e.message});
        }
    };

    window.deleteInvoice = async () => {
        if (!activeInvoiceId) return;
        
        const res = await Swal.fire({
            title: 'تأكيد الحذف؟',
            text: "سيتم إرجاع البضاعة للمخزن وتحديث الحسابات.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'تراجع',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });

        if (!res.isConfirmed) return;

        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products, db.stock_movements, db.journal, db.journal_items], async () => {
                const inv = await db.invoices.get(activeInvoiceId);
                const items = await db.invoice_items.where('invoice_id').equals(activeInvoiceId).toArray();
                
                for (const item of items) {
                    const p = await db.products.get(item.product_id);
                    if (p) await db.products.update(p.id, { stock_qty: Number(p.stock_qty) + Number(item.qty) });
                }
                
                await db.invoice_items.where('invoice_id').equals(activeInvoiceId).delete();
                
                if(inv && inv.invoice_number) {
                    await db.stock_movements.where('ref_id').equals(inv.invoice_number).delete();
                    const linkedJournal = await db.journal.where('ref_no').equals(inv.invoice_number).first();
                    if(linkedJournal) {
                        await db.journal_items.where('journal_id').equals(linkedJournal.id).delete();
                        await db.journal.delete(linkedJournal.id);
                    }
                }
                
                await db.invoices.delete(activeInvoiceId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الحذف', text: 'تمت تسوية المخزن والدفاتر', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeDetailsModal();
            loadSalesData();
        } catch (e) { 
            Swal.fire({icon: 'error', title: 'خطأ', text: e.message});
        }
    };

    // --- 4. التصدير (PDF & EXCEL) ---

    window.exportToExcel = () => {
        if(state.filteredSales.length === 0) return;
        const excelData = state.filteredSales.map(inv => ({
            "رقم الفاتورة": inv.invoice_number,
            "التاريخ": String(inv.date).substring(0, 16).replace('T', ' '),
            "العميل": inv.customer_vendor_name || 'نقدي',
            "الإجمالي": Number(inv.total),
            "الحالة": inv.status === 'paid' ? 'مدفوعة' : 'آجلة'
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        if(!ws['!views']) ws['!views'] = [];
        ws['!views'].push({rightToLeft: true});
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
        XLSX.writeFile(wb, `مبيعات_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    window.exportToPDF = () => {
        if(state.filteredSales.length === 0) return;
        let totalAmount = state.filteredSales.reduce((acc, curr) => acc + Number(curr.total), 0);
        let unpaidAmount = state.filteredSales.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total), 0);

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html dir="rtl" lang="ar"><head><title>تقرير المبيعات</title><style>
            body { font-family: Tahoma, sans-serif; padding: 20px; color: #1e293b; }
            h2 { color: #2563eb; font-size: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { padding: 8px; border: 1px solid #cbd5e1; text-align: right; }
            th { background-color: #f8fafc; }
            .summary { margin-top:20px; display: flex; justify-content: space-between; background: #eff6ff; padding: 10px; border-radius: 5px; font-weight: bold; }
            </style></head><body>
            <h2>سجل المبيعات والعملاء</h2>
            <table><thead><tr><th>الفاتورة</th><th>التاريخ</th><th>العميل</th><th>الحالة</th><th>الإجمالي</th></tr></thead><tbody>
            ${state.filteredSales.map(inv => `<tr><td>${inv.invoice_number}</td><td>${String(inv.date).substring(0, 10)}</td><td>${inv.customer_vendor_name || 'نقدي'}</td><td>${inv.status === 'paid' ? 'مدفوعة' : 'آجلة'}</td><td dir="ltr">${Number(inv.total).toFixed(2)}</td></tr>`).join('')}
            </tbody></table>
            <div class="summary"><span>المبيعات: ${totalAmount.toFixed(2)}</span><span>الديون: ${unpaidAmount.toFixed(2)}</span></div>
            <script> window.onload = function() { window.print(); window.close(); } </script>
            </body></html>
        `);
        printWindow.document.close();
    };

    // --- 5. أدوات مساعدة والإحصائيات العلوية ---

    function updateStats(data) {
        const total = data.reduce((s, i) => s + Number(i.total), 0);
        const paid = data.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
        const pending = total - paid;
        
        const collectionRate = total > 0 ? (paid / total) * 100 : 0;

        document.getElementById('salesStats').innerHTML = `
            <div class="col-span-2 md:col-span-1 bg-slate-900 p-4 rounded-[1.2rem] shadow-lg text-white relative overflow-hidden">
                <i class="fas fa-chart-line absolute -left-2 -bottom-2 text-6xl text-white/5"></i>
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">المبيعات الإجمالية</p>
                <div class="text-xl md:text-2xl font-black font-mono truncate">${total.toLocaleString()}</div>
                <p class="text-[9px] font-bold text-slate-400 mt-1">${data.length} فاتورة مسجلة</p>
            </div>
            
            <div class="col-span-1 bg-white p-4 rounded-[1.2rem] border border-slate-100 shadow-sm relative">
                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">المحصل الكاش</p>
                <p class="text-lg md:text-xl font-black text-emerald-500 font-mono mb-2 truncate">${paid.toLocaleString()}</p>
                <div class="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div class="bg-emerald-500 h-1 rounded-full" style="width: ${collectionRate}%"></div>
                </div>
            </div>
            
            <div class="col-span-1 bg-white p-4 rounded-[1.2rem] border border-slate-100 shadow-sm relative">
                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">ديون خارجية (آجل)</p>
                <p class="text-lg md:text-xl font-black text-rose-500 font-mono mb-1 truncate">${pending.toLocaleString()}</p>
                <p class="text-[8px] font-bold text-rose-400">قيد التحصيل</p>
            </div>
        `;
    }

    window.closeDetailsModal = () => document.getElementById('detailsModal').classList.add('hidden');
    
    window.changePage = (dir) => { 
        state.currentPage += dir; 
        renderSales(state.filteredSales); 
        if(window.innerWidth < 768) {
            document.getElementById('searchInvoice').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    
    function updatePagination(len) {
        document.getElementById('pageNumber').innerText = state.currentPage + 1;
        document.getElementById('prevBtn').disabled = state.currentPage === 0;
        document.getElementById('nextBtn').disabled = (state.currentPage + 1) * state.itemsPerPage >= len;
    }

    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('report-start').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('report-end').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    loadSalesData();
})();