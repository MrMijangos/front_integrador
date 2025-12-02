import environment from '../../environment/environment.js';

const API_BASE_URL = environment.apiUrl;

const orderService = {
    
    async createOrder(orderData) {
        try {
            console.log('📦 INICIANDO createOrder con datos:', orderData);

            // Obtener datos del usuario del localStorage
            const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
            const userData = userDataString ? JSON.parse(userDataString) : null;
            
            // Buscar ID en orderData o en localStorage
            const userId = orderData.idUsuario || userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;

            if (!userId) {
                console.error('❌ No se pudo obtener el ID del usuario');
                return { success: false, error: "Usuario no identificado" };
            }

            console.log('✅ ID de usuario obtenido:', userId);

            // Mapeo del body según backend
            const backendData = {
                metodoPagoId: parseInt(orderData.idMetodoPago),
                direccionId: parseInt(orderData.idDireccion),
                notasCliente: orderData.notasCliente || ''
            };

            console.log('📤 Enviando request body:', backendData);

            const response = await fetch(`${API_BASE_URL}/api/usuarios/${userId}/pedidos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear el pedido');
            }

            console.log('✅ Pedido creado exitosamente:', data);
            return { success: true, data: data };

        } catch (error) {
            console.error('❌ Error en createOrder:', error);
            return { success: false, error: error.message || 'Error de conexión' };
        }
    },

    async getUserOrders(userId) {
        try {
            // Intentar obtener ID si no viene como parámetro
            if (!userId) {
                const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
                const userData = userDataString ? JSON.parse(userDataString) : null;
                userId = userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;
            }

            if (!userId) {
                return { success: false, error: "Usuario no identificado" };
            }

            console.log('📦 Obteniendo pedidos para usuario:', userId);

            const response = await fetch(`${API_BASE_URL}/api/usuarios/${userId}/pedidos`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const rawData = await response.json();
            console.log('✅ Pedidos obtenidos (raw):', rawData);

            // Normalizar la respuesta (por si viene envuelta en { data: [...] } o es array directo)
            let ordersData = [];
            if (Array.isArray(rawData)) {
                ordersData = rawData;
            } else if (rawData && Array.isArray(rawData.data)) {
                ordersData = rawData.data;
            } else if (rawData && rawData.data) {
                // Caso raro donde data no es array pero existe
                ordersData = [rawData.data]; 
            }

            return { success: true, data: ordersData };

        } catch (error) {
            console.error('❌ Error obteniendo órdenes del usuario:', error);
            return { success: false, error: error.message };
        }
    },

    async getAllOrders() {
        try {
            console.log('📦 Obteniendo todos los pedidos (admin)');
            
            const response = await fetch(`${API_BASE_URL}/api/pedidos`);
            const rawData = await response.json();

            let ordersData = [];
            if (Array.isArray(rawData)) {
                ordersData = rawData;
            } else if (rawData && Array.isArray(rawData.data)) {
                ordersData = rawData.data;
            }

            return { success: response.ok, data: ordersData };

        } catch (error) {
            console.error('❌ Error obteniendo todos los pedidos:', error);
            return { success: false, error: error.message };
        }
    },

    async getOrderById(orderId) {
        try {
            if (!orderId) throw new Error("ID de pedido no válido");

            console.log('📦 Obteniendo pedido ID:', orderId);
            const response = await fetch(`${API_BASE_URL}/api/pedidos/${orderId}`);
            const rawData = await response.json();

            // Normalizar respuesta
            let orderData = null;
            if (rawData && rawData.data) {
                orderData = rawData.data;
            } else if (rawData && rawData.id) {
                orderData = rawData;
            }

            return { success: response.ok, data: orderData };

        } catch (error) {
            console.error('❌ Error obteniendo pedido:', error);
            return { success: false, error: error.message };
        }
    },

    async updateOrderStatus(orderId, newStatus) {
        try {
            if (!orderId) throw new Error("ID de pedido no válido");

            console.log('✏️ Actualizando estado del pedido:', orderId, 'a', newStatus);

            // Enviar como Query Parameter según tu lógica original
            const response = await fetch(`${API_BASE_URL}/api/pedidos/${orderId}/estado?estado=${newStatus}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            // Verificar éxito lógico del backend
            if (data && data.success === false) {
                return { success: false, error: data.message };
            }

            return { success: response.ok, data: data };

        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🆕 Cancela un pedido del usuario autenticado
     * Restaura automáticamente el stock de los productos
     */
    async cancelOrder(orderId, userId) {
        try {
            // Intentar obtener userId si no se proporciona
            if (!userId) {
                const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
                const userData = userDataString ? JSON.parse(userDataString) : null;
                userId = userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;
            }

            if (!userId) {
                return { success: false, error: "Usuario no identificado" };
            }

            if (!orderId) {
                throw new Error("ID de pedido no válido");
            }

            console.log('🚫 Cancelando pedido:', orderId, 'del usuario:', userId);

            const response = await fetch(
                `${API_BASE_URL}/api/usuarios/${userId}/pedidos/${orderId}/cancelar`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al cancelar pedido');
            }

            console.log('✅ Pedido cancelado exitosamente:', data);
            return { success: true, data: data.data || data };

        } catch (error) {
            console.error('❌ Error en cancelOrder:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🆕 Cancela cualquier pedido (solo administradores)
     * Restaura automáticamente el stock de los productos
     */
    async cancelOrderAdmin(orderId) {
        try {
            if (!orderId) {
                throw new Error("ID de pedido no válido");
            }

            console.log('🔧 Admin cancelando pedido:', orderId);

            const response = await fetch(
                `${API_BASE_URL}/api/pedidos/${orderId}/cancelar`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al cancelar pedido');
            }

            console.log('✅ Pedido cancelado por admin exitosamente:', data);
            return { success: true, data: data.data || data };

        } catch (error) {
            console.error('❌ Error en cancelOrderAdmin:', error);
            return { success: false, error: error.message };
        }
    }
};

export default orderService;