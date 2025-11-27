import apiClient from './api-client.js';

class PaymentService {
    /**
     * Limpia sesiones de administrador y obtiene el usuario cliente correcto
     */
    _getClientUser() {
        // Obtener ambas posibles sesiones
        const userDataString = localStorage.getItem('userData');
        const usuarioString = localStorage.getItem('usuario');
        
        let userData = userDataString ? JSON.parse(userDataString) : null;
        let usuario = usuarioString ? JSON.parse(usuarioString) : null;

        console.log('🔍 Verificando sesiones...');
        console.log('📦 userData:', userData);
        console.log('📦 usuario:', usuario);

        // Verificar y limpiar sesión de admin en 'userData'
        if (userData && (userData.rol === 'ADMIN' || userData.rolId === 1)) {
            console.warn('⚠️ Sesión de ADMIN detectada en userData - eliminando...');
            localStorage.removeItem('userData');
            userData = null;
        }

        // Verificar y limpiar sesión de admin en 'usuario'
        if (usuario && (usuario.rol === 'ADMIN' || usuario.rolId === 1)) {
            console.warn('⚠️ Sesión de ADMIN detectada en usuario - eliminando...');
            localStorage.removeItem('usuario');
            usuario = null;
        }

        // Retornar el usuario cliente válido
        const clientUser = userData || usuario;

        if (!clientUser) {
            console.error('❌ No se encontró ningún usuario cliente válido');
            return null;
        }

        // Verificar que sea un cliente (rol 2 o no-admin)
        if (clientUser.rol === 'ADMIN' || clientUser.rolId === 1) {
            console.error('❌ Solo se encontró usuario ADMIN, se requiere usuario CLIENTE');
            return null;
        }

        console.log('✅ Usuario cliente válido encontrado:', clientUser);
        return clientUser;
    }

    async getAllPaymentMethods() {
        try {
            // ✅ Obtener usuario cliente limpiando sesiones de admin
            const userData = this._getClientUser();

            if (!userData) {
                console.warn("❌ No hay usuario cliente logueado");
                return { success: false, error: "Usuario no identificado", data: [] };
            }

            // ✅ Extraer ID del usuario
            const userId = userData.id || userData.idUsuario || userData.id_usuario || userData.ID_Usuario;

            if (!userId) {
                console.warn("❌ Usuario sin ID válido");
                return { success: false, error: "Usuario sin ID", data: [] };
            }

            console.log('🔍 Obteniendo métodos de pago para usuario:', userId);

            // ✅ Usar la ruta correcta del backend
            const response = await apiClient.get(`/api/usuarios/${userId}/metodos-pago`);
            console.log('📦 Respuesta completa de la API:', response);

            let paymentsData = [];
            
            // ✅ Procesar respuesta del backend
            if (response && response.data) {
                if (response.data.success && Array.isArray(response.data.data)) {
                    // Estructura: { success: true, data: [...] }
                    paymentsData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    // Estructura: { data: [...] }
                    paymentsData = response.data;
                }
            } else if (Array.isArray(response)) {
                // Respuesta directa como array
                paymentsData = response;
            }

            console.log('✅ Métodos de pago procesados:', paymentsData);

            return { 
                success: true, 
                data: paymentsData,
                count: paymentsData.length 
            };
        } catch (error) {
            console.error("❌ Error al obtener métodos de pago:", error);
            return { 
                success: false, 
                error: error.message,
                data: [] 
            };
        }
    }

    async addPaymentMethod(paymentData) {
        try {
            console.log('💳 INICIANDO addPaymentMethod con datos:', paymentData);

            // ✅ Obtener usuario cliente limpiando sesiones de admin
            const userData = this._getClientUser();

            if (!userData) {
                throw new Error("Usuario cliente no identificado");
            }

            console.log("👤 Datos del usuario cliente:", userData);

            // ✅ Extraer ID del usuario
            const userId = paymentData.idUsuario || 
                          userData.id || 
                          userData.idUsuario || 
                          userData.id_usuario || 
                          userData.ID_Usuario;

            if (!userId) {
                console.error('❌ No se pudo obtener el ID del usuario');
                throw new Error("Usuario no identificado: No se encontró el ID");
            }

            console.log('✅ ID de usuario obtenido:', userId);

            // ✅ Parsear la fecha MM/AA
            const [mes, anio] = paymentData.fecha_expiracion.split('/');

            // ✅ Mapear al formato que espera el backend
            const requestBody = {
                numeroTarjeta: paymentData.num_tarjeta,
                nombreTitular: paymentData.nombre_tarjeta,
                mesExpiracion: parseInt(mes),
                anioExpiracion: parseInt('20' + anio), // Convertir AA a 20AA
                tipoTarjeta: paymentData.tipo || "CREDITO",
                esPredeterminado: paymentData.es_predeterminado || false
            };

            console.log('📤 Enviando request body:', requestBody);

            const response = await apiClient.post(
                `/api/usuarios/${userId}/metodos-pago`, 
                requestBody
            );
            
            console.log('✅ Respuesta del servidor:', response);

            return { success: true, data: response };
        } catch (error) {
            console.error('❌ Error en addPaymentMethod:', error);
            return { success: false, error: error.message };
        }
    }

    async deletePaymentMethod(id) {
        try {
            if (!id) {
                throw new Error('ID de método de pago no válido');
            }

            console.log('🗑️ Eliminando método de pago ID:', id);

            await apiClient.delete(`/api/metodos-pago/${id}`);

            return { success: true };
        } catch (error) {
            console.error('❌ Error eliminando método de pago:', error);
            return { success: false, error: error.message };
        }
    }

    async setDefaultPaymentMethod(id, userId) {
        try {
            console.log('⭐ Estableciendo método de pago predeterminado:', id);

            // Primero obtener todos los métodos del usuario
            const methods = await this.getAllPaymentMethods();
            
            if (!methods.success) {
                throw new Error('No se pudieron obtener los métodos de pago');
            }

            // Nota: El backend ya maneja desmarcar otros métodos al crear uno como predeterminado
            // Esta función está disponible por si necesitas cambiar el predeterminado más adelante

            return { success: true };
        } catch (error) {
            console.error('❌ Error estableciendo método predeterminado:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new PaymentService();