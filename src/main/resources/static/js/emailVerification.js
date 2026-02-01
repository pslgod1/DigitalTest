// API базовый URL
const API_BASE_URL = window.location.origin + '/api/auth';

// Общая функция для AJAX запросов
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
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

// Основной модуль подтверждения email
class EmailVerification {
    constructor() {
        // Получаем параметры из URL
        this.urlParams = new URLSearchParams(window.location.search);
        this.operationType = this.urlParams.get('type') || 'register';
        this.email = this.urlParams.get('email') || '';
        this.registrationId = this.urlParams.get('registrationId') || '';
        this.resetId = this.urlParams.get('resetId') || '';

        console.log('EmailVerification параметры:', {
            type: this.operationType,
            email: this.email,
            registrationId: this.registrationId,
            resetId: this.resetId
        });

        // DOM элементы
        this.elements = {
            pageTitle: document.getElementById('pageTitle'),
            pageSubtitle: document.getElementById('pageSubtitle'),
            userEmail: document.getElementById('userEmail'),
            codeInputs: document.querySelectorAll('.code-input'),
            errorMessage: document.getElementById('errorMessage'),
            successMessage: document.getElementById('successMessage'),
            timerElement: document.getElementById('timer'),
            timeLeftElement: document.getElementById('timeLeft'),
            resendBtn: document.getElementById('resendBtn'),
            newPasswordForm: document.getElementById('newPasswordForm'),
            continueBtn: document.getElementById('continueBtn')
        };

        // Состояние
        this.timeLeft = 15 * 60; // 15 минут
        this.timerInterval = null;
        this.isVerificationComplete = false; // Флаг завершения верификации
    }

    // Инициализация
    async init() {
        if (!this.email) {
            this.redirectToPrevious();
            return;
        }

        this.setupPageTitle();
        this.elements.userEmail.textContent = this.email;

        // НЕ вызываем requestVerificationCode() - код уже был отправлен!
        // await this.requestVerificationCode(); // ЗАКОММЕНТИРОВАНО!

        this.setupCodeInputs();
        this.startTimer();
        this.setupResendButton();

        if (this.operationType === 'password') {
            this.setupNewPasswordForm();
        } else {
            // Для регистрации кнопка продолжения не нужна
            if (this.elements.continueBtn) {
                this.elements.continueBtn.style.display = 'none';
            }
        }
    }

    // Запрос кода с сервера - НЕ ВЫЗЫВАЕТСЯ!
    // Код уже был отправлен на предыдущем шаге:
    // - Для регистрации: в /register/send-code
    // - Для восстановления пароля: в /password/forgot
    async requestVerificationCode() {
        // ЭТОТ МЕТОД НЕ ДОЛЖЕН ВЫЗЫВАТЬСЯ!
        // Код уже был отправлен на почту пользователя

        console.log('Информация:');
        console.log('- Тип операции:', this.operationType);
        console.log('- Email:', this.email);
        console.log('- registrationId:', this.registrationId);
        console.log('- resetId:', this.resetId);
        console.log('');
        console.log('Код подтверждения уже был отправлен на указанный email.');
        console.log('Пожалуйста, проверьте вашу почту и введите полученный 6-значный код.');

        // Для режима разработки можно вывести демо-код в консоль
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Dev mode: Демо-код для тестирования: 123456');
        }

