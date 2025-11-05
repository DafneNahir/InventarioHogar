document.getElementById("btnResumen").addEventListener("click", () => {
    try {
        const inventario = obtenerInventario();
        
        if (inventario.length === 0) {
            Toastify({ 
                text: "No hay productos en el inventario ⚠️", 
                duration: 2000, 
                style: { background: "#FF9800" } 
            }).showToast();
            return;
        }

        // Agrupar por categoría
        const resumenPorCategoria = inventario.reduce((acc, prod) => {
            if (!acc[prod.categoria]) {
                acc[prod.categoria] = {
                    total: 0,
                    productos: []
                };
            }
            acc[prod.categoria].total += prod.cantidad;
            acc[prod.categoria].productos.push({
                nombre: prod.nombre,
                cantidad: prod.cantidad
            });
            return acc;
        }, {});

        // Generar HTML del resumen
        let html = `
            <div class="resumen-container">
                <h3>Resumen Diario</h3>
                <div class="resumen-categorias">
        `;

        Object.entries(resumenPorCategoria).forEach(([categoria, datos]) => {
            html += `
                <div class="resumen-categoria">
                    <h4>${categoria} (Total: ${datos.total})</h4>
                    <ul class="resumen-productos">
                        ${datos.productos.map(p => 
                            `<li>${p.nombre}: ${p.cantidad}</li>`
                        ).join("")}
                    </ul>
                </div>
            `;
        });

        html += `
                </div>
                <button id="cerrarResumenBtn" class="cerrar-resumen-btn">Cerrar Resumen</button>
            </div>
        `;

        document.getElementById("resumen").innerHTML = html;
        
        // Agregar evento al botón de cerrar
        document.getElementById("cerrarResumenBtn").addEventListener("click", () => {
            document.getElementById("resumen").innerHTML = "";
        });

        Toastify({ 
            text: "Resumen generado ✅", 
            duration: 2000, 
            style: { background: "#43A047" } 
        }).showToast();
    } catch (e) {
        Toastify({ 
            text: "Error generando resumen ❌", 
            duration: 2000, 
            style: { background: "#E53935" } 
        }).showToast();
    } finally {
        // Limpiar cualquier estado temporal si es necesario
    }
});
