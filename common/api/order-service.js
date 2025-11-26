import apiClient from './api-client.js';

class OrderService {
    async createOrder(orderData) {
        try {
            console.log('📦 INICIANDO createOrder con datos:', orderData);

            const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
            const userData = userDataString ? JSON.parse(userDataString) : null;

            const userId = orderData.idUsuario || userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;

            if (!userId) {
                console.error('❌ No se pudo obtener el ID del usuario');
                throw new Error("Usuario no identificado");
            }

            console.log('✅ ID de usuario obtenido:', userId);

            // ✅ CORRECCIÓN: Campos correctos según CreatePedidoRequest.java
            const requestBody = {
                metodoPagoId: parseInt(orderData.idMetodoPago),
                direccionId: parseInt(orderData.idDireccion),
                notasCliente: orderData.notasCliente || ''
            };

            console.log('📤 Enviando request body:', requestBody);

            const response = await apiClient.post(`/api/usuarios/${userId}/pedidos`, requestBody);

            console.log('✅ Respuesta del servidor:', response);

            return { success: true, data: response };
        } catch (error) {
            console.error('❌ Error en createOrder:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserOrders(userId) {
        try {
            if (!userId) {
                const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
                const userData = userDataString ? JSON.parse(userDataString) : null;
                userId = userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;
            }

            if (!userId) {
                throw new Error("Usuario no identificado");
            }

            console.log('📦 Obteniendo pedidos para usuario:', userId);

            const response = await apiClient.get(`/api/usuarios/${userId}/pedidos`);

            console.log('✅ Pedidos obtenidos:', response);

            let ordersData = [];

            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    ordersData = response.data;
                } else if (Array.isArray(response.data.data)) {
                    ordersData = response.data.data;
                }
            } else if (Array.isArray(response)) {
                ordersData = response;
            }

            return { success: true, data: ordersData };
        } catch (error) {
            console.error('❌ Error obteniendo órdenes del usuario:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllOrders() {
        try {
            console.log('📦 Obteniendo todos los pedidos (admin)');

            const response = await apiClient.get('/api/pedidos');

            console.log('✅ Todos los pedidos obtenidos:', response);

            let ordersData = [];

            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    ordersData = response.data;
                } else if (Array.isArray(response.data.data)) {
                    ordersData = response.data.data;
                }
            } else if (Array.isArray(response)) {
                ordersData = response;
            }

            return { success: true, data: ordersData };
        } catch (error) {
            console.error('❌ Error obteniendo todos los pedidos:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrderById(orderId) {
        try {
            if (!orderId) {
                throw new Error("ID de pedido no válido");
            }

            console.log('📦 Obteniendo pedido ID:', orderId);

            const response = await apiClient.get(`/api/pedidos/${orderId}`);

            console.log('✅ Pedido obtenido:', response);

            return { success: true, data: response.data || response };
        } catch (error) {
            console.error('❌ Error obteniendo pedido:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            if (!orderId) {
                throw new Error("ID de pedido no válido");
            }

            console.log('✏️ Actualizando estado del pedido:', orderId, 'a', newStatus);

            // ✅ CORRECCIÓN: Enviar como query parameter, no body
            const response = await apiClient.patch(`/api/pedidos/${orderId}/estado?estado=${newStatus}`, {});

            console.log('✅ Respuesta del servidor:', response);

            // Verificar si realmente fue exitoso
            if (response && response.data && response.data.success === false) {
                throw new Error(response.data.message || 'Error al actualizar estado');
            }

            return { success: true, data: response };
        } catch (error) {
            console.error('❌ Error actualizando estado del pedido:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new OrderService();