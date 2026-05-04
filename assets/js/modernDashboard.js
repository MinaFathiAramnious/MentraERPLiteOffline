/**
 * MENTRA ERP - Modern Dashboard
 * لوحة التحكم الحديثة
 * Version: 1.0.0
 */

class ModernDashboard {
    constructor() {
        this.db = null;
        this.widgets = [];
        this.charts = {};
        this.refreshInterval = null;
        this.notifications = [];
        this.init();
    }

    async init() {
        try {
            this.db = db;
            await this.loadWidgets();
            this.startAutoRefresh();
            console.log('🎯 ModernDashboard initialized');
        } catch (error) {
            console.error('❌ Failed to initialize ModernDashboard:', error);
        }
    }

    /**
     * تحميل عناصر الواجهة
     */
    async loadWidgets() {
        this.widgets = [
            {
                id: 'sales-stats',
                title: 'إحصائيات المبيعات',
                type: 'stats',
                icon: 'fa-chart-line',
                color: 'blue',
                refresh: () => this.getSalesStats()
            },
            {
                id: 'inventory-status',
                title: 'حالة المخزون',
                type: 'stats',
                icon: 'fa-boxes',
                color: 'emerald',
                refresh: () => this.getInventoryStats()
            },
            {
                id: 'recent-activity',
                title: 'النشاط الأخير',
                type: 'list',
                icon: 'fa-clock',
                color: 'purple',
                refresh: () => this.getRecentActivity()
            },
            {
                id: 'quick-actions',
                title: 'إجراءات سريعة',
                type: 'actions',
                icon: 'fa-bolt',
                color: 'orange',
                refresh: () => this.getQuickActions()
            },
            {
                id: 'notifications',
                title: 'الإشعارات',
                type: 'notifications',
                icon: 'fa-bell',
                color: 'red',
                refresh: () => this.getNotifications()
            },
            {
                id: 'system-health',
                title: 'صحة النظام',
                type: 'health',
                icon: 'fa-heartbeat',
                color: 'green',
                refresh: () => this.getSystemHealth()
            }
        ];
    }

    /**
     * عرض لوحة التحكم
     */
    async render() {
        const container = document.getElementById('dashboard-container');
        if (!container) return;

        try {
            container.innerHTML = `
                <div class="dashboard-header mb-6">
                    <h1 class="text-3xl font-bold text-slate-800 mb-2">لوحة التحكم</h1>
                    <p class="text-slate-600">نظرة عامة على أداء النظام</p>
                    <div class="flex gap-3 mt-4">
                        <button onclick="modernDashboard.refreshAll()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            <i class="fas fa-sync-alt ml-2"></i> تحديث الكل
                        </button>
                        <button onclick="modernDashboard.exportDashboard()" class="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                            <i class="fas fa-download ml-2"></i> تصدير
                        </button>
                    </div>
                </div>
                <div class="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${await this.renderWidgets()}
                </div>
                <div class="dashboard-charts mt-8">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${await this.renderCharts()}
                    </div>
                </div>
            `;

            // تحديث البيانات
            await this.refreshAll();
        } catch (error) {
            console.error('Failed to render dashboard:', error);
        }
    }

    /**
     * عرض العناصر
     */
    async renderWidgets() {
        let html = '';
        
        for (const widget of this.widgets) {
            const data = await widget.refresh();
            html += await this.renderWidget(widget, data);
        }
        
        return html;
    }

    /**
     * عرض عنصر واحد
     */
    async renderWidget(widget, data) {
        const colorClasses = {
            blue: 'bg-blue-500 border-blue-200',
            emerald: 'bg-emerald-500 border-emerald-200',
            purple: 'bg-purple-500 border-purple-200',
            orange: 'bg-orange-500 border-orange-200',
            red: 'bg-red-500 border-red-200',
            green: 'bg-green-500 border-green-200'
        };

        const bgClass = colorClasses[widget.color] || colorClasses.blue;

        switch (widget.type) {
            case 'stats':
                return this.renderStatsWidget(widget, data, bgClass);
            case 'list':
                return this.renderListWidget(widget, data, bgClass);
            case 'actions':
                return this.renderActionsWidget(widget, data, bgClass);
            case 'notifications':
                return this.renderNotificationsWidget(widget, data, bgClass);
            case 'health':
                return this.renderHealthWidget(widget, data, bgClass);
            default:
                return '';
        }
    }

