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
        const result = await paymentService.getAllPaymentMethods();
        
        console.log('Resultado de métodos de pago:', result);
        
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
                </div>
            `;
        }

    } catch (error) {
        console.error("Error cargando tarjetas:", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar tarjetas</p>';
    }
}

function createCardHTML(card, isFirst) {
    const div = document.createElement('div');
    div.className = 'payment-method-card';
    div.style.cssText = 'border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; align-items: center; cursor: pointer; background: #fff;';
    
    const checkedAttr = isFirst ? 'checked' : '';
    const cardId = card.idMetodoPago || card.id_metodo_pago || card.ID_MetodoPago || card.id;

    div.innerHTML = `
        <input type="radio" name="payment-method" value="${cardId}" ${checkedAttr} style="margin-right: 15px; transform: scale(1.5);">
        
        <div class="payment-card-visual" style="flex-grow: 1;">
            <div class="card-number">
                <span style="font-weight: bold; font-size: 1.1em; display:block;">${card.tipo || 'Tarjeta'}</span>
                <span class="card-digits" style="color: #555;">${card.detalles || ''}</span>
            </div>
        </div>
    `;

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
