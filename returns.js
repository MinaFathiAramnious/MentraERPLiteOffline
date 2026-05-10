/**
 * MENTRA ERP - Smart Returns Engine (v1.0)
 * نظام إدارة مرتجعات المبيعات - متصل بالمخازن والقيود العكسية
 */

(function() {
    let state = {
        cart: [],
        deduction: 0 // خصم من قيمة المرتجع (رسوم إرجاع إن وجدت)
    };

    const returnsHTML = `
    <style>
        /* ===== Returns Layout (Amber Theme) ===== */
        :root {
            --ret-primary: #f59e0b; /* Amber 500 */
            --ret-primary-hover: #d97706; /* Amber 600 */
            --ret-light: #fffbeb; /* Amber 50 */
            --ret-border: #fde68a; /* Amber 200 */
        }

        #ret-wrap { display:flex; flex-direction:column; height:100%; font-family:inherit; direction:rtl; -webkit-tap-highlight-color:transparent; }

        #ret-search-bar { flex-shrink:0; background:var(--ret-light); border-radius:1.5rem; padding:12px 14px; margin-bottom:10px; border:1px solid var(--ret-border); box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        #ret-search-bar input { width:100%; background:#fff; border:2px solid transparent; border-radius:1rem; padding:10px 88px 10px 12px; font-size:16px; font-weight:700; color:#334155; outline:none; transition:border-color 0.2s; }
        #ret-search-bar input:focus { border-color:var(--ret-primary); }
        #ret-search-bar .barcode-icon { position:absolute; right:56px; top:50%; transform:translateY(-50%); color:var(--ret-primary); font-size:1.1rem; }
        #ret-search-bar .camera-btn { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:36px; height:36px; background:var(--ret-primary); color:#fff; border:none; border-radius:0.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1rem; transition:all 0.2s; box-shadow:0 2px 5px rgba(245,158,11,0.3); }
        #ret-search-bar .camera-btn:hover { background:var(--ret-primary-hover); transform:translateY(-50%) scale(1.05); }
        #ret-search-bar .camera-btn:active { transform:translateY(-50%) scale(0.95); }
        
        #ret-search-results { display:flex; gap:10px; overflow-x:auto; padding:8px 0 4px; scrollbar-width:none; }
        #ret-search-results::-webkit-scrollbar { display:none; }

        #ret-cart-wrap { flex:1; min-height:0; overflow-y:auto; background:white; border-radius:1.5rem; border:1px solid #f1f5f9; box-shadow:0 1px 3px rgba(0,0,0,0.05); padding:12px; scrollbar-width:none; }
        #ret-cart-wrap::-webkit-scrollbar { display:none; }

        #ret-bottom-bar { flex-shrink:0; background:#0f172a; border-radius:1.5rem 1.5rem 0 0; padding:10px 12px 12px; box-shadow:0 -4px 20px rgba(0,0,0,.35); }

        @media (min-width: 1024px) {
            #ret-wrap { flex-direction:row; gap:24px; }
            #ret-left  { flex:1; min-width:0; display:flex; flex-direction:column; }
            #ret-right { width:340px; flex-shrink:0; }
            #ret-bottom-bar { display:none !important; }
            #ret-desktop-panel { display:flex !important; flex-direction:column; background:#0f172a; border-radius:1.5rem; padding:2rem; color:#fff; box-shadow:0 10px 25px -5px rgba(0,0,0,0.3); position:sticky; top:1rem; }
        }
        @media (max-width: 1023px) {
            #ret-left  { flex:1; min-width:0; display:flex; flex-direction:column; }
            #ret-right { display:none; }
        }

        .ret-search-card { background:white; padding:10px 12px; border-radius:1rem; border:1px solid #e2e8f0; cursor:pointer; min-width:110px; flex-shrink:0; transition:all 0.2s; }
        .ret-search-card:active { background:var(--ret-light); border-color:var(--ret-primary); }
        .ret-search-card .sc-name { font-weight:900; font-size:.75rem; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px; }
        .ret-search-card .sc-price { font-weight:900; font-size:.85rem; color:var(--ret-primary-hover); margin-top:2px; }

        .ret-cart-card { background:#fff; border:1px solid #f1f5f9; border-radius:1rem; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02); margin-bottom:10px; }
        .ret-cart-card .cc-info { flex:1; min-width:0; }
        .ret-cart-card .cc-name { font-weight:900; font-size:.85rem; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ret-cart-card .cc-unit { font-size:.7rem; color:#94a3b8; font-weight:700; margin-top:2px; }
        .ret-cart-card .cc-controls { display:flex; align-items:center; gap:12px; flex-shrink:0; }
        
        .ret-qty-box { display:flex; align-items:center; gap:4px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.5rem; padding:4px; }
        .ret-qty-btn { width:34px; height:34px; border-radius:0.4rem; background:#fff; border:none; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; color:#475569; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition:transform 0.1s; }
        .ret-qty-btn:active { transform:scale(.88); }
        .ret-qty-num { font-weight:900; font-size:.9rem; color:#1e293b; width:26px; text-align:center; }
        
        .ret-cc-total-wrap { display:flex; flex-direction:column; align-items:flex-end; min-width:64px; }
        .ret-cc-total { font-weight:900; font-size:.95rem; color:var(--ret-primary-hover); }
        .ret-cc-del { font-size:.65rem; font-weight:700; color:#ef4444; cursor:pointer; margin-top:3px; background:none; border:none; }

        /* Shared Dashboard & Mobile Bottom Bar Styles */
        .ret-total-val { font-size:1.5rem; font-weight:900; color:#fff; font-family:monospace; line-height:1; }
        .ret-sync-deduction { width:46px; background:transparent; border:none; color:#fff; font-size:15px; text-align:center; outline:none; font-family:monospace; font-weight:900; border-bottom:2px solid rgba(239,68,68,0.3); }
        .ret-sync-customer { flex:1; min-width:0; background:#1e293b; border:1px solid #334155; border-radius:0.5rem; padding:6px 10px; font-size:14px; font-weight:700; color:#fff; outline:none; }
        
        .ret-btn { border:none; cursor:pointer; border-radius:1rem; padding:12px; font-weight:900; font-size:.9rem; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); transition:all 0.2s;}
        .ret-btn:active { transform:scale(0.96); }
        .ret-cash { background:#ef4444; color:#fff; } 
        .ret-card { background:#f59e0b; color:#fff; }

        /* Scanner Modal */
        #ret-scanner-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.9); z-index:9999; direction:ltr; }
        #ret-scanner-modal.active { display:flex; flex-direction:column; }
        #ret-scanner-header { background:#0f172a; color:#fff; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
        #ret-scanner-container { flex:1; position:relative; display:flex; justify-content:center; align-items:center; }
        #ret-scanner-video { width:100%; height:100%; object-fit:cover; }
        #ret-scanner-overlay { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:280px; height:280px; border:3px solid var(--ret-primary); border-radius:12px; pointer-events:none; }
        #ret-scanner-status { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; padding:8px 16px; border-radius:20px; font-weight:700; font-size:.9rem; }
    </style>

    <div id="ret-wrap">
        <!-- اليسار: البحث والعربة -->
        <div id="ret-left">
            <div class="flex items-center gap-2 mb-2 px-2">
                <i class="fas fa-undo-alt text-amber-500 text-xl"></i>
                <div>
                    <h2 class="text-slate-800 font-black text-lg leading-tight">مرتجع مبيعات</h2>
                    <p class="text-[9px] text-slate-500 font-bold">إرجاع بضاعة للمخزن ورد أموال</p>
                </div>
            </div>

            <div id="ret-search-bar">
                <div style="position:relative">
                    <i class="fas fa-barcode barcode-icon"></i>
                    <input type="text" id="ret-smart-search" placeholder="ابحث باسم المنتج أو الباركود لإرجاعه...">
                    <button class="camera-btn" onclick="startRetBarcodeScanner()" title="مسح الباركود بالكاميرا">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <div id="ret-search-results">
                    <p style="font-size:.7rem;color:#94a3b8;font-weight:700;width:100%;text-align:center;padding:6px 0">
                        <i class="fas fa-search" style="margin-left:4px"></i> اكتب اسم أو باركود الصنف المرتجع
                    </p>
                </div>
            </div>

            <div id="ret-cart-wrap">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 4px">
                    <h3 style="font-weight:900;font-size:.9rem;color:#334155">الأصناف المستردة</h3>
                    <button onclick="clearRetCart()" style="font-size:.7rem;font-weight:700;color:#ef4444;background:#fef2f2;border:none;padding:6px 12px;border-radius:.5rem;cursor:pointer">إلغاء المرتجع</button>
                </div>
                <div id="ret-cart-items-container"></div>
            </div>
        </div>

        <!-- اليمين: ديسكتوب panel -->
        <div id="ret-right">
            <div id="ret-desktop-panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <span style="color:#94a3b8;font-size:.7rem;font-weight:900;text-transform:uppercase;">ملخص المرتجع</span>
                    <span style="background:rgba(245,158,11,.2);color:#fbbf24;font-size:.6rem;font-weight:900;padding:4px 8px;border-radius:.4rem">RET-${Date.now().toString().slice(-4)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:.8rem; font-weight:700; color:#94a3b8;">
                    <span>قيمة البضاعة</span>
                    <span class="ret-sync-sub-total" style="font-family:monospace">0.00</span>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,.05); border-radius:0.5rem; padding:8px 12px; margin-bottom:16px;">
                    <span style="font-size:.8rem; font-weight:900; color:#ef4444;">خصم (رسوم إرجاع)</span>
                    <input type="number" class="ret-sync-deduction" oninput="updateRetTotals(this.value)" value="0">
                </div>
                <div style="border-top:1px solid rgba(255,255,255,.1); padding-top:16px; text-align:center; margin-bottom:20px;">
                    <div style="font-size:.7rem; font-weight:900; color:#fbbf24;">المبلغ المرتجع للعميل</div>
                    <div class="ret-sync-final-total" style="font-size:3.5rem; font-weight:900; color:#fff; font-family:monospace; line-height:1.1;">0.00</div>
                </div>
                <input type="text" class="ret-sync-customer" oninput="syncRetInputs('ret-sync-customer', this.value)" placeholder="اسم العميل (اختياري)..." style="width:100%; margin-bottom:12px; box-sizing:border-box;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button class="ret-btn ret-cash" onclick="processRefund('CASH')"><i class="fas fa-hand-holding-usd"></i> إرجاع نقدي</button>
                    <button class="ret-btn ret-card" onclick="processRefund('CARD')"><i class="fas fa-credit-card"></i> إرجاع شبكة</button>
                </div>
            </div>
        </div>

        <!-- الشريط السفلي (موبايل فقط) -->
        <div id="ret-bottom-bar" dir="rtl">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <div style="flex-shrink:0;">
                    <div style="font-size:8px; font-weight:900; color:#fbbf24; text-transform:uppercase;">المبلغ للعميل</div>
                    <div class="ret-sync-final-total ret-total-val">0.00</div>
                </div>
                <div style="display:flex; align-items:center; gap:4px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:0.5rem; padding:5px 8px; flex-shrink:0;">
                    <span style="font-size:8px; font-weight:900; color:#ef4444;">رسوم</span>
                    <input type="number" class="ret-sync-deduction" oninput="updateRetTotals(this.value)" value="0" placeholder="0">
                </div>
                <input type="text" class="ret-sync-customer" oninput="syncRetInputs('ret-sync-customer', this.value)" placeholder="اسم العميل...">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <button class="ret-btn ret-cash" onclick="processRefund('CASH')"><i class="fas fa-hand-holding-usd"></i> إرجاع نقدي</button>
                <button class="ret-btn ret-card" onclick="processRefund('CARD')"><i class="fas fa-credit-card"></i> إرجاع شبكة</button>
            </div>
        </div>
    </div>

    <!-- Scanner Modal -->
    <div id="ret-scanner-modal">
        <div id="ret-scanner-header">
            <span style="font-weight:900;">مسح الباركود بالكاميرا للمرتجع</span>
            <button onclick="stopRetBarcodeScanner()" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <div id="ret-scanner-container">
            <video id="ret-scanner-video"></video>
            <div id="ret-scanner-overlay"></div>
            <div id="ret-scanner-status">ضع الباركود داخل الإطار</div>
        </div>
    </div>
    `;

    document.getElementById('main-content-display').innerHTML = returnsHTML;

    // --- Layout Adjustment ---
    function applyRetHeight() {
        const wrap = document.getElementById('ret-wrap');
        const container = document.getElementById('main-content-display');
        if (!wrap || !container) return;
        const rect = container.getBoundingClientRect();
        const bottomBar = document.getElementById('ret-bottom-bar');
        const bbH = (bottomBar && window.innerWidth < 1024) ? bottomBar.offsetHeight : 0;
        wrap.style.height = (window.innerHeight - rect.top - bbH) + 'px';
    }
    requestAnimationFrame(() => applyRetHeight());
    window.addEventListener('resize', applyRetHeight);

    // --- Logic ---
    window.setRetText = (className, value) => { document.querySelectorAll('.' + className).forEach(el => el.innerText = value); };
    window.syncRetInputs = (className, value) => { document.querySelectorAll('.' + className).forEach(el => { if(el.value !== value) el.value = value; }); };

    window.liveRetSearch = async (val) => {
        const resultsArea = document.getElementById('ret-search-results');
        if (val.trim().length === 0) {
            resultsArea.innerHTML = '<p style="font-size:.7rem;color:#94a3b8;font-weight:700;width:100%;text-align:center;padding:6px 0">اكتب للبحث</p>';
            return;
        }

        try {
            const products = await db.products.filter(p => (p.name_ar && p.name_ar.includes(val)) || p.sku === val || p.barcode === val).limit(8).toArray();

            if (products.length === 1 && (products[0].sku === val || products[0].barcode === val)) {
                addRetToCart(products[0]);
                document.getElementById('ret-smart-search').value = '';
                resultsArea.innerHTML = '<p style="font-size:.7rem;color:#f59e0b;font-weight:700;width:100%;text-align:center;padding:6px 0">تم الإدراج للمرتجع</p>';
                return;
            }

            if (products.length > 0) {
                resultsArea.innerHTML = products.map(p => {
                    const encoded = JSON.stringify(p).replace(/'/g, "&#39;");
                    return `<div onclick='addRetToCart(${encoded})' class="ret-search-card">
                        <div class="sc-name">${p.name_ar}</div>
                        <div class="sc-price">${Number(p.price).toFixed(2)}</div>
                        </div>`;
                }).join('');
            } else {
                resultsArea.innerHTML = '<p style="font-size:.7rem;color:#ef4444;font-weight:700;width:100%;text-align:center;padding:6px 0">صنف غير موجود</p>';
            }
        } catch (error) { console.error(error); }
    };

    document.getElementById('ret-smart-search').addEventListener('input', (e) => liveRetSearch(e.target.value));

    window.addRetToCart = (product) => {
        const exist = state.cart.find(i => i.id === product.id);
        
        if (exist) exist.qty++;
        else {
            state.cart.unshift({
                id: product.id,
                name: product.name_ar || 'منتج',
                price: Number(product.price || 0),
                cost: Number(product.cost || 0),
                qty: 1
            });
        }
        playRetFeedback('tap');
        renderRetCart();
    };

    window.renderRetCart = () => {
        const container = document.getElementById('ret-cart-items-container');
        if (state.cart.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px 0;opacity:.4"><i class="fas fa-undo" style="font-size:3rem;color:#cbd5e1;display:block;margin-bottom:10px"></i><span style="font-size:.8rem;font-weight:700;color:#64748b">لا توجد أصناف مستردة</span></div>';
            updateRetTotals();
            return;
        }
        container.innerHTML = state.cart.map(item => `
            <div class="ret-cart-card">
                <div class="cc-info">
                    <div class="cc-name">${item.name}</div>
                    <div class="cc-unit">${item.price.toFixed(2)} للوحدة (مسترد)</div>
                </div>
                <div class="cc-controls">
                    <div class="ret-qty-box">
                        <button class="ret-qty-btn" onclick="updateRetQty(${item.id},-1)"><i class="fas fa-minus" style="font-size:.65rem"></i></button>
                        <span class="ret-qty-num">${item.qty}</span>
                        <button class="ret-qty-btn" onclick="updateRetQty(${item.id},1)"><i class="fas fa-plus" style="font-size:.65rem"></i></button>
                    </div>
                    <div class="ret-cc-total-wrap">
                        <span class="ret-cc-total">${(item.price * item.qty).toFixed(2)}</span>
                        <button class="ret-cc-del" onclick="removeRetItem(${item.id})"><i class="fas fa-times"></i> إزالة</button>
                    </div>
                </div>
            </div>
        `).join('');
        updateRetTotals();
    };

    window.updateRetTotals = (deductionVal = null) => {
        const sub = state.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
        
        let ded = 0;
        if(deductionVal !== null) {
            ded = parseFloat(deductionVal) || 0;
            syncRetInputs('ret-sync-deduction', deductionVal);
        } else {
            const el = document.querySelector('.ret-sync-deduction');
            ded = el ? (parseFloat(el.value) || 0) : 0;
        }

        const final = sub - ded;
        const finalStr = final > 0 ? final.toFixed(2) : "0.00";

        setRetText('ret-sync-sub-total', sub.toFixed(2));
        setRetText('ret-sync-final-total', finalStr);
    };

    window.updateRetQty = (id, change) => {
        const item = state.cart.find(i => i.id === id);
        if (item) {
            item.qty += change;
            if (item.qty <= 0) removeRetItem(id);
            else { playRetFeedback('tap'); renderRetCart(); }
        }
    };

    window.removeRetItem = (id) => {
        state.cart = state.cart.filter(i => i.id !== id);
        playRetFeedback('delete');
        renderRetCart();
    };

    window.clearRetCart = async () => {
        if(state.cart.length === 0) return;
        const res = await Swal.fire({ title: 'إلغاء المرتجع؟', icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'تراجع', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-3xl' } });
        if(res.isConfirmed) {
            state.cart = [];
            syncRetInputs('ret-sync-deduction', 0);
            renderRetCart();
        }
    };

    // --- الإرجاع المحاسبي والمخزني ---
    window.processRefund = async (method) => {
        if (state.cart.length === 0) {
            Swal.fire({ icon: 'error', title: 'القائمة فارغة', toast: true, position: 'top', timer: 2000, showConfirmButton: false }); return;
        }
        
        const finalRefund = parseFloat(document.querySelector('.ret-sync-final-total').innerText);
        if(finalRefund < 0) {
            Swal.fire({ icon: 'error', title: 'الرسوم أكبر من قيمة البضاعة', toast: true, position: 'top', timer: 2000, showConfirmButton: false }); return;
        }

        try {
            const customerName = document.querySelector('.ret-sync-customer').value || "عميل (مرتجع)";
            const deductionApplied = parseFloat(document.querySelector('.ret-sync-deduction').value) || 0;
            const today = new Date().toISOString(); 
            const invNumber = 'RET-' + Date.now().toString().slice(-6);
            
            await db.transaction('rw', db.invoices, db.invoice_items, db.products, db.journal, db.journal_items, db.accounts, async () => {
                
                const invId = await db.invoices.add({
                    invoice_number: invNumber,
                    customer_vendor_name: customerName,
                    date: today,
                    total: -finalRefund, 
                    method: method,
                    type: 'RETURN_SALE',
                    status: 'REFUNDED',
                    discount: deductionApplied
                });

                let totalCostReturned = 0;
                let totalRevenueReversed = 0;

                for (let item of state.cart) {
                    await db.invoice_items.add({
                        invoice_id: invId,
                        product_id: item.id,
                        product_name: item.name,
                        price: -item.price,
                        cost: -item.cost,
                        qty: item.qty, 
                        total_item: -(item.price * item.qty),
                        total_cost: -(item.cost * item.qty)
                    });

                    const p = await db.products.get(item.id);
                    if (p) {
                        await db.products.update(item.id, { stock_qty: (parseFloat(p.stock_qty) || 0) + item.qty });
                        totalCostReturned += (item.cost || 0) * item.qty;
                    }
                    totalRevenueReversed += item.price * item.qty;
                }

                const cashAccount = await db.accounts.where('code').equals('1001').first();
                const bankAccount = await db.accounts.where('code').equals('1002').first();
                const salesRevenueAccount = await db.accounts.where('code').equals('4001').first();
                const cogsAccount = await db.accounts.where('code').equals('5001').first();
                const inventoryAccount = await db.accounts.where('code').equals('6001').first();

                const journalId = await db.journal.add({
                    date: today,
                    ref_no: invNumber,
                    description: `مرتجع مبيعات - ${invNumber}`,
                    total: finalRefund,
                    type: 'RETURN_SALE'
                });

                if (method === 'CASH' && cashAccount) {
                    await db.journal_items.add({ journal_id: journalId, account_id: cashAccount.id, debit: 0, credit: finalRefund, description: `استرداد نقدي - ${invNumber}` });
                } else if (method === 'CARD' && bankAccount) {
                    await db.journal_items.add({ journal_id: journalId, account_id: bankAccount.id, debit: 0, credit: finalRefund, description: `استرداد شبكة - ${invNumber}` });
                }

                if (salesRevenueAccount) {
                    await db.journal_items.add({ journal_id: journalId, account_id: salesRevenueAccount.id, debit: totalRevenueReversed, credit: 0, description: `إلغاء إيراد - ${invNumber}` });
                }

                if (inventoryAccount && totalCostReturned > 0) {
                    await db.journal_items.add({ journal_id: journalId, account_id: inventoryAccount.id, debit: totalCostReturned, credit: 0, description: `إرجاع للمخزن - ${invNumber}` });
                }

                if (cogsAccount && totalCostReturned > 0) {
                    await db.journal_items.add({ journal_id: journalId, account_id: cogsAccount.id, debit: 0, credit: totalCostReturned, description: `إلغاء تكلفة بضاعة - ${invNumber}` });
                }
            });

            playRetFeedback('success');
            Swal.fire({ title: 'تم الإرجاع بنجاح', text: `تم رد مبلغ: ${finalRefund.toFixed(2)} وإعادة البضاعة للمخزن`, icon: 'success', timer: 2500, showConfirmButton: false, customClass: { popup: 'rounded-3xl' } });

            state.cart = [];
            syncRetInputs('ret-sync-customer', '');
            syncRetInputs('ret-sync-deduction', 0);
            document.getElementById('ret-smart-search').value = '';
            document.getElementById('ret-search-results').innerHTML = '<p style="font-size:.7rem;color:#94a3b8;font-weight:700;width:100%;text-align:center;padding:6px 0">اكتب للبحث</p>';
            renderRetCart();

        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'حدث خطأ في النظام', text: e.message });
        }
    };

    function playRetFeedback(type = 'click') {
        if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([100, 50, 100]);
            else if (type === 'delete') navigator.vibrate(100);
            else navigator.vibrate(40);
        }
    }

    // --- نظام الباركود (منسوخ ومعدل للمرتجعات) ---
    let retCodeReader = null;
    let retCurrentStream = null;

    window.startRetBarcodeScanner = async () => {
        try {
            if (typeof ZXing === 'undefined') {
                Swal.fire({ icon: 'error', title: 'المكتبة غير متاحة', toast:true, timer:2000 }); return;
            }
            retCodeReader = new ZXing.BrowserMultiFormatReader();
            const modal = document.getElementById('ret-scanner-modal');
            const video = document.getElementById('ret-scanner-video');
            const status = document.getElementById('ret-scanner-status');

            modal.classList.add('active');
            status.textContent = 'جاري تشغيل الكاميرا...';

            retCurrentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = retCurrentStream;
            await video.play();
            status.textContent = 'ضع الباركود داخل الإطار';

            retCodeReader.decodeFromVideoDevice(undefined, video, (result, err) => {
                if (result) handleRetBarcodeResult(result.text);
            });
        } catch (err) {
            stopRetBarcodeScanner();
            Swal.fire({ icon: 'error', title: 'خطأ بالكاميرا', text: 'لا يمكن الوصول للكاميرا', toast:true, timer:2000 });
        }
    };

    window.stopRetBarcodeScanner = () => {
        const modal = document.getElementById('ret-scanner-modal');
        if (retCodeReader) { retCodeReader.reset(); retCodeReader = null; }
        if (retCurrentStream) { retCurrentStream.getTracks().forEach(t => t.stop()); retCurrentStream = null; }
        modal.classList.remove('active');
    };

    window.handleRetBarcodeResult = async (barcodeText) => {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        document.getElementById('ret-scanner-status').textContent = 'تم القراءة: ' + barcodeText;
        
        try {
            const products = await db.products.filter(p => p.barcode === barcodeText || p.sku === barcodeText).toArray();
            if (products.length > 0) {
                addRetToCart(products[0]);
                setTimeout(() => { stopRetBarcodeScanner(); }, 800);
            } else {
                document.getElementById('ret-scanner-status').textContent = 'غير موجود بقاعدة البيانات';
            }
        } catch (e) { stopRetBarcodeScanner(); }
    };

    renderRetCart();
})();