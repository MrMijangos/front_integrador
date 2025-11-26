import { initUserSidebar } from '../common/header/header.js';
import productService from '../common/api/product-service.js';
import cartService from '../common/api/cart-service.js';
import authService from '../services/auth-service.js';

const DEFAULT_IMAGE = '../images/productosmiel';

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

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-cart')) {
                console.log('🎯 Click detectado en botón añadir al carrito');
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
        console.log('🛒 Iniciando addToCart...');
        
        if (!authService.isAuthenticated()) {
            console.log('❌ Usuario no autenticado');
            showNotification('Debes iniciar sesión para agregar productos', 'error');
            setTimeout(() => {
                window.location.href = '../html/login.html';
            }, 1500);
            return;
        }

        const button = e.target;
        const productId = parseInt(button.dataset.id);

        console.log('📦 ID del producto:', productId);

        if (isNaN(productId)) {
            console.error("❌ ID inválido en botón:", button);
            showNotification('Error: ID de producto inválido', 'error');
            return;
        }

        const originalText = button.textContent;
        button.style.transform = 'scale(0.95)';
        button.disabled = true;
        button.textContent = 'Agregando...';

        try {
            const result = await cartService.addToCart(productId, 1);

            if (result.success) {
                console.log('✅ Producto agregado exitosamente');
                await this.loadCart();
                showNotification('✓ Producto agregado al carrito');
                this.openCart();
            } else {
                console.error('❌ Error al agregar:', result.error);
                showNotification(result.error || 'Error al agregar producto', 'error');
            }
        } catch (error) {
            console.error('💥 Error en addToCart:', error);
            showNotification('Error de conexión con el servidor', 'error');
        } finally {
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.disabled = false;
                button.textContent = originalText;
            }, 300);
        }
    }

    // ✅ CORREGIDO: Ahora usa productId
    async removeFromCart(productId) {
        try {
            const result = await cartService.removeFromCart(productId);
            if (result.success) {
                await this.loadCart();
                showNotification('Producto eliminado del carrito');
            }
        } catch (error) {
            showNotification('Error al eliminar producto', 'error');
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
            showNotification('Error al actualizar cantidad', 'error');
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

            if (result.success && result.data && Array.isArray(result.data)) {
                console.log(`✅ Se obtuvieron ${result.data.length} items del carrito`);

                this.items = await Promise.all(
                    result.data.map(async (item) => {
                        const prodId = 
                            item.id_producto || 
                            item.ID_Producto || 
                            item.idProducto || 
                            item.productoId || 
                            item.productId;
                        
                        const detalleId = 
                            item.ID_Detalle || 
                            item.id_detalle || 
                            item.idDetalle || 
                            item.detalleId;
                        
                        const cantidad = 
                            item.cantidad || 
                            item.quantity || 
                            item.cantidadProducto || 
                            1;

                        if (item.nombre && item.precio) {
                            return {
                                cartItemId: detalleId,
                                productId: prodId,
                                name: item.nombre,
                                price: parseFloat(item.precio),
                                image: item.imagen || item.imagen_base64 || DEFAULT_IMAGE,
                                quantity: cantidad
                            };
                        }

                        let productData = {};
                        if (prodId) {
                            try {
                                const productResult = await productService.getProductById(prodId);
                                if (productResult.success && productResult.data) {
                                    productData = productResult.data;
                                }
                            } catch (error) {
                                console.error(`Error obteniendo producto ${prodId}:`, error);
                            }
                        }

                        return {
                            cartItemId: detalleId,
                            productId: prodId,
                            name: productData.nombre || 'Producto',
                            price: parseFloat(productData.precio || 0),
                            image: productData.imagen_base64 || productData.imagen || DEFAULT_IMAGE,
                            quantity: cantidad
                        };
                    })
                );

                this.renderCart();
                this.updateCartCount();
            } else {
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

        if (this.items.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <p>Tu carrito está vacío</p>
                </div>`;
        } else {
            this.cartItemsContainer.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
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
            `).join('');

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
                    // ✅ CORREGIDO: Usa productId directamente
                    if (confirm('¿Eliminar este producto del carrito?')) {
                        this.removeFromCart(id);
                    }
                } else {
                    this.updateQuantity(id, isPlus ? qty + 1 : qty - 1);
                }
            });
        });

        this.cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // ✅ CORREGIDO: Usa productId en lugar de cartId
                const id = parseInt(e.target.dataset.productId);
                if (confirm('¿Eliminar este producto del carrito?')) {
                    this.removeFromCart(id);
                }
            });
        });
    }

    updateCartCount() {
        if (!this.cartCount) return;
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartCount.textContent = totalItems;
        if (totalItems > 0) {
            this.cartCount.classList.add('active');
        } else {
            this.cartCount.classList.remove('active');
        }
    }

    updateTotal() {
        const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (this.cartTotal) {
            this.cartTotal.textContent = `$${total.toFixed(2)}`;
        }
        localStorage.setItem('cartTotal', total.toFixed(2));
    }

    proceedToCheckout() {
        if (this.items.length > 0) {
            window.location.href = '../html/checkout.html';
        } else {
            alert('Tu carrito está vacío. Agrega productos antes de proceder al pago.');
        }
    }
}

