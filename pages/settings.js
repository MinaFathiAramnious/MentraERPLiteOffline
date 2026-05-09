/**
 * MentraERPLite - Settings & Smart Backup Module v9.0 (Advanced & Secure)
 * الميزات: إعدادات، تغيير كلمة المرور، تصدير واستيراد، إعادة ضبط المصنع، واجهة احترافية
 */

// --- 1. حفظ الإعدادات وتحديث الملف الشخصي والباسورد ---
window.handleProfileUpdate = async function() {
    const btn = document.getElementById('submit-btn');
    if (!btn || btn.disabled) return;

    // جلب البيانات من الحقول
    const profileData = {
        full_name: document.getElementById('set_fullname').value.trim(),
        username: document.getElementById('set_username').value.trim(),
        email: document.getElementById('set_email').value.trim(),
        phone: document.getElementById('set_phone').value.trim(),
        shop_name: document.getElementById('set_store').value.trim(),
        address: document.getElementById('set_address').value.trim()
    };

    const password = document.getElementById('set_password').value;
    const confirmPassword = document.getElementById('set_password_confirm').value;

    // التحقق من الحقول الأساسية
    if (!profileData.full_name || !profileData.username) {
        Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'يرجى إدخال الاسم واسم المستخدم', customClass: {popup: 'rounded-3xl'} });
        return;
    }

    // التحقق من تطابق كلمات المرور (إذا قام بكتابة شيء)
    if (password || confirmPassword) {
        if (password !== confirmPassword) {
            Swal.fire({ icon: 'error', title: 'خطأ في كلمة المرور', text: 'كلمات المرور غير متطابقة', customClass: {popup: 'rounded-3xl'} });
            return;
        }
        if (password.length < 4) {
            Swal.fire({ icon: 'error', title: 'كلمة المرور ضعيفة', text: 'يجب أن تكون كلمة المرور 4 أحرف أو أرقام على الأقل', customClass: {popup: 'rounded-3xl'} });
            return;
        }
    }

    // بدء الحفظ
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin ml-2"></i> جاري الحفظ...`;

    try {
        // تحديث إعدادات المتجر
        await db.settings.put({
            id: 1, 
            project_name: 'MentraERPLite',
            shop_name: profileData.shop_name,
            phone: profileData.phone,
            email: profileData.email,
            address: profileData.address
        });

        // تحديث بيانات المستخدم
        const firstUser = await db.local_users.toCollection().first();
        let userUpdateData = { 
            username: profileData.username, 
            full_name: profileData.full_name 
        };
        
        // تحديث الباسورد فقط إذا قام بكتابة باسورد جديد
        if (password) {
            userUpdateData.password = password;
        }

        if (firstUser) {
            await db.local_users.update(firstUser.id, userUpdateData);
        } else {
            userUpdateData.role = 'admin';
            await db.local_users.add(userUpdateData);
        }

        Swal.fire({
            icon: 'success', title: 'تم الحفظ بنجاح', text: 'تم تحديث كافة إعدادات النظام', confirmButtonColor: '#10b981', timer: 2000, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}
        }).then(() => {
            // تحديث الاسم المعروض في الشريط الجانبي إن وجد
            const userNameEl = document.getElementById('user-name');
            if(userNameEl) userNameEl.innerText = profileData.full_name;
            localStorage.setItem('userName', profileData.full_name);
            
            // تفريغ حقول الباسورد بعد الحفظ
            document.getElementById('set_password').value = '';
            document.getElementById('set_password_confirm').value = '';
            
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-check-circle text-lg ml-1"></i> حفظ الإعدادات`;
        });

    } catch (error) {
        console.error("Dexie Error:", error);
        Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل حفظ البيانات', customClass: {popup: 'rounded-3xl'} });
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save text-lg ml-1"></i> حفظ الإعدادات`;
    }
};

// --- 2. وظائف الاستخراج والاسترجاع الذكية (Backup & Restore) ---

