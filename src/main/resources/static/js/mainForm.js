/**
 * Main Form JavaScript
 * Проверяет авторизацию пользователя и меняет кнопку на главной странице
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Main Form загружен');

    // Проверяем авторизацию
    checkAuthStatus();

    // Настраиваем кнопку в зависимости от статуса
    setupAuthButton();

    // Настраиваем мобильное меню
    setupMobileMenu();
});

// Проверка статуса авторизации
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('Пользователь авторизован:', userData.email);
            return {
                isAuthenticated: true,
                user: userData
            };
        } else {
            console.log('Пользователь не авторизован');
            return {
                isAuthenticated: false,
                user: null
            };
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return {
            isAuthenticated: false,
            user: null
        };
    }
}

// Настройка кнопки в зависимости от статуса
async function setupAuthButton() {
    const authStatus = await checkAuthStatus();

    // Находим кнопку в хиро-секции
    const heroBtn = document.querySelector('.hero-actions .btn-primary');

    // Находим кнопку в хедере
    const headerStartBtn = document.querySelector('.nav-auth .btn-primary');
    const headerLoginBtn = document.querySelector('.nav-auth .btn-outline');

    if (authStatus.isAuthenticated) {
        // Для авторизованных пользователей
        if (heroBtn) {
            heroBtn.innerHTML = `
                <span>Личный кабинет</span>
                <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;
            heroBtn.href = '/dashboard';
        }

        if (headerStartBtn) {
            headerStartBtn.innerHTML = '<span>Личный кабинет</span>';
            headerStartBtn.href = '/dashboard';
        }

        if (headerLoginBtn) {
            headerLoginBtn.innerHTML = '<span>Выйти</span>';
            headerLoginBtn.href = '#';
            headerLoginBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                await logout();
            });
        }
    } else {
        // Для неавторизованных пользователей (значения по умолчанию)
        if (heroBtn) {
            heroBtn.innerHTML = `
                <span>Начать тестирование</span>
                <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;
            heroBtn.href = '/register';
        }

        if (headerStartBtn) {
            headerStartBtn.innerHTML = '<span>Начать тест</span>';
            headerStartBtn.href = '/register';
        }

        if (headerLoginBtn) {
            headerLoginBtn.innerHTML = '<span>Войти</span>';
            headerLoginBtn.href = '/login';
            // Удаляем обработчик выхода, если он был
            headerLoginBtn.onclick = null;
        }
    }
}

// Функция выхода
async function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            // Перезагружаем страницу для обновления состояния
            window.location.reload();
        } catch (error) {
            console.error('Ошибка при выходе:', error);
            alert('Ошибка при выходе. Попробуйте снова.');
        }
    }
}

// Настройка мобильного меню
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    const navAuth = document.querySelector('.nav-auth');

    if (mobileMenuBtn && navLinks && navAuth) {
        mobileMenuBtn.addEventListener('click', function() {
            // Создаем или находим мобильное меню
            let mobileMenu = document.querySelector('.mobile-menu');

            if (!mobileMenu) {
                // Создаем мобильное меню
                mobileMenu = document.createElement('div');
                mobileMenu.className = 'mobile-menu';
                mobileMenu.innerHTML = `
                    <div class="mobile-menu-content">
                        <div class="mobile-menu-header">
                            <button class="mobile-menu-close">&times;</button>
                        </div>
                        <div class="mobile-menu-links">
                            ${navLinks.innerHTML}
                        </div>
                        <div class="mobile-menu-auth">
                            ${navAuth.innerHTML}
                        </div>
                    </div>
                `;

                document.body.appendChild(mobileMenu);

                // Настройка кнопки закрытия
                const closeBtn = mobileMenu.querySelector('.mobile-menu-close');
                closeBtn.addEventListener('click', function() {
                    mobileMenu.remove();
                    mobileMenuBtn.classList.remove('active');
                });

                // Закрытие по клику вне меню
                mobileMenu.addEventListener('click', function(e) {
                    if (e.target === mobileMenu) {
                        mobileMenu.remove();
                        mobileMenuBtn.classList.remove('active');
                    }
                });

                // Обновляем обработчики для кнопок в мобильном меню
                setTimeout(() => {
                    setupMobileMenuButtons();
                }, 100);
            }

            // Показываем/скрываем меню
            if (mobileMenu.style.display === 'block') {
                mobileMenu.remove();
                mobileMenuBtn.classList.remove('active');
            } else {
                mobileMenu.style.display = 'block';
                mobileMenuBtn.classList.add('active');
            }
        });
    }
}

// Настройка кнопок в мобильном меню
async function setupMobileMenuButtons() {
    const authStatus = await checkAuthStatus();
    const mobileAuthBtn = document.querySelector('.mobile-menu-auth .btn-primary');
    const mobileLoginBtn = document.querySelector('.mobile-menu-auth .btn-outline');

    if (authStatus.isAuthenticated) {
        if (mobileAuthBtn) {
            mobileAuthBtn.innerHTML = '<span>Личный кабинет</span>';
            mobileAuthBtn.href = '/dashboard';
        }

        if (mobileLoginBtn) {
            mobileLoginBtn.innerHTML = '<span>Выйти</span>';
            mobileLoginBtn.href = '#';
            mobileLoginBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                await logout();
            });
        }
    }
}

// Добавляем CSS для мобильного меню
const mobileMenuStyles = `
    .mobile-menu {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .mobile-menu-content {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        padding: 20px;
        display: flex;
        flex-direction: column;
        animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    
    .mobile-menu-header {
        display: flex;
        justify-content: flex-end;
        padding: 20px 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .mobile-menu-close {
        background: none;
        border: none;
        font-size: 2rem;
        color: var(--text-dark);
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .mobile-menu-links {
        flex: 1;
        padding: 40px 0;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .mobile-menu-links .nav-link {
        font-size: 1.2rem;
        padding: 12px 0;
        color: var(--text-dark);
        border-bottom: 1px solid var(--border-color);
    }
    
    .mobile-menu-auth {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 20px 0;
        border-top: 1px solid var(--border-color);
    }
    
    .mobile-menu-auth .btn {
        width: 100%;
        justify-content: center;
    }
    
    .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px);
    }
    
    .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(6px, -6px);
    }
    
    .mobile-menu-btn span {
        transition: transform 0.3s ease, opacity 0.3s ease;
    }
`;

// Добавляем стили в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileMenuStyles;
document.head.appendChild(styleSheet);