async function loadAllProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) {
        console.error('❌ No se encontró .products-grid en el DOM');
        return;
    }

    try {
        console.log('🛒 Cargando productos desde la base de datos...');
        const result = await productService.getAllProducts();
        console.log('📦 Resultado completo de la API:', result);

        if (result.success) {
            let products = [];
            
            if (Array.isArray(result.data)) {
                products = result.data;
                console.log('✅ Productos encontrados (Array directo):', products.length);
            } else if (result.data && Array.isArray(result.data.data)) {
                products = result.data.data;
                console.log('✅ Productos encontrados (result.data.data):', products.length);
            } else if (result.data && Array.isArray(result.data.products)) {
                products = result.data.products;
                console.log('✅ Productos encontrados (result.data.products):', products.length);
            }

            if (products.length > 0) {
                console.log('🎯 Renderizando', products.length, 'productos...');

                productsGrid.innerHTML = products.map(product => {
                    const id = product.idProducto || product.id_producto || product.ID_Producto || product.id;
                    const imgSrc = product.imagen || product.imagen_base64 || DEFAULT_IMAGE;
                    const nombre = product.nombre || 'Producto sin nombre';
                    const precio = product.precio || 0;

                    if (!id) {
                        console.error("❌ Producto sin ID:", product);
                        return '';
                    }

                    return `
                        <div class="product-card">
                            <div class="product-image">
                                <img src="${imgSrc}" alt="${nombre}">
                            </div>
                            <h3 class="product-name">${nombre}</h3>
                            <p class="product-price">$${Number(precio).toFixed(2)}</p>
                            <button class="btn-add-cart" data-id="${id}">AÑADIR AL CARRITO</button>
                        </div>
                    `;
                }).join('');

                console.log('✅ Productos renderizados correctamente');
                console.log('🔍 Botones creados:', document.querySelectorAll('.btn-add-cart').length);
            } else {
                console.log('❌ No hay productos en el array');
                productsGrid.innerHTML = '<p class="empty-msg">No hay productos disponibles.</p>';
            }
        } else {
            console.error('❌ Error en la respuesta de la API:', result);
            productsGrid.innerHTML = `<p class="empty-msg">Error al cargar productos: ${result.error || 'Respuesta inválida'}</p>`;
        }
    } catch (error) {
        console.error('💥 Error crítico loading products:', error);
        productsGrid.innerHTML = `<p class="empty-msg">Error crítico al cargar productos: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando página de productos...');

    if (authService.isAuthenticated()) {
        console.log('✅ Usuario autenticado');
        await authService.getCurrentUser();
    } else {
        console.log('ℹ️ Usuario no autenticado');
    }

    await loadAllProducts();

    window.cart = new ShoppingCart();
    console.log('✅ ShoppingCart inicializado');

    window.userSidebar = initUserSidebar();
    console.log('✅ UserSidebar inicializado');

    console.log('✅ Página de productos lista');
});