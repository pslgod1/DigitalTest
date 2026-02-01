// dashboard.js - JavaScript для личного кабинета

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Dashboard загружен');

    // Базовый URL API
    const API_BASE_URL = window.location.origin + '/api';
    const USER_API_URL = `${API_BASE_URL}/users/me`;
    const USER_TEST_API_URL = `${API_BASE_URL}/user-test`;

    // Глобальные переменные
    let currentUser = null;
    let userTestAttempts = [];
    let userStats = {
        totalTests: 0,
        averageScore: 0,
        currentLevel: 'Новичок'
    };
    let progressChart = null;

    // Инициализация
    initDashboard();

    async function initDashboard() {
        try {
            // Обновляем текущую дату
            updateCurrentDate();

            // Настройка кнопки меню
            setupMenuToggle();

            // Настройка кнопки выхода
            setupLogoutButton();

            // Загружаем данные пользователя
            await loadUserData();

            // Загружаем историю тестов
            await loadTestHistory();

            // Обновляем статистику
            updateStatistics();

            // Загружаем последний результат
            await loadLastResult();

            // Создаем график прогресса
            createProgressChart();

            // Анимация загрузки
            animateStats();

        } catch (error) {
            console.error('Ошибка инициализации дашборда:', error);
            showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
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
            logoutBtn.addEventListener('click', async function() {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    console.log('Выход из аккаунта...');
                    // Очищаем localStorage если используете токены
                    localStorage.removeItem('authToken');
                    sessionStorage.clear();
                    // Редирект на главную
                    window.location.href = '/';
                }
            });
        }
    }

    // Загрузка данных пользователя
    async function loadUserData() {
        console.log('Загрузка данных пользователя...');

        try {
            const response = await fetch(USER_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Для сессий и куки
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Не авторизован - редирект на главную
                    window.location.href = '/';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            currentUser = await response.json();
            console.log('Данные пользователя:', currentUser);

            // Обновляем UI с данными пользователя
            updateUserUI();

        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
            // Показываем ошибку
            document.getElementById('userName').textContent = 'Ошибка загрузки';
            document.getElementById('userEmail').textContent = 'Обновите страницу';
            document.getElementById('welcomeName').textContent = 'Пользователь';
        }
    }

    // Обновление UI с данными пользователя
    function updateUserUI() {
        if (!currentUser) return;

        // Имя пользователя
        const userName = currentUser.name || 'Пользователь';
        const userEmail = currentUser.email || 'Нет email';

        // Обновляем элементы
        document.getElementById('userName').textContent = userName;
        document.getElementById('userEmail').textContent = userEmail;
        document.getElementById('welcomeName').textContent = userName.split(' ')[0] || userName;

        // Обновляем аватар
        const avatarImg = document.getElementById('userAvatar');
        const nameForAvatar = userName.replace(/\s+/g, '+');
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=0077FF&color=fff&size=80`;
    }

    // Загрузка истории тестов
    async function loadTestHistory() {
        console.log('Загрузка истории тестов...');

        try {
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

        } catch (error) {
            console.error('Ошибка загрузки истории тестов:', error);
            userTestAttempts = [];
        }
    }

    // Обновление статистики
    function updateStatistics() {
        if (!userTestAttempts || userTestAttempts.length === 0) {
            // Нет пройденных тестов
            userStats = {
                totalTests: 0,
                averageScore: 0,
                currentLevel: 'Новичок'
            };
        } else {
            // Рассчитываем статистику
            const totalTests = userTestAttempts.length;
            const totalScore = userTestAttempts.reduce((sum, attempt) =>
                sum + (attempt.percentage || 0), 0
            );
            const averageScore = totalScore / totalTests;

            // Определяем уровень по среднему баллу
            let currentLevel = 'Новичок';
            if (averageScore >= 91) currentLevel = 'Эксперт';
            else if (averageScore >= 71) currentLevel = 'Специалист';
            else if (averageScore >= 41) currentLevel = 'Практик';

            userStats = {
                totalTests: totalTests,
                averageScore: Math.round(averageScore),
                currentLevel: currentLevel
            };
        }

        // Обновляем UI статистики
        document.getElementById('totalTests').textContent = userStats.totalTests;
        document.getElementById('averageScore').textContent = userStats.averageScore;
        document.getElementById('currentLevel').textContent = userStats.currentLevel;
    }

    // Загрузка последнего результата
    async function loadLastResult() {
        const lastResultCard = document.getElementById('lastResultCard');
        const emptyResults = document.getElementById('emptyResults');

        if (!userTestAttempts || userTestAttempts.length === 0) {
            // Нет результатов - показываем сообщение
            lastResultCard.style.display = 'none';
            emptyResults.style.display = 'block';
            return;
        }

        // Берем последний завершенный тест
        const lastAttempt = userTestAttempts[0]; // Предполагаем, что список отсортирован по дате

        // Скрываем сообщение "нет результатов"
        emptyResults.style.display = 'none';
        lastResultCard.style.display = 'block';

        // Обновляем информацию о тесте
        document.getElementById('lastTestTitle').textContent =
            lastAttempt.test?.title || `Тест #${lastAttempt.id}`;

        // Форматируем дату
        if (lastAttempt.completedAt) {
            const date = new Date(lastAttempt.completedAt);
            const dateString = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('lastTestDate').textContent = dateString;
        }

        // Время прохождения
        if (lastAttempt.startAt && lastAttempt.completedAt) {
            const start = new Date(lastAttempt.startAt);
            const end = new Date(lastAttempt.completedAt);
            const timeSpent = Math.floor((end - start) / 1000); // в секундах
            const minutes = Math.floor(timeSpent / 60);
            const seconds = timeSpent % 60;
            document.getElementById('lastTestTime').textContent =
                `${minutes} мин ${seconds} сек`;
        }

        // Статистика
        const percentage = lastAttempt.percentage || 0;
        document.getElementById('lastTestScore').textContent = Math.round(percentage);
        document.getElementById('lastTestPercentage').textContent = `${Math.round(percentage)}%`;

        // Подсчитываем правильные ответы и общее количество
        let totalQuestions = 0;
        let correctAnswers = 0;

        if (lastAttempt.answers && lastAttempt.answers.length > 0) {
            totalQuestions = lastAttempt.answers.length;
            correctAnswers = lastAttempt.answers.filter(answer => answer.isCorrect).length;
        }

        document.getElementById('lastTestTotalQuestions').textContent = totalQuestions;
        document.getElementById('lastTestCorrectAnswers').textContent = correctAnswers;

        // Определяем уровень для этого теста
        let level = 'Новичок';
        let levelDesc = 'Уровень: 0-40% (базовые знания)';

        if (percentage >= 91) {
            level = 'Эксперт';
            levelDesc = 'Уровень: 91-100% (высокое мастерство)';
        } else if (percentage >= 71) {
            level = 'Специалист';
            levelDesc = 'Уровень: 71-90% (прочные знания и навыки)';
        } else if (percentage >= 41) {
            level = 'Практик';
            levelDesc = 'Уровень: 41-70% (хорошие базовые навыки)';
        }

        document.getElementById('lastTestLevel').textContent = level;
        document.getElementById('lastTestLevelDesc').textContent = levelDesc;
        document.getElementById('lastTestLevel').className = 'level-badge ' + level.toLowerCase();

        // Обновляем компоненты (категории)
        updateResultComponents(lastAttempt);
    }

    // Обновление компонентов результата
    function updateResultComponents(attempt) {
        const componentsContainer = document.getElementById('resultComponents');
        componentsContainer.innerHTML = '';

        if (!attempt.answers || attempt.answers.length === 0) {
            componentsContainer.innerHTML = '<p class="no-components">Нет данных по категориям</p>';
            return;
        }

        // Группируем ответы по категориям
        const categories = {
            'THINKING': { name: 'Цифровое мышление', total: 0, correct: 0, color: '#1a73e8' },
            'AFFILIATION': { name: 'Цифровая аффилиация', total: 0, correct: 0, color: '#ea4335' },
            'FLEXIBILITY': { name: 'Цифровая гибкость', total: 0, correct: 0, color: '#34a853' },
            'EXPERIENCE': { name: 'Цифровой опыт', total: 0, correct: 0, color: '#8e44ad' }
        };

        // Считаем статистику по категориям
        attempt.answers.forEach(answer => {
            const category = answer.questionDTO?.type;
            if (category && categories[category]) {
                categories[category].total++;
                if (answer.isCorrect) {
                    categories[category].correct++;
                }
            }
        });

        // Создаем элементы для каждой категории
        Object.values(categories).forEach(category => {
            if (category.total > 0) {
                const percentage = (category.correct / category.total) * 100;

                const componentElement = document.createElement('div');
                componentElement.className = 'component-progress';

                componentElement.innerHTML = `
                    <div class="component-header">
                        <span class="component-name">${category.name}</span>
                        <span class="component-value">${Math.round(percentage)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background-color: ${category.color};"></div>
                    </div>
                    <div class="component-stats">
                        <small>${category.correct} из ${category.total} правильных</small>
                    </div>
                `;

                componentsContainer.appendChild(componentElement);
            }
        });
    }

    // Создание графика прогресса
    function createProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        if (!userTestAttempts || userTestAttempts.length === 0) {
            ctx.parentElement.innerHTML = '<p class="no-chart-data">Пройдите тесты, чтобы увидеть график прогресса</p>';
            return;
        }

        // Подготавливаем данные для графика
        const attempts = userTestAttempts.slice(-10).reverse(); // Последние 10 тестов
        const labels = attempts.map((attempt, index) => `Тест ${attempts.length - index}`);
        const percentages = attempts.map(attempt => Math.round(attempt.percentage || 0));
        const dates = attempts.map(attempt => {
            if (attempt.completedAt) {
                const date = new Date(attempt.completedAt);
                return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            }
            return '';
        });

        // Уничтожаем старый график если есть
        if (progressChart) {
            progressChart.destroy();
        }

        // Создаем новый график
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Результат теста (%)',
                    data: percentages,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#1a73e8',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const attempt = attempts[context.dataIndex];
                                const testName = attempt.test?.title || `Тест #${attempt.id}`;
                                return `${testName}: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Процент выполнения (%)'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Дата прохождения'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });

        // Создаем легенду
        updateChartLegend();
    }

    // Обновление легенды графика
    function updateChartLegend() {
        const legend = document.getElementById('chartLegend');
        if (!legend) return;

        if (!userTestAttempts || userTestAttempts.length === 0) {
            legend.innerHTML = '';
            return;
        }

        const lastAttempt = userTestAttempts[0];
        const percentage = Math.round(lastAttempt.percentage || 0);

        let trend = '';
        let trendClass = '';

        if (userTestAttempts.length >= 2) {
            const current = userTestAttempts[0].percentage || 0;
            const previous = userTestAttempts[1].percentage || 0;
            const difference = current - previous;

            if (difference > 5) {
                trend = '↑ Улучшение';
                trendClass = 'trend-up';
            } else if (difference < -5) {
                trend = '↓ Снижение';
                trendClass = 'trend-down';
            } else {
                trend = '→ Стабильно';
                trendClass = 'trend-stable';
            }
        }

        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background-color: #1a73e8"></span>
                <span class="legend-text">Последний тест: <strong>${percentage}%</strong></span>
            </div>
            ${trend ? `<div class="legend-item ${trendClass}">${trend}</div>` : ''}
        `;
    }

    // Анимация статистики
    function animateStats() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });

        // Анимация результата
        const resultCard = document.getElementById('lastResultCard');
        if (resultCard && resultCard.style.display !== 'none') {
            resultCard.style.opacity = '0';
            resultCard.style.transform = 'translateY(20px)';

            setTimeout(() => {
                resultCard.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
                resultCard.style.opacity = '1';
                resultCard.style.transform = 'translateY(0)';
            }, 500);
        }
    }

    // Показать ошибку
    function showError(message) {
        const pageContent = document.querySelector('.page-content');
        if (!pageContent) return;

        const errorHTML = `
            <div class="error-message">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Ошибка загрузки</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Обновить страницу
                </button>
            </div>
        `;

        // Сохраняем оригинальный контент
        if (!window.originalPageContent) {
            window.originalPageContent = pageContent.innerHTML;
        }

        pageContent.innerHTML = errorHTML;
    }

    // Восстановить оригинальный контент
    function restoreContent() {
        const pageContent = document.querySelector('.page-content');
        if (pageContent && window.originalPageContent) {
            pageContent.innerHTML = window.originalPageContent;
            // Переинициализируем
            setTimeout(() => {
                initDashboard();
            }, 100);
        }
    }

    // Экспортируем функции для использования в консоли
    window.dashboard = {
        loadUserData,
        loadTestHistory,
        updateStatistics,
        createProgressChart,
        restoreContent
    };

    console.log('Dashboard инициализирован');
});