window.exportData = async (type) => {
    try {
        let dataToExport = {};
        let filename = `Mentra_${type}_${new Date().toISOString().split('T')[0]}.json`;

        if (type === 'sales') {
            dataToExport.invoices = await db.invoices.toArray();
            dataToExport.invoice_items = await db.invoice_items.toArray();
        } else if (type === 'inventory') {
            dataToExport.products = await db.products.toArray();
            dataToExport.stock_movements = await db.stock_movements.toArray();
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

        Swal.fire({icon: 'success', title: 'تم التصدير', text: 'تم حفظ نسخة احتياطية على جهازك', timer: 1500, showConfirmButton: false, customClass: {popup: 'rounded-3xl'}});

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
                html: `سيتم دمج البيانات من الملف <b>${file.name}</b> مع قاعدة البيانات الحالية.<br>هل أنت متأكد؟`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'نعم، ابدأ الدمج',
                cancelButtonText: 'إلغاء',
                customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl'}
            });

            if (!res.isConfirmed) {
                document.getElementById('import-file').value = ""; 
                return;
            }

            Swal.fire({title: 'جاري استرجاع البيانات...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading(), customClass: {popup: 'rounded-3xl'}});

            await db.transaction('rw', db.tables, async () => {
                if (importedData.invoices) await db.invoices.bulkPut(importedData.invoices);
                if (importedData.invoice_items) await db.invoice_items.bulkPut(importedData.invoice_items);
                if (importedData.products) await db.products.bulkPut(importedData.products);
                if (importedData.stock_movements) await db.stock_movements.bulkPut(importedData.stock_movements);
                if (importedData.settings) await db.settings.bulkPut(importedData.settings);
                if (importedData.local_users) await db.local_users.bulkPut(importedData.local_users);
            });

            document.getElementById('import-file').value = ""; 
            
            Swal.fire({icon: 'success', title: 'نجاح!', text: 'تم استرجاع ودمج البيانات بنجاح. سيتم تحديث الصفحة.', customClass: {popup: 'rounded-3xl'}}).then(() => {
                location.reload();
            });

        } catch (err) {
            console.error(err);
            document.getElementById('import-file').value = "";
            Swal.fire({icon: 'error', title: 'ملف تالف', text: 'تأكد من أن الملف بصيغة JSON خاصة بالنظام', customClass: {popup: 'rounded-3xl'}});
        }
    };
    reader.readAsText(file);
};

