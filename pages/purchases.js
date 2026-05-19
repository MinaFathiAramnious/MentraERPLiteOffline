/**
 * MENTRA ERP - Smart Purchases & Stock Sync (v9.2 Native Mobile Optimized + Accounting Fixed)
 * Features: 100dvh Layout, Smart Input Card, Haptic Feedback, Perfect Journal Entries
 */

(function() {
    const displayArea = document.getElementById('main-content-display');

    // ستايلات مخصصة للموبايل
    const style = document.createElement('style');
    style.innerHTML = `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .app-container { position: absolute; inset: 0; top: 0; height: 100%; background: #f8fafc; z-index: 20; display: flex; flex-direction: column; }
    `;
    document.head.appendChild(style);

    const purchasesHTML = `
    <div class="app-container font-sans" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- 1. الهيدر والإحصائيات -->
        <div class="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-200 shrink-0 shadow-sm z-30">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
                    <i class="fas fa-truck-loading text-emerald-500"></i> فاتورة مشتريات
                </h2>
                <span id="purchase-inv-no" class="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-md border border-emerald-100 font-mono">
                    PUR-${Math.floor(Math.random()*900000)}
                </span>
            </div>
            
            <div class="flex gap-2 text-center">
                <div class="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p class="text-[9px] font-black text-slate-400 uppercase">مشتريات اليوم</p>
                    <h4 id="today-purchases-count" class="text-sm font-black text-slate-800 font-mono">0.00</h4>
                </div>
                <div class="flex-1 bg-rose-50 p-2 rounded-xl border border-rose-100">
                    <p class="text-[9px] font-black text-rose-400 uppercase">نواقص المخزن</p>
                    <h4 id="low-stock-count" class="text-sm font-black text-rose-600 font-mono">0</h4>
                </div>
            </div>
        </div>

        <!-- 2. محرك البحث الذكي -->
        <div class="px-4 py-3 shrink-0 relative z-20">
            <div class="relative">
                <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" id="p-search" placeholder="ابحث باسم المنتج أو الباركود..." autocomplete="off"
                       class="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-2xl py-3.5 pr-11 pl-4 font-bold text-[16px] text-slate-700 outline-none transition-all shadow-sm">
            </div>
            <div id="search-results" class="absolute left-4 right-4 bg-white shadow-2xl rounded-2xl mt-1 max-h-48 overflow-y-auto hidden border border-slate-100 divide-y divide-slate-50 z-50"></div>
        </div>

        <!-- 3. بطاقة إدخال الكمية والسعر -->
        <div id="input-card" class="hidden px-4 mb-2 shrink-0 animate-fade-in">
            <div class="bg-emerald-600 rounded-[1.5rem] p-4 shadow-lg text-white">
                <div class="flex justify-between items-start mb-4">
                    <h3 id="selected-p-name" class="font-black text-sm line-clamp-2">اسم المنتج</h3>
                    <button onclick="cancelInput()" class="bg-white/20 hover:bg-white/30 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mb-4 text-center">
                    <div class="bg-black/20 p-2 rounded-xl">
                        <p class="text-[9px] font-bold text-emerald-200 mb-1">المتوفر حالياً</p>
                        <span id="current-stock-info" class="text-sm font-black font-mono">0</span>
                    </div>
                    <div class="bg-black/20 p-2 rounded-xl">
                        <p class="text-[9px] font-bold text-emerald-200 mb-1">آخر تكلفة</p>
                        <span id="last-cost-info" class="text-sm font-black font-mono">0.00</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold text-emerald-100 mb-1">الكمية المستلمة</label>
                        <input type="number" id="p-qty" inputmode="decimal" value="1" min="1" class="w-full bg-white text-slate-900 border-0 rounded-xl py-3 text-[16px] font-black text-center outline-none focus:ring-2 focus:ring-emerald-300">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-emerald-100 mb-1">التكلفة الجديدة</label>
                        <input type="number" id="p-cost" inputmode="decimal" placeholder="0.00" class="w-full bg-white text-slate-900 border-0 rounded-xl py-3 text-[16px] font-black text-center outline-none focus:ring-2 focus:ring-emerald-300">
                    </div>
                </div>
                
                <button id="add-to-purchase" class="w-full mt-4 bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
                    <i class="fas fa-plus"></i> اعتماد وإضافة للفاتورة
                </button>
            </div>
        </div>

        <!-- 4. عربة المشتريات -->
        <div class="flex-1 overflow-y-auto px-4 pt-2 pb-32 hide-scrollbar">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-black text-slate-700 text-sm"><i class="fas fa-list-ul text-slate-400 ml-1"></i> الأصناف المضافة</h3>
                <span id="items-count" class="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md">0 أصناف</span>
            </div>
            
            <div id="purchase-items-list" class="space-y-3">
                <div class="text-center py-16 opacity-40">
                    <i class="fas fa-box-open text-5xl text-slate-300 mb-3 block"></i>
                    <span class="text-slate-500 font-bold text-xs">ابحث عن أصناف لإضافتها</span>
                </div>
            </div>
        </div>

        <!-- 5. الشريط السفلي للترحيل -->
        <div class="absolute bottom-0 w-full bg-slate-900 text-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-40 pb-safe transition-all border-t border-slate-800">
            <div class="p-4 flex items-center justify-between gap-3">
                
                <div class="flex flex-col min-w-[90px]">
                    <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">الإجمالي / الدفع</span>
                    <div class="flex flex-col gap-1">
                        <span id="purchase-total-display" class="text-xl font-black text-emerald-400">0.00</span>
                        <select id="p-payment-status" class="bg-slate-800 text-slate-300 text-[10px] font-bold py-1 px-2 rounded-lg outline-none border border-slate-700 w-full max-w-[80px]">
                            <option value="paid">كاش</option>
                            <option value="pending">آجل (دين)</option>
                        </select>
                    </div>
                </div>
                
                <button id="save-purchase" class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-3.5 rounded-[1.2rem] font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm h-12 mt-3">
                    <i class="fas fa-check-double"></i> ترحيل للمخزن
                </button>

                <button id="clear-purchase" class="w-12 h-12 mt-3 bg-rose-500/10 text-rose-500 rounded-[1.2rem] font-black active:scale-95 transition-all flex items-center justify-center border border-rose-500/20">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    </div>`;

    displayArea.innerHTML = purchasesHTML;

    // --- المنطق البرمجي (JavaScript) ---
    let currentPurchaseItems = [];
    let selectedProduct = null;
    let allProducts = [];

    // تهيئة الإحصائيات العلوية والتأكد من وجود الحسابات المحاسبية
    async function init() {
        await ensureDefaultPurchaseAccountsExist(); // التأكد من وجود الحسابات قبل أي عملية

        allProducts = await db.products.toArray();
        const invoices = await db.invoices.toArray();
        const today = new Date().toISOString().split('T')[0];
        
        const todayPurchases = invoices.filter(inv => inv.type === 'PURCHASE' && inv.date.startsWith(today));
        const totalToday = todayPurchases.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        
        document.getElementById('today-purchases-count').innerText = totalToday.toLocaleString('en-US', { minimumFractionDigits: 2 });
        document.getElementById('low-stock-count').innerText = allProducts.filter(p => p.stock_qty <= 5).length;
    }

    // دالة التأكد من وجود الحسابات المحاسبية
    async function ensureDefaultPurchaseAccountsExist() {
        const defaultAccounts = [
            { code: '1001', name_ar: 'الصندوق', type: 'asset', balance: 0 },
            { code: '1002', name_ar: 'البنك', type: 'asset', balance: 0 },
            { code: '1003', name_ar: 'عملاء مدينون', type: 'asset', balance: 0 },
            { code: '2001', name_ar: 'موردين دائنون', type: 'liability', balance: 0 },
            { code: '3001', name_ar: 'رأس المال', type: 'equity', balance: 0 },
            { code: '4001', name_ar: 'إيرادات المبيعات', type: 'income', balance: 0 },
            { code: '5001', name_ar: 'تكلفة البضاعة المباعة', type: 'expense', balance: 0 },
            { code: '6001', name_ar: 'المخزون', type: 'asset', balance: 0 }
        ];

        for (const account of defaultAccounts) {
            const exists = await db.accounts.where('code').equals(account.code).count();
            if (exists === 0) {
                await db.accounts.add(account);
            }
        }
    }

    // محرك البحث
    const searchInput = document.getElementById('p-search');
    const resultsDiv = document.getElementById('search-results');
    const inputCard = document.getElementById('input-card');

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        if(!val) { resultsDiv.classList.add('hidden'); return; }

        const filtered = allProducts.filter(p => 
            (p.name_ar && p.name_ar.toLowerCase().includes(val)) || 
            (p.sku && p.sku.toLowerCase().includes(val))
        ).slice(0, 6);

        if(filtered.length === 0) {
            resultsDiv.innerHTML = `<div class="p-4 text-center text-xs text-rose-400 font-bold">لم يتم العثور على المنتج</div>`;
        } else {
            resultsDiv.innerHTML = filtered.map(p => `
                <div class="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors active:bg-slate-100" 
                     onclick="selectProductForPurchase(${p.id})">
                    <span class="font-black text-slate-700 text-sm">${p.name_ar}</span>
                    <span class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-mono font-bold">${p.stock_qty || 0} متاح</span>
                </div>
            `).join('');
        }
        resultsDiv.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.classList.add('hidden');
        }
    });

    // اختيار المنتج
    window.selectProductForPurchase = (id) => {
        const product = allProducts.find(p => p.id === id);
        if(product) {
            selectedProduct = product;
            document.getElementById('selected-p-name').innerText = product.name_ar;
            document.getElementById('current-stock-info').innerText = product.stock_qty || 0;
            document.getElementById('last-cost-info').innerText = (parseFloat(product.cost) || 0).toFixed(2);
            document.getElementById('p-cost').value = product.cost || "";
            document.getElementById('p-qty').value = 1;
            
            searchInput.value = "";
            resultsDiv.classList.add('hidden');
            inputCard.classList.remove('hidden');
            playFeedback('tap');
        }
    };

    window.cancelInput = () => {
        selectedProduct = null;
        inputCard.classList.add('hidden');
    };

    // الإضافة للسلة
    document.getElementById('add-to-purchase').onclick = () => {
        const qty = parseFloat(document.getElementById('p-qty').value) || 0;
        const cost = parseFloat(document.getElementById('p-cost').value) || 0;

        if(qty <= 0 || cost <= 0) {
            playFeedback('error');
            Swal.fire({icon: 'error', title: 'خطأ', text: 'أدخل كمية وتكلفة صحيحة', toast: true, position: 'top', timer: 2000, showConfirmButton: false});
            return;
        }

        const existingItem = currentPurchaseItems.find(i => i.productId === selectedProduct.id);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.cost = cost; 
            existingItem.total = existingItem.qty * existingItem.cost;
        } else {
            currentPurchaseItems.unshift({ 
                productId: selectedProduct.id,
                name: selectedProduct.name_ar,
                qty,
                cost,
                total: qty * cost
            });
        }

        playFeedback('success');
        updateUI();
        cancelInput(); 
    };

    function updateUI() {
        const list = document.getElementById('purchase-items-list');
        const countBadge = document.getElementById('items-count');
        
        if (currentPurchaseItems.length === 0) {
            list.innerHTML = `
                <div class="text-center py-16 opacity-40">
                    <i class="fas fa-box-open text-5xl text-slate-300 mb-3 block"></i>
                    <span class="text-slate-500 font-bold text-xs">ابحث عن أصناف لإضافتها</span>
                </div>`;
            document.getElementById('purchase-total-display').innerText = '0.00';
            countBadge.innerText = "0 أصناف";
            return;
        }

        let total = 0;
        list.innerHTML = currentPurchaseItems.map((item, index) => {
            total += item.total;
            return `
            <div class="bg-white border border-slate-100 rounded-2xl p-3.5 flex justify-between items-center gap-3 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div class="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                
                <div class="flex-1 pr-2">
                    <h5 class="font-black text-sm text-slate-800 line-clamp-1">${item.name}</h5>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-slate-500 text-[11px] font-bold">${item.qty} وحدة</span>
                        <span class="text-slate-300 text-[10px]">×</span>
                        <span class="text-slate-500 text-[11px] font-bold">${item.cost.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="flex flex-col items-end gap-1">
                    <span class="font-black font-mono text-slate-800 text-base">${item.total.toFixed(2)}</span>
                    <button onclick="removePurchaseItem(${index})" class="text-rose-400 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded text-[10px] font-bold active:scale-95 transition-all">
                        <i class="fas fa-trash-alt ml-1"></i>حذف
                    </button>
                </div>
            </div>`;
        }).join('');
        
        document.getElementById('purchase-total-display').innerText = total.toLocaleString('en-US', { minimumFractionDigits: 2 });
        countBadge.innerText = `${currentPurchaseItems.length} أصناف`;
    }

    window.removePurchaseItem = (index) => {
        playFeedback('delete');
        currentPurchaseItems.splice(index, 1);
        updateUI();
    };

    document.getElementById('clear-purchase').onclick = async () => {
        if(currentPurchaseItems.length === 0) return;
        const res = await Swal.fire({
            title: 'إفراغ الفاتورة؟', icon: 'warning', showCancelButton: true,
            confirmButtonText: 'نعم', cancelButtonText: 'تراجع', confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
        if(res.isConfirmed) {
            currentPurchaseItems = [];
            updateUI();
            cancelInput();
            playFeedback('delete');
        }
    };

    // الترحيل الفعلي للمخزن وإنشاء القيود
    document.getElementById('save-purchase').onclick = async () => {
        if (currentPurchaseItems.length === 0) {
            playFeedback('error');
            Swal.fire({icon: 'warning', title: 'الفاتورة فارغة!', toast: true, position: 'top', timer: 2000, showConfirmButton: false});
            return;
        }

        const invNo = document.getElementById('purchase-inv-no').innerText;
        const total = currentPurchaseItems.reduce((acc, curr) => acc + curr.total, 0);
        const paymentStatus = document.getElementById('p-payment-status').value; 

        const confirmResult = await Swal.fire({
            title: 'تأكيد الترحيل؟',
            text: `ستتم إضافة الأصناف للمخزن بإجمالي ${total.toLocaleString()} ج.م`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، قم بالترحيل',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#10b981',
            customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold', cancelButton: 'rounded-xl font-bold'}
        });

        if (!confirmResult.isConfirmed) return;

        try {
            // المزامنة الشاملة لجميع الجداول (تم إضافة db.accounts و db.stock_movements)
            await db.transaction('rw', [db.invoices, db.invoice_items, db.products, db.journal, db.journal_items, db.accounts, db.stock_movements], async () => {
                
                const dateISO = new Date().toISOString();

                // 1. إنشاء الفاتورة
                const invId = await db.invoices.add({
                    invoice_number: invNo,
                    type: 'PURCHASE', 
                    date: dateISO,
                    total: total,
                    status: paymentStatus 
                });

                let totalCost = 0;

                // 2. تحديث المخزون وحفظ التفاصيل
                for (let item of currentPurchaseItems) {
                    await db.invoice_items.add({
                        invoice_id: invId,
                        product_id: item.productId,
                        product_name: item.name,
                        qty: item.qty,
                        price: item.cost, 
                        cost: item.cost,
                        total_item: item.total,
                        total_cost: item.total
                    });

                    // تحديث رصيد المنتج وتكلفته
                    const product = await db.products.get(Number(item.productId));
                    if (product) {
                        const newQty = (parseFloat(product.stock_qty) || 0) + item.qty;
                        await db.products.update(Number(item.productId), { 
                            stock_qty: newQty,
                            cost: item.cost 
                        });
                        totalCost += item.total;
                    }

                    // تسجيل حركة المخزن لضمان دقة التقارير (Stock Movement)
                    await db.stock_movements.add({
                        product_id: Number(item.productId),
                        type: 'in', // حركة دخول (مشتريات)
                        qty: item.qty,
                        date: dateISO,
                        ref_id: invNo
                    });
                }

                // 3. إنشاء القيود المحاسبية التلقائية (تم الاستدعاء بدون try-catch داخلي ليعمل الـ Rollback إن فشل)
                await createPurchaseJournalEntry(invId, totalCost, invNo, dateISO, paymentStatus);
            });

            // رسالة النجاح في حالة عدم وجود أخطاء في الـ Transaction
            playFeedback('success');
            await Swal.fire({
                icon: 'success', 
                title: 'تم الترحيل بنجاح 🚀', 
                text: 'تم تحديث المخزون وإنشاء القيود اليومية',
                timer: 2000, 
                showConfirmButton: false,
                customClass: {popup: 'rounded-3xl'}
            });
            
            // إعادة التهيئة
            currentPurchaseItems = [];
            document.getElementById('purchase-inv-no').innerText = `PUR-${Math.floor(Math.random()*900000)}`;
            updateUI();
            cancelInput();
            init(); 

        } catch (err) {
            console.error('Transaction Failed:', err);
            playFeedback('error');
            Swal.fire({
                icon: 'error', 
                title: 'لم يكتمل الترحيل!', 
                text: 'السبب: ' + err.message, 
                customClass: {popup: 'rounded-3xl'}
            });
        }
    };

    // دالة إنشاء القيود المحاسبية - (لا يوجد بداخلها try/catch لكي تتوافق مع الـ Transaction)
    async function createPurchaseJournalEntry(invoiceId, totalCost, invoiceNumber, date, paymentStatus) {
        const cashAccount = await db.accounts.where('code').equals('1001').first();
        const inventoryAccount = await db.accounts.where('code').equals('6001').first();
        const creditorsAccount = await db.accounts.where('code').equals('2001').first(); 

        if(!inventoryAccount) throw new Error('حساب المخزون غير موجود في الدليل');
        if(paymentStatus === 'paid' && !cashAccount) throw new Error('حساب الصندوق غير موجود');
        if(paymentStatus === 'pending' && !creditorsAccount) throw new Error('حساب الموردين الدائنين غير موجود');

        // قيد رأس الفاتورة
        const journalId = await db.journal.add({
            date: date,
            ref_no: invoiceNumber,
            description: `مشتريات - فاتورة رقم ${invoiceNumber}`,
            total: totalCost,
            type: 'PURCHASE'
        });

        // الطرف المدين (المخزون زاد)
        await db.journal_items.add({
            journal_id: journalId,
            account_id: inventoryAccount.id,
            debit: totalCost,
            credit: 0,
            description: `إضافة للمخزن - ${invoiceNumber}`
        });

        // الطرف الدائن
        if (paymentStatus === 'paid') {
            // الدفع نقداً (الصندوق قلّ)
            await db.journal_items.add({
                journal_id: journalId,
                account_id: cashAccount.id,
                debit: 0,
                credit: totalCost,
                description: `مشتريات نقدية - ${invoiceNumber}`
            });
        } else if (paymentStatus === 'pending') {
            // الشراء آجل (الدين زاد للموردين)
            await db.journal_items.add({
                journal_id: journalId,
                account_id: creditorsAccount.id,
                debit: 0,
                credit: totalCost,
                description: `مشتريات آجلة (مورد) - ${invoiceNumber}`
            });
        }
    }

    function playFeedback(type) {
        if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([100, 50, 100]);
            else if (type === 'error' || type === 'delete') navigator.vibrate([50, 50]);
            else navigator.vibrate(20);
        }
    }

    // التشغيل المبدئي للواجهة
    init();
})();