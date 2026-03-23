// En tu script.js de GitHub Pages
const API_URL = "https://biblio-escom-api.onrender.com";

document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault();
    const datos = {
        curp: document.getElementById('curp').value,
        nombre: document.getElementById('nombre').value,
        user: document.getElementById('user').value,
        password: document.getElementById('pass').value,
        tipo: document.getElementById('tipo').value,
        id_escolar: document.getElementById('id_esc').value
    };

    const res = await fetch(`${API_URL}/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    if (res.ok) alert("¡Registrado mediante Python en la nube!");
};