// --- 3. منطقة الخطر: إعادة ضبط المصنع ---
window.factoryReset = async () => {
    const res = await Swal.fire({
        title: 'تحذير شديد الخطورة!',
        html: '<p class="text-sm font-bold text-red-600 mb-4">هذا الإجراء سيمسح جميع الفواتير، المنتجات، والإعدادات نهائياً من هذا الجهاز ولا يمكن التراجع عنه.</p><p class="text-xs text-slate-500">للتأكيد، اكتب كلمة <b class="text-slate-800">مسح</b> في الصندوق أدناه:</p>',
        input: 'text',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'نعم، امسح كل البيانات',
        cancelButtonText: 'تراجع',
        customClass: {popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl', input: 'rounded-xl text-center font-bold'}
    });

    if (res.isConfirmed) {
        if (res.value !== 'مسح') {
            Swal.fire({icon: 'error', title: 'إلغاء العملية', text: 'الكلمة التي أدخلتها غير صحيحة، لم يتم مسح شيء.', customClass: {popup: 'rounded-3xl'}});
            return;
        }

        Swal.fire({title: 'جاري مسح النظام...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading(), customClass: {popup: 'rounded-3xl'}});
        
        try {
            // مسح كل الجداول
            await Promise.all(db.tables.map(table => table.clear()));
            localStorage.clear();
            
            Swal.fire({icon: 'success', title: 'تمت التهيئة', text: 'تم إعادة النظام لحالة المصنع بنجاح.', customClass: {popup: 'rounded-3xl'}}).then(() => {
                window.location.reload();
            });
        } catch (e) {
            Swal.fire({icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء مسح البيانات', customClass: {popup: 'rounded-3xl'}});
        }
    }
};


// --- التصيير وبناء الواجهة (Render) ---
(async function() {
    const displayArea = document.getElementById('main-content-display');
    if (!displayArea) return;

    let settings = await db.settings.get(1) || {};
    let user = await db.local_users.toCollection().first() || {};

    displayArea.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24 px-2 md:px-0 text-right" dir="rtl" style="-webkit-tap-highlight-color: transparent;">
        
        <!-- Header / License Card -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            <div class="relative z-10 text-center md:text-right w-full md:w-auto">
                <h2 class="text-2xl md:text-3xl font-black mb-2">إعدادات النظام</h2>
                <p class="text-emerald-100 text-sm font-bold opacity-90"><i class="fas fa-shield-alt ml-1"></i> تحكم كامل في بياناتك وصلاحياتك محلياً</p>
            </div>
            <div class="bg-white/10 border border-white/20 px-6 py-4 rounded-3xl backdrop-blur-xl text-center shrink-0">
                <p class="text-[10px] uppercase font-black text-emerald-100 mb-1 tracking-widest">نوع النسخة</p>
                <p class="font-black text-lg text-white"><i class="fas fa-laptop-house ml-1"></i> Local Lite</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- العمود الأول: إعدادات المدير والحماية -->
            <div class="lg:col-span-5 space-y-6">
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <h3 class="text-lg font-black text-slate-800 mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                        <i class="fas fa-user-shield text-indigo-500"></i> بيانات الدخول والحماية
                    </h3>
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-[11px] font-black text-slate-400 uppercase px-1">الاسم الكامل (للعرض)</label>
                            <input type="text" id="set_fullname" value="${user.full_name || ''}" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold text-sm border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder-slate-300">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[11px] font-black text-slate-400 uppercase px-1">اسم المستخدم (للتسجيل)</label>
                            <input type="text" id="set_username" value="${user.username || ''}" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold text-sm border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none transition-all" dir="ltr">
                        </div>
                        
                        <!-- قسم تغيير كلمة المرور -->
                        <div class="mt-6 pt-4 border-t border-slate-50 space-y-4 bg-indigo-50/30 p-4 rounded-2xl">
                            <h4 class="text-xs font-black text-indigo-800 flex items-center gap-2"><i class="fas fa-key"></i> تغيير كلمة المرور (اختياري)</h4>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-indigo-400 uppercase px-1">كلمة المرور الجديدة</label>
                                <input type="password" id="set_password" placeholder="اتركه فارغاً لعدم التغيير" class="w-full bg-white p-3.5 rounded-xl font-bold text-sm border border-indigo-100 focus:border-indigo-500 outline-none transition-all text-center tracking-widest">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-indigo-400 uppercase px-1">تأكيد كلمة المرور</label>
                                <input type="password" id="set_password_confirm" placeholder="أعد كتابة كلمة المرور" class="w-full bg-white p-3.5 rounded-xl font-bold text-sm border border-indigo-100 focus:border-indigo-500 outline-none transition-all text-center tracking-widest">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- العمود الثاني: إعدادات النشاط -->
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
                    <h3 class="text-lg font-black text-slate-800 mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                        <i class="fas fa-store text-emerald-500"></i> بيانات النشاط التجاري (للفواتير)
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div class="md:col-span-2 space-y-2">
                            <label class="text-[11px] font-black text-slate-400 uppercase px-1">اسم النشاط / المتجر</label>
                            <input type="text" id="set_store" value="${settings.shop_name || ''}" class="w-full bg-slate-50 p-4 rounded-2xl font-black text-lg border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[11px] font-black text-slate-400 uppercase px-1">رقم هاتف التواصل</label>
                            <input type="tel" id="set_phone" value="${settings.phone || ''}" dir="ltr" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold text-base border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all text-right">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[11px] font-black text-slate-400 uppercase px-1">البريد الإلكتروني</label>
                            <input type="email" id="set_email" value="${settings.email || ''}" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold text-sm border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all" dir="ltr">
                        </div>
                        <div class="md:col-span-2 space-y-2">
                            <label class="text-[11px] font-black text-slate-400 uppercase px-1">العنوان</label>
                            <input type="text" id="set_address" value="${settings.address || ''}" placeholder="عنوان طباعة الفاتورة" class="w-full bg-slate-50 p-3.5 rounded-2xl font-bold text-sm border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all">
                        </div>
                    </div>

                    <div class="mt-8">
                        <button type="button" id="submit-btn" onclick="handleProfileUpdate()" class="w-full bg-slate-900 text-white p-4 md:p-5 rounded-2xl font-black text-base hover:bg-emerald-600 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group">
                            <i class="fas fa-check-circle text-xl text-emerald-400 group-hover:text-white transition-colors"></i> حفظ إعدادات النظام بالكامل
                        </button>
                    </div>
                </div>
            </div>

        </div>

        <!-- نظام النسخ الاحتياطي وإدارة البيانات -->
        <div class="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-4 border-b border-slate-50">
                <div>
                    <h3 class="text-lg font-black text-slate-800 flex items-center gap-2"><i class="fas fa-cloud-download-alt text-blue-500"></i> النسخ الاحتياطي وإدارة البيانات</h3>
                    <p class="text-xs font-bold text-slate-400 mt-1">يُرجى حفظ نسخة احتياطية من بياناتك بشكل دوري لتجنب فقدانها.</p>
                </div>
                <input type="file" id="import-file" accept=".json" class="hidden" onchange="importData(event)">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                <!-- المخزون -->
                <div class="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-blue-200 transition-all">
                    <div class="absolute -right-4 -top-4 text-6xl text-blue-500/5 group-hover:scale-110 transition-transform"><i class="fas fa-box"></i></div>
                    <h4 class="font-black text-sm text-slate-700 z-10 flex items-center gap-2"><i class="fas fa-box text-blue-500"></i> الأصناف والمخازن</h4>
                    <div class="grid grid-cols-2 gap-2 mt-auto z-10">
                        <button onclick="exportData('inventory')" class="bg-white text-slate-600 border border-slate-200 p-2.5 rounded-xl font-bold text-[11px] hover:bg-slate-100 active:scale-95 transition-all">تصدير</button>
                        <button onclick="triggerFileInput()" class="bg-blue-50 text-blue-600 p-2.5 rounded-xl font-bold text-[11px] hover:bg-blue-100 active:scale-95 transition-all">استيراد</button>
                    </div>
                </div>

                <!-- المبيعات -->
                <div class="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-emerald-200 transition-all">
                    <div class="absolute -right-4 -top-4 text-6xl text-emerald-500/5 group-hover:scale-110 transition-transform"><i class="fas fa-file-invoice-dollar"></i></div>
                    <h4 class="font-black text-sm text-slate-700 z-10 flex items-center gap-2"><i class="fas fa-file-invoice text-emerald-500"></i> الفواتير والحسابات</h4>
                    <div class="grid grid-cols-2 gap-2 mt-auto z-10">
                        <button onclick="exportData('sales')" class="bg-white text-slate-600 border border-slate-200 p-2.5 rounded-xl font-bold text-[11px] hover:bg-slate-100 active:scale-95 transition-all">تصدير</button>
                        <button onclick="triggerFileInput()" class="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl font-bold text-[11px] hover:bg-emerald-100 active:scale-95 transition-all">استيراد</button>
                    </div>
                </div>

                <!-- النسخة الشاملة -->
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800 rounded-[1.5rem] p-5 flex flex-col gap-4 text-white shadow-lg md:col-span-1 sm:col-span-2 relative overflow-hidden">
                    <div class="absolute -left-6 -bottom-6 text-7xl text-white/5"><i class="fas fa-database"></i></div>
                    <div>
                        <h4 class="font-black text-sm text-white mb-1"><i class="fas fa-database text-rose-400 ml-1"></i> النظام بالكامل</h4>
                        <p class="text-[10px] text-slate-400 font-bold">نسخة شاملة (منتجات، فواتير، إعدادات)</p>
                    </div>
                    <div class="grid grid-cols-1 gap-2 mt-auto z-10">
                        <button onclick="exportData('full')" class="bg-rose-500 text-white p-3 rounded-xl font-black text-xs hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <i class="fas fa-download"></i> إنشاء نسخة احتياطية
                        </button>
                    </div>
                </div>

            </div>
            
            <!-- Danger Zone -->
            <div class="mt-8 pt-6 border-t border-red-100 flex items-center justify-between bg-red-50/50 p-4 rounded-2xl">
                <div>
                    <h4 class="font-black text-red-600 text-sm flex items-center gap-2"><i class="fas fa-exclamation-triangle"></i> منطقة الخطر</h4>
                    <p class="text-[10px] font-bold text-red-400 mt-1">حذف كافة البيانات نهائياً وبدء النظام من جديد.</p>
                </div>
                <button onclick="factoryReset()" class="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95">
                    إعادة ضبط المصنع
                </button>
            </div>
        </div>

        <!-- إعلان النسخة السحابية (التصميم الجديد) -->
        <div class="bg-[#0f172a] rounded-[2rem] p-1.5 shadow-xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="bg-slate-900/80 backdrop-blur-md rounded-[1.7rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 border border-white/5">
                <div class="flex flex-col md:flex-row items-center gap-5 text-center md:text-right">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-blue-500/20 shrink-0 transform -rotate-6 group-hover:rotate-0 transition-transform">
                        <i class="fas fa-cloud"></i>
                    </div>
                    <div>
                        <h4 class="text-white font-black text-base md:text-lg mb-1 flex items-center justify-center md:justify-start gap-2">
                            النسخة السحابية الاحترافية <span class="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Pro</span>
                        </h4>
                        <p class="text-slate-400 text-xs font-bold leading-relaxed max-w-md">
                            انتقل إلى مستوى أعلى! إمكانية ربط أجهزة متعددة، تطبيق موبايل خاص، جرد بالباركود، وصلاحيات للموظفين.
                        </p>
                    </div>
                </div>
                <a href="https://wa.me/201211934816" target="_blank" class="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl font-black text-sm transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fab fa-whatsapp text-xl"></i> تواصل مع المبيعات
                </a>
            </div>
        </div>

    </div>`;
})();