    /**
     * عرض عنصر إحصائيات
     */
    renderStatsWidget(widget, data, bgClass) {
        return `
            <div class="widget-card bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div class="${bgClass} text-white p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-lg">${widget.title}</h3>
                        <i class="fas ${widget.icon} text-2xl opacity-80"></i>
                    </div>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-2 gap-4">
                        ${Object.entries(data.stats || {}).map(([key, value]) => `
                            <div class="text-center">
                                <p class="text-2xl font-bold text-slate-800">${this.formatValue(value)}</p>
                                <p class="text-sm text-slate-500">${this.formatLabel(key)}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-200">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-slate-500">آخر تحديث</span>
                            <span class="text-slate-700">${new Date().toLocaleTimeString('ar-EG')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * عرض عنصر قائمة
     */
    renderListWidget(widget, data, bgClass) {
        return `
            <div class="widget-card bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div class="${bgClass} text-white p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-lg">${widget.title}</h3>
                        <i class="fas ${widget.icon} text-2xl opacity-80"></i>
                    </div>
                </div>
                <div class="p-6">
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        ${(data.items || []).slice(0, 5).map(item => `
                            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 bg-${widget.color}-500 rounded-full"></div>
                                    <div>
                                        <p class="font-medium text-slate-800">${item.title}</p>
                                        <p class="text-sm text-slate-500">${item.description}</p>
                                    </div>
                                </div>
                                <span class="text-xs text-slate-400">${item.time}</span>
                            </div>
                        `).join('')}
                        ${(data.items || []).length === 0 ? `
                            <p class="text-center text-slate-400 py-8">لا توجد بيانات</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * عرض عنصر الإجراءات
     */
    renderActionsWidget(widget, data, bgClass) {
        return `
            <div class="widget-card bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div class="${bgClass} text-white p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-lg">${widget.title}</h3>
                        <i class="fas ${widget.icon} text-2xl opacity-80"></i>
                    </div>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-2 gap-3">
                        ${(data.actions || []).map(action => `
                            <button onclick="${action.onclick}" class="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group">
                                <i class="fas ${action.icon} text-${widget.color}-500 mb-2 group-hover:scale-110 transition-transform"></i>
                                <p class="text-sm font-medium text-slate-700">${action.title}</p>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * عرض عنصر الإشعارات
     */
    renderNotificationsWidget(widget, data, bgClass) {
        return `
            <div class="widget-card bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div class="${bgClass} text-white p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-lg">${widget.title}</h3>
                        <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">${data.count || 0}</span>
                    </div>
                </div>
                <div class="p-6">
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        ${(data.notifications || []).slice(0, 5).map(notif => `
                            <div class="p-3 ${notif.type === 'error' ? 'bg-red-50 border-red-200' : notif.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} border rounded-lg">
                                <p class="font-medium text-slate-800 text-sm">${notif.message}</p>
                                <p class="text-xs text-slate-500 mt-1">${notif.time}</p>
                            </div>
                        `).join('')}
                        ${(data.notifications || []).length === 0 ? `
                            <p class="text-center text-slate-400 py-8">لا توجد إشعارات</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * عرض عنصر صحة النظام
     */
    renderHealthWidget(widget, data, bgClass) {
        const healthScore = data.healthScore || 0;
        const healthColor = healthScore >= 80 ? 'emerald' : healthScore >= 60 ? 'yellow' : 'red';
        
        return `
            <div class="widget-card bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div class="${bgClass} text-white p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-lg">${widget.title}</h3>
                        <i class="fas ${widget.icon} text-2xl opacity-80"></i>
                    </div>
                </div>
                <div class="p-6">
                    <div class="text-center mb-4">
                        <div class="relative inline-flex items-center justify-center w-24 h-24">
                            <svg class="transform -rotate-90 w-24 h-24">
                                <circle cx="48" cy="48" r="36" stroke="currentColor" stroke-width="8" fill="none" class="text-slate-200"></circle>
                                <circle cx="48" cy="48" r="36" stroke="currentColor" stroke-width="8" fill="none" class="text-${healthColor}-500" stroke-dasharray="${healthScore * 2.26} 226" stroke-linecap="round"></circle>
                            </svg>
                            <span class="absolute text-2xl font-bold text-slate-800">${healthScore}%</span>
                        </div>
                        <p class="text-sm text-slate-500 mt-2">درجة صحة النظام</p>
                    </div>
                    <div class="space-y-2">
                        ${(data.checks || []).map(check => `
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-slate-600">${check.name}</span>
                                <span class="${check.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}">
                                    <i class="fas ${check.status === 'ok' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * عرض المخططات
     */
    async renderCharts() {
        const salesData = await this.getSalesChartData();
        const inventoryData = await this.getInventoryChartData();

        return `
            <div class="chart-card bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 class="font-bold text-lg text-slate-800 mb-4">مخطط المبيعات</h3>
                <div class="h-64 flex items-center justify-center text-slate-400">
                    <canvas id="sales-chart"></canvas>
                </div>
            </div>
            <div class="chart-card bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 class="font-bold text-lg text-slate-800 mb-4">تحليل المخزون</h3>
                <div class="h-64 flex items-center justify-center text-slate-400">
                    <canvas id="inventory-chart"></canvas>
                </div>
            </div>
        `;
    }

    /**
     * الحصول على إحصائيات المبيعات
     */
    async getSalesStats() {
        try {
            const today = new Date();
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            
            const invoices = await this.db.invoices.toArray();
            const todayInvoices = invoices.filter(inv => new Date(inv.date || inv.timestamp) >= new Date(today.setHours(0,0,0,0)));
            const monthInvoices = invoices.filter(inv => new Date(inv.date || inv.timestamp) >= thisMonth);

            const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.final_total || 0), 0);
            const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.final_total || 0), 0);

            return {
                stats: {
                    todaySales: todayRevenue,
                    monthSales: monthRevenue,
                    todayInvoices: todayInvoices.length,
                    monthInvoices: monthInvoices.length
                }
            };
        } catch (error) {
            console.error('Failed to get sales stats:', error);
            return { stats: {} };
        }
    }

    /**
     * الحصول على إحصائيات المخزون
     */
    async getInventoryStats() {
        try {
            const products = await this.db.products.toArray();
            const totalProducts = products.length;
            const lowStock = products.filter(p => p.stock_quantity <= (p.min_stock || 10)).length;
            const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
            const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity || 0) * (p.unit_cost || 0), 0);

            return {
                stats: {
                    totalProducts,
                    lowStock,
                    outOfStock,
                    totalValue
                }
            };
        } catch (error) {
            console.error('Failed to get inventory stats:', error);
            return { stats: {} };
        }
    }

