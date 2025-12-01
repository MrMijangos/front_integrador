import authService from '../services/auth-service.js';
import reviewService from '../common/api/review-service.js';
import productService from '../common/api/product-service.js';
import environment from '../environment/environment.js'; 

class ReviewAdmin {
    constructor() {
        this.reviews = [];
        this.userMap = {}; 
        this.init();
    }

    async init() {
        console.log(' Inicializando administración de reseñas...');

        if (!authService.isAuthenticated() || !authService.isAdmin()) {
            alert('Acceso denegado');
            window.location.href = '../html/login.html';
            return;
        }

        await this.loadUsersMap(); 
        await this.loadReviews();
    }

  
    async loadUsersMap() {
        try {
            console.log(' Cargando lista de usuarios...');
            const response = await fetch(`${environment.apiUrl}/api/usuarios`);
            const result = await response.json();
            
            const users = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
            
            users.forEach(user => {
                this.userMap[user.id] = user.nombreCompleto || user.nombre_completo || 'Usuario';
            });
            console.log(` Mapa de usuarios creado (${Object.keys(this.userMap).length} usuarios)`);
        } catch (error) {
            console.error(' Error cargando usuarios:', error);
        }
    }

    async loadReviews() {
        try {
            console.log(' Cargando todas las reseñas...');

            const productsResult = await productService.getAllProducts();
            
            let products = [];
            if (productsResult.success && productsResult.data) {
                products = Array.isArray(productsResult.data) ? productsResult.data : productsResult.data.data || [];
            }

            const allReviews = [];

            for (const product of products) {
                try {
                    const productId = product.idProducto || product.id || product.ID_Producto;
                    const reviewsResult = await reviewService.getProductReviews(productId);

                    if (reviewsResult.success && reviewsResult.data && reviewsResult.data.length > 0) {
                        
                        const reviewsWithDetails = reviewsResult.data.map(review => {
                            const userId = review.idUsuario || review.id_usuario || review.usuario_id || review.usuarioId;
                            
                            const userName = this.userMap[userId] || `Usuario ID: ${userId}`;

                            return {
                                ...review,
                                nombreProducto: product.nombre || 'Producto',
                                nombreUsuario: userName 
                            };
                        });
                        
                        allReviews.push(...reviewsWithDetails);
                    }
                } catch (error) {
                    console.warn(`Error en producto ${product.nombre}:`, error);
                }
            }

            this.reviews = allReviews;
            this.renderReviews();
            this.updateStats();
        } catch (error) {
            console.error(' Error cargando reseñas:', error);
            this.showNotification('Error al cargar reseñas', 'error');
        }
    }

    renderReviews() {
        const grid = document.getElementById('reviewsGrid');
        if (!grid) return;

        if (this.reviews.length === 0) {
            grid.innerHTML = '<div class="empty-state"><h3>No hay reseñas</h3></div>';
            return;
        }

        grid.innerHTML = this.reviews.map(review => {
            const reviewId = review.id || review.idResena || review.id_resena;
            const calificacion = review.calificacion || 0;
            const comentario = review.comentario || '';
            const fecha = review.fecha || review.fechaCreacion || new Date();
            
            const nombreUsuario = review.nombreUsuario; 

            return `
                <div class="review-card" data-review-id="${reviewId}">
                    <div class="review-header">
                        <div>
                            <div class="review-product">${review.nombreProducto}</div>
                            <div class="review-user">${nombreUsuario}</div>
                            <div class="review-rating">${this.generateStars(calificacion)}</div>
                        </div>
                        <div class="review-actions">
                            <button class="btn-action btn-delete" onclick="reviewAdmin.deleteReview(${reviewId})">
                                Eliminar
                            </button>
                        </div>
                    </div>
                    <div class="review-comment">"${comentario}"</div>
                    <div class="review-meta">
                        <span>${this.formatDate(fecha)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    
    generateStars(rating) {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    }

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch { return 'Fecha no disponible'; }
    }

    updateStats() {
        const totalElem = document.getElementById('totalReviews');
        const avgElem = document.getElementById('averageRating');
        
        if (totalElem) totalElem.textContent = this.reviews.length;
        
        if (avgElem && this.reviews.length > 0) {
            const total = this.reviews.reduce((sum, r) => sum + (r.calificacion || 0), 0);
            avgElem.textContent = (total / this.reviews.length).toFixed(1);
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('¿Eliminar esta reseña permanentemente?')) return;

        const result = await reviewService.deleteReview(reviewId);
        if (result.success) {
            this.showNotification('Reseña eliminada', 'success');
            await this.loadReviews(); 
        } else {
            this.showNotification('Error al eliminar', 'error');
        }
    }

    showNotification(msg, type) {
        alert(msg); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reviewAdmin = new ReviewAdmin();
});