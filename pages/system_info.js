(function() {
    const displayArea = document.getElementById('main-content-display');

    const systemInfoHTML = `
    <div class="animate-fade-in space-y-8 pb-16 px-4" style="direction: rtl;">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div class="relative z-10">
                <h2 class="text-3xl md:text-4xl font-black tracking-tighter italic">مركز النسخ الاحتياطي المتقدم</h2>
                <p class="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Advanced Backup & Recovery System</p>
                <div class="flex items-center gap-4 mt-4">
                    <span class="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[8px] font-black border border-emerald-500/30">
                        <i class="fas fa-shield-alt ml-1"></i> مشفر
                    </span>
                    <span class="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[8px] font-black border border-blue-500/30">
                        <i class="fas fa-compress ml-1"></i> مضغوط
                    </span>
                    <span class="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-[8px] font-black border border-purple-500/30">
                        <i class="fas fa-sync ml-1"></i> تلقائي
                    </span>
                </div>
            </div>
            <i class="fas fa-database absolute -bottom-10 -left-10 text-[12rem] opacity-5"></i>
            <div class="relative z-10">
                <div class="text-center">
                    <div id="backup-status" class="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/50">
                        <i class="fas fa-check text-3xl text-emerald-400"></i>
                    </div>
                    <p class="text-xs text-emerald-300 mt-2 font-black">النظام جاهز</p>
                </div>
            </div>
        </div>

        <!-- Progress Container -->
        <div id="import-progress-container" class="hidden bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-100">
            <div class="flex justify-between mb-4">
                <span id="progress-status" class="text-xs font-black text-blue-600 uppercase">جاري المعالجة...</span>
                <span id="progress-percent" class="text-xs font-black text-blue-600">0%</span>
            </div>
            <div class="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                <div id="progress-bar" class="bg-gradient-to-r from-blue-500 to-emerald-500 h-full w-0 transition-all duration-300"></div>
            </div>
            <div id="progress-details" class="mt-2 text-xs text-slate-500"></div>
        </div>

        <!-- Database Tables Overview -->
        <div class="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-50">
            <h3 class="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                <span class="w-2 h-8 bg-blue-500 rounded-full"></span> نظرة عامة على البيانات
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${renderTableCard('المنتجات', 'products', 'fa-boxes', 'emerald')}
                ${renderTableCard('الفواتير', 'invoices', 'fa-file-invoice', 'blue')}
                ${renderTableCard('دليل الحسابات', 'accounts', 'fa-users-cog', 'purple')}
                ${renderTableCard('القيود اليومية', 'journal', 'fa-book', 'rose')}
                ${renderTableCard('حركات المخزن', 'stock_movements', 'fa-exchange-alt', 'amber')}
                ${renderTableCard('عناصر الفواتير', 'invoice_items', 'fa-list-ol', 'indigo')}
            </div>
        </div>

        <!-- Advanced Backup Operations -->
        <div class="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-50">
            <h3 class="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                <span class="w-2 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"></span> 
                عمليات النسخ الاحتياطي المتقدمة
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Create Backup -->
                <button onclick="createAdvancedBackup()" class="flex flex-col items-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-[2rem] hover:from-emerald-600 hover:to-emerald-700 hover:text-white transition-all group shadow-lg">
                    <div class="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <span class="font-black text-xs uppercase text-center">إنشاء نسخة احتياطية مشفرة</span>
                    <span class="text-[8px] text-slate-500 mt-1">تشفير + ضغط</span>
                </button>

                <!-- Quick Backup -->
                <button onclick="createQuickBackup()" class="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-[2rem] hover:from-blue-600 hover:to-blue-700 hover:text-white transition-all group shadow-lg">
                    <div class="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <span class="font-black text-xs uppercase text-center">نسخة احتياطية سريعة</span>
                    <span class="text-[8px] text-slate-500 mt-1">بدون تشفير</span>
                </button>

                <!-- Restore Backup -->
                <div class="relative flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-[2rem] hover:from-purple-600 hover:to-purple-700 hover:text-white transition-all group cursor-pointer shadow-lg">
                    <div class="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <i class="fas fa-history"></i>
                    </div>
                    <span class="font-black text-xs uppercase text-center">استعادة نسخة احتياطية</span>
                    <span class="text-[8px] text-slate-500 mt-1">استيراد من ملف</span>
                    <input type="file" id="restore-backup-file" accept=".json,.enc" class="absolute inset-0 opacity-0 cursor-pointer" onchange="restoreBackupFromFile(event)">
                </div>

                <!-- Backup Settings -->
                <button onclick="showBackupSettings()" class="flex flex-col items-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2rem] hover:from-slate-700 hover:to-slate-800 hover:text-white transition-all group shadow-lg">
                    <div class="w-12 h-12 bg-slate-600 text-white rounded-2xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <i class="fas fa-cog"></i>
                    </div>
                    <span class="font-black text-xs uppercase text-center">إعدادات النسخ الاحتياطي</span>
                    <span class="text-[8px] text-slate-500 mt-1">تلقائي + مزامنة</span>
                </button>
            </div>
        </div>

        <!-- Backup History -->
        <div class="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-50">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-xl font-black text-slate-800 flex items-center gap-4">
                    <span class="w-2 h-8 bg-amber-500 rounded-full"></span> سجل النسخ الاحتياطية
                </h3>
                <button onclick="loadBackupHistory()" class="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-black text-sm hover:bg-amber-200 transition-colors">
                    <i class="fas fa-sync ml-2"></i> تحديث
                </button>
            </div>
            <div id="backup-history-container" class="space-y-4 max-h-96 overflow-y-auto">
                <!-- سيتم تحميل السجل هنا -->
            </div>
        </div>

        <!-- Legacy Excel Operations -->
        <div class="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-50">
            <h3 class="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                <span class="w-2 h-8 bg-slate-500 rounded-full"></span> عمليات Excel التقليدية
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onclick="exportToExcel()" class="flex flex-col items-center p-6 bg-slate-50 rounded-[2rem] hover:bg-slate-700 hover:text-white transition-all group">
                    <i class="fas fa-file-excel text-3xl mb-4 text-green-600 group-hover:animate-bounce"></i>
                    <span class="font-black text-xs uppercase italic">تصدير إلى Excel</span>
                </button>
                
                <div class="relative flex flex-col items-center p-6 bg-slate-50 rounded-[2rem] hover:bg-slate-700 hover:text-white transition-all group cursor-pointer">
                    <i class="fas fa-file-import text-3xl mb-4 text-blue-600 group-hover:scale-110 transition-transform"></i>
                    <span class="font-black text-xs uppercase italic">استيراد من Excel</span>
                    <input type="file" id="import-excel-file" accept=".xlsx, .xls" class="absolute inset-0 opacity-0 cursor-pointer" onchange="importFromExcel(event)">
                </div>

                <button onclick="clearAllSystemData()" class="flex flex-col items-center p-6 bg-rose-50 rounded-[2rem] hover:bg-rose-600 hover:text-white transition-all group">
                    <i class="fas fa-trash-alt text-3xl mb-4 text-rose-600 group-hover:animate-bounce"></i>
                    <span class="font-black text-xs uppercase italic text-center">تصفير النظام</span>
                </button>
            </div>
        </div>
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

    function renderTableCard(title, dbName, icon, color) {
        return `
        <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div class="flex justify-between items-start relative z-10">
                <div class="w-12 h-12 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 uppercase italic mb-1">${dbName}</p>
                    <h4 class="text-xl font-black text-slate-800">${title}</h4>
                </div>
            </div>
            <div class="mt-8">
                <span id="cnt-${dbName}" class="text-3xl font-black font-mono text-slate-900">0</span>
                <span class="text-[10px] font-bold text-slate-400 mr-2 uppercase italic">Record</span>
            </div>
        </div>`;
    }

    displayArea.innerHTML = systemInfoHTML;

    // --- [1] Local Backup Logic (بدلاً من PHP) ---

    window.downloadJsonBackup = async () => {
        try {
            const tables = ['products', 'invoices', 'invoice_items', 'accounts', 'journal', 'journal_items', 'stock_movements'];
            const dbData = {};
            for (const table of tables) {
                dbData[table] = await db.table(table).toArray();
            }
            
            const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MENTRA_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert("حدث خطأ أثناء تصدير النسخة الاحتياطية");
        }
    };

    // --- [2] Excel Functions ---

    window.exportToExcel = async () => {
        const wb = XLSX.utils.book_new();
        const tables = ['products', 'invoices', 'invoice_items', 'accounts', 'journal', 'journal_items', 'stock_movements'];

        for (let table of tables) {
            const data = await db.table(table).toArray();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, table);
        }
        XLSX.writeFile(wb, `MENTRA_EXCEL_EXPORT_${new Date().getTime()}.xlsx`);
    };

    window.importFromExcel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const progressCont = document.getElementById('import-progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressStatus = document.getElementById('progress-status');

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const totalSheets = workbook.SheetNames.length;
                
                if (!confirm("⚠️ تنبيه: سيتم تحديث البيانات الموجودة ببيانات الملف. استمرار؟")) return;

                progressCont.classList.remove('hidden');
                
                await db.transaction('rw', db.products, db.invoices, db.invoice_items, db.accounts, db.journal, db.journal_items, db.stock_movements, async () => {
                    for (let i = 0; i < totalSheets; i++) {
                        const sheetName = workbook.SheetNames[i];
                        if (db[sheetName]) {
                            progressStatus.innerText = `جاري استيراد: ${sheetName}`;
                            let jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                            const cleanData = jsonData.map(item => {
                                for (let key in item) {
                                    if (key.includes('id') || key.includes('qty') || key.includes('price') || 
                                        key.includes('total') || key.includes('balance') || key.includes('cost') ||
                                        key.includes('debit') || key.includes('credit')) {
                                        item[key] = parseFloat(item[key]) || 0;
                                    }
                                }
                                return item;
                            });
                            await db[sheetName].bulkPut(cleanData);
                        }
                        progressBar.style.width = Math.round(((i + 1) / totalSheets) * 100) + '%';
                    }
                });

                progressStatus.innerText = "✅ نجح الاستيراد!";
                setTimeout(() => {
                    progressCont.classList.add('hidden');
                    refreshDBCounters();
                    alert("تم تحديث الجداول بنجاح!");
                }, 800);
            } catch (err) {
                alert("فشل الاستيراد: " + err.message);
                progressCont.classList.add('hidden');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    window.refreshDBCounters = async () => {
        const tables = ['products', 'invoices', 'invoice_items', 'accounts', 'journal', 'stock_movements'];
        for (let table of tables) {
            const count = await db.table(table).count();
            const el = document.getElementById(`cnt-${table}`);
            if (el) el.innerText = count.toLocaleString();
        }
    };

    window.clearAllSystemData = async () => {
        const confirm1 = confirm("⚠️ تحذير نهائي: أنت على وشك حذف كافة البيانات. هل أنت متأكد؟");
        if (!confirm1) return;

        const confirm2 = prompt("لتأكيد الحذف النهائي، اكتب كلمة (حذف) في المربع أدناه:");
        if (confirm2 !== 'حذف') return;

        const progressCont = document.getElementById('import-progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressStatus = document.getElementById('progress-status');
        
        try {
            progressCont.classList.remove('hidden');
            progressStatus.innerText = "جاري مسح قواعد البيانات...";
            progressBar.style.width = '30%';

            const tables = ['products', 'invoices', 'invoice_items', 'accounts', 'journal', 'journal_items', 'stock_movements'];
            
            await db.transaction('rw', tables, async () => {
                for (let table of tables) {
                    await db[table].clear();
                }
            });

            progressBar.style.width = '100%';
            progressStatus.innerText = "✅ تم تصفير النظام بنجاح!";
            
            setTimeout(() => {
                progressCont.classList.add('hidden');
                refreshDBCounters();
                alert("تم مسح كافة البيانات بنجاح.");
            }, 1000);
        } catch (err) {
            alert("فشل المسح: " + err.message);
            progressCont.classList.add('hidden');
        }
    };

    // --- [3] Advanced Backup Functions ---
    
    // إنشاء نسخة احتياطية مشفرة ومضغوطة
    window.createAdvancedBackup = async () => {
        try {
            const progressCont = document.getElementById('import-progress-container');
            const progressBar = document.getElementById('progress-bar');
            const progressStatus = document.getElementById('progress-status');
            const progressDetails = document.getElementById('progress-details');
            
            progressCont.classList.remove('hidden');
            progressStatus.innerText = 'جاري إنشاء النسخة الاحتياطية...';
            progressBar.style.width = '20%';
            progressDetails.innerText = 'جمع البيانات من قاعدة البيانات...';
            
            const result = await backupManager.createFullBackup({
                encrypt: true,
                compress: true,
                description: `نسخة احتياطية متقدمة - ${new Date().toLocaleString('ar-EG')}`
            });
            
            if (result.success) {
                progressBar.style.width = '60%';
                progressStatus.innerText = 'جاري حفظ الملف...';
                progressDetails.innerText = `اسم الملف: ${result.filename}`;
                
                await backupManager.saveBackupToFile(result.data, result.filename);
                
                progressBar.style.width = '100%';
                progressStatus.innerText = '✅ تم إنشاء النسخة الاحتياطية بنجاح!';
                progressDetails.innerText = `المدة: ${result.duration}ms | الحجم: ${(result.metadata.size / 1024).toFixed(1)}KB`;
                
                setTimeout(() => {
                    progressCont.classList.add('hidden');
                    loadBackupHistory();
                    Swal.fire({
                        icon: 'success',
                        title: 'نجح النسخ الاحتياطي!',
                        text: `تم إنشاء نسخة احتياطية مشفرة ومضغوطة بنجاح`,
                        confirmButtonText: 'تم',
                        customClass: {
                            popup: 'rounded-3xl',
                            confirmButton: 'rounded-xl font-bold'
                        }
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Advanced backup failed:', error);
            Swal.fire({
                icon: 'error',
                title: 'فشل النسخ الاحتياطي',
                text: error.message,
                confirmButtonText: 'حسناً',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl font-bold'
                }
            });
            document.getElementById('import-progress-container').classList.add('hidden');
        }
    };

    // Initial Execution
    refreshDBCounters();
    loadBackupHistory();
})();
