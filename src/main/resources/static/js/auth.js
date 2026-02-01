// API базовый URL
const API_BASE_URL = window.location.origin + '/api/auth';

// Общая функция для AJAX запросов
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Для cookies/session
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Функция показа/скрытия пароля
function setupPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.closest('.input-wrapper').querySelector('input');
            const icon = this.querySelector('svg');

            if (input.type === 'password') {
                input.type = 'text';
                // Меняем иконку на "скрыть"
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                input.type = 'password';
                // Возвращаем иконку "показать"
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });
}

// Проверка сложности пароля
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBars = document.querySelectorAll('.strength-bar');

    if (!passwordInput || !strengthBars.length) return;

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;

        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        // Обновляем индикаторы
        strengthBars.forEach((bar, index) => {
            if (index < strength) {
                // Цвет в зависимости от сложности
                if (strength === 1) bar.style.backgroundColor = '#ea4335'; // Слабый
                else if (strength === 2) bar.style.backgroundColor = '#fbbc04'; // Средний
                else if (strength === 3) bar.style.backgroundColor = '#34a853'; // Хороший
                else if (strength >= 4) bar.style.backgroundColor = '#0d9d58'; // Отличный
            } else {
                bar.style.backgroundColor = '#dadce0';
            }
        });
    });
}

// Валидация формы регистрации
function setupRegisterValidation() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const errorDiv = document.getElementById('formError');
    const submitBtn = form.querySelector('.btn-auth');

    // Валидация подтверждения пароля в реальном времени
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            if (passwordInput.value !== this.value) {
                this.classList.add('invalid');
                this.classList.remove('valid');
            } else {
                this.classList.add('valid');
                this.classList.remove('invalid');
            }
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Собираем данные формы
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmInput ? confirmInput.value : ''
        };

        // Валидация на клиенте
        const errors = validateRegistration(formData);
        if (errors.length > 0) {
            showError(errorDiv, errors.join('. '));
            return;
        }

        // Показываем загрузку
        setLoading(submitBtn, true);
        errorDiv.style.display = 'none';

        try {
            // Отправляем запрос на сервер по DTO RegisterCodeRequest
            const response = await apiRequest('/register/send-code', 'POST', {
                email: formData.email,
                password: formData.password,
                name: formData.name
            });

            // Проверяем ответ (RegistrationResponse)
            if (response.success && response.registrationId) {
                // Редирект на страницу подтверждения с registrationId
                window.location.href = `/codeEmail?type=register&email=${encodeURIComponent(formData.email)}&registrationId=${response.registrationId}`;
            } else {
                throw new Error(response.message || 'Ошибка регистрации');
            }

        } catch (error) {
            showError(errorDiv, error.message || 'Ошибка регистрации. Попробуйте еще раз.');
            setLoading(submitBtn, false);
        }
    });
}

// Валидация формы входа
function setupLoginValidation() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const errorDiv = document.getElementById('formError');
    const submitBtn = form.querySelector('.btn-auth');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Базовая валидация
        if (!email || !password) {
            showError(errorDiv, 'Заполните все обязательные поля');
            return;
        }

        // Показываем загрузку
        setLoading(submitBtn, true);
        errorDiv.style.display = 'none';

        try {
            const response = await apiRequest('/login', 'POST', {
                email: email,
                password: password
            });

            console.log('Ответ сервера:', response);

            if (response.success) {
                // Проверяем роль пользователя
                const userRole = response.role || 'USER';
                console.log('Роль пользователя:', userRole);

                // Редирект в зависимости от роли
                if (userRole === 'ADMIN' || userRole === 'admin') {
                    console.log('Редирект на админ-панель');
                    window.location.href = '/admin';
                } else {
                    console.log('Редирект на обычный dashboard');
                    window.location.href = response.redirectUrl || '/dashboard';
                }
            } else {
                throw new Error(response.message || 'Ошибка входа');
            }

        } catch (error) {
            console.error('Ошибка входа:', error);
            showError(errorDiv, error.message || 'Неверный email или пароль');
            setLoading(submitBtn, false);
        }
    });
}

// Валидация формы восстановления пароля
function setupForgotPasswordValidation() {
    const form = document.getElementById('forgotPasswordForm');
    if (!form) return;

    const submitBtn = form.querySelector('.btn-auth');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();

        if (!email) {
            alert('Введите email адрес');
            return;
        }

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Введите корректный email адрес');
            return;
        }

        setLoading(submitBtn, true);

        try {
            // Исправленный URL endpoint: /password/forgot вместо /auth/password/forgot
            const response = await apiRequest(`/password/forgot?email=${encodeURIComponent(email)}`, 'POST');

            // Проверяем ответ (PasswordResetResponse)
            if (response.success && response.resetId) {
                // Редирект на страницу подтверждения с resetId
                window.location.href = `/codeEmail?type=password&email=${encodeURIComponent(email)}&resetId=${response.resetId}`;
            } else {
                throw new Error(response.message || 'Ошибка запроса');
            }

        } catch (error) {
            alert(error.message || 'Ошибка при запросе восстановления пароля');
            setLoading(submitBtn, false);
        }
    });
}

// Вспомогательные функции
function validateRegistration(data) {
    const errors = [];

    if (!data.name || data.name.length < 2) {
        errors.push('Имя должно содержать минимум 2 символа');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        errors.push('Введите корректный email адрес');
    }

    if (!data.password || data.password.length < 8) {
        errors.push('Пароль должен содержать минимум 8 символов');
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
        errors.push('Пароли не совпадают');
    }

    const terms = document.getElementById('terms');
    if (terms && !terms.checked) {
        errors.push('Необходимо согласиться с условиями использования');
    }

    return errors;
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        button.innerHTML = '<span>Загрузка...</span>';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || '<span>Отправить</span>';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
    setupPasswordStrength();
    setupRegisterValidation();
    setupLoginValidation();

    // Инициализируем форму восстановления если она есть на странице
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        setupForgotPasswordValidation();
    }

    // Фокус на первое поле
    const firstInput = document.querySelector('.form-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }
});