import environment from '../environment/environment.js';
import authService from '../services/auth-service.js';
import orderService from '../common/api/order-service.js';

const DEFAULT_IMAGE = '../images/productosmiel';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ admin-shipments.js cargado');

    if (!authService.isAuthenticated()) {
        alert('Debes iniciar sesión como admin');
        window.location.href = '../html/login.html';
        return;
    }

    if (!authService.isAdmin()) {
        alert('No tienes permisos de administrador');
        window.location.href = '../index.html';
        return;
    }

    setupTabs();
    await loadOrders();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const status = tab.dataset.status;
            filterShipments(status);
        });
    });
}

async function loadOrders() {
    const container = document.getElementById('shipmentsList');

    try {
        console.log('📦 Cargando todos los pedidos...');
        const result = await orderService.getAllOrders();

        console.log('📦 Resultado de pedidos:', result);

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No hay pedidos.</p>';
            return;
        }

        renderOrders(result.data);
        filterShipments('pending');
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar datos.</p>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('shipmentsList');
    container.innerHTML = '';

    console.log('🎨 Renderizando', orders.length, 'pedidos');

    orders.forEach(order => {
        const orderId = order.idPedido || order.id_pedido || order.ID_Pedido || order.id;
        const metodoPagoId = order.idMetodoPago || order.id_metodo_pago || order.metodoPagoId;
        const direccionId = order.idDireccion || order.id_direccion || order.direccionId;
        const usuarioId = order.idUsuario || order.id_usuario || order.usuarioId;

        console.log('🔍 Pedido:', {orderId, metodoPagoId, direccionId, usuarioId});

        let statusClass = 'pending';
        let nextStatus = '';
        
        // ✅ CORRECCIÓN: Convertir a minúsculas para comparar
        const estadoDB = order.estado ? order.estado.toLowerCase() : 'pendiente';

        // ✅ Estados válidos del backend: pendiente, procesando, enviado, entregado, cancelado
        if (estadoDB === 'pendiente') {
            statusClass = 'pending';
            nextStatus = 'enviado'; // ✅ minúscula
        } else if (estadoDB === 'procesando') {
            statusClass = 'pending';
            nextStatus = 'enviado'; // ✅ minúscula
        } else if (estadoDB === 'enviado') {
            statusClass = 'shipped';
            nextStatus = 'entregado'; // ✅ minúscula
        } else if (estadoDB === 'entregado') {
            statusClass = 'delivered';
        } else if (estadoDB === 'cancelado') {
            statusClass = 'delivered'; // O podrías crear una clase 'cancelled'
        }

        let actionHtml = '';
        if (statusClass === 'pending') {
            actionHtml = `<button 
                class="btn-update" 
                onclick="window.updateOrderStatus(${orderId}, 'enviado')">
                MARCAR ENVIADO
            </button>`;
        } else if (statusClass === 'shipped') {
            actionHtml = `<button 
                class="btn-update" 
                onclick="window.updateOrderStatus(${orderId}, 'entregado')">
                MARCAR ENTREGADO
            </button>`;
        } else {
            actionHtml = `<span style="color:green; font-weight:bold;">✓ ENTREGADO</span>`;
        }

        const div = document.createElement('div');
        div.className = 'shipment-item';
        div.dataset.status = statusClass;
        div.style.display = 'flex';

        let fechaFormateada = 'N/A';
        if (order.fecha || order.fechaPedido || order.fecha_pedido) {
            const fecha = order.fecha || order.fechaPedido || order.fecha_pedido;
            fechaFormateada = new Date(fecha).toLocaleDateString('es-MX');
        }

        div.innerHTML = `
            <div class="shipment-main">
                <div class="shipment-product">
                    <img src="${DEFAULT_IMAGE}" alt="Pedido" class="shipment-image" onerror="this.src='${DEFAULT_IMAGE}'">
                    <div class="product-details">
                        <h3 class="product-name">Pedido #${orderId}</h3>
                        <p class="product-description">Fecha: ${fechaFormateada}</p>
                        <div class="product-quantity">Total: <strong>$${order.total || '0.00'}</strong></div>
                        <p style="font-size: 0.9em; color: #666;">Estado: ${estadoDB.toUpperCase()}</p>
                    </div>
                </div>
                
                <div class="shipment-info">
                    <h4 class="customer-name">${order.nombreUsuario || order.nombre_usuario || 'Cliente'}</h4>
                    <p class="shipping-address">
                        ${order.direccionCompleta || order.direccion_completa || 'Dirección no disponible'} <br>
                        <strong>Tel:</strong> ${order.telefono || order.telefonoContacto || 'N/A'}
                    </p>
                </div>
            </div>
            
            <div class="shipment-actions">
                ${actionHtml}
            </div>
        `;

        container.appendChild(div);
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    if (!confirm(`¿Estás seguro de cambiar el estado del Pedido #${orderId} a ${newStatus}?`)) {
        return;
    }

    try {
        console.log('♻️ Actualizando pedido:', orderId, 'a', newStatus);

        const result = await orderService.updateOrderStatus(orderId, newStatus);

        console.log('✅ Resultado actualización:', result);

        if (result.success) {
            showNotification(`Estado del Pedido #${orderId} actualizado a ${newStatus} correctamente`, 'success');
            await loadOrders();
        } else {
            throw new Error(result.error || 'Error al actualizar estado');
        }

    } catch (error) {
        console.error('❌ Error al actualizar el estado del pedido:', error);
        showNotification(`Fallo en la actualización: ${error.message}`, 'error');
    }
}

function filterShipments(status) {
    const items = document.querySelectorAll('.shipment-item');
    let count = 0;

    items.forEach(item => {
        if (item.dataset.status === status) {
            item.style.display = 'flex';
            count++;
        } else {
            item.style.display = 'none';
        }
    });

    const container = document.getElementById('shipmentsList');
    const msg = document.getElementById('msg-empty');
    if (msg) msg.remove();

    if (count === 0) {
        const p = document.createElement('p');
        p.id = 'msg-empty';
        p.textContent = 'No hay pedidos en esta categoría.';
        p.style.textAlign = 'center';
        p.style.width = '100%';
        p.style.padding = '20px';
        container.appendChild(p);
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    const color = type === 'success' ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #e53935 0%, #c62828 100%)';

    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 16px 28px;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-size: 14px;
        font-weight: bold;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}