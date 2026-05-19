(function() {
    const displayArea = document.getElementById('main-content-display');
    
    // متغيرات الـ Pagination والفلترة
    let currentPage = 1;
    const itemsPerPage = 3; // تم التثبيت على 5 عناصر في الصفحة
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

        <!-- الإحصائيات -->
        <div id="inventoryStats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-2"></div>

        <!-- أزرار الفلترة -->
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

        <!-- قائمة المنتجات (أكثر اندماجاً وصغراً) -->
        <div id="productsList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"></div>

        <!-- حاوية الـ Pagination -->
        <div id="paginationContainer" class="flex items-center justify-center gap-2 mt-6 pb-4"></div>
    </div>

    <!-- نافذة إضافة/تعديل صنف (محدثة واحترافية لجميع الشاشات) -->
    <div id="productModal" class="hidden fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity">
        <div class="bg-white w-full max-w-2xl rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-slide-up md:animate-zoom-in relative">
            
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 md:hidden"></div> 
            
            <div class="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 shrink-0">
                <h3 id="modalTitle" class="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                    <i class="fas fa-box text-blue-500"></i> إضافة صنف
                </h3>
                <button type="button" onclick="closeProductModal()" class="w-10 h-10 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors flex items-center justify-center">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>
            
            <div class="p-5 md:p-6 overflow-y-auto flex-1 scrollbar-hide">
                <form id="productForm" class="space-y-5 text-right pb-4">
                    
                    <div>
                        <label class="text-[11px] font-black pr-2 mb-1.5 block text-slate-500">اسم المنتج <span class="text-rose-500">*</span></label>
                        <div class="relative">
                            <i class="fas fa-tag absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input type="text" id="p_name" placeholder="مثلاً: زيت زيتون 1 لتر" class="w-full bg-slate-50 py-3.5 pr-11 pl-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-[16px] transition-all" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-[11px] font-black pr-2 mb-1.5 block text-slate-500">الباركود (SKU)</label>
                            <div class="relative">
                                <i class="fas fa-barcode absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                <input type="text" id="p_sku" placeholder="00000" class="w-full bg-slate-50 py-3.5 pr-11 pl-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-[16px] transition-all">
                            </div>
                        </div>
                        <div>
                            <label class="text-[11px] font-black pr-2 mb-1.5 block text-slate-500">التصنيف</label>
                            <div class="relative">
                                <i class="fas fa-layer-group absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                <input type="text" id="p_category" placeholder="عام" class="w-full bg-slate-50 py-3.5 pr-11 pl-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-[16px] transition-all">
                            </div>
                        </div>
                    </div>
                    
                    <div class="h-px w-full bg-slate-100 my-2"></div>
                    
                    <div class="grid grid-cols-3 gap-3 md:gap-5 text-center">
                        <div class="bg-emerald-50/50 p-3 md:p-4 rounded-2xl border border-emerald-100">
                            <label class="text-[10px] md:text-[11px] font-black block mb-2 text-emerald-600"><i class="fas fa-money-bill-wave mb-1 block text-lg"></i> التكلفة</label>
                            <input type="number" id="p_cost" step="0.01" inputmode="decimal" placeholder="0.00" class="w-full bg-white py-2.5 px-2 rounded-xl font-black text-emerald-700 text-center outline-none border-2 border-transparent focus:border-emerald-400 text-[16px] shadow-sm" required>
                        </div>
                        <div class="bg-blue-50/50 p-3 md:p-4 rounded-2xl border border-blue-100">
                            <label class="text-[10px] md:text-[11px] font-black block mb-2 text-blue-600"><i class="fas fa-tags mb-1 block text-lg"></i> سعر البيع</label>
                            <input type="number" id="p_price" step="0.01" inputmode="decimal" placeholder="0.00" class="w-full bg-white py-2.5 px-2 rounded-xl font-black text-blue-700 text-center outline-none border-2 border-transparent focus:border-blue-400 text-[16px] shadow-sm" required>
                        </div>
                        <div class="bg-slate-50 p-3 md:p-4 rounded-2xl border border-slate-200">
                            <label class="text-[10px] md:text-[11px] font-black block mb-2 text-slate-600"><i class="fas fa-cubes mb-1 block text-lg"></i> الكمية</label>
                            <input type="number" id="p_qty" inputmode="numeric" placeholder="0" class="w-full bg-white py-2.5 px-2 rounded-xl font-black text-slate-700 text-center outline-none border-2 border-transparent focus:border-slate-400 text-[16px] shadow-sm" required>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0 rounded-b-[2rem] pb-safe flex gap-3">
                <button type="submit" form="productForm" class="flex-[2] bg-blue-600 text-white py-3.5 md:py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                    <i class="fas fa-save"></i> حفظ البيانات
                </button>
                <button type="button" onclick="closeProductModal()" class="flex-1 bg-white border border-slate-200 text-slate-600 py-3.5 md:py-4 rounded-2xl font-black hover:bg-slate-50 active:scale-95 transition-all text-sm">
                    إلغاء
                </button>
            </div>
        </div>
    </div>`;

    const style = document.createElement('style');
    style.innerHTML = `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (min-width: 768px) { .md\\:animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); } }
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
            <div class="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">قيمة المخزن</p>
                <p class="text-sm md:text-lg font-black text-emerald-600 truncate">${totalValue.toLocaleString()} <span class="text-[8px]">ج.م</span></p>
            </div>
            <div class="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي الأصناف</p>
                <p class="text-sm md:text-lg font-black text-slate-800">${all.length}</p>
            </div>
            <div class="bg-orange-50 p-3 md:p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] font-black text-orange-400 uppercase mb-1">نواقص (قريباً)</p>
                <p class="text-sm md:text-lg font-black text-orange-600">${lowCount}</p>
            </div>
            <div class="bg-rose-50 p-3 md:p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-center">
                <p class="text-[9px] font-black text-rose-400 uppercase mb-1">أصناف نفدت</p>
                <p class="text-sm md:text-lg font-black text-rose-600">${outCount}</p>
            </div>
        `;
    };

    // 3. عرض المنتجات (مصغرة Compact Design)
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

        const totalItems = products.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const visibleProducts = products.slice(startIndex, startIndex + itemsPerPage);
        
        if (visibleProducts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 flex flex-col items-center justify-center">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <i class="fas fa-box-open text-2xl text-slate-300"></i>
                    </div>
                    <div class="text-slate-500 font-black text-xs">لا توجد أصناف مطابقة</div>
                </div>`;
            document.getElementById('paginationContainer').innerHTML = ''; 
            return;
        }

        // تصميم الكروت المصغر
        container.innerHTML = visibleProducts.map(p => `
            <div class="bg-white p-3 md:p-4 rounded-2xl shadow-sm border ${p.stock_qty <= 0 ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'} relative transition-all hover:shadow-md">
                <div class="flex justify-between items-start mb-2">
                    <span class="bg-slate-100 text-slate-500 text-[8px] md:text-[9px] px-2 py-0.5 rounded border border-slate-200 font-black tracking-widest font-mono">#${p.id}</span>
                    <div class="flex gap-1">
                        <button onclick="openProductModal(${p.id})" class="text-blue-500 w-7 h-7 bg-blue-50 rounded-lg hover:bg-blue-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"><i class="fas fa-pen text-[10px]"></i></button>
                        <button onclick="deleteProduct(${p.id})" class="text-rose-500 w-7 h-7 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"><i class="fas fa-trash text-[10px]"></i></button>
                    </div>
                </div>
                
                <h4 class="font-black text-slate-800 text-sm md:text-base leading-tight mb-2 pl-6 truncate" title="${p.name_ar}">${p.name_ar}</h4>
                
                <div class="flex items-center gap-1.5 mb-3">
                    <span class="text-[9px] font-bold text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"><i class="fas fa-barcode ml-1 text-slate-300"></i>${p.sku || 'بدون'}</span>
                    ${p.category ? `<span class="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-[80px]">${p.category}</span>` : ''}
                </div>
                
                <div class="flex justify-between items-end bg-slate-50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <div>
                        <p class="text-[8px] text-slate-400 font-black mb-0.5 uppercase tracking-tighter">المتاح</p>
                        <p class="text-base md:text-lg font-black ${p.stock_qty <= 0 ? 'text-rose-600' : p.stock_qty <= 5 ? 'text-orange-600' : 'text-slate-800'} leading-none">
                            ${p.stock_qty} <span class="text-[8px]">قطعة</span>
                        </p>
                    </div>
                    <div class="text-left">
                        <p class="text-[8px] text-slate-400 font-black mb-0.5 uppercase tracking-tighter text-left">السعر</p>
                        <p class="text-base md:text-lg font-black text-blue-600 leading-none">${p.price} <span class="text-[8px]">ج.م</span></p>
                    </div>
                </div>

                <!-- زر الإضافة السريعة (مصغر) -->
                <button onclick="quickAdd(${p.id}, '${p.name_ar}')" class="absolute -bottom-2 -right-2 bg-slate-800 text-white w-9 h-9 md:w-10 md:h-10 rounded-xl shadow-lg shadow-slate-300 flex items-center justify-center hover:bg-blue-600 hover:scale-105 active:scale-90 transition-all border-2 border-white">
                    <i class="fas fa-plus text-[10px]"></i>
                </button>
            </div>
        `).join('');

        renderPagination(totalPages);
        updateStats();
    };

    // 4. دالة رسم أزرار الترقيم (Pagination UI)
    const renderPagination = (totalPages) => {
        const paginationContainer = document.getElementById('paginationContainer');
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let buttonsHTML = '';
        buttonsHTML += `
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
                class="w-9 h-9 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm'}">
                <i class="fas fa-chevron-right text-xs"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (totalPages > 5) {
                if (i !== 1 && i !== totalPages && Math.abs(i - currentPage) > 1) {
                    if (i === 2 || i === totalPages - 1) buttonsHTML += `<span class="text-slate-400 px-1 text-xs">...</span>`;
                    continue;
                }
            }

            buttonsHTML += `
                <button onclick="changePage(${i})" 
                    class="w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm'}">
                    ${i}
                </button>
            `;
        }

        buttonsHTML += `
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} 
                class="w-9 h-9 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm'}">
                <i class="fas fa-chevron-left text-xs"></i>
            </button>
        `;

        paginationContainer.innerHTML = buttonsHTML;
    };

    window.changePage = (page) => {
        currentPage = page;
        renderProducts();
        document.getElementById('main-scroll-area').scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.resetPaginationAndRender = () => { 
        currentPage = 1; 
        renderProducts(); 
    };

    // 5. أدوات التحكم
    window.changeFilter = (f) => {
        currentFilter = f;
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
            b.classList.add('bg-white');
        });
        
        const activeBtn = document.getElementById(`filter-${f}`);
        activeBtn.classList.remove('bg-white', 'text-orange-600', 'text-rose-600', 'border-orange-100', 'border-rose-100');
        activeBtn.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
        
        resetPaginationAndRender();
    };

    window.openProductModal = (id = null) => {
        currentEditingId = id;
        const form = document.getElementById('productForm');
        
        if(id) {
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-pen text-blue-500"></i> تعديل الصنف';
            db.products.get(id).then(p => {
                document.getElementById('p_name').value = p.name_ar;
                document.getElementById('p_sku').value = p.sku;
                document.getElementById('p_category').value = p.category;
                document.getElementById('p_cost').value = p.cost;
                document.getElementById('p_price').value = p.price;
                document.getElementById('p_qty').value = p.stock_qty;
            });
        } else {
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-box text-blue-500"></i> إضافة صنف جديد';
            form.reset();
        }
        
        const modal = document.getElementById('productModal');
        modal.classList.remove('hidden');
    };

    window.closeProductModal = () => document.getElementById('productModal').classList.add('hidden');

    document.getElementById('productForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('p_name').value.trim();
        
        // --- التحقق من أن الاسم غير مكرر ---
        const allProducts = await db.products.toArray();
        const isDuplicate = allProducts.find(p => 
            p.name_ar.trim().toLowerCase() === newName.toLowerCase() && 
            p.id !== currentEditingId
        );

        if (isDuplicate) {
            Swal.fire({
                icon: 'error',
                title: 'الصنف مسجل مسبقاً!',
                text: 'يوجد صنف بهذا الاسم في المخزن، يرجى تغييره لتجنب التكرار.',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold' }
            });
            return; // إيقاف الحفظ
        }
        // -----------------------------------

        const data = {
            name_ar: newName,
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
            customClass: { popup: 'rounded-3xl', input: 'rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500', confirmButton: 'rounded-xl font-bold', cancelButton: 'rounded-xl font-bold' }
        });

        if (qty && !isNaN(qty) && qty > 0) {
            const p = await db.products.get(id);
            await db.products.update(id, { stock_qty: p.stock_qty + parseFloat(qty) });
            if(db.stock_movements) {
                await db.stock_movements.add({ product_id: id, type: 'in', qty: parseFloat(qty), date: new Date().toISOString(), ref_id: 'إضافة سريعة' });
            }
            renderProducts();
            Swal.fire({ icon: 'success', title: 'تم تحديث الرصيد', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }
    };

    // 6. التصدير
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
            if(!ws['!views']) ws['!views'] = [];
            ws['!views'].push({ rightToLeft: true });
            XLSX.utils.book_append_sheet(wb, ws, "جرد المخزن");
            
            const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            XLSX.writeFile(wb, `Inventory_Report_${date}.xlsx`);
        } catch (e) {
            Swal.fire('خطأ', 'حدث خطأ أثناء استخراج الملف', 'error');
        }
    };

    window.printPDF = async () => {
        const products = await db.products.toArray();
        if(products.length === 0) return Swal.fire('تنبيه', 'لا يوجد بيانات لطباعتها', 'info');

        const totalValue = products.reduce((sum, p) => sum + (p.stock_qty * p.cost), 0);
        const date = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
                    @media print { body { padding: 0; } }
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
                    window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }
                </script>
            </body>
            </html>
        `;
        printWin.document.write(html);
        printWin.document.close();
    };

    renderProducts();
})();