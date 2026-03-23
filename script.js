// 1. CONFIGURACIÓN DE SUPABASE (Copia esto de tu panel de Settings > API)
const supabaseUrl = 'TU_PROJECT_URL_AQUÍ'; 
const supabaseKey = 'TU_ANON_KEY_AQUÍ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. DATOS ESTÁTICOS DE LIBROS
const libros = [
    { titulo: "Crimen y Castigo", autor: "Fiódor Dostoyevski", genero: "Novela Psicológica", emoji: "⚖️" },
    { titulo: "La Tregua", autor: "Mario Benedetti", genero: "Drama Romántico", emoji: "☕" },
    { titulo: "Árbol de Diana", autor: "Alejandra Pizarnik", genero: "Poesía", emoji: "🌿" },
    { titulo: "La Metamorfosis", autor: "Franz Kafka", genero: "Existencialismo", emoji: "🪲" },
    { titulo: "Así habló Zaratustra", autor: "Friedrich Nietzsche", genero: "Filosofía", emoji: "🏔️" },
    { titulo: "Los hermanos Karamázov", autor: "Fiódor Dostoyevski", genero: "Novela", emoji: "👨‍👦‍👦" },
    { titulo: "La última inocencia", autor: "Alejandra Pizarnik", genero: "Poesía", emoji: "🌑" },
    { titulo: "El Proceso", autor: "Franz Kafka", genero: "Surrealismo", emoji: "🏛️" }
];

// 3. CARGAR LIBROS EN EL GRID
function cargarLibros() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;
    grid.innerHTML = libros.map(libro => `
        <div class="book-card">
            <div class="book-img">${libro.emoji}</div>
            <div class="book-info">
                <h4>${libro.titulo}</h4>
                <span><strong>${libro.autor}</strong></span>
                <p>${libro.genero}</p>
                <button class="btn-sm">Solicitar Préstamo</button>
            </div>
        </div>
    `).join('');
}

// 4. LÓGICA DEL MODAL
const modal = document.getElementById("modalRegistro");
const btn = document.getElementById("btnRegistro");
const span = document.querySelector(".close");

btn.onclick = () => modal.style.display = "block";
span.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

function actualizarPlaceholder() {
    const tipo = document.getElementById('tipo').value;
    document.getElementById('id_esc').placeholder = (tipo === 'alumno') ? "Número de Boleta" : "Número de Empleado";
}

// 5. REGISTRO EN SUPABASE
document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const tipo = document.getElementById('tipo').value;

    const { data, error } = await supabase.auth.signUp({
        email: `${user}@escom.ipn.mx`,
        password: pass,
        options: {
            data: {
                nombre: document.getElementById('nombre').value,
                username: user,
                tipo: tipo
            }
        }
    });

    if (error) return alert("Error: " + error.message);

    const tabla = tipo === 'alumno' ? 'alumnos' : 'profesores';
    const col = tipo === 'alumno' ? 'boleta' : 'no_empleado';

    const { error: dbError } = await supabase.from(tabla).insert([
        { id: data.user.id, [col]: document.getElementById('id_esc').value }
    ]);

    if (dbError) alert("Error DB: " + dbError.message);
    else {
        alert("¡Registro exitoso en Supabase!");
        modal.style.display = "none";
    }
};
document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault();
    
    // Captura de datos del formulario
    const curp = document.getElementById('curp').value;
    const nombre = document.getElementById('nombre').value;
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const tipo = document.getElementById('tipo').value; // 'alumno' o 'profesor'
    const id_escolar = document.getElementById('id_esc').value;

    try {
        // 1. Crear cuenta en la Auth de Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${user}@escom.ipn.mx`,
            password: pass,
        });

        if (authError) throw authError;

        // 2. Insertar en el SUPERTIPO (profiles)
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
                id: authData.user.id, 
                curp: curp, 
                nombre_completo: nombre, 
                username: user, 
                tipo: tipo 
            }]);

        if (profileError) throw profileError;

        // 3. Insertar en el SUBTIPO (alumnos o profesores)
        const tabla = tipo === 'alumno' ? 'alumnos' : 'profesores';
        const campoId = tipo === 'alumno' ? 'boleta' : 'no_empleado';

        const { error: subTypeError } = await supabase
            .from(tabla)
            .insert([{ 
                id: authData.user.id, 
                [campoId]: id_escolar 
            }]);

        if (subTypeError) throw subTypeError;

        alert("¡Registro exitoso en la nube de Supabase!");
        modal.style.display = "none";
        
    } catch (err) {
        alert("Error en el registro: " + err.message);
        console.error(err);
    }
};

async function iniciarSesion(usuario, password) {
    const email = `${usuario}@escom.ipn.mx`;
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Error al ingresar: " + error.message);
    } else {
        alert("¡Bienvenido a BiblioTech!");
        // Aquí podrías redirigir o mostrar el perfil del usuario
    }
}

document.addEventListener('DOMContentLoaded', cargarLibros);
