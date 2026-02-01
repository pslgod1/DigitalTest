/**
 * Обработчик для страницы ошибок errorForm.html
 */

document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);

    // Данные об ошибке
    const errorData = {
        code: urlParams.get('code') || 500,
        message: urlParams.get('message') || 'Неизвестная ошибка',
        path: urlParams.get('path') || window.location.pathname,
        timestamp: urlParams.get('timestamp') || Date.now()
    };

    // Обновляем страницу ошибки
    updateErrorPage(errorData);

    // Настраиваем кнопки
    setupButtons();

    // Настраиваем отладку
    setupDebug();
});

// Обновление информации на странице ошибки
function updateErrorPage(errorData) {
    // Элементы DOM
    const errorTitle = document.getElementById('errorTitle');
    const errorSubtitle = document.getElementById('errorSubtitle');
    const errorCodeElement = document.getElementById('errorCode');
    const errorMessageElement = document.getElementById('errorMessage');
    const errorTimeElement = document.getElementById('errorTime');
    const errorPathElement = document.getElementById('errorPath');

    // Тип ошибки по коду
    const errorType = getErrorType(errorData.code);

    // Обновляем заголовок
    if (errorTitle) {
        errorTitle.textContent = errorType;
    }

    // Обновляем подзаголовок
    if (errorSubtitle) {
        errorSubtitle.textContent = errorData.message || 'Что-то пошло не так при обработке вашего запроса';
    }

    // Обновляем детали ошибки
    if (errorCodeElement) {
        errorCodeElement.textContent = errorData.code;

        // Добавляем CSS класс в зависимости от типа ошибки
        if (errorData.code >= 400 && errorData.code < 500) {
            errorCodeElement.classList.add('error-client');
        } else if (errorData.code >= 500) {
            errorCodeElement.classList.add('error-server');
        }
    }

    if (errorMessageElement) {
        errorMessageElement.textContent = errorData.message;
    }

    if (errorPathElement) {
        errorPathElement.textContent = errorData.path;
    }

    if (errorTimeElement) {
        const date = new Date(parseInt(errorData.timestamp));
        errorTimeElement.textContent = date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Обновляем цвет иконки в зависимости от типа ошибки
    updateErrorIcon(errorData.code);
}

// Получение типа ошибки по коду
function getErrorType(code) {
    const errorTypes = {
        400: 'Неверный запрос',
        401: 'Требуется авторизация',
        403: 'Доступ запрещен',
        404: 'Страница не найдена',
        405: 'Метод не разрешен',
        408: 'Время ожидания истекло',
        413: 'Слишком большой объем данных',
        415: 'Неподдерживаемый тип данных',
        429: 'Слишком много запросов',
        500: 'Внутренняя ошибка сервера',
        502: 'Плохой шлюз',
        503: 'Сервис временно недоступен',
        504: 'Время ожидания шлюза истекло'
    };

    return errorTypes[code] || 'Произошла ошибка';
}

// Обновление иконки ошибки
function updateErrorIcon(errorCode) {
    const errorIcon = document.querySelector('.error-icon i');
    if (!errorIcon) return;

    // Убираем все классы цветов
    errorIcon.classList.remove('error-4xx', 'error-5xx', 'error-other');

    // Добавляем соответствующий класс
    if (errorCode >= 400 && errorCode < 500) {
        errorIcon.classList.add('error-4xx'); // Клиентские ошибки
    } else if (errorCode >= 500) {
        errorIcon.classList.add('error-5xx'); // Серверные ошибки
    } else {
        errorIcon.classList.add('error-other'); // Другие ошибки
    }
}

// Настройка кнопок
function setupButtons() {
    // Кнопка "Вернуться назад"
    const goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        });
    }

    // Кнопка "Обновить страницу"
    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Кнопка "На главную"
    const homeBtn = document.querySelector('a[href="/"]');
    if (homeBtn) {
        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/';
        });
    }
}

// Настройка блока отладки
function setupDebug() {
    const toggleDebugBtn = document.getElementById('toggleDebug');
    const debugContent = document.getElementById('debugContent');
    const errorStackTrace = document.getElementById('errorStackTrace');

    if (!toggleDebugBtn || !debugContent) return;

    // Переключение видимости блока отладки
    toggleDebugBtn.addEventListener('click', function() {
        const isHidden = debugContent.style.display === 'none';

        if (isHidden) {
            debugContent.style.display = 'block';
            toggleDebugBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            debugContent.style.display = 'none';
            toggleDebugBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    });

    // Заполнение стека вызовов (демо)
    if (errorStackTrace) {
        errorStackTrace.textContent = getDebugInfo();
    }
}

// Генерация отладочной информации
function getDebugInfo() {
    return `Время: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Платформа: ${navigator.platform}
Язык: ${navigator.language}
URL: ${window.location.href}
Referrer: ${document.referrer}
Cookies: ${document.cookie ? 'Да' : 'Нет'}
Локальное хранилище: ${localStorage.length > 0 ? 'Да' : 'Нет'}
Сессионное хранилище: ${sessionStorage.length > 0 ? 'Да' : 'Нет'}

Стек вызовов (демо):
Error: Тестовая ошибка
    at HTMLButtonElement.setupButtons (errorForm.js:45:21)
    at HTMLDocument.<anonymous> (errorForm.js:15:5)
    at dispatch (jquery.min.js:2:43064)
    at v.handle (jquery.min.js:2:41048)`;
}