(function() {
    const displayArea = document.getElementById('main-content-display');
    let itemsToShow = 10; // زيادة العدد الافتراضي لتقليل النقرات
    let currentFilter = 'all'; // (all, low, out)
    let currentEditingId = null;

    // 1. بناء هيكل الصفحة الرئيسي (محسن للموبايل)
    displayArea.innerHTML = `
    <div class="p-2 md:p-6 space-y-4 md:space-y-6 animate-fade-in pb-28 text-right w-full" dir="rtl">
        
        <!-- الهيدر وأزرار التصدير والإضافة -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 md:p-4 rounded-[2rem] border border-slate-100 shadow-sm">
            <h2 class="text-xl md:text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2 pr-2">
                <i class="fas fa-boxes-stacked text-blue-500"></i> إدارة المخزن
            </h2>
            
            <div class="flex w-full sm:w-auto gap-2">
                <button onclick="exportExcel()" class="flex-1 sm:flex-none bg-emerald-50 text-emerald-600 px-3 md:px-4 py-3 rounded-2xl font-black text-xs md:text-sm hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 flex items-center justify-center gap-2 active:scale-95">
                    <i class="fas fa-file-excel"></i> <span class="hidden sm:inline">إكسيل</span>
                </button>
                <button onclick="printPDF()" class="flex-1 sm:flex-none bg-rose-50 text-rose-600 px-3 md:px-4 py-3 rounded-2xl font-black text-xs md:text-sm hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center gap-2 active:scale-95">
                    <i class="fas fa-file-pdf"></i> <span class="hidden sm:inline">PDF</span>
                </button>
                <button onclick="openProductModal()" class="flex-[2] sm:flex-none bg-blue-600 text-white px-4 md:px-5 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-xs md:text-sm flex items-center justify-center gap-2 active:scale-95">
                    <i class="fas fa-plus"></i> صنف جديد
                </button>
            </div>
        </div>

        <!-- الإحصائيات (تتحول لعمودين في الموبايل) -->
        <div id="inventoryStats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-2"></div>

        <!-- أزرار الفلترة (قابلة للسحب أفقياً في الموبايل) -->
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide font-black text-xs md:text-sm">
            <button onclick="changeFilter('all')" id="filter-all" class="filter-btn shrink-0 px-5 md:px-6 py-2.5 rounded-xl border-2 transition-all bg-slate-900 text-white border-slate-900 active:scale-95">الكل</button>
            <button onclick="changeFilter('low')" id="filter-low" class="filter-btn shrink-0 px-5 md:px-6 py-2.5 rounded-xl border-2 transition-all bg-white text-orange-600 border-orange-100 hover:bg-orange-50 active:scale-95">قربت تخلص ⚠️</button>
            <button onclick="changeFilter('out')" id="filter-out" class="filter-btn shrink-0 px-5 md:px-6 py-2.5 rounded-xl border-2 transition-all bg-white text-rose-600 border-rose-100 hover:bg-rose-50 active:scale-95">نفدت 🚫</button>
        </div>

        <!-- البحث -->
        <div class="bg-white p-2 md:p-3 rounded-3xl shadow-sm border border-slate-100 relative">
            <i class="fas fa-search absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input type="text" id="productSearch" oninput="resetPaginationAndRender()" 
                   placeholder="ابحث بالاسم، الباركود، أو التصنيف..." 
                   class="w-full bg-slate-50 py-3 md:py-4 pr-12 pl-4 rounded-2xl outline-none font-bold text-sm md:text-base border-2 border-transparent focus:border-blue-500 transition-all text-[16px]">
        </div>

        <!-- قائمة المنتجات -->
        <div id="productsList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"></div>

        <!-- زر تحميل المزيد -->
        <div id="loadMoreContainer" class="flex justify-center mt-6 hidden">
            <button onclick="loadMore()" class="w-full md:w-auto bg-white border-2 border-slate-100 text-slate-600 px-8 py-3.5 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
                عرض المزيد 👇
            </button>
        </div>
    </div>

    <!-- نافذة إضافة/تعديل صنف (محسنة للموبايل) -->
    <div id="productModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-2 md:p-4 transition-opacity">
        <div class="bg-white w-full max-w-lg rounded-t-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up md:animate-zoom-in">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden"></div> <!-- مؤشر سحب للموبايل -->
            
            <h3 id="modalTitle" class="text-xl md:text-2xl font-black mb-5 text-slate-800 text-right pr-2">إضافة صنف</h3>
            
            <form id="productForm" class="space-y-4 text-right pb-safe">
                <div>
                    <label class="text-[11px] font-black pr-2 mb-1 block text-slate-500">اسم المنتج <span class="text-rose-500">*</span></label>
                    <!-- استخدام text-[16px] يمنع المتصفح في الآيفون/أندرويد من عمل زووم إجباري -->
                    <input type="text" id="p_name" placeholder="مثلاً: زيت زيتون 1 لتر" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-[16px]" required>
                </div>
                <div class="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <label class="text-[11px] font-black pr-2 mb-1 block text-slate-500">الباركود (SKU)</label>
                        <input type="text" id="p_sku" placeholder="00000" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-[16px]">
                    </div>
                    <div>
                        <label class="text-[11px] font-black pr-2 mb-1 block text-slate-500">التصنيف</label>
                        <input type="text" id="p_category" placeholder="عام" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-[16px]">
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 md:gap-4 text-center">
                    <div>
                        <label class="text-[10px] md:text-[11px] font-black block mb-1 text-slate-500">سعر التكلفة</label>
                        <input type="number" id="p_cost" step="0.01" inputmode="decimal" class="w-full bg-emerald-50/50 p-3 rounded-xl font-black text-emerald-700 text-center outline-none border-2 border-transparent focus:border-emerald-400 text-[16px]" required>
                    </div>
                    <div>
                        <label class="text-[10px] md:text-[11px] font-black block mb-1 text-slate-500">سعر البيع</label>
                        <input type="number" id="p_price" step="0.01" inputmode="decimal" class="w-full bg-blue-50/50 p-3 rounded-xl font-black text-blue-700 text-center outline-none border-2 border-transparent focus:border-blue-400 text-[16px]" required>
                    </div>
                    <div>
                        <label class="text-[10px] md:text-[11px] font-black block mb-1 text-slate-500">الكمية الحالية</label>
                        <input type="number" id="p_qty" inputmode="numeric" class="w-full bg-slate-50 p-3 rounded-xl font-black text-slate-700 text-center outline-none border-2 border-transparent focus:border-slate-400 text-[16px]" required>
                    </div>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm">حفظ البيانات</button>
                    <button type="button" onclick="closeProductModal()" class="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all text-sm">إلغاء</button>
                </div>
            </form>
        </div>
    </div>`;

    // ستايل مخفي لدعم الإنميشن وشريط التمرير
    const style = document.createElement('style');
    style.innerHTML = `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
    `;
    document.head.appendChild(style);

    // 2. تحديث الإحصائيات
    const updateStats = async () => {
        const all = await db.products.toArray();
        const totalValue = all.reduce((sum, p) => sum + (p.stock_qty * p.cost), 0);
        const lowCount = all.filter(p => p.stock_qty > 0 && p.stock_qty <= 5).length;
        const outCount = all.filter(p => p.stock_qty <= 0).length;

        document.getElementById('inventoryStats').innerHTML = `
            <div class="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">قيمة المخزن</p>
                <p class="text-base md:text-xl font-black text-emerald-600 truncate">${totalValue.toLocaleString()} <span class="text-[9px]">ج.م</span></p>
            </div>
            <div class="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي الأصناف</p>
                <p class="text-base md:text-xl font-black text-slate-800">${all.length}</p>
            </div>
            <div class="bg-orange-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] md:text-[10px] font-black text-orange-400 uppercase mb-1">نواقص (قريباً)</p>
                <p class="text-base md:text-xl font-black text-orange-600">${lowCount}</p>
            </div>
            <div class="bg-rose-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] md:text-[10px] font-black text-rose-400 uppercase mb-1">أصناف نفدت</p>
                <p class="text-base md:text-xl font-black text-rose-600">${outCount}</p>
            </div>
        `;
    };

    // 3. عرض المنتجات
    window.renderProducts = async () => {
        const query = document.getElementById('productSearch').value.toLowerCase();
        const container = document.getElementById('productsList');
        let products = await db.products.reverse().toArray();

        if (currentFilter === 'low') products = products.filter(p => p.stock_qty > 0 && p.stock_qty <= 5);
        if (currentFilter === 'out') products = products.filter(p => p.stock_qty <= 0);

        if (query) {
            products = products.filter(p => 
                p.name_ar.toLowerCase().includes(query) || 
                (p.sku && p.sku.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        const visible = products.slice(0, itemsToShow);
        
        if (visible.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-16 flex flex-col items-center justify-center">
                    <i class="fas fa-box-open text-4xl text-slate-200 mb-3"></i>
                    <div class="text-slate-400 font-black text-sm">لا توجد أصناف مطابقة</div>
                </div>`;
            document.getElementById('loadMoreContainer').classList.add('hidden');
            return;
        }

        container.innerHTML = visible.map(p => `
            <div class="bg-white p-4 md:p-5 rounded-3xl md:rounded-[2.5rem] shadow-sm border ${p.stock_qty <= 0 ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'} relative transition-all">
                <div class="flex justify-between items-start mb-3">
                    <span class="bg-slate-100 text-slate-500 text-[9px] md:text-[10px] px-2 py-1 rounded-lg font-black tracking-widest font-mono">#${p.id}</span>
                    <div class="flex gap-1.5 md:gap-2">
                        <button onclick="openProductModal(${p.id})" class="text-blue-500 p-2 md:p-2.5 bg-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-90"><i class="fas fa-pen text-xs"></i></button>
                        <button onclick="deleteProduct(${p.id})" class="text-rose-500 p-2 md:p-2.5 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </div>
                
                <h4 class="font-black text-slate-800 text-base md:text-lg leading-tight mb-1 pl-8">${p.name_ar}</h4>
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">${p.sku || 'بدون باركود'}</span>
                    ${p.category ? `<span class="text-[10px] font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded-md">${p.category}</span>` : ''}
                </div>
                
                <div class="flex justify-between items-end bg-slate-50 p-3 md:p-4 rounded-2xl border border-slate-100">
                    <div>
                        <p class="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-tighter">المتاح</p>
                        <p class="text-lg md:text-xl font-black ${p.stock_qty <= 0 ? 'text-rose-600' : p.stock_qty <= 5 ? 'text-orange-600' : 'text-slate-800'}">
                            ${p.stock_qty} <span class="text-[9px] md:text-[10px]">قطعة</span>
                        </p>
                    </div>
                    <div class="text-left">
                        <p class="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-tighter text-left">السعر</p>
                        <p class="text-lg md:text-xl font-black text-blue-600">${p.price} <span class="text-[9px] md:text-[10px]">ج.م</span></p>
                    </div>
                </div>

                <!-- زر الإضافة السريعة (يظهر في الزاوية) -->
                <button onclick="quickAdd(${p.id}, '${p.name_ar}')" class="absolute -bottom-3 -right-3 bg-slate-800 text-white w-10 h-10 md:w-12 md:h-12 rounded-[1.2rem] shadow-lg shadow-slate-300 flex items-center justify-center hover:bg-black hover:scale-105 active:scale-90 transition-all border-4 border-white">
                    <i class="fas fa-plus text-sm"></i>
                </button>
            </div>
        `).join('');

        document.getElementById('loadMoreContainer').classList.toggle('hidden', products.length <= itemsToShow);
        updateStats();
    };

    // 4. أدوات التحكم
    window.changeFilter = (f) => {
        currentFilter = f;
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
            b.classList.add('bg-white');
        });
        
        const activeBtn = document.getElementById(`filter-${f}`);
        activeBtn.classList.remove('bg-white', 'text-orange-600', 'text-rose-600', 'border-orange-100', 'border-rose-100');
        activeBtn.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
        
        itemsToShow = 10;
        renderProducts();
    };

    window.openProductModal = (id = null) => {
        currentEditingId = id;
        const form = document.getElementById('productForm');
        
        if(id) {
            document.getElementById('modalTitle').innerText = "تعديل صنف";
            db.products.get(id).then(p => {
                document.getElementById('p_name').value = p.name_ar;
                document.getElementById('p_sku').value = p.sku;
                document.getElementById('p_category').value = p.category;
                document.getElementById('p_cost').value = p.cost;
                document.getElementById('p_price').value = p.price;
                document.getElementById('p_qty').value = p.stock_qty;
            });
        } else {
            document.getElementById('modalTitle').innerText = "إضافة صنف جديد";
            form.reset();
        }
        
        const modal = document.getElementById('productModal');
        modal.classList.remove('hidden');
    };

    window.closeProductModal = () => document.getElementById('productModal').classList.add('hidden');

    document.getElementById('productForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name_ar: document.getElementById('p_name').value,
            sku: document.getElementById('p_sku').value,
            category: document.getElementById('p_category').value,
            stock_qty: parseFloat(document.getElementById('p_qty').value) || 0,
            price: parseFloat(document.getElementById('p_price').value) || 0,
            cost: parseFloat(document.getElementById('p_cost').value) || 0,
        };
        
        if(currentEditingId) {
            await db.products.update(currentEditingId, data);
            Swal.fire({ icon: 'success', title: 'تم التعديل', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        } else {
            await db.products.add(data);
            Swal.fire({ icon: 'success', title: 'تمت الإضافة', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
        
        closeProductModal();
        renderProducts();
    };

    window.deleteProduct = async (id) => {
        const res = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن الحذف!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl' }
        });

        if (res.isConfirmed) {
            await db.products.delete(id);
            renderProducts();
            Swal.fire({ icon: 'success', title: 'تم الحذف', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
    };

    window.quickAdd = async (id, name) => {
        const { value: qty } = await Swal.fire({
            title: 'إضافة رصيد للمخزن',
            text: name,
            input: 'number',
            inputAttributes: { min: 1, step: 1 },
            showCancelButton: true,
            confirmButtonText: 'إضافة',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#3b82f6',
            customClass: { popup: 'rounded-3xl', input: 'rounded-xl text-center font-bold text-xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl' }
        });

        if (qty && !isNaN(qty) && qty > 0) {
            const p = await db.products.get(id);
            await db.products.update(id, { stock_qty: p.stock_qty + parseFloat(qty) });
            // تسجيل حركة المخزن إن كان هناك جدول لها
            if(db.stock_movements) {
                await db.stock_movements.add({ product_id: id, type: 'in', qty: parseFloat(qty), date: new Date().toISOString(), ref_id: 'إضافة سريعة' });
            }
            renderProducts();
            Swal.fire({ icon: 'success', title: 'تم تحديث الرصيد', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
    };

    window.loadMore = () => { itemsToShow += 10; renderProducts(); };
    window.resetPaginationAndRender = () => { itemsToShow = 10; renderProducts(); };

    // 5. وظائف التصدير (Excel & PDF)
    
    // استخراج إكسيل باستخدام مكتبة XLSX الموجودة في الواجهة
    window.exportExcel = async () => {
        try {
            const products = await db.products.toArray();
            if(products.length === 0) return Swal.fire('تنبيه', 'لا يوجد بيانات لتصديرها', 'info');

            const data = products.map(p => ({
                'الرقم التسلسلي': p.id,
                'اسم الصنف': p.name_ar,
                'الباركود': p.sku || 'بدون',
                'التصنيف': p.category || 'عام',
                'سعر التكلفة (ج.م)': p.cost,
                'سعر البيع (ج.م)': p.price,
                'الكمية المتاحة': p.stock_qty,
                'إجمالي التكلفة': (p.cost * p.stock_qty).toFixed(2)
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            
            // تنسيق اتجاه الشيت لليمين (RTL)
            if(!ws['!views']) ws['!views'] = [];
            ws['!views'].push({ rightToLeft: true });

            XLSX.utils.book_append_sheet(wb, ws, "جرد المخزن");
            
            const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            XLSX.writeFile(wb, `Inventory_Report_${date}.xlsx`);
        } catch (e) {
            Swal.fire('خطأ', 'حدث خطأ أثناء استخراج الملف', 'error');
        }
    };

    // طباعة / استخراج PDF (بطريقة تدعم اللغة العربية 100% عبر نافذة الطباعة الافتراضية)
    window.printPDF = async () => {
        const products = await db.products.toArray();
        if(products.length === 0) return Swal.fire('تنبيه', 'لا يوجد بيانات لطباعتها', 'info');

        const totalValue = products.reduce((sum, p) => sum + (p.stock_qty * p.cost), 0);
        const date = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // فتح نافذة جديدة للطباعة
        let printWin = window.open('', '_blank');
        
        let html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير جرد المخزن</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                    body { font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                    .header h1 { margin: 0 0 10px 0; font-size: 24px; color: #0f172a; }
                    .header p { margin: 0; color: #64748b; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
                    th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .summary { margin-top: 30px; display: flex; justify-content: space-between; background: #f1f5f9; padding: 15px; border-radius: 8px; font-weight: bold; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>تقرير جرد المخزن - Mentra ERP</h1>
                    <p>تاريخ التقرير: ${date}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th width="5%">#</th>
                            <th width="30%">اسم الصنف</th>
                            <th width="15%">الباركود</th>
                            <th width="15%">التصنيف</th>
                            <th width="10%">التكلفة</th>
                            <th width="10%">البيع</th>
                            <th width="15%">الكمية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map((p, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td><strong>${p.name_ar}</strong></td>
                                <td>${p.sku || '-'}</td>
                                <td>${p.category || '-'}</td>
                                <td>${p.cost}</td>
                                <td>${p.price}</td>
                                <td><span style="${p.stock_qty <= 5 ? 'color: red;' : ''}">${p.stock_qty}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <span>إجمالي عدد الأصناف المسجلة: ${products.length} صنف</span>
                    <span>إجمالي القيمة التقديرية (بالتكلفة): ${totalValue.toLocaleString()} ج.م</span>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWin.document.write(html);
        printWin.document.close();
    };

    // التشغيل المبدئي
    renderProducts();
})();