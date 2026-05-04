/**
 * MENTRA ERP - Database Initializer (Stable Version 2.1)
 * تم دمج الحماية الذكية وإصلاح أخطاء التعريف
 */

// 1. تعريف قاعدة البيانات (مرة واحدة فقط)
const db = new Dexie("MentraLocalCache");

// تحديث الهيكلة (Schema) - الإصدار 4
db.version(4).stores({
    // الجدول الجديد للمستخدمين المحليين
    settings: 'id, project_name, shop_name, phone, logo',
    local_users: '++id, username, full_name, role', 
    active_session: 'id, user_id, login_time',
    products: '++id, name_ar, sku, category, stock_qty, price, cost', 
    invoices: '++id, invoice_number, type, customer_vendor_id, date, total, status',
    invoice_items: '++id, invoice_id, product_id, price, qty, total_item',
    accounts: '++id, code, name_ar, type, balance',
    journal: '++id, date, ref_no, description, total',
    journal_items: '++id, journal_id, account_id, debit, credit',
    stock_movements: '++id, product_id, type, qty, date, ref_id'
});

// 3. كود الحماية الذكي: يضمن وجود الجداول قبل التشغيل
db.on("ready", function () {
    const tables = db.tables.map(t => t.name);
    const requiredTables = ["products", "invoices", "invoice_items"];
    
    const isMissing = requiredTables.some(t => !tables.includes(t));
    
    if (isMissing) {
        console.warn("⚠️ جداول مفقودة! جاري إعادة بناء قاعدة البيانات للترقية...");
        // مسح القاعدة وإعادة التحميل لضمان إنشاء الجداول الجديدة
        return db.delete().then(() => {
            location.reload();
        });
    }
});

// 4. دوال مساعدة (Global Utils)
const dbUtils = {
    // تحديث المخزن بطريقة احترافية
    updateStock: async (productId, changeQty, mode = 'decrease') => {
        try {
            const product = await db.table('products').get(productId);
            if (product) {
                const newQty = (mode === 'decrease') 
                    ? (Number(product.stock_qty) || 0) - Number(changeQty)
                    : (Number(product.stock_qty) || 0) + Number(changeQty);
                
                await db.table('products').update(productId, { stock_qty: newQty });
                console.log(`✅ تم تحديث المخزن: ${product.name_ar} -> ${newQty}`);
            }
        } catch (err) {
            console.error("❌ خطأ في تحديث المخزن:", err);
        }
    },

    // طلب حماية البيانات من الحذف بواسطة المتصفح
    requestPersistence: async () => {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log(`🔒 حماية البيانات: ${isPersisted ? "مفعلة ✅" : "غير مفعلة ⚠️"}`);
        }
    }
};

// 5. التشغيل النهائي
async function initDB() {
    try {
        await dbUtils.requestPersistence();
        await db.open();
        console.log("🚀 محرك MENTRA DB جاهز - الإصدار:", db.verno);
    } catch (err) {
        console.error("❌ فشل تشغيل القاعدة:", err.stack || err);
        // إذا كان الخطأ بسبب تضارب الإصدارات، نقوم بالحل الجذري
        if (err.name === 'VersionError') {
            await db.delete();
            location.reload();
        }
    }
}

initDB();