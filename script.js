// ==========================================
// 1. CONFIGURACIÓN SUPABASE (Ofuscación BigInt)
// ==========================================
const SB_URL = 'https://fetqdwxjgwqveqpxlkdo.supabase.co'; 

const giantKey = 325107289943835301567169038289173430989254416265133392209669403326094547422214826592573882541857042746475474739664941699678552908563995303252367141130785312117166904182578356924241785328077950361964713989504540355576217469036450604467145256017935657916405186645142292670773303220091267794886182181714065369188973928640335019287986385114043370384847675443579163196568799372128368184223093341427532127181163034075360487414185405085577211299591629441881207934823756263490690882223954435371781977843198793n;

let hexString = giantKey.toString(16);
if (hexString.length % 2 !== 0) { hexString = '0' + hexString; }

let supabaseKey = '';
for (let i = 0; i < hexString.length; i += 2) {
    supabaseKey += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
}

const db = window.supabase.createClient(SB_URL, supabaseKey);

// ==========================================
// VARIABLES GLOBALES (PAGINACIÓN E IDIOMAS)
// ==========================================
let catalogoActual = []; 
let paginaActual = 1;
const ITEMS_POR_PAGINA = 15; // Ajuste forzado de 15 libros por página (3x5)

const diccionarioIdiomas = {
    'spa': 'Español', 'eng': 'Inglés', 'fre': 'Francés', 'ger': 'Alemán',
    'ita': 'Italiano', 'por': 'Portugués', 'rus': 'Ruso', 'jpn': 'Japonés',
    'chi': 'Chino', 'dut': 'Holandés', 'ara': 'Árabe', 'hin': 'Hindi'
};

const traducciones = {
    'es': {
        nav_catalogo: "Catálogo", nav_prestamos: "Préstamos", nav_comunidad: "Comunidad", btn_login: "Login", btn_registro: "+ Registro",
        hero_titulo: "Tu biblioteca, reinventada.", hero_sub: "Explora millones de ejemplares en la red global o solicita préstamos físicos del acervo local.",
        btn_buscar: "Buscar", tendencias: "Libros en tendencia (Ciencias e Ingeniería)"
    },
    'en': {
        nav_catalogo: "Catalog", nav_prestamos: "Loans", nav_comunidad: "Community", btn_login: "Sign In", btn_registro: "+ Sign Up",
        hero_titulo: "Your library, reinvented.", hero_sub: "Explore millions of copies on the global network or request physical loans from the local collection.",
        btn_buscar: "Search", tendencias: "Trending Books (Science & Engineering)"
    },
    'fr': {
        nav_catalogo: "Catalogue", nav_prestamos: "Prêts", nav_comunidad: "Communauté", btn_login: "Connexion", btn_registro: "+ S'inscrire",
        hero_titulo: "Votre bibliothèque, réinventée.", hero_sub: "Explorez des millions d'exemplaires ou demandez des prêts physiques de la collection locale.",
        btn_buscar: "Rechercher", tendencias: "Livres Tendances (Sciences et Ingénierie)"
    }
};

// ==========================================
// 2. INTERNACIONALIZACIÓN (CAMBIO DE IDIOMA)
// ==========================================
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
    
    const h1Hero = document.querySelector('.hero h1');
    const pHero = document.querySelector('.hero p');
    const btnHero = document.querySelector('.search-bar button');
    
    if (h1Hero) h1Hero.innerText = textos.hero_titulo;
    if (pHero) pHero.innerText = textos.hero_sub;
    if (btnHero) btnHero.innerText = textos.btn_buscar;
    
    const tituloGrid = document.getElementById('tituloCatalogo');
    if(tituloGrid && (tituloGrid.innerText.includes("tendencia") || tituloGrid.innerText.includes("Trending") || tituloGrid.innerText.includes("Tendances"))) {
        tituloGrid.innerText = textos.tendencias;
    }

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

function renderizarTarjetas(libros, esGlobal = false) {
    const grid = document.getElementById('bookGrid');
    const paginacion = document.getElementById('paginacion');
    if (!grid) return;

    if (!libros || libros.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-dim); padding: 20px; text-align:center; width:100%;">No se encontraron resultados.</p>`;
        if(paginacion) paginacion.innerHTML = '';
        return;
    }

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

