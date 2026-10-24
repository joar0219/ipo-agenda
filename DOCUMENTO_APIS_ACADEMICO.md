# DOCUMENTO TÉCNICO Y ACADÉMICO: APIS RESTful
## Proyecto: Sistema de Gobernanza y Agenda Institucional (IPO Gestión)

---

### 1. Introducción y Arquitectura de la Solución
El presente informe documenta el desarrollo y especificación de **tres (3) Interfaces de Programación de Aplicaciones (APIs RESTful)** diseñadas para la plataforma **IPO Gestión**. Estas APIs permiten la autenticación segura sin contraseña (Zero Trust / OTP) y la gestión integral del ciclo de vida (CRUD) del personal eclesiástico (pastores, presbíteros y directivas).

* **Protocolo de comunicación:** HTTP/1.1 y HTTP/2 sobre SSL/TLS (HTTPS).
* **Formato de intercambio de datos:** JSON (`application/json`).
* **Seguridad y Control de Acceso:** Tokens de sesión y validación de roles en base de datos PostgreSQL mediante Supabase.
* **Manejo Estándar de Códigos de Estado:**
  - `200 OK`: Petición procesada con éxito.
  - `201 Created`: Recurso creado satisfactoriamente en la base de datos.
  - `400 Bad Request`: Parámetros obligatorios faltantes o sintaxis inválida.
  - `401 Unauthorized`: Credenciales erróneas o token expirado.
  - `404 Not Found`: El recurso solicitado no existe.
  - `405 Method Not Allowed`: Método HTTP no permitido en el endpoint.
  - `500 Internal Server Error`: Falla no controlada en el servidor.

---

### 2. API 1: Autenticación Institucional (Login)
* **Archivo de implementación:** `api/auth/login.js`
* **Ruta de acceso:** `POST /api/auth/login`
* **Propósito:** Validar la identidad del pastor mediante código de un solo uso (OTP vía WhatsApp/SMS) o credenciales clásicas, emitiendo un token de acceso seguro para la sesión.

#### A. Especificación de la Petición (Request)
* **Método HTTP:** `POST`
* **Headers:**
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
* **Cuerpo de la Petición (Request Body - JSON):**
  ```json
  {
    "telefono": "+573151234567",
    "codigo": "748291"
  }
  ```

#### B. Especificación de la Respuesta (Response)
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "success": true,
    "codigo": 200,
    "mensaje": "Autenticación exitosa en IPO Gestión",
    "data": {
      "tokenAcceso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OCIsImV4cCI6MTcxOT...",
      "tipoToken": "Bearer",
      "expiraEn": 3600,
      "usuario": {
        "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ef",
        "telefono": "+573151234567",
        "nombreCompleto": "José Orlando Arcila",
        "rol": "Pastor",
        "sede": "Sede Central Roldanillo",
        "ciudad": "Roldanillo"
      }
    }
  }
  ```
* **Respuesta de Error (`401 Unauthorized`):**
  ```json
  {
    "success": false,
    "codigo": 401,
    "mensaje": "Código de verificación incorrecto o expirado."
  }
  ```

#### C. Ejemplo en cURL para Pruebas:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"telefono": "+573151234567", "codigo": "748291"}'
```

---

### 3. API 2: CRUD de Usuarios - Consultar y Registrar (Read & Create)
* **Archivo de implementación:** `api/usuarios/index.js`
* **Rutas de acceso:** 
  - `GET /api/usuarios`
  - `POST /api/usuarios`
* **Propósito:** Permitir a las directivas consultar el censo de miembros activos con sus sedes y dar de alta a nuevos pastores en la organización.

