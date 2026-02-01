/**
 * Обработчик ошибок для фронтенда
 * Перехватывает ошибки API и перенаправляет на кастомную страницу ошибок
 */

class ErrorHandler {
    constructor() {
        this.init();
    }

    // Инициализация
    init() {
        this.setupFetchInterceptor();
        this.setupXMLHttpRequestInterceptor();
        this.setupGlobalErrorHandler();
        this.setupUnhandledRejectionHandler();
    }

    // Перехватчик для fetch API
    setupFetchInterceptor() {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                // Если статус ошибки (4xx, 5xx)
                if (!response.ok) {
                    this.handleErrorResponse(response, args[0], args[1]);
                }

                return response;
            } catch (error) {
                this.handleNetworkError(error, args[0]);
                throw error;
            }
        };
    }

    // Перехватчик для XMLHttpRequest
    setupXMLHttpRequestInterceptor() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(...args) {
            this._url = args[1];
            this._method = args[0];
            return originalOpen.apply(this, args);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', () => {
                if (this.status >= 400) {
                    const errorData = {
                        status: this.status,
                        statusText: this.statusText,
                        url: this._url,
                        method: this._method
                    };
                    window.ErrorHandler.handleErrorResponse(errorData);
                }
            });

            this.addEventListener('error', (error) => {
                window.ErrorHandler.handleNetworkError(error, this._url);
            });

            return originalSend.apply(this, args);
        };
    }

    // Глобальный обработчик ошибок JavaScript
    setupGlobalErrorHandler() {
        window.onerror = (message, source, lineno, colno, error) => {
            console.error('Глобальная ошибка JavaScript:', { message, source, lineno, colno, error });

            // Не перенаправляем на страницу ошибки для JS ошибок,
            // чтобы не ломать UX
            return false;
        };
    }

    // Обработчик необработанных Promise
    setupUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Необработанный Promise:', event.reason);
            // Здесь можно логировать ошибки
        });
    }

    // Обработка ошибок ответа сервера
    handleErrorResponse(response, url, options = {}) {
        console.error('Ошибка API:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            method: options.method || 'GET'
        });

        // Если это ошибка авторизации (401), перенаправляем на логин
        if (response.status === 401) {
            this.redirectToLogin();
            return;
        }

        // Для других ошибок показываем кастомную страницу
        this.redirectToErrorPage({
            code: response.status,
            message: this.getErrorMessage(response.status),
            path: typeof url === 'string' ? url : url.url || 'Unknown'
        });
    }

    // Обработка сетевых ошибок
    handleNetworkError(error, url) {
        console.error('Сетевая ошибка:', { error, url });

        this.redirectToErrorPage({
            code: 0,
            message: 'Ошибка сети. Проверьте подключение к интернету.',
            path: url || 'Unknown'
        });
    }

    // Получение понятного сообщения об ошибке по коду
    getErrorMessage(statusCode) {
        const messages = {
            400: 'Неверный запрос. Проверьте введенные данные.',
            401: 'Требуется авторизация.',
            403: 'Доступ запрещен.',
            404: 'Страница не найдена.',
            405: 'Метод не разрешен.',
            408: 'Время ожидания истекло.',
            413: 'Слишком большой объем данных.',
            415: 'Неподдерживаемый тип данных.',
            429: 'Слишком много запросов.',
            500: 'Внутренняя ошибка сервера.',
            502: 'Плохой шлюз.',
            503: 'Сервис временно недоступен.',
            504: 'Время ожидания шлюза истекло.'
        };

        return messages[statusCode] || `Ошибка сервера (${statusCode})`;
    }

    // Перенаправление на страницу логина
    redirectToLogin() {
        // Сохраняем текущую страницу для возврата после логина
        const returnUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    }

    // Перенаправление на страницу ошибки
    redirectToErrorPage(errorData) {
        const params = new URLSearchParams({
            code: errorData.code || 500,
            message: errorData.message || 'Неизвестная ошибка',
            path: errorData.path || window.location.pathname,
            timestamp: Date.now()
        });

        // Не перенаправляем, если уже находимся на странице ошибки
        if (window.location.pathname.includes('/errorForm') ||
            window.location.pathname.includes('/error')) {
            return;
        }

        // Перенаправляем на страницу ошибки
        window.location.href = `/errorForm.html?${params.toString()}`;
    }

    // Статический метод для ручного вызова ошибки
    static showError(code, message) {
        const handler = new ErrorHandler();
        handler.redirectToErrorPage({
            code: code,
            message: message,
            path: window.location.pathname
        });
    }

    // Метод для обработки ошибок вручную
    static handleError(error) {
        console.error('Обработанная ошибка:', error);

        if (error.response) {
            // Ошибка из axios/fetch
            const handler = new ErrorHandler();
            handler.handleErrorResponse({
                status: error.response.status,
                statusText: error.response.statusText
            }, error.config?.url || 'Unknown');
        } else if (error.request) {
            // Ошибка сети
            const handler = new ErrorHandler();
            handler.handleNetworkError(error, error.config?.url || 'Unknown');
        } else {
            // Другая ошибка
            ErrorHandler.showError(500, error.message || 'Неизвестная ошибка');
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли параметры ошибки в URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('code');
    const errorMessage = urlParams.get('message');

    if (errorCode || errorMessage) {
        // Если есть параметры ошибки, обновляем страницу ошибки
        updateErrorPage(errorCode, errorMessage, urlParams.get('path'));
    }

    // Инициализируем глобальный обработчик ошибок
    window.ErrorHandler = new ErrorHandler();
});

// Функция для обновления страницы ошибки
function updateErrorPage(code, message, path) {
    // Обновляем заголовок
    const errorTitle = document.getElementById('errorTitle');
    const errorSubtitle = document.getElementById('errorSubtitle');
    const errorCodeElement = document.getElementById('errorCode');
    const errorMessageElement = document.getElementById('errorMessage');
    const errorPathElement = document.getElementById('errorPath');
    const errorTimeElement = document.getElementById('errorTime');

    if (errorTitle) {
        const errorType = getErrorType(code);
        errorTitle.textContent = errorType;
    }

    if (errorSubtitle && message) {
        errorSubtitle.textContent = message;
    }

    if (errorCodeElement && code) {
        errorCodeElement.textContent = code;
    }

    if (errorMessageElement && message) {
        errorMessageElement.textContent = message;
    }

    if (errorPathElement && path) {
        errorPathElement.textContent = path;
    }

    if (errorTimeElement) {
        const now = new Date();
        errorTimeElement.textContent = now.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
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
        429: 'Слишком много запросов',
        500: 'Внутренняя ошибка сервера',
        502: 'Плохой шлюз',
        503: 'Сервис временно недоступен',
        504: 'Время ожидания шлюза истекло'
    };

    return errorTypes[code] || 'Произошла ошибка';
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, updateErrorPage, getErrorType };
}