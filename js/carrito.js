/* ============================================================
   carrito.js – Módulo de carrito para Viper Scale
   Funciona con localStorage para persistir entre páginas.
   ============================================================ */

const CLAVE_CARRITO = "viperscale_carrito";



function obtenerCarrito() {
    let guardado = localStorage.getItem(CLAVE_CARRITO);
    if (guardado) {
        return JSON.parse(guardado);
    }
    return [];
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

/* ----------- Parsear precio desde texto "$35.000" → 35000 ----------- */

function parsearPrecio(texto) {
    // Quita el signo $, los puntos de miles y espacios
    let limpio = texto.replace(/[$.]/g, "").trim();
    return parseInt(limpio, 10) || 0;
}

/* ----------- Formatear precio: 35000 → "$35.000" ----------- */

function formatearPrecio(numero) {
    return "$" + numero.toLocaleString("es-AR");
}

/* ----------- Agregar producto al carrito ----------- */

function agregarAlCarrito(producto) {
    let carrito = obtenerCarrito();


    let existente = carrito.find(function (item) {
        return item.nombre === producto.nombre &&
            item.escala === producto.escala &&
            item.marca === producto.marca;
    });

    if (existente) {
        existente.cantidad += 1;
    } else {
        producto.cantidad = 1;
        carrito.push(producto);
    }

    guardarCarrito(carrito);
    actualizarBadge();
    mostrarNotificacion(producto.nombre);
}

/* ----------- Quitar una unidad o eliminar del carrito ----------- */

function quitarDelCarrito(indice) {
    let carrito = obtenerCarrito();
    if (indice >= 0 && indice < carrito.length) {
        carrito.splice(indice, 1);
        guardarCarrito(carrito);
    }
}

function cambiarCantidad(indice, nuevaCantidad) {
    let carrito = obtenerCarrito();
    if (indice >= 0 && indice < carrito.length) {
        if (nuevaCantidad <= 0) {
            carrito.splice(indice, 1);
        } else {
            carrito[indice].cantidad = nuevaCantidad;
        }
        guardarCarrito(carrito);
    }
}

function vaciarCarrito() {
    localStorage.removeItem(CLAVE_CARRITO);
}

/* ----------- Calcular total ----------- */

function calcularTotal() {
    let carrito = obtenerCarrito();
    let total = 0;
    for (let item of carrito) {
        total += item.precio * item.cantidad;
    }
    return total;
}

function calcularCantidadTotal() {
    let carrito = obtenerCarrito();
    let cantidad = 0;
    for (let item of carrito) {
        cantidad += item.cantidad;
    }
    return cantidad;
}

/* ----------- Badge del ícono del carrito ----------- */

function actualizarBadge() {
    let badge = document.getElementById("carrito-badge");
    if (badge) {
        let cantidad = calcularCantidadTotal();
        badge.textContent = cantidad;
        if (cantidad > 0) {
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }
}

/* ----------- Notificación al agregar ----------- */

function mostrarNotificacion(nombreProducto) {
    // Eliminar notificación previa si existe
    let previo = document.getElementById("carrito-notificacion");
    if (previo) {
        previo.remove();
    }

    let noti = document.createElement("div");
    noti.id = "carrito-notificacion";
    noti.innerHTML = "✓ <strong>" + nombreProducto + "</strong> agregado al carrito";

    // Estilos inline para que funcione en cualquier página
    noti.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #006400, #228B22);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-family: 'Roboto', sans-serif;
        font-size: 0.95rem;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        z-index: 10000;
        animation: notiEntrar 0.4s ease-out;
        border: 2px solid rgba(255, 255, 0, 0.4);
        max-width: 350px;
    `;

    // Inyectar keyframes si no existen
    if (!document.getElementById("carrito-noti-keyframes")) {
        let style = document.createElement("style");
        style.id = "carrito-noti-keyframes";
        style.textContent = `
            @keyframes notiEntrar {
                from { transform: translateY(30px) scale(0.9); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes notiSalir {
                from { transform: translateY(0) scale(1); opacity: 1; }
                to { transform: translateY(30px) scale(0.9); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(noti);

    setTimeout(function () {
        noti.style.animation = "notiSalir 0.3s ease-in forwards";
        setTimeout(function () {
            if (noti.parentNode) {
                noti.remove();
            }
        }, 300);
    }, 2500);
}

/* ----------- Inyectar ícono flotante del carrito ----------- */

function inyectarIconoCarrito() {
    // Determinar ruta relativa al carrito.html
    let ruta = "pages/carrito.html";
    // Si estamos dentro de /pages/, la ruta es relativa
    if (window.location.pathname.includes("/pages/")) {
        ruta = "carrito.html";
    }

    let iconoHTML = `
        <a href="${ruta}" id="carrito-flotante" title="Ver carrito" style="
            position: fixed;
            top: 22px;
            right: 22px;
            z-index: 9999;
            background: linear-gradient(135deg, #006400, #228B22);
            color: white;
            height: 48px;
            padding: 0 20px 0 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            transition: transform 0.3s, box-shadow 0.3s;
            border: 2px solid rgba(255, 255, 0, 0.5);
            font-family: 'Roboto', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            letter-spacing: 0.3px;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>Tu carrito</span>
            <span id="carrito-badge" style="
                position: absolute;
                top: -6px;
                right: -6px;
                background-color: #FFD700;
                color: #111;
                font-size: 0.75rem;
                font-weight: 900;
                min-width: 22px;
                height: 22px;
                border-radius: 50%;
                display: none;
                align-items: center;
                justify-content: center;
                font-family: 'Roboto', sans-serif;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            ">0</span>
        </a>
    `;

    document.body.insertAdjacentHTML("beforeend", iconoHTML);

    // Hover effect
    let icono = document.getElementById("carrito-flotante");
    icono.addEventListener("mouseenter", function () {
        icono.style.transform = "scale(1.12)";
        icono.style.boxShadow = "0 8px 28px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 0, 0.3)";
    });
    icono.addEventListener("mouseleave", function () {
        icono.style.transform = "scale(1)";
        icono.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.4)";
    });
}

/* ----------- Conectar botones "Agregar al carrito" ----------- */

function conectarBotonesAgregar() {
    let botones = document.querySelectorAll(".card-btn");

    for (let boton of botones) {
        boton.addEventListener("click", function () {
            // Subimos hasta encontrar la card padre
            let card = boton.closest(".card");
            if (!card) return;

            let nombre = card.querySelector(".card-title").textContent.trim();
            let escala = card.querySelector(".card-scale").textContent.replace("Escala:", "").trim();
            let marca = card.querySelector(".card-mark").textContent.replace("Marca:", "").trim();
            let precioTexto = card.querySelector(".card-price").textContent.trim();
            let precio = parsearPrecio(precioTexto);
            let imagen = card.querySelector(".card-img").getAttribute("src");

            let producto = {
                nombre: nombre,
                escala: escala,
                marca: marca,
                precio: precio,
                imagen: imagen,
                cantidad: 1
            };

            agregarAlCarrito(producto);
        });
    }
}

/* ----------- Inicialización ----------- */

document.addEventListener("DOMContentLoaded", function () {
    inyectarIconoCarrito();
    actualizarBadge();
    conectarBotonesAgregar();
});