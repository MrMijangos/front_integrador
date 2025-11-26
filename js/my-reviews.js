import reviewService from '../common/api/review-service.js';
import authService from '../services/auth-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!authService.isAuthenticated()) {
        alert('Debes iniciar sesión');
        window.location.href = '../html/login.html';
        return;
    }

    await loadMyReviews();
});

async function loadMyReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    container.innerHTML = '<p class="empty-msg">Cargando reseñas...</p>';

    try {
        const result = await reviewService.getMyReviews();

        container.innerHTML = '';

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            result.data.forEach((review) => {
                const card = createReviewCard(review);
                container.appendChild(card);
            });
        } else {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-msg';
            emptyMsg.textContent = 'No tienes reseñas publicadas.';
            container.appendChild(emptyMsg);
        }

    } catch (error) {
        console.error("Error al cargar reseñas:", error);
        container.innerHTML = '<p class="empty-msg" style="color:red;">Error al cargar reseñas</p>';
    } finally {
        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-add-review';
        btnAdd.innerHTML = '<span class="plus-icon">+</span><span>AGREGAR NUEVA RESEÑA</span>';
        btnAdd.addEventListener('click', () => {
            window.location.href = '../html/agregar-resena.html';
        });
        container.appendChild(btnAdd);
    }
}

function createReviewCard(review) {
    const reviewId = review.ID_Resena || review.idResena || review.id;
    const div = document.createElement('div');
    div.className = 'review-item';

    const stars = generateStars(review.Calificacion || review.calificacion || 0);
    const productName = review.nombreProducto || 'Producto';
    const comment = review.Comentario || review.comentario || '';
    const fecha = formatDate(review.Fecha || review.fecha);

    div.innerHTML = `
        <div class="review-content">
            <div class="review-info">
                <p class="review-product-name">${productName}</p>
                <p class="review-stars">${stars}</p>
                <p class="review-comment">${comment}</p>
                <p class="review-date">${fecha}</p>
            </div>
        </div>
        <button class="btn-delete-review" data-id="${reviewId}">ELIMINAR</button>
    `;

    const deleteBtn = div.querySelector('.btn-delete-review');
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        if (confirm('¿Estás seguro de que deseas eliminar esta reseña?')) {
            const originalText = deleteBtn.textContent;
            deleteBtn.textContent = 'ELIMINANDO...';
            deleteBtn.disabled = true;

            try {
                const result = await reviewService.deleteReview(reviewId);

                if (result.success) {
                    showNotification('Reseña eliminada exitosamente', 'success');
                    await loadMyReviews();
                } else {
                    showNotification(result.error || 'Error al eliminar', 'error');
                    deleteBtn.textContent = originalText;
                    deleteBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error eliminando reseña:', error);
                showNotification('Error de conexión', 'error');
                deleteBtn.textContent = originalText;
                deleteBtn.disabled = false;
            }
        }
    });

    return div;
}

function generateStars(rating) {
    const fullStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    return fullStars + emptyStars;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        if (typeof dateString === 'number') {
            const d = new Date(dateString * 1000);
            return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        if (typeof dateString === 'string') {
            const parts = dateString.split(' ');
            if (parts.length === 2) {
                const [datePart, timePart] = parts;
                const [year, month, day] = datePart.split('-');
                const [hour, min, sec] = timePart.split(':');
                const d = new Date(year, month - 1, day, hour, min, sec);
                return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
            }
        }
        return dateString;
    } catch (error) {
        return '';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white; 
        padding: 16px 24px; 
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
        z-index: 10000;
        font-size: 14px;
        font-weight: bold;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
