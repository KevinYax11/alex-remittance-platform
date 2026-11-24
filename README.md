# Senda Payments

[![CI](https://github.com/KevinYax11/senda-payments/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/KevinYax11/senda-payments/actions/workflows/ci.yml?query=branch%3Adevelop)

Demo full-stack de remesas USD/GTQ con autenticación por roles, conversión con una tasa de referencia y un historial compartido entre remitente y beneficiario.

## Prueba la demo

Con [Docker y Docker Compose](https://www.docker.com/) instalados, ejecuta este
comando desde la raíz del repositorio y abre [http://localhost:3000](http://localhost:3000).

```bash
docker compose up --build
```

1. Pulsa **Probar como Remitente** y envía una remesa a `receiver@sendapayments.com`.
2. Cierra sesión, entra con **Probar como Beneficiario** y pulsa **Confirmar Recepción**.
3. Vuelve al panel del remitente y verifica que la remesa figure como **Confirmado**.

Al arrancar, el backend crea las cuentas demo si la tabla de usuarios está
vacía. También puedes ingresar las credenciales manualmente. Desde **Crear cuenta** puedes registrar tus propios usuarios de prueba. Cada cuenta nueva tiene las vistas **Enviar** y **Recibir** en una sola sesión.

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| Remitente | `sender@sendapayments.com` | `SendaPass123!` |
| Beneficiario | `receiver@sendapayments.com` | `SendaPass123!` |

La [documentación interactiva de la API](http://localhost:8000/docs) también
queda disponible. Para personalizar el entorno, copia `.env.example` a `.env`.
En un entorno con cuentas reales, usa una base propia y configura `DEMO_MODE=false`.

## Descripción del Proyecto

**Senda Payments** resuelve la necesidad de coordinar de forma transparente el envío de remesas y pagos transfronterizos entre dos roles fundamentales:
* **Emisor / Remitente:** Registra envíos en dólares estadounidenses (USD). La plataforma consulta la tasa de referencia y calcula el equivalente en quetzales guatemaltecos (GTQ). El panel muestra un gráfico de los movimientos.
* **Receptor / Beneficiario:** Puede solicitar fondos indicando montos en GTQ y confirmar de forma explícita la recepción de transferencias enviadas, garantizando un ciclo cerrado y trazabilidad de cada operación.

---

## Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | **Python 3.11**, **FastAPI**, **SQLAlchemy** (asyncpg / modo asíncrono), **Pydantic v2**, **python-jose** (JWT), **passlib** (Bcrypt), **HTTPX** |
| **Frontend** | **React 19**, **TypeScript**, **React Router v7**, **Recharts** (gráficos analíticos), **Axios** (interceptor JWT) |
| **Base de Datos** | **PostgreSQL 15** (con persistencia en volúmenes Docker y healthchecks integrados) |
| **Infraestructura** | **Docker** & **Docker Compose**, arquitectura contenerizada con red puente (`remittance_network`) |

---

## Arquitectura y Flujo de Trabajo

### Roles de Usuario
1. **Emisor (`emisor`)**:
   * Envía dinero en USD (`amount_usd`) al correo de un beneficiario registrado (`beneficiary_email`).
   * Consulta el historial paginado de transferencias.
   * Alterna la visualización de la gráfica de transferencias entre USD y GTQ.
2. **Receptor (`receptor`)**:
   * Registra solicitudes de dinero en GTQ por correo. La cuenta destino ve la solicitud en **Enviar**.
   * Visualiza los envíos dirigidos a su cuenta y confirma su recepción en un clic (`PATCH /transactions/{id}/confirm`). El remitente ve el mismo estado en su historial.

### Saldo simulado

Cada cuenta nueva empieza con USD 1,000 y Q0. El envío debita USD en el momento en que se registra. Los quetzales quedan **por confirmar** para el beneficiario y pasan a **recibido y disponible** cuando confirma la recepción. Las solicitudes de fondos se registran sin modificar saldos. Si el saldo disponible no cubre un envío, la API devuelve HTTP 409 y conserva el historial.

### Conversión de moneda

El backend consulta la tasa de referencia USD/GTQ en [Frankfurter v2](https://frankfurter.dev/currencies/usd/gtq/).
Si el proveedor no devuelve una tasa válida, la demo usa `7.75 GTQ` por dólar como
valor de contingencia. Cada transacción guarda la tasa que se usó en el cálculo.

---

## Desarrollo Local (Sin Docker)

El backend aplica las migraciones de Alembic al iniciar. Los volúmenes
PostgreSQL de versiones anteriores se actualizan en el mismo lugar. Las remesas
históricas sin beneficiario siguen disponibles en el historial de su autor.

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

## Catálogo de Endpoints REST

### Autenticación (`/api/v1/auth`)
* `POST /api/v1/auth/register` - Registro con `full_name`, `email`, `password` y `accept_terms: true`. Devuelve una sesión con acceso a ambas vistas.
* `POST /api/v1/auth/login` - Autenticación con credenciales y generación de token JWT Bearer.

### Usuarios (`/api/v1/users`)
* `GET /api/v1/users/me` *(Protegido)* - Retorna los datos del perfil del usuario actualmente autenticado.
* `GET /api/v1/users/me/wallet` *(Protegido)* - Devuelve los saldos disponibles en USD y GTQ, y el importe en GTQ pendiente de confirmación.

### Transacciones (`/api/v1/transactions`)
* `POST /api/v1/transactions/` *(Protegido)* - Registrar un envío (`type: envio`, `amount_usd`, `beneficiary_email`) o una solicitud (`type: solicitud`, `amount_gtq`, `requested_from_email`).
* `GET /api/v1/transactions/?page=1&page_size=10` *(Protegido)* - Listar las transacciones creadas por la cuenta o dirigidas a ella. Admite `view=emisor` para envíos y solicitudes recibidas y `view=receptor` para recepciones y solicitudes enviadas.
* `PATCH /api/v1/transactions/{transaction_id}/confirm` *(Protegido)* - Confirmar la recepción de un envío como su beneficiario asignado.

---

## Interfaz de Usuario

| Vista | Descripción |
| :--- | :--- |
| **Inicio de Sesión** | Formulario con validación de entradas, alertas de error y redirección automática según el rol asignado (`/dashboard/emisor` o `/dashboard/receptor`). |
| **Panel Emisor (Remitente)** | Calculadora de envío USD a GTQ, gráfica interactiva de tendencias con selector de divisa y tabla de estado de transacciones. |
| **Panel Receptor (Beneficiario)** | Formulario de solicitud de fondos en GTQ y listado interactivo con botón para confirmar la recepción de transferencias. |

---

## Estructura del Repositorio

```text
senda-payments/
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

## Licencia

Este proyecto está distribuido bajo la [licencia MIT](LICENSE).

## Despliegue opcional en Render

El Blueprint [`render.yaml`](render.yaml) configura un servicio web y una base
PostgreSQL independiente. [`Dockerfile.demo`](Dockerfile.demo) sirve React y la API
bajo el mismo dominio. Render genera la clave JWT e inyecta la conexión interna
de PostgreSQL.

En Render, crea un **Blueprint**, vincula este repositorio y selecciona
`develop`. Las actualizaciones automáticas se publican cuando pasan los checks
de CI. Las cuentas y el historial demo son compartidos, así que usa únicamente
datos ficticios. La base gratuita expira a los 30 días.
[Documentación de Render](https://render.com/docs/free#free-postgres)
