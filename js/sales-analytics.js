import environment from '../environment/environment.js';
import apiClient from '../common/api/api-client.js';
import authService from '../services/auth-service.js';

class SalesAnalytics {
    constructor() {
        this.salesData = [];
        this.quantityChart = null;
        this.revenueChart = null;
        this.init();
    }

    async init() {
        console.log('📊 Inicializando análisis de ventas...');

        if (!authService.isAuthenticated()) {
            alert('Debes iniciar sesión');
            window.location.href = '../html/login.html';
            return;
        }

        if (!authService.isAdmin()) {
            alert('No tienes permisos de administrador');
            window.location.href = '../index.html';
            return;
        }

        await this.loadSalesData();
    }

    async loadSalesData() {
        try {
            console.log('📊 Cargando datos de ventas...');

            const response = await apiClient.get('/api/analytics/ventas');

            console.log('📊 Respuesta completa:', response);

            if (!response || !response.data || !response.data.success) {
                throw new Error('No se recibieron datos válidos del servidor');
            }

            // ✅ Estructura correcta: response.data.data contiene el AnalyticsResponse
            const analyticsData = response.data.data;

            console.log('📊 Analytics data:', analyticsData);

            if (!analyticsData || !analyticsData.detallePorProducto) {
                throw new Error('Estructura de datos inválida');
            }

            // ✅ Mapear a estructura esperada por el frontend
            this.salesData = analyticsData.detallePorProducto.map(item => ({
                nombre: item.productoNombre,
                cantidadVendida: item.cantidadVendida,
                ganancias: parseFloat(item.gananciaTotal)
            }));

            console.log('✅ Datos mapeados:', this.salesData);

            if (this.salesData.length === 0) {
                this.showEmptyState();
                return;
            }

            // ✅ Actualizar estadísticas con datos del backend
            this.updateStatsFromBackend(analyticsData);
            this.renderCharts();
            this.renderTable();

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.showError('Error al cargar los datos de ventas. Por favor, intenta de nuevo.');
        }
    }

    updateStatsFromBackend(analyticsData) {
        // Usar los datos ya calculados por el backend
        document.getElementById('totalProducts').textContent = 
            analyticsData.totalProductosDiferentes;
        
        document.getElementById('totalUnits').textContent = 
            analyticsData.totalUnidadesVendidas.toLocaleString();
        
        document.getElementById('totalRevenue').textContent = 
            `$${parseFloat(analyticsData.gananciasTotales).toLocaleString('es-MX', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`;
    }

    updateStats() {
        // Fallback: calcular desde los datos si es necesario
        const totalProducts = this.salesData.length;
        const totalUnits = this.salesData.reduce((sum, item) => sum + item.cantidadVendida, 0);
        const totalRevenue = this.salesData.reduce((sum, item) => sum + item.ganancias, 0);

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalUnits').textContent = totalUnits.toLocaleString();
        document.getElementById('totalRevenue').textContent = 
            `$${totalRevenue.toLocaleString('es-MX', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`;
    }

    renderCharts() {
        // Limitar a top 10 para mejor visualización
        const topData = this.salesData.slice(0, 10);

        const labels = topData.map(item => item.nombre);
        const quantities = topData.map(item => item.cantidadVendida);
        const revenues = topData.map(item => item.ganancias);

        // Colores del tema: amarillo/dorado
        const mainColor = 'rgba(249, 189, 49, 0.8)';
        const borderColor = 'rgba(249, 189, 49, 1)';

        // Gráfica de Cantidad
        const ctxQuantity = document.getElementById('quantityChart').getContext('2d');
        if (this.quantityChart) {
            this.quantityChart.destroy();
        }
        this.quantityChart = new Chart(ctxQuantity, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: quantities,
                    backgroundColor: mainColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function (context) {
                                return `Vendidas: ${context.parsed.y} unidades`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Gráfica de Ganancias
        const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }
        this.revenueChart = new Chart(ctxRevenue, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ganancias',
                    data: revenues,
                    backgroundColor: mainColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function (context) {
                                return `Ganancias: $${context.parsed.y.toLocaleString('es-MX', { 
                                    minimumFractionDigits: 2 
                                })}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 12
                            },
                            callback: function (value) {
                                return '$' + value.toLocaleString('es-MX');
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderTable() {
        const tbody = document.getElementById('salesTableBody');

        if (this.salesData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">
                        No hay datos de ventas disponibles
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.salesData.map(item => {
            const avgPrice = item.ganancias / item.cantidadVendida;
            return `
                <tr>
                    <td><strong>${item.nombre}</strong></td>
                    <td>${item.cantidadVendida} unidades</td>
                    <td>$${item.ganancias.toLocaleString('es-MX', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    })}</td>
                    <td>$${avgPrice.toLocaleString('es-MX', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    })}</td>
                </tr>
            `;
        }).join('');
    }

    showEmptyState() {
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalUnits').textContent = '0';
        document.getElementById('totalRevenue').textContent = '$0.00';

        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h3 style="color: #718096; margin-bottom: 0.5rem;">
                        No hay datos de ventas
                    </h3>
                    <p style="color: #a0aec0;">
                        Aún no se han registrado ventas de productos
                    </p>
                </td>
            </tr>
        `;

        // Ocultar gráficas si no hay datos
        const chartsSection = document.querySelector('.charts-container');
        if (chartsSection) {
            chartsSection.style.display = 'none';
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 400px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SalesAnalytics();
});