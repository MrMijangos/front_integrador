// js/myaddresses.js - CORREGIDO
import shippingService from '../common/api/shipping-service.js';
import authService from '../services/auth-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    localStorage.removeItem('isCheckoutFlow');
    
    if (!authService.isAuthenticated()) {
        alert('Debes iniciar sesión');
        window.location.href = '../html/login.html';
        return;
    }
    await loadAddresses();
});

async function loadAddresses() {
    const container = document.getElementById('addressesList');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center; padding:20px;">Cargando direcciones...</p>';
    
    try {
        const result = await shippingService.getAllShipments();
        console.log('🔍 RESPUESTA COMPLETA de direcciones:', JSON.stringify(result, null, 2));
        
        let direcciones = [];
        
        if (result.success && Array.isArray(result.data)) {
            direcciones = result.data;
        }
        else if (result.data && Array.isArray(result.data.data)) {
            direcciones = result.data.data;
        }
        else if (result.data && result.data.success && Array.isArray(result.data.data)) {
            direcciones = result.data.data;
        }
        else if (Array.isArray(result)) {
            direcciones = result;
        }

        console.log(' Array normalizado:', direcciones);
        
        container.innerHTML = '';
        
        if (direcciones.length > 0) {
            direcciones.reverse().forEach((addr) => {
                console.log('🏠 Procesando dirección:', addr);
                const card = createAddressCard(addr);
                container.appendChild(card);
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerHTML = `<p style="text-align:center; padding:20px; color: #666;">No tienes direcciones guardadas.</p>`;
            container.appendChild(emptyMsg);
        }
        
    } catch (error) {
        console.error(" Error al cargar direcciones:", error);
        container.innerHTML = `<p style="color:red; text-align:center;">Error al cargar direcciones: ${error.message}</p>`;
    } finally {
        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-add-address';
        btnAdd.id = 'btnAddAddress';
        btnAdd.style.cssText = 'margin-top: 15px; width: 100%; padding: 15px; cursor: pointer; background-color: #f4f4f4; border: 2px dashed #ccc; border-radius: 8px; font-weight: bold; color: #555;';
        btnAdd.innerHTML = '<span style="font-size: 1.2em; margin-right: 5px;">+</span> AGREGAR NUEVA DIRECCIÓN';
        btnAdd.addEventListener('click', () => {
            window.location.href = '../html/add-shipping.html';
        });
        container.appendChild(btnAdd);
    }
}

function createAddressCard(addr) {
    const idReal = addr.ID_Direccion || 
                   addr.idDireccion || 
                   addr.id_direccion || 
                   addr.idEnvio || 
                   addr.id || 
                   addr.ID;
    
    console.log(' ID detectado:', idReal, 'de objeto:', addr);
    
    const div = document.createElement('div');
    div.className = 'address-card';
    div.style.cssText = `
        border: 1px solid #ddd; 
        padding: 20px; 
        margin-bottom: 15px; 
        border-radius: 12px; 
        display: flex; 
        align-items: center; 
        justify-content: space-between;
        background: #fff; 
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    `;
    
    div.innerHTML = `
        <div style="flex-grow:1;">
            <p class="address-street" style="font-weight:bold; margin:0 0 8px 0; font-size: 1.1em; color: #333;">
                ${addr.calle}${addr.colonia ? ', ' + addr.colonia : ''}
            </p>
            <p class="address-details" style="margin:0 0 5px 0; color:#666; font-size: 0.95em;">
                ${addr.ciudad}, ${addr.estado}
            </p>
            <p class="address-zip" style="margin:0; font-size:0.9em; color: #999;">
                CP: ${addr.codigoPostal || addr.codigo_postal || ''}
            </p>
        </div>
        
        <button class="btn-delete-address" data-id="${idReal}" style="
            background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
            flex-shrink: 0;
        " title="Eliminar dirección">
            ELIMINAR
        </button>
    `;
    
    div.onmouseover = () => {
        div.style.borderColor = '#f4b41a';
        div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    };
    div.onmouseout = () => {
        div.style.borderColor = '#ddd';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    };
    
    const deleteBtn = div.querySelector('.btn-delete-address');
    deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.transform = 'translateY(-2px)';
        deleteBtn.style.boxShadow = '0 6px 18px rgba(229, 57, 53, 0.5)';
    });
    deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.transform = 'translateY(0)';
        deleteBtn.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.3)';
    });
    
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        if (confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
            const originalText = deleteBtn.textContent;
            deleteBtn.textContent = 'ELIMINANDO...';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.6';
            deleteBtn.style.cursor = 'not-allowed';
            
            try {
                const result = await shippingService.deleteAddress(idReal);
                
                if (result.success) {
                    showNotification('Dirección eliminada exitosamente', 'success');
                    await loadAddresses();
                } else {
                    showNotification(result.error || 'Error al eliminar', 'error');
                    deleteBtn.textContent = originalText;
                    deleteBtn.disabled = false;
                    deleteBtn.style.opacity = '1';
                    deleteBtn.style.cursor = 'pointer';
                }
            } catch (error) {
                console.error('Error eliminando dirección:', error);
                showNotification('Error de conexión', 'error');
                deleteBtn.textContent = originalText;
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
                deleteBtn.style.cursor = 'pointer';
            }
        }
    });
    
    return div;
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
