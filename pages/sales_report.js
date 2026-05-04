/**
 * MENTRA ERP - Smart Sales & Inventory Master (v8.0 Mobile + Export)
 * مدمج بالكامل: مبيعات، مزامنة مخزن، تعديل ذكي، تصدير PDF & Excel
 */

(function() {
    const displayArea = document.getElementById('main-content-display');
    const state = {
        allSales: [],
        filteredSales: [], // نحتفظ بالبيانات المفلترة للتصدير
        itemsPerPage: 10,  // زيادة العدد لتقليل التقليب
        currentPage: 0
    };

    let activeInvoiceId = null;
    let editingItems = [];

    // --- 1. بناء هيكل الصفحة (UI) ---
    displayArea.innerHTML = `
    <div class="animate-fade-in pb-24 text-right" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الكروت الإحصائية -->
        <div id="salesStats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8"></div>

        <!-- شريط الأدوات (بحث، فلاتر، تصدير) -->
        <div class="bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center mb-6 md:mb-8">
            
            <!-- أزرار التصدير -->
            <div class="flex items-center gap-2 w-full xl:w-auto order-2 xl:order-1">
                <button onclick="exportToExcel()" class="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-3 md:py-4 rounded-xl font-black text-xs md:text-sm transition-all active:scale-95 border border-emerald-100">
                    <i class="fas fa-file-excel text-lg"></i> <span>إكسيل</span>
                </button>
                <button onclick="exportToPDF()" class="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-3 md:py-4 rounded-xl font-black text-xs md:text-sm transition-all active:scale-95 border border-rose-100">
                    <i class="fas fa-file-pdf text-lg"></i> <span>PDF</span>
                </button>
            </div>

            <!-- الفلاتر والبحث -->
            <div class="flex flex-col md:flex-row w-full xl:w-auto gap-3 order-1 xl:order-2">
                <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <input type="date" id="report-start" class="bg-transparent text-xs font-black outline-none p-2 text-slate-600 w-full">
                    <span class="text-slate-300 font-black">-</span>
                    <input type="date" id="report-end" class="bg-transparent text-xs font-black outline-none p-2 text-slate-600 w-full">
                    <button onclick="applyFilters()" class="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-sm shrink-0">
                        <i class="fas fa-filter"></i>
                    </button>
                </div>
                
                <div class="relative w-full md:w-64">
                    <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="searchInvoice" onkeyup="handleSearch(this.value)" 
                           placeholder="رقم الفاتورة أو العميل..." 
                           class="w-full bg-white p-3.5 pr-12 rounded-2xl outline-none border border-slate-200 focus:border-blue-500 font-bold text-[16px] text-slate-700 transition-all shadow-sm">
                </div>
            </div>
        </div>

        <!-- قائمة الفواتير -->
        <div id="sales-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"></div>

        <!-- الترقيم (Pagination) -->
        <div class="flex justify-center items-center gap-4 mt-8">
            <button onclick="changePage(-1)" id="prevBtn" class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-right text-slate-600"></i></button>
            <span id="pageNumber" class="font-black text-slate-600 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">1</span>
            <button onclick="changePage(1)" id="nextBtn" class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"><i class="fas fa-chevron-left text-slate-600"></i></button>
        </div>
    </div>

    <!-- المودال الذكي للموبايل (Details Modal) -->
    <div id="detailsModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity">
        <!-- في الموبايل تظهر من الأسفل كدرج، في الديسكتوب في المنتصف -->
        <div class="bg-white w-full max-w-3xl rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up md:animate-pop-in relative text-right" dir="rtl">
            
            <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900">فاتورة <span id="view-inv-no" class="text-blue-600"></span></h3>
                    <p id="view-inv-date" class="text-[10px] md:text-xs font-bold text-slate-400 mt-1"></p>
                </div>
                <button onclick="closeDetailsModal()" class="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><i class="fas fa-times text-lg"></i></button>
            </div>
            
            <div class="space-y-6">
                <!-- قائمة الأصناف (بدون جدول لتناسب الموبايل) -->
                <div class="bg-slate-50 rounded-3xl p-2 md:p-4 max-h-[40vh] overflow-y-auto hide-scrollbar">
                    <div id="invoice-items-list" class="space-y-2"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-100 p-5 rounded-3xl flex justify-between items-center">
                        <span class="text-xs font-black text-slate-500">التحصيل:</span>
                        <select id="view-inv-status" class="bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold text-[16px] text-slate-700 outline-none focus:border-blue-500">
                            <option value="paid">مدفوعة ✅</option>
                            <option value="pending">آجلة (دين) ⏳</option>
                        </select>
                    </div>
                    <div class="bg-slate-900 p-5 rounded-3xl flex justify-between items-center shadow-lg shadow-slate-900/20">
                        <span class="text-[10px] font-black text-slate-400 uppercase">الصافي</span>
                        <h2 id="view-inv-total" class="text-2xl font-black text-emerald-400 font-sans">0.00</h2>
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="saveSmartEdit()" class="flex-[2] bg-emerald-500 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 flex justify-center items-center gap-2">
                        <i class="fas fa-save"></i> حفظ التعديل
                    </button>
                    <button onclick="deleteInvoice()" class="flex-1 bg-rose-50 text-rose-600 p-4 rounded-2xl font-black hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex justify-center items-center">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    </style>
    `;

    // --- 2. وظائف جلب وعرض البيانات ---

    window.loadSalesData = async () => {
        const data = await db.invoices.where('type').equalsIgnoreCase('sale').reverse().toArray();
        state.allSales = data;
        state.filteredSales = data;
        renderSales(state.filteredSales);
    };

    window.applyFilters = () => {
        const start = document.getElementById('report-start').value;
        const end = document.getElementById('report-end').value;
        let filtered = state.allSales;
        if (start && end) {
            filtered = filtered.filter(inv => {
                const invDate = inv.date.substring(0, 10);
                return invDate >= start && invDate <= end;
            });
        }
        state.filteredSales = filtered;
        state.currentPage = 0;
        renderSales(filtered);
    };

    window.handleSearch = (val) => {
        const term = val.toLowerCase();
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
            container.innerHTML = `<div class="col-span-full text-center py-20 text-slate-400"><i class="fas fa-folder-open text-5xl mb-4 opacity-50"></i><p class="font-bold">لا توجد فواتير مطابقة</p></div>`;
            updateStats(data);
            return;
        }

        container.innerHTML = paged.map(inv => `
            <div class="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 active:scale-95 hover:-translate-y-1 transition-all cursor-pointer group" onclick="openDetails(${inv.id})">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-xs font-black text-slate-400 font-mono tracking-tighter">#${inv.invoice_number}</span>
                    <span class="px-3 py-1 rounded-lg text-[9px] font-black ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                        ${inv.status === 'paid' ? '<i class="fas fa-check mr-1"></i> مدفوع' : '<i class="fas fa-clock mr-1"></i> آجل'}
                    </span>
                </div>
                <div class="mb-4">
                    <p class="text-[10px] font-bold text-slate-400 mb-0.5"><i class="fas fa-user text-blue-300 ml-1"></i>العميل</p>
                    <p class="font-black text-slate-700 text-sm truncate">${inv.customer_vendor_name || 'عميل نقدي'}</p>
                </div>
                <div class="flex justify-between items-end pt-4 border-t border-slate-50">
                    <div>
                        <p class="text-[9px] font-bold text-slate-400 mb-0.5">${String(inv.date).substring(0, 10)}</p>
                        <p class="text-lg font-black text-slate-900 font-sans">${Number(inv.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="w-8 h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center transition-all group-hover:bg-blue-50 group-hover:text-blue-600">
                        <i class="fas fa-angle-left"></i>
                    </div>
                </div>
            </div>
        `).join('');

        updateStats(data);
        updatePagination(data.length);
    };

    // --- 3. وظائف التعديل الذكي (Smart Edit) ---

    window.openDetails = async (id) => {
        activeInvoiceId = id;
        const inv = await db.invoices.get(id);
        let items = await db.invoice_items.where('invoice_id').equals(id).toArray();

        for (let item of items) {
            if (!item.product_name) {
                const p = await db.products.get(item.product_id);
                item.product_name = p ? p.name_ar : "صنف مجهول";
            }
        }

        editingItems = JSON.parse(JSON.stringify(items));
        document.getElementById('view-inv-no').innerText = inv.invoice_number;
        document.getElementById('view-inv-date').innerText = `تاريخ: ${String(inv.date).substring(0, 16).replace('T', ' ')}`;
        document.getElementById('view-inv-total').innerText = Number(inv.total).toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('view-inv-status').value = inv.status;

        renderModalItems();
        
        const modal = document.getElementById('detailsModal');
        modal.classList.remove('hidden');
        // تأخير بسيط لتفعيل الأنيميشن
        setTimeout(() => modal.firstElementChild.classList.remove('translate-y-full'), 10);
    };

    window.renderModalItems = () => {
        // تصميم كروت مصغرة للموبايل بدلاً من الجدول
        document.getElementById('invoice-items-list').innerHTML = editingItems.map((item, idx) => `
            <div class="bg-white border border-slate-100 p-3 rounded-2xl flex justify-between items-center shadow-sm">
                <div class="flex-1">
                    <p class="font-black text-xs text-slate-700 line-clamp-1">${item.product_name}</p>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">${Number(item.price).toLocaleString()} للوحدة</p>
                </div>
                <div class="flex items-center gap-3">
                    <input type="number" onchange="updateRow(${idx}, this.value)" value="${item.qty}" 
                           class="w-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-[16px] text-blue-600 outline-none focus:border-blue-500 transition-all">
                    <p class="font-black text-sm text-slate-900 font-sans w-16 text-left">${(item.qty * item.price).toLocaleString()}</p>
                </div>
            </div>
        `).join('');
    };

    window.updateRow = (idx, newQty) => {
        editingItems[idx].qty = parseFloat(newQty) || 0;
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
                    Swal.fire({icon: 'error', title: 'رصيد غير كافٍ', text: `الكمية المتاحة من ${item.product_name} هي ${prod.stock_qty} فقط`, confirmButtonText: 'حسناً', customClass: {popup: 'rounded-3xl'}});
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
            title: 'حذف الفاتورة؟',
            text: "سيتم حذف الفاتورة وإعادة الكميات للمخزن تلقائياً.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'تراجع',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
        });

        if (!res.isConfirmed) return;

        try {
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products], async () => {
                const items = await db.invoice_items.where('invoice_id').equals(activeInvoiceId).toArray();
                for (const item of items) {
                    const p = await db.products.get(item.product_id);
                    if (p) await db.products.update(p.id, { stock_qty: Number(p.stock_qty) + Number(item.qty) });
                }
                await db.invoice_items.where('invoice_id').equals(activeInvoiceId).delete();
                await db.invoices.delete(activeInvoiceId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الحذف', text: 'تم استرجاع الكميات للمخزن بنجاح', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeDetailsModal();
            loadSalesData();
        } catch (e) { 
            Swal.fire({icon: 'error', title: 'خطأ', text: e.message});
        }
    };

    // --- 4. التصدير (PDF & EXCEL) ---

    window.exportToExcel = () => {
        if(state.filteredSales.length === 0) {
            Swal.fire({icon: 'info', title: 'لا يوجد بيانات', text: 'لا يوجد فواتير لتصديرها', confirmButtonText: 'حسناً', customClass: {popup: 'rounded-3xl'}});
            return;
        }

        // تنسيق البيانات للإكسيل
        const excelData = state.filteredSales.map(inv => ({
            "رقم الفاتورة": inv.invoice_number,
            "التاريخ": String(inv.date).substring(0, 16).replace('T', ' '),
            "العميل": inv.customer_vendor_name || 'نقدي',
            "طريقة الدفع": inv.method === 'CASH' ? 'كاش' : 'شبكة',
            "الإجمالي": Number(inv.total),
            "الحالة": inv.status === 'paid' ? 'مدفوعة' : 'آجلة'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        // تنسيق اتجاه الشيت من اليمين لليسار
        if(!ws['!views']) ws['!views'] = [];
        ws['!views'].push({rightToLeft: true});

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
        XLSX.writeFile(wb, `تقرير_المبيعات_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    window.exportToPDF = () => {
        if(state.filteredSales.length === 0) {
            Swal.fire({icon: 'info', title: 'لا يوجد بيانات لتصديرها', customClass: {popup: 'rounded-3xl'}});
            return;
        }

        let totalAmount = state.filteredSales.reduce((acc, curr) => acc + Number(curr.total), 0);

        // إنشاء هيكل HTML قابل للطباعة
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html dir="rtl" lang="ar">
            <head>
                <title>تقرير المبيعات</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h2 { margin: 0; color: #1e293b; }
                    .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
                    table { w-full: 100%; width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
                    th, td { padding: 12px; border: 1px solid #e2e8f0; text-align: right; }
                    th { background-color: #f8fafc; color: #475569; font-weight: bold; }
                    .totals { text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 18px;}
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>تقرير المبيعات الشامل</h2>
                    <p>تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-EG')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>العميل</th>
                            <th>الحالة</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.filteredSales.map(inv => `
                            <tr>
                                <td>${inv.invoice_number}</td>
                                <td>${String(inv.date).substring(0, 10)}</td>
                                <td>${inv.customer_vendor_name || 'نقدي'}</td>
                                <td>${inv.status === 'paid' ? 'مدفوعة' : 'آجلة'}</td>
                                <td>${Number(inv.total).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="totals">
                    إجمالي المبيعات المعروضة: <span style="color:#059669">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- 5. أدوات مساعدة (Helpers) ---

    function updateStats(data) {
        const total = data.reduce((s, i) => s + Number(i.total), 0);
        const paid = data.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
        document.getElementById('salesStats').innerHTML = `
            <div class="bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-slate-50 shadow-sm text-center">
                <p class="text-[9px] md:text-[10px] font-black text-slate-400 mb-1">المبيعات الإجمالية</p>
                <p class="text-xl md:text-2xl font-black text-blue-600 font-sans">${total.toLocaleString()}</p>
            </div>
            <div class="bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-slate-50 shadow-sm text-center">
                <p class="text-[9px] md:text-[10px] font-black text-slate-400 mb-1">المحصل الكاش</p>
                <p class="text-xl md:text-2xl font-black text-emerald-500 font-sans">${paid.toLocaleString()}</p>
            </div>
            <div class="bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-slate-50 shadow-sm text-center">
                <p class="text-[9px] md:text-[10px] font-black text-slate-400 mb-1">الديون الخارجية</p>
                <p class="text-xl md:text-2xl font-black text-rose-500 font-sans">${(total-paid).toLocaleString()}</p>
            </div>
            <div class="bg-slate-900 p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-lg shadow-slate-900/20 text-center">
                <p class="text-[9px] md:text-[10px] font-black text-slate-400 mb-1">عدد الفواتير</p>
                <p class="text-xl md:text-2xl font-black text-white font-sans">${data.length}</p>
            </div>
        `;
    }

    window.closeDetailsModal = () => document.getElementById('detailsModal').classList.add('hidden');
    window.changePage = (dir) => { state.currentPage += dir; renderSales(state.filteredSales); };
    function updatePagination(len) {
        document.getElementById('pageNumber').innerText = state.currentPage + 1;
        document.getElementById('prevBtn').disabled = state.currentPage === 0;
        document.getElementById('nextBtn').disabled = (state.currentPage + 1) * state.itemsPerPage >= len;
    }

    // تهيئة التواريخ الافتراضية لأول الشهر
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('report-start').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('report-end').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    loadSalesData();
})();