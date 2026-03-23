from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from pydantic import BaseModel

app = FastAPI()

# Configuración de Supabase (Protegida en el servidor)
url: str = "TU_PROJECT_URL"
key: str = "TU_ANON_KEY"
supabase: Client = create_client(url, key)

class RegistroUsuario(BaseModel):
    curp: str
    nombre: str
    user: str
    password: str
    tipo: str # 'alumno' o 'profesor'
    id_escolar: str

@app.post("/registrar")
async def registrar_usuario(datos: RegistroUsuario):
    # 1. Crear usuario en Auth
    user_auth = supabase.auth.sign_up({
        "email": f"{datos.user}@escom.ipn.mx",
        "password": datos.password,
    })

    if not user_auth.user:
        raise HTTPException(status_code=400, detail="Error en Auth")

    user_id = user_auth.user.id

    # 2. Insertar en Profiles (Supertipo)
    supabase.table("profiles").insert({
        "id": user_id,
        "curp": datos.curp,
        "nombre_completo": datos.nombre,
        "username": datos.user,
        "tipo": datos.tipo
    }).execute()

    # 3. Insertar en Alumno o Profesor (Subtipo)
    tabla = "alumnos" if datos.tipo == "alumno" else "profesores"
    col = "boleta" if datos.tipo == "alumno" else "no_empleado"
    
    supabase.table(tabla).insert({
        "id": user_id,
        col: datos.id_escolar
    }).execute()

    return {"message": "Registro exitoso en Supabase via Python"}

@app.get("/libros")
async def obtener_libros():
    # Traer libros para el catálogo
    response = supabase.table("libros").select("*").execute()
    return response.data
