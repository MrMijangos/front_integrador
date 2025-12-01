import paymentService from '../common/api/payment-service.js';
import authService from '../services/auth-service.js';
import navigationContext from '../common/utils/navigation-context.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    navigationContext.setContext(
        navigationContext.CONTEXTS.CHECKOUT, 
        '/html/checkout.html'
    );

    if (!authService.isAuthenticated()) {
        alert("Por favor inicia sesión para ver tus métodos de pago");
        window.location.href = '../html/login.html';
        return;
    }

    loadCartTotal();

    const btnAdd = document.getElementById('btnAddPayment');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            window.location.href = '../html/add-payment.html';
        });
    }

    const btnProceed = document.getElementById('btnProceed');
    if (btnProceed) {
        btnProceed.addEventListener('click', handleProceed);
    }

    await loadPaymentMethods();
});

function loadCartTotal() {
    const total = localStorage.getItem('cartTotal') || '0.00';
    const totalElement = document.getElementById('checkoutTotal');
    if (totalElement) {
        totalElement.textContent = `$${total}`;
    }
}

async function loadPaymentMethods() {
    const container = document.getElementById('cardsContainer');
    
    if (!container) {
        console.error('No se encontró el contenedor cardsContainer');
        return;
    }

    try {
        console.log(' Cargando métodos de pago...');
        const result = await paymentService.getAllPaymentMethods();
        
        console.log(' Resultado de métodos de pago:', result);
        
        container.innerHTML = '';

        let paymentsArr = [];
        
        if (result && result.success && result.data) {
            if (Array.isArray(result.data)) {
                paymentsArr = result.data;
            } else if (result.data.data && Array.isArray(result.data.data)) {
                paymentsArr = result.data.data;
            }
        } else if (Array.isArray(result)) {
            paymentsArr = result;
        }

        console.log('Tarjetas procesadas:', paymentsArr);

        if (paymentsArr.length > 0) {
            paymentsArr.forEach((card, index) => {
                const cardHTML = createCardHTML(card, index === 0);
                container.appendChild(cardHTML);
            });
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>No tienes métodos de pago guardados.</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Agrega una tarjeta para continuar con tu compra.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error(" Error cargando tarjetas:", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar tarjetas</p>';
    }
}

function createCardHTML(card, isFirst) {
    const div = document.createElement('div');
    div.className = 'payment-method-card';
    div.style.cssText = `
        border: 2px solid #e0e0e0;
        padding: 20px;
        margin-bottom: 15px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        cursor: pointer;
        background: #fff;
        transition: all 0.3s ease;
    `;
    
    const cardId = card.id || card.idMetodoPago || card.id_metodo_pago || card.ID_MetodoPago;
    const tipoTarjeta = card.tipoTarjeta || card.tipo_tarjeta || card.tipo || 'TARJETA';
    const nombreTitular = card.nombreTitular || card.nombre_titular || 'Titular';
    const ultimosDigitos = card.ultimosDigitos || card.ultimos_digitos || '****';
    const mesExpiracion = card.mesExpiracion || card.mes_expiracion || '00';
    const anioExpiracion = card.anioExpiracion || card.anio_expiracion || '0000';
    const esPredeterminado = card.esPredeterminado || card.es_predeterminado || false;

    const checkedAttr = (isFirst || esPredeterminado) ? 'checked' : '';

    let cardIcon = '💳';
    const tipo = tipoTarjeta.toUpperCase();
    if (tipo.includes('VISA')) {
        cardIcon = '💳';
    } else if (tipo.includes('MASTERCARD')) {
        cardIcon = '💳';
    } else if (tipo.includes('AMERICAN') || tipo.includes('AMEX')) {
        cardIcon = '💳';
    }

    div.innerHTML = `
        <input type="radio" 
               name="payment-method" 
               value="${cardId}" 
               ${checkedAttr} 
               style="margin-right: 20px; transform: scale(1.5); cursor: pointer;">
        
        <div class="payment-card-visual" style="flex-grow: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 24px;">${cardIcon}</span>
                        <span style="font-weight: bold; font-size: 1.1em; color: #333;">${tipoTarjeta}</span>
                        ${esPredeterminado ? '<span style="background: #f9bd31; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold;">PREDETERMINADA</span>' : ''}
                    </div>
                    <div style="color: #666; margin-bottom: 5px;">
                        <strong>${nombreTitular}</strong>
                    </div>
                    <div style="color: #888; font-family: monospace; font-size: 1.1em;">
                        •••• •••• •••• ${ultimosDigitos}
                    </div>
                </div>
                <div style="text-align: right; color: #888; font-size: 0.9em;">
                    <div>Vence:</div>
                    <div style="font-weight: bold; color: #555;">
                        ${String(mesExpiracion).padStart(2, '0')}/${anioExpiracion}
                    </div>
                </div>
            </div>
        </div>
    `;

    div.addEventListener('mouseenter', () => {
        div.style.borderColor = '#f9bd31';
        div.style.backgroundColor = '#fffbf0';
        div.style.transform = 'translateY(-2px)';
        div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    });

    div.addEventListener('mouseleave', () => {
        div.style.borderColor = '#e0e0e0';
        div.style.backgroundColor = '#fff';
        div.style.transform = 'translateY(0)';
        div.style.boxShadow = 'none';
    });

    div.addEventListener('click', () => {
        div.querySelector('input[type="radio"]').checked = true;
    });

    return div;
}

function handleProceed() {
    const selected = document.querySelector('input[name="payment-method"]:checked');
    
    if (!selected) {
        alert("Por favor selecciona un método de pago para continuar.");
        return;
    }

    const idMetodoPago = selected.value;
    localStorage.setItem('selectedPaymentId', idMetodoPago);
    
    console.log("Método de pago guardado:", idMetodoPago);

    window.location.href = '../html/shipping-address.html';
}