// Добавим CSS для новых элементов
const style = document.createElement('style');
style.textContent = `
    .chart-container {
        height: 300px;
        margin-top: 20px;
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .chart-legend {
        display: flex;
        gap: 20px;
        align-items: center;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #f8f9fa;
        border-radius: 20px;
        font-size: 14px;
    }
    
    .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }
    
    .trend-up {
        color: #34a853;
        background: rgba(52, 168, 83, 0.1);
    }
    
    .trend-down {
        color: #ea4335;
        background: rgba(234, 67, 53, 0.1);
    }
    
    .trend-stable {
        color: #fbbc04;
        background: rgba(251, 188, 4, 0.1);
    }
    
    .result-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .stat-item {
        text-align: center;
    }
    
    .stat-label {
        display: block;
        font-size: 14px;
        color: #6c757d;
        margin-bottom: 5px;
    }
    
    .stat-value {
        display: block;
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
    }
    
    .component-stats {
        font-size: 12px;
        color: #6c757d;
        margin-top: 5px;
        text-align: right;
    }
    
    .no-chart-data, .no-components {
        text-align: center;
        color: #6c757d;
        padding: 40px 20px;
        font-style: italic;
    }
    
    .error-message {
        text-align: center;
        padding: 60px 20px;
        max-width: 500px;
        margin: 0 auto;
    }
    
    .error-message .error-icon {
        font-size: 48px;
        color: #e74c3c;
        margin-bottom: 20px;
    }
    
    .level-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        color: white;
    }
    
    .level-badge.novice { background: #95a5a6; }
    .level-badge.beginner { background: #95a5a6; }
    .level-badge.practitioner { background: #3498db; }
    .level-badge.specialist { background: #2ecc71; }
    .level-badge.expert { background: #9b59b6; }
`;
document.head.appendChild(style);