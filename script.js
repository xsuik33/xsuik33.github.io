// ==========================================
// 1. CONFIGURACIÓN SUPABASE (Ofuscación BigInt)
// ==========================================
//URL Base del proyecto en Supabase
const SB_URL = 'https://fetqdwxjgwqveqpxlkdo.supabase.co'; 
/**
*LLave de API ofuscada mediante un número BigInt gigante.
*Se utiliza para poder evitar que la clave en texto plano sea rastreada fácilmente por bots estáticos,
*Convirtiéndola de hexadecimal a caracteres ASCII en el tiempo de ejecución.
*/
const giantKey = 100615832821258747201879750784724274773317267762498582750331297702229543262791998188441147266432313479094512985674394342119510941468102411600565516266545432660970558518194687944663310775405870773502662385482414516456894488301269328649247691661612616919144208569562859805639030408692414584022439062066115080543572897734576315546571701079774824477873741343314395166151692628263831594350385887251575552834079507716176589327418645192336699613087691836840236515808459718495948167210299694443098825929953776513815507968779656577509487n;
//Proceso de desofucación BigInt --> Hexadecimal --> ASCII
let hexString = giantKey.toString(16);
if (hexString.length % 2 !== 0) { hexString = '0' + hexString; }

let supabaseKey = '';
for (let i = 0; i < hexString.length; i += 2) {
    supabaseKey += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
}
//Comienza la inicialización del cliente de Supabase
const db = window.supabase.createClient(SB_URL, supabaseKey);

// ==========================================
// VARIABLES GLOBALES (PAGINACIÓN E IDIOMAS)
// ==========================================
let catalogoActual = []; 
let destacadosLocalGlobal = []; 
let paginaActual = 1;
const ITEMS_POR_PAGINA = 15; 
//Diccionario para normalizar los códigos de idioma devueltos por las APIs.
const diccionarioIdiomas = {
    'spa': 'Español', 'eng': 'Inglés', 'fre': 'Francés', 'ger': 'Alemán',
    'ita': 'Italiano', 'por': 'Portugués', 'rus': 'Ruso', 'jpn': 'Japonés',
    'chi': 'Chino', 'dut': 'Holandés', 'ara': 'Árabe', 'hin': 'Hindi'
};
//Objeto con los strings de la interfaz para soportar internacionalización (i18n)
const traducciones = {
    'es': {
        nav_catalogo: "Catálogo", nav_prestamos: "Libros Físicos", nav_comunidad: "Comunidad", btn_login: "Login", btn_registro: "+ Registro",
        hero_titulo: "Tu biblioteca, reinventada.", hero_sub: "Explora millones de ejemplares en la red global o solicita préstamos físicos del acervo local.",
        btn_buscar: "Buscar", tendencias: "Libros en tendencia (Ciencias e Ingeniería)", acervo_local: "Acervo Físico Local (ESCOM)"
    },
    'en': {
        nav_catalogo: "Catalog", nav_prestamos: "Physical Books", nav_comunidad: "Community", btn_login: "Sign In", btn_registro: "+ Sign Up",
        hero_titulo: "Your library, reinvented.", hero_sub: "Explore millions of copies on the global network or request physical loans from the local collection.",
        btn_buscar: "Search", tendencias: "Trending Books (Science & Engineering)", acervo_local: "Local Physical Acervus (ESCOM)"
    },
    'fr': {
        nav_catalogo: "Catalogue", nav_prestamos: "Livres Physiques", nav_comunidad: "Communauté", btn_login: "Connexion", btn_registro: "+ S'inscrire",
        hero_titulo: "Votre bibliothèque, réinventée.", hero_sub: "Explorez des millions d'exemplaires ou demandez des prêts physiques de la collection locale.",
        btn_buscar: "Rechercher", tendencias: "Livres Tendances (Sciences et Ingénierie)", acervo_local: "Fonds Physique Local (ESCOM)"
    }
};
//Cambia el idioma de la interfaz actualizando los nodos del DOM.

