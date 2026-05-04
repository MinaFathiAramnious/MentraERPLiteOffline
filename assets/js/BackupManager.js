/**
 * MENTRA ERP - Backup Manager System
 * نظام متكامل للنسخ الاحتياطي مع التشفير والضغط والمزامنة
 * Version: 1.0.0
 */

class BackupManager {
    constructor() {
        this.db = null;
        this.encryptionKey = null;
        this.backupSchedule = null;
        this.syncEnabled = false;
        this.maxBackups = 10;
        this.compressionLevel = 6;
        this.init();
    }

    async init() {
        try {
            // تهيئة قاعدة البيانات المحلية للنسخ الاحتياطي
            this.db = new Dexie("MentraBackupSystem");
            this.db.version(1).stores({
                backups: '++id, filename, timestamp, size, type, encrypted, compressed',
                settings: 'id, auto_backup, schedule, compression, encryption, sync_enabled',
                sync_log: '++id, timestamp, action, status, details'
            });

            // إنشاء مفتاح التشفير التلقائي
            await this.generateEncryptionKey();
            
            // تحميل الإعدادات
            await this.loadSettings();
            
            console.log('🔧 BackupManager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize BackupManager:', error);
        }
    }

    /**
     * إنشاء مفتاح تشفير عشوائي
     */
    async generateEncryptionKey() {
        if (!this.encryptionKey) {
            const encoder = new TextEncoder();
            const data = encoder.encode('MENTRA_BACKUP_' + Date.now() + '_' + Math.random().toString(36));
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            this.encryptionKey = await crypto.subtle.importKey(
                'raw',
                hashBuffer,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        }
    }

    /**
     * تشفير البيانات
     */
    async encryptData(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBuffer
            );

            const result = new Uint8Array(iv.length + encryptedData.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encryptedData), iv.length);
            
