let inventario = obtenerInventario();
const input = document.getElementById("nombreProducto");
const select = document.getElementById("categoriaProducto");
const buscarInput = document.getElementById("buscarProducto");
let categoriasDisponibles = [];
let categoriasAbiertas = new Set();

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
        let categorias = obtenerCategorias();
        
        if (!categorias) {
            const isFileProtocol = window.location.protocol === 'file:';
            
            if (isFileProtocol) {
                categorias = CATEGORIAS_DEFAULT;
                guardarCategorias(categorias);
            } else {
                try {
                    const res = await fetch("./data/categorias.json");
                    
                    if (!res.ok) {
                        throw new Error("No se pudo cargar categorias");
                    }
                    
                    categorias = await res.json();
                    guardarCategorias(categorias);
                } catch (fetchError) {
                    categorias = CATEGORIAS_DEFAULT;
                    guardarCategorias(categorias);
                }
            }
        }
        
        categoriasDisponibles = categorias;
        
        actualizarSelectCategorias();
        renderCategorias();

    } catch (error) {
        categoriasDisponibles = CATEGORIAS_DEFAULT;
        guardarCategorias(categoriasDisponibles);
        actualizarSelectCategorias();
        
        renderCategorias();

        Toastify({
            text: "Usando categorías por defecto ⚠️",
            duration: 2000,
            gravity: "top",
            style: { background: "#FF9800" }
        }).showToast();
    } finally {
    }
}

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
    const termino = buscarInput.value.toLowerCase().trim();
    renderCategorias(termino);

    Toastify({
        text: "Producto agregado ✅",
        duration: 1500,
        style: { background: "#388e3c" }
    }).showToast();

    input.value = "";
    select.selectedIndex = 0;
};

function renderCategorias(terminoBusqueda = "") {
    const contenedor = document.getElementById("categoriasContainer");
    
    const categoriasAbiertasAnteriores = new Set();
    contenedor.querySelectorAll(".categoria").forEach(categoriaDiv => {
        const btn = categoriaDiv.querySelector(".categoria-btn");
        const lista = categoriaDiv.querySelector(".productos-lista");
        if (lista && lista.classList.contains("show")) {
            const nombreCategoria = btn.textContent.split(" (")[0];
            categoriasAbiertasAnteriores.add(nombreCategoria);
        }
    });
    
    contenedor.innerHTML = ""; 

    if (!categoriasDisponibles || categoriasDisponibles.length === 0) {
        return;
    }

    categoriasDisponibles.forEach(nombreCategoria => {
        let productosDeCategoria = inventario.filter(p => p.categoria === nombreCategoria);
        
        if (terminoBusqueda) {
            productosDeCategoria = productosDeCategoria.filter(p => 
                p.nombre.toLowerCase().includes(terminoBusqueda)
            );
        }
        
        if (productosDeCategoria.length === 0) {
            return;
        }

        const categoriaDiv = document.createElement("div");
        categoriaDiv.classList.add("categoria");

        const btn = document.createElement("button");
        btn.textContent = `${nombreCategoria} (${productosDeCategoria.length})`;
        btn.classList.add("categoria-btn");

        const lista = document.createElement("ul");
        lista.classList.add("productos-lista"); 

        if (productosDeCategoria.length > 0) {
            productosDeCategoria.forEach((producto, index) => {
                const li = document.createElement("li");
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

        if (categoriasAbiertasAnteriores.has(nombreCategoria)) {
            lista.classList.add("show");
        }
        
        btn.addEventListener("click", () => {
            lista.classList.toggle("show");
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

const modal = document.getElementById("modalCategoria");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");
const guardarCategoriaBtn = document.getElementById("guardarCategoriaBtn");
const cerrarModalBtn = document.getElementById("cerrarModalBtn");
const nuevaCategoriaInput = document.getElementById("nuevaCategoriaInput");

btnNuevaCategoria.onclick = () => {
    modal.classList.add("show");
    nuevaCategoriaInput.value = "";
    nuevaCategoriaInput.focus();
};

cerrarModalBtn.onclick = () => {
    modal.classList.remove("show");
};

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
    
    if (categoriasDisponibles.includes(nuevaCategoria)) {
        Toastify({
            text: "Esta categoría ya existe ⚠️",
            duration: 2000,
            style: { background: "#FF9800" }
        }).showToast();
        return;
    }
    
    categoriasDisponibles.push(nuevaCategoria);
    guardarCategorias(categoriasDisponibles);
    actualizarSelectCategorias();
    select.value = nuevaCategoria;
    
    const termino = buscarInput.value.toLowerCase().trim();
    renderCategorias(termino);
    
    modal.classList.remove("show");
    
    Toastify({
        text: "Categoría agregada y seleccionada ✅",
        duration: 1500,
        style: { background: "#388e3c" }
    }).showToast();
};

modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
};

buscarInput.addEventListener("input", (e) => {
    const termino = e.target.value.toLowerCase().trim();
    renderCategorias(termino);
});

const modalGestionar = document.getElementById("modalGestionarCategorias");
const btnGestionarCategorias = document.getElementById("btnGestionarCategorias");
const cerrarGestionarBtn = document.getElementById("cerrarGestionarBtn");
const listaCategoriasGestionar = document.getElementById("listaCategoriasGestionar");

function renderCategoriasGestionar() {
    listaCategoriasGestionar.innerHTML = "";
    
    if (!categoriasDisponibles || categoriasDisponibles.length === 0) {
        listaCategoriasGestionar.innerHTML = "<p style='color: #999;'>No hay categorías disponibles</p>";
        return;
    }
    
    categoriasDisponibles.forEach(categoria => {
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

function eliminarCategoria(categoria) {
    categoriasDisponibles = categoriasDisponibles.filter(cat => cat !== categoria);
    guardarCategorias(categoriasDisponibles);
    actualizarSelectCategorias();
    
    const termino = buscarInput.value.toLowerCase().trim();
    renderCategorias(termino);
    renderCategoriasGestionar();
    
    Toastify({
        text: `Categoría "${categoria}" eliminada ✅`,
        duration: 2000,
        style: { background: "#388e3c" }
    }).showToast();
}

btnGestionarCategorias.onclick = () => {
    renderCategoriasGestionar();
    modalGestionar.classList.add("show");
};

cerrarGestionarBtn.onclick = () => {
    modalGestionar.classList.remove("show");
};

modalGestionar.onclick = (e) => {
    if (e.target === modalGestionar) {
        modalGestionar.classList.remove("show");
    }
};

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