window.cambiarIdioma = function(idioma) {
    const textos = traducciones[idioma];
    const navLinks = document.querySelectorAll('.nav-links a');
    if(navLinks.length >= 3) {
        navLinks[0].innerText = textos.nav_catalogo;
        navLinks[1].innerText = textos.nav_prestamos;
        navLinks[2].innerText = textos.nav_comunidad;
    }

    const loginBtn = document.getElementById('btnLogin');
    const regBtn = document.getElementById('btnRegistro');
    if (loginBtn) loginBtn.innerText = textos.btn_login;
    if (regBtn) regBtn.innerText = textos.btn_registro;
    
    const h1Hero = document.querySelector('.hero-content h1');
    const pHero = document.querySelector('.hero-content p');
    const btnHero = document.querySelector('.search-bar button');
    
    if (h1Hero) h1Hero.innerText = textos.hero_titulo;
    if (pHero) pHero.innerText = textos.hero_sub;
    if (btnHero) btnHero.innerText = textos.btn_buscar;
    
    const tituloGrid = document.getElementById('tituloCatalogo');
    if(tituloGrid) {
        if (tituloGrid.innerText.includes("tendencia") || tituloGrid.innerText.includes("Trending") || tituloGrid.innerText.includes("Tendances")) {
            tituloGrid.innerText = textos.tendencias;
        } else if (tituloGrid.innerText.includes("Físico") || tituloGrid.innerText.includes("Physical") || tituloGrid.innerText.includes("Physique")) {
            tituloGrid.innerText = textos.acervo_local;
        }
    }
    //Actualiza la clase activa en los selectores de idioma del footer
    document.querySelectorAll('.footer-col a[id^="lang-"]').forEach(el => el.classList.remove('lang-active'));
    const activeLangBtn = document.getElementById(`lang-${idioma}`);
    if (activeLangBtn) activeLangBtn.classList.add('lang-active');
};

// ==========================================
// 3. ENGINE DE RENDERIZADO Y PAGINACIÓN
// ==========================================
function actualizarPlaceholder() {
    const tipo = document.getElementById('tipo');
    const inputId = document.getElementById('id_esc');
    if(tipo && inputId) {
        inputId.placeholder = tipo.value === 'alumno' ? "Número de Boleta" : "Número de Empleado";
    }
}
/**
*Normaliza los datos provenientes de la base de datos o de OpenLibrary y prepara la paginación.
*@param {Array} Libros - Arreglo de objetos con la información de los libros.
*@para, {boolean} esGlobal - Indica si los datos provienen de OpenLibrary (true) o de la BD local (false).
*/
function renderizarTarjetas(libros, esGlobal = false) {
    const grid = document.getElementById('bookGrid');
    const paginacion = document.getElementById('paginacion');
    if (!grid) return;

    if (!libros || libros.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-dim); padding: 20px; text-align:center; width:100%;">No se encontraron resultados.</p>`;
        if(paginacion) paginacion.innerHTML = '';
        return;
    }
//Normalización del mapeo de los datos para unificarlos en la estructura 'catalogoActual'
    catalogoActual = libros.map(libro => {
        let portadaUrl = 'https://via.placeholder.com/300x450/1a1e29/ffffff?text=Sin+Portada';
        let isbn = libro.isbn || '';
        let titulo = libro.titulo || 'Sin Título';
        let autor = libro.autor || 'Autor Desconocido';
        let genero = libro.genero || 'General';
        let fecha = libro.fecha_publicacion || '--';
        let editorial = libro.editorial || '--';
        let idioma = libro.idioma || 'Español';
        let paginas = libro.paginas || '--';

        if (esGlobal) {
            isbn = libro.isbn ? libro.isbn[0] : '';
            titulo = libro.title || 'Sin Título';
            autor = libro.author_name ? libro.author_name[0] : 'Autor Desconocido';
            genero = libro.subject ? libro.subject[0] : 'Catálogo Global';
            fecha = libro.first_publish_year || '--';
            editorial = libro.publisher ? libro.publisher[0] : 'No especificada';
            paginas = libro.number_of_pages_median ? libro.number_of_pages_median : '--';
            
            let codIdioma = libro.language ? libro.language[0].toLowerCase() : '';
            idioma = diccionarioIdiomas[codIdioma] || (codIdioma ? codIdioma.toUpperCase() : 'No especificado');
            
            if (libro.cover_i) {
                portadaUrl = `https://covers.openlibrary.org/b/id/${libro.cover_i}-L.jpg`;
            } else if (isbn) {
                portadaUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
            }
        } else if (isbn) {
            portadaUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        }

        return { isbn, titulo, autor, genero, portadaUrl, fecha, editorial, idioma, paginas };
    });

    mostrarPagina(1);
}

