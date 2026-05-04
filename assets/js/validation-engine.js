/**
 * Validation Engine - محرك التحقق من صحة البيانات
 * Provides comprehensive form validation with Arabic error messages
 */

class ValidationEngine {
    constructor() {
        this.rules = {
            required: {
                validate: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
                message: 'هذا الحقل مطلوب'
            },
            email: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(value);
                },
                message: 'يرجى إدخال بريد إلكتروني صحيح'
            },
            phone: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const phoneRegex = /^01[0-2,5]\d{8}$/;
                    return phoneRegex.test(value.replace(/\s/g, ''));
                },
                message: 'يرجى إدخال رقم هاتف مصري صحيح'
            },
            number: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    return !isNaN(parseFloat(value)) && isFinite(value);
                },
                message: 'يرجى إدخال رقم صحيح'
            },
            positive: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const num = parseFloat(value);
                    return !isNaN(num) && num > 0;
                },
                message: 'يجب أن يكون الرقم موجباً'
            },
            minLength: {
                validate: (value, min) => {
                    if (!value) return true; // Optional field
                    return value.toString().length >= parseInt(min);
                },
                message: (min) => `يجب أن يكون الحقل على الأقل ${min} أحرف`
            },
            maxLength: {
                validate: (value, max) => {
                    if (!value) return true; // Optional field
                    return value.toString().length <= parseInt(max);
                },
                message: (max) => `يجب أن لا يزيد الحقل عن ${max} حرف`
            },
            min: {
                validate: (value, min) => {
                    if (!value) return true; // Optional field
                    const num = parseFloat(value);
                    return !isNaN(num) && num >= parseFloat(min);
                },
                message: (min) => `يجب أن تكون القيمة على الأقل ${min}`
            },
            max: {
                validate: (value, max) => {
                    if (!value) return true; // Optional field
                    const num = parseFloat(value);
                    return !isNaN(num) && num <= parseFloat(max);
                },
                message: (max) => `يجب أن لا تزيد القيمة عن ${max}`
            },
            pattern: {
                validate: (value, pattern) => {
                    if (!value) return true; // Optional field
                    const regex = new RegExp(pattern);
                    return regex.test(value);
                },
                message: 'البيانات المدخلة غير صحيحة'
            },
            arabicName: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const arabicRegex = /^[\u0600-\u06FF\s]+$/;
                    return arabicRegex.test(value.trim());
                },
                message: 'يرجى إدخال اسم باللغة العربية فقط'
            },
            englishName: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const englishRegex = /^[a-zA-Z\s]+$/;
                    return englishRegex.test(value.trim());
                },
                message: 'يرجى إدخال اسم باللغة الإنجليزية فقط'
            },
            price: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const priceRegex = /^\d+(\.\d{1,2})?$/;
                    return priceRegex.test(value);
                },
                message: 'يرجى إدخال سعر صحيح (مثل: 100 أو 100.50)'
            },
            barcode: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    const barcodeRegex = /^\d{8,13}$/;
                    return barcodeRegex.test(value);
                },
                message: 'يجب أن يكون الباركود من 8 إلى 13 رقم'
            },
            password: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    return value.length >= 6;
                },
                message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'
            },
            url: {
                validate: (value) => {
                    if (!value) return true; // Optional field
                    try {
                        new URL(value);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'يرجى إدخال رابط صحيح'
            }
        };

        this.init();
    }

    init() {
        // Add validation styles to forms automatically
        this.addGlobalStyles();
        
        // Auto-attach to forms with data-validate attribute
        document.addEventListener('DOMContentLoaded', () => {
            this.attachToForms();
        });
    }

    addGlobalStyles() {
        if (document.getElementById('validation-styles')) return;

        const style = document.createElement('style');
        style.id = 'validation-styles';
        style.textContent = `
            .form-input.error {
                border-color: var(--error) !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
                background-color: rgba(239, 68, 68, 0.05);
            }
            
            .form-input.success {
                border-color: var(--success) !important;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
                background-color: rgba(16, 185, 129, 0.05);
            }
            
            .form-input.warning {
                border-color: var(--warning) !important;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1) !important;
                background-color: rgba(245, 158, 11, 0.05);
            }
            
            .error-message {
                color: var(--error);
                font-size: var(--font-size-xs);
                margin-top: var(--spacing-1);
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: var(--spacing-1);
                animation: slideDown 0.3s ease-out;
            }
            
            .success-message {
                color: var(--success);
                font-size: var(--font-size-xs);
                margin-top: var(--spacing-1);
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: var(--spacing-1);
                animation: slideDown 0.3s ease-out;
            }
            
            .warning-message {
                color: var(--warning);
                font-size: var(--font-size-xs);
                margin-top: var(--spacing-1);
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: var(--spacing-1);
                animation: slideDown 0.3s ease-out;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .validation-icon {
                width: 16px;
                height: 16px;
                display: inline-block;
            }
            
            .form-group.has-error .form-label {
                color: var(--error);
            }
            
            .form-group.has-success .form-label {
                color: var(--success);
            }
            
            .form-group.has-warning .form-label {
                color: var(--warning);
            }
        `;
        document.head.appendChild(style);
    }

    attachToForms() {
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            this.attachForm(form);
        });
    }

    attachForm(form) {
        // Add real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.dataset.rules) {
                // Validate on blur
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                // Validate on input (with debounce)
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.validateField(input);
                    }, 500);
                });

                // Validate on change (for selects)
                input.addEventListener('change', () => {
                    this.validateField(input);
                });
            }
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            const isValid = this.validateForm(form);
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
                
                // Focus first error field
                const firstError = form.querySelector('.form-input.error');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // Show toast notification
                this.showNotification('يرجى تصحيح الأخطاء في النموذج', 'error');
            }
        });
    }

    validateField(input) {
        const rules = this.parseRules(input.dataset.rules);
        const value = input.value;
        let isValid = true;
        let errorMessage = '';

        // Clear previous validation
        this.clearFieldValidation(input);

        // Check each rule
        for (const rule of rules) {
            if (!this.rules[rule.name]) {
                console.warn(`Validation rule '${rule.name}' not found`);
                continue;
            }

            const validationRule = this.rules[rule.name];
            const ruleValid = validationRule.validate(value, rule.params);
            
            if (!ruleValid) {
                isValid = false;
                errorMessage = typeof validationRule.message === 'function' 
                    ? validationRule.message(rule.params)
                    : validationRule.message;
                break;
            }
        }

        // Show validation result
        this.showFieldValidation(input, isValid, errorMessage);
        
        return isValid;
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[data-rules], select[data-rules], textarea[data-rules]');
        let isFormValid = true;

        inputs.forEach(input => {
            const isFieldValid = this.validateField(input);
            if (!isFieldValid) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    parseRules(rulesString) {
        const rules = [];
        const ruleParts = rulesString.split('|');

        ruleParts.forEach(rulePart => {
            const [name, params] = rulePart.split(':');
            if (name) {
                rules.push({
                    name: name.trim(),
                    params: params ? params.split(',') : null
                });
            }
        });

        return rules;
    }

    showFieldValidation(input, isValid, message) {
        const formGroup = input.closest('.form-group') || input.parentElement;
        const existingMessage = formGroup.querySelector('.error-message, .success-message, .warning-message');
        
        if (existingMessage) {
            existingMessage.remove();
        }

        // Remove previous states
        input.classList.remove('error', 'success', 'warning');
        formGroup.classList.remove('has-error', 'has-success', 'has-warning');

        if (!isValid && message) {
            // Show error
            input.classList.add('error');
            formGroup.classList.add('has-error');
            
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.innerHTML = `
                <svg class="validation-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                ${message}
            `;
            formGroup.appendChild(errorElement);
        } else if (isValid && input.value) {
            // Show success
            input.classList.add('success');
            formGroup.classList.add('has-success');
        }
    }

    clearFieldValidation(input) {
        const formGroup = input.closest('.form-group') || input.parentElement;
        const existingMessage = formGroup.querySelector('.error-message, .success-message, .warning-message');
        
        if (existingMessage) {
            existingMessage.remove();
        }

        input.classList.remove('error', 'success', 'warning');
        formGroup.classList.remove('has-error', 'has-success', 'has-warning');
    }

    showNotification(message, type = 'info') {
        // Use SweetAlert2 if available, otherwise create custom notification
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
                title: message,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    toast: 'rounded-xl shadow-lg'
                }
            });
        } else {
            // Fallback custom notification
            this.createCustomNotification(message, type);
        }
    }

    createCustomNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slideInRight`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="notification-icon">
                    ${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <div class="notification-message font-medium">
                    ${message}
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('animate-slideOutRight');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Public methods for manual validation
    validate(value, rules) {
        const parsedRules = rules.split('|').map(rule => {
            const [name, params] = rule.split(':');
            return { name: name.trim(), params: params ? params.split(',') : null };
        });

        for (const rule of parsedRules) {
            if (!this.rules[rule.name]) continue;

            const validationRule = this.rules[rule.name];
            const isValid = validationRule.validate(value, rule.params);
            
            if (!isValid) {
                return {
                    isValid: false,
                    message: typeof validationRule.message === 'function' 
                        ? validationRule.message(rule.params)
                        : validationRule.message
                };
            }
        }

        return { isValid: true, message: '' };
    }

    // Add custom rule
    addRule(name, rule) {
        this.rules[name] = rule;
    }

    // Remove rule
    removeRule(name) {
        delete this.rules[name];
    }
}

// Initialize global validation engine
window.ValidationEngine = new ValidationEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationEngine;
}