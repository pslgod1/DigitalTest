document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница всех тестов загружена');

    const API_BASE_URL = window.location.origin + '/api';
    const TESTS_API_URL = `${API_BASE_URL}/tests`;
    const ADMIN_TESTS_API_URL = `${API_BASE_URL}/admin/tests`;

    let currentUser = null;
    let testsToDelete = null;

    initAdminTestsPage();

    function initAdminTestsPage() {
        console.log('Инициализация страницы всех тестов...');

        loadCurrentUser();
        loadTests();
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

    async function loadTests() {
        try {
            console.log('Загрузка списка тестов...');
            showLoading(true);

            const response = await fetch(TESTS_API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const tests = await response.json();
                console.log('Загружено тестов:', tests.length);
                displayTests(tests);
            } else {
                console.error('Ошибка загрузки тестов:', response.status);
                showError('Не удалось загрузить список тестов');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            showError('Ошибка сети при загрузке тестов');
        } finally {
            showLoading(false);
        }
    }

    function displayTests(tests) {
        const testsGrid = document.getElementById('testsGrid');
        const noTestsMessage = document.getElementById('noTestsMessage');
        const testsCount = document.getElementById('testsCount');

        if (!testsGrid || !noTestsMessage || !testsCount) return;

        testsGrid.innerHTML = '';
        testsCount.textContent = tests.length;

        if (tests.length === 0) {
            noTestsMessage.style.display = 'block';
            return;
        }

        noTestsMessage.style.display = 'none';

        tests.forEach(test => {
            const testCard = createTestCard(test);
            testsGrid.appendChild(testCard);
        });

        document.getElementById('testsContainer').style.display = 'block';
    }

    function createTestCard(test) {
        const testCard = document.createElement('div');
        testCard.className = 'test-card';

        const questionsCount = test.questions ? test.questions.length : 0;
        const timeLimit = test.timeLimitMinutes || 30;
        const createdDate = formatDate(test.createAt);
        const authorName = test.admin ? escapeHtml(test.admin.name) : 'Администратор';

        const categoryStats = calculateCategoryStats(test);

        testCard.innerHTML = `
            <div class="test-card-header">
                <h3>${escapeHtml(test.title)}</h3>
                ${test.description ? `<p class="test-description">${escapeHtml(test.description)}</p>` : ''}
            </div>
            
            <div class="test-card-content">
                <div class="test-info">
                    <div class="info-item">
                        <i class="fas fa-question-circle"></i>
                        <span>Вопросов: <strong>${questionsCount}</strong></span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>Время: <strong>${timeLimit} мин</strong></span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Создан: <strong>${createdDate}</strong></span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user-tie"></i>
                        <span>Автор: <strong>${authorName}</strong></span>
                    </div>
                </div>

                ${categoryStats ? `
                <div class="category-stats">
                    ${categoryStats}
                </div>
                ` : ''}

                <div class="test-card-actions">
                    <a href="/adminResult?testId=${test.id}" class="btn btn-primary" title="Результаты пользователей">
                        <i class="fas fa-users"></i>
                        Пользователи
                    </a>
                    <button class="btn btn-danger delete-test-btn" data-test-id="${test.id}" data-test-title="${escapeHtml(test.title)}" title="Удалить тест">
                        <i class="fas fa-trash-alt"></i>
                        Удалить
                    </button>
                </div>
            </div>
        `;

        return testCard;
    }

    function calculateCategoryStats(test) {
        if (!test.questions || test.questions.length === 0) return '';

        const categories = {
            'THINKING': {
                name: 'Мышление',
                count: 0,
                color: '#3498db',
                icon: 'fas fa-brain'
            },
            'AFFILIATION': {
                name: 'Аффилиация',
                count: 0,
                color: '#2ecc71',
                icon: 'fas fa-handshake'

            },
            'FLEXIBILITY': {
                name: 'Гибкость',
                count: 0,
                color: '#f39c12',
                icon: 'fas fa-sync-alt'
            },
            'EXPERIENCE': {
                name: 'Опыт',
                count: 0,
                color: '#e74c3c',
                icon: 'fas fa-graduation-cap'
            }
        };

        test.questions.forEach(question => {
            if (question.type && categories[question.type]) {
                categories[question.type].count++;
            }
        });

        let statsHtml = '<div class="category-tags">';
        for (const [key, category] of Object.entries(categories)) {
            if (category.count > 0) {
                statsHtml += `
                    <div class="category-tag" style="background-color: ${category.color}20; color: ${category.color}; border: 2px solid ${category.color}40;">
                        <i class="${category.icon}"></i>
                        <span><strong>${category.name}:</strong> ${category.count}</span>
                    </div>
                `;
            }
        }
        statsHtml += '</div>';

        return statsHtml;
    }

    function setupEventHandlers() {
        // Обработчики кнопок удаления
        document.addEventListener('click', function(e) {
            if (e.target.closest('.delete-test-btn')) {
                const btn = e.target.closest('.delete-test-btn');
                const testId = btn.dataset.testId;
                const testTitle = btn.dataset.testTitle;
                showDeleteConfirmation(testId, testTitle);
            }
        });

        // Модальное окно удаления
        const deleteModal = document.getElementById('deleteModal');
        const closeDeleteModal = document.getElementById('closeDeleteModal');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');

        if (closeDeleteModal) {
            closeDeleteModal.addEventListener('click', () => {
                if (deleteModal) deleteModal.style.display = 'none';
            });
        }

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => {
                if (deleteModal) deleteModal.style.display = 'none';
            });
        }

        if (confirmDelete) {
            confirmDelete.addEventListener('click', async () => {
                if (testsToDelete) {
                    await deleteTest(testsToDelete.id);
                    if (deleteModal) deleteModal.style.display = 'none';
                }
            });
        }

        // Клик вне модального окна
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    deleteModal.style.display = 'none';
                }
            });
        }

        // Обновление по F5
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                loadTests();
            }
        });
    }

    function showDeleteConfirmation(testId, testTitle) {
        testsToDelete = { id: testId, title: testTitle };

        const deleteModal = document.getElementById('deleteModal');
        const testToDeleteTitle = document.getElementById('testToDeleteTitle');

        if (deleteModal && testToDeleteTitle) {
            testToDeleteTitle.textContent = testTitle;
            deleteModal.style.display = 'flex';
        }
    }

    async function deleteTest(testId) {
        try {
            console.log(`Удаление теста ${testId}...`);

            const response = await fetch(`${ADMIN_TESTS_API_URL}/${testId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('Тест успешно удален');
                showSuccess('Тест успешно удален');
                loadTests();
            } else {
                console.error('Ошибка удаления теста:', response.status);
                showError('Не удалось удалить тест');
            }
        } catch (error) {
            console.error('Ошибка сети при удалении теста:', error);
            showError('Ошибка сети при удалении теста');
        }
    }

    function showLoading(show) {
        const loading = document.getElementById('loading');
        const testsContainer = document.getElementById('testsContainer');

        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
        if (testsContainer) {
            testsContainer.style.display = show ? 'none' : 'block';
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

    function formatDate(dateString) {
        if (!dateString) return 'Нет данных';

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

    console.log('AdminTests.js инициализирован');
});