/**
*Pinta el DOM de la página específica del catálogo y genera los botones de Paginación.
*@param {number} pagina - Número de página a renderizar.
*/
window.mostrarPagina = function(pagina) {
    paginaActual = pagina;
    const grid = document.getElementById('bookGrid');
    const paginacion = document.getElementById('paginacion');
    if(!grid) return;

    //Cálculo de índices para segmentar el arreglo 'catalogoActual'
    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const librosPagina = catalogoActual.slice(inicio, fin);

    grid.innerHTML = librosPagina.map((libro, indexDentroDePagina) => {
        const indiceReal = inicio + indexDentroDePagina; 
        return `
        <div class="book-card">
            <img src="${libro.portadaUrl}" alt="Portada" class="book-cover-img" 
                 onerror="this.src='https://via.placeholder.com/300x450/1a1e29/ffffff?text=Sin+Portada'">
            <div class="book-info">
                <h4 title="${libro.titulo.replace(/"/g, '&quot;')}">${libro.titulo}</h4>
                <span title="${libro.autor.replace(/"/g, '&quot;')}"><strong>${libro.autor}</strong></span>
                <p>${libro.genero}</p>
                <button class="btn-secondary" style="width:100%; margin-top:15px; padding:10px; font-size:0.8rem;" 
                        onclick="abrirDetalles(${indiceReal}, false)">
                    Ver Detalles
                </button>
            </div>
        </div>
        `;
    }).join('');

    //Lógica para la construcción dinámica de los controles de paginación (paginación tipo elipse)
    const totalPaginas = Math.ceil(catalogoActual.length / ITEMS_POR_PAGINA);
    if (totalPaginas <= 1 || !paginacion) {
        if(paginacion) paginacion.innerHTML = '';
        return;
    }

    let botones = `<button class="page-btn" ${pagina === 1 ? 'disabled' : ''} onclick="mostrarPagina(${pagina - 1})">← Ant</button>`;
    let startPage = Math.max(1, pagina - 2);
    let endPage = Math.min(totalPaginas, pagina + 2);
    
    if (endPage - startPage < 4) {
        if (startPage === 1) endPage = Math.min(totalPaginas, startPage + 4);
        if (endPage === totalPaginas) startPage = Math.max(1, endPage - 4);
    }

    if (totalPaginas <= 5) {
        for (let i = 1; i <= totalPaginas; i++) {
            botones += `<button class="page-btn ${i === pagina ? 'active' : ''}" onclick="mostrarPagina(${i})">${i}</button>`;
        }
    } else {
        if (pagina <= 3) {
            for (let i = 1; i <= 4; i++) { botones += `<button class="page-btn ${i === pagina ? 'active' : ''}" onclick="mostrarPagina(${i})">${i}</button>`; }
            botones += `<span style="color: var(--text-dim); padding: 0 10px; font-weight: bold;">...</span>`;
            botones += `<button class="page-btn" onclick="mostrarPagina(${totalPaginas})">${totalPaginas}</button>`;
        } else if (pagina >= totalPaginas - 2) {
            botones += `<button class="page-btn" onclick="mostrarPagina(1)">1</button>`;
            botones += `<span style="color: var(--text-dim); padding: 0 10px; font-weight: bold;">...</span>`;
            for (let i = totalPaginas - 3; i <= totalPaginas; i++) { botones += `<button class="page-btn ${i === pagina ? 'active' : ''}" onclick="mostrarPagina(${i})">${i}</button>`; }
        } else {
            botones += `<button class="page-btn" onclick="mostrarPagina(1)">1</button>`;
            botones += `<span style="color: var(--text-dim); padding: 0 10px; font-weight: bold;">...</span>`;
            for (let i = pagina - 1; i <= pagina + 1; i++) { botones += `<button class="page-btn ${i === pagina ? 'active' : ''}" onclick="mostrarPagina(${i})">${i}</button>`; }
            botones += `<span style="color: var(--text-dim); padding: 0 10px; font-weight: bold;">...</span>`;
            botones += `<button class="page-btn" onclick="mostrarPagina(${totalPaginas})">${totalPaginas}</button>`;
        }
    }

    botones += `<button class="page-btn" ${pagina === totalPaginas ? 'disabled' : ''} onclick="mostrarPagina(${pagina + 1})">Sig →</button>`;
    paginacion.innerHTML = botones;

    //Auto-Scroll al inicio de la sección de libros al cambiar de página
    if (pagina > 1) {
        const section = document.querySelector('.shelf-section');
        if(section) section.scrollIntoView({ behavior: 'smooth' });
    }
};

