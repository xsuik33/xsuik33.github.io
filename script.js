// Cambiamos el nombre de la variable para evitar el conflicto del SyntaxError
const supabaseClient = window.supabase.createClient('https://fetqdwxjgwqveqpxlkdo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldHFkd3hqZ3dxdmVxcHhsa2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODg2OTgsImV4cCI6MjA4OTg2NDY5OH0.-e4KBX2QgHIfgC62nBhmy30Z0I12SskQmbG1KK-QhkI');

// De aquí en adelante, asegúrate de usar 'supabaseClient' en lugar de 'supabase'
async function cargarLibros() {
    const { data: libros, error } = await supabaseClient.from('libros').select('*');
    // ... resto del código
}
async function cargarLibros() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;

    console.log("Intentando cargar libros desde Supabase...");
    const { data: libros, error } = await supabase.from('libros').select('*');

    if (error) {
        console.error("Error de Supabase:", error);
        grid.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    console.log("Libros recibidos:", libros);

    if (libros.length === 0) {
        grid.innerHTML = `<p>La tabla está vacía. Agrega libros en el panel de Supabase.</p>`;
        return;
    }

    grid.innerHTML = libros.map(libro => `
        <div class="book-card">
            <div class="book-img">${libro.emoji || '📖'}</div>
            <div class="book-info">
                <h4>${libro.titulo}</h4>
                <span>${libro.autor}</span>
                <button class="btn-primary">Solicitar</button>
            </div>
        </div>
    `).join('');
}

// 3. LÓGICA DEL MODAL (VENTANA EMERGENTE)
const modal = document.getElementById("modalRegistro");
const btn = document.getElementById("btnRegistro");
const span = document.querySelector(".close");

// Abrir modal
btn.onclick = () => {
    modal.style.display = "block";
};

// Cerrar modal (X)
span.onclick = () => {
    modal.style.display = "none";
};

// Cerrar al hacer clic fuera de la ventana
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Actualizar placeholder según el rol (Alumno/Profesor)
function actualizarPlaceholder() {
    const tipo = document.getElementById('tipo').value;
    const inputId = document.getElementById('id_esc');
    if (tipo === 'alumno') {
        inputId.placeholder = "Número de Boleta";
    } else {
        inputId.placeholder = "Número de Empleado";
    }
}

// 4. REGISTRO DE USUARIOS (JERARQUÍA EER)
document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const curp = document.getElementById('curp').value;
    const nombre = document.getElementById('nombre').value;
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const tipo = document.getElementById('tipo').value;
    const id_escolar = document.getElementById('id_esc').value;

    try {
        // A. Crear usuario en Auth de Supabase (Sustituye a bcrypt)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${user}@escom.ipn.mx`,
            password: pass,
            options: {
                data: { nombre, username: user, tipo }
            }
        });

        if (authError) throw authError;

        // B. Insertar en el Supertipo (profiles)
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
                id: authData.user.id, 
                curp, 
                nombre_completo: nombre, 
                username: user, 
                tipo 
            }]);

        if (profileError) throw profileError;

        // C. Insertar en el Subtipo (alumnos o profesores)
        const tabla = tipo === 'alumno' ? 'alumnos' : 'profesores';
        const colId = tipo === 'alumno' ? 'boleta' : 'no_empleado';

        const { error: subTypeError } = await supabase
            .from(tabla)
            .insert([{ 
                id: authData.user.id, 
                [colId]: id_escolar 
            }]);

        if (subTypeError) throw subTypeError;

        alert("¡Registro exitoso! Ya eres parte de BiblioTech ESCOM.");
        modal.style.display = "none";
        document.getElementById('regForm').reset();
        
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    // Asegurar que el select funcione desde el inicio
    document.getElementById('tipo').addEventListener('change', actualizarPlaceholder);
});
