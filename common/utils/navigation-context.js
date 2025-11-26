// common/utils/navigation-context.js

class NavigationContext {
    constructor() {
        this.CONTEXTS = {
            CHECKOUT: 'checkout',
            USER_PROFILE: 'user_profile'
        };
    }

    /**
     * Establece el contexto de navegación antes de ir a otra página
     * @param {string} context - 'checkout' o 'user_profile'
     * @param {string} returnUrl - URL a la que volver después
     */
    setContext(context, returnUrl = null) {
        localStorage.setItem('navigation_context', context);
        if (returnUrl) {
            localStorage.setItem('navigation_return_url', returnUrl);
        }
    }

    /**
     * Obtiene el contexto actual
     * @returns {string} - 'checkout' o 'user_profile'
     */
    getContext() {
        return localStorage.getItem('navigation_context') || this.CONTEXTS.USER_PROFILE;
    }

    /**
     * Obtiene la URL de retorno o una por defecto según el contexto
     * @returns {string}
     */
    getReturnUrl() {
        const savedUrl = localStorage.getItem('navigation_return_url');
        if (savedUrl) return savedUrl;

        // URLs por defecto según contexto
        const context = this.getContext();
        return context === this.CONTEXTS.CHECKOUT 
            ? '/html/checkout.html' 
            : '/html/mycards.html';
    }

    /**
     * Navega a la URL de retorno y limpia el contexto
     */
    returnToPreviousPage() {
        const returnUrl = this.getReturnUrl();
        this.clear();
        window.location.href = returnUrl;
    }

    /**
     * Limpia el contexto de navegación
     */
    clear() {
        localStorage.removeItem('navigation_context');
        localStorage.removeItem('navigation_return_url');
    }

    /**
     * Verifica si estamos en flujo de checkout
     * @returns {boolean}
     */
    isCheckoutFlow() {
        return this.getContext() === this.CONTEXTS.CHECKOUT;
    }

    /**
     * Verifica si estamos en flujo de perfil de usuario
     * @returns {boolean}
     */
    isUserProfileFlow() {
        return this.getContext() === this.CONTEXTS.USER_PROFILE;
    }
}

export default new NavigationContext();