# BarberGo 💈 — Delivery de Barbería a Domicilio

[![CI / Monorepo Check](https://img.shields.io/badge/pnpm-9%20%7C%2011-orange.svg?style=flat-square&logo=pnpm)](https://pnpm.io)
[![Turborepo](https://img.shields.io/badge/Turborepo-v2.0-blue.svg?style=flat-square&logo=turborepo)](https://turbo.build)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-green.svg?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat-square&logo=react)](https://react.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2056-black.svg?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20Strict-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg?style=flat-square&logo=prisma)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**BarberGo** es una plataforma tecnológica de servicios on-demand inspirada en el modelo operativo de transporte (Uber, DoorDash). Conecta clientes con barberos profesionales que se desplazan a su domicilio, ofreciendo despacho geoespacial en tiempo real, transaccionalidad ACID para evitar dobles reservas, tracking GPS en vivo y pagos integrados mediante Stripe Connect.

---

## 🚀 Arquitectura y Capacidades Clave

### 1. Despacho Geoespacial Dinámico (Haversine & PostGIS)
- Filtrado de barberos activos en un radio configurable (10 km por defecto) usando la fórmula matemática de Haversine.
- Cálculo de distancias esféricas y tiempos estimados de llegada en tiempo real.

### 2. Concurrencia ACID y Bloqueo de Horarios
- Creación de reservas protegida en transacciones atómicas (`$transaction`).
- Verificación de disponibilidad (`isSlotAvailable`) con margen de seguridad (buffer de 15 minutos de traslado) y bloqueo instantáneo de slots en estado `PENDING_PAYMENT`.

### 3. Telemetría GPS y WebSockets en Tiempo Real
- Comunicación bidireccional mediante **Socket.io** con validación estricta por esquemas **Zod** en todos los eventos entrantes.
- Tareas en segundo plano en la app móvil del barbero (`expo-task-manager` + `expo-location`) que transmiten coordenadas GPS cada 10 metros/segundos.
- Aislamiento de eventos en salas específicas (`barber:<id>`, `client:<id>`, `booking:<id>`).

### 4. Pagos Seguros con Stripe Connect
- Desglose transparente: `Subtotal + 5% Service Fee`.
- Webhooks desacoplados con validación de firmas criptográficas e idempotencia ante reintentos de red.

### 5. Estética "Midnight Barber Atelier" (Frontend Web)
- Chasis oscuro de alta gama (`#0d0f12`, acentos ámbar dorado `hsl(40 92% 52%)`, micro-bordes sutiles `border-white/10`).
- Microinteracciones táctiles basadas en la física de resortes de **Emil Kowalski**.
- Cumplimiento de accesibilidad motriz con soporte nativo para `@media (prefers-reduced-motion: reduce)`.

---

## 📁 Estructura del Monorepo

El proyecto está organizado como un monorepo modular orquestado por **pnpm Workspaces** y **Turborepo**:

```
barber-delivery-app/
├── apps/
│   ├── api/                # Backend API (Express + Prisma + PostgreSQL + Socket.io)
│   │   ├── prisma/         # Schema y migraciones
│   │   ├── src/
│   │   │   ├── controllers/# Controladores HTTP desacoplados (SRP)
│   │   │   ├── services/   # Lógica pura de negocio (ACID, disponibilidad, sockets)
│   │   │   ├── routes/     # Endpoints de la API REST
│   │   │   ├── middleware/ # Auth JWT, rate-limiters, validación Zod
│   │   │   └── schemas/    # Esquemas Zod para HTTP y WebSockets
│   │   └── __tests__/      # Tests unitarios e integración (Jest + Supertest)
│   ├── web/                # Panel Web (React 18 + Vite + Tailwind + Leaflet)
│   ├── mobile-client/      # App móvil cliente (Expo SDK 56 + React Native)
│   └── mobile-barber/      # App móvil barbero (Expo SDK 56 + Background GPS)
├── packages/
│   └── shared-types/       # Contratos y tipos Zod/TypeScript compartidos
├── odd/                    # Especificaciones y tracking ODD (Organic Driven Dev)
├── pnpm-workspace.yaml     # Configuración de workspaces y security overrides
├── turbo.json              # Pipeline de caché y tareas paralelas
├── biome.json              # Linter y formateador unificado
└── docker-compose.yml      # Entorno de contenedores para producción y desarrollo
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Monorepo** | pnpm 9/11 + Turborepo + Biome |
| **Backend API** | Node.js 20 LTS, Express 4, Prisma ORM, PostgreSQL 15, Socket.io, Stripe SDK, Zod, bcryptjs, jsonwebtoken |
| **Frontend Web** | React 18, Vite 5, Tailwind CSS, Leaflet, Zustand, TanStack Query, Lucide Icons |
| **Mobile Apps** | Expo SDK 56, React Native 0.85, React 19, Expo Secure Store, Expo Location, Expo TaskManager |
| **Testing** | Jest, Supertest, ts-jest (34/34 tests passing) |
| **Seguridad** | Rate limiters diferenciados, cookies HTTP-Only, tokens en memoria, hardware-backed storage en mobile |

---

## ⚡ Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** >= 20.x LTS
- **pnpm** >= 9.x (recomendado `corepack enable && corepack prepare pnpm@11.9.0 --activate`)
- **PostgreSQL** >= 15 (o Docker instalado)

### 1. Clonar el repositorio
```bash
git clone https://github.com/NastaFour/Sistema-de-barberos-delivery.git
cd Sistema-de-barberos-delivery
```

### 2. Instalar dependencias del monorepo
```bash
pnpm install
```

### 3. Configurar variables de entorno
Crea tu archivo `.env` en `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/barbergo?schema=public"
JWT_SECRET="secreto_super_seguro_para_access_tokens"
JWT_REFRESH_SECRET="secreto_super_seguro_para_refresh_tokens"
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=5
```

En `apps/web/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Generar cliente Prisma y aplicar migraciones
```bash
pnpm --filter barber-delivery-backend exec prisma generate
pnpm --filter barber-delivery-backend exec prisma migrate dev
pnpm --filter barber-delivery-backend exec prisma db seed # Opcional: datos de prueba
```

### 5. Iniciar servidores en desarrollo
```bash
# Iniciar todos los workspaces en paralelo con Turbo:
pnpm dev

# O iniciar servicios de forma individual:
pnpm dev:api    # Backend en http://localhost:3001
pnpm dev:web    # Frontend Web en http://localhost:5173
```

---

## 🧪 Pruebas y Verificación de Calidad

```bash
# Ejecutar suite de pruebas (34/34 passing)
pnpm --filter barber-delivery-backend test

# Typecheck estricto en todos los workspaces (0 errores)
pnpm typecheck

# Build de producción para API y Frontend Web
pnpm build

# Linting y formato con Biome
pnpm check
```

---

## 🌐 Endpoints de la API REST

### Autenticación & Usuarios
- `POST /api/auth/register` — Registro de cliente o barbero.
- `POST /api/auth/login` — Autenticación (emisión de access token y refresh cookie).
- `POST /api/auth/refresh` — Rotación de tokens con validación de cookies seguras.
- `GET /api/auth/me` — Perfil del usuario autenticado.

### Barberos & Disponibilidad
- `GET /api/barbers` — Búsqueda de barberos con filtros de proximidad y rating.
- `GET /api/barbers/:id` — Perfil detallado, galería y catálogo de servicios.
- `PATCH /api/barbers/:id/status` — Alternar disponibilidad en vivo (On/Off duty).
- `GET /api/bookings/slots` — Cálculo de slots disponibles con buffer de traslado.

### Reservas (Bookings)
- `POST /api/bookings` — Creación de reserva con transacción ACID y bloqueo temporal.
- `GET /api/bookings/my` — Historial y agenda de reservas del usuario.
- `PATCH /api/bookings/:id/status` — Actualización de estado en el ciclo de vida.

### Pagos (Stripe Connect)
- `POST /api/payments/create-intent` — Inicialización de checkout para reserva.
- `POST /api/payments/webhook` — Webhook de Stripe con protección contra replays e idempotencia.

---

## 🐳 Despliegue con Docker

El proyecto incluye soporte nativo multi-stage optimizado para pnpm:

```bash
# Levantar PostgreSQL, Backend API y Frontend Web con Nginx:
docker compose up -d --build
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

**BarberGo** — *Tu barbero profesional, donde y cuando lo necesites.* 💈🚗
