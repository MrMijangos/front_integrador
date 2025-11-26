import apiClient from './api-client.js';

class CartService {
    async getCartItems() {
        try {
            const userString = localStorage.getItem('usuario');
            let userId = null;

            if (userString) {
                const user = JSON.parse(userString);
                userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;
                console.log('👤 Usuario ID extraído:', userId);
            }

            if (!userId) {
                console.warn('⚠️ No hay usuario autenticado');
                return { success: true, data: [] };
            }

            console.log(`🛒 Consultando carrito para Usuario ID: ${userId}`);
            
            const response = await apiClient.get(`/api/carritos/usuario/${userId}`);
            
            console.log('📦 Respuesta COMPLETA de getCartItems:', response);
            console.log('📦 response.data:', response.data);
            
            let items = [];
            
            // ✅ CORRECCIÓN: Si response.data es un objeto con items
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    items = response.data;
                    console.log('✅ Items desde response.data (array)');
                } else if (Array.isArray(response.data.items)) {
                    items = response.data.items;
                    console.log('✅ Items desde response.data.items (array)');
                } else if (Array.isArray(response.data.data)) {
                    items = response.data.data;
                    console.log('✅ Items desde response.data.data (array)');
                } else {
                    console.log('⚠️ response.data no es array, estructura:', response.data);
                    console.log('⚠️ Keys disponibles:', Object.keys(response.data));
                    // Si tiene items dentro
                    if (response.data.items) {
                        items = response.data.items;
                    }
                }
            }
            
            console.log('📊 Items procesados del carrito:', items);
            console.log('📊 Cantidad de items:', items.length);
            
            if (items.length > 0) {
                console.log('🔍 Estructura del primer item:', items[0]);
                console.log('🔍 Keys del primer item:', Object.keys(items[0]));
            }
            
            return { 
                success: true, 
                data: items,
                status: 200 
            };
        } catch (error) {
            console.error('❌ Error al obtener carrito:', error);
            return { 
                success: false, 
                error: error.message,
                data: []
            };
        }
    }

    async addToCart(productId, quantity = 1) {
        try {
            const userString = localStorage.getItem('usuario');
            let userId = null;

            if (userString) {
                const user = JSON.parse(userString);
                userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;
                console.log('👤 [addToCart] Usuario ID extraído:', userId);
            }

            if (!userId) {
                console.error('❌ [addToCart] No hay usuario autenticado');
                throw new Error('Debes iniciar sesión');
            }

            console.log(`🛒 [addToCart] User: ${userId}, Producto: ${productId}, Cantidad: ${quantity}`);
            
            // ✅ CORRECCIÓN: Cambiar idProducto por productoId
            const requestBody = {
                productoId: parseInt(productId),
                cantidad: parseInt(quantity)
            };
            
            console.log('📤 [addToCart] Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await apiClient.post(`/api/carritos/usuario/${userId}/items`, requestBody);
            
            console.log('✅ [addToCart] Respuesta exitosa:', response);
            return { success: true, data: response };
        } catch (error) {
            console.error('❌ [addToCart] Error completo:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFromCart(productoId) {
        try {
            const userString = localStorage.getItem('usuario');
            let userId = null;

            if (userString) {
                const user = JSON.parse(userString);
                userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;
            }

            if (!userId) {
                throw new Error('Debes iniciar sesión');
            }

            console.log('🗑️ [removeFromCart] Eliminando producto ID:', productoId, 'del usuario:', userId);
            
            if (!productoId || isNaN(productoId)) {
                throw new Error("ID inválido");
            }

            const response = await apiClient.delete(`/api/carritos/usuario/${userId}/items/${productoId}`);
            console.log('✅ [removeFromCart] Eliminado con éxito:', response);
            return { success: true };
        } catch (error) {
            console.error('❌ [removeFromCart] Error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCartItem(productId, newQuantity, currentQuantity) {
        try {
            const userString = localStorage.getItem('usuario');
            let userId = null;

            if (userString) {
                const user = JSON.parse(userString);
                userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;
            }

            if (!userId) {
                throw new Error('Debes iniciar sesión');
            }

            console.log(`♻️ [updateCartItem] Usuario: ${userId}, Producto: ${productId}, Nuevo=${newQuantity}`);

            const requestBody = {
                cantidad: parseInt(newQuantity)
            };

            const response = await apiClient.put(`/api/carritos/usuario/${userId}/items/${productId}`, requestBody);
            console.log('✅ [updateCartItem] Actualizado con éxito:', response);
            return { success: true, data: response };
        } catch (error) {
            console.error('❌ [updateCartItem] Error:', error);
            return { success: false, error: error.message };
        }
    }

    async clearCart() {
        try {
            const userString = localStorage.getItem('usuario');
            let userId = null;

            if (userString) {
                const user = JSON.parse(userString);
                userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;
            }

            if (!userId) {
                throw new Error('Debes iniciar sesión');
            }

            console.log('🗑️ [clearCart] Vaciando carrito de usuario:', userId);
            
            const response = await apiClient.delete(`/api/carritos/usuario/${userId}`);
            console.log('✅ [clearCart] Carrito vaciado:', response);
            return { success: true };
        } catch (error) {
            console.error('❌ [clearCart] Error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new CartService();