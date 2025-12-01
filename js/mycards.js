import paymentService from '../common/api/payment-service.js';
import authService from '../services/auth-service.js';
import navigationContext from '../common/utils/navigation-context.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log(' mycards.js cargado correctamente');

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

        console.log(' RESPUESTA COMPLETA:', JSON.stringify(result, null, 2));

        let paymentsArr = [];

        if (result.success && Array.isArray(result.data)) {
            paymentsArr = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
            paymentsArr = result.data.data;
        } else if (result.data && result.data.success && Array.isArray(result.data.data)) {
            paymentsArr = result.data.data;
        } else if (Array.isArray(result)) {
            paymentsArr = result;
        }

        console.log(' Array normalizado:', paymentsArr);

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
            console.log(' Procesando tarjeta:', card);
            const cardElement = createCardElement(card);
            listContainer.appendChild(cardElement);
        });

        container.appendChild(listContainer);

    } catch (error) {
        console.error(' Error cargando métodos de pago:', error);
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#f44336;">
                <p style="margin-bottom:10px;">Error al cargar tus tarjetas</p>
                <p style="font-size:14px; color:#999;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top:20px; padding:10px 24px; background:#4CAF50; color:white; border:none; border-radius:8px; cursor:pointer;">REINTENTAR</button>
            </div>
        `;
    }
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'payment-method-card';
    div.style.cssText = `
        border: 2px solid #e0e0e0;
        padding: 24px;
        margin-bottom: 16px;
        border-radius: 16px;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        overflow: hidden;
    `;

    const cardId = card.id || card.idMetodoPago || card.id_metodo_pago;
    const tipoTarjeta = (card.tipoTarjeta || card.tipo_tarjeta || 'credito').toUpperCase();
    const nombreTitular = card.nombreTitular || card.nombre_titular || 'Titular';
    const ultimosDigitos = card.ultimosDigitos || card.ultimos_digitos || '****';
    const mesExpiracion = String(card.mesExpiracion || card.mes_expiracion || '00').padStart(2, '0');
    const anioExpiracion = card.anioExpiracion || card.anio_expiracion || '0000';
    const esPredeterminado = card.esPredeterminado || card.es_predeterminado || false;

    let cardIcon = '💳';
    let cardColor = '#4CAF50';
    
    if (tipoTarjeta.includes('VISA')) {
        cardIcon = '💳';
        cardColor = '#1A1F71';
    } else if (tipoTarjeta.includes('MASTERCARD')) {
        cardIcon = '💳';
        cardColor = '#EB001B';
    } else if (tipoTarjeta.includes('DEBITO')) {
        cardIcon = '💳';
        cardColor = '#2196F3';
    } else if (tipoTarjeta.includes('CREDITO')) {
        cardIcon = '💳';
        cardColor = '#F9BD31';
    }

    div.innerHTML = `
        <!-- Decoración de fondo -->
        <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: ${cardColor}15; border-radius: 50%; z-index: 0;"></div>
        
        <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
            <!-- Información de la tarjeta -->
            <div style="flex-grow: 1;">
                <!-- Tipo de tarjeta -->
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <span style="font-size: 32px;">${cardIcon}</span>
                    <div>
                        <div style="font-weight: bold; font-size: 1.2em; color: #333; text-transform: uppercase;">
                            ${tipoTarjeta}
                        </div>
                        ${esPredeterminado ? '<span style="display: inline-block; background: linear-gradient(135deg, #F9BD31 0%, #E8AD28 100%); color: white; padding: 3px 10px; border-radius: 6px; font-size: 0.7em; font-weight: bold; margin-top: 4px;">PREDETERMINADA</span>' : ''}
                    </div>
                </div>

                <!-- Nombre del titular -->
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 0.85em; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        Titular
                    </div>
                    <div style="font-weight: 600; font-size: 1.05em; color: #333;">
                        ${nombreTitular}
                    </div>
                </div>

                <!-- Número de tarjeta -->
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 0.85em; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        Número de tarjeta
                    </div>
                    <div style="font-family: 'Courier New', monospace; font-size: 1.2em; font-weight: bold; color: #555; letter-spacing: 2px;">
                        •••• •••• •••• ${ultimosDigitos}
                    </div>
                </div>

                <!-- Fecha de expiración -->
                <div>
                    <div style="font-size: 0.85em; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        Vencimiento
                    </div>
                    <div style="font-weight: 600; font-size: 0.95em; color: #555;">
                        ${mesExpiracion}/${anioExpiracion}
                    </div>
                </div>
            </div>

            <!-- Botón de eliminar -->
            <button class="btn-delete-card" onclick="deleteCard(${cardId}, '${ultimosDigitos}')" style="
                background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                box-shadow: 0 4px 15px rgba(229, 57, 53, 0.3);
                flex-shrink: 0;
                margin-left: 24px;
            " 
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(229, 57, 53, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(229, 57, 53, 0.3)'"
            title="Eliminar tarjeta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                ELIMINAR
            </button>
        </div>
    `;

    div.onmouseover = () => {
        div.style.borderColor = cardColor;
        div.style.boxShadow = `0 6px 20px ${cardColor}30`;
        div.style.transform = 'translateY(-4px)';
    };
    
    div.onmouseout = () => {
        div.style.borderColor = '#e0e0e0';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        div.style.transform = 'translateY(0)';
    };

    return div;
}

window.deleteCard = async function (cardId, lastDigits) {
    if (!confirm(`¿Estás seguro de eliminar la tarjeta terminada en ${lastDigits}?`)) {
        return;
    }

    try {
        console.log(' Eliminando tarjeta ID:', cardId);

        const result = await paymentService.deletePaymentMethod(cardId);

        if (result && result.success !== false) {
            showNotification('Tarjeta eliminada exitosamente', 'success');
            await loadPaymentMethods();
        } else {
            throw new Error(result.error || 'Error al eliminar tarjeta');
        }
    } catch (error) {
        console.error(' Error eliminando tarjeta:', error);
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