    /**
     * الحصول على النشاط الأخير
     */
    async getRecentActivity() {
        try {
            const activities = [];
            
            // آخر الفواتير
            const recentInvoices = await this.db.invoices.orderBy('timestamp').reverse().limit(5).toArray();
            recentInvoices.forEach(invoice => {
                activities.push({
                    title: `فاتورة #${invoice.id}`,
                    description: `عميل: ${invoice.customer_name || 'غير محدد'}`,
                    time: new Date(invoice.timestamp).toLocaleTimeString('ar-EG')
                });
            });

            return { items: activities };
        } catch (error) {
            console.error('Failed to get recent activity:', error);
            return { items: [] };
        }
    }

    /**
     * الحصول على الإجراءات السريعة
     */
    getQuickActions() {
        return {
            actions: [
                { title: 'بيع جديد', icon: 'fa-cash-register', onclick: 'executeModuleLoad("sales")' },
                { title: 'إضافة منتج', icon: 'fa-plus', onclick: 'executeModuleLoad("Inventory")' },
                { title: 'تقرير المبيعات', icon: 'fa-chart-bar', onclick: 'executeModuleLoad("sales_report")' },
                { title: 'نسخ احتياطي', icon: 'fa-save', onclick: 'window.createQuickBackup()' }
            ]
        };
    }

    /**
     * الحصول على الإشعارات
     */
    async getNotifications() {
        try {
            const notifications = [];
            
            // التحقق من المخزون المنخفض
            const products = await this.db.products.toArray();
            const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock || 10));
            
            if (lowStockProducts.length > 0) {
                notifications.push({
                    type: 'warning',
                    message: `${lowStockProducts.length} منتجات بمخزون منخفض`,
                    time: 'الآن'
                });
            }

            // التحقق من النسخ الاحتياطي
            const lastBackup = localStorage.getItem('lastBackupTime');
            if (lastBackup) {
                const daysSinceBackup = Math.floor((Date.now() - parseInt(lastBackup)) / (1000 * 60 * 60 * 24));
                if (daysSinceBackup > 7) {
                    notifications.push({
                        type: 'warning',
                        message: `آخر نسخة احتياطية منذ ${daysSinceBackup} يوم`,
                        time: 'الآن'
                    });
                }
            } else {
                notifications.push({
                    type: 'error',
                    message: 'لا توجد نسخ احتياطية',
                    time: 'الآن'
                });
            }

