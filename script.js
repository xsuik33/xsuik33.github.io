// En tu script.js de GitHub Pages
const API_URL = "https://biblio-escom-api.onrender.com";
const modal = document.getElementById("modalRegistro");
const btn = document.getElementById("btnRegistro");
const span = document.querySelector(".close");

// Forzamos que el evento se asigne correctamente
if (btn && modal) {
    btn.onclick = () => {
        console.log("Abriendo modal..."); // Esto saldrá en F12 si funciona
        modal.style.display = "block";
    };
}

if (span) {
    span.onclick = () => {
        modal.style.display = "none";
    };
}

// Cerrar al hacer clic fuera
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};
