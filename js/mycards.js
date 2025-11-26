// js/mycards.js - CORREGIDO
import paymentService from '../common/api/payment-service.js';
import authService from '../services/auth-service.js';
import navigationContext from '../common/utils/navigation-context.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ mycards.js cargado correctamente');

    localStorage.removeItem('isCheckoutFlow');
    navigationContext.clear();

    if (!authService.isAuthenticated()) {
        alert('Debes iniciar sesión');
        window.location.href = '../html/login.html';
        return;
    }

    await loadPaymentMethods();

    const btnAddPayment = document.getElementById('btnAddPayment');
    if (btnAddPayment) {
        btnAddPayment.addEventListener('click', () => {
            window.location.href = '../html/add-payment.html';
        });
    }
});

async function loadPaymentMethods() {
    const container = document.getElementById('paymentMethodsContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:40px;"><p>Cargando...</p></div>';

    try {
        const result = await paymentService.getAllPaymentMethods();

        console.log('📋 RESPUESTA COMPLETA:', JSON.stringify(result, null, 2));

        // ✅ CORRECCIÓN: Normalizar la respuesta correctamente
        let paymentsArr = [];

        // Si result.success existe y result.data es un array
        if (result.success && Array.isArray(result.data)) {
            paymentsArr = result.data;
        }
        // Si result.data.data existe (doble envoltorio)
        else if (result.data && Array.isArray(result.data.data)) {
            paymentsArr = result.data.data;
        }
        // Si result.data es un objeto con success
        else if (result.data && result.data.success && Array.isArray(result.data.data)) {
            paymentsArr = result.data.data;
        }
        // Si viene directo como array
        else if (Array.isArray(result)) {
            paymentsArr = result;
        }

        console.log('📦 Array normalizado:', paymentsArr);

        container.innerHTML = '';

        if (paymentsArr.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                    </div>
                    <h3>No tienes tarjetas guardadas</h3>
                    <p>Agrega una tarjeta para gestionar tus métodos de pago</p>
                </div>
            `;
            return;
        }

        const listContainer = document.createElement('div');
        listContainer.className = 'payment-methods-list';

        paymentsArr.forEach((card) => {
            console.log('💳 Procesando tarjeta:', card);
            const cardId = card.idMetodoPago || card.id_metodo_pago || card.ID_MetodoPago || card.id;
            const cardElement = createCardElement(card, cardId);
            listContainer.appendChild(cardElement);
        });

        container.appendChild(listContainer);

    } catch (error) {
        console.error('❌ Error cargando métodos de pago:', error);
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#f44336;">
                <p style="margin-bottom:10px;">Error al cargar tus tarjetas</p>
                <p style="font-size:14px; color:#999;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top:20px; padding:10px 24px; background:#4CAF50; color:white; border:none; border-radius:8px; cursor:pointer;">REINTENTAR</button>
            </div>
        `;
    }
}

function createCardElement(card, cardId) {
    const div = document.createElement('div');
    div.className = 'payment-method-card';
    div.style.cssText = `
        border: 2px solid #e0e0e0;
        padding: 20px;
        margin-bottom: 15px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #fff;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    `;

    // ✅ CORRECCIÓN: Usar el ID correcto del backend
    const realCardId = card.idMetodoPago || card.ID_Metodo_Pago || cardId;
    
    let lastDigits = '****';
    let expiration = '';
    let cardHolder = '';

    if (card.detalles) {
        const details = card.detalles;
        const digitsMatch = details.match(/terminada en (\d{4})/);
        if (digitsMatch) lastDigits = digitsMatch[1];

        const expMatch = details.match(/Exp: ([\d\/]+)/);
        if (expMatch) expiration = expMatch[1];

        const holderMatch = details.match(/Titular: ([^|]+)/);
        if (holderMatch) cardHolder = holderMatch[1].trim();
    }

    const cardType = card.tipo || 'Tarjeta';

    div.innerHTML = `
        <div style="flex-grow:1;">
            <div style="font-weight:bold; margin:0 0 8px 0; font-size: 1.1em; color: #333; display: flex; align-items: center; gap: 8px;">
                <span style="display:inline-block; width:20px; height:20px; background: linear-gradient(135deg, #F9BD31 0%, #E8AD28 100%); border-radius:4px;"></span>
                <span>${cardType}</span>
            </div>
            <div style="color:#666; font-size: 0.95em;">
                <div style="margin-bottom: 4px;">•••• •••• •••• ${lastDigits}</div>
                ${expiration ? `<div style="font-size: 0.9em; color: #888;">Exp: ${expiration}</div>` : ''}
                ${cardHolder ? `<div style="font-size: 0.9em; color: #888;">${cardHolder}</div>` : ''}
            </div>
        </div>
        
        <button class="btn-delete-card" onclick="deleteCard(${realCardId}, '${lastDigits}')" style="
            background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
            flex-shrink: 0;
        " title="Eliminar tarjeta">
            ELIMINAR
        </button>
    `;

    div.onmouseover = () => {
        div.style.borderColor = '#F9BD31';
        div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    };
    div.onmouseout = () => {
        div.style.borderColor = '#e0e0e0';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    };

    return div;
}

window.deleteCard = async function (cardId, lastDigits) {
    if (!confirm(`¿Estás seguro de eliminar la tarjeta terminada en ${lastDigits}?`)) {
        return;
    }

    try {
        console.log('🗑️ Eliminando tarjeta ID:', cardId);

        const result = await paymentService.deletePaymentMethod(cardId);

        if (result && result.success !== false) {
            showNotification('Tarjeta eliminada exitosamente', 'success');
            await loadPaymentMethods();
        } else {
            throw new Error(result.error || 'Error al eliminar tarjeta');
        }
    } catch (error) {
        console.error('❌ Error eliminando tarjeta:', error);
        showNotification('Error al eliminar la tarjeta: ' + error.message, 'error');
    }
}

function showNotification(message, type) {
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
        animation: slideIn 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