        // Возвращаем промис, который ничего не делает
        return Promise.resolve();
    }

    // Настройка заголовков
    setupPageTitle() {
        if (this.operationType === 'register') {
            this.elements.pageTitle.textContent = 'Подтверждение регистрации';
            this.elements.pageSubtitle.textContent = 'Введите 6-значный код для завершения регистрации';
        } else {
            this.elements.pageTitle.textContent = 'Восстановление пароля';
            this.elements.pageSubtitle.textContent = 'Введите 6-значный код для смены пароля';
        }
    }

    // Настройка ввода кода
    setupCodeInputs() {
        this.elements.codeInputs.forEach((input, index) => {
            // Обработка ввода
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                // Только цифры
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Автопереход к следующему полю
                if (value && index < this.elements.codeInputs.length - 1) {
                    this.elements.codeInputs[index + 1].focus();
                }

                // Проверка когда все поля заполнены
                this.checkCode();
            });

            // Обработка Backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    this.elements.codeInputs[index - 1].focus();
                }
            });

            // Обработка вставки
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');

                if (/^\d{6}$/.test(pastedText)) {
                    for (let i = 0; i < 6; i++) {
                        this.elements.codeInputs[i].value = pastedText[i];
                        this.elements.codeInputs[i].classList.add('filled');
                    }
                    this.checkCode();
                }
            });
        });
    }

    // Проверка введенного кода
    async checkCode() {
        // Если верификация уже завершена, не проверяем снова
        if (this.isVerificationComplete) return;

        const enteredCode = Array.from(this.elements.codeInputs)
            .map(input => input.value)
            .join('');

        if (enteredCode.length !== 6) return;

        console.log(`Проверка кода: ${enteredCode} (${this.operationType})`);

        try {
            let response;

            if (this.operationType === 'register') {
                // Для регистрации - VerifyRegisterRequest DTO
                response = await apiRequest('/register/verify', 'POST', {
                    registrationId: this.registrationId,
                    code: enteredCode
                });
            } else {
                // Для восстановления пароля - параметры в URL
                response = await apiRequest(`/password/verify?resetId=${this.resetId}&code=${enteredCode}`, 'POST');
            }

            console.log('Ответ сервера:', response);

            // Проверяем success флаг
            if (response.success) {
                this.isVerificationComplete = true;
                this.onCodeVerified(response);
            } else {
                throw new Error(response.message || 'Неверный код');
            }

        } catch (error) {
            console.error('Ошибка проверки:', error);
            this.onCodeError();
        }
    }

    // Успешная проверка кода
    onCodeVerified(response) {
        // Визуальные изменения
        this.elements.codeInputs.forEach(input => {
            input.classList.add('filled');
            input.classList.remove('error');
            input.disabled = true;
        });

        this.elements.errorMessage.style.display = 'none';
        this.elements.successMessage.style.display = 'block';

        // Остановка таймера
        clearInterval(this.timerInterval);
        this.elements.timerElement.style.display = 'none';

        // Дальнейшие действия в зависимости от типа операции
        if (this.operationType === 'password') {
            this.elements.successMessage.textContent = 'Код подтверждён! Создайте новый пароль.';
            this.elements.newPasswordForm.classList.add('active');
        } else {
            // Для регистрации - показываем сообщение и автоматически перенаправляем
            const message = response.message || 'Email подтверждён! Регистрация завершена.';
            this.elements.successMessage.textContent = message + ' Перенаправление...';

            // Скрываем кнопку продолжения если есть
            if (this.elements.continueBtn) {
                this.elements.continueBtn.style.display = 'none';
            }

            // Автоматический редирект через 3 секунды
            const redirectUrl = response.redirectUrl || '/';
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000);
        }
    }

    // Ошибка проверки кода
    onCodeError() {
        this.elements.codeInputs.forEach(input => {
            input.classList.add('error');
            input.classList.remove('filled');
        });

        this.elements.errorMessage.style.display = 'block';
        this.elements.successMessage.style.display = 'none';

        // Очистка полей через секунду
        setTimeout(() => {
            this.elements.codeInputs.forEach(input => {
                input.value = '';
                input.classList.remove('error');
            });
            this.elements.codeInputs[0].focus();
        }, 1000);
    }

    // Таймер
    startTimer() {
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.onTimerExpired();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.elements.timeLeftElement.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    onTimerExpired() {
        clearInterval(this.timerInterval);
        this.elements.timerElement.classList.add('expired');
        this.elements.timeLeftElement.textContent = '00:00';
        this.elements.codeInputs.forEach(input => input.disabled = true);
        this.elements.resendBtn.disabled = false;
        this.elements.resendBtn.textContent = 'Отправить код повторно';
    }

    // Кнопка повторной отправки
    setupResendButton() {
        let resendCooldown = 60;

        // Таймер для кнопки
        const cooldownInterval = setInterval(() => {
            if (resendCooldown > 0) {
                this.elements.resendBtn.disabled = true;
                this.elements.resendBtn.textContent =
                    `Отправить код повторно (через ${resendCooldown} сек)`;
                resendCooldown--;
            } else {
                this.elements.resendBtn.disabled = false;
                this.elements.resendBtn.textContent = 'Отправить код повторно';
            }
        }, 1000);

        // Обработчик клика
        this.elements.resendBtn.addEventListener('click', async () => {
            if (this.elements.resendBtn.disabled) return;

            try {
                let response;

                if (this.operationType === 'register') {
                    // Для регистрации отправляем запрос с registrationId (ПАРАМЕТРОМ, не телом!)
                    response = await apiRequest(`/register/resend-code?registrationId=${this.registrationId}`, 'POST');
                } else {
                    // Для восстановления пароля
                    response = await apiRequest(`/password/forgot?email=${encodeURIComponent(this.email)}`, 'POST');

                    // Если успешно, обновляем resetId
                    if (response.success && response.resetId) {
                        this.resetId = response.resetId;
                        // Обновляем URL без перезагрузки
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('resetId', response.resetId);
                        window.history.replaceState({}, '', newUrl);
                    }
                }

                // Сброс состояния
                this.resetVerificationState();
                resendCooldown = 60;
                this.elements.resendBtn.disabled = true;

                alert(`Новый код отправлен на ${this.email}`);

            } catch (error) {
                console.error('Ошибка при повторной отправке:', error);
                alert('Ошибка при отправке кода: ' + error.message);
            }
        });
    }

    // Сброс состояния верификации
    resetVerificationState() {
        this.isVerificationComplete = false;

        this.elements.codeInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
            input.disabled = false;
        });

        this.elements.errorMessage.style.display = 'none';
        this.elements.successMessage.style.display = 'none';

        // Скрываем форму пароля если была открыта
        if (this.elements.newPasswordForm) {
            this.elements.newPasswordForm.classList.remove('active');
        }

        clearInterval(this.timerInterval);
        this.timeLeft = 15 * 60;
        this.elements.timerElement.classList.remove('expired');
        this.elements.timerElement.style.display = 'block';
        this.startTimer();

        this.elements.codeInputs[0].focus();
    }

    // Форма нового пароля
    setupNewPasswordForm() {
        if (!this.elements.newPasswordForm) return;

        this.elements.newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;

            // Валидация
            if (newPassword.length < 8) {
                alert('Пароль должен быть не менее 8 символов');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('Пароли не совпадают');
                return;
            }

            try {
                // Отправка нового пароля на сервер по DTO ResetPasswordRequest
                const response = await apiRequest('/password/reset', 'POST', {
                    resetId: this.resetId,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                });

                console.log('Ответ смены пароля:', response);

                // Проверяем ответ
                if (response.success) {
                    alert('Пароль успешно изменён! Теперь вы можете войти с новым паролем.');
                    // Используем redirectUrl из ответа или по умолчанию
                    window.location.href = response.redirectUrl || '/login';
                } else {
                    throw new Error(response.message || 'Ошибка смены пароля');
                }

            } catch (error) {
                console.error('Ошибка смены пароля:', error);
                alert(error.message || 'Ошибка при смене пароля');
            }
        });
    }

    // Вспомогательные методы
    getEnteredCode() {
        return Array.from(this.elements.codeInputs)
            .map(input => input.value)
            .join('');
    }

    redirectToPrevious() {
        window.location.href = this.operationType === 'register'
            ? '/register'
            : '/forgotPassword';
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const verification = new EmailVerification();
    verification.init();
});