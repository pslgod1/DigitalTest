document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница создания теста загружена');

    // Базовый URL API
    const API_BASE_URL = window.location.origin + '/api';
    const USER_API_URL = `${API_BASE_URL}/users/me`;
    const ADMIN_TESTS_API_URL = `${API_BASE_URL}/admin/tests`;

    let currentAdmin = null;

    // Инициализация
    initCreateTestPage();

    async function initCreateTestPage() {
        console.log('Инициализация страницы создания теста...');

        // Загружаем данные администратора
        await loadAdminData();

        // Настройка кнопки меню для мобильных
        setupMenuToggle();

        // Настройка кнопки выхода
        setupLogoutButton();

        // Инициализация формы создания теста
        initCreateTestForm();

        // Настройка кнопки добавления вопроса
        setupAddQuestionButton();

        // Обновление прогресса
        updateProgress();

        // Добавляем тестовый вопрос при загрузке
        setTimeout(() => {
            addNewQuestion();
        }, 100);
    }

    // Настройка кнопки меню для мобильных
    function setupMenuToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.admin-sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                console.log('Меню переключено');
            });
        }
    }

    // Настройка кнопки выхода
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
                    console.log('Выход из админ-панели...');
                    window.location.href = '/';
                }
            });
        }
    }

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

            console.log('Статус ответа администратора:', response.status);

            if (response.ok) {
                currentAdmin = await response.json();
                console.log('Данные администратора:', currentAdmin);
                updateAdminUI();
            } else {
                console.warn('Не удалось загрузить данные администратора:', response.status);
                // Используем данные по умолчанию
                currentAdmin = { name: 'Администратор', email: 'admin@example.com' };
                updateAdminUI();
            }

        } catch (error) {
            console.error('Ошибка загрузки данных администратора:', error);
            // Используем данные по умолчанию
            currentAdmin = { name: 'Администратор', email: 'admin@example.com' };
            updateAdminUI();
        }
    }

    // Обновление UI администратора
    function updateAdminUI() {
        if (!currentAdmin) return;

        const adminName = currentAdmin.name || 'Администратор';
        const adminEmail = currentAdmin.email || 'admin@example.com';

        console.log('Обновление UI администратора в CreateTest:', {
            name: adminName,
            email: adminEmail
        });

        // Обновляем элементы
        const adminNameElement = document.getElementById('adminName');
        const adminEmailElement = document.getElementById('adminEmail');

        if (adminNameElement) {
            adminNameElement.textContent = adminName;
        }

        if (adminEmailElement) {
            adminEmailElement.textContent = adminEmail;
        }

        // Обновляем аватар - ВАЖНО: добавляем timestamp чтобы избежать кэширования
        const avatarImg = document.getElementById('adminAvatar');
        if (avatarImg) {
            const nameForAvatar = adminName.replace(/\s+/g, '+');

            // Добавляем timestamp чтобы браузер не использовал кэшированное изображение
            const timestamp = new Date().getTime();
            const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=8e44ad&color=fff&size=80&t=${timestamp}`;

            console.log('Устанавливаем новый URL аватара:', newAvatarUrl);

            // Сначала ставим пустой src чтобы сбросить текущее изображение
            avatarImg.src = '';

            // Затем устанавливаем новый URL
            setTimeout(() => {
                avatarImg.src = newAvatarUrl;
                avatarImg.alt = adminName;

                // Проверяем загрузку
                avatarImg.onload = function() {
                    console.log('Аватар успешно загружен в CreateTest');
                };

                avatarImg.onerror = function() {
                    console.error('Ошибка загрузки аватара в CreateTest');
                    // Fallback на простой вариант с первой буквой
                    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName.charAt(0))}&background=8e44ad&color=fff&size=80`;
                    avatarImg.src = fallbackUrl;
                };
            }, 10);
        } else {
            console.error('Элемент adminAvatar не найден в CreateTest!');

            // Попробуем найти по другим селекторам
            const avatarSelectors = [
                '#adminAvatar',
                'img[alt*="ватар"]',
                'img[alt*="Ватар"]',
                '.avatar-img',
                '.user-avatar img',
                '.admin-avatar img'
            ];

            avatarSelectors.forEach(selector => {
                const found = document.querySelector(selector);
                if (found) {
                    console.log('Нашли аватар по селектору:', selector, found);
                }
            });
        }

        console.log('UI администратора обновлен в CreateTest');
    }

    // Инициализация формы создания теста
    function initCreateTestForm() {
        const form = document.getElementById('createTestForm');
        if (!form) return;

        const successDiv = document.getElementById('formSuccess');
        const errorDiv = document.getElementById('formError');
        const warningDiv = document.getElementById('formWarning');
        const errorText = document.getElementById('errorText');
        const successText = document.getElementById('successText');
        const publishBtn = document.getElementById('publishTestBtn');

        // Обработчик отправки формы
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            console.log('Начало отправки формы...');

            // Проверяем наличие вопросов
            const questions = document.querySelectorAll('.question-card');
            if (questions.length === 0) {
                showWarning(warningDiv, 'Добавьте хотя бы один вопрос для публикации теста');
                return;
            }

            // Собираем данные теста
            const testData = collectTestData();
            console.log('Собранные данные:', testData);

            // Проверяем валидность всех вопросов
            if (!validateAllQuestions()) {
                showError(errorDiv, errorText, 'Пожалуйста, заполните все обязательные поля в вопросах');
                return;
            }

            // Показываем загрузку
            setButtonLoading(publishBtn, true, 'Публикация...');
            hideMessages();

            try {
                // Отправляем данные на сервер
                const response = await createTestOnBackend(testData);
                console.log('Ответ сервера:', response);

                if (response.ok) {
                    const createdTest = await response.json();
                    showSuccess(successDiv, successText, 'Тест успешно опубликован!');
                    console.log('Тест создан:', createdTest);

                    // Перенаправление на страницу со списком тестов через 2 секунды
                    setTimeout(() => {
                        window.location.href = '/adminTests';
                    }, 2000);
                } else {
                    let errorMessage = 'Ошибка сервера';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || 'Неизвестная ошибка';
                        console.error('Детали ошибки:', errorData);
                    } catch (e) {
                        console.error('Не удалось распарсить ошибку:', response.status, response.statusText);
                        errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
                    }
                    showError(errorDiv, errorText, `Ошибка: ${errorMessage}`);
                }
            } catch (error) {
                console.error('Ошибка при создании теста:', error);
                showError(errorDiv, errorText, 'Ошибка сети при подключении к серверу');
            } finally {
                setButtonLoading(publishBtn, false, 'Опубликовать тест');
            }
        });

        // Отслеживание изменений для обновления прогресса
        form.addEventListener('input', function() {
            updateProgress();
        });

        // Отслеживание изменений в вопросах
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('question-text') ||
                e.target.classList.contains('answer-text') ||
                e.target.classList.contains('question-category') ||
                e.target.type === 'radio') {
                updateProgress();
                updateQuestionsCounter();
            }
        });
    }

    // Исправленная функция отправки
    async function createTestOnBackend(testData) {
        // Преобразуем данные в точный формат бэкенда
        const backendTestData = {
            title: testData.title,
            description: testData.description || '',
            timeLimitMinutes: parseInt(testData.duration) || 30,
            questions: testData.questions.map(question => {
                // Создаем List<String> для answerOptions
                const answerOptions = question.answers.map(answer => answer.text);

                // Определяем correctAnswerIndex (0-based!)
                let correctAnswerIndex = null;
                question.answers.forEach((answer, index) => {
                    if (answer.isCorrect) {
                        correctAnswerIndex = index; // 0-based индекс
                    }
                });

                // Если не нашли правильный ответ, устанавливаем первый
                if (correctAnswerIndex === null && question.answers.length > 0) {
                    correctAnswerIndex = 0;
                }

                return {
                    question: question.text, // поле называется "question", не "text"
                    answerOptions: answerOptions, // List<String>
                    correctAnswerIndex: correctAnswerIndex, // Integer
                    type: mapCategoryToType(question.category) // enum Type
                };
            })
        };

        console.log('Отправка данных на бэкенд:', JSON.stringify(backendTestData, null, 2));

        return fetch(ADMIN_TESTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(backendTestData)
        });
    }

