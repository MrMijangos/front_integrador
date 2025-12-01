import authService from '../services/auth-service.js';
import productService from '../common/api/product-service.js';
import reviewService from '../common/api/review-service.js';

class ReviewManager {
    constructor() {
        this.selectedRating = 0;
        this.selectedProduct = null;
        this.myReviews = []; 
        this.init();
    }

    async init() {
        if (!authService.isAuthenticated()) {
            this.showNotification('Debes iniciar sesión para agregar una reseña', 'error');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
            return;
        }

        await this.loadMyReviews();
        
        await this.loadProducts();
        this.setupEventListeners();
    }

    async loadMyReviews() {
        try {
            console.log(' Cargando mis reseñas existentes...');
            const result = await reviewService.getMyReviews();
            
            if (result.success && result.data) {
                this.myReviews = result.data;
                console.log('Reseñas del usuario:', this.myReviews);
            }
        } catch (error) {
            console.error(' Error cargando reseñas del usuario:', error);
        }
    }

    hasReviewForProduct(productId) {
        return this.myReviews.some(review => {
            const reviewProductId = review.productoId || 
                                   review.producto_id || 
                                   review.idProducto || 
                                   review.id_producto;
            return parseInt(reviewProductId) === parseInt(productId);
        });
    }

    async loadProducts() {
        try {
            const result = await productService.getAllProducts();
            if (result.success && result.data.length > 0) {
                this.populateProductSelect(result.data);
            } else {
                this.showNotification('No hay productos disponibles', 'error');
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.showNotification('Error al cargar productos', 'error');
        }
    }

    populateProductSelect(products) {
        const select = document.getElementById('productSelect');
        select.innerHTML = '<option value="">Selecciona un producto...</option>';

        products.forEach(product => {
            const id = product.id || product.idProducto || product.ID_Producto || product.id_producto;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${product.nombre} - $${Number(product.precio).toFixed(2)}`;
            option.dataset.product = JSON.stringify(product);
            
            if (this.hasReviewForProduct(id)) {
                option.textContent += '  (Ya reseñado)';
                option.style.color = '#999';
                option.style.fontStyle = 'italic';
            }
            
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });
        });

        document.getElementById('productSelect').addEventListener('change', (e) => {
            this.selectProduct(e.target);
        });

        document.getElementById('reviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
    }

    setRating(rating) {
        this.selectedRating = rating;
        document.getElementById('ratingValue').value = rating;

        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    selectProduct(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        if (selectedOption.value) {
            this.selectedProduct = JSON.parse(selectedOption.dataset.product);
            
            const productId = this.selectedProduct.id || 
                            this.selectedProduct.idProducto || 
                            this.selectedProduct.ID_Producto || 
                            this.selectedProduct.id_producto;
            
            if (this.hasReviewForProduct(productId)) {
                this.showWarningBanner(
                    'Ya has dejado una reseña para este producto. ' +
                    'Si deseas cambiarla, primero elimina la reseña existente desde "Mis Reseñas".'
                );
            } else {
                this.hideWarningBanner();
            }
            
            this.updateProductPreview();
        } else {
            this.selectedProduct = null;
            this.clearProductPreview();
            this.hideWarningBanner();
        }
    }

    showWarningBanner(message) {
        this.hideWarningBanner();
        
        const banner = document.createElement('div');
        banner.id = 'warningBanner';
        banner.style.cssText = `
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 500;
            font-size: 14px;
            line-height: 1.5;
            box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideDown 0.3s ease;
        `;
        
        banner.innerHTML = `
            <span style="font-size: 24px;"></span>
            <div style="flex: 1;">
                ${message}
                <br>
                <a href="./my-reviews.html" style="color: white; text-decoration: underline; font-weight: bold; margin-top: 5px; display: inline-block;">
                    Ver mis reseñas →
                </a>
            </div>
        `;
        
        const form = document.getElementById('reviewForm');
        form.insertBefore(banner, form.firstChild);
    }

    hideWarningBanner() {
        const existingBanner = document.getElementById('warningBanner');
        if (existingBanner) {
            existingBanner.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => existingBanner.remove(), 300);
        }
    }

    updateProductPreview() {
        if (this.selectedProduct) {
            const imgElement = document.getElementById('productImage');
            
            const imgSrc = this.selectedProduct.imagenUrl || 
                          this.selectedProduct.imagen_url || 
                          this.selectedProduct.imagen || 
                          '../images/productosmiel.jpg';

            imgElement.onerror = () => {
                imgElement.onerror = null;
                imgElement.src = '../images/productosmiel.jpg';
            };

            imgElement.src = imgSrc;

            document.getElementById('productName').textContent = this.selectedProduct.nombre;
            document.getElementById('productPrice').textContent =
                `$${Number(this.selectedProduct.precio).toFixed(2)}`;
        }
    }

    clearProductPreview() {
        document.getElementById('productImage').src = '';
        document.getElementById('productName').textContent = 'Selecciona un producto';
        document.getElementById('productPrice').textContent = '-';
    }

    async submitReview() {
        const productId = document.getElementById('productSelect').value;
        const rating = document.getElementById('ratingValue').value;
        const comment = document.getElementById('comment').value.trim();

        if (!productId) {
            this.showNotification('Por favor selecciona un producto', 'error');
            return;
        }

        if (this.hasReviewForProduct(productId)) {
            this.showNotification(
                ' Ya has dejado una reseña para este producto. ' +
                'Para cambiarla, primero elimina la reseña existente.',
                'error'
            );
            return;
        }

        if (!rating) {
            this.showNotification('Por favor selecciona una calificación', 'error');
            return;
        }

        if (!comment) {
            this.showNotification('Por favor escribe un comentario', 'error');
            return;
        }

        if (comment.length < 10) {
            this.showNotification('El comentario debe tener al menos 10 caracteres', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'PUBLICANDO...';
        submitBtn.disabled = true;

        try {
            const result = await reviewService.addReview({
                idProducto: parseInt(productId),
                calificacion: parseInt(rating),
                comentario: comment
            });

            if (result.success) {
                this.showNotification('¡Reseña publicada exitosamente!', 'success');
                
                await this.loadMyReviews();
                
                document.getElementById('reviewForm').reset();
                this.selectedRating = 0;
                this.selectedProduct = null;
                this.clearProductPreview();
                this.hideWarningBanner();
                document.querySelectorAll('.star').forEach(star => {
                    star.classList.remove('active');
                });

                await this.loadProducts();

                setTimeout(() => {
                    window.location.href = './my-reviews.html';
                }, 2000);
            } else {
                this.showNotification(result.error || 'Error al publicar reseña', 'error');
            }
        } catch (error) {
            console.error('Error publicando reseña:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification-custom');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'notification-custom';
        
        const colors = {
            success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            error: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
            info: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            min-width: 250px;
            max-width: 450px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            line-height: 1.5;
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
        }, 5000);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.reviewManager = new ReviewManager();
});