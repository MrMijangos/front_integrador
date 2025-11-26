import authService from '../../services/auth-service.js';

export function getUserSidebarHTML() {
    // Suponiendo que el usuario es administrador
    const isAdmin = authService.isAuthenticated() && JSON.parse(localStorage.getItem('usuario'))?.rol?.toUpperCase() === 'ADMIN';

    return `
        <div class="user-sidebar" id="userSidebar">
            <div class="user-sidebar-header">
                <div class="user-info">
                    <div class="user-avatar">
                        <img src="../../images/perfil.png" alt="Usuario">
                    </div>
                    <h3 class="user-name" id="userName">CARGANDO...</h3>
                </div>
                <button class="user-close-btn" id="closeUserBtn">✕</button>
            </div>

            <nav class="user-menu">
                <button class="user-menu-item active" data-section="orders">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                    <span>${isAdmin ? 'ADMINISTRAR PEDIDOS' : 'VER PEDIDOS'}</span>
                </button>

                ${isAdmin ? `
                <button class="user-menu-item" data-section="reviews">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <path d="M14 10l-2 2-4-4"></path>
                    </svg>
                    <span>VER TODAS LAS RESEÑAS</span>
                </button>
                ` : ''}

                <button class="user-menu-item" data-section="payment">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span>MÉTODOS DE PAGO</span>
                </button>

                <button class="user-menu-item" data-section="addresses">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>DIRECCIONES DE ENVÍO</span>
                </button>

                <button class="user-menu-item logout-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>CERRAR SESIÓN</span>
                </button>
            </nav>
        </div>

        <div class="user-overlay" id="userOverlay"></div>
    `;
}

export function injectUserSidebar() {
    const sidebarHTML = getUserSidebarHTML();
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
}

export class UserSidebar {
    constructor() {
        this.init();
        this.loadUserData();
    }

    async loadUserData() {
        const userData = JSON.parse(localStorage.getItem('usuario'));
        if (userData) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = userData.nombre.toUpperCase();
            }
        }
    }

    init() {
        this.userButton = document.querySelector('.user-btn');
        this.userSidebar = document.getElementById('userSidebar');
        this.userOverlay = document.getElementById('userOverlay');
        this.closeUserBtn = document.getElementById('closeUserBtn');
        this.menuItems = document.querySelectorAll('.user-menu-item');

        this.userButton?.addEventListener('click', () => this.openSidebar());
        this.closeUserBtn?.addEventListener('click', () => this.closeSidebar());
        this.userOverlay?.addEventListener('click', () => this.closeSidebar());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.userSidebar?.classList.contains('active')) {
                this.closeSidebar();
            }
        });

        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });
    }

    openSidebar() {
        this.userSidebar?.classList.add('active');
        this.userOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.userSidebar?.classList.remove('active');
        this.userOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleMenuClick(e) {
        const section = e.currentTarget.dataset.section;
        this.menuItems.forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.closeSidebar();

        const userData = JSON.parse(localStorage.getItem('usuario'));
        const isAdmin = userData?.rol?.toUpperCase() === 'ADMIN';

        switch (section) {
            case 'orders':
                window.location.href = isAdmin ? '../../html/admin-shipments.html' : '../../html/orders.html';
                break;
            case 'reviews':
                window.location.href = '../../html/administrar-resenas.html';
                break;
            case 'payment':
                window.location.href = '../../html/mycards.html';
                break;
            case 'addresses':
                window.location.href = '../../html/addresses.html';
                break;
            default:
                break;
        }
        if (e.currentTarget.classList.contains('logout-btn')) {
            this.logout();
        }
    }

    async logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            await authService.logout();

            showNotification('Sesión cerrada exitosamente');

            setTimeout(() => {
                window.location.href = '../../html/login.html';
            }, 1000);
        }
    }
}

export function initUserSidebar() {
    injectUserSidebar();
    return new UserSidebar();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}