#### A. Operación 1: Listar Directorio (`GET /api/usuarios`)
* **Método HTTP:** `GET`
* **Parámetros Opcionales (Query Params):** `?rol=Pastor&activo=true`
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "success": true,
    "codigo": 200,
    "total": 2,
    "mensaje": "Directorio de miembros obtenido con éxito",
    "data": [
      {
        "id": "e4f5a6b7-8901-2345-6789-abcdef012345",
        "nombre_completo": "José Orlando Arcila",
        "telefono": "+573151234567",
        "rol": "Pastor",
        "activo": true,
        "sedes": {
          "id": "11111111-2222-3333-4444-555555555555",
          "nombre": "Sede Central Roldanillo",
          "ciudad": "Roldanillo",
          "departamento": "Valle del Cauca"
        }
      },
      {
        "id": "b8c9d0e1-2345-6789-0123-abcdef456789",
        "nombre_completo": "Gabriel González",
        "telefono": "+573189876543",
        "rol": "Presbitero",
        "activo": true,
        "sedes": {
          "id": "22222222-3333-4444-5555-666666666666",
          "nombre": "Presbiterio Central Pereira",
          "ciudad": "Pereira",
          "departamento": "Risaralda"
        }
      }
    ]
  }
  ```

#### B. Operación 2: Inscribir Miembro (`POST /api/usuarios`)
* **Método HTTP:** `POST`
* **Cuerpo de la Petición (Request Body - JSON):**
  ```json
  {
    "nombreCompleto": "Pastor Carlos Gómez",
    "telefono": "+573105556677",
    "rol": "Pastor",
    "sedeId": "11111111-2222-3333-4444-555555555555",
    "notas": "Asignado a zona rural de Roldanillo"
  }
  ```
* **Respuesta Exitosa (`201 Created`):**
  ```json
  {
    "success": true,
    "codigo": 201,
    "mensaje": "Miembro institucional registrado exitosamente.",
    "data": {
      "id": "c7d8e9f0-1234-5678-9012-3456789abcde",
      "nombre_completo": "Pastor Carlos Gómez",
      "telefono": "+573105556677",
      "rol": "Pastor",
      "activo": true,
      "sedes": {
        "id": "11111111-2222-3333-4444-555555555555",
        "nombre": "Sede Central Roldanillo",
        "ciudad": "Roldanillo"
      }
    }
  }
  ```

#### C. Ejemplo en cURL para Pruebas:
```bash
# Consultar directorio
curl -X GET http://localhost:3000/api/usuarios

# Crear un pastor
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombreCompleto": "Pastor Carlos Gómez", "telefono": "+573105556677", "rol": "Pastor"}'
```

---

### 4. API 3: CRUD de Usuarios - Detalle, Actualización y Eliminación (Update & Delete)
* **Archivo de implementación:** `api/usuarios/[id].js`
* **Rutas de acceso:**
  - `GET    /api/usuarios/:id`
  - `PUT    /api/usuarios/:id`
  - `DELETE /api/usuarios/:id`
* **Propósito:** Administrar de forma granular a un miembro específico (cambio de sede, suspensión de acceso preventivo o desvinculación).

#### A. Operación 1: Actualizar Información o Estado (`PUT /api/usuarios/:id`)
* **Método HTTP:** `PUT` o `PATCH`
* **URL:** `/api/usuarios/c7d8e9f0-1234-5678-9012-3456789abcde`
* **Cuerpo de la Petición (Request Body - JSON):**
  ```json
  {
    "rol": "Presbitero",
    "activo": false,
    "notas": "Suspensión temporal por traslado ministerial"
  }
  ```
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "success": true,
    "codigo": 200,
    "mensaje": "Perfil de usuario actualizado correctamente.",
    "data": {
      "id": "c7d8e9f0-1234-5678-9012-3456789abcde",
      "nombre_completo": "Pastor Carlos Gómez",
      "telefono": "+573105556677",
      "rol": "Presbitero",
      "activo": false
    }
  }
  ```

#### B. Operación 2: Eliminar Miembro (`DELETE /api/usuarios/:id`)
* **Método HTTP:** `DELETE`
* **URL:** `/api/usuarios/c7d8e9f0-1234-5678-9012-3456789abcde`
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "success": true,
    "codigo": 200,
    "mensaje": "Usuario con ID c7d8e9f0-1234-5678-9012-3456789abcde eliminado del sistema exitosamente."
  }
  ```

#### C. Ejemplo en cURL para Pruebas:
```bash
# Actualizar / suspender
curl -X PUT http://localhost:3000/api/usuarios?id=c7d8e9f0-1234-5678-9012-3456789abcde \
  -H "Content-Type: application/json" \
  -d '{"activo": false, "rol": "Presbitero"}'

# Eliminar
curl -X DELETE http://localhost:3000/api/usuarios?id=c7d8e9f0-1234-5678-9012-3456789abcde
```

---

### 5. Resumen Comparativo de las 3 APIs para Entrega

| # | Endpoint | Métodos | Función CRUD / Negocio | Conexión en Base de Datos |
|---|---|---|---|---|
| **1** | `/api/auth/login` | `POST` | Autenticación OTP por WhatsApp o Email | `auth.users` + `perfiles` |
| **2** | `/api/usuarios` | `GET`, `POST` | **C**reate & **R**ead (Directorio de personal) | `perfiles` JOIN `sedes` |
| **3** | `/api/usuarios/[id]` | `GET`, `PUT`, `DELETE` | **R**ead one, **U**pdate & **D**elete (Gestión individual) | `perfiles` WHERE id = :id |