// ==========================================
// 4. MODAL DE DETALLES Y FILTRADOS DE CATÁLOGO
// ==========================================

/**
*Despliega la ventana modal con la información completa de un libro seleccionado.
*@param {number} indice - Posición del libro en el arreglo actual.
*@param {boolean} esDelBanner - Identifica si el libro fue clikeado desde el banner principal.
*/
window.abrirDetalles = function(indice, esDelBanner = false) {
    const libro = esDelBanner ? destacadosLocalGlobal[indice] : catalogoActual[indice];
    
    document.getElementById("detalleTitulo").innerText = libro.titulo;
    document.getElementById("detalleAutor").innerText = libro.autor;
    document.getElementById("detalleIsbn").innerText = "ISBN: " + (libro.isbn || "No asignado");
    document.getElementById("detallePortada").src = libro.portadaUrl;
    document.getElementById("detalleFecha").innerText = libro.fecha;
    document.getElementById("detalleEditorial").innerText = libro.editorial;
    document.getElementById("detalleIdioma").innerText = libro.idioma;
    document.getElementById("detallePaginas").innerText = libro.paginas;

    const btnBuscarLinea = document.getElementById("btnBuscarLinea");
    if(btnBuscarLinea) {
        btnBuscarLinea.onclick = () => {
            window.open(`https://openlibrary.org/search?q=${encodeURIComponent(libro.titulo)}`, '_blank');
        };
    }

    const btnSolicitar = document.getElementById("btnSolicitar");
    if(btnSolicitar) {
        btnSolicitar.onclick = () => {
            solicitarPrestamo(libro.isbn);
            document.getElementById("modalDetalle").style.display = "none";
        };
    }
    document.getElementById("modalDetalle").style.display = "block";
};

