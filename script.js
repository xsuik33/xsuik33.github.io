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

document.addEventListener('DOMContentLoaded', cargarLibros);
