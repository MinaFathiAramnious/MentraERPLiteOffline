/**
 * MENTRA ERP - Purchases Report Pro (v8.0 Mobile Optimized & Export)
 * الميزات: عرض تفاصيل المشتريات، تعديل ذكي، مزامنة مخزن عكسية، Export (PDF/Excel)
 */

(function() {
    const displayArea = document.getElementById('main-content-display');
    const state = { 
        activeInvId: null, 
        editingItems: [],
        filteredPurchases: [] // لحفظ الداتا المعروضة للتصدير
    };

    const reportHTML = `
    <div class="animate-fade-in space-y-6 md:space-y-8 pb-20 md:pb-16 px-2 md:px-4 text-right" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- الهيدر وفلاتر البحث والتصدير -->
        <div class="bg-white/80 backdrop-blur-2xl p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
            
            <div class="flex items-center gap-4 md:gap-6">
                <div class="w-12 h-12 md:w-16 md:h-16 bg-rose-600 text-white rounded-xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-2xl shadow-lg shrink-0">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div>
                    <h2 class="text-xl md:text-3xl font-black text-slate-900 tracking-tighter italic">سجل المشتريات الذكي</h2>
                    <p class="text-[9px] md:text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1">نظام إدارة الفواتير والموردين</p>
                </div>
            </div>

            <div class="flex flex-col md:flex-row w-full xl:w-auto gap-3">
                <!-- أزرار التصدير -->
                <div class="flex items-center gap-2 w-full md:w-auto">
                    <button onclick="exportPurchasesExcel()" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-3 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs transition-all active:scale-95 border border-emerald-100">
                        <i class="fas fa-file-excel text-sm"></i> <span>إكسيل</span>
                    </button>
                    <button onclick="exportPurchasesPDF()" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-3 py-3 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs transition-all active:scale-95 border border-rose-100">
                        <i class="fas fa-file-pdf text-sm"></i> <span>PDF</span>
                    </button>
                </div>

                <!-- فلاتر التاريخ والبحث -->
                <div class="flex items-center justify-between gap-2 bg-white p-2 md:p-3 rounded-xl md:rounded-[2.5rem] shadow-inner border border-slate-100">
                    <input type="date" id="rep-date-from" class="bg-transparent text-[10px] md:text-xs font-black text-slate-700 outline-none px-2 w-full">
                    <span class="text-slate-200">|</span>
                    <input type="date" id="rep-date-to" class="bg-transparent text-[10px] md:text-xs font-black text-slate-700 outline-none px-2 w-full border-l border-slate-100">
                    
                    <button id="run-report-btn" class="bg-slate-900 hover:bg-rose-600 text-white w-10 h-10 rounded-lg md:rounded-xl transition-all shadow-md active:scale-90 flex items-center justify-center shrink-0 ml-1">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- قائمة الفواتير المعروضة -->
        <div class="bg-white rounded-[2rem] md:rounded-[4rem] p-4 md:p-10 shadow-lg md:shadow-xl border border-slate-50 overflow-hidden min-h-[300px]">
             <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 md:mb-8 md:px-4">
                <h5 class="text-lg md:text-xl font-black text-slate-800 italic"><i class="fas fa-list-alt text-rose-500 ml-2"></i>فواتير المشتريات</h5>
                <div class="relative w-full md:w-64">
                    <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="p-inv-search" placeholder="ابحث برقم الفاتورة..." class="bg-slate-50 w-full px-4 pr-10 py-3 rounded-xl md:rounded-2xl text-[16px] md:text-xs font-bold outline-none border border-slate-100 focus:border-rose-500 transition-all">
                </div>
            </div>
            
            <!-- List Grid (Cards للموبايل, Rows للديسكتوب) -->
            <div id="purchases-report-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"></div>
        </div>
    </div>

    <!-- نافذة المودال للتعديل (Responsive) -->
    <div id="edit-purchase-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] hidden flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-300">
        <div class="bg-white w-full max-w-3xl rounded-t-[2.5rem] md:rounded-[3.5rem] p-5 md:p-10 shadow-2xl animate-slide-up md:animate-pop-in relative overflow-y-auto max-h-[90vh] text-right" dir="rtl">
            
            <div class="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4">
                <div>
                    <h3 class="text-xl md:text-2xl font-black text-slate-900 italic">تفاصيل المشتريات</h3>
                    <p id="modal-inv-no" class="text-xs md:text-sm font-bold text-rose-500 mt-1 font-mono tracking-tighter"></p>
                </div>
                <button onclick="closeEditModal()" class="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><i class="fas fa-times text-lg"></i></button>
            </div>

            <div class="space-y-6">
                
                <!-- قائمة الأصناف (List layout for Mobile) -->
                <div class="bg-slate-50 rounded-2xl md:rounded-3xl p-2 md:p-4 border border-slate-100 max-h-[40vh] overflow-y-auto hide-scrollbar">
                    <div id="modal-items-body" class="space-y-2"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div class="bg-white border border-slate-100 p-4 md:p-6 rounded-2xl md:rounded-3xl flex justify-between items-center">
                         <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase">حالة الدفع:</span>
                         <select id="modal-inv-status" class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-[16px] md:text-sm text-slate-700 shadow-sm outline-none focus:border-rose-500">
                            <option value="paid">تم السداد ✅</option>
                            <option value="pending">متبقي آجل ⏳</option>
                         </select>
                    </div>
                    <div class="bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-3xl flex justify-between items-center shadow-lg shadow-slate-900/20">
                        <span class="text-[10px] font-black text-slate-500 uppercase">الإجمالي النهائي</span>
                        <h2 id="modal-inv-total" class="text-2xl md:text-4xl font-black text-white font-mono">0.00</h2>
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="saveSmartPurchaseEdit()" class="flex-[2] bg-emerald-500 text-white p-4 md:p-5 rounded-xl md:rounded-[2rem] font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <i class="fas fa-save"></i> <span class="hidden md:inline">حفظ وتحديث المخزن</span> <span class="md:hidden">حفظ التعديل</span>
                    </button>
                    <button onclick="confirmDeletePurchase()" class="flex-1 bg-rose-50 text-rose-600 p-4 md:p-5 rounded-xl md:rounded-[2rem] font-black hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center">
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

    displayArea.innerHTML = reportHTML;

    // --- وظائف الجلب والعرض ---
    async function loadPurchases() {
        const from = document.getElementById('rep-date-from').value;
        const to = document.getElementById('rep-date-to').value;
        const search = document.getElementById('p-inv-search').value.toLowerCase().trim();

        const data = await db.invoices.where('type').equalsIgnoreCase('PURCHASE').reverse().toArray();
        const filtered = data.filter(inv => {
            const d = inv.date.substring(0, 10);
            const dateMatch = (d >= from && d <= to);
            const searchMatch = inv.invoice_number.toLowerCase().includes(search);
            return dateMatch && searchMatch;
        });

        state.filteredPurchases = filtered; // حفظها للـ Export

        const listContainer = document.getElementById('purchases-report-list');
        
        if (filtered.length === 0) {
            listContainer.className = "w-full";
            listContainer.innerHTML = `<div class="text-center py-20 opacity-50"><i class="fas fa-folder-open text-5xl text-slate-300 mb-3 block"></i><span class="font-bold text-slate-500">لا توجد فواتير مشتريات بهذه المواصفات</span></div>`;
            return;
        }

        listContainer.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4";
        listContainer.innerHTML = filtered.map(inv => `
            <div class="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer group active:scale-95" onclick="openPurchaseDetails(${inv.id})">
                <div class="flex justify-between items-center mb-3 border-b border-slate-50 pb-3">
                    <span class="font-black text-slate-700 font-mono tracking-tighter text-sm">${inv.invoice_number}</span>
                    <span class="px-2.5 py-1 rounded-md text-[9px] font-black ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
                        ${inv.status === 'paid' ? 'مدفوعة' : 'آجلة'}
                    </span>
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-[10px] font-bold text-slate-400 mb-0.5"><i class="far fa-calendar-alt text-rose-300 ml-1"></i>${inv.date.substring(0, 10)}</p>
                        <p class="text-lg md:text-xl font-black text-slate-900 font-sans">${parseFloat(inv.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="w-8 h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center transition-colors group-hover:bg-rose-50 group-hover:text-rose-500">
                        <i class="fas fa-pen text-xs"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

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
            <div class="bg-white border border-slate-100 p-3 rounded-xl flex justify-between items-center shadow-sm mb-2">
                <div class="flex-1">
                    <p class="font-black text-xs text-slate-700 line-clamp-1">${item.product_name || 'صنف مجهول'}</p>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">تكلفة: ${item.price}</p>
                </div>
                <div class="flex items-center gap-3">
                    <input type="number" value="${item.qty}" onchange="updatePurchaseQty(${idx}, this.value)" 
                           class="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-[16px] text-rose-600 focus:border-rose-500 outline-none transition-all">
                    <p class="font-black text-sm text-slate-900 font-mono w-16 text-left">${(item.qty * item.price).toLocaleString()}</p>
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
                    const diff = item.qty - original.qty; // الفرق بالكمية
                    
                    const prod = await db.products.get(item.product_id);
                    if (prod) {
                        // في المشتريات: زيادة الكمية المشراة تعني زيادة إضافية في المخزن
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
            loadPurchases();
        } catch (e) { Swal.fire({icon: 'error', title: 'خطأ', text: e.message}); }
    };

    window.confirmDeletePurchase = async () => {
        const res = await Swal.fire({
            title: 'حذف فاتورة الشراء؟',
            text: "سيتم حذف الفاتورة وخصم الكميات من المخزن. هل أنت متأكد؟",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'تراجع',
            confirmButtonText: 'نعم، احذف',
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
                        // حذف الشراء: يعني خصم الكمية التي دخلت المخزن بالخطأ
                        await db.products.update(prod.id, { stock_qty: Math.max(0, prod.stock_qty - item.qty) });
                    }
                }
                
                await db.invoice_items.where('invoice_id').equals(state.activeInvId).delete();
                // حذف حركات المخزن المرتبطة برقم الفاتورة (إن وجدت)
                await db.stock_movements.where('ref_id').equals(inv.invoice_number).delete();
                await db.invoices.delete(state.activeInvId);
            });
            
            Swal.fire({icon: 'success', title: 'تم الحذف', text: 'تم حذف الفاتورة وتعديل رصيد المخزن', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});
            closeEditModal();
            loadPurchases();
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
                    .header p { margin: 5px 0 0 0; color: #64748b; font-size: 12px; }
                    table { w-full: 100%; width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                    th, td { padding: 10px; border: 1px solid #cbd5e1; text-align: right; }
                    th { background-color: #f1f5f9; color: #334155; }
                    .summary { display: flex; justify-content: space-between; background: #fff1f2; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 14px; border: 1px solid #ffe4e6;}
                    .text-rose { color: #e11d48; }
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
                    <span>إجمالي المصروفات: <span class="text-rose">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                    <span>المديونيات الآجلة: <span style="color:#b91c1c">${unpaidAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- الإعدادات الأولية ---
    const d = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    document.getElementById('rep-date-from').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    document.getElementById('rep-date-to').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    document.getElementById('run-report-btn').onclick = loadPurchases;
    document.getElementById('p-inv-search').oninput = loadPurchases;

    loadPurchases();
})();