const BACKEND_URL = "https://tu-app-en-render.onrender.com";

async function cargarLibros() {
    const res = await fetch(`${BACKEND_URL}/libros`);
    const libros = await res.json();
    // ... lógica para mostrar en el grid como ya la tenías
}
