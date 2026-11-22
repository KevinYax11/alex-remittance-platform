# Alex Remittance Platform

Plataforma full-stack para la gestión, cálculo y trazabilidad de remesas familiares entre Estados Unidos y Guatemala (USD ↔ GTQ), con conversión de divisas en tiempo real, autenticación basada en roles y visualización analítica de tendencias.

---

## 📌 Descripción del Proyecto

**Alex Remittance Platform** resuelve la necesidad de coordinar de forma transparente el envío de remesas familiares entre dos roles fundamentales:
* **Emisor (Carlos en EE.UU.):** Registra envíos en dólares estadounidenses (USD). La plataforma consulta automáticamente la tasa de cambio vigente (vía API Frankfurter con fallback resiliente) y calcula el valor equivalente en Quetzales guatemaltecos (GTQ). Además, cuenta con un panel analítico interactivo con gráficos de líneas para evaluar tendencias temporales.
* **Receptor (Don Alex en Guatemala):** Puede solicitar fondos indicando montos en GTQ y confirmar de forma explícita la recepción de remesas enviadas, garantizando un ciclo cerrado y trazabilidad de cada transferencia.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | **Python 3.11**, **FastAPI**, **SQLAlchemy** (asyncpg / modo asíncrono), **Pydantic v2**, **python-jose** (JWT), **passlib** (Bcrypt), **HTTPX** |
| **Frontend** | **React 19**, **TypeScript**, **React Router v7**, **Recharts** (gráficos analíticos), **Axios** (interceptor JWT) |
| **Base de Datos** | **PostgreSQL 15** (con persistencia en volúmenes Docker y healthchecks integrados) |
| **Infraestructura** | **Docker** & **Docker Compose**, arquitectura contenerizada con red puente (`remittance_network`) |

---

## 🏛️ Arquitectura y Flujo de Trabajo

### Roles de Usuario
1. **Emisor (`emisor`)**:
   * Envía dinero en USD (`amount_usd`).
   * Consulta el historial paginado de transferencias y el total acumulado.
   * Alterna la visualización de la gráfica de remesas entre USD y GTQ.
2. **Receptor (`receptor`)**:
   * Registra solicitudes de dinero en GTQ (`amount_gtq`).
   * Visualiza remesas pendientes y confirma su recepción en un clic (`PATCH /transactions/{id}/confirm`).

### Conversión de Moneda Resiliente
El servicio `exchange_service.py` consulta la API pública de **Frankfurter** (`USD -> GTQ`). En caso de interrupciones de red o fallas de conectividad externa, implementa una tasa de contingencia (*fallback*) para garantizar alta disponibilidad en todo momento.

---

## 🚀 Inicio Rápido con Docker Compose (2 Pasos)

### Requisitos Previos
* [Docker](https://www.docker.com/) y Docker Compose instalados en tu sistema.

### Paso 1: Configurar Variables de Entorno
Copia el archivo de plantilla a `.env` en la raíz del proyecto:
```bash
cp .env.example .env
```
*(Los valores por defecto en `.env.example` están listos para funcionar inmediatamente en entornos de desarrollo local).*

### Paso 2: Levantar los Contenedores
Ejecuta el comando para construir y poner en marcha los servicios:
```bash
docker-compose up --build
```

Una vez levantados los servicios:
* **Frontend Web:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:8000](http://localhost:8000)
* **Documentación Interactiva Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Documentación ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 💻 Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu entorno local:

### 1. Base de Datos
Asegúrate de tener una instancia de PostgreSQL ejecutándose y crea la base de datos `remittance_db`:
```sql
CREATE DATABASE remittance_db;
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend (React + TypeScript)
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

---

## 📡 Catálogo de Endpoints REST

### Autenticación (`/api/v1/auth`)
* `POST /api/v1/auth/register` - Registro de nuevos usuarios (`full_name`, `email`, `password`, `role`).
* `POST /api/v1/auth/login` - Autenticación con credenciales y generación de token JWT Bearer.

### Usuarios (`/api/v1/users`)
* `GET /api/v1/users/me` *(Protegido)* - Retorna los datos del perfil del usuario actualmente autenticado.

### Transacciones (`/api/v1/transactions`)
* `POST /api/v1/transactions/` *(Protegido)* - Registrar un nuevo envío (`type: envio`, `amount_usd`) o solicitud (`type: solicitud`, `amount_gtq`).
* `GET /api/v1/transactions/?page=1&page_size=10` *(Protegido)* - Listado paginado de transacciones del usuario.
* `PATCH /api/v1/transactions/{transaction_id}/confirm` *(Protegido)* - Confirmación de recepción de remesa por parte del receptor.

---

## 🖼️ Interfaz de Usuario

| Vista | Descripción |
| :--- | :--- |
| **Inicio de Sesión** | Formulario con validación de entradas, alertas de error y redirección automática según el rol asignado (`/dashboard/emisor` o `/dashboard/receptor`). |
| **Panel Emisor (Carlos)** | Calculadora de envío USD a GTQ, gráfica interactiva de tendencias con selector de divisa y tabla de estado de remesas. |
| **Panel Receptor (Don Alex)** | Formulario de solicitud de fondos en GTQ y listado interactivo con botón para confirmar la recepción de dinero. |

---

## 📂 Estructura del Repositorio

```text
alex-remittance-platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # auth.py, transactions.py, users.py
│   │   ├── core/              # config.py, database.py, security.py
│   │   ├── models/            # SQLAlchemy models (user, transaction)
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # auth, transaction y exchange rate services
│   │   └── main.py            # Instancia FastAPI, CORS y registro de routers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/               # auth.ts, axios.ts, transactions.ts
│   │   ├── components/        # LoginForm, Navbar, TransactionChart, TransactionForm, TransactionList
│   │   ├── context/           # AuthContext.tsx
│   │   ├── pages/             # LoginPage.tsx, EmisorPage.tsx, ReceptorPage.tsx
│   │   ├── types/             # index.ts (interfaces TypeScript)
│   │   ├── App.tsx
│   │   └── index.tsx          # Punto de montaje ReactDOM
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── docker-compose.yml         # Orquestación de servicios (db, backend, frontend)
├── .env.example               # Plantilla de variables de entorno para Docker
├── .gitignore                 # Reglas estándar para Python, Node y Secrets
└── README.md                  # Documentación principal del proyecto
```

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT.
