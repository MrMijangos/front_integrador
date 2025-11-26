// common/api/comment-service.js
import apiClient from './api-client.js';

class CommentService {
    /**
     * Obtiene todos los comentarios de un producto específico
     * @param {number} productId - ID del producto
     */
    async getCommentsByProduct(productId) {
        try {
            const comments = await apiClient.get(`/api/comments/${productId}`);
            return { success: true, data: comments };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Crea un nuevo comentario/reseña
     * @param {Object} commentData - Datos del comentario
     * @param {number} commentData.idProducto - ID del producto
     * @param {number} commentData.idUsuario - ID del usuario
     * @param {number} commentData.calificacion - Calificación (1-5)
     * @param {string} commentData.comentario - Texto del comentario
     */
    async createComment(commentData) {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('usuario'));

            if (!userData) {
                throw new Error('Usuario no autenticado');
            }

            const userId = userData.idUsuario || userData.id_usuario || userData.ID_Usuario || userData.id;

            const comment = await apiClient.post('/api/comments', {
                idProducto: commentData.idProducto,
                idUsuario: userId,
                calificacion: commentData.calificacion,
                comentario: commentData.comentario
            });

            return { success: true, data: comment };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteComment(id) {
        try {
            await apiClient.delete(`/api/comments/${id}`);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default new CommentService();