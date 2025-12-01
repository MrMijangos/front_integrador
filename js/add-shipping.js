import shippingService from '../common/api/shipping-service.js';
import authService from '../services/auth-service.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log(" Script add-shipping.js cargado");

    if (!authService.isAuthenticated()) {
        alert('Debes iniciar sesión');
        window.location.href = '../html/login.html';
        return;
    }

    setupInputFormatting();

    const btnAdd = document.getElementById('btnAddAddressBtn');
    if (btnAdd) {
        btnAdd.addEventListener('click', handleSaveAddress);
    }
});

async function handleSaveAddress(e) {
    e.preventDefault();

    const form = document.getElementById('shippingForm');
    const btnAdd = document.getElementById('btnAddAddressBtn');

    if (!form.checkValidity()) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        form.reportValidity();
        return;
    }

    const name = document.getElementById('shippingName').value.trim();
    const street = document.getElementById('shippingStreet').value.trim();
    const numExt = document.getElementById('shippingNumExt').value.trim();
    const numInt = document.getElementById('shippingNumInt').value.trim();
    const colony = document.getElementById('shippingColony').value.trim();
    const city = document.getElementById('shippingCity').value.trim();
    const state = document.getElementById('shippingState').value.trim();
    const zip = document.getElementById('shippingZip').value.trim();
    const phone = document.getElementById('shippingPhone').value.trim();
    const references = document.getElementById('shippingReferences').value.trim();

    console.log(' Datos capturados:', {
        name, street, numExt, numInt, colony, city, state, zip, phone, references
    });

    const originalText = btnAdd.textContent;
    btnAdd.textContent = 'GUARDANDO...';
    btnAdd.disabled = true;

    try {
        console.log(" Enviando datos al servidor...");

        const result = await shippingService.addShippingMethod({
            idUsuario: authService.getUserId(),
            nombreDestinatario: name,
            calle: street,
            numeroExterior: numExt,
            numeroInterior: numInt || '',
            colonia: colony,
            ciudad: city,
            estado: state,
            codigoPostal: zip,
            telefonoContacto: phone,
            referencias: references || ''
        });

        console.log(' Respuesta del servidor:', result);

        if (result.success) {
            showNotification('Dirección guardada exitosamente', 'success');
            form.reset();

            setTimeout(() => {
                const referrer = document.referrer;
                const isFromCheckout = referrer.includes('shipping-address.html') ||
                    referrer.includes('checkout.html') ||
                    localStorage.getItem('isCheckoutFlow') === 'true';

                if (isFromCheckout) {
                    window.location.href = '../html/shipping-address.html';
                } else {
                    window.location.href = '../html/addresses.html';
                }
            }, 1500);
        } else {
            throw new Error(result.error || 'Error al guardar dirección');
        }

    } catch (error) {
        console.error(' Error:', error);
        showNotification(error.message, 'error');
        btnAdd.textContent = originalText;
        btnAdd.disabled = false;
    }
}

function setupInputFormatting() {
    ['shippingZip', 'shippingPhone'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification-toast';

    const colors = {
        success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        error: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
        info: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: bold;
        max-width: 400px;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}