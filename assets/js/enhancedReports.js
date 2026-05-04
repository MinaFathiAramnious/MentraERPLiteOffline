/**
 * MENTRA ERP - Enhanced Reports System
 * نظام التقارير المحسّن
 * Version: 1.0.0
 */

class EnhancedReports {
    constructor() {
        this.db = null;
        this.charts = {};
        this.reports = {};
        this.filters = {};
        this.init();
    }

    async init() {
        try {
            this.db = db;
            console.log('📊 EnhancedReports initialized');
        } catch (error) {
            console.error('❌ Failed to initialize EnhancedReports:', error);
        }
    }

    /**
     * إنشاء تقرير المبيعات المتقدم
     */
    async generateSalesReport(period = 'monthly') {
        try {
            const invoices = await this.db.invoices.toArray();
            const invoiceItems = await this.db.invoice_items.toArray();
            
            // تصفية حسب الفترة
            const filteredInvoices = this.filterByPeriod(invoices, period);
            
            // حساب الإحصائيات
            const stats = {
                totalInvoices: filteredInvoices.length,
                totalRevenue: 0,
                totalProfit: 0,
                averageInvoice: 0,
                topProducts: [],
                monthlyData: [],
                customersAnalysis: {}
            };

            // تحليل الفواتير
            filteredInvoices.forEach(invoice => {
                stats.totalRevenue += invoice.final_total || 0;
                stats.totalProfit += invoice.profit || 0;
                
                // تحليل العملاء
                const customerKey = invoice.customer_name || 'عميل غير محدد';
                if (!stats.customersAnalysis[customerKey]) {
                    stats.customersAnalysis[customerKey] = {
                        invoices: 0,
                        revenue: 0,
                        profit: 0
                    };
                }
                stats.customersAnalysis[customerKey].invoices++;
                stats.customersAnalysis[customerKey].revenue += invoice.final_total || 0;
                stats.customersAnalysis[customerKey].profit += invoice.profit || 0;
            });

            stats.averageInvoice = stats.totalInvoices > 0 ? stats.totalRevenue / stats.totalInvoices : 0;

            // تحليل المنتجات
            const productSales = {};
            invoiceItems.forEach(item => {
                if (!productSales[item.product_name]) {
                    productSales[item.product_name] = {
                        quantity: 0,
                        revenue: 0,
                        profit: 0
                    };
                }
                productSales[item.product_name].quantity += item.quantity || 0;
                productSales[item.product_name].revenue += item.total || 0;
                productSales[item.product_name].profit += item.profit || 0;
            });

            // ترتيب أفضل المنتجات
            stats.topProducts = Object.entries(productSales)
                .sort(([,a], [,b]) => b.revenue - a.revenue)
                .slice(0, 10)
                .map(([name, data]) => ({ name, ...data }));

            // بيانات شهرية
            stats.monthlyData = this.generateMonthlyData(filteredInvoices);

            return {
                success: true,
                period,
                generatedAt: new Date().toISOString(),
                ...stats
            };

        } catch (error) {
            console.error('Failed to generate sales report:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إنشاء تقرير المخزون المتقدم
     */
    async generateInventoryReport() {
        try {
            const products = await this.db.products.toArray();
            const movements = await this.db.stock_movements.toArray();
            
            const stats = {
                totalProducts: products.length,
                totalValue: 0,
                lowStock: [],
                outOfStock: [],
                topMoving: [],
                categories: {},
                movements: this.analyzeMovements(movements)
            };

            // تحليل المنتجات
            products.forEach(product => {
                const value = (product.stock_quantity || 0) * (product.unit_cost || 0);
                stats.totalValue += value;

                // المنتجات نفص المخزون
                if (product.stock_quantity <= 0) {
                    stats.outOfStock.push({
                        name: product.name,
                        barcode: product.barcode,
                        minStock: product.min_stock || 0
                    });
                } else if (product.stock_quantity <= (product.min_stock || 10)) {
                    stats.lowStock.push({
                        name: product.name,
                        barcode: product.barcode,
                        current: product.stock_quantity,
                        min: product.min_stock || 10
                    });
                }

                // تحليل الفئات
                const category = product.category || 'غير مصنف';
                if (!stats.categories[category]) {
                    stats.categories[category] = {
                        count: 0,
                        value: 0,
                        stock: 0
                    };
                }
                stats.categories[category].count++;
                stats.categories[category].value += value;
                stats.categories[category].stock += product.stock_quantity || 0;
            });

            // أكثر المنتجات حركة
            stats.topMoving = Object.entries(stats.movements.productMovements)
                .sort(([,a], [,b]) => b.movements - a.movements)
                .slice(0, 10)
                .map(([name, data]) => ({ name, ...data }));

            return {
                success: true,
                generatedAt: new Date().toISOString(),
                ...stats
            };

        } catch (error) {
            console.error('Failed to generate inventory report:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إنشاء تقرير العملاء المتقدم
     */
    async generateCustomersReport() {
        try {
            const customers = await this.db.accounts.where('type').equals('customer').toArray();
            const invoices = await this.db.invoices.toArray();
            
            const stats = {
                totalCustomers: customers.length,
                activeCustomers: 0,
                totalRevenue: 0,
                averagePerCustomer: 0,
                newCustomers: [],
                topCustomers: [],
                customerSegments: {},
                paymentMethods: {}
            };

            // تحليل العملاء
            const customerRevenue = {};
            
            invoices.forEach(invoice => {
                const customerName = invoice.customer_name || 'عميل نقدي';
                if (!customerRevenue[customerName]) {
                    customerRevenue[customerName] = {
                        invoices: 0,
                        revenue: 0,
                        lastInvoice: null
                    };
                }
                customerRevenue[customerName].invoices++;
                customerRevenue[customerName].revenue += invoice.final_total || 0;
                customerRevenue[customerName].lastInvoice = new Date(invoice.date || invoice.timestamp);
                
                stats.totalRevenue += invoice.final_total || 0;
                
                // تحليل طرق الدفع
                const method = invoice.payment_method || 'كاش';
                if (!stats.paymentMethods[method]) {
                    stats.paymentMethods[method] = 0;
                }
                stats.paymentMethods[method] += invoice.final_total || 0;
            });

            // العملاء النشطين (لديهم فواتير)
            stats.activeCustomers = Object.keys(customerRevenue).length;
            stats.averagePerCustomer = stats.activeCustomers > 0 ? stats.totalRevenue / stats.activeCustomers : 0;

            // أفضل العملاء
            stats.topCustomers = Object.entries(customerRevenue)
                .sort(([,a], [,b]) => b.revenue - a.revenue)
                .slice(0, 10)
                .map(([name, data]) => ({ name, ...data }));

            // تقسيم العملاء حسب الإنفاق
            Object.values(customerRevenue).forEach(customer => {
                let segment = 'bronze';
                if (customer.revenue >= 10000) segment = 'gold';
                else if (customer.revenue >= 5000) segment = 'silver';
                
                if (!stats.customerSegments[segment]) {
                    stats.customerSegments[segment] = 0;
                }
                stats.customerSegments[segment]++;
            });

            // العملاء الجدد (آخر 30 يوم)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            customers.forEach(customer => {
                const createdDate = new Date(customer.created_at || customer.timestamp || 0);
                if (createdDate > thirtyDaysAgo) {
                    stats.newCustomers.push({
                        name: customer.name,
                        createdDate: createdDate.toLocaleDateString('ar-EG'),
                        phone: customer.phone || 'لا يوجد'
                    });
                }
            });

            return {
                success: true,
                generatedAt: new Date().toISOString(),
                ...stats
            };

        } catch (error) {
            console.error('Failed to generate customers report:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تصفية البيانات حسب الفترة
     */
    filterByPeriod(data, period) {
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'daily':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'weekly':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'yearly':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        return data.filter(item => {
            const itemDate = new Date(item.date || item.timestamp || 0);
            return itemDate >= startDate && itemDate <= now;
        });
    }

    /**
     * إنشاء بيانات شهرية
     */
    generateMonthlyData(invoices) {
        const monthlyData = {};
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        // تهيئة الأشهر
        months.forEach((month, index) => {
            monthlyData[month] = { revenue: 0, invoices: 0, profit: 0 };
        });

        // توزيع البيانات على الأشهر
        invoices.forEach(invoice => {
            const date = new Date(invoice.date || invoice.timestamp);
            const monthName = months[date.getMonth()];
            
            if (monthlyData[monthName]) {
                monthlyData[monthName].revenue += invoice.final_total || 0;
                monthlyData[monthName].invoices++;
                monthlyData[monthName].profit += invoice.profit || 0;
            }
        });

        return monthlyData;
    }

    /**
     * تحليل حركة المخزون
     */
    analyzeMovements(movements) {
        const analysis = {
            totalMovements: movements.length,
            productMovements: {},
            typeMovements: { 'شراء': 0, 'بيع': 0, 'مرتجع': 0, 'تالف': 0 },
            dailyMovements: {}
        };

        movements.forEach(movement => {
            // حركة المنتجات
            if (movement.product_name) {
                if (!analysis.productMovements[movement.product_name]) {
                    analysis.productMovements[movement.product_name] = {
                        movements: 0,
                        quantity: 0,
                        type: movement.type
                    };
                }
                analysis.productMovements[movement.product_name].movements++;
                analysis.productMovements[movement.product_name].quantity += movement.quantity || 0;
            }

            // حركة الأنواع
            if (analysis.typeMovements[movement.type] !== undefined) {
                analysis.typeMovements[movement.type]++;
            }

            // حركة يومية
            const date = new Date(movement.timestamp).toLocaleDateString('ar-EG');
            if (!analysis.dailyMovements[date]) {
                analysis.dailyMovements[date] = 0;
            }
            analysis.dailyMovements[date]++;
        });

        return analysis;
    }

    /**
     * تصدير التقرير إلى Excel
     */
    async exportToExcel(reportData, fileName) {
        try {
            const wb = XLSX.utils.book_new();
            
            // إنشاء ورقة رئيسية
            const mainSheet = XLSX.utils.json_to_sheet([{
                'التقرير': fileName,
                'تاريخ الإنشاء': new Date().toLocaleDateString('ar-EG'),
                'الإجمالي': reportData.totalRevenue || reportData.totalValue || 0
            }]);
            
            XLSX.utils.book_append_sheet(wb, mainSheet, 'ملخص');

            // إضافة الأوراق التفصيلية حسب نوع التقرير
            if (reportData.topProducts) {
                const productsSheet = XLSX.utils.json_to_sheet(reportData.topProducts);
                XLSX.utils.book_append_sheet(wb, productsSheet, 'أفضل المنتجات');
            }

            if (reportData.topCustomers) {
                const customersSheet = XLSX.utils.json_to_sheet(reportData.topCustomers);
                XLSX.utils.book_append_sheet(wb, customersSheet, 'أفضل العملاء');
            }

            if (reportData.monthlyData) {
                const monthlyArray = Object.entries(reportData.monthlyData).map(([month, data]) => ({
                    'الشهر': month,
                    'الإيرادات': data.revenue,
                    'الفواتير': data.invoices,
                    'الأرباح': data.profit
                }));
                const monthlySheet = XLSX.utils.json_to_sheet(monthlyArray);
                XLSX.utils.book_append_sheet(wb, monthlySheet, 'بيانات شهرية');
            }

            // حفظ الملف
            XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to export to Excel:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * طباعة التقرير
     */
    printReport(reportData, title) {
        try {
            const printWindow = window.open('', '_blank');
            
            let html = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Cairo', sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                        th { background-color: #f5f5f5; }
                        @media print { body { padding: 10px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${title}</h1>
                        <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
            `;

            // إحصائيات رئيسية
            if (reportData.totalRevenue || reportData.totalValue) {
                html += `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>الإجمالي</h3>
                            <p>${(reportData.totalRevenue || reportData.totalValue).toFixed(2)} ريال</p>
                        </div>
                `;
                
                if (reportData.totalInvoices) {
                    html += `
                        <div class="stat-card">
                            <h3>عدد الفواتير</h3>
                            <p>${reportData.totalInvoices}</p>
                        </div>
                    `;
                }
                
                if (reportData.totalProducts) {
                    html += `
                        <div class="stat-card">
                            <h3>عدد المنتجات</h3>
                            <p>${reportData.totalProducts}</p>
                        </div>
                    `;
                }
                
                html += '</div>';
            }

            // جداول البيانات
            if (reportData.topProducts && reportData.topProducts.length > 0) {
                html += `
                    <h2>أفضل المنتجات</h2>
                    <table>
                        <tr>
                            <th>اسم المنتج</th>
                            <th>الكمية</th>
                            <th>الإيرادات</th>
                            <th>الأرباح</th>
                        </tr>
                `;
                
                reportData.topProducts.slice(0, 10).forEach(product => {
                    html += `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.quantity}</td>
                            <td>${product.revenue.toFixed(2)}</td>
                            <td>${product.profit.toFixed(2)}</td>
                        </tr>
                    `;
                });
                
                html += '</table>';
            }

            html += `
                </body>
                </html>
            `;

            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
            
            return { success: true };
        } catch (error) {
            console.error('Failed to print report:', error);
            return { success: false, error: error.message };
        }
    }
}

// إنشاء نسخة واحدة من نظام التقارير
window.enhancedReports = new EnhancedReports();