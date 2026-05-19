/**
 * MENTRA ERP - Smart POS Engine v3.3 (Mobile Native + Payment Status + Optional Print)
 * Features: Mobile UI, Haptic Feedback, SweetAlert2, Credit Sales (آجل), Thermal Print Option
 */

(function() {
    let state = {
        cart: [],
        taxRate: 0.00, 
        discount: 0
    };

    const posHTML = `
    <style>
        /* ===== POS Layout ===== */
        #pos-wrap { display:flex; flex-direction:column; height:100%; font-family:inherit; direction:rtl; -webkit-tap-highlight-color:transparent; }

        #pos-search-bar { flex-shrink:0; background:var(--neutral-50); border-radius:var(--radius-xl); padding:12px 14px; margin-bottom:10px; border:1px solid var(--neutral-200); box-shadow:var(--shadow-sm); }
        #pos-search-bar input { width:100%; background:var(--neutral-100); border:2px solid transparent; border-radius:var(--radius-lg); padding:10px 88px 10px 12px; font-size:16px; font-weight:700; color:var(--neutral-700); outline:none; transition:border-color var(--transition-fast); }
        #pos-search-bar input:focus { border-color:var(--primary-500); background:var(--neutral-50); }
        #pos-search-bar .barcode-icon { position:absolute; right:56px; top:50%; transform:translateY(-50%); color:var(--primary-500); font-size:1.1rem; }
        #pos-search-bar .camera-btn { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:36px; height:36px; background:var(--primary-500); color:#fff; border:none; border-radius:var(--radius-lg); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1rem; transition:all var(--transition-fast); box-shadow:var(--shadow-sm); }
        #pos-search-bar .camera-btn:hover { background:var(--primary-600); transform:translateY(-50%) scale(1.05); }
        #pos-search-bar .camera-btn:active { transform:translateY(-50%) scale(0.95); }
        #search-results { display:flex; gap:10px; overflow-x:auto; padding:8px 0 4px; scrollbar-width:none; }
        #search-results::-webkit-scrollbar { display:none; }

        #pos-cart-wrap { flex:1; min-height:0; overflow-y:auto; background:var(--neutral-50); border-radius:var(--radius-xl); border:1px solid var(--neutral-200); box-shadow:var(--shadow-sm); padding:12px; scrollbar-width:none; }
        #pos-cart-wrap::-webkit-scrollbar { display:none; }

        #pos-bottom-bar { flex-shrink:0; background:var(--neutral-900); border-radius:var(--radius-lg) var(--radius-lg) 0 0; padding:10px 12px 12px; box-shadow:0 -4px 20px rgba(0,0,0,.35); }

        @media (min-width: 1024px) {
            #pos-wrap { flex-direction:row; gap:24px; }
            #pos-left  { flex:1; min-width:0; display:flex; flex-direction:column; }
            #pos-right { width:340px; flex-shrink:0; }
            #pos-bottom-bar { display:none !important; }
            #pos-desktop-panel { display:flex !important; flex-direction:column; background:var(--neutral-900); border-radius:var(--radius-2xl); padding:2rem; color:#fff; box-shadow:var(--shadow-2xl); position:sticky; top:1rem; }
        }
        @media (max-width: 1023px) {
            #pos-left  { flex:1; min-width:0; display:flex; flex-direction:column; }
            #pos-right { display:none; }
        }

        .search-card { background:var(--primary-50); padding:10px 12px; border-radius:var(--radius-lg); border:1px solid var(--primary-200); cursor:pointer; min-width:110px; flex-shrink:0; transition:background var(--transition-fast); }
        .search-card:active { background:var(--primary-100); }
        .search-card .sc-name { font-weight:900; font-size:.75rem; color:var(--neutral-800); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px; }
        .search-card .sc-price { font-weight:900; font-size:.85rem; color:var(--primary-600); margin-top:2px; }
        .search-card .sc-stock { font-size:.65rem; font-weight:700; margin-top:2px; }
        .sc-stock.ok  { color:var(--success); }
        .sc-stock.out { color:var(--error); }

        .cart-card { background:var(--neutral-50); border:1px solid var(--neutral-200); border-radius:var(--radius-lg); padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:var(--shadow-sm); margin-bottom:10px; }
        .cart-card .cc-info { flex:1; min-width:0; }
        .cart-card .cc-name { font-weight:900; font-size:.85rem; color:var(--neutral-800); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .cart-card .cc-unit { font-size:.7rem; color:var(--neutral-400); font-weight:700; margin-top:2px; }
        .cart-card .cc-controls { display:flex; align-items:center; gap:12px; flex-shrink:0; }
        .qty-box { display:flex; align-items:center; gap:4px; background:var(--neutral-100); border:1px solid var(--neutral-300); border-radius:var(--radius-md); padding:4px; }
        .qty-btn { width:34px; height:34px; border-radius:var(--radius-md); background:var(--neutral-50); border:none; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; color:var(--neutral-600); box-shadow:var(--shadow-sm); transition:transform var(--transition-fast); }
        .qty-btn:active { transform:scale(.88); }
        .qty-num { font-weight:900; font-size:.9rem; color:var(--neutral-800); width:26px; text-align:center; }
        .cc-total-wrap { display:flex; flex-direction:column; align-items:flex-end; min-width:64px; }
        .cc-total { font-weight:900; font-size:.95rem; color:var(--primary-600); }
        .cc-del { font-size:.65rem; font-weight:700; color:var(--error); cursor:pointer; margin-top:3px; background:none; border:none; }

        #pb-row1 { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        #pb-total-wrap { flex-shrink:0; }
        #pb-total-label { font-size:8px; font-weight:900; color:var(--success); text-transform:uppercase; }
        #pb-total-val { font-size:1.5rem; font-weight:900; color:#fff; font-family:monospace; line-height:1; }
        #pb-discount-wrap { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:var(--radius-md); padding:5px 8px; flex-shrink:0; }
        #pb-discount-wrap span { font-size:8px; font-weight:900; color:var(--error); }
        .sync-discount { width:46px; background:transparent; border:none; color:#fff; font-size:15px; text-align:center; outline:none; font-family:monospace; font-weight:900; }
        
        .sync-customer { flex:1; min-width:0; background:var(--neutral-800); border:1px solid var(--neutral-600); border-radius:var(--radius-md); padding:6px 10px; font-size:14px; font-weight:700; color:#fff; outline:none; }
        .sync-status { background:var(--neutral-800); border:1px solid var(--neutral-600); border-radius:var(--radius-md); padding:6px; font-size:12px; font-weight:700; color:#fff; outline:none; cursor:pointer; }
        
        #pb-row2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .pb-btn { border:none; cursor:pointer; border-radius:var(--radius-lg); padding:12px; font-weight:900; font-size:.9rem; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:var(--shadow-md); }
        .pb-cash { background:var(--success); color:var(--neutral-900); }
        .pb-card { background:var(--primary-600); color:#fff; }

        #pos-desktop-panel { display:none; }
        .dp-row { display:flex; justify-content:space-between; align-items:center; color:var(--neutral-400); font-size:.8rem; font-weight:700; margin-bottom:10px; }
        .dp-disc-wrap { display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.06); border-radius:var(--radius-lg); padding:8px 12px; margin-bottom:16px; }
        .dp-disc-wrap span { font-size:.8rem; font-weight:900; color:var(--error); }
        .dp-disc-wrap input { width:72px; background:transparent; border:none; border-bottom:2px solid rgba(239,68,68,.3); text-align:center; color:#fff; font-size:16px; outline:none; font-family:monospace; }
        .dp-total-box { border-top:1px solid rgba(255,255,255,.1); padding-top:16px; text-align:center; margin-bottom:20px; }
        .dp-total-label { font-size:.6rem; font-weight:900; color:var(--success); }
        .dp-total-val { font-size:3.5rem; font-weight:900; color:#fff; font-family:monospace; line-height:1.1; }
        
        .dp-input-row { display:flex; gap:8px; margin-bottom:12px; }
        .dp-customer { flex:1; background:var(--neutral-800); border:1px solid var(--neutral-600); border-radius:var(--radius-lg); padding:12px 14px; color:#fff; font-size:14px; font-weight:700; outline:none; }
        .dp-status { width:110px; background:var(--neutral-800); border:1px solid var(--neutral-600); border-radius:var(--radius-lg); padding:12px 10px; color:#fff; font-size:14px; font-weight:700; outline:none; cursor:pointer; }
        
        .dp-btns { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .dp-btn { border:none; cursor:pointer; border-radius:var(--radius-lg); padding:16px; font-weight:900; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:8px; }
        .dp-cash { background:var(--success); color:var(--neutral-900); }
        .dp-card { background:var(--primary-600); color:#fff; }

        /* Print Checkbox Style */
        .print-toggle-wrap { display:flex; align-items:center; gap:8px; margin-bottom:12px; color:#cbd5e1; font-size:12px; font-weight:700; background: rgba(255,255,255,0.05); padding: 8px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1); cursor:pointer;}
        .print-toggle-wrap input[type="checkbox"] { width: 16px; height: 16px; accent-color: #3b82f6; cursor:pointer; }

        /* ===== Scanner Modal ===== */
        #scanner-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.9); z-index:9999; direction:ltr; }
        #scanner-modal.active { display:flex; flex-direction:column; }
        #scanner-header { background:var(--neutral-900); color:#fff; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
        #scanner-title { font-weight:900; font-size:1rem; }
        #scanner-close { background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer; padding:4px; border-radius:4px; transition:background var(--transition-fast); }
        #scanner-close:hover { background:rgba(255,255,255,.1); }
        #scanner-container { flex:1; position:relative; display:flex; justify-content:center; align-items:center; }
        #scanner-video { width:100%; height:100%; object-fit:cover; }
        #scanner-overlay { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:280px; height:280px; border:3px solid var(--primary-500); border-radius:12px; pointer-events:none; }
        #scanner-overlay::before, #scanner-overlay::after { content:''; position:absolute; width:40px; height:40px; border:4px solid var(--primary-500); }
        #scanner-overlay::before { top:-3px; right:-3px; border-left:none; border-bottom:none; border-top-right-radius:12px; }
        #scanner-overlay::after { bottom:-3px; right:-3px; border-left:none; border-top:none; border-bottom-right-radius:12px; }
        #scanner-status { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:var(--neutral-900); color:#fff; padding:8px 16px; border-radius:20px; font-weight:700; font-size:.9rem; }
        .scanner-scanning #scanner-status { background:var(--primary-600); }
        .scanner-found #scanner-status { background:var(--success); }
    </style>

    <div id="pos-wrap">
        <!-- يسار: البحث + العربة -->
        <div id="pos-left">
            <div id="pos-search-bar">
                <div style="position:relative">
                    <i class="fas fa-barcode barcode-icon"></i>
                    <input type="text" id="smart-search" placeholder="ابحث باسم المنتج أو الباركود...">
                    <button class="camera-btn" onclick="startBarcodeScanner()" title="مسح الباركود بالكاميرا">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <div id="search-results">
                    <p style="font-size:.7rem;color:#94a3b8;font-weight:700;width:100%;text-align:center;padding:6px 0">
                        <i class="fas fa-search" style="margin-left:4px"></i> اكتب للبحث أو استخدم القارئ
                    </p>
                </div>
            </div>

            <div id="pos-cart-wrap">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 4px">
                    <h3 style="font-weight:900;font-size:.9rem;color:#334155"><i class="fas fa-shopping-basket" style="color:#3b82f6;margin-left:6px"></i> الفاتورة الحالية</h3>
                    <button onclick="clearCart()" style="font-size:.7rem;font-weight:700;color:#ef4444;background:#fef2f2;border:none;padding:6px 12px;border-radius:.5rem;cursor:pointer">إفراغ</button>
                </div>
                <div id="cart-items-container"></div>
            </div>
        </div>

        <!-- يمين: ديسكتوب panel -->
        <div id="pos-right">
            <div id="pos-desktop-panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <span style="color:#94a3b8;font-size:.7rem;font-weight:900;text-transform:uppercase;">ملخص الحساب</span>
                    <span style="background:rgba(255,255,255,.1);color:#34d399;font-size:.6rem;font-weight:900;padding:4px 8px;border-radius:.4rem">INV-${Date.now().toString().slice(-4)}</span>
                </div>
                <div class="dp-row"><span>الإجمالي الفرعي</span><span class="sync-sub-total" style="font-family:monospace">0.00</span></div>
                
                <div class="dp-disc-wrap">
                    <span>الخصم</span>
                    <input type="number" class="sync-discount" oninput="updateTotals(this.value)" value="0">
                </div>
                <div class="dp-total-box">
                    <div class="dp-total-label">المطلوب دفعه</div>
                    <div class="dp-total-val sync-final-total">0.00</div>
                </div>
                
                <!-- خيارات العميل وحالة الدفع (ديسكتوب) -->
                <div class="dp-input-row">
                    <input type="text" class="dp-customer sync-customer" oninput="syncInputs('sync-customer', this.value)" placeholder="اسم العميل...">
                    <select class="dp-status sync-status" onchange="syncInputs('sync-status', this.value)">
                        <option value="paid">✅ مسدد</option>
                        <option value="pending">⏳ آجل</option>
                    </select>
                </div>

                <!-- زر الطباعة -->
                <label class="print-toggle-wrap">
                    <input type="checkbox" class="sync-print" onchange="syncInputs('sync-print', this.checked, true)" checked>
                    <span>طباعة الفاتورة تلقائياً عند الحفظ</span>
                </label>

                <div class="dp-btns">
                    <button class="dp-btn dp-cash" onclick="processCheckout('CASH')"><i class="fas fa-money-bill-wave"></i> كاش / اعتماد</button>
                    <button class="dp-btn dp-card" onclick="processCheckout('CARD')"><i class="fas fa-credit-card"></i> شبكة</button>
                </div>
            </div>
        </div>

        <!-- الشريط السفلي (موبايل فقط) -->
        <div id="pos-bottom-bar" dir="rtl">
            <div id="pb-row1">
                <div id="pb-total-wrap">
                    <div id="pb-total-label">الإجمالي</div>
                    <div id="pb-total-val" class="sync-final-total">0.00</div>
                </div>
                <div id="pb-discount-wrap">
                    <span>خصم</span>
                    <input type="number" class="sync-discount" oninput="updateTotals(this.value)" value="0" placeholder="0">
                </div>
            </div>
            
            <!-- خيارات العميل وحالة الدفع (موبايل) -->
            <div style="display:flex; gap:6px; margin-bottom:8px;">
                <input type="text" class="sync-customer" oninput="syncInputs('sync-customer', this.value)" placeholder="اسم العميل...">
                <select class="sync-status" onchange="syncInputs('sync-status', this.value)">
                    <option value="paid">✅ كاش/مسدد</option>
                    <option value="pending">⏳ آجل (دين)</option>
                </select>
            </div>
            
            <!-- زر الطباعة -->
            <label class="print-toggle-wrap" style="padding:6px; margin-bottom:10px;">
                <input type="checkbox" class="sync-print" onchange="syncInputs('sync-print', this.checked, true)" checked>
                <span>طباعة بون الفاتورة</span>
            </label>

            <div id="pb-row2">
                <button class="pb-btn pb-cash" onclick="processCheckout('CASH')"><i class="fas fa-check-double"></i> كاش / اعتماد</button>
                <button class="pb-btn pb-card" onclick="processCheckout('CARD')"><i class="fas fa-credit-card"></i> شبكة</button>
            </div>
        </div>
    </div>

    <!-- Scanner Modal -->
    <div id="scanner-modal">
        <div id="scanner-header">
            <span id="scanner-title">مسح الباركود بالكاميرا</span>
            <button id="scanner-close" onclick="stopBarcodeScanner()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id="scanner-container">
            <video id="scanner-video"></video>
            <div id="scanner-overlay"></div>
            <div id="scanner-status">ضع الباركود داخل الإطار</div>
        </div>
    </div>
    `;

     // إضافة مكتبة مسح الباركود
     const script = document.createElement('script');
     script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js';
     document.head.appendChild(script);
     
     document.getElementById('main-content-display').innerHTML = posHTML;

    function applyPosHeight() {
        const wrap = document.getElementById('pos-wrap');
        const container = document.getElementById('main-content-display');
        if (!wrap || !container) return;
        const rect = container.getBoundingClientRect();
        const bottomBar = document.getElementById('pos-bottom-bar');
        const bbH = (bottomBar && window.innerWidth < 1024) ? bottomBar.offsetHeight : 0;
        wrap.style.height = (window.innerHeight - rect.top - bbH) + 'px';
    }
    requestAnimationFrame(() => applyPosHeight());
    window.addEventListener('resize', applyPosHeight);

    // --- المنطق البرمجي (Logic) ---

    window.setAllText = (className, value) => {
        document.querySelectorAll('.' + className).forEach(el => el.innerText = value);
    };
    
    // دالة المزامنة المعدلة لتدعم الـ Checkbox
    window.syncInputs = (className, value, isCheckbox = false) => {
        document.querySelectorAll('.' + className).forEach(el => {
            if (isCheckbox) {
                if(el.checked !== value) el.checked = value;
            } else {
                if(el.value !== value) el.value = value;
            }
        });
    };

    window.liveSearch = async (val) => {
        const resultsArea = document.getElementById('search-results');
        if (val.trim().length === 0) {
            resultsArea.innerHTML = '<p style="font-size:.7rem;color:#94a3b8;font-weight:700;width:100%;text-align:center;padding:6px 0"><i class="fas fa-search" style="margin-left:4px"></i> اكتب للبحث</p>';
            return;
        }

        try {
            const products = await db.products
                .filter(p => (p.name_ar && p.name_ar.includes(val)) || p.sku === val || p.barcode === val)
                .limit(8)
                .toArray();

            if (products.length === 1 && (products[0].sku === val || products[0].barcode === val)) {
                addToCart(products[0]);
                document.getElementById('smart-search').value = '';
                resultsArea.innerHTML = '<p style="font-size:.7rem;color:#10b981;font-weight:700;width:100%;text-align:center;padding:6px 0">تم الإضافة</p>';
                return;
            }

            if (products.length > 0) {
                resultsArea.innerHTML = products.map(p => {
                    const outOfStock = (parseFloat(p.stock_qty) || 0) <= 0;
                    const encoded = JSON.stringify(p).replace(/'/g, "&#39;");
                    const stockText = outOfStock ? 'نفد' : 'متوفر: ' + p.stock_qty;
                    const stockClass = outOfStock ? 'sc-stock out' : 'sc-stock ok';
                    const cardStyle = outOfStock ? ' style="opacity:.55"' : '';
                    return '<div onclick=\'addToCart(' + encoded + ')\' class="search-card"' + cardStyle + '>' +
                        '<div class="sc-name">' + p.name_ar + '</div>' +
                        '<div class="sc-price">' + Number(p.price).toFixed(2) + '</div>' +
                        '<div class="' + stockClass + '">' + stockText + '</div>' +
                        '</div>';
                }).join('');
            } else {
                resultsArea.innerHTML = '<p style="font-size:.7rem;color:#f87171;font-weight:700;width:100%;text-align:center;padding:6px 0">لا يوجد منتج</p>';
            }
        } catch (error) { console.error(error); }
    };

    document.getElementById('smart-search').addEventListener('input', (e) => liveSearch(e.target.value));

    window.addToCart = (product) => {
        const availableStock = parseFloat(product.stock_qty) || 0;
        const exist = state.cart.find(i => i.id === product.id);
        const currentQtyInCart = exist ? exist.qty : 0;

        if (availableStock <= 0 && currentQtyInCart === 0) {
            playFeedback('delete');
            Swal.fire({ icon: 'warning', title: 'نفد من المخزون', text: product.name_ar + ' غير متوفر', toast: true, position: 'top', timer: 2000, showConfirmButton: false });
            return;
        }
        if (currentQtyInCart >= availableStock) {
            playFeedback('delete');
            Swal.fire({ icon: 'info', title: 'تجاوز الكمية المتاحة', toast: true, position: 'top', timer: 2000, showConfirmButton: false });
            return;
        }

        if (exist) exist.qty++;
        else {
            state.cart.unshift({
                id: product.id,
                name: product.name_ar || 'منتج',
                price: Number(product.price || 0),
                cost: Number(product.cost || 0),
                qty: 1,
                maxStock: availableStock
            });
        }
        playFeedback();
        renderCart();
    };

    window.renderCart = () => {
        const container = document.getElementById('cart-items-container');
        if (state.cart.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px 0;opacity:.4"><i class="fas fa-cart-arrow-down" style="font-size:3rem;color:#cbd5e1;display:block;margin-bottom:10px"></i><span style="font-size:.8rem;font-weight:700;color:#64748b">الفاتورة فارغة</span></div>';
            updateTotals();
            return;
        }
        container.innerHTML = state.cart.map(function(item) {
            return '<div class="cart-card">' +
                '<div class="cc-info"><div class="cc-name">' + item.name + '</div><div class="cc-unit">' + item.price.toFixed(2) + ' للوحدة</div></div>' +
                '<div class="cc-controls">' +
                    '<div class="qty-box">' +
                        '<button class="qty-btn" onclick="updateQty(' + item.id + ',-1)"><i class="fas fa-minus" style="font-size:.65rem"></i></button>' +
                        '<span class="qty-num">' + item.qty + '</span>' +
                        '<button class="qty-btn" onclick="updateQty(' + item.id + ',1)"><i class="fas fa-plus" style="font-size:.65rem"></i></button>' +
                    '</div>' +
                    '<div class="cc-total-wrap">' +
                        '<span class="cc-total">' + (item.price * item.qty).toFixed(2) + '</span>' +
                        '<button class="cc-del" onclick="removeItem(' + item.id + ')"><i class="fas fa-trash-alt"></i> حذف</button>' +
                    '</div>' +
                '</div></div>';
        }).join('');
        updateTotals();
    };

    window.updateTotals = (discountValue = null) => {
        const sub = state.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
        
        let disc = 0;
        if(discountValue !== null) {
            disc = parseFloat(discountValue) || 0;
            syncInputs('sync-discount', discountValue);
        } else {
            const el = document.querySelector('.sync-discount');
            disc = el ? (parseFloat(el.value) || 0) : 0;
        }

        const final = sub - disc;
        const finalStr = final > 0 ? final.toFixed(2) : "0.00";

        setAllText('sync-sub-total', sub.toFixed(2));
        setAllText('sync-final-total', finalStr);
    };

    window.updateQty = (id, change) => {
        const item = state.cart.find(i => i.id === id);
        if (item) {
            if (change > 0 && item.maxStock !== undefined && item.qty >= item.maxStock) {
                playFeedback('delete');
                Swal.fire({ icon: 'info', title: 'وصلت للحد الأقصى', toast: true, position: 'top', timer: 2000, showConfirmButton: false });
                return;
            }
            item.qty += change;
            if (item.qty <= 0) removeItem(id);
            else { playFeedback('tap'); renderCart(); }
        }
    };

    window.removeItem = (id) => {
        state.cart = state.cart.filter(i => i.id !== id);
        playFeedback('delete');
        renderCart();
    };

    window.clearCart = async () => {
        if(state.cart.length === 0) return;
        const res = await Swal.fire({ title: 'إفراغ الفاتورة؟', icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'تراجع', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-3xl' } });
        if(res.isConfirmed) {
            state.cart = [];
            syncInputs('sync-discount', 0);
            renderCart();
        }
    };

    // --- دالة الطباعة الحرارية للفاتورة ---
    async function printReceipt(invoiceNumber, customerName, cartItems, finalTotal, paymentStatus) {
        try {
            let shopName = "Mentra ERP";
            let shopPhone = "";
            if(db.settings) {
                const setting = await db.settings.get(1);
                if(setting) {
                    shopName = setting.shop_name || shopName;
                    shopPhone = setting.phone || "";
                }
            }

            const dateStr = new Date().toLocaleString('ar-EG');
            
            let printWin = window.open('', '_blank');
            let html = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>فاتورة ${invoiceNumber}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                        body { font-family: 'Cairo', sans-serif; padding: 10px; color: #000; margin: 0; background: #fff; font-size: 12px; }
                        .receipt-container { max-width: 80mm; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .header h2 { margin: 0 0 5px 0; font-size: 20px; font-weight: 900; }
                        .header p { margin: 2px 0; font-size: 11px; }
                        .info-box { margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                        .info-box div { margin-bottom: 4px; display: flex; justify-content: space-between; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th { border-bottom: 1px solid #000; padding: 5px 0; text-align: right; font-size: 11px; }
                        td { padding: 6px 0; border-bottom: 1px dotted #ccc; font-size: 12px; font-weight: bold; }
                        .col-qty { text-align: center; width: 15%; }
                        .col-price { text-align: left; width: 25%; }
                        .col-total { text-align: left; width: 25%; font-weight: 900;}
                        .summary { border-top: 2px dashed #000; padding-top: 10px; font-weight: bold; }
                        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .final-total { font-size: 18px; margin-top: 10px; border-top: 2px solid #000; padding-top: 5px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px; }
                        @media print { body { padding: 0; } @page { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <h2>${shopName}</h2>
                            ${shopPhone ? `<p>تليفون: ${shopPhone}</p>` : ''}
                            <p>فاتورة مبيعات</p>
                        </div>
                        <div class="info-box">
                            <div><span>رقم الفاتورة:</span> <strong>${invoiceNumber}</strong></div>
                            <div><span>التاريخ:</span> <strong>${dateStr}</strong></div>
                            <div><span>العميل:</span> <strong>${customerName}</strong></div>
                            <div><span>الدفع:</span> <strong>${paymentStatus === 'paid' ? 'نقدي (كاش)' : 'آجل (دين)'}</strong></div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>الصنف</th>
                                    <th class="col-qty">العدد</th>
                                    <th class="col-price">السعر</th>
                                    <th class="col-total">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cartItems.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td class="col-qty">${item.qty}</td>
                                        <td class="col-price">${Number(item.price).toLocaleString()}</td>
                                        <td class="col-total">${(item.qty * item.price).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="summary">
                            <div class="summary-row">
                                <span>إجمالي القطع:</span>
                                <span>${cartItems.reduce((sum, i) => sum + i.qty, 0)} قطعة</span>
                            </div>
                            <div class="summary-row final-total">
                                <span>الصافي المطلوب:</span>
                                <span>${Number(finalTotal).toLocaleString()} ج.م</span>
                            </div>
                        </div>
                        <div class="footer">
                            <p>شكراً لثقتكم بنا!</p>
                            <p style="font-size: 9px; color: #666; margin-top: 10px;">Powered by Mentra ERP</p>
                        </div>
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
        } catch (e) {
            console.error("خطأ في الطباعة:", e);
        }
    }

    window.processCheckout = async (method) => {
        if (state.cart.length === 0) {
            Swal.fire({ icon: 'error', title: 'الفاتورة فارغة', toast: true, position: 'top', timer: 2000, showConfirmButton: false }); return;
        }
        
        const finalTotal = parseFloat(document.querySelector('.sync-final-total').innerText);
        if(finalTotal < 0) {
            Swal.fire({ icon: 'error', title: 'الخصم غير منطقي', toast: true, position: 'top', timer: 2000, showConfirmButton: false }); return;
        }

        const paymentStatus = document.querySelector('.sync-status').value; 
        let customerName = document.querySelector('.sync-customer').value.trim();
        
        // قراءة حالة مربع اختيار الطباعة
        const shouldPrint = document.querySelector('.sync-print').checked;

        if (paymentStatus === 'pending' && customerName === '') {
            playFeedback('delete');
            Swal.fire({ 
                icon: 'warning', 
                title: 'مطلوب اسم العميل', 
                text: 'لا يمكن تسجيل فاتورة آجلة (دين) بدون تحديد اسم العميل.', 
                toast: true, position: 'top', timer: 3000, showConfirmButton: false 
            }); 
            return;
        }

        if (customerName === '') customerName = "عميل نقدي";

        try {
            const discountApplied = parseFloat(document.querySelector('.sync-discount').value) || 0;
            const today = new Date().toISOString(); 
            const generatedInvoiceNumber = 'INV-' + Date.now().toString().slice(-6);
            
            // حفظ بيانات الكارت لاستخدامها في الطباعة قبل إفراغه
            const itemsToPrint = [...state.cart]; 
            
            await db.transaction('rw', db.invoices, db.invoice_items, db.products, db.journal, db.journal_items, db.accounts, async () => {
                const invId = await db.invoices.add({
                    invoice_number: generatedInvoiceNumber,
                    customer_vendor_name: customerName,
                    date: today,
                    total: finalTotal,
                    method: method,
                    type: 'SALE',
                    status: paymentStatus, 
                    discount: discountApplied
                });

                let totalCost = 0;
                let totalRevenue = 0;

                for (let item of state.cart) {
                    await db.invoice_items.add({
                        invoice_id: invId,
                        product_id: item.id,
                        product_name: item.name,
                        price: item.price,
                        cost: item.cost || 0,
                        qty: item.qty,
                        total_item: item.price * item.qty,
                        total_cost: (item.cost || 0) * item.qty
                    });

                    const p = await db.products.get(item.id);
                    if (p) {
                        await db.products.update(item.id, { stock_qty: (parseFloat(p.stock_qty) || 0) - item.qty });
                        totalCost += (item.cost || 0) * item.qty;
                    }
                    totalRevenue += item.price * item.qty;
                }

                await createSalesJournalEntry(invId, finalTotal, totalCost, totalRevenue, method, today, paymentStatus);
            });

            playFeedback('success');
            
            const successMsg = paymentStatus === 'pending' ? 'تم تسجيل الفاتورة آجلة ⏳' : 'تم التحصيل بنجاح 🎉';
            Swal.fire({ title: successMsg, text: `الإجمالي: ${finalTotal.toFixed(2)}`, icon: 'success', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-3xl' } });

            // إذا كان المستخدم قد فعل خيار الطباعة، قم بفتح الفاتورة
            if (shouldPrint) {
                await printReceipt(generatedInvoiceNumber, customerName, itemsToPrint, finalTotal, paymentStatus);
            }

            // إعادة تعيين الشاشة
            state.cart = [];
            syncInputs('sync-customer', '');
            syncInputs('sync-discount', 0);
            syncInputs('sync-status', 'paid'); 
            document.getElementById('smart-search').value = '';
            document.getElementById('search-results').innerHTML = '<p style="font-size:.7rem;color:#94a3b8;font-weight:700;width:100%;text-align:center;padding:6px 0"><i class="fas fa-search" style="margin-left:4px"></i> اكتب للبحث</p>';
            renderCart();

        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'حدث خطأ', text: e.message });
        }
    };

    // دالة إنشاء القيود المحاسبية للمبيعات
    async function createSalesJournalEntry(invoiceId, totalAmount, totalCost, totalRevenue, paymentMethod, date, paymentStatus) {
        try {
            await ensureDefaultAccountsExist();
            
            const cashAccount = await db.accounts.where('code').equals('1001').first();
            const bankAccount = await db.accounts.where('code').equals('1002').first();
            const receivableAccount = await db.accounts.where('code').equals('1003').first(); 
            const salesRevenueAccount = await db.accounts.where('code').equals('4001').first();
            const cogsAccount = await db.accounts.where('code').equals('5001').first();
            const inventoryAccount = await db.accounts.where('code').equals('6001').first();

            const journalId = await db.journal.add({
                date: date,
                ref_no: `INV-${invoiceId}`,
                description: `مبيعات - فاتورة رقم INV-${invoiceId}`,
                total: totalAmount,
                type: 'SALE'
            });

            if (paymentStatus === 'pending' && receivableAccount) {
                await db.journal_items.add({ journal_id: journalId, account_id: receivableAccount.id, debit: totalAmount, credit: 0, description: `مبيعات آجلة (دين مستحق) - INV-${invoiceId}` });
            } else {
                if (paymentMethod === 'CASH' && cashAccount) {
                    await db.journal_items.add({ journal_id: journalId, account_id: cashAccount.id, debit: totalAmount, credit: 0, description: `إيرادات بيع نقد - INV-${invoiceId}` });
                } else if (paymentMethod === 'CARD' && bankAccount) {
                    await db.journal_items.add({ journal_id: journalId, account_id: bankAccount.id, debit: totalAmount, credit: 0, description: `إيرادات بيع شبكة - INV-${invoiceId}` });
                }
            }

            if (salesRevenueAccount) {
                await db.journal_items.add({ journal_id: journalId, account_id: salesRevenueAccount.id, debit: 0, credit: totalRevenue, description: `إيرادات المبيعات - INV-${invoiceId}` });
            }

            if (cogsAccount && totalCost > 0) {
                await db.journal_items.add({ journal_id: journalId, account_id: cogsAccount.id, debit: totalCost, credit: 0, description: `تكلفة البضاعة المباعة - INV-${invoiceId}` });
            }
            if (inventoryAccount && totalCost > 0) {
                await db.journal_items.add({ journal_id: journalId, account_id: inventoryAccount.id, debit: 0, credit: totalCost, description: `تخفيض المخزون - INV-${invoiceId}` });
            }

        } catch (error) {
            console.error('Error creating journal entry:', error);
        }
    }

    async function ensureDefaultAccountsExist() {
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

    function playFeedback(type = 'click') {
        if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([100, 50, 100]);
            else if (type === 'delete') navigator.vibrate(100);
            else navigator.vibrate(40);
        }
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            
            if (type === 'click' || type === 'tap') { 
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1); 
            }
            if (type === 'success') { 
                osc.type = 'triangle'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3); 
            }
            if (type === 'delete') {
                osc.type = 'square'; osc.frequency.setValueAtTime(200, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15); 
            }
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    // --- دوال مسح الباركود بالكاميرا ---
    let codeReader = null;
    let currentStream = null;

    window.startBarcodeScanner = async () => {
        try {
            if (typeof ZXing === 'undefined') {
                Swal.fire({ icon: 'error', title: 'مكتبة المسح غير متاحة', text: 'يرجى تحديث الصفحة', timer: 3000, showConfirmButton: false });
                return;
            }

            codeReader = new ZXing.BrowserMultiFormatReader();
            const modal = document.getElementById('scanner-modal');
            const video = document.getElementById('scanner-video');
            const status = document.getElementById('scanner-status');

            modal.classList.add('active');
            modal.classList.add('scanner-scanning');
            status.textContent = 'جاري تشغيل الكاميرا...';

            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = currentStream;
                await video.play();

                status.textContent = 'ضع الباركود داخل الإطار';

                codeReader.decodeFromVideoDevice(undefined, video, (result, err) => {
                    if (result) handleBarcodeResult(result.text);
                });
            } catch (cameraError) {
                stopBarcodeScanner();
                Swal.fire({ icon: 'error', title: 'لا يمكن الوصول للكاميرا', timer: 3000, showConfirmButton: false });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'خطأ في تشغيل المسح', timer: 3000, showConfirmButton: false });
        }
    };

    window.stopBarcodeScanner = () => {
        const modal = document.getElementById('scanner-modal');
        const video = document.getElementById('scanner-video');
        if (codeReader) { codeReader.reset(); codeReader = null; }
        if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); currentStream = null; }
        if (video.srcObject) { video.srcObject = null; }
        modal.classList.remove('active', 'scanner-scanning', 'scanner-found');
    };

    window.handleBarcodeResult = async (barcodeText) => {
        const modal = document.getElementById('scanner-modal');
        const status = document.getElementById('scanner-status');

        modal.classList.remove('scanner-scanning');
        modal.classList.add('scanner-found');
        status.textContent = 'تم قراءة الباركود: ' + barcodeText;

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        try {
            const products = await db.products.filter(p => p.barcode === barcodeText || p.sku === barcodeText).toArray();
            if (products.length > 0) {
                addToCart(products[0]);
                setTimeout(() => {
                    stopBarcodeScanner();
                    document.getElementById('smart-search').focus();
                }, 1000);
            } else {
                status.textContent = 'المنتج غير موجود';
                modal.classList.remove('scanner-found');
                modal.classList.add('scanner-scanning');
            }
        } catch (error) { stopBarcodeScanner(); }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('scanner-modal').classList.contains('active')) {
            stopBarcodeScanner();
        }
    });

    renderCart();
})();