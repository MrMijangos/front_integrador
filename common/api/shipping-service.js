import apiClient from './api-client.js';

class ShippingService {

    async getAllShipments() {
        try {
            const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
            const userData = userDataString ? JSON.parse(userDataString) : null;

            const userId = userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;

            if (!userId) {
                console.warn("❌ No hay usuario logueado");
                throw new Error("Usuario no identificado");
            }

            console.log('📍 Obteniendo direcciones para usuario:', userId);

            // ✅ RUTA CORRECTA del backend
            const response = await apiClient.get(`/api/usuarios/${userId}/direcciones`);

            console.log('📦 Respuesta de direcciones:', response);

            let addressesData = [];

            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    addressesData = response.data;
                } else if (Array.isArray(response.data.data)) {
                    addressesData = response.data.data;
                }
            } else if (Array.isArray(response)) {
                addressesData = response;
            }

            return { success: true, data: addressesData };
        } catch (error) {
            console.error('❌ Error obteniendo direcciones:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addShippingMethod(data) {
        try {
            console.log('📍 INICIANDO addShippingMethod con datos:', data);

            const userDataString = localStorage.getItem('userData') || localStorage.getItem('usuario');
            const userData = userDataString ? JSON.parse(userDataString) : null;

            const userId = data.idUsuario || userData?.id || userData?.idUsuario || userData?.id_usuario || userData?.ID_Usuario;

            if (!userId) {
                console.error('❌ No se pudo obtener el ID del usuario');
                throw new Error("Usuario no identificado");
            }

            console.log('✅ ID de usuario obtenido:', userId);

            const requestBody = {
                nombreDestinatario: data.nombreDestinatario,
                calle: data.calle,
                numeroExterior: data.numeroExterior,
                numeroInterior: data.numeroInterior || '',
                colonia: data.colonia,
                ciudad: data.ciudad,
                estado: data.estado,
                codigoPostal: data.codigoPostal,
                telefonoContacto: data.telefonoContacto,
                referencias: data.referencias || '',
                esPredeterminada: false
            };

            console.log('📤 Enviando request body:', requestBody);

            // ✅ RUTA CORRECTA del backend
            const response = await apiClient.post(`/api/usuarios/${userId}/direcciones`, requestBody);

            console.log('✅ Respuesta del servidor:', response);

            return { success: true, data: response };
        } catch (error) {
            console.error('❌ Error en addShippingMethod:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteAddress(addressId) {
        try {
            if (!addressId) {
                throw new Error("ID de dirección no válido");
            }

            console.log('🗑️ Eliminando dirección ID:', addressId);

            // ✅ RUTA CORRECTA del backend
            await apiClient.delete(`/api/direcciones/${addressId}`);

            return { success: true };
        } catch (error) {
            console.error('❌ Error eliminando dirección:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAddress(addressId, data) {
        try {
            if (!addressId) {
                throw new Error("ID de dirección no válido");
            }
            
            console.log('✏️ Actualizando dirección ID:', addressId, 'con datos:', data);

            const requestBody = {
                calle: data.calle,
                colonia: data.colonia,
                ciudad: data.ciudad,
                estado: data.estado,
                codigoPostal: data.codigoPostal,
                telefono: data.telefono || '',
                esPredeterminado: data.esPredeterminado || false
            };

            // ✅ RUTA CORRECTA del backend
            const response = await apiClient.put(`/api/direcciones/${addressId}`, requestBody);

            console.log('✅ Dirección actualizada:', response);

            return { success: true, data: response };
        } catch (error) {
            console.error('❌ Error actualizando dirección:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new ShippingService();