/**
 * MENTRA ERP - Backup Functions Extension
 * دوال إضافية للنسخ الاحتياطي المتقدم
 */

// إنشاء نسخة احتياطية سريعة (بدون تشفير)
window.createQuickBackup = async () => {
    try {
        const progressCont = document.getElementById('import-progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressStatus = document.getElementById('progress-status');
        
        progressCont.classList.remove('hidden');
        progressStatus.innerText = 'جاري إنشاء نسخة احتياطية سريعة...';
        progressBar.style.width = '50%';
        
        const result = await backupManager.createFullBackup({
            encrypt: false,
            compress: false,
            description: `نسخة احتياطية سريعة - ${new Date().toLocaleString('ar-EG')}`
        });
        
        if (result.success) {
            await backupManager.saveBackupToFile(result.data, result.filename);
            
            progressBar.style.width = '100%';
            progressStatus.innerText = '✅ تم إنشاء النسخة السريعة!';
            
            setTimeout(() => {
                progressCont.classList.add('hidden');
                loadBackupHistory();
                Swal.fire({
                    icon: 'success',
                    title: 'نجح النسخ الاحتياطي السريع!',
                    text: 'تم إنشاء نسخة احتياطية سريعة بنجاح',
                    confirmButtonText: 'تم',
                    customClass: {
                        popup: 'rounded-3xl',
                        confirmButton: 'rounded-xl font-bold'
                    }
                });
            }, 1500);
        }
    } catch (error) {
        console.error('Quick backup failed:', error);
        Swal.fire({
            icon: 'error',
            title: 'فشل النسخ الاحتياطي السريع',
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

// استعادة نسخة احتياطية من ملف
window.restoreBackupFromFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const confirmed = await Swal.fire({
            title: 'تأكيد استعادة النسخة الاحتياطية',
            text: 'سيتم استبدال جميع البيانات الحالية بالبيانات من الملف. هل تريد المتابعة؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، استعادة',
            cancelButtonText: 'إلغاء',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold',
                cancelButton: 'rounded-xl font-bold'
            }
        });

        if (!confirmed.isConfirmed) {
            event.target.value = '';
            return;
        }

        const progressCont = document.getElementById('import-progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressStatus = document.getElementById('progress-status');
        const progressDetails = document.getElementById('progress-details');
        
        progressCont.classList.remove('hidden');
        progressStatus.innerText = 'جاري قراءة الملف...';
        progressBar.style.width = '20%';
        progressDetails.innerText = `الملف: ${file.name}`;

        const backupData = await backupManager.loadBackupFromFile(file);
        
        progressBar.style.width = '40%';
        progressStatus.innerText = 'جاري استعادة البيانات...';
        progressDetails.innerText = 'تحليل البيانات والتحقق من الصلاحية...';

        const options = {
            encrypted: file.name.endsWith('.enc'),
            compressed: true,
            clearBeforeRestore: true
        };

        const result = await backupManager.restoreBackup(backupData, options);
        
        if (result.success) {
            progressBar.style.width = '100%';
            progressStatus.innerText = '✅ تم استعادة النسخة الاحتياطية بنجاح!';
            progressDetails.innerText = `الجداول المستعادة: ${result.tables_restored} | المدة: ${result.duration}ms`;
            
            setTimeout(() => {
                progressCont.classList.add('hidden');
                refreshDBCounters();
                loadBackupHistory();
                Swal.fire({
                    icon: 'success',
                    title: 'نجحت الاستعادة!',
                    text: `تم استعادة ${result.tables_restored} جدول بنجاح`,
                    confirmButtonText: 'تم',
                    customClass: {
                        popup: 'rounded-3xl',
                        confirmButton: 'rounded-xl font-bold'
                    }
                });
            }, 2000);
        }
    } catch (error) {
        console.error('Restore backup failed:', error);
        Swal.fire({
            icon: 'error',
            title: 'فشل الاستعادة',
            text: error.message,
            confirmButtonText: 'حسناً',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold'
            }
        });
        document.getElementById('import-progress-container').classList.add('hidden');
    } finally {
        event.target.value = '';
    }
};

// عرض إعدادات النسخ الاحتياطي
window.showBackupSettings = async () => {
    try {
        const settings = await backupManager.db.settings.get(1) || {
            auto_backup: true,
            schedule: 'daily',
            compression: 6,
            encryption: true,
            sync_enabled: false,
            max_backups: 10
        };

        const { value: formValues } = await Swal.fire({
            title: 'إعدادات النسخ الاحتياطي',
            html: `
                <div class="text-right space-y-4">
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <label class="font-bold text-sm">النسخ الاحتياطي التلقائي</label>
                        <input type="checkbox" id="auto_backup" ${settings.auto_backup ? 'checked' : ''} class="w-5 h-5">
                    </div>
                    <div class="p-3 bg-slate-50 rounded-xl">
                        <label class="font-bold text-sm block mb-2">جدولة النسخ الاحتياطي</label>
                        <select id="schedule" class="w-full p-2 border border-slate-300 rounded-lg text-sm">
                            <option value="hourly" ${settings.schedule === 'hourly' ? 'selected' : ''}>كل ساعة</option>
                            <option value="daily" ${settings.schedule === 'daily' ? 'selected' : ''}>يومياً</option>
                            <option value="weekly" ${settings.schedule === 'weekly' ? 'selected' : ''}>أسبوعياً</option>
                            <option value="monthly" ${settings.schedule === 'monthly' ? 'selected' : ''}>شهرياً</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <label class="font-bold text-sm">تشفير البيانات</label>
                        <input type="checkbox" id="encryption" ${settings.encryption ? 'checked' : ''} class="w-5 h-5">
                    </div>
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <label class="font-bold text-sm">ضغط البيانات</label>
                        <input type="checkbox" id="compression" ${settings.compression > 0 ? 'checked' : ''} class="w-5 h-5">
                    </div>
                    <div class="p-3 bg-slate-50 rounded-xl">
                        <label class="font-bold text-sm block mb-2">الحد الأقصى للنسخ الاحتياطية</label>
                        <input type="number" id="max_backups" value="${settings.max_backups}" min="1" max="50" class="w-full p-2 border border-slate-300 rounded-lg text-sm">
                    </div>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'حفظ الإعدادات',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return {
                    auto_backup: document.getElementById('auto_backup').checked,
                    schedule: document.getElementById('schedule').value,
                    encryption: document.getElementById('encryption').checked,
                    compression: document.getElementById('compression').checked ? 6 : 0,
                    max_backups: parseInt(document.getElementById('max_backups').value)
                };
            },
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold',
                cancelButton: 'rounded-xl font-bold'
            }
        });

        if (formValues) {
            const success = await backupManager.saveSettings(formValues);
            if (success) {
                if (formValues.auto_backup) {
                    backupManager.enableAutoBackup();
                } else {
                    backupManager.disableAutoBackup();
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم حفظ الإعدادات!',
                    text: 'تم تحديث إعدادات النسخ الاحتياطي بنجاح',
                    confirmButtonText: 'تم',
                    customClass: {
                        popup: 'rounded-3xl',
                        confirmButton: 'rounded-xl font-bold'
                    }
                });
            }
        }
    } catch (error) {
        console.error('Failed to show backup settings:', error);
        Swal.fire({
            icon: 'error',
            title: 'فشل تحميل الإعدادات',
            text: error.message,
            confirmButtonText: 'حسناً',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold'
            }
        });
    }
};

// تحميل سجل النسخ الاحتياطية
window.loadBackupHistory = async () => {
    try {
        const container = document.getElementById('backup-history-container');
        const backups = await backupManager.getBackupList();
        
        if (backups.length === 0) {
            container.innerHTML = `
                <div class="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                    <i class="fas fa-inbox text-4xl text-slate-300 mb-4"></i>
                    <p class="text-slate-500 font-bold text-sm">لا توجد نسخ احتياطية حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = backups.map(backup => `
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full ${backup.encrypted ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center">
                        <i class="fas ${backup.encrypted ? 'fa-shield-alt text-emerald-600' : 'fa-file text-blue-600'}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-sm text-slate-800">${backup.filename}</p>
                        <p class="text-xs text-slate-500">${new Date(backup.timestamp).toLocaleString('ar-EG')}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-400">${(backup.size / 1024).toFixed(1)}KB</span>
                    <button onclick="deleteBackupRecord(${backup.id})" class="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load backup history:', error);
        document.getElementById('backup-history-container').innerHTML = `
            <div class="text-center p-8 border-2 border-dashed border-rose-200 rounded-2xl">
                <i class="fas fa-exclamation-triangle text-4xl text-rose-300 mb-4"></i>
                <p class="text-rose-500 font-bold text-sm">فشل تحميل سجل النسخ الاحتياطية</p>
            </div>
        `;
    }
};

// حذف سجل نسخة احتياطية
window.deleteBackupRecord = async (backupId) => {
    try {
        const confirmed = await Swal.fire({
            title: 'حذف النسخة الاحتياطية؟',
            text: 'هل أنت متأكد من حذف هذا السجل؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، حذف',
            cancelButtonText: 'إلغاء',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold',
                cancelButton: 'rounded-xl font-bold'
            }
        });

        if (confirmed.isConfirmed) {
            const success = await backupManager.deleteBackup(backupId);
            if (success) {
                loadBackupHistory();
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحذف!',
                    text: 'تم حذف سجل النسخة الاحتياطية بنجاح',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-3xl'
                    }
                });
            }
        }
    } catch (error) {
        console.error('Failed to delete backup record:', error);
        Swal.fire({
            icon: 'error',
            title: 'فشل الحذف',
            text: error.message,
            confirmButtonText: 'حسناً',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold'
            }
        });
    }
};