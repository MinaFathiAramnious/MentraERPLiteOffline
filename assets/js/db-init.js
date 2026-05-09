/**
 * MENTRA ERP - Database Initializer (Multi-Tenant Version 3.0)
 * كل محل له قاعدة بيانات منفصلة تماماً
 */

// ============================================================
// 1. تحديد اسم قاعدة البيانات بناءً على المحل الحالي
//    يتم حفظ اسم الـ DB في localStorage عند إنشاء المحل أو تسجيل الدخول
// ============================================================
function getCurrentDBName() {
    return localStorage.getItem('mentra_current_db') || 'MentraLocalCache';
}

// 2. إنشاء قاعدة البيانات بالاسم الديناميكي
const db = new Dexie(getCurrentDBName());

// 3. هيكلة قاعدة البيانات (Schema) - الإصدار 4
db.version(4).stores({
    settings:        'id, project_name, shop_name, phone, logo',
    local_users:     '++id, username, full_name, role',
    active_session:  'id, user_id, login_time',
    products:        '++id, name_ar, sku, category, stock_qty, price, cost',
    invoices:        '++id, invoice_number, type, customer_vendor_id, date, total, status',
    invoice_items:   '++id, invoice_id, product_id, price, qty, total_item',
    accounts:        '++id, code, name_ar, type, balance',
    journal:         '++id, date, ref_no, description, total',
    journal_items:   '++id, journal_id, account_id, debit, credit',
    stock_movements: '++id, product_id, type, qty, date, ref_id'
});

// 4. حماية ذكية: يضمن وجود الجداول قبل التشغيل
db.on("ready", function () {
    const tables = db.tables.map(t => t.name);
    const requiredTables = ["products", "invoices", "invoice_items"];
    const isMissing = requiredTables.some(t => !tables.includes(t));
    if (isMissing) {
        console.warn("⚠️ جداول مفقودة! جاري إعادة بناء قاعدة البيانات...");
        return db.delete().then(() => location.reload());
    }
});

// 5. دوال مساعدة (Global Utils)
const dbUtils = {
    // تحديث المخزن
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

// ============================================================
// 6. أداة Multi-Tenancy: إدارة قواعد بيانات المحلات
// ============================================================
const tenantManager = {
    // توليد اسم DB آمن من اسم المحل
    buildDBName: (shopName) => {
        const safe = shopName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
        return `MentraDB_${safe}`;
    },

    // حفظ قائمة المحلات المسجلة على الجهاز
    getShopsList: () => {
        return JSON.parse(localStorage.getItem('mentra_shops_list') || '[]');
    },

    addShopToList: (shopName, dbName, username) => {
        const list = tenantManager.getShopsList();
        const exists = list.find(s => s.dbName === dbName);
        if (!exists) {
            list.push({ shopName, dbName, username, createdAt: new Date().toISOString() });
            localStorage.setItem('mentra_shops_list', JSON.stringify(list));
        }
    },

    // تفعيل محل معين (تغيير الـ DB النشط)
    switchTo: (dbName) => {
        localStorage.setItem('mentra_current_db', dbName);
    },

    // الـ DB النشط حالياً
    current: () => localStorage.getItem('mentra_current_db') || null
};

// 7. التشغيل النهائي
async function initDB() {
    try {
        await dbUtils.requestPersistence();
        await db.open();
        console.log(`🚀 MENTRA DB جاهز | القاعدة: "${getCurrentDBName()}" | الإصدار: ${db.verno}`);
    } catch (err) {
        console.error("❌ فشل تشغيل القاعدة:", err.stack || err);
        if (err.name === 'VersionError') {
            await db.delete();
            location.reload();
        }
    }
}

initDB();
