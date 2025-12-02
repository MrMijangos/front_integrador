import orderService from '../common/api/order-service.js';
import authService from '../services/auth-service.js';
import cartService from '../common/api/cart-service.js';

const DEFAULT_IMAGE = '../images/productosmiel';

window.toggleOrderMenu = function (button) {
    const dropdown = button.closest('.order-status-section').querySelector('.order-dropdown');
    const allDropdowns = document.querySelectorAll('.order-dropdown');

    allDropdowns.forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
    });

    dropdown.classList.toggle('active');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.order-status-section')) {
        document.querySelectorAll('.order-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getStatusClass(estado) {
    const statusMap = {
        'CREADO': 'in-process',
        'PENDIENTE': 'in-process',
        'PENDING': 'in-process',
        'PROCESANDO': 'in-process',
        'EN PROCESO': 'in-process',
        'ENVIADO': 'shipped',
        'SHIPPED': 'shipped',
        'ENTREGADO': 'delivered',
        'DELIVERED': 'delivered',
        'COMPLETADA': 'delivered',
        'CANCELADO': 'cancelled',
        'CANCELLED': 'cancelled'
    };
    return statusMap[estado?.toUpperCase()] || 'in-process';
}

function getStatusText(estado) {
    const textMap = {
        'CREADO': 'EN PROCESO',
        'PENDIENTE': 'EN PROCESO',
        'PENDING': 'EN PROCESO',
        'PROCESANDO': 'PROCESANDO',
        'EN PROCESO': 'EN PROCESO',
        'ENVIADO': 'ENVIADO',
        'SHIPPED': 'ENVIADO',
        'ENTREGADO': 'ENTREGADO',
        'DELIVERED': 'ENTREGADO',
        'COMPLETADA': 'ENTREGADO',
        'CANCELADO': 'CANCELADO',
        'CANCELLED': 'CANCELADO'
    };
    return textMap[estado?.toUpperCase()] || 'EN PROCESO';
}

