import environment from '../environment/environment.js';
import authService from '../services/auth-service.js';
import orderService from '../common/api/order-service.js';

const DEFAULT_IMAGE = '../images/productosmiel.jpg'; 
const API_BASE_URL = environment.apiUrl;

let userMap = {};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('admin-shipments.js cargado');

    if (!authService.isAuthenticated() || !authService.isAdmin()) {
        alert('Acceso restringido a administradores');
        window.location.href = '../html/login.html';
        return;
    }

    setupTabs();
    
    await loadAllUsers();
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


async function loadAllUsers() {
    try {
        console.log(' Cargando directorio de usuarios...');
        const response = await fetch(`${API_BASE_URL}/api/usuarios`);
        const result = await response.json();
        
        const users = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
        
        users.forEach(user => {
            userMap[user.id] = {
                nombre: user.nombreCompleto || user.nombre_completo || 'Usuario Desconocido',
                correo: user.correo || 'Sin correo',
                telefono: user.numCelular || user.num_celular || 'Sin teléfono'
            };
        });
        
        console.log(` ${Object.keys(userMap).length} usuarios cargados en memoria.`);
    } catch (error) {
        console.error(' Error cargando usuarios:', error);
    }
}

async function loadOrders() {
    const container = document.getElementById('shipmentsList');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Cargando pedidos...</p>';

    try {
        console.log(' Cargando pedidos...');
        const result = await orderService.getAllOrders();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No hay pedidos registrados.</p>';
            return;
        }

        
        const ordersWithUsers = result.data.map(order => {
            const userId = order.idUsuario || order.id_usuario || order.usuarioId;
            const userData = userMap[userId] || { nombre: 'Cliente (ID no encontrado)', correo: '-', telefono: '-' };
            
            return {
                ...order,
                usuarioData: userData
            };
        });

        renderOrders(ordersWithUsers);
        
        filterShipments('pending');

    } catch (error) {
        console.error(' Error cargando pedidos:', error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error de conexión al cargar pedidos.</p>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('shipmentsList');
    container.innerHTML = '';

    console.log(' Renderizando', orders.length, 'pedidos');

    orders.forEach(order => {
        const numeroPedido = order.numeroPedido || order.numero_pedido || order.NUMERO_PEDIDO || order.numero;
        
        const estadoDB = (order.estado || 'pendiente').toLowerCase();

        let statusClass = 'pending';
        let actionButton = '';

        if (['pendiente', 'creado', 'procesando'].includes(estadoDB)) {
            statusClass = 'pending';
            actionButton = `<button class="btn-update" onclick="window.updateOrderStatus(${orderId}, 'ENVIADO')">MARCAR ENVIADO </button>`;
        } else if (['enviado', 'shipped'].includes(estadoDB)) {
            statusClass = 'shipped';
            actionButton = `<button class="btn-update" onclick="window.updateOrderStatus(${orderId}, 'ENTREGADO')">MARCAR ENTREGADO </button>`;
        } else if (['entregado', 'delivered', 'completada'].includes(estadoDB)) {
            statusClass = 'delivered';
            actionButton = `<span class="status-badge success">✓ COMPLETADO</span>`;
        } else if (estadoDB === 'cancelado') {
            statusClass = 'delivered'; 
            actionButton = `<span class="status-badge error">✕ CANCELADO</span>`;
        }

        const fecha = new Date(order.fecha || order.fechaPedido || order.fecha_pedido || Date.now());
        const fechaFormateada = fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

        const { nombre, correo, telefono } = order.usuarioData;

        const div = document.createElement('div');
        div.className = 'shipment-item';
        div.dataset.status = statusClass;
        div.style.display = 'flex';
        div.innerHTML = `
            <div class="shipment-main">
                <div class="shipment-product">
                    <img src="../images/usuario (1).png" alt="Pedido" class="shipment-image" onerror="this.src='../images/logo-placeholder.png'">
                    <div class="product-details">
                        <h3 class="product-name">Pedido #${numeroPedido}</h3>
                        <p class="product-description"> Fecha: ${fechaFormateada}</p>
                        <div class="product-quantity">Total: <strong>$${Number(order.total || 0).toFixed(2)}</strong></div>
                        <p class="status-label">Estado: ${estadoDB.toUpperCase()}</p>
                    </div>
                </div>
                
                <div class="shipment-info">
                    <h4 class="customer-name"> ${nombre}</h4>
                    <p class="customer-contact">
                         ${correo}<br>
                         ${telefono}
                    </p>
                </div>
            </div>
            
            <div class="shipment-actions">
                ${actionButton}
            </div>
        `;

        container.appendChild(div);
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    if (!confirm(`¿Confirmar cambio de estado a "${newStatus}" para el pedido #${orderId}?`)) {
        return;
    }

    try {
        const result = await orderService.updateOrderStatus(orderId, newStatus);

        if (result.success) {
            showNotification(`Pedido #${orderId} actualizado a ${newStatus}`, 'success');
            await loadOrders(); 
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

function filterShipments(status) {
    const items = document.querySelectorAll('.shipment-item');
    let count = 0;

    items.forEach(item => {
        const itemStatus = item.dataset.status;
        let visible = false;

        if (status === 'pending' && itemStatus === 'pending') visible = true;
        if (status === 'shipped' && itemStatus === 'shipped') visible = true;
        if (status === 'delivered' && (itemStatus === 'delivered' || itemStatus === 'cancelled')) visible = true;

        if (visible) {
            item.style.display = 'flex';
            count++;
        } else {
            item.style.display = 'none';
        }
    });

    const container = document.getElementById('shipmentsList');
    const existingMsg = document.getElementById('msg-empty');
    if (existingMsg) existingMsg.remove();

    if (count === 0) {
        const p = document.createElement('div');
        p.id = 'msg-empty';
        p.className = 'empty-state';
        p.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
            <h3>No hay pedidos en esta sección</h3>
        `;
        p.style.textAlign = 'center';
        p.style.padding = '40px';
        p.style.color = '#888';
        container.appendChild(p);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}