/**
*Consulta la base de datos de Supabase para traer el acervo físico exclusivo.
*Maneja redirección si la función es llamada desde una vista ajena al grid.
*/
window.verLibrosLocales = async function(e) {
    if(e) e.preventDefault();
    
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    const linkLocales = document.getElementById('nav-prestamos');
    if(linkLocales) linkLocales.classList.add('active');

    const grid = document.getElementById('bookGrid');
    if (!grid) {
        localStorage.setItem('cargarSoloLocales', 'true');
        window.location.href = 'index.html';
        return;
    }

    grid.innerHTML = `<p style="color:var(--primary); padding: 20px; font-weight:bold; width:100%; text-align:center;">Cargando acervo físico local...</p>`;
    const paginacion = document.getElementById('paginacion');
    if(paginacion) paginacion.innerHTML = '';
    
    const tituloCatalogo = document.getElementById("tituloCatalogo");
    if(tituloCatalogo) tituloCatalogo.innerText = "Acervo Físico Local (ESCOM)";

    try {
        const { data: librosLocal, error } = await db.from('libros').select('*');
        if (error) throw error;
        renderizarTarjetas(librosLocal, false);
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="color:var(--error); width:100%; text-align:center;">Error al conectar con Supabase.</p>`;
    }
};

//*
/**Retorna a la vista principal cargando el catálogo global.
*/
window.irACatalogo = function(e) {
    if (document.getElementById('tituloCatalogo')) {
        if(e) e.preventDefault();
        document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
        document.getElementById('nav-catalogo').classList.add('active');
        cargarLibros();
    }
};

/**
*Ejecuta una petición GET a la API de OpenLibrary en base a la entrada de los buscadores de la UI
*/
window.buscarLibro = async function() {
    const inputNav = document.getElementById('navSearchInput');
    const inputHero = document.getElementById('searchInput');
    const termino = (inputNav?.value || inputHero?.value || '').trim();
    const grid = document.getElementById('bookGrid');
    const paginacion = document.getElementById('paginacion');
    
    if (!grid) return;
    if (termino === '') { cargarLibros(); return; }

    grid.innerHTML = `<p style="color:var(--primary); padding: 20px; font-weight:bold; width:100%; text-align:center;">Buscando "${termino}" en la red global...</p>`;
    if(paginacion) paginacion.innerHTML = '';
    const tituloCatalogo = document.getElementById("tituloCatalogo");
    if(tituloCatalogo) tituloCatalogo.innerText = "Buscando resultados...";

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(termino)}&limit=3000`);
        const data = await response.json();
        
        if (!data.docs || data.docs.length === 0) {
            grid.innerHTML = `<p style="color:var(--text-dim); padding: 20px; width:100%; text-align:center;">No se encontraron resultados para "${termino}".</p>`;
            if(tituloCatalogo) tituloCatalogo.innerText = `0 resultados para "${termino}"`;
            return;
        }
        
        if(tituloCatalogo) {
            tituloCatalogo.innerText = `Resultados para "${termino}": ${data.docs.length} libros encontrados`;
        }
        renderizarTarjetas(data.docs, true);
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="color:var(--error); padding: 20px; width:100%; text-align:center;">Error de conexión con Open Library.</p>`;
    }
};

/**
*Gestiona el proceso transaccional de crear un nuevo p´restamo en la BD,
*verificando sesión y disponibildad del ejemplar en físico.
*@param {string} isbn - Identificador del libro a solicitar.
*/
window.solicitarPrestamo = async function(isbn) {
    try {
        //Validación de sesión activa
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
            alert("Debes iniciar sesión para poder solicitar un libro.");
            document.getElementById("modalLogin").style.display = "block";
            return;
        }

        //Validación de disponibilidad del ejemplar
        const { data: ejemplares, error: errEjemplar } = await db.from('ejemplares').select('id_ejemplar').eq('isbn', isbn).limit(1);
        if (errEjemplar) throw errEjemplar;
        if (!ejemplares || ejemplares.length === 0) {
            alert("Lo sentimos, no hay copias físicas disponibles de este libro en este momento.");
            return;
        }

        //Generación de fechas de salida y retorno esperado
        const idEjemplarFisico = ejemplares[0].id_ejemplar;
        const fechaSalida = new Date();
        const fechaEsperada = new Date();
        fechaEsperada.setDate(fechaSalida.getDate() + 7);

        //Generación de fechas de salida y retorno esperado
        const { error: errPrestamo } = await db.from('prestamos').insert([{
            id_usuario: session.user.id, id_ejemplar: idEjemplarFisico,
            fecha_salida: fechaSalida.toISOString().split('T')[0], fecha_esperada: fechaEsperada.toISOString().split('T')[0]
        }]);
        if (errPrestamo) throw errPrestamo;
        alert("¡Préstamo exitoso! Puedes pasar a recoger el libro. Tienes 7 días para devolverlo.");
    } catch (err) {
        alert("Error al procesar la solicitud: " + err.message);
    }
};

/**
*Consulta la BD para recuperar 3 libros locales aleatorios o iniciales,
*y pintarlos en el banner superior de promoción.
*/
async function cargarDestacadosLocal() {
    const banner = document.getElementById('localBooksBanner');
    if (!banner) return;

    try {
        const { data: librosLocal, error } = await db.from('libros').select('*').limit(3);
        if (error) throw error;

        if (!librosLocal || librosLocal.length === 0) {
            banner.innerHTML = `<div class="welcome-card" style="width:100%; justify-content:center;"><p style="color:var(--text-dim); font-style:italic;">No hay libros físicos registrados en Supabase todavía.</p></div>`;
            return;
        }

        destacadosLocalGlobal = librosLocal.map(libro => {
            const isbn = libro.isbn || '';
            const portadaUrl = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : 'https://via.placeholder.com/300x450/1a1e29/ffffff?text=Sin+Portada';
            return {
                isbn, titulo: libro.titulo || 'Sin Título', autor: libro.autor || 'Autor Desconocido',
                genero: libro.genero || 'Físico Local', portadaUrl, fecha: libro.fecha_publicacion || '--',
                editorial: libro.editorial || '--', idioma: libro.idioma || 'Español', paginas: libro.paginas || '--'
            };
        });

        banner.innerHTML = destacadosLocalGlobal.map((libro, index) => {
            return `
            <div class="welcome-card" style="cursor:pointer; display:flex; align-items:center;" onclick="abrirDetalles(${index}, true)">
                <img src="${libro.portadaUrl}" alt="Portada" style="width:60px; height:85px; object-fit:cover; border-radius:3px; margin-right:15px; border:1px solid var(--card-border);" onerror="this.src='https://via.placeholder.com/300x450/1a1e29/ffffff?text=Sin+Portada'">
                <div class="welcome-info">
                    <h3 style="font-size:1.05rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${libro.titulo}</h3>
                    <p style="font-size:0.85rem; margin-bottom:2px;">${libro.autor}</p>
                    <span style="color:var(--primary); font-size:0.75rem; font-weight:bold; text-transform:uppercase; font-family:'Playfair Display'; letter-spacing:0.5px;">Disponible Local 🏛️</span>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error al cargar banner de Supabase:", err);
        banner.style.display = 'none';
    }
}