// Убедитесь, что mapCategoryToType возвращает правильные значения enum
    function mapCategoryToType(category) {
        // Уточните у бэкенда точные значения Type enum
        const typeMap = {
            'thinking': 'THINKING',
            'affiliation': 'AFFILIATION',
            'flexibility': 'FLEXIBILITY',
            'experience': 'EXPERIENCE'
        };

        // Возможно значения другие, например:
        // 'SINGLE_CHOICE', 'MULTIPLE_CHOICE' и т.д.

        return typeMap[category] || 'THINKING';
    }

    // Настройка кнопки добавления вопроса
    function setupAddQuestionButton() {
        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (!addQuestionBtn) return;

        addQuestionBtn.addEventListener('click', function() {
            addNewQuestion();
            updateProgress();
            updateQuestionsCounter();
            hideWarning();
        });
    }

    // Добавление нового вопроса
    function addNewQuestion() {
        const template = document.getElementById('questionTemplate');
        const container = document.getElementById('questionsContainer');
        const emptyMessage = document.getElementById('emptyQuestionsMessage');

        if (!template || !container) return;

        // Скрываем сообщение о пустых вопросах
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }

        // Клонируем шаблон
        const questionClone = template.content.cloneNode(true);
        const questionCard = questionClone.querySelector('.question-card');

        // Получаем текущее количество вопросов
        const questionCount = container.querySelectorAll('.question-card').length;
        const questionIndex = questionCount + 1;

        // Обновляем номер вопроса
        questionCard.setAttribute('data-question-index', questionIndex);
        questionCard.querySelector('.question-number').textContent = `Вопрос #${questionIndex}`;

        // Обновляем name радиокнопок для уникальности
        const radioButtons = questionCard.querySelectorAll('.correct-answer-radio');
        radioButtons.forEach((radio, index) => {
            radio.name = `correct-${questionIndex}`;
            radio.value = index + 1;
        });

        // Устанавливаем первый вариант ответа как правильный по умолчанию
        if (radioButtons.length > 0) {
            radioButtons[0].checked = true;
        }

        // Настройка кнопок действий вопроса
        const moveUpBtn = questionCard.querySelector('.move-up-btn');
        const moveDownBtn = questionCard.querySelector('.move-down-btn');
        const deleteBtn = questionCard.querySelector('.delete-question-btn');
        const addAnswerBtn = questionCard.querySelector('.add-answer-btn');
        const deleteAnswerBtns = questionCard.querySelectorAll('.delete-answer-btn');
        const categorySelect = questionCard.querySelector('.question-category');
        const categoryBadge = questionCard.querySelector('.question-category-badge');

        // Кнопка перемещения вверх
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', function() {
                moveQuestionUp(questionCard);
            });
        }

        // Кнопка перемещения вниз
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', function() {
                moveQuestionDown(questionCard);
            });
        }

        // Кнопка удаления вопроса
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteQuestion(questionCard);
            });
        }

        // Кнопка добавления варианта ответа
        if (addAnswerBtn) {
            addAnswerBtn.addEventListener('click', function() {
                addAnswerToQuestion(questionCard);
            });
        }

        // Кнопки удаления вариантов ответа
        deleteAnswerBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const answerRow = this.closest('.answer-row');
                deleteAnswer(questionCard, answerRow);
            });
        });

        // Изменение категории вопроса
        if (categorySelect && categoryBadge) {
            categorySelect.addEventListener('change', function() {
                const category = this.value;
                const categoryNames = {
                    'thinking': 'Цифровое мышление',
                    'affiliation': 'Цифровая аффилиация',
                    'flexibility': 'Цифровая гибкость',
                    'experience': 'Цифровой опыт'
                };

                categoryBadge.textContent = categoryNames[category] || 'Не выбрано';
                categoryBadge.setAttribute('data-category', category);
            });

            // Устанавливаем значение по умолчанию
            categorySelect.value = 'thinking';
            categoryBadge.textContent = 'Цифровое мышление';
            categoryBadge.setAttribute('data-category', 'thinking');
        }

        // Добавляем вопрос в контейнер
        container.appendChild(questionCard);

        // Фокус на тексте вопроса
        const questionText = questionCard.querySelector('.question-text');
        if (questionText) {
            setTimeout(() => {
                questionText.focus();
                questionText.value = `Текст вопроса ${questionIndex}`;
            }, 100);
        }

        // Заполняем варианты ответов тестовыми данными
        const answerInputs = questionCard.querySelectorAll('.answer-text');
        answerInputs.forEach((input, index) => {
            input.value = `Вариант ответа ${index + 1} для вопроса ${questionIndex}`;
        });

        console.log(`Добавлен вопрос #${questionIndex}`);
    }

    // Добавление варианта ответа к вопросу
    function addAnswerToQuestion(questionCard) {
        const answersContainer = questionCard.querySelector('.answers-container');
        const answerRows = questionCard.querySelectorAll('.answer-row');

        if (!answersContainer || answerRows.length >= 6) {
            alert('Максимум 6 вариантов ответа на вопрос');
            return;
        }

        const newIndex = answerRows.length + 1;
        const questionIndex = questionCard.getAttribute('data-question-index');

        // Создаем новый вариант ответа
        const answerRow = document.createElement('div');
        answerRow.className = 'answer-row';
        answerRow.setAttribute('data-answer-index', newIndex);

        answerRow.innerHTML = `
            <div class="answer-input-wrapper">
                <div class="answer-radio">
                    <input type="radio" name="correct-${questionIndex}" value="${newIndex}" class="correct-answer-radio" required>
                </div>
                <input 
                    type="text" 
                    class="form-input answer-text"
                    placeholder="Вариант ответа ${newIndex}"
                    required
                    maxlength="500"
                >
            </div>
            <button type="button" class="btn-icon delete-answer-btn" title="Удалить вариант">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Настройка кнопки удаления
        const deleteBtn = answerRow.querySelector('.delete-answer-btn');
        deleteBtn.addEventListener('click', function() {
            deleteAnswer(questionCard, answerRow);
        });

        // Добавляем в контейнер
        answersContainer.appendChild(answerRow);

        // Заполняем тестовыми данными
        const answerText = answerRow.querySelector('.answer-text');
        if (answerText) {
            answerText.value = `Новый вариант ответа ${newIndex}`;
        }

        console.log(`Добавлен вариант ответа #${newIndex} к вопросу #${questionIndex}`);
    }

    // Удаление варианта ответа
    function deleteAnswer(questionCard, answerRow) {
        const answersContainer = questionCard.querySelector('.answers-container');
        const answerRows = questionCard.querySelectorAll('.answer-row');

        if (answerRows.length <= 2) {
            alert('Минимум 2 варианта ответа на вопрос');
            return;
        }

        if (answersContainer && answerRow) {
            answersContainer.removeChild(answerRow);

            // Перенумеровываем оставшиеся варианты
            const remainingRows = answersContainer.querySelectorAll('.answer-row');
            remainingRows.forEach((row, index) => {
                const newIndex = index + 1;
                row.setAttribute('data-answer-index', newIndex);

                // Обновляем placeholder
                const input = row.querySelector('.answer-text');
                if (input) {
                    input.placeholder = `Вариант ответа ${newIndex}`;
                }

                // Обновляем значение радиокнопки
                const radio = row.querySelector('.correct-answer-radio');
                if (radio) {
                    radio.value = newIndex;
                }
            });

            console.log('Вариант ответа удален');
        }
    }

    // Перемещение вопроса вверх
    function moveQuestionUp(questionCard) {
        const container = document.getElementById('questionsContainer');
        const questions = Array.from(container.querySelectorAll('.question-card'));
        const currentIndex = questions.indexOf(questionCard);

        if (currentIndex > 0) {
            container.insertBefore(questionCard, questions[currentIndex - 1]);
            renumberQuestions();
            console.log('Вопрос перемещен вверх');
        }
    }

    // Перемещение вопроса вниз
    function moveQuestionDown(questionCard) {
        const container = document.getElementById('questionsContainer');
        const questions = Array.from(container.querySelectorAll('.question-card'));
        const currentIndex = questions.indexOf(questionCard);

        if (currentIndex < questions.length - 1) {
            container.insertBefore(questions[currentIndex + 1], questionCard);
            renumberQuestions();
            console.log('Вопрос перемещен вниз');
        }
    }

    // Удаление вопроса
    function deleteQuestion(questionCard) {
        if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
            const container = document.getElementById('questionsContainer');
            const emptyMessage = document.getElementById('emptyQuestionsMessage');

            if (container && container.contains(questionCard)) {
                container.removeChild(questionCard);
                renumberQuestions();

                // Показываем сообщение о пустых вопросах, если это был последний вопрос
                const remainingQuestions = container.querySelectorAll('.question-card');
                if (remainingQuestions.length === 0 && emptyMessage) {
                    emptyMessage.style.display = 'block';
                }

                updateProgress();
                updateQuestionsCounter();

                console.log('Вопрос удален');
            }
        }
    }

    // Перенумерация вопросов
    function renumberQuestions() {
        const container = document.getElementById('questionsContainer');
        if (!container) return;

        const questions = container.querySelectorAll('.question-card');

        questions.forEach((question, index) => {
            const questionIndex = index + 1;
            question.setAttribute('data-question-index', questionIndex);

            const questionNumberEl = question.querySelector('.question-number');
            if (questionNumberEl) {
                questionNumberEl.textContent = `Вопрос #${questionIndex}`;
            }

            // Обновляем name радиокнопок
            const radioButtons = question.querySelectorAll('.correct-answer-radio');
            radioButtons.forEach(radio => {
                radio.name = `correct-${questionIndex}`;
            });
        });
    }

    // Сбор данных теста
    function collectTestData() {
        const testTitle = document.getElementById('testTitle').value;
        const testDescription = document.getElementById('testDescription').value;
        const testDuration = document.getElementById('testDuration').value;

        const questions = [];
        const questionCards = document.querySelectorAll('.question-card');

        questionCards.forEach((card, index) => {
            const questionText = card.querySelector('.question-text').value;
            const questionCategory = card.querySelector('.question-category').value;

            const answers = [];
            const answerRows = card.querySelectorAll('.answer-row');
            let correctAnswerIndex = null;

            answerRows.forEach((row, answerIndex) => {
                const answerText = row.querySelector('.answer-text').value;
                const isCorrect = row.querySelector('.correct-answer-radio').checked;

                answers.push({
                    text: answerText,
                    isCorrect: isCorrect
                });

                if (isCorrect) {
                    correctAnswerIndex = answerIndex;
                }
            });

            questions.push({
                order: index + 1,
                text: questionText,
                category: questionCategory,
                answers: answers,
                correctAnswerIndex: correctAnswerIndex
            });
        });

        return {
            title: testTitle || `Новый тест ${new Date().toLocaleDateString()}`,
            description: testDescription || 'Описание теста',
            duration: parseInt(testDuration) || 30,
            questions: questions,
            totalQuestions: questions.length
        };
    }

    // Проверка всех вопросов на валидность
    function validateAllQuestions() {
        const questionCards = document.querySelectorAll('.question-card');

        if (questionCards.length === 0) {
            console.log('Нет вопросов для проверки');
            return false;
        }

        for (const card of questionCards) {
            const questionText = card.querySelector('.question-text').value.trim();
            const questionCategory = card.querySelector('.question-category').value;
            const answerRows = card.querySelectorAll('.answer-row');

            console.log('Проверка вопроса:', {
                questionText,
                questionCategory,
                answerCount: answerRows.length
            });

            // Проверка текста вопроса
            if (!questionText) {
                console.log('Пустой текст вопроса');
                return false;
            }

            // Проверка категории
            if (!questionCategory) {
                console.log('Не выбрана категория');
                return false;
            }

            // Проверка вариантов ответов
            if (answerRows.length < 2) {
                console.log('Менее 2 вариантов ответа');
                return false;
            }

            let hasCorrectAnswer = false;
            let allAnswersFilled = true;

            for (const row of answerRows) {
                const answerText = row.querySelector('.answer-text').value.trim();
                const isCorrect = row.querySelector('.correct-answer-radio').checked;

                if (!answerText) {
                    allAnswersFilled = false;
                    console.log('Пустой вариант ответа');
                    break;
                }

                if (isCorrect) {
                    hasCorrectAnswer = true;
                }
            }

            if (!allAnswersFilled) {
                console.log('Не все ответы заполнены');
                return false;
            }

            if (!hasCorrectAnswer) {
                console.log('Не выбран правильный ответ');
                return false;
            }
        }

        console.log('Все вопросы валидны');
        return true;
    }

    // Обновление прогресса
    function updateProgress() {
        const progressValue = document.getElementById('progressValue');
        const progressFill = document.getElementById('progressFill');

        if (!progressValue || !progressFill) return;

        let progress = 0;
        const maxProgress = 100;

        // Базовые поля теста (30%)
        const testTitle = document.getElementById('testTitle');
        const testDuration = document.getElementById('testDuration');

        if (testTitle && testTitle.value.trim()) progress += 15;
        if (testDuration && testDuration.value) progress += 15;

        // Вопросы (70%)
        const questionCards = document.querySelectorAll('.question-card');
        if (questionCards.length > 0) {
            progress += 20; // За сам факт наличия вопросов

            // Проверяем каждый вопрос
            questionCards.forEach(card => {
                const questionText = card.querySelector('.question-text');
                const questionCategory = card.querySelector('.question-category');
                const answerRows = card.querySelectorAll('.answer-row');

                if (questionText && questionText.value.trim()) progress += 1;
                if (questionCategory && questionCategory.value) progress += 1;

                let hasCorrectAnswer = false;
                answerRows.forEach(row => {
                    const answerText = row.querySelector('.answer-text');
                    const isCorrect = row.querySelector('.correct-answer-radio').checked;

                    if (answerText && answerText.value.trim()) progress += 0.5;
                    if (isCorrect) hasCorrectAnswer = true;
                });

                if (hasCorrectAnswer) progress += 1;
            });
        }

        // Ограничиваем прогресс
        progress = Math.min(progress, maxProgress);

        progressValue.textContent = `${Math.round(progress)}%`;
        progressFill.style.width = `${progress}%`;
    }

    // Обновление счетчика вопросов
    function updateQuestionsCounter() {
        const counter = document.getElementById('questionsCounter');
        if (!counter) return;

        const questionCount = document.querySelectorAll('.question-card').length;
        counter.textContent = `(${questionCount} ${getRussianWord(questionCount, 'вопрос', 'вопроса', 'вопросов')})`;
    }

    // Получение правильной формы слова
    function getRussianWord(number, one, two, five) {
        number = Math.abs(number);
        number %= 100;

        if (number >= 5 && number <= 20) {
            return five;
        }

        number %= 10;

        if (number === 1) {
            return one;
        }

        if (number >= 2 && number <= 4) {
            return two;
        }

        return five;
    }

    // Вспомогательные функции
    function showWarning(element, message) {
        if (!element) return;

        const span = element.querySelector('span');
        if (span) span.textContent = message;
        element.style.display = 'flex';
    }

    function hideWarning() {
        const warningDiv = document.getElementById('formWarning');
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
    }

    function showSuccess(element, textElement, message) {
        if (!element || !textElement) return;

        textElement.textContent = message;
        element.style.display = 'flex';

        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    function showError(element, textElement, message) {
        if (!element || !textElement) return;

        textElement.textContent = message;
        element.style.display = 'flex';
    }

    function hideMessages() {
        const successDiv = document.getElementById('formSuccess');
        const errorDiv = document.getElementById('formError');
        const warningDiv = document.getElementById('formWarning');

        if (successDiv) successDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';
        if (warningDiv) warningDiv.style.display = 'none';
    }

    function setButtonLoading(button, isLoading, loadingText = 'Загрузка...') {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-check-circle"></i> Опубликовать тест';
        }
    }

    // AJAX функция для получения всех тестов (пример использования)
    async function fetchAllTests() {
        try {
            const response = await fetch(ADMIN_TESTS_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const tests = await response.json();
                console.log('Получены все тесты:', tests);
                return tests;
            } else {
                console.error('Ошибка при получении тестов:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            return [];
        }
    }

    // AJAX функция для удаления теста (пример использования)
    async function deleteTest(testId) {
        try {
            const response = await fetch(`${ADMIN_TESTS_API_URL}/${testId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log(`Тест с ID ${testId} удален`);
                return true;
            } else {
                console.error(`Ошибка при удалении теста ${testId}:`, response.status);
                return false;
            }
        } catch (error) {
            console.error('Ошибка сети при удалении теста:', error);
            return false;
        }
    }

    // Экспортируем функции для отладки
    window.createTest = {
        initCreateTestPage,
        addNewQuestion,
        collectTestData,
        validateAllQuestions,
        updateProgress,
        fetchAllTests,
        deleteTest
    };

    console.log('Create test page initialized');
});