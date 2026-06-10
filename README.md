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
El proyecto nació para resolver tres problemas críticos identificados en el control manual de una biblioteca mediante la definición de entidades clave (`Usuario`, `Libro`, `Ejemplar`, `Préstamo`, `Multa`, `Bibliotecario`, `Autor`, `Editorial`, `Estantería`):
1. **Certeza sobre la posesión y tiempos:** Al relacionar `Ejemplar`, `Préstamo` y `Usuario`, el sistema permite generar consultas instantáneas para saber exactamente qué usuario tiene qué código de barras y mostrar su fecha límite.
2. **Registro digital y pérdida de credenciales:** Al digitalizar los datos en la entidad `Usuario` y utilizar la CURP, la biblioteca ya no depende de carnets físicos, recuperando el historial de inmediato.
3. **Cálculo automático de multas:** Se establecieron los atributos `Fecha_Devolución_E` (Esperada) y `Fecha_Entrega_R` (Real) en el `Préstamo`. Al relacionarlo con `Multa`, el sistema ejecuta una función lógica que resta ambas fechas y multiplica por la tarifa diaria, eliminando la arbitrariedad en los cobros.

<div align="center">
  <img loading="lazy" src="./Imágenes/Modelos/diagrama-er.png" alt="Diagrama Entidad-Relación" width="800"/>
  <br>
  <em>Figura 1: Diagrama ER inicial con la identificación de entidades y atributos base.</em>
</div>

### Fase 2: Modelo Entidad-Relación Extendido (EER)
El modelo básico resultaba insuficiente para escenarios del mundo real. Se implementó el Modelo EER para solucionar ambigüedades críticas, utilizando la Notación de Peter Chen para comprender a profundidad la semántica del negocio.

<div align="center">
  <img loading="lazy" src="./Imágenes/Modelos/diagrama-eer-chen.png" alt="Diagrama EER - Notación Peter Chen" width="800"/>
  <br>
  <em>Figura 2: Diagrama EER en notación Peter Chen resaltando las jerarquías y entidades débiles.</em>
</div>

#### 📐 Conceptos Avanzados Aplicados
* **Entidades Débiles (Dependencia de Existencia):** * `EJEMPLAR`: Se distinguió la obra intelectual (`Libro`) del objeto tangible físico (`Ejemplar`). Su identificador (`No_Copia`) es un discriminante parcial que solo cobra sentido al combinarse con el `ISBN` del libro.
  * `MULTA`: Se clasifica como débil transaccional; depende lógicamente de un registro de `Préstamo` previo que justifique la sanción.
* **Jerarquía de Especialización (Herencia ISA):**
  * Se implementó una jerarquía **Total y Disjunta** para separar los privilegios entre alumnos y profesores sin generar valores nulos en las tablas. Es *Disjunta* porque no se puede ser ambos a la vez, y *Total* porque todo usuario debe tener un rol.
* **Relaciones de Orden Superior (Agregación):** La relación ternaria `ASIGNA` vincula al `Bibliotecario`, el `Ejemplar` y la `Estantería` para rastrear el alta de inventario.

### Fase 3 y 4: Transformación Relacional e Implementación DDL/DCL
El modelo EER se tradujo a esquemas relacionales exactos y se construyó en PostgreSQL (Supabase), aplicando reglas matemáticas estrictas. Para esta fase, la notación evolucionó al **Modelo Relacional (Notación Crow's Foot)**, el cual es ideal para la implementación técnica ya que define explícitamente las Llaves Primarias (PK) y Foráneas (FK).

<div align="center">
  <img loading="lazy" src="./Imágenes/Modelos/diagrama-relacional.png" alt="Esquema del Modelo Relacional / Crow's Foot" width="800"/>
  <br>
  <em>Figura 3: Modelo Relacional (Crow's Foot) consolidado tras aplicar las reglas de transformación.</em>
</div>

#### ⚙️ Transformación y Restricciones Físicas
1. **Resolución de Relaciones N:M:** La autoría múltiple de los libros se resolvió creando la tabla asociativa `ESCRITO_POR` (rompiendo la relación muchos a muchos entre `Libro` y `Autor`).
2. **Resolución de Herencia:** Los subtipos `ALUMNO` y `PROFESOR` se crearon como tablas independientes. Ambas utilizan la `CURP` simultáneamente como Llave Primaria (PK) y Llave Foránea (FK) apuntando al supertipo `USUARIO`.
3. **Integridad Referencial (Borrado en Cascada):** Las entidades débiles se implementaron con la acción referencial `ON DELETE CASCADE`. Si un libro es retirado del catálogo, sus copias físicas en el inventario se eliminan automáticamente.
4. **Restricciones de Dominio (Constraints):**
   * `CHECK`: Se validó que la fecha de devolución no sea menor a la de salida, que el formato de los correos contenga un `@`, y que el estado de los ejemplares esté estrictamente limitado a: `Excelente`, `Desgastado` o `Dañado`.
   * `UNIQUE`: Aplicado a los correos electrónicos y números de boleta/empleado para evitar la creación de cuentas duplicadas.
   * `DEFAULT`: Asignación de valores por defecto (ej. multas en estado 'Pendiente') para agilizar transacciones.
5. **Seguridad (DCL):** Se configuraron los roles de administrador y cliente mediante políticas de acceso a nivel de fila (RLS) en Supabase.

### Fase 5: Desarrollo de la Interfaz Web
La robusta base de datos se consumió mediante peticiones asíncronas para dar vida a la plataforma web.

**✨ Funcionalidades Destacadas:**
* Registro e inicio de sesión seguro validado para la comunidad universitaria.
* Interfaz con soporte nativo para **Modo Claro / Modo Oscuro**.
* Paginación dinámica y renderizado de tarjetas de catálogo sin recargar la página.
* Sistema de internacionalización (i18n) en tiempo real (Español, Inglés y Francés).
* Sistema interactivo de préstamos con cálculo de fechas.

---

## 💻 Galería del Sistema

<details>
<summary>🖼️ Ver capturas de pantalla de la plataforma</summary>

| Pantalla de Inicio | Inicio de Sesión |
|:---:|:---:|
| <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Imágenes/Documentacion/Page.png" alt="Vista principal" width="400"/> | <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Imágenes/Documentacion/Login.png" alt="Login" width="400"/> |

| Registro de Usuario | Vista de Catálogo / Sección |
|:---:|:---:|
| <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Imágenes/Documentacion/Register.png" alt="Registro" width="400"/> | <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Imágenes/Documentacion/Section.png" alt="Vista de Sección" width="400"/> |

| Vista Previa del Libro |
|:---:|
| <img loading="lazy" src="https://github.com/xsuik33/xsuik33.github.io/blob/main/Imágenes/Documentacion/Preview.png" alt="Detalle del Libro" width="400"/> |

</details>
