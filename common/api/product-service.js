import environment from '../../environment/environment.js';

const API_BASE_URL = environment.apiUrl;

const productService = {
    async getAllProducts() {
        try {
            console.log('🌐 Haciendo request a:', `${API_BASE_URL}/api/productos`);
            const response = await fetch(`${API_BASE_URL}/api/productos`);
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            const data = await response.json();
            console.log('📦 Data recibida completa:', data);
            console.log('📦 Tipo de data:', typeof data);
            console.log('📦 Es array?:', Array.isArray(data));
            
            return { 
                success: response.ok, 
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            return { 
                success: false, 
                error: 'Error de conexión',
                details: error.message 
            };
        }
    },

    async getProductById(id) {
        try {
            console.log('🔍 Obteniendo producto ID:', id);
            const response = await fetch(`${API_BASE_URL}/api/productos/${id}`);
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
            console.log('➕ Creando producto:', productData);
            const response = await fetch(`${API_BASE_URL}/api/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
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
            console.log('✏️ Actualizando producto ID:', id, productData);
            const response = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
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
            const response = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
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

export default productService;