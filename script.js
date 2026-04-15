// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
// Sustituye estas dos líneas con tus datos reales de Supabase
const SB_URL = 'https://fetqdwxjgwqveqpxlkdo.supabase.co'; 
const llave_oculta = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1abGRIRmtkM2hxWjNkeGRtVnhjSGhzYTJSdklpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpReU9EZzJPVGdzSW1WNGNDSTZNakE0T1RnMk5EWTVPSDAuLWU0S0JYMlFnSElmZ0M2Mm5CaG15MzBaMEkxMlNza1FtYkcxS0stUWhrSQ==";

const supabaseKey = atob(llave_oculta);

// Usamos la variable 'db' para evitar el error de "Identifier already declared"
const db = window.supabase.createClient(SB_URL, supabaseKey);

// ==========================================
// 2. LÓGICA DE LA VENTANA EMERGENTE (MODAL)
// ==========================================
const modal = document.getElementById("modalRegistro");
const btn = document.getElementById("btnRegistro");
const span = document.querySelector(".close");

// Abrir el modal
if (btn) {
    btn.onclick = () => {
        modal.style.display = "block";
    };
}

// Cerrar el modal con la tachita
if (span) {
    span.onclick = () => {
        modal.style.display = "none";
    };
}

// Cerrar el modal dando clic afuera
window.onclick = (e) => {
    if (e.target == modal) {
        modal.style.display = "none";
    }
};

// Cambiar el texto del input dependiendo si es Alumno o Profesor [cite: 37, 82, 85]
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

    // Traemos los datos de la Entidad Fuerte 'libros' [cite: 134, 183]
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

    // Dibujar los libros en el HTML
    grid.innerHTML = libros.map(libro => `
        <div class="book-card">
            <div class="book-img">${libro.emoji || '📖'}</div>
            <div class="book-info">
                <h4>${libro.titulo}</h4>
                <span><strong>${libro.autor}</strong></span>
                <p style="color:#64748b; font-size:0.8rem; margin-top:5px;">${libro.genero || 'General'}</p>
               <button class="btn-primary" style="width:100%; margin-top:15px; padding:10px; font-size:0.8rem;" onclick="solicitarPrestamo('${libro.isbn}')">
                    Solicitar Préstamo
                </button>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 4. REGISTRO DE USUARIOS (MODELO EER)
// ==========================================
document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
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

        // B. Insertar en la tabla SUPERTIPO (profiles) [cite: 78, 189]
        const { error: profileError } = await db.from('profiles').insert([{ 
            id: authData.user.id, 
            curp: curp, 
            nombre_completo: nombre, 
            username: user, 
            tipo: tipo 
        }]);

        if (profileError) throw profileError;

        // C. Insertar en la tabla SUBTIPO (alumnos o profesores) [cite: 80, 84, 190]
        const tabla = tipo === 'alumno' ? 'alumnos' : 'profesores';
        const colId = tipo === 'alumno' ? 'boleta' : 'no_empleado';

        const { error: subTypeError } = await db.from(tabla).insert([{ 
            id: authData.user.id, 
            [colId]: id_escolar 
        }]);

        if (subTypeError) throw subTypeError;

        // Éxito
        alert("¡Registro exitoso! Ya eres parte de la comunidad.");
        modal.style.display = "none";
        document.getElementById('regForm').reset(); // Limpiar el formulario
        
    } catch (err) {
        alert("Error al registrar: " + err.message);
        console.error("Detalle del error:", err);
    }
};

// Función vacía para evitar el ReferenceError del botón de buscar
function buscarLibro() {
    alert("Función de búsqueda en desarrollo...");
} // <-- Faltaba cerrar esta llave aquí

// ==========================================
// 5. SOLICITAR PRÉSTAMO
// ==========================================
window.solicitarPrestamo = async function(isbn) {
    try {
        // 1. Verificar si hay un usuario conectado (Supabase inicia sesión automáticamente al registrarse)
        const { data: { session } } = await db.auth.getSession();
        
        if (!session) {
            alert("Debes registrarte o iniciar sesión para poder solicitar un libro.");
            document.getElementById("modalRegistro").style.display = "block";
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

// Ejecutar la carga de libros en cuanto el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    // Asegurarnos de que el placeholder esté correcto al cargar
    actualizarPlaceholder();
});
