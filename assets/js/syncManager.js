/**
 * MENTRA ERP - Sync Manager
 * نظام المزامنة المتقدم
 * Version: 1.0.0
 */

class SyncManager {
    constructor() {
        this.db = null;
        this.syncStatus = 'idle';
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.conflicts = [];
        this.init();
    }

    async init() {
        try {
            // تهيئة قاعدة بيانات المزامنة
            this.db = new Dexie("MentraSyncSystem");
            this.db.version(1).stores({
                sync_queue: '++id, table, record_id, action, data, timestamp, status',
                sync_log: '++id, timestamp, action, status, details',
                conflicts: '++id, table, record_id, local_data, remote_data, timestamp, resolved'
            });

            console.log('🔄 SyncManager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize SyncManager:', error);
        }
    }

    /**
     * بدء المزامنة التلقائية
     */
    enableAutoSync(intervalMinutes = 5) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            try {
                await this.performSync();
            } catch (error) {
                console.error('Auto sync failed:', error);
            }
        }, intervalMinutes * 60 * 1000);

        console.log(`🔄 Auto sync enabled (every ${intervalMinutes} minutes)`);
    }

    /**
     * إيقاف المزامنة التلقائية
     */
    disableAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Auto sync disabled');
        }
    }

    /**
     * إجراء المزامنة الكاملة
     */
    async performSync() {
        try {
            this.syncStatus = 'syncing';
            this.notifyStatus('جاري المزامنة...');

            // الحصول على البيانات المعلقة
            const pendingSync = await this.getPendingSync();
            
            if (pendingSync.length === 0) {
                this.syncStatus = 'completed';
                this.notifyStatus('تمت المزامنة (لا توجد تغييرات)');
                return { success: true, synced: 0, conflicts: 0 };
            }

            // مزامنة كل عنصر
            let synced = 0;
            let conflicts = 0;

            for (const item of pendingSync) {
                try {
                    const result = await this.syncItem(item);
                    if (result.success) {
                        synced++;
                        await this.markSynced(item.id);
                    } else if (result.conflict) {
                        conflicts++;
                        await this.handleConflict(item, result.remoteData);
                    }
                } catch (error) {
                    console.error('Sync item failed:', error);
                }
            }

            this.syncStatus = 'completed';
            this.lastSyncTime = new Date();
            
            const message = `تمت المزامنة: ${synced} عنصر${conflicts > 0 ? `، ${conflicts} تعارض` : ''}`;
            this.notifyStatus(message);

            return { success: true, synced, conflicts };

        } catch (error) {
            this.syncStatus = 'error';
            this.notifyStatus('فشلت المزامنة');
            console.error('Sync failed:', error);
            throw error;
        }
    }

    /**
     * مزامنة عنصر واحد
     */
    async syncItem(item) {
        try {
            // محاكاة الاتصال بالخادم
            await this.simulateServerCall();
            
            // التحقق من وجود تعارض
            const conflict = await this.checkForConflict(item);
            if (conflict) {
                return { success: false, conflict: true, remoteData: conflict };
            }

            // محاكاة المزامنة الناجحة
            console.log(`🔄 Synced ${item.table}:${item.record_id} - ${item.action}`);
            return { success: true };

        } catch (error) {
            console.error('Item sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * التحقق من وجود تعارض
     */
    async checkForConflict(item) {
        // محاكاة التحقق من التعارض
        if (Math.random() < 0.1) { // 10% فرصة للتعارض
            return {
                timestamp: new Date().toISOString(),
                data: `Modified remotely at ${new Date().toLocaleString('ar-EG')}`
            };
        }
        return null;
    }

    /**
     * التعامل مع التعارض
     */
    async handleConflict(localItem, remoteData) {
        try {
            await this.db.conflicts.add({
                table: localItem.table,
                record_id: localItem.record_id,
                local_data: localItem.data,
                remote_data: remoteData,
                timestamp: new Date().toISOString(),
                resolved: false
            });

            console.warn(`⚠️ Conflict detected for ${localItem.table}:${localItem.record_id}`);
            
            // إشعار المستخدم
            if (window.Swal) {
                window.Swal.fire({
                    icon: 'warning',
                    title: 'تعارض في المزامنة',
                    text: `تم اكتشاف تعارض في ${localItem.table}. يرجى المراجعة.`,
                    confirmButtonText: 'حسناً'
                });
            }

        } catch (error) {
            console.error('Failed to handle conflict:', error);
        }
    }

    /**
     * الحصول على العناصر المعلقة للمزامنة
     */
    async getPendingSync() {
        try {
            return await this.db.sync_queue
                .where('status')
                .equals('pending')
                .toArray();
        } catch (error) {
            console.error('Failed to get pending sync:', error);
            return [];
        }
    }

    /**
     * تعيين العنصر كمتم المزامنة
     */
    async markSynced(itemId) {
        try {
            await this.db.sync_queue.update(itemId, {
                status: 'synced',
                synced_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to mark as synced:', error);
        }
    }

    /**
     * إضافة عنصر لقائمة الانتظار
     */
    async queueForSync(table, recordId, action, data) {
        try {
            await this.db.sync_queue.add({
                table,
                record_id: recordId,
                action,
                data,
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            console.log(`📝 Queued ${action} on ${table}:${recordId}`);
        } catch (error) {
            console.error('Failed to queue for sync:', error);
        }
    }

    /**
     * محاكاة الاتصال بالخادم
     */
    async simulateServerCall() {
        // محاكاة تأخير الشبكة
        return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    }

    /**
     * إشعار بالحالة
     */
    notifyStatus(message) {
        console.log(`🔄 Sync Status: ${message}`);
        
        // تحديث الواجهة إذا كانت متاحة
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `sync-status ${this.syncStatus}`;
        }
    }

    /**
     * الحصول على إحصائيات المزامنة
     */
    async getSyncStats() {
        try {
            const pending = await this.db.sync_queue.where('status').equals('pending').count();
            const synced = await this.db.sync_queue.where('status').equals('synced').count();
            const conflicts = await this.db.conflicts.where('resolved').equals(false).count();

            return {
                pending,
                synced,
                conflicts,
                lastSync: this.lastSyncTime,
                status: this.syncStatus
            };
        } catch (error) {
            console.error('Failed to get sync stats:', error);
            return { pending: 0, synced: 0, conflicts: 0, lastSync: null, status: 'error' };
        }
    }

    /**
     * حل التعارض
     */
    async resolveConflict(conflictId, resolution) {
        try {
            const conflict = await this.db.conflicts.get(conflictId);
            if (!conflict) {
                throw new Error('Conflict not found');
            }

            // تطبيق القرار
            if (resolution === 'local') {
                // استخدام البيانات المحلية
                await this.queueForSync(conflict.table, conflict.record_id, 'update', conflict.local_data);
            } else if (resolution === 'remote') {
                // استخدام البيانات البعيدة
                // تحديث البيانات المحلية بالبيانات البعيدة
                if (db.table(conflict.table)) {
                    await db.table(conflict.table).update(conflict.record_id, JSON.parse(conflict.remote_data).data);
                }
            }

            // تعليم التعارض كمحلول
            await this.db.conflicts.update(conflictId, {
                resolved: true,
                resolved_at: new Date().toISOString(),
                resolution: resolution
            });

            console.log(`✅ Resolved conflict ${conflictId} with ${resolution} data`);
            return true;

        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            return false;
        }
    }

    /**
     * مسح سجل المزامنة
     */
    async clearSyncLog() {
        try {
            await this.db.sync_queue.clear();
            await this.db.conflicts.clear();
            console.log('🧹 Sync log cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear sync log:', error);
            return false;
        }
    }
}

// إنشاء نسخة واحدة من مدير المزامنة
window.syncManager = new SyncManager();