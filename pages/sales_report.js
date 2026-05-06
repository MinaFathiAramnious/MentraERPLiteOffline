/**
 * MENTRA ERP - Smart Sales & Inventory Master (v9.0 Pro Analytics & Export)
 * الميزات: مبيعات، أرباح لحظية للفاتورة، مزامنة مخزن عكسية، تصدير، فلاتر سريعة
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

    // --- 1. بناء هيكل الصفحة (UI) ---
    displayArea.innerHTML = `
    <div class="animate-fade-in pb-24 text-right" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الهيدر الرئيسي -->
        <div class="flex items-center gap-4 mb-6 md:mb-8 px-2">
            <div class="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                <i class="fas fa-file-invoice-dollar"></i>
            </div>
            <div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">سجل المبيعات والعملاء</h2>
                <p class="text-xs font-bold text-slate-500 mt-1">إدارة الفواتير، التحصيل، والمرتجعات</p>
            </div>
        </div>

        <!-- الكروت الإحصائية (تم إضافة شريط التحصيل) -->
        <div id="salesStats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8"></div>

        <!-- شريط الأدوات (بحث، فلاتر سريعة، تصدير) -->
        <div class="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-center mb-6 md:mb-8">
            
            <!-- الفلاتر والبحث -->
            <div class="flex flex-col md:flex-row w-full xl:w-auto gap-3">
                <div class="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-2 md:p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
                    <!-- أزرار سريعة -->
                    <div class="flex gap-2 w-full md:w-auto px-1">
                        <button onclick="setQuickSaleDate('today')" class="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2.5 md:py-2 rounded-xl text-[11px] font-black text-slate-700 hover:text-blue-600 transition-all shadow-sm">اليوم</button>
                        <button onclick="setQuickSaleDate('month')" class="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2.5 md:py-2 rounded-xl text-[11px] font-black text-slate-700 hover:text-blue-600 transition-all shadow-sm">الشهر</button>
                    </div>
                    <div class="hidden md:block w-px h-6 bg-slate-300"></div>
                    <!-- من / إلى -->
                    <div class="flex items-center gap-2 w-full md:w-auto px-1">
                        <input type="date" id="report-start" onchange="applyFilters()" class="bg-transparent text-xs font-black outline-none text-slate-700 w-full cursor-pointer">
                        <span class="text-slate-300 font-black">-</span>
                        <input type="date" id="report-end" onchange="applyFilters()" class="bg-transparent text-xs font-black outline-none text-slate-700 w-full cursor-pointer">
                    </div>
                </div>
                
                <div class="relative w-full md:w-64">
                    <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="searchInvoice" onkeyup="handleSearch(this.value)" 
                           placeholder="بحث برقم الفاتورة أو العميل..." 
                           class="w-full bg-slate-50 p-3.5 pr-12 rounded-2xl outline-none border border-slate-200 focus:border-blue-500 focus:bg-white font-bold text-sm text-slate-700 transition-all shadow-sm">
                </div>
            </div>

            <!-- أزرار التصدير -->
            <div class="flex items-center gap-2 w-full xl:w-auto shrink-0">
                <button onclick="exportToExcel()" class="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-3.5 rounded-xl font-black text-xs transition-all active:scale-95 border border-emerald-100">
                    <i class="fas fa-file-excel text-sm"></i> <span>إكسيل</span>
                </button>
                <button onclick="exportToPDF()" class="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-3.5 rounded-xl font-black text-xs transition-all active:scale-95 border border-rose-100">
                    <i class="fas fa-file-pdf text-sm"></i> <span>PDF</span>
                </button>
            </div>
        </div>

        <!-- قائمة الفواتير -->
        <div id="sales-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"></div>

        <!-- الترقيم (Pagination) -->
        <div class="flex justify-center items-center gap-4 mt-8">
            <button onclick="changePage(-1)" id="prevBtn" class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-right text-slate-600"></i></button>
            <span id="pageNumber" class="font-black text-slate-600 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">1</span>
            <button onclick="changePage(1)" id="nextBtn" class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-left text-slate-600"></i></button>
        </div>
    </div>

    <!-- المودال الذكي للموبايل (Details Modal) -->
    <div id="detailsModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity">
        <div class="bg-white w-full max-w-3xl rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[92vh] animate-slide-up md:animate-pop-in relative text-right" dir="rtl">
            
            <div class="flex justify-between items-start mb-6 border-b border-slate-100 pb-5">
                <div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                        فاتورة <span id="view-inv-no" class="text-blue-600 font-mono"></span>
                    </h3>
                    <p id="view-inv-date" class="text-[10px] md:text-xs font-bold text-slate-400 mt-1"></p>
                </div>
                <button onclick="closeDetailsModal()" class="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90 shrink-0"><i class="fas fa-times text-lg"></i></button>
            </div>
            
            <!-- عرض أرباح الفاتورة (ميزة إدارية ذكية) -->
            <div id="invoice-profit-badge" class="mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between">
                <span class="text-[10px] font-black text-emerald-600 uppercase"><i class="fas fa-chart-line ml-1"></i> صافي ربح الفاتورة</span>
                <span id="view-inv-profit" class="font-black text-sm text-emerald-700">0.00 ج.م</span>
            </div>

            <div class="space-y-5">
                <!-- قائمة الأصناف -->
                <div class="bg-slate-50 rounded-3xl p-2 md:p-3 max-h-[35vh] overflow-y-auto custom-scrollbar border border-slate-100">
                    <div id="invoice-items-list" class="space-y-2"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl flex justify-between items-center shadow-sm">
                        <span class="text-[11px] font-black text-slate-500 uppercase">حالة الدفع:</span>
                        <select id="view-inv-status" class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-blue-500">
                            <option value="paid">✅ مدفوعة بالكامل</option>
                            <option value="pending">⏳ آجلة (دين مستحق)</option>
                        </select>
                    </div>
                    <div class="bg-slate-900 p-4 md:p-5 rounded-2xl flex justify-between items-center shadow-lg">
                        <span class="text-[11px] font-black text-slate-400 uppercase">إجمالي الفاتورة</span>
                        <h2 id="view-inv-total" class="text-2xl md:text-3xl font-black text-white font-mono">0.00</h2>
                    </div>
                </div>

                <div class="flex gap-3 pt-3 border-t border-slate-100">
                    <button onclick="saveSmartEdit()" class="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex justify-center items-center gap-2 text-sm">
                        <i class="fas fa-save"></i> حفظ التعديلات بالمخزن
                    </button>
                    <button onclick="deleteInvoice()" class="flex-1 bg-rose-50 text-rose-600 p-4 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex justify-center items-center border border-rose-100">
                        <i class="fas fa-trash-alt text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    </style>
    `;

    // --- 2. وظائف جلب وعرض البيانات ---

    window.loadSalesData = async () => {
        const data = await db.invoices.where('type').equalsIgnoreCase('sale').reverse().toArray();
        state.allSales = data;
        state.filteredSales = data;
        window.applyFilters(); // تطبيق الفلاتر الابتدائية
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
            container.innerHTML = `<div class="col-span-full text-center py-16 text-slate-400"><i class="fas fa-box-open text-5xl mb-4 opacity-40"></i><p class="font-bold text-sm">لا توجد مبيعات مطابقة لبحثك</p></div>`;
            updateStats(data);
            return;
        }

        container.innerHTML = paged.map(inv => {
            const isPaid = inv.status === 'paid';
            const statusColor = isPaid ? 'emerald' : 'rose';
            
            return `
            <div class="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 active:scale-95 hover:shadow-md hover:border-${statusColor}-200 transition-all cursor-pointer group relative overflow-hidden" onclick="openDetails(${inv.id})">
                <div class="absolute top-0 right-0 w-1 h-full bg-${statusColor}-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-4 border-b border-slate-50 pb-3">
                    <div>
                        <span class="block text-sm font-black text-slate-800 font-mono">#${inv.invoice_number}</span>
                        <span class="block text-[10px] font-bold text-slate-400 mt-0.5">${String(inv.date).substring(0, 16).replace('T', ' ')}</span>
                    </div>
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-black flex items-center gap-1 bg-${statusColor}-50 text-${statusColor}-600">
                        ${isPaid ? '<i class="fas fa-check"></i> مدفوع' : '<i class="fas fa-clock"></i> آجل'}
                    </span>
                </div>
                
                <div class="mb-4 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><i class="fas fa-user text-xs"></i></div>
                    <div class="truncate">
                        <p class="text-[9px] font-bold text-slate-400">العميل</p>
                        <p class="font-black text-slate-700 text-xs truncate">${inv.customer_vendor_name || 'عميل نقدي عام'}</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-end pt-3">
                    <div>
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-0.5">الإجمالي</p>
                        <p class="text-xl font-black text-slate-900 font-mono">${Number(inv.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="w-8 h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                        <i class="fas fa-pen text-xs"></i>
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
            // حساب تكلفة كل صنف لتحديد الربح
            const unitCost = p ? (Number(p.cost) || 0) : 0;
            invoiceTotalCost += (unitCost * item.qty);
        }

        editingItems = JSON.parse(JSON.stringify(items));
        
        document.getElementById('view-inv-no').innerText = inv.invoice_number;
        document.getElementById('view-inv-date').innerText = `تاريخ الإصدار: ${String(inv.date).substring(0, 16).replace('T', ' ')}`;
        document.getElementById('view-inv-total').innerText = Number(inv.total).toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('view-inv-status').value = inv.status;

        // حساب وعرض ربح الفاتورة
        const invoiceProfit = Number(inv.total) - invoiceTotalCost;
        const profitEl = document.getElementById('view-inv-profit');
        profitEl.innerText = `${invoiceProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م`;
        
        if(invoiceProfit < 0) {
            profitEl.className = "font-black text-sm text-rose-600";
            document.getElementById('invoice-profit-badge').className = "mb-4 bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center justify-between";
        } else {
            profitEl.className = "font-black text-sm text-emerald-700";
            document.getElementById('invoice-profit-badge').className = "mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between";
        }

        renderModalItems();
        
        const modal = document.getElementById('detailsModal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.firstElementChild.classList.remove('translate-y-full'), 10);
    };

    window.renderModalItems = () => {
        document.getElementById('invoice-items-list').innerHTML = editingItems.map((item, idx) => `
            <div class="bg-white border border-slate-100 p-3 rounded-2xl flex justify-between items-center shadow-sm">
                <div class="flex-1">
                    <p class="font-black text-xs text-slate-800 line-clamp-1">${item.product_name}</p>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">سعر البيع: ${Number(item.price).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <input type="number" onchange="updateRow(${idx}, this.value)" value="${item.qty}" 
                           class="w-14 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-black text-sm text-blue-600 outline-none focus:border-blue-500 transition-all">
                </div>
            </div>
        `).join('');
    };

    window.updateRow = (idx, newQty) => {
        editingItems[idx].qty = parseFloat(newQty) || 0;
        const total = editingItems.reduce((s, i) => s + (i.qty * i.price), 0);
        document.getElementById('view-inv-total').innerText = total.toLocaleString(undefined, {minimumFractionDigits: 2});
        // لا نقوم بتحديث الربح اللحظي هنا تجنباً للتعقيد، يتم تحديثه عند الحفظ وفتح الفاتورة مجدداً
    };

    window.saveSmartEdit = async () => {
        try {
            for (let item of editingItems) {
                const original = await db.invoice_items.get(item.id);
                const diff = item.qty - original.qty; 
                const prod = await db.products.get(item.product_id);

                if (prod && diff > 0 && prod.stock_qty < diff) {
                    Swal.fire({icon: 'error', title: 'رصيد غير كافٍ', text: `الكمية المتاحة من ${item.product_name} هي ${prod.stock_qty} فقط`, customClass: {popup: 'rounded-3xl'}});
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

            Swal.fire({icon: 'success', title: 'تم الحفظ', text: 'تم تعديل الفاتورة وتحديث المخزن بنجاح', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeDetailsModal();
            loadSalesData();

        } catch (e) { 
            Swal.fire({icon: 'error', title: 'خطأ', text: e.message});
        }
    };

    window.deleteInvoice = async () => {
        if (!activeInvoiceId) return;
        
        const res = await Swal.fire({
            title: 'حذف الفاتورة نهائياً؟',
            text: "سيتم حذف الفاتورة وإعادة البضاعة للمخزن وتنظيف السجلات المرتبطة بها.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف الفاتورة',
            cancelButtonText: 'تراجع',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });

        if (!res.isConfirmed) return;

        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products, db.stock_movements], async () => {
                const inv = await db.invoices.get(activeInvoiceId);
                const items = await db.invoice_items.where('invoice_id').equals(activeInvoiceId).toArray();
                
                // 1. إعادة الكميات للمخزن
                for (const item of items) {
                    const p = await db.products.get(item.product_id);
                    if (p) await db.products.update(p.id, { stock_qty: Number(p.stock_qty) + Number(item.qty) });
                }
                
                // 2. حذف تفاصيل الفاتورة
                await db.invoice_items.where('invoice_id').equals(activeInvoiceId).delete();
                
                // 3. مسح حركات المخزن المرتبطة بهذا الرقم (تنظيف الداتا)
                if(inv && inv.invoice_number) {
                    await db.stock_movements.where('ref_id').equals(inv.invoice_number).delete();
                }
                
                // 4. حذف الفاتورة نفسها
                await db.invoices.delete(activeInvoiceId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الحذف بنجاح', text: 'تم استرجاع البضاعة وتنظيف السجلات', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeDetailsModal();
            loadSalesData();
        } catch (e) { 
            Swal.fire({icon: 'error', title: 'خطأ', text: e.message});
        }
    };

    // --- 4. التصدير (PDF & EXCEL) ---

    window.exportToExcel = () => {
        if(state.filteredSales.length === 0) {
            Swal.fire({icon: 'info', title: 'لا يوجد بيانات', text: 'عفواً، لا يوجد فواتير لتصديرها للفترة المحددة', customClass: {popup: 'rounded-3xl'}});
            return;
        }

        const excelData = state.filteredSales.map(inv => ({
            "رقم الفاتورة": inv.invoice_number,
            "التاريخ": String(inv.date).substring(0, 16).replace('T', ' '),
            "العميل": inv.customer_vendor_name || 'نقدي',
            "الإجمالي": Number(inv.total),
            "الحالة": inv.status === 'paid' ? 'مدفوعة' : 'آجلة (دين)'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        if(!ws['!views']) ws['!views'] = [];
        ws['!views'].push({rightToLeft: true});

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "تقرير المبيعات");
        XLSX.writeFile(wb, `مبيعات_MENTRA_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    window.exportToPDF = () => {
        if(state.filteredSales.length === 0) {
            Swal.fire({icon: 'info', title: 'لا يوجد بيانات', text: 'عفواً، لا يوجد فواتير لتصديرها للفترة المحددة', customClass: {popup: 'rounded-3xl'}});
            return;
        }

        let totalAmount = state.filteredSales.reduce((acc, curr) => acc + Number(curr.total), 0);
        let unpaidAmount = state.filteredSales.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total), 0);

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html dir="rtl" lang="ar">
            <head>
                <title>تقرير المبيعات الشامل</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #1e293b; }
                    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
                    .header h2 { margin: 0; color: #2563eb; font-size: 24px;}
                    .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                    th, td { padding: 10px; border: 1px solid #cbd5e1; text-align: right; }
                    th { background-color: #f8fafc; color: #334155; }
                    .summary { display: flex; justify-content: space-between; background: #eff6ff; padding: 15px; border-radius: 8px; font-weight: bold; border: 1px solid #bfdbfe;}
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>سجل المبيعات والعملاء</h2>
                    <p>تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-EG')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>اسم العميل</th>
                            <th>حالة الدفع</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.filteredSales.map(inv => `
                            <tr>
                                <td>${inv.invoice_number}</td>
                                <td>${String(inv.date).substring(0, 10)}</td>
                                <td>${inv.customer_vendor_name || 'نقدي عام'}</td>
                                <td>${inv.status === 'paid' ? 'مدفوعة' : 'آجلة'}</td>
                                <td dir="ltr">${Number(inv.total).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="summary">
                    <span>إجمالي المبيعات: <span style="color:#059669">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                    <span>ديون مستحقة للتحصيل: <span style="color:#e11d48">${unpaidAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                </div>
                <script> window.onload = function() { window.print(); window.close(); } </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- 5. أدوات مساعدة والإحصائيات العلوية ---

    function updateStats(data) {
        const total = data.reduce((s, i) => s + Number(i.total), 0);
        const paid = data.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
        const pending = total - paid;
        
        // حساب نسبة التحصيل للشريط المرئي
        const collectionRate = total > 0 ? (paid / total) * 100 : 0;

        document.getElementById('salesStats').innerHTML = `
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-lg text-white relative overflow-hidden">
                <div class="absolute -left-4 -bottom-4 text-6xl text-white/5"><i class="fas fa-chart-line"></i></div>
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">المبيعات الإجمالية</p>
                <div class="text-2xl md:text-3xl font-black font-mono mb-2">${total.toLocaleString()}</div>
                <p class="text-[10px] font-bold text-slate-400"><i class="fas fa-receipt ml-1"></i> ${data.length} فاتورة مسجلة</p>
            </div>
            
            <div class="bg-white p-5 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm relative">
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">المحصل الكاش</p>
                <p class="text-xl md:text-2xl font-black text-emerald-500 font-mono mb-2">${paid.toLocaleString()}</p>
                <!-- شريط التحصيل -->
                <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${collectionRate}%"></div>
                </div>
            </div>
            
            <div class="bg-white p-5 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm relative">
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">ديون خارجية (آجل)</p>
                <p class="text-xl md:text-2xl font-black text-rose-500 font-mono mb-2">${pending.toLocaleString()}</p>
                <p class="text-[10px] font-bold text-rose-400">مبالغ قيد التحصيل</p>
            </div>
        `;
    }

    window.closeDetailsModal = () => document.getElementById('detailsModal').classList.add('hidden');
    
    window.changePage = (dir) => { 
        state.currentPage += dir; 
        renderSales(state.filteredSales); 
        // تمرير الشاشة للأعلى قليلاً عند التقليب
        document.getElementById('sales-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    function updatePagination(len) {
        document.getElementById('pageNumber').innerText = state.currentPage + 1;
        document.getElementById('prevBtn').disabled = state.currentPage === 0;
        document.getElementById('nextBtn').disabled = (state.currentPage + 1) * state.itemsPerPage >= len;
    }

    // تهيئة تواريخ الشهر الحالي كافتراضي
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('report-start').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('report-end').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // التشغيل الأول
    loadSalesData();
})();