            return { notifications, count: notifications.length };
        } catch (error) {
            console.error('Failed to get notifications:', error);
            return { notifications: [], count: 0 };
        }
    }

    /**
     * الحصول على صحة النظام
     */
    async getSystemHealth() {
        try {
            const checks = [];
            let healthScore = 100;

            // التحقق من قاعدة البيانات
            try {
                await this.db.products.limit(1).toArray();
                checks.push({ name: 'قاعدة البيانات', status: 'ok' });
            } catch (error) {
                checks.push({ name: 'قاعدة البيانات', status: 'error' });
                healthScore -= 30;
            }

            // التحقق من المساحة التخزينية
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usagePercent = (estimate.usage / estimate.quota) * 100;
                if (usagePercent > 90) {
                    checks.push({ name: 'مساحة التخزين', status: 'error' });
                    healthScore -= 20;
                } else {
                    checks.push({ name: 'مساحة التخزين', status: 'ok' });
                }
            }

            // التحقق من النسخ الاحتياطية
            const lastBackup = localStorage.getItem('lastBackupTime');
            if (lastBackup) {
                const daysSinceBackup = Math.floor((Date.now() - parseInt(lastBackup)) / (1000 * 60 * 60 * 24));
                if (daysSinceBackup <= 7) {
                    checks.push({ name: 'النسخ الاحتياطي', status: 'ok' });
                } else {
                    checks.push({ name: 'النسخ الاحتياطي', status: 'error' });
                    healthScore -= 15;
                }
            } else {
                checks.push({ name: 'النسخ الاحتياطي', status: 'error' });
                healthScore -= 25;
            }

            return { healthScore: Math.max(0, healthScore), checks };
        } catch (error) {
            console.error('Failed to get system health:', error);
            return { healthScore: 0, checks: [] };
        }
    }

    /**
     * تحديث جميع العناصر
     */
    async refreshAll() {
        try {
            for (const widget of this.widgets) {
                const element = document.getElementById(`${widget.id}-widget`);
                if (element) {
                    const data = await widget.refresh();
                    element.innerHTML = await this.renderWidget(widget, data, this.getColorClass(widget.color));
                }
            }
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        }
    }

    /**
     * بدء التحديث التلقائي
     */
    startAutoRefresh(intervalMinutes = 5) {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(async () => {
            await this.refreshAll();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * إيقاف التحديث التلقائي
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * تصدير لوحة التحكم
     */
    async exportDashboard() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                sales: await this.getSalesStats(),
                inventory: await this.getInventoryStats(),
                activity: await this.getRecentActivity(),
                health: await this.getSystemHealth()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_export_${new Date().getTime()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export dashboard:', error);
        }
    }

    /**
     * تنسيق القيم
     */
    formatValue(value) {
        if (typeof value === 'number') {
            return value.toLocaleString('ar-EG');
        }
        return value || '0';
    }

    /**
     * تنسيق التسميات
     */
    formatLabel(key) {
        const labels = {
            todaySales: 'المبيعات اليوم',
            monthSales: 'مبيعات الشهر',
            todayInvoices: 'فواتير اليوم',
            monthInvoices: 'فواتير الشهر',
            totalProducts: 'إجمالي المنتجات',
            lowStock: 'مخزون منخفض',
            outOfStock: 'نفد المخزون',
            totalValue: 'قيمة المخزون'
        };
        return labels[key] || key;
    }

    /**
     * الحصول على فئة اللون
     */
    getColorClass(color) {
        const colorClasses = {
            blue: 'bg-blue-500 border-blue-200',
            emerald: 'bg-emerald-500 border-emerald-200',
            purple: 'bg-purple-500 border-purple-200',
            orange: 'bg-orange-500 border-orange-200',
            red: 'bg-red-500 border-red-200',
            green: 'bg-green-500 border-green-200'
        };
        return colorClasses[color] || colorClasses.blue;
    }

    /**
     * الحصول على بيانات مخطط المبيعات
     */
    async getSalesChartData() {
        // بيانات وهمية للمخططات
        return {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            data: [12000, 19000, 15000, 25000, 22000, 30000]
        };
    }

    /**
     * الحصول على بيانات مخطط المخزون
     */
    async getInventoryChartData() {
        // بيانات وهمية للمخططات
        return {
            labels: ['إلكترونيات', 'ملابس', 'أطعمة', 'أدوية', 'أخرى'],
            data: [45, 30, 15, 8, 2]
        };
    }
}

// إنشاء نسخة واحدة من لوحة التحكم
window.modernDashboard = new ModernDashboard();