import apiClient from './api-client.js';

class PaymentService {
    async getAllPaymentMethods() {
        try {
            const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
            const userData = userDataString ? JSON.parse(userDataString) : null;

            const userId = userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;

            if (!userId) {
                console.warn("❌ No hay usuario logueado");
                return { success: false, error: "Usuario no identificado", data: [] };
            }

            console.log('🔍 Obteniendo métodos de pago para usuario:', userId);

            // ✅ CORRECCIÓN: Usar la ruta correcta del backend
            const response = await apiClient.get(`/api/usuarios/${userId}/metodos-pago`);
            console.log('📦 Respuesta completa de la API:', response);

            let paymentsData = [];
            
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    paymentsData = response.data;
                } else if (Array.isArray(response.data.data)) {
                    paymentsData = response.data.data;
                }
            } else if (Array.isArray(response)) {
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

        const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
        const userData = userDataString ? JSON.parse(userDataString) : null;

        console.log("👤 Datos del usuario en LocalStorage:", userData);

        const userId = paymentData.idUsuario || userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;

        if (!userId) {
            console.error('❌ No se pudo obtener el ID del usuario');
            throw new Error("Usuario no identificado: No se encontró el ID");
        }

        console.log('✅ ID de usuario obtenido:', userId);

        // ✅ CORRECCIÓN: Parsear la fecha MM/AA
        const [mes, anio] = paymentData.fecha_expiracion.split('/');

        const requestBody = {
            numeroTarjeta: paymentData.num_tarjeta,
            nombreTitular: paymentData.nombre_tarjeta,
            mesExpiracion: parseInt(mes),
            anioExpiracion: parseInt('20' + anio), // Convertir AA a 20AA
            tipoTarjeta: paymentData.tipo || "CREDITO",
            esPredeterminado: false
        };

        console.log('📤 Enviando request body:', requestBody);

        const response = await apiClient.post(`/api/usuarios/${userId}/metodos-pago`, requestBody);
        
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

            // ✅ Esta ruta ya está correcta
            await apiClient.delete(`/api/metodos-pago/${id}`);

            return { success: true };
        } catch (error) {
            console.error('❌ Error eliminando método de pago:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new PaymentService();