document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница выбора теста загружена');

    // Базовый URL API
    const API_BASE_URL = window.location.origin + '/api';
    const TESTS_API_URL = `${API_BASE_URL}/tests`;
    const USER_TEST_API_URL = `${API_BASE_URL}/user-test`;

    // Инициализация страницы
    initChooseTestPage();

    function initChooseTestPage() {
        // Загружаем тесты
        loadTests();

        // Настраиваем поиск
        setupSearch();

        // Настраиваем модальное окно
        setupModal();
    }

    // Загрузка тестов с бэкенда
    async function loadTests() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const noResultsState = document.getElementById('noResultsState');
        const testsContainer = document.getElementById('testsContainer');

        // Показываем состояние загрузки
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        noResultsState.style.display = 'none';

        // Очищаем контейнер
        testsContainer.innerHTML = '';
        testsContainer.appendChild(loadingState);

        try {
            // Загружаем все тесты
            const tests = await fetchAllTests();

            // Загружаем попытки пользователя
            const userAttempts = await fetchUserTestAttempts();

            // Создаем карточки тестов
            createTestCards(tests, userAttempts);

            // Обновляем статистику
            updateStatistics();

        } catch (error) {
            console.error('Ошибка при загрузке тестов:', error);
            showErrorState('Ошибка загрузки тестов. Попробуйте обновить страницу.');
        } finally {
            loadingState.style.display = 'none';
        }
    }

    // Загрузка всех тестов с бэкенда
    async function fetchAllTests() {
        try {
            const response = await fetch(TESTS_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении тестов:', error);
            throw error;
        }
    }

    // Загрузка попыток пользователя
    async function fetchUserTestAttempts() {
        try {
            const response = await fetch(USER_TEST_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Если пользователь не авторизован, возвращаем пустой массив
                if (response.status === 401) {
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка при получении попыток пользователя:', error);
            return [];
        }
    }

    // Создание карточек тестов
    function createTestCards(tests, userAttempts) {
        const testsContainer = document.getElementById('testsContainer');
        const emptyState = document.getElementById('emptyState');
        const noResultsState = document.getElementById('noResultsState');

        // Очищаем контейнер
        testsContainer.innerHTML = '';

        if (!tests || tests.length === 0) {
            emptyState.style.display = 'block';
            testsContainer.appendChild(emptyState);
            return;
        }

        // Создаем маппинг тест ID -> статус попытки
        const testStatusMap = {};
        userAttempts.forEach(attempt => {
            const testId = attempt.testId; // Используем testId из DTO
            if (testId) {
                if (attempt.completedAt) {
                    testStatusMap[testId] = 'completed';
                } else if (attempt.startedAt) {
                    testStatusMap[testId] = 'in-progress';
                }
            }
        });

        // Создаем карточки для каждого теста
        tests.forEach(test => {
            const testCard = createTestCard(test, testStatusMap[test.id] || 'not-started');
            testsContainer.appendChild(testCard);
        });

        // Показываем сообщение, если не найдены тесты после фильтрации
        if (testsContainer.children.length === 0) {
            noResultsState.style.display = 'block';
            testsContainer.appendChild(noResultsState);
        }
    }

    // Создание карточки теста
    function createTestCard(test, status) {
        const card = document.createElement('div');
        card.className = 'test-card';
        card.dataset.testId = test.id;
        card.dataset.testStatus = status;

        // Определяем время для фильтрации
        const timeLimit = test.timeLimitMinutes || 30;
        let timeCategory = 'medium';
        if (timeLimit <= 15) timeCategory = 'short';
        if (timeLimit > 30) timeCategory = 'long';

        // Определяем количество вопросов
        const questionCount = test.questions ? test.questions.length || 0 : 0;

        // Определяем статус и текст кнопки
        let statusText, buttonText, buttonClass, statusClass;
        switch (status) {
            case 'completed':
                statusText = 'Завершен';
                buttonText = 'Посмотреть результаты';
                buttonClass = 'btn-outline';
                statusClass = 'status-completed';
                break;
            case 'in-progress':
                statusText = 'В процессе';
                buttonText = 'Продолжить';
                buttonClass = 'btn-primary';
                statusClass = 'status-in-progress';
                break;
            default:
                statusText = 'Не начат';
                buttonText = 'Начать тест';
                buttonClass = 'btn-primary';
                statusClass = 'status-not-started';
        }

        card.innerHTML = `
            <div class="test-header-row">
                <h3 class="test-title">${escapeHtml(test.title || 'Без названия')}</h3>
                <span class="test-category" data-time-category="${timeCategory}">
                    ${timeCategory === 'short' ? 'Короткий' : timeCategory === 'long' ? 'Длинный' : 'Средний'}
                </span>
            </div>
            
            <p class="test-description">${escapeHtml(test.description || 'Описание отсутствует')}</p>
            
            <div class="test-meta">
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${timeLimit} минут</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-question-circle"></i>
                    <span>${questionCount} вопросов</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formatDate(test.createAt || new Date().toISOString())}</span>
                </div>
            </div>
            
            <div class="test-questions">
                <div class="questions-count">${questionCount} вопросов</div>
                <div class="test-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="test-actions">
                <button class="btn ${buttonClass} start-test-btn" data-test-id="${test.id}">
                    <i class="fas fa-play"></i>
                    ${buttonText}
                </button>
            </div>
        `;

        // Добавляем обработчик клика на кнопку
        const startBtn = card.querySelector('.start-test-btn');
        startBtn.addEventListener('click', function() {
            const testId = this.dataset.testId;
            showTestConfirmation(test);
        });

        return card;
    }

    // Показ подтверждения начала теста
    function showTestConfirmation(test) {
        const modal = document.getElementById('confirmModal');
        const testPreview = document.getElementById('testPreview');
        const questionCount = test.questions ? test.questions.length || 0 : 0;

        // Заполняем информацию о тесте
        testPreview.innerHTML = `
            <h4 class="preview-title">${escapeHtml(test.title || 'Без названия')}</h4>
            <p class="preview-description">${escapeHtml(test.description || 'Описание отсутствует')}</p>
            
            <div class="preview-meta">
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span><strong>Время:</strong> ${test.timeLimitMinutes || 30} минут</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-question-circle"></i>
                    <span><strong>Вопросов:</strong> ${questionCount}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span><strong>Создан:</strong> ${formatDate(test.createAt || new Date().toISOString())}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user-tie"></i>
                    <span><strong>Автор:</strong> Администратор</span>
                </div>
            </div>
            
            <div class="test-instructions">
                <p><i class="fas fa-info-circle"></i> После начала теста будет запущен таймер</p>
                <p><i class="fas fa-exclamation-circle"></i> Не закрывайте страницу во время прохождения теста</p>
                <p><i class="fas fa-check-circle"></i> Вы можете вернуться к вопросам в рамках одного теста</p>
            </div>
        `;

        // Сохраняем ID теста в модальном окне
        modal.dataset.testId = test.id;

        // Показываем модальное окно
        modal.style.display = 'flex';
    }

    // Настройка модального окна
    function setupModal() {
        const modal = document.getElementById('confirmModal');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const modalConfirm = document.getElementById('modalConfirm');

        if (!modal || !modalClose || !modalCancel || !modalConfirm) {
            console.error('Элементы модального окна не найдены!');
            return;
        }

        console.log('Настройка модального окна...');

        // Закрытие модального окна
        modalClose.addEventListener('click', () => {
            console.log('Закрытие модального окна');
            modal.style.display = 'none';
        });

        modalCancel.addEventListener('click', () => {
            console.log('Отмена в модальном окне');
            modal.style.display = 'none';
        });

        // Клик вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Клик вне модального окна');
                modal.style.display = 'none';
            }
        });

        // Подтверждение начала теста
        modalConfirm.addEventListener('click', async () => {
            const testId = modal.dataset.testId;
            console.log('Начало теста с ID:', testId);
            if (testId) {
                await startTest(testId);
            }
        });
    }

    // Начало теста
    async function startTest(testId) {
        const modalConfirm = document.getElementById('modalConfirm');

        // Показываем состояние загрузки
        const originalText = modalConfirm.innerHTML;
        modalConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
        modalConfirm.disabled = true;

        try {
            // Создаем попытку теста
            const response = await fetch(`${USER_TEST_API_URL}/${testId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка сервера:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userTestAttempt = await response.json();
            console.log('Попытка теста создана:', userTestAttempt);

            // Закрываем модальное окно
            document.getElementById('confirmModal').style.display = 'none';

            // Перенаправляем на страницу теста
            window.location.href = `/test?testId=${testId}&attemptId=${userTestAttempt.id}`;

        } catch (error) {
            console.error('Ошибка при начале теста:', error);
            alert(`Ошибка при начале теста: ${error.message}. Попробуйте еще раз.`);

            // Восстанавливаем кнопку
            modalConfirm.innerHTML = originalText;
            modalConfirm.disabled = false;
        }
    }

    // Настройка поиска
    function setupSearch() {
        const searchInput = document.getElementById('testSearch');
        if (!searchInput) return;

        let searchTimeout;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applySearch(this.value.trim());
            }, 300);
        });
    }

    // Применение поиска
    function applySearch(searchTerm) {
        const cards = document.querySelectorAll('.test-card');
        const noResultsState = document.getElementById('noResultsState');

        if (!noResultsState) return;

        if (!searchTerm) {
            // Если поисковой запрос пуст, показываем все карточки
            cards.forEach(card => {
                card.style.display = 'flex';
            });
            noResultsState.style.display = 'none';
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.test-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.test-description')?.textContent.toLowerCase() || '';

            if (title.includes(searchLower) || description.includes(searchLower)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Показываем сообщение, если ничего не найдено
        noResultsState.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Обновление статистики
    function updateStatistics() {
        const cards = document.querySelectorAll('.test-card');
        const totalTests = cards.length;

        let availableTests = 0;
        let completedTests = 0;
        let inProgressTests = 0;

        cards.forEach(card => {
            const status = card.dataset.testStatus;

            if (status !== 'completed') {
                availableTests++;
            }

            if (status === 'completed') {
                completedTests++;
            } else if (status === 'in-progress') {
                inProgressTests++;
            }
        });

        // Обновляем значения в интерфейсе
        const totalEl = document.getElementById('totalTests');
        const availableEl = document.getElementById('availableTests');
        const completedEl = document.getElementById('completedTests');
        const inProgressEl = document.getElementById('inProgressTests');

        if (totalEl) totalEl.textContent = totalTests;
        if (availableEl) availableEl.textContent = availableTests;
        if (completedEl) completedEl.textContent = completedTests;
        if (inProgressEl) inProgressEl.textContent = inProgressTests;
    }

    // Показать состояние ошибки
    function showErrorState(message) {
        const testsContainer = document.getElementById('testsContainer');
        const loadingState = document.getElementById('loadingState');

        if (!testsContainer || !loadingState) return;

        loadingState.style.display = 'none';

        testsContainer.innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3 style="font-size: 1.5rem; color: #2c3e50; margin-bottom: 10px;">Ошибка загрузки</h3>
                <p style="color: #7f8c8d; margin-bottom: 20px;">${message}</p>
                <button class="btn btn-primary" id="retryBtn">
                    <i class="fas fa-redo"></i>
                    Попробовать снова
                </button>
            </div>
        `;

        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadTests);
        }
    }

    // Вспомогательные функции
    function formatDate(dateString) {
        if (!dateString) return 'Дата не указана';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Ошибка форматирования даты:', error);
            return dateString;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Экспортируем функции для отладки
    window.chooseTest = {
        loadTests,
        startTest,
        applySearch,
        updateStatistics
    };

    console.log('Страница выбора теста инициализирована');
});