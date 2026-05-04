/**
 * MentraERPLite - Settings & Smart Backup Module v8.0 (Mobile Optimized)
 * الميزات: إعدادات، تصدير واستيراد جزئي/كلي، واجهة موبايل احترافية
 */

window.handleProfileUpdate = async function() {
    const btn = document.getElementById('submit-btn');
    if (!btn || btn.disabled) return;

    const profileData = {
        full_name: document.getElementById('set_fullname').value.trim(),
        username: document.getElementById('set_username').value.trim(),
        email: document.getElementById('set_email').value.trim(),
        phone: document.getElementById('set_phone').value.trim(),
        shop_name: document.getElementById('set_store').value.trim()
    };

    if (!profileData.full_name || !profileData.username) {
        Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'يرجى إدخال الاسم واسم المستخدم', customClass: {popup: 'rounded-3xl'} });
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin ml-2"></i> جاري الحفظ...`;

    try {
        await db.settings.put({
            id: 1, 
            project_name: 'MentraERPLite',
            shop_name: profileData.shop_name,
            phone: profileData.phone,
            email: profileData.email
        });

        const firstUser = await db.local_users.toCollection().first();
        if (firstUser) {
            await db.local_users.update(firstUser.id, { username: profileData.username, full_name: profileData.full_name });
        } else {
            await db.local_users.add({ username: profileData.username, full_name: profileData.full_name, role: 'admin' });
        }

        Swal.fire({
            icon: 'success', title: 'تم الحفظ', text: 'تم تحديث إعدادات النظام المحلي بنجاح', confirmButtonColor: '#10b981', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}
        }).then(() => {
            // تحديث الاسم المعروض في الـ Sidebar بدون عمل ريلود
            document.getElementById('user-name').innerText = profileData.full_name;
            localStorage.setItem('userName', profileData.full_name);
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-save text-lg"></i> حفظ التغييرات`;
        });

    } catch (error) {
        console.error("Dexie Error:", error);
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل حفظ البيانات', customClass: {popup: 'rounded-3xl'} });
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save text-lg"></i> حفظ التغييرات`;
    }
};

// --- وظائف الاستخراج والاسترجاع الذكية (Backup & Restore) ---