/**
*Función por defecto que se lanza al iniciar el index.
*Solicita una búsqueda a Openlibrary de la categoría Computer Science.
*Funciona como "Fallback: Si falla, intenta cargar los locales de Supabase."
*/
async function cargarLibros() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;
    grid.innerHTML = `<p style="color:var(--primary); padding: 20px; font-weight:bold; width:100%; text-align:center;">Cargando tendencias globales...</p>`;
    
    const tituloCatalogo = document.getElementById("tituloCatalogo");
    if(tituloCatalogo) tituloCatalogo.innerText = "Libros en tendencia (Ciencias e Ingeniería)";

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=subject:computer_science&limit=3000`);
        const data = await response.json();
        renderizarTarjetas(data.docs, true);
    } catch (err) {
        const { data: librosLocal } = await db.from('libros').select('*');
        if (librosLocal) {
            if(tituloCatalogo) tituloCatalogo.innerText = "Acervo Local ESCOM";
            renderizarTarjetas(librosLocal, false);
        } else {
            grid.innerHTML = `<p style="color:var(--error); width:100%; text-align:center;">Error de conexión general.</p>`;
        }
    }
}

/**
*Verifica el estado de autenticación de Supabase y alterna dinámicamente
*la visibilidad de los botones de login/registro o cerrar sesión.
*/
async function verificarSesion() {
    const { data: { session } } = await db.auth.getSession();
    const btnLogin = document.getElementById("btnLogin");
    const btnRegistro = document.getElementById("btnRegistro");
    const btnLogout = document.getElementById("btnLogout");
    if(session) {
        if (btnLogin) btnLogin.style.display = "none";
        if (btnRegistro) btnRegistro.style.display = "none";
        if (btnLogout) btnLogout.style.display = "block";
    } else {
        if (btnLogin) btnLogin.style.display = "block";
        if (btnRegistro) btnRegistro.style.display = "block";
        if (btnLogout) btnLogout.style.display = "none";
    }
}

// ==========================================
// 5. EVENTOS GLOBALES E INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DEL MENÚ HAMBURGUESA ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinksMenu = document.getElementById('navLinks');

    if (hamburgerBtn && navLinksMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navLinksMenu.classList.toggle('active');
        });

        // Cierra el menú al hacer clic en un enlace (útil en móviles)
        document.querySelectorAll('.nav-links a, .nav-links button').forEach(item => {
            item.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navLinksMenu.classList.remove('active');
            });
        });
    }

    // --- EFECTO LINTERNA EN EL HERO ---
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            heroSection.style.setProperty('--x', `${x}px`);
            heroSection.style.setProperty('--y', `${y}px`);
        });
    }

    // --- MODO CLARO / OSCURO ---
    const btnTheme = document.getElementById('btnTheme');

    //Verificación en caché local para persistir la preferencia del usuario.
    if (localStorage.getItem('temaBiblioTech') === 'light') {
        document.body.classList.add('light-mode');
    }

    if (btnTheme) {
        btnTheme.onclick = () => {
            document.body.classList.toggle('light-mode');
            if (document.body.classList.contains('light-mode')) {
                localStorage.setItem('temaBiblioTech', 'light');
            } else {
                localStorage.setItem('temaBiblioTech', 'dark');
            }
        };
    }

    // --- MANEJO DE VENTANAS MODALES ---
    const modalRegistro = document.getElementById("modalRegistro");
    const btnRegistro = document.getElementById("btnRegistro");
    const spanRegistro = document.querySelector("#modalRegistro .close");
    const modalLogin = document.getElementById("modalLogin");
    const btnLogin = document.getElementById("btnLogin");
    const btnLogout = document.getElementById("btnLogout");
    const spanLogin = document.getElementById("closeLogin");
    const modalDetalle = document.getElementById("modalDetalle");
    const spanDetalle = document.getElementById("closeDetalle");

    if (btnRegistro && modalRegistro) btnRegistro.onclick = () => modalRegistro.style.display = "block";
    if (spanRegistro && modalRegistro) spanRegistro.onclick = () => modalRegistro.style.display = "none";
    if (btnLogin && modalLogin) btnLogin.onclick = () => modalLogin.style.display = "block";
    if (spanLogin && modalLogin) spanLogin.onclick = () => modalLogin.style.display = "none";
    if (spanDetalle && modalDetalle) spanDetalle.onclick = () => modalDetalle.style.display = "none";

    window.onclick = (e) => {
        if (e.target === modalRegistro) modalRegistro.style.display = "none";
        if (e.target === modalLogin) modalLogin.style.display = "none";
        if (e.target === modalDetalle) modalDetalle.style.display = "none";
    };

    //Listeners para ejecutar búsqueda al presionar "Enter"
    const inputNav = document.getElementById('navSearchInput');
    const inputHero = document.getElementById('searchInput');
    if (inputNav) inputNav.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); buscarLibro(); } });
    if (inputHero) inputHero.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); buscarLibro(); } });

    // --- FORMULARIOS DE SUPABASE ---
    //Manejo de la lógica de Registro de un Usuario
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const user = document.getElementById('user').value;
                const { data: authData, error: authError } = await db.auth.signUp({ email: `${user}@escom.ipn.mx`, password: document.getElementById('pass').value });
                if (authError) throw authError;
                await db.from('profiles').insert([{ id: authData.user.id, curp: document.getElementById('curp').value, nombre_completo: document.getElementById('nombre').value, username: user, tipo: document.getElementById('tipo').value }]);
                const tabla = document.getElementById('tipo').value === 'alumno' ? 'alumnos' : 'profesores';
                const colId = document.getElementById('tipo').value === 'alumno' ? 'boleta' : 'no_empleado';
                await db.from(tabla).insert([{ id: authData.user.id, [colId]: document.getElementById('id_esc').value }]);
                alert("¡Registro exitoso!"); modalRegistro.style.display = "none"; regForm.reset(); verificarSesion();
            } catch (err) { alert(err.message); }
        };
    }

    //Manejo de la lógica de Inicio de Sesión
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const { error } = await db.auth.signInWithPassword({ email: `${document.getElementById('loginUser').value}@escom.ipn.mx`, password: document.getElementById('loginPass').value });
                if (error) throw error;
                alert("¡Bienvenido!"); modalLogin.style.display = "none"; loginForm.reset(); verificarSesion();
            } catch (err) { alert(err.message); }
        };
    }

    if(btnLogout) btnLogout.onclick = async () => { await db.auth.signOut(); alert("Sesión cerrada."); verificarSesion(); };

    // --- CARGA INICIAL DE DATOS ---
    if (document.getElementById('localBooksBanner')) {
        cargarDestacadosLocal();
    }

    //Lógica para procesar intenciones guardadas en LocalStorage 
    //(Un ejemplo es: Cuando el usuario hace una búsqueda desde otra página y es redirigido al index)
    if (document.getElementById('tituloCatalogo')) {
        const soloLocales = localStorage.getItem('cargarSoloLocales');
        const busquedaPendiente = localStorage.getItem('busquedaInmediata');
        
        if (soloLocales === 'true') {
            localStorage.removeItem('cargarSoloLocales');
            verLibrosLocales();
        } else if (busquedaPendiente) {
            localStorage.removeItem('busquedaInmediata');
            if (inputNav) inputNav.value = busquedaPendiente;
            if (inputHero) inputHero.value = busquedaPendiente;
            buscarLibro();
        } else {
            cargarLibros();
        }
    }
    
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) { tipoSelect.onchange = actualizarPlaceholder; actualizarPlaceholder(); }
    verificarSesion();
});

//Listener para la visibilidad de la pestaña (Manejo dinámico)
const tituloOriginal = document.title;
document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "¡Vuelve a la mejor biblioteca! 📚" : tituloOriginal;
});

// ==========================================
// 7. ATAJOS DE BÚSQUEDA DEL FOOTER
// ==========================================
/**
*Permite realizar búsquedas rápidas al dar clic a las etiquetas predefinidas del Footer.
*@param {string} termino - Término a buscar (Ejemplo: "Inteligencia Artificial").
*/
window.busquedaRapida = function(termino, e) {
    if (e) e.preventDefault();
    
    if (document.getElementById('tituloCatalogo')) {
        const inputNav = document.getElementById('navSearchInput');
        if (inputNav) inputNav.value = termino;
        buscarLibro();
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    } else {
        localStorage.setItem('busquedaInmediata', termino);
        window.location.href = 'index.html';
    }
};
