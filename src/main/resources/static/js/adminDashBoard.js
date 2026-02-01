/**
 * JavaScript для админ-панели (adminDashBoard.js)
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ-панель загружена');

    // Базовый URL API
    const API_BASE_URL = window.location.origin + '/api';
    const USER_API_URL = `${API_BASE_URL}/users/me`;
    const ADMIN_API_URL = `${API_BASE_URL}/admin`;
    const TESTS_API_URL = `${API_BASE_URL}/tests`;

    // Глобальные переменные
    let currentAdmin = null;
    let adminsList = [];
    let testsList = [];

    // Инициализация
    initAdminDashboard();

    async function initAdminDashboard() {
        try {
            setupQuickActions();

            // Настройка кнопки меню
            setupMenuToggle();

            // Настройка кнопки выхода
            setupLogoutButton();

            // Загружаем данные администратора
            await loadAdminData();

            // Загружаем список администраторов
            await loadAdminsList();

            // Загружаем список тестов
            await loadTestsList();

            // Настройка формы назначения администратора
            setupAssignAdminForm();

            // Настройка кнопок тестов
            setupTestButtons();

            // Обновление даты
            updateCurrentDate();

        } catch (error) {
            console.error('Ошибка инициализации админ-панели:', error);
            showErrorMessage('Не удалось загрузить админ-панель. Проверьте права доступа.');
        }
    }

    // Настройка кнопки меню
    function setupMenuToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.admin-sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });
        }
    }

    //stepquick
    function setupQuickActions() {
        // Карточка "Назначить администратора"
        const addAdminCard = document.getElementById('addAdminCard');
        if (addAdminCard) {
            addAdminCard.addEventListener('click', function () {
                // Находим секцию назначения администратора
                const adminSection = document.querySelector('.admin-section');
                if (adminSection) {
                    // Плавная прокрутка к секции
                    adminSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Фокусируемся на поле ввода email
                    const emailInput = document.getElementById('userEmail');
                    if (emailInput) {
                        setTimeout(() => {
                            emailInput.focus();
                        }, 500); // Небольшая задержка для завершения скролла
                    }
                }
            });
        }
    }

    // Настройка кнопки выхода
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function() {
                if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
                    try {
                        // Отправляем запрос на выход
                        await fetch(`${API_BASE_URL}/auth/logout`, {
                            method: 'POST',
                            credentials: 'include'
                        });
                    } catch (error) {
                        console.error('Ошибка при выходе:', error);
                    }

                    // Редирект на главную
                    window.location.href = '/';
                }
            });
        }
    }

    // Загрузка данных администратора
    async function loadAdminData() {
        console.log('Загрузка данных администратора...');

        try {
            const response = await fetch(USER_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Не авторизован или нет прав администратора
                    window.location.href = '/dashboard';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            currentAdmin = await response.json();
            console.log('Данные администратора:', currentAdmin);
            updateAdminUI();

        } catch (error) {
            console.error('Ошибка загрузки данных администратора:', error);
            // Просто показываем заглушку
            currentAdmin = createDefaultAdmin();
            updateAdminUI();
        }
    }

    // Обновление UI администратора
    function updateAdminUI() {
        if (!currentAdmin) return;

        const adminName = currentAdmin.name || 'Администратор';
        const adminEmail = currentAdmin.email || 'admin@example.com';

        // Обновляем элементы
        document.getElementById('adminName').textContent = adminName;
        document.getElementById('adminEmail').textContent = adminEmail;

        // Обновляем аватар
        const avatarImg = document.getElementById('adminAvatar');
        if (avatarImg) {
            const nameForAvatar = adminName.replace(/\s+/g, '+');
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=8e44ad&color=fff&size=80`;
        }
    }

    // Создание default администратора
    function createDefaultAdmin() {
        return {
            id: 1,
            name: 'Администратор',
            email: 'admin@example.com',
            role: 'ADMIN'
        };
    }

    // Загрузка списка администраторов
    async function loadAdminsList() {
        console.log('Загрузка списка администраторов...');

        const adminsListElement = document.getElementById('adminsList');
        if (!adminsListElement) return;

        try {
            adminsListElement.innerHTML = `
                <div class="loading-admins">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Загрузка списка администраторов...</span>
                </div>
            `;

            const response = await fetch(ADMIN_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            adminsList = await response.json();
            console.log('Список администраторов загружен:', adminsList.length, 'человек');
            displayAdminsList();

        } catch (error) {
            console.error('Ошибка загрузки списка администраторов:', error);
            adminsListElement.innerHTML = `
                <div class="error-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Не удалось загрузить список администраторов</span>
                    <button class="btn btn-outline btn-xs" onclick="location.reload()">Повторить</button>
                </div>
            `;
        }
    }

    // Отображение списка администраторов
    function displayAdminsList() {
        const adminsListElement = document.getElementById('adminsList');
        if (!adminsListElement) return;

        if (!adminsList || adminsList.length === 0) {
            adminsListElement.innerHTML = `
                <div class="no-admins">
                    <i class="fas fa-user-shield"></i>
                    <span>Нет других администраторов</span>
                </div>
            `;
            return;
        }

        // Создаем элементы списка
        let adminsHTML = '';

        adminsList.forEach(admin => {
            const name = admin.name || 'Администратор';
            const email = admin.email || 'Нет email';
            const initials = getInitials(name);

            adminsHTML += `
                <div class="admin-item">
                    <div class="admin-avatar">${initials}</div>
                    <div class="admin-info">
                        <div class="admin-name">${name}</div>
                        <div class="admin-email">${email}</div>
                    </div>
                    <div class="admin-role">
                        <span class="role-badge role-admin">Администратор</span>
                    </div>
                </div>
            `;
        });

        adminsListElement.innerHTML = adminsHTML;
    }

    // Настройка формы назначения администратора
    function setupAssignAdminForm() {
        const form = document.getElementById('assignAdminForm');
        const assignBtn = document.getElementById('assignAdminBtn');
        const checkBtn = document.getElementById('checkUserBtn');
        const refreshBtn = document.getElementById('refreshAdminsBtn');

        if (!form) return;

        // Кнопка проверки пользователя
        if (checkBtn) {
            checkBtn.addEventListener('click', async function() {
                const userEmail = document.getElementById('userEmail').value.trim();

                if (!userEmail) {
                    showFormError('Введите email пользователя');
                    return;
                }

                if (!isValidEmail(userEmail)) {
                    showFormError('Введите корректный email адрес');
                    return;
                }

                // Показываем загрузку
                const originalText = checkBtn.innerHTML;
                checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
                checkBtn.disabled = true;

                try {
                    // Проверяем существование пользователя
                    const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(userEmail)}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        showFormSuccess(`Пользователь найден: ${userData.name || userEmail}`);
                    } else if (response.status === 404) {
                        showFormError(`Пользователь ${userEmail} не найден`);
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                } catch (error) {
                    console.error('Ошибка проверки пользователя:', error);
                    showFormError('Не удалось проверить пользователя');
                } finally {
                    // Восстанавливаем кнопку
                    checkBtn.innerHTML = originalText;
                    checkBtn.disabled = false;
                }
            });
        }

        // Кнопка обновления списка админов
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async function() {
                await loadAdminsList();
                showFormSuccess('Список администраторов обновлен');
            });
        }

        // Отправка формы
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const userEmail = document.getElementById('userEmail').value.trim();
            const adminRole = document.getElementById('adminRoleSelect').value;

            if (!userEmail) {
                showFormError('Введите email пользователя');
                return;
            }

            if (!adminRole) {
                showFormError('Выберите роль');
                return;
            }

            if (!isValidEmail(userEmail)) {
                showFormError('Введите корректный email адрес');
                return;
            }

            // Показываем загрузку
            const originalText = assignBtn.innerHTML;
            assignBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Назначение...';
            assignBtn.disabled = true;

            try {
                // Отправляем запрос на назначение роли
                const response = await fetch(`${ADMIN_API_URL}?email=${encodeURIComponent(userEmail)}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Пользователь не найден');
                    } else if (response.status === 403) {
                        throw new Error('Недостаточно прав');
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                }

                const updatedUser = await response.json();
                console.log('Роль назначена:', updatedUser);

                // Показываем успех
                showFormSuccess(`Пользователь ${userEmail} успешно назначен администратором`);

                // Обновляем список администраторов
                await loadAdminsList();

                // Очищаем форму
                form.reset();

            } catch (error) {
                console.error('Ошибка назначения администратора:', error);
                showFormError(error.message || 'Ошибка при назначении роли');
            } finally {
                // Восстанавливаем кнопку
                assignBtn.innerHTML = originalText;
                assignBtn.disabled = false;
            }
        });
    }

    // Загрузка списка тестов
    async function loadTestsList() {
        console.log('Загрузка списка тестов...');

        const testsListElement = document.getElementById('testsList');
        const noTestsMessage = document.getElementById('noTestsMessage');
        if (!testsListElement) return;

        try {
            testsListElement.innerHTML = `
                <div class="loading-tests">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Загрузка тестов...</span>
                </div>
            `;

            const response = await fetch(TESTS_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            testsList = await response.json();
            console.log('Список тестов загружен:', testsList.length, 'тестов');

            if (testsList.length === 0) {
                testsListElement.style.display = 'none';
                if (noTestsMessage) {
                    noTestsMessage.style.display = 'block';
                }
            } else {
                if (noTestsMessage) {
                    noTestsMessage.style.display = 'none';
                }
                testsListElement.style.display = 'block';
                displayTestsList();
            }

        } catch (error) {
            console.error('Ошибка загрузки списка тестов:', error);
            testsListElement.innerHTML = `
                <div class="error-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Не удалось загрузить список тестов</span>
                    <button class="btn btn-outline btn-xs" onclick="location.reload()">Повторить</button>
                </div>
            `;
        }
    }

    // Отображение списка тестов
    function displayTestsList() {
        const testsListElement = document.getElementById('testsList');
        if (!testsListElement) return;

        // Сортируем тесты по дате создания (новые сначала)
        const sortedTests = [...testsList].sort((a, b) => {
            const dateA = a.createAt ? new Date(a.createAt) : new Date(0);
            const dateB = b.createAt ? new Date(b.createAt) : new Date(0);
            return dateB - dateA;
        });

        // Берем первые 5 тестов
        const testsToShow = sortedTests.slice(0, 5);

        // Создаем элементы списка
        let testsHTML = '';

        testsToShow.forEach(test => {
            const testId = test.id || 0;
            const testTitle = test.title || `Тест #${testId}`;
            const questionCount = test.questions?.length || 0;
            const timeLimit = test.timeLimitMinutes || 30;
            const description = test.description || 'Описание отсутствует';

            testsHTML += `
                <div class="test-card" data-test-id="${testId}">
                    <div class="test-header">
                        <h3 class="test-title">${testTitle}</h3>
                    </div>
                    <div class="test-info">
                        <div class="test-meta">
                            <span class="meta-item">
                                <i class="fas fa-question-circle"></i>
                                ${questionCount} вопросов
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-clock"></i>
                                ${timeLimit} мин
                            </span>
                        </div>
                        <p class="test-description">${truncateText(description, 100)}</p>
                    </div>
                    <div class="test-footer">
                        <button class="btn btn-primary btn-sm view-results-btn" data-test-id="${testId}">
                            <i class="fas fa-chart-bar"></i>
                            Результаты
                        </button>
                    </div>
                </div>
            `;
        });

        testsListElement.innerHTML = testsHTML;

        // Добавляем обработчики для кнопок
        setupTestButtons();
    }

    // Настройка кнопок тестов
    function setupTestButtons() {
        // Кнопка обновления тестов
        const refreshTestsBtn = document.getElementById('refreshTestsBtn');
        if (refreshTestsBtn) {
            refreshTestsBtn.addEventListener('click', async function() {
                const originalText = refreshTestsBtn.innerHTML;
                refreshTestsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                refreshTestsBtn.disabled = true;

                await loadTestsList();

                refreshTestsBtn.innerHTML = originalText;
                refreshTestsBtn.disabled = false;

                showFormSuccess('Список тестов обновлен');
            });
        }

        // Кнопки "Результаты" - переход на страницу результатов
        document.querySelectorAll('.view-results-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const testId = this.getAttribute('data-test-id');
                console.log('Переход на страницу результатов теста:', testId);

                // Переход на страницу результатов с параметром testId
                window.location.href = `/adminResult?testId=${testId}`;
            });
        });
    }

    // Обновление текущей даты
    function updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (!dateElement) return;

        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const dateString = now.toLocaleDateString('ru-RU', options);
        dateElement.textContent = dateString;
    }

    // Вспомогательные функции
    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Ошибка форматирования даты:', error);
            return dateString;
        }
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function showFormSuccess(message) {
        const successDiv = document.getElementById('formSuccess');
        const successText = document.getElementById('successText');

        if (!successDiv || !successText) return;

        successText.textContent = message;
        successDiv.style.display = 'flex';

        // Скрываем через 5 секунд
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }

    function showFormError(message) {
        const errorDiv = document.getElementById('formError');
        const errorText = document.getElementById('errorText');

        if (!errorDiv || !errorText) return;

        errorText.textContent = message;
        errorDiv.style.display = 'flex';
    }

    function showErrorMessage(message) {
        const pageContent = document.querySelector('.admin-page-content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div class="admin-error-message">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Ошибка доступа</h3>
                <p>${message}</p>
                <div class="error-actions">
                    <a href="/dashBoard" class="btn btn-primary">
                        <i class="fas fa-user"></i>
                        Перейти в личный кабинет
                    </a>
                    <button class="btn btn-outline" onclick="location.reload()">
                        <i class="fas fa-redo"></i>
                        Повторить попытку
                    </button>
                </div>
            </div>
        `;
    }

    console.log('Admin Dashboard инициализирован');
});