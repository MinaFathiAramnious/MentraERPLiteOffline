// تحديد اسم ورقم إصدار الـ Cache (يجب تغييره عند تحديث أي ملف في المشروع)
const CACHE_NAME = 'mentra-erp-lite-v1';

// قائمة بالملفات الأساسية التي يجب تحميلها وتخزينها عند تثبيت التطبيق
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './login.html',
    './dashboard.html',
    './subscriptions.html',
    './test_quick_actions.html',
    './Tutorial.html',
    './manifest.json',
    
    // ملفات التنسيق CSS
    './assets/css/style.css',
    
    // ملفات الجافاسكريبت (من مجلد pages)
    './pages/accounts.js',
    './pages/Inventory.js',
    './pages/journal.js',
    './pages/main.js',
    './pages/profit_report.js',
    './pages/purchases.js',
    './pages/purchases_report.js',
    './pages/sales.js',
    './pages/sales_report.js',
    './pages/settings.js',
    './pages/system_info.js',
    
    // الصور الأساسية (يرجى التأكد من امتداد الصور png أو jpg وتعديله إن لزم الأمر)
    './assets/img/icon.png',
    './assets/img/profile.png',
    './assets/img/smalicon.png'
    // تم استثناء صور الـ Screenshots لأنها غالباً غير ضرورية لعمل التطبيق وتأخذ مساحة
];

// 1. حدث التثبيت (Install Event) - حفظ الملفات في الـ Cache
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching App Shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // تفعيل الـ Service Worker الجديد فوراً
    );
});

// 2. حدث التفعيل (Activate Event) - تنظيف الـ Cache القديم عند تحديث الإصدار
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // إذا كان اسم الكاش القديم لا يطابق الحالي، قم بحذفه
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // السيطرة على الصفحات المفتوحة فوراً
    );
});

// 3. حدث الجلب (Fetch Event) - استراتيجية: الـ Cache أولاً، ثم الشبكة
self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات التي ليست من نوع GET (مثل POST أو PUT)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // إذا وجد الملف في الكاش، قم بإرجاعه فوراً (أداء سريع جداً + يعمل أوفلاين)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // إذا لم يوجد في الكاش، قم بجلبه من الإنترنت/السيرفر المحلي
                return fetch(event.request).then((networkResponse) => {
                    // التحقق من صحة الاستجابة
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // تخزين ديناميكي: نسخ الملف الجديد وحفظه في الكاش للاستخدام المستقبلي
                    // استثنينا ملفات الاكسيل من التخزين المؤقت لتجنب المشاكل
                    if(!event.request.url.includes('.xlsx')) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return networkResponse;
                }).catch(() => {
                    // يحدث هذا الخطأ إذا كان الجهاز غير متصل بالإنترنت والملف غير موجود بالكاش
                    console.error('[Service Worker] Fetch failed, device might be offline.');
                    // يمكنك هنا إرجاع صفحة HTML مخصصة للأوفلاين إذا أردت مستقبلاً
                });
            })
    );
});