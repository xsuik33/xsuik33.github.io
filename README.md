# xsuik33.github.io

# 📚 BiblioTech - Gestión de Biblioteca ESCOM

Plataforma web enfocada en la comunidad universitaria (alumnos y profesores) del Instituto Politécnico Nacional, diseñada para modernizar y facilitar la administración del catálogo de libros. El sistema permite a los usuarios explorar millones de ejemplares en la red global mediante una API externa y gestionar solicitudes de préstamos físicos del acervo local.

**Asignatura:** Bases de Datos
**Grupo:** 3CV2
**Profesor:** Gabriel Hurtado Avilés

## 👨‍💻 Equipo de Desarrollo
* González Ortiz Iker Saúl
* Juárez Bobadilla Miguel Isaí

---

## 🚀 Enlaces del Proyecto
* **Código Fuente:** [Repositorio en GitHub](https://github.com/xsuik33/xsuik33.github.io)
* **Demo en Vivo:** [BiblioTech Web](https://xsuik33.github.io)

---

## 🛠️ Tecnologías Implementadas

* **Base de Datos / Backend:** PostgreSQL alojado en Supabase.
* **Autenticación:** Supabase Auth (Integración segura de sesiones).
* **Consumo de Datos Externos:** Open Library API REST.
* **Frontend:** HTML5, CSS3 avanzado (Flexbox/Grid, variables CSS) y JavaScript vanilla (Fetch API, manipulación dinámica del DOM).
* **Despliegue:** GitHub Pages.

---

## 📖 Evolución y Metodología del Proyecto

El desarrollo de BiblioTech se llevó a cabo siguiendo una metodología estructurada desde la conceptualización de los datos hasta la implementación de la interfaz de usuario.

### Fase 1: Análisis y Modelo Entidad-Relación (ER)
El proyecto nació para resolver tres problemas críticos identificados en el control manual de una biblioteca:
1. **Certeza sobre la posesión:** Necesidad de saber exactamente qué usuario tiene qué código de barras y la fecha esperada de devolución.
2. **Pérdida de credenciales:** Transición a un registro digital utilizando la CURP o número de boleta/empleado.
3. **Cálculo de multas:** Automatización de las penalizaciones por retraso.

> 

### Fase 2: Modelo Entidad-Relación Extendido (EER)
El modelo básico evolucionó para soportar dependencias de existencia y jerarquías del mundo real. 
* Se implementaron **entidades débiles** para separar la obra intelectual abstracta (`Libro`) del objeto tangible físico (`Ejemplar`).
* Se utilizó **herencia (ISA)** para distinguir los privilegios de préstamo entre `Alumnos` y `Profesores`, evitando generar valores nulos (NULL) en la base de datos.

> 
> `![Diagrama EER Extendido](docs/images/diagrama-eer.png)`

### Fase 3 y 4: Transformación Relacional e Implementación DDL/DCL
El modelo EER se tradujo a esquemas relacionales exactos y se implementó en **PostgreSQL (Supabase)**. 
Para blindar la consistencia de la información desde los cimientos, se aplicaron:
* **Integridad Referencial:** Llaves primarias y foráneas con reglas de actualización/eliminación.
* **Restricciones de Dominio:** `NOT NULL`, `UNIQUE` para identificadores, y restricciones `CHECK` para evitar datos inválidos (ej. fechas ilógicas o formatos incorrectos).
* **Seguridad:** Asignación de roles y permisos mediante comandos DCL.

> 
> `![Esquema Relacional en Supabase](docs/images/esquema-relacional.png)`

### Fase 5: Desarrollo de la Interfaz Web
Finalmente, la lógica de datos se conectó con una interfaz de usuario responsiva e interactiva.

**✨ Funcionalidades Destacadas:**
* Registro e inicio de sesión seguro validado para la comunidad universitaria.
* Interfaz con soporte nativo para **Modo Claro / Modo Oscuro**.
* Paginación dinámica y renderizado de tarjetas sin recargar la página.
* Sistema de internacionalización (i18n) para Español, Inglés y Francés.
* Préstamos automatizados con cálculo de fecha de devolución a 7 días.

---

## 💻 Galería del Sistema

<details>
<summary>🖼️ Ver capturas de pantalla de la plataforma</summary>

| Pantalla de Inicio | Inicio de Sesión |
|:---:|:---:|
| <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Page.png" alt="Vista principal" width="400"/> | <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Login.png" alt="Login" width="400"/> |

| Registro de Usuario | Vista de Catálogo / Sección |
|:---:|:---:|
| <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Register.png" alt="Registro" width="400"/> | <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Section.png" alt="Vista de Sección" width="400"/> |

| Vista Previa del Libro |
|:---:|
| <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Preview.png" alt="Detalle del Libro" width="400"/> |

</details>
