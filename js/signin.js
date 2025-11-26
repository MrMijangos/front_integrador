import authService from '../services/auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.querySelector('.register-form');
    const toggleButton = document.getElementById('toggleButton');
    const toggleButton2 = document.getElementById('toggleButton2');

    toggleButton?.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });

    toggleButton2?.addEventListener('click', function() {
        const confirmInput = document.getElementById('confirm-password');
        const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmInput.setAttribute('type', type);
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const celular = document.getElementById('celular').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!nombre) {
            showNotification('Por favor ingrese su nombre completo', 'error');
            return;
        }

        if (!correo) {
            showNotification('Por favor ingrese su correo', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            showNotification('Por favor ingrese un correo válido', 'error');
            return;
        }

        if (!password) {
            showNotification('Por favor ingrese una contraseña', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        const btnEntrar = registerForm.querySelector('.btn-entrar');
        const originalText = btnEntrar.textContent;
        btnEntrar.textContent = 'CREANDO CUENTA...';
        btnEntrar.disabled = true;

        try {
            const result = await authService.register({
                nombre,
                correo,
                contrasenia: password,
                celular
            });

            if (result.success) {
                showNotification('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = '../html/login.html';
                }, 2000);
            } else {
                showNotification(result.error || 'Error al crear cuenta', 'error');
                btnEntrar.textContent = originalText;
                btnEntrar.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error de conexión con el servidor', 'error');
            btnEntrar.textContent = originalText;
            btnEntrar.disabled = false;
        }
    });
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        min-width: 250px;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}