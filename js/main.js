let inventario = obtenerInventario();
const input = document.getElementById("nombreProducto");
const select = document.getElementById("categoriaProducto");
const buscarInput = document.getElementById("buscarProducto");

// Variable global para almacenar las categorías
let categoriasDisponibles = [];
// Variable para guardar qué categorías están abiertas
let categoriasAbiertas = new Set();

// Categorías por defecto (fallback si no se puede cargar el JSON)
const CATEGORIAS_DEFAULT = [
    "Alimentos",
    "Limpieza",
    "Higiene",
    "Bebidas",
    "Cocina",
    "Otros"
];

async function cargarCategorias() {
    try {
        // Primero intentar cargar desde localStorage
        let categorias = obtenerCategorias();
        
        if (!categorias) {
            // Detectar si estamos en un entorno file:// (sin servidor)
            const isFileProtocol = window.location.protocol === 'file:';
            
            if (isFileProtocol) {
                // Si estamos en file://, usar categorías por defecto directamente
                // (fetch no funciona con file:// por CORS)
                categorias = CATEGORIAS_DEFAULT;
                guardarCategorias(categorias);
            } else {
                // Si estamos en http/https, intentar cargar desde JSON
                try {
                    const res = await fetch("./data/categorias.json");
                    
                    if (!res.ok) {
                        throw new Error("No se pudo cargar categorias");
                    }
                    
                    categorias = await res.json();
                    // Guardar en localStorage para próximas veces
                    guardarCategorias(categorias);
                } catch (fetchError) {
                    // Si fetch falla (archivo no encontrado, etc.), usar categorías por defecto
                    categorias = CATEGORIAS_DEFAULT;
                    // Guardar las categorías por defecto en localStorage
                    guardarCategorias(categorias);
                }
            }
        }
        
        categoriasDisponibles = categorias;
        
        // Actualizar el select usando la función centralizada
        actualizarSelectCategorias();

        // Renderizar el acordeón de categorías
        renderCategorias();

    } catch (error) {
        // Como último recurso, usar categorías por defecto
        categoriasDisponibles = CATEGORIAS_DEFAULT;
        guardarCategorias(categoriasDisponibles);
        
        // Actualizar el select usando la función centralizada
        actualizarSelectCategorias();
        
        renderCategorias();

        Toastify({
            text: "Usando categorías por defecto ⚠️",
            duration: 2000,
            gravity: "top",
            style: { background: "#FF9800" }
        }).showToast();
    } finally {
        // Asegurar que las categorías estén disponibles
    }
}

