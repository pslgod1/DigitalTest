document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница прохождения теста загружена');

    // Базовый URL API
    const API_BASE_URL = window.location.origin + '/api';
    const TESTS_API_URL = `${API_BASE_URL}/tests`;
    const USER_TEST_API_URL = `${API_BASE_URL}/user-test`;
    const USER_ANSWER_API_URL = `${API_BASE_URL}/user-answer`;

    // Глобальные переменные состояния
    let currentTest = null;
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let userAnswers = new Map();
    let testTimer = null;
    let timeRemaining = 0;
    let testStartTime = null;
    let userTestAttemptId = null;
    let isTestPaused = false;
    let testCompleted = false;
    let currentUser = null;

    // Инициализация страницы
    initTestPage();

    async function initTestPage() {
        try {
            console.log('Начинаем инициализацию теста...');

            // Сначала получаем пользователя
            await loadCurrentUser();

            // Обновляем заглушки
            updateTestInfoPlaceholder();

            // Получаем ID теста из URL
            const urlParams = new URLSearchParams(window.location.search);
            const testId = urlParams.get('testId') || urlParams.get('id');
            const attemptId = urlParams.get('attemptId');

            console.log('Параметры URL:', {
                testId: testId,
                attemptId: attemptId
            });

            if (!testId) {
                showError('ID теста не указан');
                return;
            }

            // Загружаем тест
            await loadTest(testId);

            // Загружаем или создаем попытку теста
            if (attemptId) {
                await loadUserTestAttempt(attemptId);
            } else {
                await createUserTestAttempt(testId);
            }

            // Инициализируем интерфейс
            initTestInterface();

            // Загружаем первый вопрос
            await loadQuestion(currentQuestionIndex);

            // Запускаем таймер
            startTimer();

            // Настраиваем обработчики событий
            setupEventHandlers();

            console.log('Тест успешно инициализирован');

        } catch (error) {
            console.error('Ошибка инициализации теста:', error);
            showError('Не удалось загрузить тест. Попробуйте еще раз.');
        }
    }

    function updateTestInfoPlaceholder() {
        const testTitleEl = document.getElementById('testTitle');
        if (testTitleEl) testTitleEl.textContent = 'Загрузка теста...';
    }

    async function loadCurrentUser() {
        try {
            console.log('Загрузка данных пользователя...');

            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            console.log('Статус ответа пользователя:', response.status);

            if (response.ok) {
                currentUser = await response.json();
                console.log('Текущий пользователь:', currentUser);

                // Обновляем UI
                updateUserInfo();
            } else {
                console.warn('Не удалось загрузить данные пользователя');
                // Используем данные по умолчанию
                currentUser = { name: 'Пользователь', email: 'user@example.com' };
                updateUserInfo();
            }

        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            currentUser = { name: 'Пользователь', email: 'user@example.com' };
            updateUserInfo();
        }
    }

    function updateUserInfo() {
        console.log('Обновление UI пользователя:', currentUser);

        if (!currentUser) return;

        // Определяем имя для отображения
        let displayName = currentUser.name || 'Пользователь';

        // Если имя слишком длинное, обрезаем
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 17) + '...';
        }

        // Обновляем имя пользователя
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = displayName;
        });

        // Обновляем аватар
        const avatarElements = document.querySelectorAll('.user-avatar img');
        avatarElements.forEach(img => {
            // Берем первую букву имени для аватара
            const firstLetter = displayName.charAt(0).toUpperCase();
            img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=3498db&color=fff`;
            img.alt = displayName;
        });

        console.log('Имя пользователя обновлено:', displayName);
    }

    async function loadTest(testId) {
        try {
            showLoading(true);

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
            currentQuestions = currentTest.questions || [];

            console.log('Тест загружен:', currentTest);
            console.log('Вопросов:', currentQuestions.length);

            timeRemaining = (currentTest.timeLimitMinutes || 30) * 60;
            updateTestInfo();

        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            throw error;
        } finally {
            showLoading(false);
        }
    }

    function updateTestInfo() {
        console.log('Обновление информации о тесте');

        if (!currentTest) return;

        // Заголовок теста
        const testTitleEl = document.getElementById('testTitle');
        if (testTitleEl && currentTest.title) {
            testTitleEl.textContent = currentTest.title;
        }

        // Описание теста
        const testDescriptionEl = document.getElementById('testDescription');
        if (testDescriptionEl && currentTest.description) {
            testDescriptionEl.textContent = currentTest.description;
        }

        // Информация на боковой панели
        const infoTotalQuestionsEl = document.getElementById('infoTotalQuestions');
        if (infoTotalQuestionsEl) {
            infoTotalQuestionsEl.textContent = currentQuestions.length;
        }

        const infoTimeLimitEl = document.getElementById('infoTimeLimit');
        if (infoTimeLimitEl) {
            infoTimeLimitEl.textContent = `${currentTest.timeLimitMinutes || 30} мин`;
        }

        console.log('Информация о тесте обновлена');
    }

    async function createUserTestAttempt(testId) {
        console.log(`Создание попытки для теста ${testId}`);

        try {
            const response = await fetch(`${USER_TEST_API_URL}/${testId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Ответ создания попытки:', response.status);

            if (!response.ok) {
                throw new Error(`Не удалось создать попытку: ${response.status}`);
            }

            const attempt = await response.json();
            userTestAttemptId = attempt.id;
            testStartTime = new Date();

            console.log('Попытка создана:', attempt);

        } catch (error) {
            console.error('Ошибка создания попытки:', error);
            throw error;
        }
    }

    async function loadUserTestAttempt(attemptId) {
        console.log(`Загрузка попытки ${attemptId}`);

        try {
            const response = await fetch(`${USER_TEST_API_URL}/${attemptId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Ответ загрузки попытки:', response.status);

            if (!response.ok) {
                throw new Error(`Не удалось загрузить попытку: ${response.status}`);
            }

            const attempt = await response.json();
            userTestAttemptId = attempt.id;
            testStartTime = attempt.startedAt ? new Date(attempt.startedAt) : new Date();

            console.log('Попытка загружена:', attempt);

            // Загружаем сохраненные ответы
            if (attempt.answers) {
                attempt.answers.forEach(answer => {
                    userAnswers.set(answer.questionDTO.id, {
                        selectedAnswerIndex: answer.selectedAnswerIndex,
                        locked: true
                    });
                });
            }

            if (attempt.completedAt) {
                testCompleted = true;
                showCompletionScreen();
            }

        } catch (error) {
            console.error('Ошибка загрузки попытки:', error);
            throw error;
        }
    }

    function initTestInterface() {
        // Создаем навигацию по вопросам
        createQuestionsNavigation();

        // Обновляем статистику
        updateProgressStats();

        // Показываем основной контейнер
        const questionContainer = document.getElementById('questionContainer');
        if (questionContainer) {
            questionContainer.style.display = 'block';
        }

        // Настройка адаптивности
        window.addEventListener('resize', updateQuestionsNavLayout);
        updateQuestionsNavLayout();
    }

    function createQuestionsNavigation() {
        const navContainer = document.getElementById('questionsNav');
        if (!navContainer) return;

        navContainer.innerHTML = '';

        currentQuestions.forEach((question, index) => {
            const navItem = document.createElement('div');
            navItem.className = 'question-nav-item';
            navItem.dataset.questionIndex = index;
            navItem.textContent = index + 1;

            updateNavItemClass(navItem, index);

            navItem.addEventListener('click', () => {
                if (!isTestPaused && !testCompleted) {
                    goToQuestion(index);
                }
            });

            navContainer.appendChild(navItem);
        });
    }

    function updateNavItemClass(navItem, questionIndex) {
        navItem.classList.remove('current', 'answered', 'unanswered');

        if (questionIndex === currentQuestionIndex) {
            navItem.classList.add('current');
        } else if (userAnswers.has(currentQuestions[questionIndex].id)) {
            navItem.classList.add('answered');
        } else {
            navItem.classList.add('unanswered');
        }
    }

    function updateQuestionsNavLayout() {
        const navContainer = document.getElementById('questionsNav');
        if (!navContainer) return;

        const containerWidth = navContainer.clientWidth;
        const itemsPerRow = Math.floor(containerWidth / 50);
        navContainer.style.gridTemplateColumns = `repeat(${Math.max(5, itemsPerRow)}, 1fr)`;
    }

    async function loadQuestion(questionIndex) {
        if (questionIndex < 0 || questionIndex >= currentQuestions.length) {
            return;
        }

        const question = currentQuestions[questionIndex];
        currentQuestionIndex = questionIndex;

        // Обновляем номер вопроса
        const currentQuestionNumberEl = document.getElementById('currentQuestionNumber');
        if (currentQuestionNumberEl) currentQuestionNumberEl.textContent = questionIndex + 1;

        const totalQuestionNumberEl = document.getElementById('totalQuestionNumber');
        if (totalQuestionNumberEl) totalQuestionNumberEl.textContent = `/ ${currentQuestions.length}`;

        // Обновляем текст вопроса
        const questionTextEl = document.getElementById('questionText');
        if (questionTextEl) questionTextEl.textContent = question.question;

        // Обновляем категорию вопроса
        const categoryText = getCategoryText(question.type);
        const questionCategoryEl = document.getElementById('questionCategory');
        if (questionCategoryEl) questionCategoryEl.textContent = categoryText;

        // Создаем варианты ответов
        createAnswerOptions(question);

        // Обновляем состояние кнопок
        updateNavigationButtons();

        // Обновляем навигацию
        updateQuestionsNavigation();
    }

    function getCategoryText(type) {
        const categories = {
            'THINKING': 'Цифровое мышление',
            'AFFILIATION': 'Цифровая аффилиация',
            'FLEXIBILITY': 'Цифровая гибкость',
            'EXPERIENCE': 'Цифровой опыт'
        };
        return categories[type] || type || 'Общая категория';
    }

    function createAnswerOptions(question) {
        const container = document.getElementById('answersContainer');
        if (!container) return;

        container.innerHTML = '';

        const savedAnswer = userAnswers.get(question.id);
        const isLocked = savedAnswer ? savedAnswer.locked : false;

        question.answers.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-option';

            if (savedAnswer && savedAnswer.selectedAnswerIndex === index) {
                answerElement.classList.add('selected');
            }

            const letter = String.fromCharCode(65 + index);

            answerElement.innerHTML = `
                <div class="answer-letter">${letter}</div>
                <div class="answer-text">${escapeHtml(answer)}</div>
                <div class="answer-check">
                    <i class="fas fa-check"></i>
                </div>
            `;

            if (isLocked) {
                answerElement.style.cursor = 'not-allowed';
                answerElement.style.pointerEvents = 'none';
                answerElement.style.opacity = '0.7';
            } else {
                let isProcessing = false;

                answerElement.addEventListener('click', () => {
                    if (isProcessing || isTestPaused || testCompleted) {
                        return;
                    }

                    isProcessing = true;

                    const allAnswers = container.querySelectorAll('.answer-option');
                    allAnswers.forEach(opt => {
                        opt.style.pointerEvents = 'none';
                    });

                    selectAnswer(question.id, index).finally(() => {
                        setTimeout(() => {
                            isProcessing = false;
                        }, 500);
                    });
                });
            }

            container.appendChild(answerElement);
        });
    }

    async function selectAnswer(questionId, answerIndex) {
        const question = currentQuestions.find(q => q.id === questionId);
        if (!question) return;

        // Проверяем, не заблокирован ли уже ответ
        const existingAnswer = userAnswers.get(questionId);
        if (existingAnswer && existingAnswer.locked) {
            console.log('Ответ уже заблокирован');
            return;
        }

        // Блокируем интерфейс
        userAnswers.set(questionId, {
            selectedAnswerIndex: answerIndex,
            locked: true
        });

        // Обновляем UI
        updateAnswerDisplay(questionId, answerIndex);
        updateQuestionsNavigation();
        updateProgressStats();

        // Отправляем на сервер
        try {
            await saveAnswerToServer(questionId, answerIndex);
            console.log('Ответ сохранен');
        } catch (error) {
            console.error('Ошибка сохранения ответа:', error);

            // Разблокируем при ошибке
            userAnswers.delete(questionId);
            updateAnswerDisplay(questionId, null);
            updateQuestionsNavigation();
            updateProgressStats();

            // Восстанавливаем кликабельность
            const container = document.getElementById('answersContainer');
            if (container) {
                const answerOptions = container.querySelectorAll('.answer-option');
                answerOptions.forEach(option => {
                    option.style.pointerEvents = 'auto';
                });
            }

            alert('Не удалось сохранить ответ. Попробуйте еще раз.');
        }
    }

    function updateAnswerDisplay(questionId, answerIndex) {
        const container = document.getElementById('answersContainer');
        if (!container) return;

        const answerOptions = container.querySelectorAll('.answer-option');
        const isLocked = userAnswers.get(questionId)?.locked || false;

        answerOptions.forEach(option => {
            option.classList.remove('selected', 'locked');
            option.style.opacity = '1';
            option.style.cursor = 'pointer';
            option.style.pointerEvents = 'auto';
        });

        if (answerIndex !== null && answerOptions[answerIndex]) {
            answerOptions[answerIndex].classList.add('selected');

            if (isLocked) {
                answerOptions.forEach(option => {
                    option.classList.add('locked');
                    option.style.cursor = 'not-allowed';
                    option.style.pointerEvents = 'none';
                    option.style.opacity = '0.7';
                });
            }
        }
    }

    async function goToQuestion(index) {
        if (index < 0 || index >= currentQuestions.length) {
            return;
        }
        await loadQuestion(index);
    }

    async function saveAnswerToServer(questionId, answerIndex) {
        if (!userTestAttemptId) {
            throw new Error('ID попытки теста отсутствует');
        }

        const payload = {
            userTestId: userTestAttemptId,
            questionId: questionId,
            selectedAnswerIndex: answerIndex
        };

        console.log('Отправка ответа:', payload);

        try {
            const response = await fetch(USER_ANSWER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Ответ от сервера:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Ошибка сохранения ответа:', error);
            throw error;
        }
    }

    function updateQuestionsNavigation() {
        const navItems = document.querySelectorAll('.question-nav-item');
        navItems.forEach((item, index) => {
            updateNavItemClass(item, index);
        });
    }

    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');

        if (prevBtn) {
            prevBtn.disabled = currentQuestionIndex === 0;
        }

        if (nextBtn) {
            if (currentQuestionIndex === currentQuestions.length - 1) {
                nextBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Завершить тест';
                nextBtn.classList.remove('btn-primary');
                nextBtn.classList.add('btn-secondary');
            } else {
                nextBtn.innerHTML = 'Следующий вопрос <i class="fas fa-arrow-right"></i>';
                nextBtn.classList.remove('btn-secondary');
                nextBtn.classList.add('btn-primary');
            }
        }
    }

    function updateProgressStats() {
        const total = currentQuestions.length;
        const answered = userAnswers.size;
        const remaining = total - answered;

        const answeredCountEl = document.getElementById('answeredCount');
        if (answeredCountEl) answeredCountEl.textContent = answered;

        const remainingCountEl = document.getElementById('remainingCount');
        if (remainingCountEl) remainingCountEl.textContent = remaining;

        const totalCountEl = document.getElementById('totalCount');
        if (totalCountEl) totalCountEl.textContent = total;

        // Процент выполнения
        const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
        const progressFillEl = document.getElementById('progressFill');
        if (progressFillEl) progressFillEl.style.width = `${percent}%`;

        const progressPercentEl = document.getElementById('progressPercent');
        if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    }

    function startTimer() {
        if (testTimer) {
            clearInterval(testTimer);
        }

        testTimer = setInterval(() => {
            if (!isTestPaused && !testCompleted) {
                timeRemaining--;
                updateTimerDisplay();

                if (timeRemaining <= 0) {
                    timeRemaining = 0;
                    clearInterval(testTimer);
                    autoFinishTest();
                }

                if (timeRemaining === 300) {
                    showTimeWarning('Осталось 5 минут!');
                } else if (timeRemaining === 60) {
                    showTimeWarning('Осталось 1 минута!');
                }
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const timeDisplayEl = document.getElementById('timeDisplay');
        if (timeDisplayEl) {
            timeDisplayEl.textContent = timeString;
        }

        const timerElement = document.getElementById('timer');
        if (timerElement) {
            if (timeRemaining <= 300) {
                timerElement.style.color = '#e74c3c';
            } else if (timeRemaining <= 600) {
                timerElement.style.color = '#f39c12';
            } else {
                timerElement.style.color = 'white';
            }
        }
    }

    function showTimeWarning(message) {
        const notification = document.createElement('div');
        notification.className = 'time-warning';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f39c12;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);

        if (!document.querySelector('#timeWarningStyles')) {
            const style = document.createElement('style');
            style.id = 'timeWarningStyles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function setupEventHandlers() {
        const prevQuestionBtn = document.getElementById('prevQuestionBtn');
        if (prevQuestionBtn) {
            prevQuestionBtn.addEventListener('click', () => {
                if (!isTestPaused && !testCompleted) {
                    goToQuestion(currentQuestionIndex - 1);
                }
            });
        }

        const nextQuestionBtn = document.getElementById('nextQuestionBtn');
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', () => {
                if (!isTestPaused && !testCompleted) {
                    if (currentQuestionIndex === currentQuestions.length - 1) {
                        showFinishConfirmation();
                    } else {
                        goToQuestion(currentQuestionIndex + 1);
                    }
                }
            });
        }

        const pauseTestBtn = document.getElementById('pauseTestBtn');
        if (pauseTestBtn) {
            pauseTestBtn.addEventListener('click', () => {
                togglePauseTest();
            });
        }

        const finishTestBtn = document.getElementById('finishTestBtn');
        if (finishTestBtn) {
            finishTestBtn.addEventListener('click', () => {
                if (!testCompleted) {
                    showFinishConfirmation();
                }
            });
        }

        const finishTestFinalBtn = document.getElementById('finishTestFinalBtn');
        if (finishTestFinalBtn) {
            finishTestFinalBtn.addEventListener('click', () => {
                finishTest();
            });
        }

        const resumeTestBtn = document.getElementById('resumeTestBtn');
        if (resumeTestBtn) {
            resumeTestBtn.addEventListener('click', () => {
                resumeTest();
            });
        }

        const exitTestBtn = document.getElementById('exitTestBtn');
        if (exitTestBtn) {
            exitTestBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите выйти из теста? Прогресс будет сохранен.')) {
                    window.location.href = '/dashboard';
                }
            });
        }

        const testInstructionsBtn = document.getElementById('testInstructionsBtn');
        if (testInstructionsBtn) {
            testInstructionsBtn.addEventListener('click', () => {
                showInstructionsModal();
            });
        }

        const testFullscreenBtn = document.getElementById('testFullscreenBtn');
        if (testFullscreenBtn) {
            testFullscreenBtn.addEventListener('click', () => {
                toggleFullscreen();
            });
        }

        setupModalHandlers();
        setupBeforeUnloadHandler();
    }

    function setupModalHandlers() {
        const instructionsModal = document.getElementById('instructionsModal');
        const instructionsClose = document.getElementById('instructionsClose');
        const understandBtn = document.getElementById('understandBtn');

        if (instructionsClose) {
            instructionsClose.addEventListener('click', () => {
                if (instructionsModal) instructionsModal.style.display = 'none';
            });
        }

        if (understandBtn) {
            understandBtn.addEventListener('click', () => {
                if (instructionsModal) instructionsModal.style.display = 'none';
            });
        }

        const confirmModal = document.getElementById('confirmFinishModal');
        const confirmClose = document.getElementById('confirmFinishClose');
        const cancelBtn = document.getElementById('cancelFinishBtn');
        const confirmBtn = document.getElementById('confirmFinishBtn');

        if (confirmClose) {
            confirmClose.addEventListener('click', () => {
                if (confirmModal) confirmModal.style.display = 'none';
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirmModal) confirmModal.style.display = 'none';
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (confirmModal) confirmModal.style.display = 'none';
                finishTest();
            });
        }
    }

    function showInstructionsModal() {
        const modal = document.getElementById('instructionsModal');
        if (modal) modal.style.display = 'flex';
    }

    function showFinishConfirmation() {
        const modal = document.getElementById('confirmFinishModal');
        if (!modal) return;

        const finishAnsweredEl = document.getElementById('finishAnswered');
        if (finishAnsweredEl) finishAnsweredEl.textContent = userAnswers.size;

        const finishTimeLeftEl = document.getElementById('finishTimeLeft');
        if (finishTimeLeftEl) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            finishTimeLeftEl.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        modal.style.display = 'flex';
    }

    function togglePauseTest() {
        if (testCompleted) return;

        if (isTestPaused) {
            resumeTest();
        } else {
            pauseTest();
        }
    }

    function pauseTest() {
        isTestPaused = true;

        const pauseTestBtn = document.getElementById('pauseTestBtn');
        if (pauseTestBtn) {
            pauseTestBtn.innerHTML = '<i class="fas fa-play"></i> Продолжить';
            pauseTestBtn.classList.remove('btn-outline');
            pauseTestBtn.classList.add('btn-primary');
        }

        const questionContainer = document.getElementById('questionContainer');
        if (questionContainer) questionContainer.style.display = 'none';

        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) {
            pauseScreen.style.display = 'block';

            const elapsedSeconds = (currentTest.timeLimitMinutes * 60) - timeRemaining;
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);
            const elapsedSecs = elapsedSeconds % 60;

            const pauseTimeElapsedEl = document.getElementById('pauseTimeElapsed');
            if (pauseTimeElapsedEl) {
                pauseTimeElapsedEl.textContent =
                    `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSecs.toString().padStart(2, '0')}`;
            }

            const pauseAnsweredEl = document.getElementById('pauseAnswered');
            if (pauseAnsweredEl) pauseAnsweredEl.textContent = userAnswers.size;
        }
    }

    function resumeTest() {
        isTestPaused = false;

        const pauseTestBtn = document.getElementById('pauseTestBtn');
        if (pauseTestBtn) {
            pauseTestBtn.innerHTML = '<i class="fas fa-pause"></i> Пауза';
            pauseTestBtn.classList.remove('btn-primary');
            pauseTestBtn.classList.add('btn-outline');
        }

        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) pauseScreen.style.display = 'none';

        const questionContainer = document.getElementById('questionContainer');
        if (questionContainer) questionContainer.style.display = 'block';
    }

    async function autoFinishTest() {
        if (testCompleted) return;

        showTimeWarning('Время истекло! Тест завершается автоматически.');

        setTimeout(() => {
            finishTest();
        }, 3000);
    }

    async function finishTest() {
        if (testCompleted) return;

        try {
            await completeTestOnServer();
            testCompleted = true;
            isTestPaused = false;

            if (testTimer) {
                clearInterval(testTimer);
                testTimer = null;
            }

            redirectToResults();

        } catch (error) {
            console.error('Ошибка завершения теста:', error);
            alert('Ошибка при завершении теста. Попробуйте еще раз.');
        }
    }

    async function completeTestOnServer() {
        if (!userTestAttemptId) {
            throw new Error('ID попытки теста отсутствует');
        }

        try {
            const response = await fetch(`${USER_TEST_API_URL}/${userTestAttemptId}/completed`, {
                method: 'POST',
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
            console.error('Ошибка завершения теста на сервере:', error);
            throw error;
        }
    }

    function redirectToResults() {
        const resultUrl = `/result?attemptId=${userTestAttemptId}`;
        window.location.href = resultUrl;
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Ошибка при переходе в полноэкранный режим: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    function setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', (e) => {
            if (!testCompleted && userAnswers.size > 0) {
                e.preventDefault();
                e.returnValue = 'Вы уверены, что хотите покинуть страницу? Ваши ответы могут быть не сохранены.';
                return e.returnValue;
            }
        });
    }

    function showLoading(show) {
        const loadingScreen = document.getElementById('loadingScreen');
        const questionContainer = document.getElementById('questionContainer');

        if (loadingScreen) {
            loadingScreen.style.display = show ? 'flex' : 'none';
        }

        if (questionContainer) {
            questionContainer.style.display = show ? 'none' : 'block';
        }
    }

    function showError(message) {
        const testContent = document.querySelector('.test-content');
        if (!testContent) return;

        testContent.innerHTML = `
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Клавиатурные сокращения
    document.addEventListener('keydown', (e) => {
        if (isTestPaused || testCompleted) return;

        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentQuestionIndex > 0) {
                goToQuestion(currentQuestionIndex - 1);
            }
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentQuestionIndex < currentQuestions.length - 1) {
                goToQuestion(currentQuestionIndex + 1);
            } else {
                showFinishConfirmation();
            }
        }

        if (e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const answerIndex = parseInt(e.key) - 1;
            const currentQuestion = currentQuestions[currentQuestionIndex];
            if (currentQuestion && answerIndex < currentQuestion.answers.length) {
                selectAnswer(currentQuestion.id, answerIndex);
            }
        }

        if (e.key >= 'a' && e.key <= 'd') {
            e.preventDefault();
            const answerIndex = e.key.charCodeAt(0) - 97;
            const currentQuestion = currentQuestions[currentQuestionIndex];
            if (currentQuestion && answerIndex < currentQuestion.answers.length) {
                selectAnswer(currentQuestion.id, answerIndex);
            }
        }

        if (e.key === ' ') {
            e.preventDefault();
            togglePauseTest();
        }
    });

    // Обработчик изменения видимости страницы
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !testCompleted && !isTestPaused) {
            pauseTest();
        }
    });

    console.log('TestForm.js инициализирован');
});