window.mostrarPagina = function(pagina) {
    paginaActual = pagina;
    const grid = document.getElementById('bookGrid');
    const paginacion = document.getElementById('paginacion');
    if(!grid) return;
    
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
                        onclick="abrirDetalles(${indiceReal})">
                    Ver Detalles
                </button>
            </div>
        </div>
        `;
    }).join('');

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

    for (let i = startPage; i <= endPage; i++) {
        botones += `<button class="page-btn ${i === pagina ? 'active' : ''}" onclick="mostrarPagina(${i})">${i}</button>`;
    }
    botones += `<button class="page-btn" ${pagina === totalPaginas ? 'disabled' : ''} onclick="mostrarPagina(${pagina + 1})">Sig →</button>`;
    paginacion.innerHTML = botones;
    
    if (pagina > 1) {
        const section = document.querySelector('.shelf-section');
        if(section) section.scrollIntoView({ behavior: 'smooth' });
    }
};

// ==========================================
// 4. MODAL DE DETALLES Y BÚSQUEDA GLOBAL
// ==========================================
window.abrirDetalles = function(indice) {
    const libro = catalogoActual[indice];
    
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
    if(tituloCatalogo) tituloCatalogo.innerText = "Resultados de búsqueda";

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(termino)}&limit=300`);
        const data = await response.json();
        if (!data.docs || data.docs.length === 0) {
            grid.innerHTML = `<p style="color:var(--text-dim); padding: 20px; width:100%; text-align:center;">No se encontraron resultados para "${termino}".</p>`;
            return;
        }
        renderizarTarjetas(data.docs, true);
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="color:var(--error); padding: 20px; width:100%; text-align:center;">Error de conexión con Open Library.</p>`;
    }
};

window.solicitarPrestamo = async function(isbn) {
    try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
            alert("Debes iniciar sesión para poder solicitar un libro.");
            document.getElementById("modalLogin").style.display = "block";
            return;
        }

        const { data: ejemplares, error: errEjemplar } = await db.from('ejemplares').select('id_ejemplar').eq('isbn', isbn).limit(1);
        if (errEjemplar) throw errEjemplar;
        if (!ejemplares || ejemplares.length === 0) {
            alert("Lo sentimos, no hay copias físicas disponibles de este libro en este momento.");
            return;
        }

        const idEjemplarFisico = ejemplares[0].id_ejemplar;
        const fechaSalida = new Date();
        const fechaEsperada = new Date();
        fechaEsperada.setDate(fechaSalida.getDate() + 7);

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

async function cargarLibros() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;
    grid.innerHTML = `<p style="color:var(--primary); padding: 20px; font-weight:bold; width:100%; text-align:center;">Cargando tendencias globales...</p>`;
    
    const tituloCatalogo = document.getElementById("tituloCatalogo");
    if(tituloCatalogo) tituloCatalogo.innerText = "Libros en tendencia (Ciencias e Ingeniería)";

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=subject:computer_science&limit=150`);
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
    // Control del Tema Claro / Oscuro
    const btnTheme = document.getElementById('btnTheme');
    if (localStorage.getItem('temaBiblioTech') === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    if (btnTheme) {
        btnTheme.onclick = () => {
            if (document.documentElement.getAttribute('data-theme') === 'light') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('temaBiblioTech', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('temaBiblioTech', 'light');
            }
        };
    }

    // Modales Event Listeners
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

    // Control de Enters en Buscadores
    const inputNav = document.getElementById('navSearchInput');
    const inputHero = document.getElementById('searchInput');
    if (inputNav) inputNav.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); buscarLibro(); } });
    if (inputHero) inputHero.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); buscarLibro(); } });

    // Formularios Auth
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

    // Failsafe de Arranque por Página
    if (document.getElementById('tituloCatalogo')) { cargarLibros(); }
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) { tipoSelect.onchange = actualizarPlaceholder; actualizarPlaceholder(); }
    verificarSesion();
});

// ==========================================
// 6. VISIBILIDAD DINÁMICA DE LA PESTAÑA
// ==========================================
const tituloOriginal = document.title;
document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "¡Vuelve a la mejor biblioteca! 📚" : tituloOriginal;
});
