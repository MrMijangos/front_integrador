import apiClient from './api-client.js';
import environment from '../../environment/environment.js';

const API_BASE_URL = environment.apiUrl;

class ReviewService {
    /**
     * Limpia sesiones de administrador y obtiene el usuario cliente correcto
     */
    _getClientUser() {
        // Obtener ambas posibles sesiones
        const userDataString = localStorage.getItem('userData');
        const usuarioString = localStorage.getItem('usuario');
        
        let userData = userDataString ? JSON.parse(userDataString) : null;
        let usuario = usuarioString ? JSON.parse(usuarioString) : null;

        // Verificar y limpiar sesión de admin en 'userData'
        if (userData && (userData.rol === 'ADMIN' || userData.rolId === 1)) {
            console.warn('⚠️ Sesión de ADMIN detectada en userData - eliminando...');
            localStorage.removeItem('userData');
            userData = null;
        }

        // Verificar y limpiar sesión de admin en 'usuario'
        if (usuario && (usuario.rol === 'ADMIN' || usuario.rolId === 1)) {
            console.warn('⚠️ Sesión de ADMIN detectada en usuario - eliminando...');
            localStorage.removeItem('usuario');
            usuario = null;
        }

        // Retornar el usuario cliente válido
        const clientUser = userData || usuario;

        if (!clientUser) {
            console.error('❌ No se encontró ningún usuario cliente válido');
            return null;
        }

        // Verificar que sea un cliente (rol 2 o no-admin)
        if (clientUser.rol === 'ADMIN' || clientUser.rolId === 1) {
            console.error('❌ Solo se encontró usuario ADMIN, se requiere usuario CLIENTE');
            return null;
        }

        return clientUser;
    }

    async addReview(reviewData) {
        try {
            console.log('📝 INICIANDO addReview con datos:', reviewData);

            const user = this._getClientUser();
            if (!user) {
                throw new Error('Usuario no autenticado');
            }

            const userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;

            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario');
            }

            console.log('✅ ID de usuario obtenido:', userId);

            // Estructura según lo que espera el backend
            const requestBody = {
                productoId: parseInt(reviewData.idProducto),
                usuarioId: parseInt(userId),
                calificacion: parseInt(reviewData.calificacion),
                comentario: reviewData.comentario
            };

            console.log('📤 Enviando request body:', requestBody);

            // RUTA CORRECTA del backend: /api/resenas
            const response = await apiClient.post('/api/resenas', requestBody);

            console.log('✅ Respuesta del servidor:', response);

            return { success: true, data: response };
        } catch (error) {
            console.error('❌ Error agregando reseña:', error);
            return { success: false, error: error.message };
        }
    }

    async getProductReviews(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/productos/${productId}/resenas`);
            const data = await response.json();
            
            let reviews = [];
            if (Array.isArray(data)) {
                reviews = data;
            } else if (data && Array.isArray(data.data)) {
                reviews = data.data;
            }
            return { success: true, data: reviews };
        } catch (error) {
            console.error('❌ Error obteniendo reseñas:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async getMyReviews() {
        try {
            console.log('📝 Obteniendo mis reseñas...');

            const user = this._getClientUser();
            if (!user) {
                return { success: false, error: 'Usuario no autenticado', data: [] };
            }

            const userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;

            console.log('👤 Usuario ID:', userId);

            // Obtener todos los productos
            const productsResponse = await apiClient.get('/api/productos');
            
            let products = [];
            if (productsResponse && productsResponse.data) {
                if (Array.isArray(productsResponse.data)) {
                    products = productsResponse.data;
                } else if (Array.isArray(productsResponse.data.data)) {
                    products = productsResponse.data.data;
                }
            }

            console.log('📦 Total de productos:', products.length);

            const allMyReviews = [];

            // Obtener reseñas de cada producto
            for (const product of products) {
                try {
                    const productId = product.idProducto || product.id_producto || product.ID_Producto || product.id;
                    
                    const reviewsResponse = await this.getProductReviews(productId);

                    if (reviewsResponse.success && reviewsResponse.data) {
                        // Filtrar solo las reseñas del usuario actual
                        const myReviews = reviewsResponse.data.filter(review => {
                            // ✅ CORRECCIÓN: Mapear campos del backend (snake_case)
                            const reviewUserId = review.usuario_id || review.usuarioId || review.id_usuario || review.ID_Usuario;
                            return parseInt(reviewUserId) === parseInt(userId);
                        });

                        // Agregar nombre del producto a cada reseña
                        myReviews.forEach(review => {
                            // ✅ Normalizar nombres de productos
                            const productName = product.nombre || product.Nombre || product.nombre_producto || 'Producto';
                            const productImage = product.imagen || product.imagenUrl || product.imagen_url || '../images/productosmiel';
                            
                            review.nombreProducto = productName;
                            review.imagenProducto = productImage;
                            review.productoId = productId;
                        });

                        allMyReviews.push(...myReviews);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error obteniendo reseñas del producto:`, error);
                }
            }

            console.log('✅ Total de mis reseñas:', allMyReviews.length);
            console.log('📋 Reseñas encontradas:', allMyReviews);

            return { success: true, data: allMyReviews };

        } catch (error) {
            console.error('❌ Error obteniendo mis reseñas:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async deleteReview(reviewId) {
        try {
            if (!reviewId) {
                throw new Error('ID de reseña no válido');
            }

            console.log('🗑️ Eliminando reseña ID:', reviewId);

            // ⚠️ NOTA: Necesitas agregar este endpoint en el backend
            // DELETE /api/resenas/{id}
            const response = await apiClient.delete(`/api/resenas/${reviewId}`);
            
            console.log('✅ Reseña eliminada:', response);

            return { success: true, data: response };

        } catch (error) {
            console.error('❌ Error eliminando reseña:', error);
            
            // Si el backend no tiene el endpoint, mostrar un mensaje más específico
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                return { 
                    success: false, 
                    error: 'El backend no tiene el endpoint para eliminar reseñas. Contacta al administrador para agregarlo.' 
                };
            }
            
            return { success: false, error: error.message };
        }
    }
}

export default new ReviewService();