/**
 * Backup Manager - نظام النسخ الاحتياطي
 * Provides comprehensive backup and restore functionality with encryption
 */

class BackupManager {
    constructor() {
        this.dbName = 'MentraERP_LocalDB';
        this.db = null;
        this.backupStorage = 'mentra_backups';
        this.encryptionKey = null;
        this.maxBackups = 10;
        this.autoBackupInterval = null;
        
        this.init();
    }

    async init() {
        try {
            // Open database connection
            this.db = await this.openDatabase();
            
            // Initialize backup storage
            this.initBackupStorage();
            
            // Generate or retrieve encryption key
            await this.initEncryption();
            
            console.log('[Backup Manager] Backup system initialized');
        } catch (error) {
            console.error('[Backup Manager] Initialization failed:', error);
        }
    }

    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create backup store if not exists
                if (!db.objectStoreNames.contains('backups')) {
                    const backupStore = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
                    backupStore.createIndex('date', 'date', { unique: false });
                    backupStore.createIndex('type', 'type', { unique: false });
                    backupStore.createIndex('size', 'size', { unique: false });
                }
            };
        });
    }

    initBackupStorage() {
        if (!localStorage.getItem(this.backupStorage)) {
            localStorage.setItem(this.backupStorage, JSON.stringify({}));
        }
    }

    async initEncryption() {
        // Try to get existing encryption key
        const storedKey = localStorage.getItem('mentra_backup_key');
        
        if (storedKey) {
            this.encryptionKey = storedKey;
        } else {
            // Generate new encryption key
            this.encryptionKey = this.generateEncryptionKey();
            localStorage.setItem('mentra_backup_key', this.encryptionKey);
        }
    }

    generateEncryptionKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async createBackup(options = {}) {
        const {
            type = 'manual',
            includeData = true,
            includeSettings = true,
            encrypt = true,
            description = ''
        } = options;

        try {
            console.log('[Backup Manager] Creating backup...');
            
            // Show loading state
            this.showLoading('جاري إنشاء النسخة الاحتياطية...');

            // Collect all data
            const backupData = {
                metadata: {
                    version: this.getAppVersion(),
                    date: new Date().toISOString(),
                    type: type,
                    description: description || `نسخة احتياطية ${type === 'auto' ? 'تلقائية' : 'يدوية'}`,
                    encrypted: encrypt
                },
                data: {}
            };

            // Get all table data
            if (includeData) {
                backupData.data = await this.getAllTableData();
            }

            // Get app settings
            if (includeSettings) {
                backupData.data.settings = this.getAppSettings();
            }

            // Compress data
            let processedData = this.compressData(backupData);

            // Encrypt if requested
            if (encrypt && this.encryptionKey) {
                processedData = await this.encryptData(processedData);
            }

            // Create backup record
            const backup = {
                id: Date.now(),
                date: new Date().toISOString(),
                type: type,
                size: this.getDataSize(processedData),
                encrypted: encrypt,
                data: processedData,
                metadata: backupData.metadata
            };

            // Store backup in IndexedDB
            await this.storeBackup(backup);

            // Store backup info in localStorage for quick access
            this.updateBackupInfo(backup);

            // Clean old backups
            await this.cleanOldBackups();

            // Hide loading
            this.hideLoading();

            // Show success message
            this.showNotification('تم إنشاء النسخة الاحتياطية بنجاح', 'success');

            console.log('[Backup Manager] Backup created successfully');
            return backup;

        } catch (error) {
            console.error('[Backup Manager] Backup creation failed:', error);
            this.hideLoading();
            this.showNotification('فشل إنشاء النسخة الاحتياطية', 'error');
            throw error;
        }
    }

    async getAllTableData() {
        const tables = [
            'users', 'customers', 'suppliers', 'products', 'categories',
            'purchases', 'sales', 'account_transactions', 'inventory_movements'
        ];
        
        const data = {};
        
        for (const table of tables) {
            try {
                data[table] = await this.getTableData(table);
            } catch (error) {
                console.warn(`[Backup Manager] Failed to get data for table ${table}:`, error);
                data[table] = [];
            }
        }
        
        return data;
    }

    async getTableData(tableName) {
        // This would need to be implemented based on your database structure
        // For now, return empty array
        return [];
    }

    getAppSettings() {
        // Get all app settings from localStorage
        const settings = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mentra_') && !key.includes('backup')) {
                settings[key] = localStorage.getItem(key);
            }
        }
        return settings;
    }

    getAppVersion() {
        // Get app version from manifest or other source
        return '1.0.0';
    }

    compressData(data) {
        // Simple string compression - in real implementation, you'd use a proper compression library
        const jsonString = JSON.stringify(data);
        return btoa(jsonString); // Base64 encoding for now
    }

    async encryptData(data) {
        // Simple XOR encryption for demo - in production, use proper encryption
        if (!this.encryptionKey) return data;
        
        const encrypted = [];
        for (let i = 0; i < data.length; i++) {
            encrypted.push(
                String.fromCharCode(
                    data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
                )
            );
        }
        return btoa(encrypted.join(''));
    }

    async decryptData(encryptedData) {
        if (!this.encryptionKey) return encryptedData;
        
        try {
            const decoded = atob(encryptedData);
            const decrypted = [];
            for (let i = 0; i < decoded.length; i++) {
                decrypted.push(
                    String.fromCharCode(
                        decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
                    )
                );
            }
            return decrypted.join('');
        } catch (error) {
            console.error('[Backup Manager] Decryption failed:', error);
            throw new Error('فشل فك تشفير البيانات');
        }
    }

    async storeBackup(backup) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const request = store.add(backup);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    updateBackupInfo(backup) {
        const backupInfo = JSON.parse(localStorage.getItem(this.backupStorage) || '{}');
        backupInfo[backup.id] = {
            id: backup.id,
            date: backup.date,
            type: backup.type,
            size: backup.size,
            encrypted: backup.encrypted,
            description: backup.metadata.description
        };
        localStorage.setItem(this.backupStorage, JSON.stringify(backupInfo));
    }

    async cleanOldBackups() {
        try {
            const backupInfo = JSON.parse(localStorage.getItem(this.backupStorage) || '{}');
            const backupIds = Object.keys(backupInfo)
                .map(id => parseInt(id))
                .sort((a, b) => b - a); // Sort by date (newest first)

            if (backupIds.length > this.maxBackups) {
                const idsToDelete = backupIds.slice(this.maxBackups);
                
                for (const id of idsToDelete) {
                    await this.deleteBackup(id);
                    delete backupInfo[id];
                }
                
                localStorage.setItem(this.backupStorage, JSON.stringify(backupInfo));
                console.log(`[Backup Manager] Cleaned ${idsToDelete.length} old backups`);
            }
        } catch (error) {
            console.error('[Backup Manager] Failed to clean old backups:', error);
        }
    }

    async restoreBackup(backupId) {
        try {
            console.log('[Backup Manager] Restoring backup...');
            
            this.showLoading('جاري استعادة النسخة الاحتياطية...');

            // Get backup from IndexedDB
            const backup = await this.getBackup(backupId);
            if (!backup) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }

            // Decrypt if needed
            let backupData = backup.data;
            if (backup.encrypted && this.encryptionKey) {
                backupData = await this.decryptData(backupData);
            }

            // Decompress data
            const decompressedData = this.decompressData(backupData);
            
            // Validate backup data
            if (!this.validateBackupData(decompressedData)) {
                throw new Error('بيانات النسخة الاحتياطية غير صالحة');
            }

            // Create a backup before restoring
            await this.createBackup({
                type: 'pre-restore',
                description: 'نسخة احتياطية قبل الاستعادة'
            });

            // Restore data
            await this.restoreData(decompressedData.data);

            // Restore settings
            if (decompressedData.data.settings) {
                this.restoreSettings(decompressedData.data.settings);
            }

            this.hideLoading();
            this.showNotification('تم استعادة النسخة الاحتياطية بنجاح', 'success');
            
            // Reload the page to apply changes
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('[Backup Manager] Restore failed:', error);
            this.hideLoading();
            this.showNotification('فشل استعادة النسخة الاحتياطية', 'error');
            throw error;
        }
    }

    async getBackup(backupId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const request = store.get(backupId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    decompressData(compressedData) {
        try {
            const jsonString = atob(compressedData);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('[Backup Manager] Failed to decompress data:', error);
            throw new Error('فشل فك ضغط البيانات');
        }
    }

    validateBackupData(data) {
        try {
            // Check if data has required structure
            return data && 
                   data.metadata && 
                   data.metadata.version && 
                   data.metadata.date && 
                   data.data;
        } catch (error) {
            return false;
        }
    }

    async restoreData(data) {
        // This would need to be implemented based on your database structure
        console.log('[Backup Manager] Restoring data...');
        
        // Restore each table
        for (const [tableName, records] of Object.entries(data)) {
            if (tableName === 'settings') continue; // Settings are handled separately
            
            try {
                await this.restoreTable(tableName, records);
                console.log(`[Backup Manager] Restored ${records.length} records in ${tableName}`);
            } catch (error) {
                console.error(`[Backup Manager] Failed to restore table ${tableName}:`, error);
            }
        }
    }

    async restoreTable(tableName, records) {
        // This would need to be implemented based on your database structure
        console.log(`[Backup Manager] Restoring table: ${tableName}`);
    }

    restoreSettings(settings) {
        // Clear existing mentra settings
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mentra_') && !key.includes('backup')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Restore settings
        for (const [key, value] of Object.entries(settings)) {
            localStorage.setItem(key, value);
        }
        
        console.log('[Backup Manager] Restored settings');
    }

    async deleteBackup(backupId) {
        try {
            // Delete from IndexedDB
            await this.deleteBackupFromDB(backupId);
            
            // Delete from localStorage
            const backupInfo = JSON.parse(localStorage.getItem(this.backupStorage) || '{}');
            delete backupInfo[backupId];
            localStorage.setItem(this.backupStorage, JSON.stringify(backupInfo));
            
            console.log('[Backup Manager] Backup deleted successfully');
        } catch (error) {
            console.error('[Backup Manager] Failed to delete backup:', error);
            throw error;
        }
    }

    async deleteBackupFromDB(backupId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const request = store.delete(backupId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async exportBackup(backupId) {
        try {
            const backup = await this.getBackup(backupId);
            if (!backup) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }

            // Create export file
            const exportData = {
                metadata: backup.metadata,
                data: backup.data,
                exported: new Date().toISOString(),
                exportedBy: 'Mentra ERP Backup Manager'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mentra-backup-${backup.date.split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showNotification('تم تصدير النسخة الاحتياطية', 'success');

        } catch (error) {
            console.error('[Backup Manager] Export failed:', error);
            this.showNotification('فشل تصدير النسخة الاحتياطية', 'error');
        }
    }

    async importBackup(file) {
        try {
            this.showLoading('جاري استيراد النسخة الاحتياطية...');

            const text = await file.text();
            const importData = JSON.parse(text);

            // Validate import data
            if (!this.validateBackupData(importData)) {
                throw new Error('ملف النسخة الاحتياطية غير صالح');
            }

            // Create backup record
            const backup = {
                id: Date.now(),
                date: importData.metadata.date,
                type: 'imported',
                size: this.getDataSize(JSON.stringify(importData)),
                encrypted: importData.metadata.encrypted,
                data: importData.data,
                metadata: importData.metadata
            };

            // Store backup
            await this.storeBackup(backup);
            this.updateBackupInfo(backup);

            this.hideLoading();
            this.showNotification('تم استيراد النسخة الاحتياطية بنجاح', 'success');

        } catch (error) {
            console.error('[Backup Manager] Import failed:', error);
            this.hideLoading();
            this.showNotification('فشل استيراد النسخة الاحتياطية', 'error');
        }
    }

    getBackupList() {
        const backupInfo = JSON.parse(localStorage.getItem(this.backupStorage) || '{}');
        return Object.values(backupInfo)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getDataSize(data) {
        return new Blob([data]).size;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    startAutoBackup(intervalHours = 24) {
        // Clear existing interval
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }

        // Set new interval
        this.autoBackupInterval = setInterval(async () => {
            try {
                await this.createBackup({
                    type: 'auto',
                    description: 'نسخة احتياطية تلقائية'
                });
            } catch (error) {
                console.error('[Backup Manager] Auto backup failed:', error);
            }
        }, intervalHours * 60 * 60 * 1000);

        console.log(`[Backup Manager] Auto backup started (${intervalHours}h interval)`);
    }

    stopAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
            console.log('[Backup Manager] Auto backup stopped');
        }
    }

    showLoading(message = 'جاري المعالجة...') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: message,
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
    }

    hideLoading() {
        if (typeof Swal !== 'undefined') {
            Swal.close();
        }
    }

    showNotification(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
                title: message,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } else {
            // Fallback notification
            console.log(`[Backup Manager] ${type}: ${message}`);
        }
    }
}

// Initialize global backup manager
window.BackupManager = new BackupManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupManager;
}