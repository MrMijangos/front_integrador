import { initUserSidebar } from '../common/header/header.js';
import productService from '../common/api/product-service.js';
import cartService from '../common/api/cart-service.js';
import authService from '../services/auth-service.js';
import reviewService from '../common/api/review-service.js';

// ✅ IMAGEN POR DEFECTO CORREGIDA
const DEFAULT_IMAGE = './images/productosmiel.jpg';

function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    if (type === 'error') notification.style.background = 'linear-gradient(135deg, #e53935 0%, #c62828 100%)';

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

class ShoppingCart {
    constructor() {
        this.items = [];
        this.init();
        this.loadCart();
    }

    init() {
        this.cartButton = document.getElementById('cartButton');
        this.cartSidebar = document.getElementById('cartSidebar');
        this.cartOverlay = document.getElementById('cartOverlay');
        this.closeCartBtn = document.getElementById('closeCartBtn');
        this.cartItemsContainer = document.getElementById('cartItems');
        this.cartCount = document.getElementById('cartCount');
        this.cartTotal = document.getElementById('cartTotal');

        this.cartButton?.addEventListener('click', () => this.openCart());
        this.closeCartBtn?.addEventListener('click', () => this.closeCart());
        this.cartOverlay?.addEventListener('click', () => this.closeCart());

        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-cart')) {
                this.addToCart(e);
            }
        });

        const checkoutBtn = document.querySelector('.btn-checkout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }
    }

    openCart() {
        this.cartSidebar?.classList.add('active');
        this.cartOverlay?.classList.add('active');
        this.cartSidebar?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        this.cartSidebar?.classList.remove('active');
        this.cartOverlay?.classList.remove('active');
        this.cartSidebar?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    async addToCart(e) {
        if (!authService.isAuthenticated()) {
            showNotification('Debes iniciar sesión', 'error');
            return;
        }

        const button = e.target;
        const productId = parseInt(button.dataset.id);

        if (isNaN(productId)) {
            console.error("ID inválido en botón:", button);
            return;
        }

        const originalText = button.textContent;
        button.style.transform = 'scale(0.95)';
        button.disabled = true;
        button.textContent = '...';

        try {
            const result = await cartService.addToCart(productId, 1);
            if (result.success) {
                await this.loadCart();
                showNotification('Agregado');
                this.openCart();
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
        } finally {
            button.style.transform = 'scale(1)';
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    async removeFromCart(productId) {
        try {
            const result = await cartService.removeFromCart(productId);
            if (result.success) {
                await this.loadCart();
                showNotification('Producto eliminado');
            }
        } catch (error) {
            showNotification('Error al eliminar', 'error');
        }
    }

    async updateQuantity(productId, newQuantity) {
        const item = this.items.find(i => i.productId === productId);
        const currentQuantity = item ? item.quantity : 0;

        try {
            const result = await cartService.updateCartItem(productId, newQuantity, currentQuantity);
            if (result.success) {
                await this.loadCart();
            }
        } catch (error) {
            showNotification('Error al actualizar', 'error');
        }
    }

    async loadCart() {
        if (!authService.isAuthenticated()) {
            this.items = [];
            this.renderCart();
            return;
        }

        try {
            console.log('🛒 Cargando carrito...');
            const result = await cartService.getCartItems();
            console.log('📦 Resultado completo del carrito:', result);

            if (result.success) {
                console.log('🔍 Estructura de result.data:', result.data);
                
                if (result.data && result.data.length > 0) {
                    console.log('🎯 Items del carrito recibidos:');
                    result.data.forEach((item, index) => {
                        console.log(`   ${index + 1}.`, item);
                    });
                }

                this.items = await Promise.all(
                    result.data.map(async (item) => {
                        const prodId = item.id_producto || item.ID_Producto || item.idProducto || item.productoId;
                        const detalleId = item.ID_Detalle || item.id_detalle || item.idDetalle || item.detalleId;
                        const cantidad = item.cantidad || item.quantity || 1;

                        console.log(`🔍 Procesando item - Producto ID: ${prodId}, Detalle ID: ${detalleId}, Cantidad: ${cantidad}`);

                        let productData = {};
                        // ✅ USAR IMAGEN_URL DEL BACKEND
                        let imgSrc = item.imagenUrl || item.imagen_url || item.imagen || DEFAULT_IMAGE;
                        
                        if (prodId) {
                            try {
                                const productResult = await productService.getProductById(prodId);
                                console.log(`📦 Resultado producto ${prodId}:`, productResult);
                                
                                if (productResult.success && productResult.data) {
                                    productData = productResult.data;
                                    // ✅ PRIORIZAR IMAGEN_URL
                                    imgSrc = productData.imagenUrl || productData.imagen_url || productData.imagen || DEFAULT_IMAGE;
                                }
                            } catch (error) {
                                console.error(`❌ Error obteniendo producto ${prodId}:`, error);
                            }
                        }

                        const cartItem = {
                            cartItemId: detalleId,
                            productId: prodId,
                            name: productData.nombre || item.nombre || 'Producto',
                            price: parseFloat(productData.precio || item.precio || 0),
                            image: imgSrc,
                            quantity: cantidad
                        };

                        console.log(`✅ Item procesado:`, cartItem);
                        return cartItem;
                    })
                );

                console.log('🎯 Items finales del carrito:', this.items);
                this.renderCart();
                this.updateCartCount();
            } else {
                console.log('❌ No hay items en el carrito');
                this.items = [];
                this.renderCart();
            }
        } catch (error) {
            console.error('💥 Error loading cart:', error);
            this.items = [];
            this.renderCart();
        }
    }

    renderCart() {
        if (!this.cartItemsContainer) return;

        console.log('🎨 Renderizando carrito con items:', this.items);

        if (this.items.length === 0) {
            console.log('🛒 Carrito vacío, mostrando mensaje');
            this.cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <p>Tu carrito está vacío</p>
                </div>`;
        } else {
            console.log(`🎨 Renderizando ${this.items.length} items del carrito`);
            
            this.cartItemsContainer.innerHTML = this.items.map(item => {
                console.log(`🎨 Renderizando item:`, item);
                
                return `
                    <div class="cart-item">
                        <img src="${item.image}" 
                             alt="${item.name}" 
                             class="cart-item-image" 
                             onerror="this.src='${DEFAULT_IMAGE}'">
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                            <div class="cart-item-quantity">
                                <button class="qty-btn minus" data-product-id="${item.productId}" data-quantity="${item.quantity}">−</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn plus" data-product-id="${item.productId}" data-quantity="${item.quantity}">+</button>
                            </div>
                        </div>
                        <button class="cart-item-remove" data-product-id="${item.productId}" title="Eliminar">✕</button>
                    </div>
                `;
            }).join('');

            console.log('✅ HTML del carrito generado');
            this.attachCartEventListeners();
        }
        this.updateTotal();
    }

    attachCartEventListeners() {
        this.cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.productId);
                const qty = parseInt(e.target.dataset.quantity);
                const isPlus = e.target.classList.contains('plus');

                if (!isPlus && qty <= 1) {
                    if (confirm('¿Eliminar?')) this.removeFromCart(id);
                } else {
                    this.updateQuantity(id, isPlus ? qty + 1 : qty - 1);
                }
            });
        });

        this.cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.productId);
                if (confirm('¿Eliminar?')) this.removeFromCart(id);
            });
        });
    }

    updateCartCount() {
        if (!this.cartCount) return;
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartCount.textContent = totalItems;
        if (totalItems > 0) this.cartCount.classList.add('active');
        else this.cartCount.classList.remove('active');
    }

    updateTotal() {
        const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (this.cartTotal) this.cartTotal.textContent = `$${total.toFixed(2)}`;
        localStorage.setItem('cartTotal', total.toFixed(2));
    }

    proceedToCheckout() {
        if (this.items.length > 0) {
            window.location.href = './html/checkout.html';
        } else {
            alert('Tu carrito está vacío');
        }
    }
}

async function loadAllProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    try {
        console.log('Index: Cargando productos...');
        const result = await productService.getAllProducts();
        console.log('Index: Resultado productos:', result);

        if (result.success) {
            let products = [];
            if (Array.isArray(result.data)) {
                products = result.data;
            } else if (result.data && Array.isArray(result.data.data)) {
                products = result.data.data;
            }

            if (products.length > 0) {
                const limitedProducts = products.slice(0, 3);

                productsGrid.innerHTML = limitedProducts.map(product => {
                    // ✅ USAR ID Y IMAGEN_URL CORRECTAMENTE
                    const id = product.id || product.idProducto || product.id_producto || product.ID_Producto;
                    const imgSrc = product.imagenUrl || product.imagen_url || product.imagen || DEFAULT_IMAGE;

                    if (!id) console.error("Index: Producto sin ID:", product);

                    return `
                        <div class="product-card">
                            <div class="product-image">
                                <img src="${imgSrc}" 
                                     alt="${product.nombre}" 
                                     onerror="this.src='${DEFAULT_IMAGE}'">
                            </div>
                            <h3 class="product-name">${product.nombre}</h3>
                            <p class="product-price">$${Number(product.precio).toFixed(2)}</p>
                            <button class="btn-add-cart" data-id="${id}">AÑADIR AL CARRITO</button>
                        </div>
                    `;
                }).join('');
            } else {
                productsGrid.innerHTML = '<p class="empty-msg">No hay productos disponibles.</p>';
            }
        } else {
            productsGrid.innerHTML = `<p class="empty-msg">Error: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<p class="empty-msg">Error al cargar productos.</p>';
    }
}

function setupReviewButton() {
    const addReviewBtn = document.querySelector('.btn-add-review');

    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', () => {
            if (!authService.isAuthenticated()) {
                showNotification('Debes iniciar sesión para agregar una reseña', 'error');
                setTimeout(() => {
                    window.location.href = './html/login.html';
                }, 1500);
                return;
            }

            window.location.href = './html/agregar-resena.html';
        });
    }
}

async function loadReviews() {
    const reviewsGrid = document.querySelector('.reviews-grid');
    if (!reviewsGrid) return;

    console.log('📝 Cargando reseñas para la página principal...');

    // Obtener productos para las reseñas
    let products = [];
    try {
        const result = await productService.getAllProducts();
        if (result.success && result.data.length > 0) {
            products = result.data.slice(0, 3); // Primeros 3 productos
        }
    } catch (error) {
        console.error('Error obteniendo productos para reseñas:', error);
    }

    // Recolectar todas las reseñas
    let allReviews = [];
    for (const product of products) {
        const productId = product.id || product.idProducto || product.id_producto || product.ID_Producto;
        try {
            const res = await reviewService.getProductReviews(productId);
            let reviewsArr = [];
            
            if (Array.isArray(res)) {
                reviewsArr = res;
            } else if (res && Array.isArray(res.data)) {
                reviewsArr = res.data;
            }

            // Agregar nombre del producto a cada reseña
            reviewsArr.forEach(r => {
                r.nombreProducto = product.nombre;
                r.productoId = productId;
            });
            
            allReviews.push(...reviewsArr);
        } catch (error) {
            console.warn('Error obteniendo reseñas del producto', productId, error);
        }
    }

    console.log('📋 Total de reseñas encontradas:', allReviews.length);

    // Limitar a las 10 más recientes
    const limitedReviews = allReviews.slice(0, 10);

    if (limitedReviews.length === 0) {
        reviewsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📝</div>
                <h3 style="color: #666; margin-bottom: 10px;">No hay reseñas disponibles</h3>
                <p style="color: #999; font-size: 14px;">Sé el primero en dejar una reseña</p>
            </div>
        `;
        return;
    }

    // ✅ Cargar información de usuarios para cada reseña
    const reviewsWithUserData = await Promise.all(
        limitedReviews.map(async (review) => {
            // Extraer ID de usuario del review
            const userId = review.usuario_id || review.usuarioId || review.id_usuario || review.ID_Usuario;
            
            console.log(`👤 Obteniendo datos del usuario ${userId}...`);
            
            let userName = `Usuario #${userId || 'Anónimo'}`;
            let userImage = './images/perfil.png';

            if (userId) {
                try {
                    // ✅ Obtener datos del usuario desde el backend
                    const userResponse = await fetch(`http://54.152.16.222:7000/api/usuarios/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (userResponse.ok) {
                        const userResult = await userResponse.json();
                        console.log(`✅ Respuesta del backend para usuario ${userId}:`, userResult);
                        
                        // El backend devuelve { success: true, data: { ... } }
                        if (userResult.success && userResult.data) {
                            const userData = userResult.data;
                            
                            // Extraer nombre del usuario
                            userName = userData.nombreCompleto || 
                                      userData.nombre_completo || 
                                      userData.nombre || 
                                      `Usuario #${userId}`;
                            
                            console.log(`✅ Nombre extraído: ${userName}`);
                        }
                    } else {
                        console.warn(`⚠️ Error HTTP ${userResponse.status} al obtener usuario ${userId}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error obteniendo datos del usuario ${userId}:`, error);
                    // Mantener nombre por defecto
                }
            }

            return {
                ...review,
                nombreUsuario: userName,
                imagenUsuario: userImage
            };
        })
    );

    console.log('✅ Reseñas con datos de usuario:', reviewsWithUserData);

    // Renderizar reseñas con nombres reales
    reviewsGrid.innerHTML = reviewsWithUserData.map(review => {
        const nombreUsuario = review.nombreUsuario || 'Usuario Anónimo';
        const imagenUsuario = review.imagenUsuario || './images/perfil.png';
        const comentario = review.comentario || review.Comentario || 'Sin comentario';
        const calificacion = review.calificacion || review.Calificacion || 0;
        const fecha = review.fecha_creacion || review.Fecha || review.fechaCreacion;
        const nombreProducto = review.nombreProducto || 'Producto';

        const formattedDate = formatDate(fecha);
        const stars = generateStars(calificacion);

        return `
            <div class="review-card" style="position: relative; overflow: hidden; transition: all 0.3s ease;">
                <!-- Decoración de fondo -->
                <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: #F9BD3115; border-radius: 50%; z-index: 0;"></div>
                
                <div class="review-header" style="position: relative; z-index: 1;">
                    <div class="review-avatar">
                        <img src="${imagenUsuario}" 
                             alt="${nombreUsuario}" 
                             class="review-avatar"
                             onerror="this.src='./images/perfil.png'"
                             style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #F9BD31; background: #f5f5f5;">
                    </div>
                    <div class="review-info">
                        <h4 class="review-name" style="margin: 0 0 8px 0; color: #333; font-weight: bold; font-size: 1.05em;">
                            ${nombreUsuario}
                        </h4>
                        
                        <!-- Estrellas de calificación -->
                        <div style="color: #F9BD31; font-size: 18px; letter-spacing: 2px; margin-bottom: 10px;">
                            ${stars}
                        </div>
                        
                        <!-- Comentario -->
                        <p class="review-text" style="margin: 0; color: #666; line-height: 1.6; font-size: 0.95em;">
                            "${comentario}"
                        </p>
                    </div>
                </div>
                
                <div class="review-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e0e0e0; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.85em;">
                    <span class="review-label" style="background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%); padding: 6px 12px; border-radius: 8px; color: #555; font-weight: 500;">
                        📦 ${nombreProducto}
                    </span>
                    
                    ${formattedDate ? `
                        <span class="review-label" style="background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%); padding: 6px 12px; border-radius: 8px; color: #555; font-weight: 500;">
                            📅 ${formattedDate}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Agregar hover effect a las cards
    document.querySelectorAll('.review-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });

    console.log(' Reseñas renderizadas con nombres reales de usuario en el DOM');
}

function generateStars(rating) {
    const fullStars = '★'.repeat(Math.max(0, Math.min(5, rating)));
    const emptyStars = '☆'.repeat(Math.max(0, 5 - rating));
    return fullStars + emptyStars;
}

function formatDate(fecha) {
    if (!fecha) return '';
    
    try {
        let date;

        if (typeof fecha === 'number') {
            date = new Date(fecha);
        } else if (typeof fecha === 'string') {
            const parts = fecha.split(' ');
            if (parts.length === 2) {
                const [datePart, timePart] = parts;
                const [year, month, day] = datePart.split('-');
                const [hour, min, sec] = timePart.split(':');
                date = new Date(year, month - 1, day, hour, min, sec);
            } else {
                date = new Date(fecha);
            }
        } else if (fecha instanceof Date) {
            date = fecha;
        }

        if (!date || isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return '';
    }
}

class UserSidebar {
    constructor() {
        this.init();
        this.loadUserData();
    }

    init() {
        this.userButton = document.querySelector('.user-btn');
        this.userSidebar = document.getElementById('userSidebar');
        this.userOverlay = document.getElementById('userOverlay');
        this.closeUserBtn = document.getElementById('closeUserBtn');
        this.menuItems = document.querySelectorAll('.user-menu-item');

        this.userButton?.addEventListener('click', () => this.handleUserButtonClick());
        this.closeUserBtn?.addEventListener('click', () => this.closeSidebar());
        this.userOverlay?.addEventListener('click', () => this.closeSidebar());

        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });
    }

    handleUserButtonClick() {
        if (!authService.isAuthenticated()) {
            window.location.href = './html/login.html';
        } else {
            this.openSidebar();
        }
    }

    async loadUserData() {
        if (!authService.isAuthenticated()) return;

        const userData = authService.getCurrentUser();
        if (userData) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = (userData.nombreCompleto || userData.nombre_completo || userData.nombre || 'Usuario').toUpperCase();
            }
        }
    }

    openSidebar() {
        this.userSidebar?.classList.add('active');
        this.userOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.userSidebar?.classList.remove('active');
        this.userOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleMenuClick(e) {
        const section = e.currentTarget.dataset.section;
        this.closeSidebar();

        switch (section) {
            case 'orders':
                window.location.href = './html/orders.html';
                break;
            case 'reviews':
                window.location.href = './html/my-reviews.html';
                break;
            case 'payment':
                window.location.href = './html/mycards.html';
                break;
            case 'addresses':
                window.location.href = './html/addresses.html';
                break;
        }

        if (e.currentTarget.classList.contains('logout-btn')) {
            this.logout();
        }
    }

    async logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            await authService.logout();
            showNotification('Sesión cerrada exitosamente');
            setTimeout(() => {
                window.location.href = './html/login.html';
            }, 1000);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    window.userSidebar = new UserSidebar();

    if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        if (user && (user.rol === 2 || user.rol === 'admin' || user.ID_Rol === 1)) {
            window.location.href = './html/admin-products.html';
            return;
        }
        await authService.getCurrentUser();
    }

    await loadAllProducts();
    await loadReviews();

    window.cart = new ShoppingCart();

    setupReviewButton();
});