// Función para actualizar el select de categorías
function actualizarSelectCategorias() {
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar...";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    categoriasDisponibles.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

cargarCategorias();

// Función para crear objeto literal de producto
function crearProducto(nombre, categoria, cantidad = 1) {
    return {
        nombre: nombre,
        categoria: categoria,
        cantidad: cantidad
    };
}

document.getElementById("btnAgregar").onclick = () => {
    const nombre = input.value.trim().toLowerCase();
    const categoria = select.value;

    if (nombre === "") {
        Toastify({
            text: "Ingresá un nombre para el producto ⚠️",
            duration: 2000,
            style: { background: "#FF9800" }
        }).showToast();
        return;
    }

    if (categoria === "" || categoria === "Seleccionar...") {
        Toastify({
            text: "Seleccioná una categoría ⚠️",
            duration: 2000,
            style: { background: "#FF9800" }
        }).showToast();
        return;
    }

    const existente = inventario.find(p => p.nombre === nombre);
    existente ? existente.cantidad++ : inventario.push(crearProducto(nombre, categoria));

    guardarInventario(inventario);
    // Mantener el filtro de búsqueda si existe
    const termino = buscarInput.value.toLowerCase().trim();
    renderCategorias(termino);

    Toastify({
        text: "Producto agregado ✅",
        duration: 1500,
        style: { background: "#388e3c" }
    }).showToast();

    // Limpiar inputs y resetear select a "Seleccionar..."
    input.value = "";
    // Resetear al primer índice (opción "Seleccionar...")
    select.selectedIndex = 0;
};

function renderCategorias(terminoBusqueda = "") {
    const contenedor = document.getElementById("categoriasContainer");
    
    // Guardar qué categorías están abiertas antes de limpiar
    const categoriasAbiertasAnteriores = new Set();
    contenedor.querySelectorAll(".categoria").forEach(categoriaDiv => {
        const btn = categoriaDiv.querySelector(".categoria-btn");
        const lista = categoriaDiv.querySelector(".productos-lista");
        if (lista && lista.classList.contains("show")) {
            const nombreCategoria = btn.textContent.split(" (")[0]; // Extraer nombre sin el contador
            categoriasAbiertasAnteriores.add(nombreCategoria);
        }
    });
    
    contenedor.innerHTML = ""; 

    // Si no hay categorías cargadas, no hacer nada
    if (!categoriasDisponibles || categoriasDisponibles.length === 0) {
        return;
    }

    // Crear acordeón solo para categorías que tienen productos
    categoriasDisponibles.forEach(nombreCategoria => {
        // Filtrar productos del inventario que pertenecen a esta categoría
        let productosDeCategoria = inventario.filter(p => p.categoria === nombreCategoria);
        
        // Si hay término de búsqueda, filtrar también por nombre
        if (terminoBusqueda) {
            productosDeCategoria = productosDeCategoria.filter(p => 
                p.nombre.toLowerCase().includes(terminoBusqueda)
            );
        }
        
        // Solo mostrar categorías que tienen productos (o si hay búsqueda activa)
        if (productosDeCategoria.length === 0) {
            return;
        }

        // Crear wrapper de la categoría
        const categoriaDiv = document.createElement("div");
        categoriaDiv.classList.add("categoria");

        // Título (botón que expande)
        const btn = document.createElement("button");
        btn.textContent = `${nombreCategoria} (${productosDeCategoria.length})`;
        btn.classList.add("categoria-btn");

        // Lista de productos (ocultos por defecto)
        const lista = document.createElement("ul");
        lista.classList.add("productos-lista"); 

        // Agregar productos del inventario a la lista
        if (productosDeCategoria.length > 0) {
            productosDeCategoria.forEach((producto, index) => {
                const li = document.createElement("li");
                
                // Encontrar el índice real en el inventario
                const inventarioIndex = inventario.findIndex(p => 
                    p.nombre === producto.nombre && p.categoria === producto.categoria
                );
                
                li.innerHTML = `
                    <span>${producto.nombre}</span>
                    <div class="controles">
                        <button class="menos">-</button>
                        <span>${producto.cantidad}</span>
                        <button class="mas">+</button>
                        <button class="eliminar">🗑️</button>
                    </div>
                `;
                
                // Event listeners para los controles
                li.querySelector(".mas").onclick = () => {
                    producto.cantidad++;
                    guardarInventario(inventario);
                    const termino = buscarInput.value.toLowerCase().trim();
                    renderCategorias(termino);
                };
                
                li.querySelector(".menos").onclick = () => {
                    if (producto.cantidad > 1) {
                        producto.cantidad--;
                        guardarInventario(inventario);
                        const termino = buscarInput.value.toLowerCase().trim();
                        renderCategorias(termino);
                    }
                };
                
                li.querySelector(".eliminar").onclick = () => {
                    inventario = inventario.filter((_, i) => i !== inventarioIndex);
                    guardarInventario(inventario);
                    const termino = buscarInput.value.toLowerCase().trim();
                    renderCategorias(termino);
                };
                
                lista.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.textContent = "No hay productos en esta categoría";
            li.style.fontStyle = "italic";
            li.style.color = "#999";
            lista.appendChild(li);
        }

        // Restaurar estado abierto/cerrado si estaba abierta antes
        if (categoriasAbiertasAnteriores.has(nombreCategoria)) {
            lista.classList.add("show");
        }
        
        // Comportamiento de expandir/colapsar
        btn.addEventListener("click", () => {
            lista.classList.toggle("show");
            // Actualizar el set de categorías abiertas
            if (lista.classList.contains("show")) {
                categoriasAbiertas.add(nombreCategoria);
            } else {
                categoriasAbiertas.delete(nombreCategoria);
            }
        });

        categoriaDiv.appendChild(btn);
        categoriaDiv.appendChild(lista);
        contenedor.appendChild(categoriaDiv);
    });
}

// Funcionalidad del modal para agregar categoría
const modal = document.getElementById("modalCategoria");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");
const guardarCategoriaBtn = document.getElementById("guardarCategoriaBtn");
const cerrarModalBtn = document.getElementById("cerrarModalBtn");
const nuevaCategoriaInput = document.getElementById("nuevaCategoriaInput");

// Abrir modal
btnNuevaCategoria.onclick = () => {
    modal.classList.add("show");
    nuevaCategoriaInput.value = "";
    nuevaCategoriaInput.focus();
};

// Cerrar modal
cerrarModalBtn.onclick = () => {
    modal.classList.remove("show");
};

// Guardar nueva categoría
guardarCategoriaBtn.onclick = () => {
    const nuevaCategoria = nuevaCategoriaInput.value.trim();
    
    if (nuevaCategoria === "") {
        Toastify({
            text: "Ingresá un nombre para la categoría ⚠️",
            duration: 2000,
            style: { background: "#FF9800" }
        }).showToast();
        return;
    }
    
    // Verificar que no exista
    if (categoriasDisponibles.includes(nuevaCategoria)) {
        Toastify({
            text: "Esta categoría ya existe ⚠️",
            duration: 2000,
            style: { background: "#FF9800" }
        }).showToast();
        return;
    }
    
    // Agregar la nueva categoría
    categoriasDisponibles.push(nuevaCategoria);
    guardarCategorias(categoriasDisponibles);
    
    // Actualizar el select usando la función centralizada
    actualizarSelectCategorias();
    
    // Seleccionar automáticamente la nueva categoría en el select
    select.value = nuevaCategoria;
    
    // Actualizar el acordeón (mantener búsqueda si existe)
    const termino = buscarInput.value.toLowerCase().trim();
    renderCategorias(termino);
    
    // Cerrar modal
    modal.classList.remove("show");
    
    Toastify({
        text: "Categoría agregada y seleccionada ✅",
        duration: 1500,
        style: { background: "#388e3c" }
    }).showToast();
};

// Cerrar modal al hacer clic fuera
modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
};

// Funcionalidad del buscador
buscarInput.addEventListener("input", (e) => {
    const termino = e.target.value.toLowerCase().trim();
    renderCategorias(termino);
});

// Funcionalidad del modal de gestión de categorías
const modalGestionar = document.getElementById("modalGestionarCategorias");
const btnGestionarCategorias = document.getElementById("btnGestionarCategorias");
const cerrarGestionarBtn = document.getElementById("cerrarGestionarBtn");
const listaCategoriasGestionar = document.getElementById("listaCategoriasGestionar");

// Función para renderizar categorías en el modal de gestión
function renderCategoriasGestionar() {
    listaCategoriasGestionar.innerHTML = "";
    
    if (!categoriasDisponibles || categoriasDisponibles.length === 0) {
        listaCategoriasGestionar.innerHTML = "<p style='color: #999;'>No hay categorías disponibles</p>";
        return;
    }
    
    categoriasDisponibles.forEach(categoria => {
        // Contar productos de esta categoría
        const productosDeCategoria = inventario.filter(p => p.categoria === categoria);
        const cantidadProductos = productosDeCategoria.length;
        
        const categoriaDiv = document.createElement("div");
        categoriaDiv.classList.add("categoria-gestionar-item");
        
        categoriaDiv.innerHTML = `
            <div class="categoria-info">
                <span class="categoria-nombre">${categoria}</span>
                <span class="categoria-productos">${cantidadProductos} producto${cantidadProductos !== 1 ? 's' : ''}</span>
            </div>
            <button class="btn-eliminar-categoria" data-categoria="${categoria}" ${cantidadProductos > 0 ? 'disabled' : ''}>
                ${cantidadProductos > 0 ? '🔒 Con productos' : '🗑️ Eliminar'}
            </button>
        `;
        
        // Event listener para eliminar
        const btnEliminar = categoriaDiv.querySelector(".btn-eliminar-categoria");
        if (cantidadProductos === 0) {
            btnEliminar.onclick = () => {
                mostrarConfirmacionEliminar(categoria);
            };
        } else {
            btnEliminar.title = `No se puede eliminar: tiene ${cantidadProductos} producto${cantidadProductos !== 1 ? 's' : ''}`;
        }
        
        listaCategoriasGestionar.appendChild(categoriaDiv);
    });
}

// Función para eliminar una categoría
function eliminarCategoria(categoria) {
    // Remover de la lista
    categoriasDisponibles = categoriasDisponibles.filter(cat => cat !== categoria);
    guardarCategorias(categoriasDisponibles);
    
    // Actualizar el select
    actualizarSelectCategorias();
    
    // Actualizar el acordeón
    const termino = buscarInput.value.toLowerCase().trim();
    renderCategorias(termino);
    
    // Actualizar el modal de gestión
    renderCategoriasGestionar();
    
    Toastify({
        text: `Categoría "${categoria}" eliminada ✅`,
        duration: 2000,
        style: { background: "#388e3c" }
    }).showToast();
}

// Abrir modal de gestión
btnGestionarCategorias.onclick = () => {
    renderCategoriasGestionar();
    modalGestionar.classList.add("show");
};

// Cerrar modal de gestión
cerrarGestionarBtn.onclick = () => {
    modalGestionar.classList.remove("show");
};

// Cerrar modal al hacer clic fuera
modalGestionar.onclick = (e) => {
    if (e.target === modalGestionar) {
        modalGestionar.classList.remove("show");
    }
};

// Modal de confirmación para eliminar categoría
const modalConfirmarEliminar = document.getElementById("modalConfirmarEliminar");
const mensajeConfirmarEliminar = document.getElementById("mensajeConfirmarEliminar");
const confirmarEliminarBtn = document.getElementById("confirmarEliminarBtn");
const cancelarEliminarBtn = document.getElementById("cancelarEliminarBtn");
let categoriaAEliminar = null;

function mostrarConfirmacionEliminar(categoria) {
    categoriaAEliminar = categoria;
    mensajeConfirmarEliminar.textContent = `¿Estás seguro de eliminar la categoría "${categoria}"?`;
    modalConfirmarEliminar.classList.add("show");
}

confirmarEliminarBtn.onclick = () => {
    if (categoriaAEliminar) {
        eliminarCategoria(categoriaAEliminar);
        categoriaAEliminar = null;
        modalConfirmarEliminar.classList.remove("show");
    }
};

cancelarEliminarBtn.onclick = () => {
    categoriaAEliminar = null;
    modalConfirmarEliminar.classList.remove("show");
};

modalConfirmarEliminar.onclick = (e) => {
    if (e.target === modalConfirmarEliminar) {
        categoriaAEliminar = null;
        modalConfirmarEliminar.classList.remove("show");
    }
};
