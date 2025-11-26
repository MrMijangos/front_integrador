import authService from '../services/auth-service.js';
import reviewService from '../common/api/review-service.js';
import productService from '../common/api/product-service.js';

class ReviewAdmin {
    constructor() {
        this.reviews = [];
        this.init();
    }

    async init() {
        console.log('✅ Inicializando administración de reseñas...');

        if (!authService.isAuthenticated()) {
            alert('Debes iniciar sesión');
            window.location.href = '../html/login.html';
            return;
        }

        if (!authService.isAdmin()) {
            alert('No tienes permisos de administrador');
            window.location.href = '../index.html';
            return;
        }

        await this.loadReviews();
    }

    async loadReviews() {
        try {
            console.log('📝 Cargando todas las reseñas...');

            // Obtener todos los productos
            const productsResult = await productService.getAllProducts();
            
            let products = [];
            if (productsResult.success && productsResult.data) {
                if (Array.isArray(productsResult.data)) {
                    products = productsResult.data;
                } else if (Array.isArray(productsResult.data.data)) {
                    products = productsResult.data.data;
                }
            }

            console.log('📦 Total de productos:', products.length);

            const allReviews = [];

            // Obtener reseñas de cada producto
            for (const product of products) {
                try {
                    const productId = product.idProducto || product.id_producto || product.ID_Producto || product.id;
                    const reviewsResult = await reviewService.getProductReviews(productId);

                    if (reviewsResult.success && reviewsResult.data && reviewsResult.data.length > 0) {
                        // Agregar el nombre del producto a cada reseña
                        const reviewsWithProduct = reviewsResult.data.map(review => ({
                            ...review,
                            nombreProducto: product.nombre || 'Producto'
                        }));
                        
                        allReviews.push(...reviewsWithProduct);
                        console.log(`✅ ${reviewsWithProduct.length} reseñas del producto: ${product.nombre}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error obteniendo reseñas del producto ${product.nombre}:`, error);
                }
            }

            console.log('📊 Total de reseñas cargadas:', allReviews.length);

            this.reviews = allReviews;
            this.renderReviews();
            this.updateStats();
        } catch (error) {
            console.error('❌ Error cargando reseñas:', error);
            this.showNotification('Error al cargar reseñas', 'error');
        }
    }

    renderReviews() {
        const grid = document.getElementById('reviewsGrid');
        if (!grid) {
            console.error('❌ No se encontró el elemento reviewsGrid');
            return;
        }

        if (this.reviews.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No hay reseñas en el sistema</h3>
                    <p>Los clientes aún no han agregado reseñas</p>
                </div>
            `;
            return;
        }

        console.log('🎨 Renderizando', this.reviews.length, 'reseñas');

        grid.innerHTML = this.reviews.map(review => {
            // IDs posibles
            const reviewId = review.id || review.idResena || review.id_resena || review.ID_Resena;
            const usuarioId = review.idUsuario || review.id_usuario || review.ID_Usuario || review.usuarioId;
            const calificacion = review.calificacion || review.Calificacion || 0;
            const comentario = review.comentario || review.Comentario || '';
            const fecha = review.fecha || review.Fecha || review.fechaCreacion || new Date();

            return `
                <div class="review-card" data-review-id="${reviewId}">
                    <div class="review-header">
                        <div>
                            <div class="review-product">${review.nombreProducto || 'Producto'}</div>
                            <div class="review-user">Usuario ID: ${usuarioId}</div>
                            <div class="review-rating">${this.generateStars(calificacion)}</div>
                        </div>
                        <div class="review-actions">
                            <button class="btn-action btn-delete" onclick="reviewAdmin.deleteReview(${reviewId})">
                                Eliminar
                            </button>
                        </div>
                    </div>
                    <div class="review-comment">${comentario}</div>
                    <div class="review-meta">
                        <span>Publicado el ${this.formatDate(fecha)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateStars(rating) {
        const fullStars = '★'.repeat(rating);
        const emptyStars = '☆'.repeat(5 - rating);
        return `${fullStars}${emptyStars} (${rating}/5)`;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha no disponible';
        }
    }

    updateStats() {
        const totalReviews = document.getElementById('totalReviews');
        const averageRating = document.getElementById('averageRating');

        if (totalReviews) {
            totalReviews.textContent = this.reviews.length;
        }

        if (averageRating && this.reviews.length > 0) {
            const totalRating = this.reviews.reduce((sum, review) => {
                const rating = review.calificacion || review.Calificacion || 0;
                return sum + rating;
            }, 0);
            const average = totalRating / this.reviews.length;
            averageRating.textContent = average.toFixed(1);
        } else if (averageRating) {
            averageRating.textContent = '0';
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
            return;
        }

        try {
            const result = await reviewService.deleteReview(reviewId);
            if (result.success) {
                this.showNotification('Reseña eliminada exitosamente', 'success');
                await this.loadReviews();
            } else {
                this.showNotification(result.error || 'Error al eliminar reseña', 'error');
            }
        } catch (error) {
            console.error('❌ Error eliminando reseña:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            min-width: 250px;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reviewAdmin = new ReviewAdmin();
});