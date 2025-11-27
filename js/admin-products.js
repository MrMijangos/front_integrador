import environment from "../environment/environment.js";
import authService from '../services/auth-service.js';

let currentProductId = null;
const API_BASE_URL = `${environment.apiUrl}/api`;
const DEFAULT_IMAGE = '../images/productosmiel.jpg'; // ✅ IMAGEN POR DEFECTO CORREGIDA

const productService = {
    async getAllProducts() {
        try {
            console.log('📡 Solicitando productos a:', `${API_BASE_URL}/productos`);
            const response = await fetch(`${API_BASE_URL}/productos`);
            const data = await response.json();
            console.log('📦 Productos recibidos:', data);
            return { success: response.ok, data };
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    async getProductById(id) {
        try {
            console.log('🔍 Obteniendo producto ID:', id);
            const response = await fetch(`${API_BASE_URL}/productos/${id}`);
            const data = await response.json();
            console.log('📦 Producto obtenido:', data);
            return { success: response.ok, data };
        } catch (error) {
            console.error('❌ Error obteniendo producto:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    async createProduct(productData) {
        try {
            const backendData = {
                nombre: productData.nombre,
                descripcion: productData.descripcion,
                precio: productData.precio,
                stock: productData.cantidad,
                imagenUrl: productData.imagen  // ✅ Backend espera imagenUrl
            };

            console.log('➕ Creando producto:', backendData);
            const response = await fetch(`${API_BASE_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });
            const data = await response.json();
            console.log('✅ Producto creado:', data);
            return { success: response.ok, data };
        } catch (error) {
            console.error('❌ Error creando producto:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    async updateProduct(id, productData) {
        try {
            const backendData = {
                nombre: productData.nombre,
                descripcion: productData.descripcion,
                precio: productData.precio,
                stock: productData.cantidad,
                imagenUrl: productData.imagen  // ✅ Backend espera imagenUrl
            };

            console.log('✏️ Actualizando producto ID:', id, backendData);
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });

            if (response.status === 204) {
                console.log('✅ Producto actualizado (204)');
                return { success: true };
            }

            const data = await response.json();
            console.log('✅ Producto actualizado:', data);
            return { success: response.ok, data };
        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    async deleteProduct(id) {
        try {
            console.log('🗑️ Eliminando producto ID:', id);
            const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
                method: 'DELETE'
            });

            if (response.status === 204) {
                console.log('✅ Producto eliminado (204)');
                return { success: true };
            }

            const data = await response.json();
            console.log('✅ Producto eliminado:', data);
            return { success: response.ok, data };
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
};

async function loadProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) {
        console.error('❌ No se encontró .products-grid');
        return;
    }

    productsGrid.innerHTML = '<p style="text-align: center;">Cargando productos...</p>';

    try {
        const result = await productService.getAllProducts();

        if (result.success && result.data) {
            let products = Array.isArray(result.data) ? result.data : [];
            
            console.log('📦 Total productos:', products.length);

            if (products.length > 0) {
                productsGrid.innerHTML = products.map(product => {
                    // ✅ USAR ID Y IMAGEN_URL CORRECTAMENTE
                    const id = product.id || product.idProducto || product.ID_Producto || product.id_producto;
                    const imagen = product.imagenUrl || product.imagen_url || product.imagen || DEFAULT_IMAGE;
                    const stock = product.stock !== undefined ? product.stock : (product.Stock || 0);

                    return `
                        <div class="product-card">
                            <div class="product-image">
                                <img src="${imagen}" 
                                     alt="${product.nombre}" 
                                     onerror="this.src='${DEFAULT_IMAGE}'">
                            </div>
                            <h3 class="product-name">${product.nombre}</h3>
                            <p class="product-price">$${product.precio ? Number(product.precio).toFixed(2) : '0.00'}</p>
                            <p class="product-stock">Stock: ${stock}</p>
                            <button class="btn-edit-product" data-id="${id}">EDITAR</button>
                        </div>
                    `;
                }).join('');

                document.querySelectorAll('.btn-edit-product').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        currentProductId = e.target.dataset.id;
                        console.log('✏️ Editando producto ID:', currentProductId);
                        openEditModal(currentProductId);
                    });
                });
                
                console.log('✅ Productos cargados correctamente');
            } else {
                productsGrid.innerHTML = '<p>No se encontraron productos en la base de datos.</p>';
                console.log('⚠️ No hay productos para mostrar');
            }
        } else {
            productsGrid.innerHTML = '<p>Error al obtener los datos de productos.</p>';
            console.error('❌ Error en la respuesta:', result);
        }
    } catch (error) {
        console.error('❌ Error crítico loading products:', error);
        productsGrid.innerHTML = '<p>Error crítico al cargar productos.</p>';
        showNotification('Error crítico al cargar productos', 'error');
    }
}

async function openEditModal(productId) {
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    try {
        const result = await productService.getProductById(productId);

        if (result.success && result.data) {
            const product = result.data;
            // ✅ USAR IMAGEN_URL DEL BACKEND
            const imagenUrl = product.imagenUrl || product.imagen_url || product.imagen || '';

            document.getElementById('editProductName').value = product.nombre || '';
            document.getElementById('editProductPrice').value = product.precio || '';
            document.getElementById('editProductQuantity').value = product.stock !== undefined ? product.stock : (product.Stock || 0);
            document.getElementById('editProductDescription').value = product.descripcion || '';
            document.getElementById('editProductImageUrl').value = imagenUrl;
            document.getElementById('editStockCount').textContent = product.stock !== undefined ? product.stock : (product.Stock || '0');

            console.log('✅ Modal de edición abierto con producto:', product);
        }
    } catch (error) {
        console.error('❌ Error al cargar producto:', error);
        showNotification('Error al cargar detalles del producto', 'error');
        window.closeEditModal();
    }
}

window.closeAddModal = function () {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        const form = document.getElementById('addProductForm');
        if (form) form.reset();

        const stockCount = document.getElementById('stockCount');
        if (stockCount) stockCount.textContent = '0';

        console.log('🚪 Modal de agregar cerrado');
    }
}

window.closeEditModal = function () {
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentProductId = null;
        console.log('🚪 Modal de edición cerrado');
    }
}

window.deleteProduct = async function () {
    if (!currentProductId) return;

    if (!confirm('¿Estás seguro de que deseas eliminar este producto de forma permanente?')) {
        return;
    }

    try {
        const result = await productService.deleteProduct(currentProductId);
        if (result.success) {
            showNotification('Producto eliminado exitosamente', 'success');
            window.closeEditModal();
            await loadProducts();
        } else {
            showNotification(result.error || 'Error al eliminar producto', 'error');
        }
    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        showNotification('Error de conexión', 'error');
    }
}

window.openAddModal = function () {
    console.log('🔘 Botón agregar producto clickeado - Abriendo modal');
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const form = document.getElementById('addProductForm');
        if (form) form.reset();

        const stockCount = document.getElementById('stockCount');
        if (stockCount) stockCount.textContent = '0';

        console.log('✅ Modal de agregar producto abierto correctamente');
    } else {
        console.error('❌ No se encontró el modal con id: addProductModal');
    }
}

async function handleAddProduct(e) {
    e.preventDefault();

    const productData = {
        nombre: document.getElementById('addProductName').value,
        precio: parseFloat(document.getElementById('addProductPrice').value),
        cantidad: parseInt(document.getElementById('addProductQuantity').value),
        descripcion: document.getElementById('addProductDescription').value,
        imagen: document.getElementById('addProductImageUrl').value
    };

    console.log('📤 Datos del producto a crear:', productData);

    if (!productData.imagen) {
        showNotification('Por favor ingresa la URL de la imagen del producto', 'error');
        return;
    }
    if (isNaN(productData.precio) || isNaN(productData.cantidad)) {
        showNotification('Por favor ingrese números válidos para precio y cantidad', 'error');
        return;
    }

    try {
        const result = await productService.createProduct(productData);
        if (result.success) {
            showNotification('Producto agregado exitosamente', 'success');
            window.closeAddModal();
            await loadProducts();
        } else {
            showNotification(result.error || 'Error al agregar producto', 'error');
        }
    } catch (error) {
        console.error('❌ Error al agregar:', error);
        showNotification('Error de conexión', 'error');
    }
}

async function handleEditProduct(e) {
    e.preventDefault();

    const productData = {
        nombre: document.getElementById('editProductName').value,
        precio: parseFloat(document.getElementById('editProductPrice').value),
        cantidad: parseInt(document.getElementById('editProductQuantity').value),
        descripcion: document.getElementById('editProductDescription').value,
        imagen: document.getElementById('editProductImageUrl').value
    };

    console.log('📤 Datos del producto a actualizar:', productData);
    await updateProductInternal(productData);
}

async function updateProductInternal(productData) {
    try {
        const result = await productService.updateProduct(currentProductId, productData);

        if (result.success) {
            showNotification('Producto actualizado exitosamente', 'success');
            window.closeEditModal();
            await loadProducts();
        } else {
            showNotification(result.error || 'Error al actualizar producto', 'error');
        }
    } catch (error) {
        console.error('❌ Error al actualizar:', error);
        showNotification('Error de conexión', 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ admin-products.js cargado correctamente');
    console.log('🌐 API_BASE_URL:', API_BASE_URL);

    console.log('🔍 Verificando autenticación...');
    const isAuth = authService.isAuthenticated();
    console.log('🔍 ¿Está autenticado?', isAuth);
    
    if (!isAuth) {
        console.log('❌ No autenticado - Redirigiendo a login');
        alert('Debes iniciar sesión como administrador');
        window.location.href = '../html/login.html';
        return;
    }

    const isAdmin = authService.isAdmin();
    console.log('🔍 ¿Es admin?', isAdmin);
    
    if (!isAdmin) {
        console.log('❌ No es admin - Redirigiendo a index');
        alert('No tienes permisos de administrador');
        window.location.href = '../index.html';
        return;
    }

    console.log('✅ Usuario admin verificado - Cargando productos');
    await loadProducts();

    const btnAdd = document.getElementById('btnAddProducts');
    console.log('🔍 Buscando botón con ID: btnAddProducts');
    console.log('🔍 Botón encontrado:', btnAdd);
    
    if (btnAdd) {
        console.log('✅ Agregando evento click al botón');
        btnAdd.addEventListener('click', () => {
            console.log('🔘 Click detectado en btnAddProducts');
            window.openAddModal();
        });
    } else {
        console.error('❌ No se encontró el botón con ID: btnAddProducts');
    }

    setupEventListeners();
});

function setupEventListeners() {
    const addQuantity = document.getElementById('addProductQuantity');
    if (addQuantity) {
        addQuantity.addEventListener('input', (e) => {
            document.getElementById('stockCount').textContent = e.target.value || '0';
        });
    }

    const editQuantity = document.getElementById('editProductQuantity');
    if (editQuantity) {
        editQuantity.addEventListener('input', (e) => {
            document.getElementById('editStockCount').textContent = e.target.value || '0';
        });
    }

    const addForm = document.getElementById('addProductForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddProduct);
        console.log('✅ Event listener agregado a addProductForm');
    }

    const editForm = document.getElementById('editProductForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditProduct);
        console.log('✅ Event listener agregado a editProductForm');
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    const color = type === 'success' ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #e53935 0%, #c62828 100%)';

    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 16px 28px;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-size: 14px;
        font-weight: bold;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.redirectToReviews = function () {
    window.location.href = '../html/administrar-resenas.html';
};