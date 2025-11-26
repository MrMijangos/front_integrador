import authService from '../services/auth-service.js';
import productService from '../common/api/product-service.js';
import reviewService from '../common/api/review-service.js';

class ReviewManager {
    constructor() {
        this.selectedRating = 0;
        this.selectedProduct = null;
        this.init();
    }

    init() {
        if (!authService.isAuthenticated()) {
            this.showNotification('Debes iniciar sesión para agregar una reseña', 'error');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
            return;
        }

        this.loadProducts();
        this.setupEventListeners();
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
            const id = product.idProducto || product.ID_Producto || product.id;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${product.nombre} - $${Number(product.precio).toFixed(2)}`;
            option.dataset.product = JSON.stringify(product);
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
            this.updateProductPreview();
        } else {
            this.selectedProduct = null;
            this.clearProductPreview();
        }
    }

    updateProductPreview() {
        if (this.selectedProduct) {
            const imgElement = document.getElementById('productImage');

            imgElement.onerror = null;

            imgElement.onerror = () => {
                imgElement.onerror = null;

                imgElement.src = '../images/productosmiel';


            };

            imgElement.src = this.selectedProduct.imagen || '../images/productosmiel';

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

        // Validaciones
        if (!productId) {
            this.showNotification('Por favor selecciona un producto', 'error');
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
                // Limpiar formulario
                document.getElementById('reviewForm').reset();
                this.selectedRating = 0;
                this.selectedProduct = null;
                this.clearProductPreview();
                document.querySelectorAll('.star').forEach(star => {
                    star.classList.remove('active');
                });

                /*setTimeout(() => {
                    window.location.href = './my-reviews.html';
                }, 2000);*/
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

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.reviewManager = new ReviewManager();
});
