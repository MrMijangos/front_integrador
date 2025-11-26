import environment from '../environment/environment.js';

class AuthService {
    constructor() {
        this.baseUrl = `${environment.apiUrl}/api/auth`;
    }

    async register(userData) {
        try {
            const requestBody = {
                nombreCompleto: userData.nombre,
                correo: userData.correo,
                contrasena: userData.contrasenia,
                numCelular: userData.celular || ''
            };

            console.log('📤 Enviando registro a:', `${this.baseUrl}/register`);
            console.log('📦 Body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📊 Status:', response.status);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('El servidor no respondió con JSON');
            }

            const data = await response.json();
            console.log('📥 Respuesta:', data);

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || `Error del servidor: ${response.status}`
                };
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('❌ Error completo:', error);
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    async login(credentials) {
        try {
            const requestBody = {
                correo: credentials.correo,
                contrasena: credentials.contrasena
            };

            console.log('📤 Enviando login a:', `${this.baseUrl}/login`);
            console.log('📦 Body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📊 Status:', response.status);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('El servidor no respondió con JSON');
            }

            const data = await response.json();
            console.log('📥 Respuesta completa del login:', data);
            console.log('👤 Datos del usuario:', data.data);

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || `Error del servidor: ${response.status}`
                };
            }

            // Guardar datos del usuario en localStorage
            if (data.data) {
                // Guardar el objeto completo del usuario
                localStorage.setItem('usuario', JSON.stringify(data.data));
                
                // Guardar el userId
                const userId = data.data.idUsuario || data.data.id_usuario || data.data.id || data.data.ID_Usuario;
                if (userId) {
                    localStorage.setItem('userId', userId);
                }

                console.log('💾 Usuario guardado en localStorage:', JSON.parse(localStorage.getItem('usuario')));
                console.log('🔑 UserId guardado:', localStorage.getItem('userId'));
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('❌ Error completo:', error);
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    logout() {
        console.log('🚪 Cerrando sesión...');
        localStorage.removeItem('usuario');
        localStorage.removeItem('userId');
        window.location.href = '../html/login.html';
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('usuario');
        if (!userStr) return null;
        
        try {
            const user = JSON.parse(userStr);
            console.log('👤 Usuario actual:', user);
            return user;
        } catch (error) {
            console.error('❌ Error parseando usuario:', error);
            return null;
        }
    }

    isAuthenticated() {
        const isAuth = this.getCurrentUser() !== null;
        console.log('🔐 ¿Está autenticado?', isAuth);
        return isAuth;
    }

    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) {
            console.log('❌ No hay usuario - No es admin');
            return false;
        }

        // Buscar el rolId en diferentes posibles nombres de campo
        const rol = user.rolId || user.rol_id || user.ID_Rol || user.rol || user.RolId;
        
        console.log('🎯 Verificando si es admin:');
        console.log('   - Usuario:', user);
        console.log('   - Rol encontrado:', rol, '(tipo:', typeof rol, ')');
        
        const isAdminUser = rol === 1 || rol === '1' || parseInt(rol) === 1;
        console.log('   - ¿Es admin?', isAdminUser);
        
        return isAdminUser;
    }

    getUserId() {
        const userId = localStorage.getItem('userId');
        console.log('🆔 UserId:', userId);
        return userId;
    }
}

const authService = new AuthService();
export default authService;