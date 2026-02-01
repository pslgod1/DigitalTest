document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница результатов загружена');

    // Базовый URL API
    const API_BASE_URL = window.location.origin +'/api';
    const USER_TEST_API_URL = `${API_BASE_URL}/user-test`;
    const TESTS_API_URL = `${API_BASE_URL}/tests`;
    const USERS_API_URL = `${API_BASE_URL}/users`;

    // Глобальные переменные
    let userTestAttempt = null;
    let currentTest = null;
    let currentUser = null;
    let userAnswers = [];
    let allTestAttempts = [];

    // Инициализация
    initResultPage();

    async function initResultPage() {
        try {
            // Получаем параметры из URL
            const urlParams = new URLSearchParams(window.location.search);
            const attemptId = urlParams.get('attemptId');

            if (!attemptId) {
                showError('ID попытки теста не указан');
                return;
            }

            // Загружаем данные
            await Promise.all([
                loadCurrentUser(),
                loadUserTestAttempt(attemptId)
            ]);

            // После загрузки попытки загружаем тест
            if (userTestAttempt && userTestAttempt.test && userTestAttempt.test.id) {
                await loadTest(userTestAttempt.test.id);
            }

            // Инициализируем интерфейс
            initResultInterface();

            // Загружаем данные для сравнения
            await loadComparisonData();

        } catch (error) {
            console.error('Ошибка инициализации страницы результатов:', error);
            showError('Не удалось загрузить результаты теста.');
        }
    }

    // Загрузка текущего пользователя
    async function loadCurrentUser() {
        try {
            const response = await fetch(USERS_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                currentUser = await response.json();
                console.log('Текущий пользователь:', currentUser);
                updateUserInfo();
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
        }
    }

    // Загрузка попытки теста
    async function loadUserTestAttempt(attemptId) {
        try {
            const response = await fetch(`${USER_TEST_API_URL}/${attemptId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            userTestAttempt = await response.json();
            userAnswers = Array.from(userTestAttempt.answers || []);

            console.log('Попытка теста загружена:', userTestAttempt);
            console.log('Ответы пользователя:', userAnswers);

        } catch (error) {
            console.error('Ошибка загрузки попытки теста:', error);
            throw error;
        }
    }

    // Загрузка теста
    async function loadTest(testId) {
        try {
            const response = await fetch(`${TESTS_API_URL}/${testId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            currentTest = await response.json();
            console.log('Тест загружен:', currentTest);

        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            throw error;
        }
    }

    // Загрузка данных для сравнения
    async function loadComparisonData() {
        try {
            const response = await fetch(USER_TEST_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                allTestAttempts = await response.json();
                console.log('Все попытки загружены:', allTestAttempts.length);
                updateComparisonStats();
            }
        } catch (error) {
            console.error('Ошибка загрузки данных для сравнения:', error);
        }
    }

    // Инициализация интерфейса
    function initResultInterface() {
        // Обновляем основную информацию
        updateMainInfo();

        // Обновляем статистику
        updateScoreStats();

        // Обновляем категории
        updateCategories();

        // Создаем навигацию по вопросам
        createQuestionsNavigation();

        // Загружаем детали первого вопроса
        if (userAnswers.length > 0) {
            loadQuestionDetails(0);
        }

        // Настраиваем обработчики
        setupEventHandlers();

        // Инициализируем графики
        initCharts();
    }

    // Обновление основной информации
    function updateMainInfo() {
        if (!userTestAttempt || !currentTest) return;

        // Название теста
        const testTitleElement = document.getElementById('testTitle');
        if (testTitleElement) {
            testTitleElement.textContent = currentTest.title || 'Название теста';
        }

        // Дата прохождения
        const testDateElement = document.getElementById('testDate');
        if (testDateElement && userTestAttempt.completedAt) {
            const date = formatDate(userTestAttempt.completedAt);
            testDateElement.textContent = `Дата прохождения: ${date}`;
        }

        // Убираем блок с сертификатом, т.к. его нет в HTML
    }

    // Обновление статистики баллов
    function updateScoreStats() {
        if (!userTestAttempt || !currentTest) return;

        const totalQuestions = currentTest.questions?.length || 0;
        const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
        const percentage = userTestAttempt.percentage || 0;

        // Процент выполнения
        const percentageValueElement = document.getElementById('percentageValue');
        if (percentageValueElement) {
            percentageValueElement.textContent = `${percentage.toFixed(1)}%`;
        }

        const scorePercentElement = document.getElementById('scorePercent');
        if (scorePercentElement) {
            scorePercentElement.textContent = `${percentage.toFixed(1)}%`;
        }

        // Правильные ответы
        const correctAnswersElement = document.getElementById('correctAnswers');
        if (correctAnswersElement) {
            correctAnswersElement.textContent = correctAnswers;
        }

        // Всего вопросов
        const totalQuestionsElement = document.getElementById('totalQuestions');
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = totalQuestions;
        }

        // Время прохождения
        const timeSpentElement = document.getElementById('timeSpent');
        if (timeSpentElement && userTestAttempt.startAt && userTestAttempt.completedAt) {
            const start = new Date(userTestAttempt.startAt);
            const end = new Date(userTestAttempt.completedAt);
            const timeSpent = Math.floor((end - start) / 1000); // в секундах
            const minutes = Math.floor(timeSpent / 60);
            const seconds = timeSpent % 60;
            timeSpentElement.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Определяем уровень
        updateLevelBadge(percentage);

        // Определяем сильные стороны
        updateStrengths();
    }

    // Обновление уровня
    function updateLevelBadge(percentage) {
        const levelBadge = document.getElementById('levelBadge');
        if (!levelBadge) return;

        let level = '';

        if (percentage >= 90) {
            level = 'Эксперт';
            levelBadge.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
        } else if (percentage >= 70) {
            level = 'Продвинутый';
            levelBadge.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
        } else if (percentage >= 50) {
            level = 'Средний';
            levelBadge.style.background = 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)';
        } else {
            level = 'Начинающий';
            levelBadge.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        }

        levelBadge.textContent = level;
    }

    // Обновление сильных сторон
    function updateStrengths() {
        const strengthsList = document.getElementById('strengthsList');
        if (!strengthsList) return;

        strengthsList.innerHTML = '';

        if (!currentTest || !userAnswers.length) return;

        // Группируем ответы по категориям
        const categories = {};
        userAnswers.forEach(answer => {
            const category = answer.questionDTO?.type;
            if (category) {
                if (!categories[category]) {
                    categories[category] = { total: 0, correct: 0 };
                }
                categories[category].total++;
                if (answer.isCorrect) {
                    categories[category].correct++;
                }
            }
        });

        // Находим лучшие категории (где более 70% правильных ответов)
        const strongCategories = [];
        Object.entries(categories).forEach(([category, stats]) => {
            const percentage = (stats.correct / stats.total) * 100;
            if (percentage >= 70) {
                strongCategories.push({
                    name: getCategoryText(category),
                    percentage: percentage.toFixed(1)
                });
            }
        });

        // Добавляем в список
        strongCategories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = `${category.name} (${category.percentage}% правильных ответов)`;
            strengthsList.appendChild(li);
        });

        // Если нет сильных сторон
        if (strongCategories.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Стабильные показатели по всем категориям';
            strengthsList.appendChild(li);
        }
    }

    // Обновление категорий
    function updateCategories() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        if (!currentTest || !userAnswers.length) return;

        // Группируем ответы по категориям
        const categories = {};
        userAnswers.forEach(answer => {
            const category = answer.questionDTO?.type;
            if (category) {
                if (!categories[category]) {
                    categories[category] = { total: 0, correct: 0 };
                }
                categories[category].total++;
                if (answer.isCorrect) {
                    categories[category].correct++;
                }
            }
        });

        // Создаем элементы категорий
        Object.entries(categories).forEach(([category, stats]) => {
            const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';

            categoryItem.innerHTML = `
                <div class="category-info">
                    <div class="category-icon">
                        <i class="fas fa-${getCategoryIcon(category)}"></i>
                    </div>
                    <div>
                        <div class="category-name">${getCategoryText(category)}</div>
                        <div class="category-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="category-score">${percentage.toFixed(1)}%</div>
            `;

            categoriesList.appendChild(categoryItem);
        });
    }

    // Получение иконки для категории
    function getCategoryIcon(category) {
        const icons = {
            'THINKING': 'brain',
            'AFFILIATION': 'users',
            'FLEXIBILITY': 'exchange-alt',
            'EXPERIENCE': 'laptop-code'
        };
        return icons[category] || 'question-circle';
    }

    // Создание навигации по вопросам
    function createQuestionsNavigation() {
        const questionsList = document.getElementById('questionsList');
        if (!questionsList) return;

        questionsList.innerHTML = '';

        if (!currentTest || !currentTest.questions) return;

        const questions = currentTest.questions;

        questions.forEach((question, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-nav-item';
            questionItem.dataset.questionIndex = index;
            questionItem.textContent = index + 1;

            // Определяем статус вопроса
            const userAnswer = userAnswers.find(a => a.questionDTO?.id === question.id);
            if (userAnswer) {
                questionItem.classList.add(userAnswer.isCorrect ? 'correct' : 'incorrect');
            } else {
                questionItem.classList.add('skipped');
            }

            // Обработчик клика
            questionItem.addEventListener('click', () => {
                loadQuestionDetails(index);
                updateQuestionNavigation(index);
            });

            questionsList.appendChild(questionItem);
        });
    }

    // Загрузка деталей вопроса
    function loadQuestionDetails(questionIndex) {
        const detailCard = document.getElementById('questionDetailCard');
        if (!detailCard) return;

        if (!currentTest || !currentTest.questions || questionIndex >= currentTest.questions.length) {
            return;
        }

        const question = currentTest.questions[questionIndex];
        const userAnswer = userAnswers.find(a => a.questionDTO?.id === question.id);

        // Показываем карточку с деталями
        detailCard.style.display = 'block';

        // Номер вопроса
        const detailQuestionNumber = document.getElementById('detailQuestionNumber');
        if (detailQuestionNumber) {
            detailQuestionNumber.textContent = `Вопрос #${questionIndex + 1}`;
        }

        // Статус вопроса
        const statusElement = document.getElementById('detailQuestionStatus');
        if (statusElement) {
            if (userAnswer) {
                statusElement.textContent = userAnswer.isCorrect ? 'Правильно' : 'Неправильно';
                statusElement.className = `question-status ${userAnswer.isCorrect ? 'correct' : 'incorrect'}`;
            } else {
                statusElement.textContent = 'Пропущен';
                statusElement.className = 'question-status skipped';
            }
        }

        // Текст вопроса
        const detailQuestionText = document.getElementById('detailQuestionText');
        if (detailQuestionText) {
            detailQuestionText.textContent = question.question;
        }

        // Категория
        const detailQuestionCategory = document.getElementById('detailQuestionCategory');
        if (detailQuestionCategory) {
            detailQuestionCategory.textContent = getCategoryText(question.type);
        }

        // Ответы
        updateAnswerDetails(question, userAnswer);

        // Объяснение
        updateExplanation(question, userAnswer);

        // Обновляем кнопки навигации
        updateQuestionButtons(questionIndex);
    }

    // Обновление деталей ответов
    function updateAnswerDetails(question, userAnswer) {
        const answersList = document.getElementById('detailAnswersList');
        if (!answersList) return;

        answersList.innerHTML = '';

        if (!question.answers) return;

        question.answers.forEach((answerText, index) => {
            const answerItem = document.createElement('div');
            answerItem.className = 'answer-review-item';

            // Определяем классы
            const isSelected = userAnswer && userAnswer.selectedAnswerIndex === index;
            const isCorrect = index === question.correctAnswerIndex;

            if (isCorrect) {
                answerItem.classList.add('correct');
            } else if (isSelected && !isCorrect) {
                answerItem.classList.add('incorrect');
            }

            if (isSelected) {
                answerItem.classList.add('selected');
            }

            const letter = String.fromCharCode(65 + index);

            answerItem.innerHTML = `
                <div class="answer-letter">${letter}</div>
                <div class="answer-text">${escapeHtml(answerText)}</div>
                ${isCorrect ? '<div class="answer-check"><i class="fas fa-check"></i></div>' : ''}
            `;

            answersList.appendChild(answerItem);
        });
    }

    // Обновление объяснения
    function updateExplanation(question, userAnswer) {
        const explanationText = document.getElementById('explanationText');
        if (!explanationText) return;

        if (!userAnswer) {
            explanationText.textContent = 'Вы не ответили на этот вопрос.';
            return;
        }

        if (userAnswer.isCorrect) {
            explanationText.textContent = 'Ваш ответ правильный! ' +
                (question.explanation || 'Вы хорошо понимаете эту тему.');
        } else {
            explanationText.textContent = 'Правильный ответ: ' +
                String.fromCharCode(65 + question.correctAnswerIndex) + '. ' +
                (question.explanation || 'Рекомендуем изучить эту тему подробнее.');
        }
    }

    // Обновление кнопок навигации по вопросам
    function updateQuestionButtons(currentIndex) {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const totalQuestions = currentTest.questions?.length || 0;

        if (prevBtn) prevBtn.disabled = currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= totalQuestions - 1;

        // Обновляем обработчики
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (currentIndex > 0) {
                    loadQuestionDetails(currentIndex - 1);
                    updateQuestionNavigation(currentIndex - 1);
                }
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                if (currentIndex < totalQuestions - 1) {
                    loadQuestionDetails(currentIndex + 1);
                    updateQuestionNavigation(currentIndex + 1);
                }
            };
        }
    }

    // Обновление навигации по вопросам
    function updateQuestionNavigation(currentIndex) {
        const navItems = document.querySelectorAll('.question-nav-item');
        navItems.forEach((item, index) => {
            item.classList.remove('current');
            if (index === currentIndex) {
                item.classList.add('current');
            }
        });
    }

    // Обновление статистики сравнения
    function updateComparisonStats() {
        // Убрали блок сравнения, т.к. его нет в HTML
    }

    // Инициализация графиков
    function initCharts() {
        // Круговая диаграмма основного результата
        const scoreChart = document.getElementById('scoreChart');
        if (!scoreChart) return;

        const scoreCtx = scoreChart.getContext('2d');
        const percentage = userTestAttempt?.percentage || 0;

        new Chart(scoreCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: ['#2ecc71', '#ecf0f1'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });

        // Убрали график сравнения, т.к. его нет в HTML
    }

    // Настройка обработчиков событий
    function setupEventHandlers() {
        // Фильтры вопросов
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Убираем активный класс со всех кнопок
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Добавляем активный класс нажатой кнопке
                btn.classList.add('active');

                // Фильтруем вопросы
                filterQuestions(btn.dataset.filter);
            });
        });

        // Кнопка печати
        const printBtn = document.getElementById('printResultsBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Кнопка поделиться
        const shareBtn = document.getElementById('shareResultsBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                if (navigator.share) {
                    navigator.share({
                        title: `Мой результат теста: ${currentTest?.title}`,
                        text: `Я получил ${userTestAttempt?.percentage?.toFixed(1)}% на тесте "${currentTest?.title}"`,
                        url: window.location.href
                    });
                } else {
                    // Копируем ссылку в буфер обмена
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('Ссылка на результаты скопирована в буфер обмена');
                    });
                }
            });
        }
    }

    // Фильтрация вопросов
    function filterQuestions(filter) {
        const questions = currentTest?.questions;
        if (!questions) return;

        const navItems = document.querySelectorAll('.question-nav-item');

        navItems.forEach((item, index) => {
            const question = questions[index];
            const userAnswer = userAnswers.find(a => a.questionDTO?.id === question.id);

            let show = false;

            switch(filter) {
                case 'all':
                    show = true;
                    break;
                case 'correct':
                    show = userAnswer?.isCorrect;
                    break;
                case 'incorrect':
                    show = userAnswer && !userAnswer.isCorrect;
                    break;
                case 'skipped':
                    show = !userAnswer;
                    break;
            }

            item.style.display = show ? 'flex' : 'none';
        });
    }

    // Вспомогательные функции
    function getCategoryText(type) {
        const categories = {
            'THINKING': 'Цифровое мышление',
            'AFFILIATION': 'Цифровая аффилиация',
            'FLEXIBILITY': 'Цифровая гибкость',
            'EXPERIENCE': 'Цифровой опыт'
        };
        return categories[type] || type || 'Общая категория';
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        const resultContainer = document.querySelector('.result-container');
        if (!resultContainer) return;

        resultContainer.innerHTML = `
            <div class="error-screen" style="text-align: center; padding: 60px 20px;">
                <div class="error-icon" style="font-size: 4rem; color: #e74c3c; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 style="font-size: 1.8rem; color: #2c3e50; margin-bottom: 15px;">Ошибка</h2>
                <p style="color: #7f8c8d; margin-bottom: 30px; font-size: 1.1rem;">${message}</p>
                <div class="error-actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn btn-primary" onclick="window.location.href='/dashboard'">
                        <i class="fas fa-home"></i>
                        На главную
                    </button>
                    <button class="btn btn-outline" onclick="location.reload()">
                        <i class="fas fa-redo"></i>
                        Попробовать снова
                    </button>
                </div>
            </div>
        `;
    }

    console.log('ResultForm.js инициализирован');
});