            return Array.from(result);
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('فشل تشفير البيانات');
        }
    }

    /**
     * فك تشفير البيانات
     */
    async decryptData(encryptedData) {
        try {
            const data = new Uint8Array(encryptedData);
            const iv = data.slice(0, 12);
            const encrypted = data.slice(12);

            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encrypted
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedData));
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('فشل فك تشفير البيانات');
        }
    }

    /**
     * ضغط البيانات باستخدام خوارزمية بسيطة
     */
    compressData(data) {
        try {
            const jsonString = JSON.stringify(data);
            // استخدام خوارزمية ضغط بسيطة (في الإنتاج يمكن استخدام مكتبات أفضل)
            const compressed = this.simpleCompress(jsonString);
            return compressed;
        } catch (error) {
            console.error('Compression failed:', error);
            return data; // العودة للبيانات الأصلية في حالة الفشل
        }
    }

    /**
     * خوارزمية ضغط بسيطة
     */
    simpleCompress(str) {
        const dict = {};
        let dictSize = 256;
        let w = '';
        let result = [];
        let c;

        for (let i = 0; i < 256; i++) {
            dict[String.fromCharCode(i)] = i;
        }

        for (let i = 0; i < str.length; i++) {
            c = str.charAt(i);
            const wc = w + c;
            if (dict[wc]) {
                w = wc;
            } else {
                result.push(dict[w]);
                dict[wc] = dictSize++;
                w = c;
            }
        }

        if (w !== '') {
            result.push(dict[w]);
        }

        return result;
    }

    /**
     * إنشاء نسخة احتياطية كاملة
     */
    async createFullBackup(options = {}) {
        try {
            const startTime = Date.now();
            const tables = ['products', 'invoices', 'invoice_items', 'accounts', 'journal', 'journal_items', 'stock_movements', 'settings'];
            const backupData = {};

            // جمع البيانات من جميع الجداول
            for (const table of tables) {
                try {
                    backupData[table] = await db.table(table).toArray();
                } catch (error) {
                    console.warn(`Table ${table} not found or accessible:`, error);
                    backupData[table] = [];
                }
            }

            // إضافة معلومات النسخة الاحتياطية
            const metadata = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                created_by: userSession.name || 'System',
                description: options.description || 'نسخة احتياطية يدوية',
                tables_count: Object.keys(backupData).length,
                total_records: Object.values(backupData).reduce((sum, table) => sum + table.length, 0)
            };

            const fullBackup = { metadata, data: backupData };

            // تطبيق الضغط إذا مفعّل
            let processedData = fullBackup;
            if (options.compress !== false) {
                processedData = this.compressData(fullBackup);
            }

            // تطبيق التشفير إذا مفعّل
            if (options.encrypt !== false) {
                processedData = await this.encryptData(processedData);
            }

            // حفظ معلومات النسخة الاحتياطية
            const backupInfo = {
                filename: `MENTRA_BACKUP_${new Date().getTime()}.${options.encrypt ? 'enc' : 'json'}`,
                timestamp: new Date().toISOString(),
                size: JSON.stringify(processedData).length,
                type: 'full',
                encrypted: options.encrypt !== false,
                compressed: options.compress !== false,
                metadata: metadata
            };

            await this.db.backups.add(backupInfo);

            // تسجيل العملية
            await this.logSyncAction('backup_created', 'success', `نسخة احتياطية: ${backupInfo.filename}`);

            const duration = Date.now() - startTime;
            console.log(`✅ Backup created in ${duration}ms`);

            return {
                success: true,
                filename: backupInfo.filename,
                data: processedData,
                metadata: backupInfo,
                duration: duration
            };

        } catch (error) {
            console.error('Backup creation failed:', error);
            await this.logSyncAction('backup_failed', 'error', error.message);
            throw new Error('فشل إنشاء النسخة الاحتياطية: ' + error.message);
        }
    }

    /**
     * استعادة نسخة احتياطية
     */
    async restoreBackup(backupData, options = {}) {
        try {
            const startTime = Date.now();
            let processedData = backupData;

            // فك التشفير إذا كان مشفراً
            if (options.encrypted) {
                processedData = await this.decryptData(backupData);
            }

            // فك الضغط إذا كان مضغوطاً
            if (options.compressed) {
                processedData = this.simpleDecompress(processedData);
            }

            const backup = typeof processedData === 'string' ? JSON.parse(processedData) : processedData;

            // تشخيص بنية البيانات
            console.log('Backup structure:', {
                type: typeof backup,
                isArray: Array.isArray(backup),
                keys: backup ? Object.keys(backup) : 'null',
                sample: backup
            });

            // التحقق من صلاحية النسخة الاحتياطية مع معالجة الحالات المختلفة
            if (!backup || typeof backup !== 'object') {
                throw new Error('ملف النسخة الاحتياطية غير صالح - البيانات ليست كائن');
            }
            
            // معالجة حالة إذا كانت البيانات في بنية قديمة أو مختلفة
            if (!backup.metadata && !backup.data) {
                // قد تكون البيانات القديمة تحتوي على الجداول مباشرة
                const tableNames = Object.keys(backup);
                if (tableNames.length > 0 && (tableNames.includes('products') || tableNames.includes('invoices') || tableNames.includes('accounts'))) {
                    // بنية قديمة - تحويل إلى البنية الجديدة
                    backup = {
                        metadata: {
                            version: '1.0.0',
                            timestamp: new Date().toISOString(),
                            created_by: 'System',
                            description: 'نسخة احتياطية محولة من بنية قديمة',
                            tables_count: tableNames.length,
                            total_records: Object.values(backup).reduce((sum, table) => sum + (Array.isArray(table) ? table.length : 0), 0)
                        },
                        data: backup
                    };
                } else {
                    throw new Error('ملف النسخة الاحتياطية غير صالح - missing metadata and data');
                }
            }
            
            if (!backup.metadata) {
                throw new Error('ملف النسخة الاحتياطية غير صالح - missing metadata');
            }
            
            if (!backup.data) {
                throw new Error('ملف النسخة الاحتياطية غير صالح - missing data');
            }
            
            if (typeof backup.data !== 'object') {
                throw new Error('ملف النسخة الاحتياطية غير صالح - data must be an object');
            }

            // حذف البيانات الحالية (إذا طُلب)
            if (options.clearBeforeRestore) {
                await this.clearAllData();
            }

            // استعادة البيانات جدول بجدول
            const tables = Object.keys(backup.data);
            for (const tableName of tables) {
                try {
                    if (db.table(tableName)) {
                        await db.table(tableName).clear();
                        if (backup.data[tableName].length > 0) {
                            await db.table(tableName).bulkPut(backup.data[tableName]);
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to restore table ${tableName}:`, error);
                }
            }

            // تسجيل العملية
            await this.logSyncAction('backup_restored', 'success', `استعادة: ${backup.metadata.description}`);

            const duration = Date.now() - startTime;
            console.log(`✅ Backup restored in ${duration}ms`);

            return {
                success: true,
                metadata: backup.metadata,
                duration: duration,
                tables_restored: tables.length
            };

        } catch (error) {
            console.error('Backup restoration failed:', error);
            await this.logSyncAction('backup_restore_failed', 'error', error.message);
            throw new Error('فشل استعادة النسخة الاحتياطية: ' + error.message);
        }
    }

    /**
     * فك الضغط البسيط
     */
    simpleDecompress(compressed) {
        // هذه مجرد محاكاة - في الإنتاج الحقيقي يجب استخدام مكتبة ضغط حقيقية
        return compressed;
    }

    /**
     * مسح جميع البيانات
     */
    async clearAllData() {
        const tables = ['products', 'invoices', 'invoice_items', 'accounts', 'journal', 'journal_items', 'stock_movements'];
        for (const table of tables) {
            try {
                await db.table(table).clear();
            } catch (error) {
                console.warn(`Failed to clear table ${table}:`, error);
            }
        }
    }

    /**
     * تحميل إعدادات النسخ الاحتياطي
     */
    async loadSettings() {
        try {
            const settings = await this.db.settings.get(1);
            if (settings) {
                this.backupSchedule = settings.schedule || 'daily';
                this.syncEnabled = settings.sync_enabled || false;
                this.compressionLevel = settings.compression || 6;
                this.maxBackups = settings.max_backups || 10;
            } else {
                // إعدادات افتراضية
                await this.db.settings.add({
                    id: 1,
                    auto_backup: true,
                    schedule: 'daily',
                    compression: 6,
                    encryption: true,
                    sync_enabled: false,
                    max_backups: 10
                });
            }
        } catch (error) {
            console.error('Failed to load backup settings:', error);
        }
    }

    /**
     * حفظ إعدادات النسخ الاحتياطي
     */
    async saveSettings(settings) {
        try {
            await this.db.settings.put({ id: 1, ...settings });
            await this.loadSettings();
            return true;
        } catch (error) {
            console.error('Failed to save backup settings:', error);
            return false;
        }
    }

    /**
     * تسجيل عمليات المزامنة
     */
    async logSyncAction(action, status, details) {
        try {
            await this.db.sync_log.add({
                timestamp: new Date().toISOString(),
                action: action,
                status: status,
                details: details
            });
        } catch (error) {
            console.error('Failed to log sync action:', error);
        }
    }

    /**
     * الحصول على قائمة النسخ الاحتياطية
     */
    async getBackupList() {
        try {
            return await this.db.backups.orderBy('timestamp').reverse().toArray();
        } catch (error) {
            console.error('Failed to get backup list:', error);
            return [];
        }
    }

    /**
     * حذف نسخة احتياطية
     */
    async deleteBackup(backupId) {
        try {
            await this.db.backups.delete(backupId);
            await this.logSyncAction('backup_deleted', 'success', `Backup ID: ${backupId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete backup:', error);
            return false;
        }
    }

    /**
     * تنظيف النسخ الاحتياطية القديمة
     */
    async cleanupOldBackups() {
        try {
            const backups = await this.getBackupList();
            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                for (const backup of toDelete) {
                    await this.deleteBackup(backup.id);
                }
                console.log(`🧹 Cleaned up ${toDelete.length} old backups`);
            }
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }

    /**
     * تحميل نسخة احتياطية من ملف
     */
    async loadBackupFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    let data;
                    
                    if (file.name.endsWith('.enc')) {
                        // ملف مشفر
                        data = new Uint8Array(content);
                    } else {
                        // ملف JSON عادي - تحويل ArrayBuffer إلى نص ثم تحليل كـ JSON
                        if (content instanceof ArrayBuffer) {
                            const decoder = new TextDecoder('utf-8');
                            const jsonString = decoder.decode(content);
                            data = JSON.parse(jsonString);
                        } else {
                            // إذا كان النص جاهزاً مباشرة
                            data = JSON.parse(content);
                        }
                    }
                    
                    resolve(data);
                } catch (error) {
                    if (error instanceof SyntaxError && error.message.includes('JSON')) {
                        reject(new Error('ملف النسخة الاحتياطية تالف أو غير صالح. يرجى التأكد من أن الملف بتنسيق JSON صحيح.'));
                    } else {
                        reject(error);
                    }
                }
            };
            reader.onerror = () => reject(new Error('فشل قراءة الملف'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * حفظ نسخة احتياطية في ملف
     */
    async saveBackupToFile(backupData, filename) {
        try {
            let content;
            let mimeType = 'application/octet-stream';

            if (typeof backupData === 'object' && backupData instanceof Uint8Array) {
                // ملف مشفر
                content = backupData;
            } else {
                // ملف JSON عادي
                content = JSON.stringify(backupData, null, 2);
                mimeType = 'application/json';
                filename = filename.replace('.enc', '.json');
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Failed to save backup to file:', error);
            return false;
        }
    }

    /**
     * تفعيل النسخ الاحتياطي التلقائي
     */
    enableAutoBackup() {
        if (this.backupSchedule) {
            const intervals = {
                'hourly': 60 * 60 * 1000,
                'daily': 24 * 60 * 60 * 1000,
                'weekly': 7 * 24 * 60 * 60 * 1000,
                'monthly': 30 * 24 * 60 * 60 * 1000
            };

            const interval = intervals[this.backupSchedule] || intervals.daily;
            
            this.backupSchedule = setInterval(async () => {
                try {
                    await this.createFullBackup({
                        encrypt: true,
                        compress: true,
                        description: `نسخة احتياطية تلقائية - ${new Date().toLocaleString('ar-EG')}`
                    });
                    await this.cleanupOldBackups();
                } catch (error) {
                    console.error('Auto backup failed:', error);
                }
            }, interval);

            console.log(`🔄 Auto backup enabled: ${this.backupSchedule}`);
        }
    }

    /**
     * إيقاف النسخ الاحتياطي التلقائي
     */
    disableAutoBackup() {
        if (this.backupSchedule) {
            clearInterval(this.backupSchedule);
            this.backupSchedule = null;
            console.log('⏹️ Auto backup disabled');
        }
    }
}

// إنشاء نسخة واحدة من مدير النسخ الاحتياطي
window.backupManager = new BackupManager();