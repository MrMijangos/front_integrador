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

        console.log(' Resultado de getMyReviews:', result);

        container.innerHTML = '';

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            result.data.forEach((review) => {
                console.log(' Procesando reseña:', review);
                const card = createReviewCard(review);
                container.appendChild(card);
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state';
            emptyMsg.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📝</div>
                    <h3 style="color: #666; margin-bottom: 10px;">No tienes reseñas publicadas</h3>
                    <p style="color: #999; font-size: 14px;">Agrega tu primera reseña sobre algún producto</p>
                </div>
            `;
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
    const reviewId = review.id || review.ID_Resena || review.idResena;
    const calificacion = review.calificacion || review.Calificacion || 0;
    const comentario = review.comentario || review.Comentario || '';
    const fecha = review.fecha_creacion || review.Fecha || review.fechaCreacion;
    const productName = review.nombreProducto || 'Producto sin nombre';
    const productImage = review.imagenProducto || '../images/productosmiel';

    const div = document.createElement('div');
    div.className = 'review-item';
    div.style.cssText = `
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 2px solid #e0e0e0;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        overflow: hidden;
    `;

    const stars = generateStars(calificacion);
    const formattedDate = formatDate(fecha);

    div.innerHTML = `
        <!-- Decoración de fondo -->
        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: #F9BD3120; border-radius: 50%; z-index: 0;"></div>
        
        <div style="position: relative; z-index: 1; display: flex; gap: 20px;">
            <!-- Imagen del producto -->
            <div style="flex-shrink: 0;">
                <img src="${productImage}" 
                     alt="${productName}" 
                     style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; border: 2px solid #f0f0f0;"
                     onerror="this.src='../images/productosmiel'">
            </div>

            <!-- Contenido de la reseña -->
            <div style="flex-grow: 1; min-width: 0;">
                <!-- Nombre del producto -->
                <h3 style="margin: 0 0 12px 0; font-size: 1.2em; color: #333; font-weight: bold;">
                    ${productName}
                </h3>

                <!-- Estrellas y fecha -->
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                    <div style="font-size: 20px; color: #F9BD31; letter-spacing: 2px;">
                        ${stars}
                    </div>
                    <div style="font-size: 0.85em; color: #999;">
                        ${formattedDate}
                    </div>
                </div>

                <!-- Comentario -->
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #F9BD31;">
                    <p style="margin: 0; color: #555; line-height: 1.6; font-size: 0.95em;">
                        ${comentario}
                    </p>
                </div>
            </div>

            <!-- Botón eliminar -->
            <div style="flex-shrink: 0; display: flex; align-items: center;">
                <button class="btn-delete-review" data-id="${reviewId}" style="
                    background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(229, 57, 53, 0.4)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(229, 57, 53, 0.3)'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    ELIMINAR
                </button>
            </div>
        </div>
    `;

    div.addEventListener('mouseenter', () => {
        div.style.borderColor = '#F9BD31';
        div.style.boxShadow = '0 6px 20px rgba(249, 189, 49, 0.3)';
        div.style.transform = 'translateY(-4px)';
    });

    div.addEventListener('mouseleave', () => {
        div.style.borderColor = '#e0e0e0';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        div.style.transform = 'translateY(0)';
    });

    const deleteBtn = div.querySelector('.btn-delete-review');
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        if (confirm(`¿Estás seguro de que deseas eliminar esta reseña de "${productName}"?`)) {
            const originalHTML = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> ELIMINANDO...';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.7';

            try {
                const result = await reviewService.deleteReview(reviewId);

                if (result.success) {
                    showNotification('Reseña eliminada exitosamente', 'success');
                    await loadMyReviews();
                } else {
                    showNotification(result.error || 'Error al eliminar', 'error');
                    deleteBtn.innerHTML = originalHTML;
                    deleteBtn.disabled = false;
                    deleteBtn.style.opacity = '1';
                }
            } catch (error) {
                console.error('Error eliminando reseña:', error);
                showNotification('Error de conexión', 'error');
                deleteBtn.innerHTML = originalHTML;
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
            }
        }
    });

    return div;
}

function generateStars(rating) {
    const fullStars = '★'.repeat(Math.max(0, Math.min(5, rating)));
    const emptyStars = '☆'.repeat(Math.max(0, 5 - rating));
    return fullStars + emptyStars;
}

function formatDate(dateValue) {
    if (!dateValue) return 'Fecha desconocida';
    
    try {
        let date;

        if (typeof dateValue === 'number') {
            date = new Date(dateValue);
        }
        else if (typeof dateValue === 'string') {
            const timestamp = parseInt(dateValue);
            if (!isNaN(timestamp)) {
                date = new Date(timestamp);
            } else {
                date = new Date(dateValue.replace(' ', 'T'));
            }
        }
        else if (dateValue instanceof Date) {
            date = dateValue;
        }

        if (!date || isNaN(date.getTime())) {
            return 'Fecha inválida';
        }

        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'Fecha inválida';
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification-toast';

    const colors = {
        success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        error: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
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
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); 
        z-index: 10000;
        font-size: 14px;
        font-weight: bold;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);