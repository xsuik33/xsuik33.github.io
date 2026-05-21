// ==========================================
// 1. CONFIGURACIÓN SUPABASE (Ofuscación BigInt Matemático)
// ==========================================
const SB_URL = 'https://fetqdwxjgwqveqpxlkdo.supabase.co'; 

// Tu API Key convertida en un solo número entero (BigInt)
const giantKey = 325107289943835301567169038289173430989254416265133392209669403326094547422214826592573882541857042746475474739664941699678552908563995303252367141130785312117166904182578356924241785328077950361964713989504540355576217469036450604467145256017935657916405186645142292670773303220091267794886182181714065369188973928640335019287986385114043370384847675443579163196568799372128368184223093341427532127181163034075360487414185405085577211299591629441881207934823756263490690882223954435371781977843198793n;

//  Convertimos el súper número de regreso a Hexadecimal (Base 16)
let hexString = giantKey.toString(16);

// Por si el número perdió un cero a la izquierda, lo rellenamos para que sean pares exactos
if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
}

// Traducimos los pares hexadecimales a las letras de tu llave JWT
let supabaseKey = '';
for (let i = 0; i < hexString.length; i += 2) {
    supabaseKey += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
}

// Inicializamos la base de datos
const db = window.supabase.createClient(SB_URL, supabaseKey);

// ==========================================
// 2. LÓGICA DE LAS VENTANAS EMERGENTES (MODALS)
// ==========================================
const modalRegistro = document.getElementById("modalRegistro");
const btnRegistro = document.getElementById("btnRegistro");
const spanRegistro = document.querySelector("#modalRegistro .close");

const modalLogin = document.getElementById("modalLogin");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const spanLogin = document.getElementById("closeLogin");

// Nuevas variables para el Modal de Detalles (Estilo Open Library)
const modalDetalle = document.getElementById("modalDetalle");
const spanDetalle = document.getElementById("closeDetalle");

// Control del Modal de Registro
if (btnRegistro) {
    btnRegistro.onclick = () => modalRegistro.style.display = "block";
}
if (spanRegistro) {
    spanRegistro.onclick = () => modalRegistro.style.display = "none";
}

// Control del Modal de Login
if (btnLogin) {
    btnLogin.onclick = () => modalLogin.style.display = "block";
}
if (spanLogin) {
    spanLogin.onclick = () => modalLogin.style.display = "none";
}

// Control del Modal de Detalles
if (spanDetalle) {
    spanDetalle.onclick = () => modalDetalle.style.display = "none";
}

// Cerrar modales dando clic afuera
window.onclick = (e) => {
    if (e.target == modalRegistro) modalRegistro.style.display = "none";
    if (e.target == modalLogin) modalLogin.style.display = "none";
    if (e.target == modalDetalle) modalDetalle.style.display = "none"; // Agregado aquí
};

// Cambiar el texto del input dependiendo si es Alumno o Profesor
function actualizarPlaceholder() {
    const tipo = document.getElementById('tipo').value;
    const inputId = document.getElementById('id_esc');
    
    if (tipo === 'alumno') {
        inputId.placeholder = "Número de Boleta";
    } else {
        inputId.placeholder = "Número de Empleado";
    }
}

