/* ============================================================
   carrito.js – Módulo de carrito para Viper Scale
   Funciona con localStorage para persistir entre páginas.
   ============================================================ */

/* ============================================================
   carrito.js – Módulo de carrito para Viper Scale
   Funciona con localStorage para persistir dentro de una misma página,
   y con parámetros en la URL para persistir ENTRE páginas cuando el
   sitio se abre con doble clic (file://), ya que en ese caso cada
   archivo .html es tratado como un origen distinto y no comparte
   localStorage ni window.name.
   ============================================================ */

const CLAVE_CARRITO = "viperscale_carrito";



function obtenerCarrito() {
    if (window.name && window.name.startsWith(CLAVE_CARRITO + "=")) {
        try {
            let data = JSON.parse(window.name.substring(CLAVE_CARRITO.length + 1));
            return data;
        } catch (e) { }
    }
    let guardado = localStorage.getItem(CLAVE_CARRITO);
    if (guardado) {
        return JSON.parse(guardado);
    }
    return [];
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    window.name = CLAVE_CARRITO + "=" + JSON.stringify(carrito);
}

/* ----------- Codificar / decodificar carrito para pasarlo por la URL -----------
   Necesario porque en file:// cada .html es un origen distinto y no
   comparte localStorage. Codificamos en Base64 (seguro para UTF-8,
   por los acentos de "Escala", "Marca", etc.) y lo mandamos como
   parámetro ?carrito=... en los links internos. */

function codificarCarritoURL(carrito) {
    try {
        let json = JSON.stringify(carrito);
        let utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, function (_, p1) {
            return String.fromCharCode("0x" + p1);
        });
        return encodeURIComponent(btoa(utf8));
    } catch (e) {
        return "";
    }
}

function decodificarCarritoURL(texto) {
    try {
        let utf8 = atob(decodeURIComponent(texto));
        let json = decodeURIComponent(utf8.split("").map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

/* Al cargar cualquier página, si viene un ?carrito=... en la URL,
   lo usamos como fuente de verdad y lo guardamos en el localStorage
   de ESTA página, para que el resto del código funcione sin cambios. */

function sincronizarCarritoDesdeURL() {
    let params = new URLSearchParams(window.location.search);
    let dato = params.get("carrito");
    if (dato) {
        let carrito = decodificarCarritoURL(dato);
        if (carrito) {
            guardarCarrito(carrito);
        }
        // Limpiamos el parámetro de la barra de direcciones (no rompe nada en file://)
        params.delete("carrito");
        let queryRestante = params.toString();
        let nuevaURL = window.location.pathname + (queryRestante ? "?" + queryRestante : "") + window.location.hash;
        window.history.replaceState({}, "", nuevaURL);
    }
}

/* Interceptamos los clics en links internos para adjuntarles el estado
   actual del carrito antes de navegar. Usamos delegación de eventos
   sobre document para que también funcione con el ícono flotante,
   que se inyecta dinámicamente. */

function interceptarNavegacionInterna() {
    document.addEventListener("click", function (e) {
        let link = e.target.closest("a");
        if (!link) return;

        let href = link.getAttribute("href");
        if (!href) return;

        // Ignorar links externos, anclas, o especiales
        if (/^([a-z]+:)?\/\//i.test(href)) return; // http://, https://, //...
        if (href.startsWith("#")) return;
        if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
        if (link.target === "_blank") return;

        e.preventDefault();

        let carrito = obtenerCarrito();
        let datos = codificarCarritoURL(carrito);
        let separador = href.includes("?") ? "&" : "?";
        window.location.href = href + separador + "carrito=" + datos;
    });
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
    window.name = "";
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
            transition: transform 0.3s;
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
    });
    icono.addEventListener("mouseleave", function () {
        icono.style.transform = "scale(1)";
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
    sincronizarCarritoDesdeURL();
    interceptarNavegacionInterna();
    inyectarIconoCarrito();
    actualizarBadge();
    conectarBotonesAgregar();
});