let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

const input = document.getElementById("nombreProducto");
const btnAgregar = document.getElementById("btnAgregar");
const lista = document.getElementById("listaInventario");

function Producto(nombre, cantidad = 1) {
    this.nombre = nombre;
    this.cantidad = cantidad;
}

function agregarProducto() {
    const nombre = input.value.trim().toLowerCase();
    if (nombre === "") return;

    const existente = inventario.find(p => p.nombre === nombre);
    if (existente) {
        existente.cantidad++;
    } else {
        inventario.push(new Producto(nombre));
    }

    guardarInventario();
    mostrarInventario();
    input.value = "";
}

btnAgregar.onclick = agregarProducto;

function mostrarInventario() {
    lista.innerHTML = "";

    inventario.forEach((producto, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span class="nombre">${producto.nombre}</span>
            <div class="controles">
                <button class="menos">-</button>
                <span>${producto.cantidad}</span>
                <button class="mas">+</button>
                <button class="eliminar">🗑️</button>
            </div>
        `;

        li.querySelector(".mas").onclick = () => {
            producto.cantidad++;
            guardarInventario();
            mostrarInventario();
        };

        li.querySelector(".menos").onclick = () => {
            if (producto.cantidad > 1) {
                producto.cantidad--;
            }
            guardarInventario();
            mostrarInventario();
        };

        li.querySelector(".eliminar").onclick = () => {
            inventario = inventario.filter((_, i) => i !== index);
            guardarInventario();
            mostrarInventario();
        };

        lista.appendChild(li);
    });
}

mostrarInventario();

function guardarInventario() {
    localStorage.setItem("inventario", JSON.stringify(inventario));
}