// ==========================================
// 3. CARGAR LIBROS DESDE LA BASE DE DATOS
// ==========================================
async function cargarLibros() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;

    // Traemos los datos de la Entidad Fuerte 'libros'
    const { data: libros, error } = await db.from('libros').select('*');

    if (error) {
        console.error("Error al cargar libros:", error.message);
        grid.innerHTML = `<p style="color:#ef4444;">Error de conexión con la base de datos.</p>`;
        return;
    }

    if (!libros || libros.length === 0) {
        grid.innerHTML = `<p style="color:#94a3b8;">El catálogo está vacío. Agrega libros desde Supabase.</p>`;
        return;
    }

    // Dibujar los libros en el HTML usando portadas de Open Library
    grid.innerHTML = libros.map(libro => {
        // Generamos la URL. Si no hay ISBN o falla, usamos un placeholder.
        const portadaUrl = libro.isbn 
            ? `https://covers.openlibrary.org/b/isbn/${libro.isbn}-M.jpg` 
            : 'https://via.placeholder.com/200x300/1a1e29/ffffff?text=Sin+Portada';

        return `
        <div class="book-card">
            <img src="${portadaUrl}" alt="Portada de ${libro.titulo}" class="book-cover-img" 
                 onerror="this.src='https://via.placeholder.com/200x300/1a1e29/ffffff?text=Sin+Portada'">
            
            <div class="book-info">
                <h4 title="${libro.titulo}">${libro.titulo}</h4>
                <span title="${libro.autor}"><strong>${libro.autor}</strong></span>
                <p style="color:#64748b; font-size:0.8rem; margin-top:5px;">${libro.genero || 'General'}</p>
                
                <button class="btn-secondary" style="width:100%; margin-top:15px; padding:10px; font-size:0.8rem;" 
                        onclick="abrirDetalles('${libro.isbn}', '${libro.titulo.replace(/'/g, "\\'")}', '${libro.autor.replace(/'/g, "\\'")}', '${portadaUrl}')">
                    Ver Detalles
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// ==========================================
// ABRIR DETALLES DEL LIBRO (NUEVO MODAL)
// ==========================================
window.abrirDetalles = function(isbn, titulo, autor, portadaUrl) {
    document.getElementById("detalleTitulo").innerText = titulo;
    document.getElementById("detalleAutor").innerText = autor;
    document.getElementById("detalleIsbn").innerText = isbn || "No asignado";
    document.getElementById("detallePortada").src = portadaUrl;

    // Configurar el botón para que ejecute tu lógica original de préstamo
    const btnSolicitar = document.getElementById("btnSolicitar");
    btnSolicitar.onclick = () => {
        solicitarPrestamo(isbn);
        modalDetalle.style.display = "none";
    };

    modalDetalle.style.display = "block";
};

// ==========================================
// 4. REGISTRO DE USUARIOS (MODELO EER)
// ==========================================
document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault(); 
    
    // Capturar los datos del formulario
    const curp = document.getElementById('curp').value;
    const nombre = document.getElementById('nombre').value;
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const tipo = document.getElementById('tipo').value;
    const id_escolar = document.getElementById('id_esc').value;

    try {
        // A. Registrar en la Autenticación de Supabase
        const { data: authData, error: authError } = await db.auth.signUp({
            email: `${user}@escom.ipn.mx`,
            password: pass,
        });

        if (authError) throw authError;

        // B. Insertar en la tabla SUPERTIPO (profiles)
        const { error: profileError } = await db.from('profiles').insert([{ 
            id: authData.user.id, 
            curp: curp, 
            nombre_completo: nombre, 
            username: user, 
            tipo: tipo 
        }]);

        if (profileError) throw profileError;

        // C. Insertar en la tabla SUBTIPO (alumnos o profesores)
        const tabla = tipo === 'alumno' ? 'alumnos' : 'profesores';
        const colId = tipo === 'alumno' ? 'boleta' : 'no_empleado';

        const { error: subTypeError } = await db.from(tabla).insert([{ 
            id: authData.user.id, 
            [colId]: id_escolar 
        }]);

        if (subTypeError) throw subTypeError;

        // Éxito
        alert("¡Registro exitoso! Ya eres parte de la comunidad.");
        modalRegistro.style.display = "none";
        document.getElementById('regForm').reset(); 
        verificarSesion(); // Actualizar botones tras registrarse
        
    } catch (err) {
        alert("Error al registrar: " + err.message);
        console.error("Detalle del error:", err);
    }
};

// ==========================================
// 5. INICIO Y CIERRE DE SESIÓN
// ==========================================
// Función de Login
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email: `${user}@escom.ipn.mx`,
            password: pass,
        });

        if (error) throw error;

        alert("¡Bienvenido de nuevo!");
        modalLogin.style.display = "none";
        document.getElementById('loginForm').reset();
        verificarSesion(); // Actualizar botones
    } catch (err) {
        alert("Error al entrar: " + err.message);
    }
};

// Función para Cerrar Sesión
if(btnLogout) {
    btnLogout.onclick = async () => {
        await db.auth.signOut();
        alert("Sesión cerrada.");
        verificarSesion(); // Actualizar botones
    };
}

// Función para verificar la sesión y ocultar/mostrar botones en la Navbar
async function verificarSesion() {
    const { data: { session } } = await db.auth.getSession();
    
    if (session) {
        // Si hay un usuario logueado, ocultar Login/Registro y mostrar Cerrar Sesión
        if (btnLogin) btnLogin.style.display = "none";
        if (btnRegistro) btnRegistro.style.display = "none";
        if (btnLogout) btnLogout.style.display = "block";
    } else {
        // Si no hay sesión, mostrar Login/Registro y ocultar Cerrar Sesión
        if (btnLogin) btnLogin.style.display = "block";
        if (btnRegistro) btnRegistro.style.display = "block";
        if (btnLogout) btnLogout.style.display = "none";
    }
}

// ==========================================
// 6. SOLICITAR PRÉSTAMO Y BÚSQUEDA
// ==========================================
function buscarLibro() {
    alert("Función de búsqueda en desarrollo...");
}

window.solicitarPrestamo = async function(isbn) {
    try {
        // 1. Verificar si hay un usuario conectado
        const { data: { session } } = await db.auth.getSession();
        
        if (!session) {
            alert("Debes iniciar sesión para poder solicitar un libro.");
            modalLogin.style.display = "block";
            return;
        }

        const idUsuario = session.user.id;

        // 2. Buscar un ejemplar disponible de ese libro en el inventario físico
        const { data: ejemplares, error: errEjemplar } = await db
            .from('ejemplares')
            .select('id_ejemplar')
            .eq('isbn', isbn)
            .limit(1);

        if (errEjemplar) throw errEjemplar;
        
        if (!ejemplares || ejemplares.length === 0) {
            alert("Lo sentimos, no hay copias físicas disponibles de este libro en este momento.");
            return;
        }

        const idEjemplarFisico = ejemplares[0].id_ejemplar;

        // 3. Calcular fechas (Hoy y fecha de entrega esperada en 7 días)
        const fechaSalida = new Date();
        const fechaEsperada = new Date();
        fechaEsperada.setDate(fechaSalida.getDate() + 7);

        // 4. Insertar el registro en la tabla 'prestamos'
        const { error: errPrestamo } = await db
            .from('prestamos')
            .insert([{
                id_usuario: idUsuario,
                id_ejemplar: idEjemplarFisico,
                fecha_salida: fechaSalida.toISOString().split('T')[0],
                fecha_esperada: fechaEsperada.toISOString().split('T')[0]
            }]);

        if (errPrestamo) throw errPrestamo;

        alert("¡Préstamo exitoso! Puedes pasar a recoger el libro. Tienes 7 días para devolverlo.");

    } catch (err) {
        console.error("Error al solicitar préstamo:", err);
        alert("Ocurrió un error al procesar tu solicitud: " + err.message);
    }
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
// Ejecutar funciones en cuanto el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    actualizarPlaceholder();
    verificarSesion(); // Verifica si alguien ya estaba logueado
});
