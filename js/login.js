import authService from '../services/auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    if (authService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    const loginForm = document.querySelector('.login-form');
    const toggleButton = document.getElementById('toggleButton');

    toggleButton?.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const correo = document.getElementById('correo').value.trim();
        const password = document.getElementById('password').value;

        if (!correo) {
            showNotification('Por favor ingrese su correo', 'error');
            return;
        }   

        if (!password) {
            showNotification('Por favor ingrese su contraseña', 'error');
            return;
        }

        const btnEntrar = loginForm.querySelector('.btn-entrar');
        const originalText = btnEntrar.textContent;
        btnEntrar.textContent = 'INICIANDO SESIÓN...';
        btnEntrar.disabled = true;

        try {
            const result = await authService.login({
                correo,
                contrasena: password
            });

            if (result.success) {
                console.log(' DEBUG - Resultado completo:', result);
                console.log(' DEBUG - Datos del usuario:', result.data);
                console.log(' DEBUG - rolId:', result.data.rolId);
                console.log(' DEBUG - rol_id:', result.data.rol_id);
                console.log(' DEBUG - Todas las keys:', Object.keys(result.data));
                
                showNotification('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
                loginForm.reset();
                
                setTimeout(() => {
                    const rol = result.data.rolId || result.data.rol_id || result.data.ID_Rol || result.data.rol;
                    console.log(' Rol final detectado:', rol, '(tipo:', typeof rol, ')');
                    
                    if (rol === 1 || rol === '1') {
                        console.log(' Redirigiendo a ADMIN');
                        window.location.href = '../html/admin-products.html';
                    } else {
                        console.log(' Redirigiendo a INDEX (usuario normal)');
                        window.location.href = '../index.html';
                    }
                }, 1500);
            } else {
                showNotification(result.error || 'Error al iniciar sesión', 'error');
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