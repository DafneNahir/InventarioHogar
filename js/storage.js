function guardarInventario(data) {
    localStorage.setItem("inventario", JSON.stringify(data));
}

function obtenerInventario() {
    return JSON.parse(localStorage.getItem("inventario")) || [];
}

function guardarCategorias(data) {
    localStorage.setItem("categorias", JSON.stringify(data));
}

function obtenerCategorias() {
    return JSON.parse(localStorage.getItem("categorias")) || null;
}