window.exportData = async (type) => {
    try {
        let dataToExport = {};
        let filename = `Mentra_${type}_${new Date().toISOString().split('T')[0]}.json`;

        if (type === 'sales') {
            dataToExport.invoices = await db.invoices.toArray();
            dataToExport.invoice_items = await db.invoice_items.toArray();
        } else if (type === 'inventory') {
            dataToExport.products = await db.products.toArray();
        } else if (type === 'full') {
            dataToExport.invoices = await db.invoices.toArray();
            dataToExport.invoice_items = await db.invoice_items.toArray();
            dataToExport.products = await db.products.toArray();
            dataToExport.settings = await db.settings.toArray();
            dataToExport.local_users = await db.local_users.toArray();
            dataToExport.stock_movements = await db.stock_movements.toArray();
            filename = `Mentra_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        Swal.fire({icon: 'success', title: 'تم التصدير', text: 'تم تحميل الملف بنجاح على جهازك', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});

    } catch (err) {
        console.error(err);
        Swal.fire({icon: 'error', title: 'فشل التصدير', text: err.message, customClass: {popup: 'rounded-3xl'}});
    }
};

window.triggerFileInput = () => document.getElementById('import-file').click();

window.importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            const res = await Swal.fire({
                title: 'تأكيد الاسترجاع',
                text: "سيتم دمج البيانات المرفوعة مع البيانات الحالية. هل أنت متأكد؟",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'نعم، ابدأ الاسترجاع',
                cancelButtonText: 'إلغاء',
                customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
            });

            if (!res.isConfirmed) {
                document.getElementById('import-file').value = ""; // Reset
                return;
            }

            Swal.fire({title: 'جاري الاسترجاع...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading(), customClass: {popup: 'rounded-3xl'}});

            await db.transaction('rw', db.tables, async () => {
                // استرجاع ذكي: إذا كان الجدول موجوداً في الملف المرفوع، نضيفه للقاعدة
                if (importedData.invoices) await db.invoices.bulkPut(importedData.invoices);
                if (importedData.invoice_items) await db.invoice_items.bulkPut(importedData.invoice_items);
                if (importedData.products) await db.products.bulkPut(importedData.products);
                if (importedData.stock_movements) await db.stock_movements.bulkPut(importedData.stock_movements);
                
                // في حالة الاسترجاع الكامل
                if (importedData.settings) await db.settings.bulkPut(importedData.settings);
                if (importedData.local_users) await db.local_users.bulkPut(importedData.local_users);
            });

            document.getElementById('import-file').value = ""; // Reset
            
            Swal.fire({icon: 'success', title: 'نجاح!', text: 'تم استرجاع ودمج البيانات بنجاح', customClass: {popup: 'rounded-3xl'}}).then(() => {
                location.reload();
            });

        } catch (err) {
            console.error(err);
            document.getElementById('import-file').value = "";
            Swal.fire({icon: 'error', title: 'ملف تالف', text: 'تأكد من أن الملف بصيغة JSON خاصة بنظام Mentra', customClass: {popup: 'rounded-3xl'}});
        }
    };
    reader.readAsText(file);
};


(async function() {
    const displayArea = document.getElementById('main-content-display');
    if (!displayArea) return;

    let settings = await db.settings.get(1) || {};
    let user = await db.local_users.toCollection().first() || {};

    displayArea.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24 px-2 md:px-0 text-right" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- بطاقة الترخيص -->
        <div class="bg-emerald-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full -mr-20 -mt-20 md:-mr-32 md:-mt-32 blur-3xl pointer-events-none"></div>
            
            <div class="relative z-10 w-full md:w-auto text-center md:text-right">
                <h2 class="text-xl md:text-2xl font-black italic">إعدادات النظام المحلي</h2>
                <div class="mt-2">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black bg-white/20 border border-white/30 uppercase tracking-widest">
                        <i class="fas fa-database ml-2"></i> بيانات Dexie.js 
                    </span>
                </div>
            </div>
            
            <div class="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl md:rounded-3xl backdrop-blur-xl text-center shrink-0">
                <p class="text-[9px] uppercase font-black text-emerald-100 mb-1">حالة الترخيص</p>
                <p class="font-black text-lg md:text-xl">مدى الحياة ✨</p>
            </div>
        </div>

        <!-- إعدادات الملف الشخصي والمحل -->
        <div class="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-lg border border-slate-50">
            <h3 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><i class="fas fa-user-cog text-blue-500"></i> بيانات النشاط والمدير</h3>
            
            <form id="settingsForm" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase px-1">الاسم الكامل</label>
                    <input type="text" id="set_fullname" value="${user.full_name || ''}" class="w-full bg-slate-50 p-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base border border-slate-100 focus:border-emerald-500 outline-none transition-all">
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase px-1">اسم الدخول</label>
                    <input type="text" id="set_username" value="${user.username || ''}" class="w-full bg-slate-50 p-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base border border-slate-100 focus:border-emerald-500 outline-none transition-all">
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase px-1">البريد (اختياري)</label>
                    <input type="email" id="set_email" value="${settings.email || ''}" class="w-full bg-slate-50 p-4 rounded-xl md:rounded-2xl font-bold text-[16px] md:text-base border border-slate-100 focus:border-emerald-500 outline-none transition-all">
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase px-1">رقم هاتف النشاط</label>
                    <input type="tel" id="set_phone" value="${settings.phone || ''}" dir="ltr" class="w-full bg-slate-50 p-4 rounded-xl md:rounded-2xl font-bold text-[16px] md:text-base border border-slate-100 focus:border-emerald-500 outline-none transition-all text-right">
                </div>
                <div class="md:col-span-2 space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase px-1">اسم المتجر (يظهر في الفواتير)</label>
                    <input type="text" id="set_store" value="${settings.shop_name || ''}" class="w-full bg-slate-50 p-4 rounded-xl md:rounded-2xl font-black text-[16px] md:text-lg border border-slate-100 focus:border-emerald-500 outline-none transition-all">
                </div>
                
                <button type="button" id="submit-btn" onclick="handleProfileUpdate()" class="md:col-span-2 bg-slate-900 text-white p-4 md:p-5 rounded-xl md:rounded-2xl font-black text-sm hover:bg-emerald-600 active:scale-95 transition-all shadow-md mt-2 flex items-center justify-center gap-2">
                    <i class="fas fa-save text-lg"></i> حفظ التغييرات
                </button>
            </form>
        </div>

        <!-- نظام النسخ الاحتياطي الذكي -->
        <div class="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-lg border border-slate-50">
            <h3 class="text-lg font-black text-slate-800 mb-2 flex items-center gap-2"><i class="fas fa-cloud-download-alt text-rose-500"></i> إدارة البيانات والنسخ الاحتياطي</h3>
            <p class="text-xs font-bold text-slate-400 mb-6">استخرج بياناتك كملفات JSON واحتفظ بها، أو استرجعها في أي وقت.</p>
            
            <!-- إدخال ملف الاسترجاع المخفي -->
            <input type="file" id="import-file" accept=".json" class="hidden" onchange="importData(event)">

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <!-- تصدير جزئي -->
                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                    <h4 class="font-black text-sm text-slate-700 text-center"><i class="fas fa-box text-blue-500 ml-1"></i> المخزون والأصناف</h4>
                    <button onclick="exportData('inventory')" class="bg-white text-blue-600 border border-blue-100 p-3 rounded-xl font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">تصدير (Export)</button>
                    <button onclick="triggerFileInput()" class="bg-blue-600 text-white p-3 rounded-xl font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all">استيراد (Import)</button>
                </div>

                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                    <h4 class="font-black text-sm text-slate-700 text-center"><i class="fas fa-file-invoice text-emerald-500 ml-1"></i> المبيعات والفواتير</h4>
                    <button onclick="exportData('sales')" class="bg-white text-emerald-600 border border-emerald-100 p-3 rounded-xl font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all">تصدير (Export)</button>
                    <button onclick="triggerFileInput()" class="bg-emerald-600 text-white p-3 rounded-xl font-bold text-xs hover:bg-emerald-700 active:scale-95 transition-all">استيراد (Import)</button>
                </div>

                <!-- النسخة الكاملة -->
                <div class="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col justify-center gap-3 md:col-span-1 sm:col-span-2">
                    <h4 class="font-black text-sm text-rose-700 text-center"><i class="fas fa-database ml-1"></i> النظام بالكامل</h4>
                    <p class="text-[9px] text-center text-rose-500 font-bold mb-1">نسخة احتياطية شاملة</p>
                    <button onclick="exportData('full')" class="bg-rose-600 text-white p-4 rounded-xl font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-download"></i> إنشاء نسخة
                    </button>
                </div>

            </div>
        </div>

        <!-- إعلان النسخة السحابية -->
        <div class="bg-gradient-to-r from-slate-900 via-[#0f172a] to-blue-900 rounded-[2rem] p-1 shadow-lg">
            <div class="bg-white/5 backdrop-blur-md rounded-[1.8rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5">
                <div class="flex items-center gap-4 text-center md:text-right">
                    <div class="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white text-xl md:text-2xl shadow-lg shrink-0">
                        <i class="fas fa-cloud"></i>
                    </div>
                    <div>
                        <h4 class="text-white font-black text-sm md:text-base mb-1">هل تمتلك أكثر من فرع؟</h4>
                        <p class="text-blue-200/80 text-[10px] md:text-[11px] font-bold leading-relaxed max-w-sm">
                            النسخة السحابية <span class="text-blue-400">Mentra Business</span> تدعم تعدد الفروع والأجهزة معاً والمزامنة اللحظية للمخازن.
                        </p>
                    </div>
                </div>
                <a href="https://wa.me/201211934816" target="_blank" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 group active:scale-95">
                    <i class="fab fa-whatsapp text-lg text-emerald-400 group-hover:scale-110 transition-transform"></i>
                    تواصل للمبيعات
                </a>
            </div>
        </div>

    </div>`;
})();