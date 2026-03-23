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
3. El "Z-Index" en el CSS
A veces el modal sí se abre, pero se queda "atrás" de la página y no lo ves. Asegúrate de que tu style.css tenga esto:

CSS
.modal {
    display: none; 
    position: fixed !important; 
    z-index: 9999 !important; /* Valor muy alto para que salga al frente */
    left: 0; top: 0;
    width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.9);
}