async function loadUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    if (!authService.isAuthenticated()) {
        ordersList.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">Debes iniciar sesión para ver tus pedidos.</p>';
        return;
    }

    const userId = authService.getUserId();
    if (!userId) {
        ordersList.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">Error: No se pudo obtener tu ID de usuario.</p>';
        return;
    }

    ordersList.innerHTML = '<p style="text-align:center; padding:40px;">Cargando pedidos...</p>';

    try {
        const result = await orderService.getUserOrders(userId);

        if (!result.success) {
            throw new Error(result.error || 'Error al obtener pedidos');
        }

        const orders = result.data;
        console.log('📦 Pedidos listos para renderizar:', orders);

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div style="text-align:center; padding:60px 20px;">
                    <div style="font-size:80px; opacity:0.3; margin-bottom:20px;">📦</div>
                    <h3 style="color:#666; margin-bottom:10px;">No tienes pedidos realizados</h3>
                    <p style="color:#999;">Tus pedidos aparecerán aquí una vez que realices tu primera compra</p>
                    <button onclick="window.location.href='/index.html'" style="margin-top:20px; padding:12px 30px; background:#F9BD31; color:#000; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">IR A COMPRAR</button>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = orders.map(order => {
            // Obtener el ID correcto del pedido
            const orderId = order.id || order.idPedido || order.ID_PEDIDO;
            const numeroPedido = order.numeroPedido || order.numero_pedido || orderId;
            
            const statusClass = getStatusClass(order.estado);
            const statusText = getStatusText(order.estado);
            
            // Solo se puede cancelar si está en proceso y NO está ya cancelado
            const canCancel = ['in-process'].includes(statusClass) && 
                             !['CANCELADO', 'CANCELLED'].includes(order.estado?.toUpperCase());

            // Obtener fecha correctamente
            const fecha = order.fechaPedido || order.fecha || order.fecha_pedido;
            const fechaFormateada = fecha ? new Date(fecha).toLocaleDateString('es-MX') : 'Fecha no disponible';

            return `
                <div class="order-item" data-order-id="${orderId}">
                    <div class="order-main">
                        <div class="order-image">
                            <img src="${DEFAULT_IMAGE}" alt="Pedido" onerror="this.src='../images/logo-placeholder.png'">
                        </div>
                        <div class="order-info">
                            <h3 class="order-product-name">Pedido #${numeroPedido}</h3>
                            <p class="order-description">Fecha: ${fechaFormateada}</p>
                            <div class="order-quantity">Total: <strong>$${Number(order.total || 0).toFixed(2)}</strong></div>
                            ${order.detalles && order.detalles.length > 0 ? 
                                `<p class="order-items-count">${order.detalles.length} producto(s)</p>` : 
                                ''
                            }
                        </div>
                    </div>
                    <div class="order-status-section">
                        <div class="order-status ${statusClass}">
                            <span class="status-text">${statusText}</span>
                            <button class="order-menu-btn" onclick="toggleOrderMenu(this)">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="order-dropdown">
                            <button class="order-action-btn repurchase-btn" onclick="repurchaseOrder(${orderId})">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                VOLVER A COMPRAR
                            </button>
                            ${canCancel ? `
                            <button class="order-action-btn cancel-btn" onclick="cancelOrder(${orderId})">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                CANCELAR PEDIDO
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        ordersList.innerHTML = `
            <div style="text-align:center; padding:40px; color:#f44336;">
                <p style="margin-bottom:10px;">❌ Error al cargar tus pedidos</p>
                <p style="font-size:14px; color:#999;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top:20px; padding:10px 24px; background:#4CAF50; color:white; border:none; border-radius:8px; cursor:pointer;">REINTENTAR</button>
            </div>
        `;
    }
}

/**
 * 🆕 Función para volver a comprar los productos de un pedido
 */
window.repurchaseOrder = async function (orderId) {
    try {
        showNotification('Obteniendo información del pedido...', 'info');
        
        // Obtener los detalles del pedido
        const result = await orderService.getOrderById(orderId);
        
        if (!result.success || !result.data) {
            throw new Error('No se pudo obtener la información del pedido');
        }

        const order = result.data;
        
        // Verificar que el pedido tenga detalles
        if (!order.detalles || order.detalles.length === 0) {
            throw new Error('Este pedido no tiene productos disponibles para recompra');
        }

        showNotification('Agregando productos al carrito...', 'info');
        
        const userId = authService.getUserId();
        let addedCount = 0;
        let failedCount = 0;
        
        // Agregar cada producto al carrito
        for (const detalle of order.detalles) {
            try {
                await cartService.addToCart(userId, detalle.productoId, detalle.cantidad);
                addedCount++;
            } catch (error) {
                console.error(`❌ Error agregando producto ${detalle.productoId}:`, error);
                failedCount++;
            }
        }

        if (addedCount > 0) {
            showNotification(`✓ ${addedCount} producto(s) agregados al carrito`, 'success');
            
            if (failedCount > 0) {
                setTimeout(() => {
                    showNotification(`⚠️ ${failedCount} producto(s) no pudieron agregarse`, 'error');
                }, 1500);
            }
            
            // Redirigir al carrito después de 2 segundos
            setTimeout(() => {
                window.location.href = '../html/cart.html';
            }, 2000);
        } else {
            throw new Error('No se pudo agregar ningún producto al carrito');
        }

    } catch (error) {
        console.error('❌ Error en recompra:', error);
        showNotification(error.message || 'Error al volver a comprar', 'error');
    }
}

/**
 * 🆕 Función para cancelar un pedido
 * Utiliza el nuevo endpoint que restaura automáticamente el stock
 */
window.cancelOrder = async function (orderId) {
    // Confirmar la acción
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?\n\nSe restaurará el stock de los productos.')) {
        return;
    }

    const userId = authService.getUserId();
    if (!userId) {
        showNotification('Error: No se pudo obtener tu ID de usuario', 'error');
        return;
    }

    try {
        showNotification('Cancelando pedido...', 'info');
        
        // ✅ CORRECCIÓN: Usar el endpoint correcto de cancelación
        const result = await orderService.cancelOrder(orderId, userId);

        if (!result.success) {
            throw new Error(result.error || 'Error al cancelar pedido');
        }

        showNotification('✓ Pedido cancelado exitosamente. Stock restaurado.', 'success');
        
        // Recargar los pedidos después de 1 segundo
        setTimeout(() => {
            loadUserOrders();
        }, 1000);

    } catch (error) {
        console.error('❌ Error cancelando pedido:', error);
        showNotification(error.message || 'Error al cancelar el pedido', 'error');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 orders.js cargado');

    if (!authService.isAuthenticated()) {
        console.warn('⚠️ Usuario no autenticado, redirigiendo...');
        window.location.href = '../html/login.html';
        return;
    }

    loadUserOrders();
});