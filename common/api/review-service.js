import apiClient from './api-client.js';
import authService from '../../services/auth-service.js';

class ReviewService {
    async addReview(reviewData) {
        try {
            console.log('📝 INICIANDO addReview con datos:', reviewData);

            const user = authService.getCurrentUser();
            if (!user) {
                throw new Error('Usuario no autenticado');
            }

            const userId = user.id || user.idUsuario || user.id_usuario || user.ID_Usuario;

            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario');
            }

            console.log('✅ ID de usuario obtenido:', userId);

            // ✅ CORRECCIÓN: Estructura según lo que espera el backend
            const requestBody = {
                productoId: parseInt(reviewData.idProducto),
                usuarioId: parseInt(userId),
                calificacion: parseInt(reviewData.calificacion),
                comentario: reviewData.comentario
            };

            console.log('📤 Enviando request body:', requestBody);

            // ✅ RUTA CORRECTA del backend: /api/resenas
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
            if (!productId) {
                throw new Error('ID de producto no válido');
            }

            console.log('📝 Obteniendo reseñas para producto:', productId);

            // ✅ RUTA CORRECTA del backend: /api/productos/{productoId}/resenas
            const response = await apiClient.get(`/api/productos/${productId}/resenas`);

            console.log('✅ Reseñas obtenidas:', response);

            let reviewsData = [];
            
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    reviewsData = response.data;
                } else if (Array.isArray(response.data.data)) {
                    reviewsData = response.data.data;
                }
            } else if (Array.isArray(response)) {
                reviewsData = response;
            }

            return { success: true, data: reviewsData };
        } catch (error) {
            console.error('❌ Error obteniendo reseñas del producto:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async getMyReviews() {
        try {
            console.log('📝 Obteniendo mis reseñas...');

            const user = authService.getCurrentUser();
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
                            const reviewUserId = review.idUsuario || review.id_usuario || review.ID_Usuario;
                            return parseInt(reviewUserId) === parseInt(userId);
                        });

                        // Agregar nombre del producto a cada reseña
                        myReviews.forEach(review => {
                            review.nombreProducto = product.nombre;
                            review.imagenProducto = product.imagen || '../images/productosmiel';
                        });

                        allMyReviews.push(...myReviews);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error obteniendo reseñas del producto:`, error);
                }
            }

            console.log('✅ Total de mis reseñas:', allMyReviews.length);

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

            // ⚠️ NOTA: El backend no tiene endpoint de DELETE
            // Si necesitas esta funcionalidad, debes agregarla al backend
            // Por ahora, retorno un error informativo
            throw new Error('El backend no tiene endpoint para eliminar reseñas. Contacta al administrador.');

            // Cuando el backend tenga el endpoint, descomenta esto:
            // const response = await apiClient.delete(`/api/resenas/${reviewId}`);
            // return { success: true, data: response };

        } catch (error) {
            console.error('❌ Error eliminando reseña:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new ReviewService();