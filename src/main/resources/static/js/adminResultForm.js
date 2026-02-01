document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница результатов теста загружена');

    const API_BASE_URL = window.location.origin + '/api';
    const TESTS_API_URL = `${API_BASE_URL}/tests`;
    const USER_TESTS_API_URL = `${API_BASE_URL}/user-test`;

    let currentTest = null;
    let testResults = [];
    let currentUser = null;

    initAdminResultsPage();

    function initAdminResultsPage() {
        console.log('Инициализация страницы результатов...');

        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('testId');

        if (!testId) {
            showError('ID теста не указан');
            return;
        }

        loadCurrentUser();
        loadTestInfo(testId);
        loadTestResults(testId);
        setupEventHandlers();
    }

    async function loadCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                currentUser = await response.json();
                console.log('Текущий пользователь:', currentUser);
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
        }
    }

    async function loadTestInfo(testId) {
        try {
            console.log('Загрузка информации о тесте...');

            const response = await fetch(`${TESTS_API_URL}/${testId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                currentTest = await response.json();
                console.log('Информация о тесте загружена:', currentTest);
                displayTestInfo();
            } else {
                console.error('Ошибка загрузки теста:', response.status);
                showError('Не удалось загрузить информацию о тесте');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            showError('Ошибка сети при загрузке теста');
        }
    }

    function displayTestInfo() {
        if (!currentTest) return;

        const testTitle = document.getElementById('testTitle');
        const testInfo = document.getElementById('testInfo');

        if (testTitle) {
            testTitle.textContent = currentTest.title || 'Результаты теста';
        }

        if (testInfo) {
            const questionsCount = currentTest.questions ? currentTest.questions.length : 0;
            const timeLimit = currentTest.timeLimitMinutes || 30;

            testInfo.innerHTML = `
                <div class="info-item">
                    <i class="fas fa-question-circle"></i>
                    <span>Вопросов: <strong>${questionsCount}</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>Время: <strong>${timeLimit} мин</strong></span>
                </div>
                ${currentTest.description ? `
                <div class="info-item">
                    <i class="fas fa-align-left"></i>
                    <span>${escapeHtml(currentTest.description)}</span>
                </div>
                ` : ''}
            `;
        }
    }

    async function loadTestResults(testId) {
        try {
            console.log('Загрузка результатов теста...');
            showLoading(true);

            const response = await fetch(`${USER_TESTS_API_URL}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const allAttempts = await response.json();
                console.log('Все попытки пользователей:', allAttempts);

                // Фильтруем только попытки для текущего теста
                testResults = allAttempts.filter(attempt =>
                    attempt.test && attempt.test.id == testId && attempt.completedAt
                );

                console.log('Отфильтрованные результаты:', testResults.length);
                displayTestResults();
                updateStatistics();
            } else {
                console.error('Ошибка загрузки результатов:', response.status);
                showError('Не удалось загрузить результаты тестирования');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            showError('Ошибка сети при загрузке результатов');
        } finally {
            showLoading(false);
        }
    }

    function displayTestResults() {
        const usersTableBody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');
        const usersCount = document.getElementById('usersCount');
        const usersContainer = document.getElementById('usersContainer');
        const resultsHeader = document.getElementById('resultsHeader');

        if (!usersTableBody || !noUsersMessage || !usersCount || !usersContainer || !resultsHeader) return;

        usersTableBody.innerHTML = '';
        usersCount.textContent = testResults.length;

        if (testResults.length === 0) {
            noUsersMessage.style.display = 'block';
            usersContainer.style.display = 'none';
            resultsHeader.style.display = 'none';
            return;
        }

        noUsersMessage.style.display = 'none';
        usersContainer.style.display = 'block';
        resultsHeader.style.display = 'block';

        testResults.forEach(result => {
            const row = createUserRow(result);
            usersTableBody.appendChild(row);
        });
    }

    function createUserRow(result) {
        const row = document.createElement('tr');

        const score = result.percentage || 0;
        const scoreClass = getScoreClass(score);
        const userName = result.user ? result.user.name : 'Неизвестный пользователь';
        const userEmail = result.user ? result.user.email : 'Нет email';

        // Рассчитываем время прохождения
        const timeSpent = calculateTimeSpent(result.startAt, result.completedAt);

        row.innerHTML = `
            <td>${escapeHtml(userName)}</td>
            <td>${escapeHtml(userEmail)}</td>
            <td class="score-cell ${scoreClass}">
                <strong>${score.toFixed(1)}%</strong>
            </td>
            <td>${timeSpent}</td>
            <td>${formatDateTime(result.completedAt)}</td>
            <td>
                <button class="btn btn-outline view-results-btn" 
                        data-attempt-id="${result.id}"
                        data-user-name="${escapeHtml(userName)}"
                        data-user-email="${escapeHtml(userEmail)}"
                        data-user-score="${score}">
                    <i class="fas fa-eye"></i>
                    Посмотреть
                </button>
            </td>
        `;

        return row;
    }

    function updateStatistics() {
        const totalUsers = document.getElementById('totalUsers');
        const avgScore = document.getElementById('avgScore');
        const completionRate = document.getElementById('completionRate');

        if (!totalUsers || !avgScore || !completionRate) return;

        totalUsers.textContent = testResults.length;

        if (testResults.length > 0) {
            const totalScore = testResults.reduce((sum, result) => sum + (result.percentage || 0), 0);
            const averageScore = totalScore / testResults.length;
            avgScore.textContent = `${averageScore.toFixed(1)}%`;
        } else {
            avgScore.textContent = '0%';
        }

        completionRate.textContent = '100%';
    }

    function calculateTimeSpent(startTime, endTime) {
        if (!startTime || !endTime) return 'Нет данных';

        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const diffMs = end - start;

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            if (hours > 0) {
                return `${hours}ч ${minutes}м`;
            } else if (minutes > 0) {
                return `${minutes}м ${seconds}с`;
            } else {
                return `${seconds}с`;
            }
        } catch (error) {
            console.error('Ошибка расчета времени:', error);
            return 'Ошибка';
        }
    }

    function getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-average';
        return 'score-poor';
    }

    function setupEventHandlers() {
        // Обработчики кнопок просмотра результатов
        document.addEventListener('click', function(e) {
            if (e.target.closest('.view-results-btn')) {
                const btn = e.target.closest('.view-results-btn');
                const attemptId = btn.dataset.attemptId;
                const userName = btn.dataset.userName;
                const userEmail = btn.dataset.userEmail;
                const userScore = btn.dataset.userScore;

                showUserResultsModal(attemptId, userName, userEmail, userScore);
            }
        });

        // Модальное окно результатов пользователя
        const userResultsModal = document.getElementById('userResultsModal');
        const closeUserResultsModal = document.getElementById('closeUserResultsModal');
        const closeModalBtn = document.getElementById('closeModalBtn');

        if (closeUserResultsModal) {
            closeUserResultsModal.addEventListener('click', () => {
                if (userResultsModal) userResultsModal.style.display = 'none';
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (userResultsModal) userResultsModal.style.display = 'none';
            });
        }

        if (userResultsModal) {
            userResultsModal.addEventListener('click', (e) => {
                if (e.target === userResultsModal) {
                    userResultsModal.style.display = 'none';
                }
            });
        }

        // Обновление по F5
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                const urlParams = new URLSearchParams(window.location.search);
                const testId = urlParams.get('testId');
                if (testId) {
                    loadTestResults(testId);
                }
            }
        });
    }

    async function showUserResultsModal(attemptId, userName, userEmail, userScore) {
        try {
            console.log(`Загрузка детальных результатов для попытки ${attemptId}...`);

            const response = await fetch(`${USER_TESTS_API_URL}/${attemptId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userResults = await response.json();
                console.log('Детальные результаты пользователя:', userResults);
                displayUserResultsModal(userResults, userName, userEmail, userScore);
            } else {
                console.error('Ошибка загрузки детальных результатов:', response.status);
                showError('Не удалось загрузить детальные результаты');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            showError('Ошибка сети при загрузке результатов');
        }
    }

    function displayUserResultsModal(userResults, userName, userEmail, userScore) {
        const userResultsModal = document.getElementById('userResultsModal');
        const userInfoHeader = document.getElementById('userInfoHeader');
        const overallResults = document.getElementById('overallResults');
        const questionsList = document.getElementById('questionsList');

        if (!userResultsModal || !userInfoHeader || !overallResults || !questionsList) return;

        // Информация о пользователе с обработкой длинного email
        userInfoHeader.innerHTML = `
        <div class="user-info-content">
            <div class="user-info-item">
                <i class="fas fa-user"></i>
                <div>
                    <strong>Пользователь:</strong><br>
                    <span>${userName}</span>
                </div>
            </div>
            <div class="user-info-item email-item">
                <i class="fas fa-envelope"></i>
                <div>
                    <strong>Email:</strong><br>
                    <span style="font-size: 16px; line-height: 1.3;">${userEmail}</span>
                </div>
            </div>
            <div class="user-info-item">
                <i class="fas fa-percentage"></i>
                <div>
                    <strong>Результат:</strong><br>
                    <span style="font-size: 20px; font-weight: bold;">${parseFloat(userScore).toFixed(1)}%</span>
                </div>
            </div>
            <div class="user-info-item">
                <i class="fas fa-calendar"></i>
                <div>
                    <strong>Дата тестирования:</strong><br>
                    <span>${formatDateTime(userResults.completedAt)}</span>
                </div>
            </div>
        </div>
    `;

        // Общие результаты
        const answers = userResults.answers || [];
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const totalQuestions = answers.length;

        overallResults.innerHTML = `
        <div class="result-card">
            <i class="fas fa-chart-line"></i>
            <span class="result-value">${parseFloat(userScore).toFixed(1)}%</span>
            <span class="result-label">Общий результат</span>
        </div>
        <div class="result-card">
            <i class="fas fa-check-circle"></i>
            <span class="result-value">${correctAnswers}/${totalQuestions}</span>
            <span class="result-label">Правильные ответы</span>
        </div>
        <div class="result-card">
            <i class="fas fa-clock"></i>
            <span class="result-value">${calculateTimeSpent(userResults.startAt, userResults.completedAt)}</span>
            <span class="result-label">Время прохождения</span>
        </div>
        ${currentTest ? `
        <div class="result-card">
            <i class="fas fa-clipboard-list"></i>
            <span class="result-value">${currentTest.questions ? currentTest.questions.length : 0}</span>
            <span class="result-label">Всего вопросов</span>
        </div>
        ` : ''}
    `;

        // Детальные результаты по вопросам
        questionsList.innerHTML = '';

        if (answers.length === 0) {
            questionsList.innerHTML = `
            <div class="question-item">
                <div class="question-text">Нет данных об ответах пользователя</div>
            </div>
        `;
            userResultsModal.style.display = 'flex';
            return;
        }

        answers.forEach((answer, index) => {
            const questionItem = createQuestionItem(answer, index + 1);
            questionsList.appendChild(questionItem);
        });

        userResultsModal.style.display = 'flex';
    }

    function createQuestionItem(answer, questionNumber) {
        const questionItem = document.createElement('div');
        questionItem.className = `question-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;

        const question = answer.questionDTO;
        if (!question) {
            questionItem.innerHTML = `
            <div class="question-text">Вопрос #${questionNumber}: Нет данных о вопросе</div>
        `;
            return questionItem;
        }

        const userAnswer = question.answers && answer.selectedAnswerIndex !== null
            ? question.answers[answer.selectedAnswerIndex]
            : 'Пользователь не ответил';

        const correctAnswer = question.answers && question.correctAnswerIndex !== null
            ? question.answers[question.correctAnswerIndex]
            : 'Правильный ответ не указан';

        questionItem.innerHTML = `
        <div class="question-text">
            <strong>Вопрос #${questionNumber}:</strong><br>
            ${escapeHtml(question.question)}
        </div>
        <div class="answer-details">
            <div class="answer-section user-answer-section">
                <h5>
                    <i class="fas fa-user"></i>
                    Ответ пользователя:
                </h5>
                <div class="answer-text">
                    <span class="user-answer">${escapeHtml(userAnswer)}</span>
                </div>
                <div class="answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}">
                    <i class="fas fa-${answer.isCorrect ? 'check-circle' : 'times-circle'}"></i>
                    ${answer.isCorrect ? 'Правильно' : 'Неправильно'}
                </div>
            </div>
            <div class="answer-section correct-answer-section">
                <h5>
                    <i class="fas fa-check-circle"></i>
                    Правильный ответ:
                </h5>
                <div class="answer-text">
                    <span class="correct-answer">${escapeHtml(correctAnswer)}</span>
                </div>
            </div>
        </div>
    `;

        return questionItem;
    }

    function showLoading(show) {
        const loading = document.getElementById('loading');
        const usersContainer = document.getElementById('usersContainer');
        const resultsHeader = document.getElementById('resultsHeader');

        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
        if (usersContainer) {
            usersContainer.style.display = show ? 'none' : 'block';
        }
        if (resultsHeader) {
            resultsHeader.style.display = show ? 'none' : 'block';
        }
    }

    function showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');

        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'flex';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }

        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    function showError(message) {
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');

        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'flex';
        }

        if (successMessage) {
            successMessage.style.display = 'none';
        }
    }

    function formatDateTime(dateString) {
        if (!dateString) return 'Нет данных';

        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('AdminResultForm.js инициализирован');
});