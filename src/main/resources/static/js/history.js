// history.js - Страница истории тестов (упрощенная версия)

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 История тестов загружена');

    // Базовый URL API
    const API_BASE_URL = window.location.origin + '/api';
    const USER_API_URL = `${API_BASE_URL}/users/me`;
    const USER_TEST_API_URL = `${API_BASE_URL}/user-test`;

    // Глобальные переменные
    let currentUser = null;
    let userTestAttempts = [];

    // Инициализация
    initHistoryPage();

    async function initHistoryPage() {
        try {
            // Обновляем текущую дату
            updateCurrentDate();

            // Настройка кнопки меню
            setupMenuToggle();

            // Настройка кнопки выхода
            setupLogoutButton();

            // Настройка навигации
            setupNavigation();

            // Загружаем данные пользователя
            await loadUserData();

            // Загружаем историю тестов
            await loadTestHistory();

            // Создаем интерфейс
            createHistoryInterface();

            // Отображаем историю тестов
            displayHistoryList();

        } catch (error) {
            console.error('Ошибка инициализации страницы истории:', error);
            showError('Не удалось загрузить историю тестов.');
        }
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

    // Настройка кнопки меню
    function setupMenuToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });
        }
    }

    // Настройка кнопки выхода
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    localStorage.removeItem('authToken');
                    sessionStorage.clear();
                    window.location.href = '/';
                }
            });
        }
    }

    // Настройка навигации в sidebar
    function setupNavigation() {
        const currentPage = window.location.pathname.split('/').pop();
        const navItems = document.querySelectorAll('.nav-link');

        navItems.forEach(item => {
            if (item.getAttribute('href') === currentPage) {
                item.parentElement.classList.add('active');
            } else {
                item.parentElement.classList.remove('active');
            }
        });
    }

    // Загрузка данных пользователя
    async function loadUserData() {
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
                    window.location.href = '/';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            currentUser = await response.json();
            updateUserInfo();

        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        }
    }

    // Обновление информации о пользователе
    function updateUserInfo() {
        if (!currentUser) return;

        const userName = currentUser.name || 'Пользователь';
        const userEmail = currentUser.email || 'Нет email';

        // Обновляем sidebar
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');

        if (userNameElement) userNameElement.textContent = userName;
        if (userEmailElement) userEmailElement.textContent = userEmail;
        if (userAvatar) {
            const nameForAvatar = userName.replace(/\s+/g, '+');
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=0077FF&color=fff&size=80`;
        }
    }

    // Загрузка истории тестов
    async function loadTestHistory() {
        try {
            showLoading(true);

            const response = await fetch(USER_TEST_API_URL, {
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

            userTestAttempts = await response.json();
            console.log('История тестов загружена:', userTestAttempts.length, 'записей');

            // Фильтруем только завершенные тесты
            userTestAttempts = userTestAttempts.filter(attempt =>
                attempt.completedAt !== null && attempt.percentage !== null
            );

            // Сортируем по дате завершения (сначала новые)
            userTestAttempts.sort((a, b) => {
                const dateA = new Date(a.completedAt);
                const dateB = new Date(b.completedAt);
                return dateB - dateA;
            });

        } catch (error) {
            console.error('Ошибка загрузки истории тестов:', error);
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Создание интерфейса истории
    function createHistoryInterface() {
        const container = document.getElementById('historyContainer');
        if (!container) return;

        container.innerHTML = `
            <!-- Заголовок -->
            <div class="history-header">
                <h2>История тестирований</h2>
                <p class="history-subtitle">Всего завершенных тестов: <span id="totalAttemptsCount">0</span></p>
            </div>

            <!-- Общая статистика -->
            <div class="overall-stats">
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #1a73e8;">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="avgPercentage">0%</h3>
                        <p>Средний процент</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #34a853;">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="bestScore">0%</h3>
                        <p>Лучший результат</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #8e44ad;">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="firstTestDate">-</h3>
                        <p>Первый тест</p>
                    </div>
                </div>
            </div>

            <!-- Список тестов -->
            <div class="history-content">
                <div class="history-list" id="historyList">
                    <!-- Список тестов будет здесь -->
                </div>
            </div>
        `;
    }

    // Отображение списка истории
    function displayHistoryList() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        // Обновляем статистику
        updateOverallStats();

        if (!userTestAttempts || userTestAttempts.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h3>Нет завершенных тестов</h3>
                    <p>Пройдите тест, чтобы увидеть результаты здесь</p>
                    <a href="/chooseTest" class="btn btn-primary">Пройти тест</a>
                </div>
            `;
            return;
        }

        // Создаем элементы списка
        historyList.innerHTML = '';

        userTestAttempts.forEach((attempt, index) => {
            const attemptElement = createAttemptElement(attempt, index);
            historyList.appendChild(attemptElement);
        });
    }

    // Обновление общей статистики
    function updateOverallStats() {
        const totalAttemptsCount = document.getElementById('totalAttemptsCount');
        const avgPercentage = document.getElementById('avgPercentage');
        const bestScore = document.getElementById('bestScore');
        const firstTestDate = document.getElementById('firstTestDate');

        if (!userTestAttempts || userTestAttempts.length === 0) {
            totalAttemptsCount.textContent = '0';
            avgPercentage.textContent = '0%';
            bestScore.textContent = '0%';
            firstTestDate.textContent = '-';
            return;
        }

        const totalAttempts = userTestAttempts.length;

        // Средний процент
        const totalPercentage = userTestAttempts.reduce((sum, a) => sum + a.percentage, 0);
        const avgPercentageValue = Math.round(totalPercentage / totalAttempts);

        // Лучший результат
        const bestScoreValue = Math.max(...userTestAttempts.map(a => a.percentage));

        // Дата первого теста
        const dates = userTestAttempts.map(a => new Date(a.completedAt));
        const oldestDate = new Date(Math.min(...dates));
        const firstDateFormatted = oldestDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Обновляем UI
        totalAttemptsCount.textContent = totalAttempts;
        avgPercentage.textContent = `${avgPercentageValue}%`;
        bestScore.textContent = `${Math.round(bestScoreValue)}%`;
        firstTestDate.textContent = firstDateFormatted;
    }

    // Создание элемента попытки теста
    function createAttemptElement(attempt, index) {
        const element = document.createElement('div');
        element.className = 'attempt-card';

        const testTitle = attempt.test?.title || `Тест #${attempt.id}`;
        const percentage = attempt.percentage || 0;
        const level = getLevelByPercentage(percentage);

        // Форматируем дату завершения
        const completedDate = formatDate(attempt.completedAt);

        // Время прохождения
        let timeSpent = '-';
        if (attempt.startAt && attempt.completedAt) {
            const start = new Date(attempt.startAt);
            const end = new Date(attempt.completedAt);
            const seconds = Math.floor((end - start) / 1000);
            const minutes = Math.floor(seconds / 60);

            if (minutes > 0) {
                timeSpent = `${minutes} мин`;
            } else {
                timeSpent = `${seconds} сек`;
            }
        }

        // Подсчитываем статистику ответов
        let totalQuestions = 0;
        let correctAnswers = 0;

        if (attempt.answers && attempt.answers.length > 0) {
            totalQuestions = attempt.answers.length;
            correctAnswers = attempt.answers.filter(a => a.isCorrect).length;
        }

        element.innerHTML = `
            <div class="attempt-header">
                <div class="attempt-title">
                    <h4>${testTitle}</h4>
                    <span class="attempt-date">
                        <i class="far fa-calendar"></i> ${completedDate}
                    </span>
                </div>
                <div class="attempt-score">
                    <div class="score-badge ${level}">
                        ${Math.round(percentage)}%
                    </div>
                    <span class="score-level">${getLevelName(level)}</span>
                </div>
            </div>
            
            <div class="attempt-stats">
                <div class="stat-row">
                    <div class="stat-item">
                        <span class="stat-label">Вопросов:</span>
                        <span class="stat-value">${totalQuestions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Правильных:</span>
                        <span class="stat-value">${correctAnswers}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Время:</span>
                        <span class="stat-value">${timeSpent}</span>
                    </div>
                </div>
            </div>
            
            <div class="attempt-actions">
                <a href="/result?attemptId=${attempt.id}" class="btn btn-primary">
                    <i class="fas fa-eye"></i> Подробный отчет
                </a>
            </div>
        `;

        return element;
    }

    // Вспомогательные функции
    function getLevelByPercentage(percentage) {
        if (percentage >= 91) return 'expert';
        if (percentage >= 71) return 'specialist';
        if (percentage >= 41) return 'practitioner';
        return 'beginner';
    }

    function getLevelName(level) {
        switch(level) {
            case 'expert': return 'Эксперт';
            case 'specialist': return 'Специалист';
            case 'practitioner': return 'Практик';
            default: return 'Новичок';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showLoading(show) {
        const container = document.getElementById('historyContainer');
        if (!container) return;

        if (show) {
            container.innerHTML = `
                <div class="loading-overlay">
                    <div class="spinner"></div>
                    <p>Загрузка истории тестов...</p>
                </div>
            `;
        }
    }

    function showError(message) {
        const container = document.getElementById('historyContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="error-screen">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Ошибка загрузки</h2>
                <p>${message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                    <a href="/dashboard" class="btn btn-outline">
                        <i class="fas fa-home"></i> На главную
                    </a>
                </div>
            </div>
        `;
    }

    // Добавляем CSS стили
    const style = document.createElement('style');
    style.textContent = `
        .history-container {
            padding: 20px;
        }
        
        .history-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .history-header h2 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        
        .history-subtitle {
            color: #7f8c8d;
            margin: 0;
            font-size: 16px;
        }
        
        .overall-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .stat-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        
        .stat-content h3 {
            margin: 0;
            font-size: 24px;
            color: #2c3e50;
        }
        
        .stat-content p {
            margin: 5px 0 0 0;
            color: #7f8c8d;
            font-size: 14px;
        }
        
        .history-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .attempt-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.08);
            padding: 25px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .attempt-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.12);
        }
        
        .attempt-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        
        .attempt-title {
            flex: 1;
        }
        
        .attempt-title h4 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 18px;
        }
        
        .attempt-date {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #7f8c8d;
            font-size: 14px;
        }
        
        .attempt-date i {
            color: #1a73e8;
        }
        
        .attempt-score {
            text-align: center;
        }
        
        .score-badge {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
            margin: 0 auto 5px auto;
        }
        
        .score-badge.beginner { background: #95a5a6; }
        .score-badge.practitioner { background: #3498db; }
        .score-badge.specialist { background: #2ecc71; }
        .score-badge.expert { background: #9b59b6; }
        
        .score-level {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .attempt-stats {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .stat-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-label {
            display: block;
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 5px;
        }
        
        .stat-value {
            display: block;
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .attempt-actions {
            display: flex;
            justify-content: flex-end;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        
        .empty-history {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.05);
        }
        
        .empty-icon {
            font-size: 48px;
            color: #bdc3c7;
            margin-bottom: 20px;
        }
        
        .empty-history h3 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .empty-history p {
            color: #7f8c8d;
            margin-bottom: 20px;
        }
        
        .loading-overlay {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        .error-screen {
            text-align: center;
            padding: 60px 20px;
        }
        
        .error-icon {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 20px;
        }
        
        .error-screen h2 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .error-screen p {
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        
        .error-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .attempt-header {
                flex-direction: column;
                gap: 15px;
            }
            
            .attempt-score {
                align-self: flex-start;
            }
            
            .overall-stats {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);

    console.log('History.js инициализирован (упрощенная версия)');
});