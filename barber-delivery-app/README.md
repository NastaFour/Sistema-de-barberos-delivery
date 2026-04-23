# BarberGo - App de Delivery de Barbería a Domicilio

BarberGo es una aplicación completa que conecta clientes con barberos que ofrecen servicios a domicilio. Los barberos se desplazan hasta la ubicación del cliente para realizar cortes de cabello y otros servicios de barbería.

## 🚀 Características Principales

### Para Clientes
- 🔍 Búsqueda de barberos cercanos con geolocalización
- ⭐ Sistema de ratings y reseñas
- 📅 Reservas de servicios a domicilio
- 💳 Pagos integrados con comisión del 5%
- 📍 Seguimiento de ubicación del barbero
- 🔔 Notificaciones en tiempo real

### Para Barberos
- 📱 Dashboard de gestión de citas
- 🕒 Gestión de disponibilidad horaria
- 💼 Administración de servicios y precios
- 🖼️ Galería de trabajos realizados
- 📊 Estadísticas de ingresos y rendimiento

### Para Administradores
- 👥 Gestión de usuarios y barberos
- 📈 Panel de estadísticas globales
- 🔒 Moderación de contenido
- 💰 Control de comisiones y pagos

## 🛠️ Stack Tecnológico

### Backend
- **Node.js 20** + **Express 4** + **TypeScript 5**
- **Prisma ORM** + **PostgreSQL 15**
- **Zod** para validación de datos
- **bcryptjs** para hashing de contraseñas
- **jsonwebtoken** para autenticación JWT (access + refresh tokens)
- **Socket.io** para notificaciones en tiempo real
- **express-rate-limit** para protección contra brute-force

### Frontend
- **React 18** + **Vite 5** + **TypeScript**
- **React Router v6** para navegación
- **TanStack Query v5** para gestión de estado del servidor
- **Zustand** para estado global de autenticación
- **Tailwind CSS** + diseño dark mode
- **date-fns** para manejo de fechas
- **Axios** con interceptores para API calls

## 📁 Estructura del Proyecto

```
barber-delivery-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración de DB y entorno
│   │   ├── middleware/      # Auth, validación, errores
│   │   ├── routes/          # Endpoints de la API
│   │   ├── controllers/     # Lógica de controladores
│   │   ├── services/        # Lógica de negocio pura
│   │   ├── schemas/         # Validación Zod
│   │   ├── utils/           # Helpers (JWT, password, etc.)
│   │   ├── types/           # Tipos TypeScript
│   │   └── server.ts        # Punto de entrada
│   ├── prisma/
│   │   └── schema.prisma    # Schema de base de datos
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Cliente API tipado
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   ├── types/           # Tipos compartidos
│   │   └── lib/             # Utilidades
│   └── package.json
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 20+
- PostgreSQL 15+
- npm o yarn

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y secretos JWT

# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Seed inicial (opcional)
npm run db:seed

# Iniciar en modo desarrollo
npm run dev
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu API backend

# Iniciar en modo desarrollo
npm run dev
```

## 🔐 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/barbergo?schema=public"
JWT_SECRET="tu_secreto_super_seguro_para_access_tokens"
JWT_REFRESH_SECRET="tu_secreto_super_seguro_para_refresh_tokens"
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Obtener usuario actual

### Barberos
- `GET /api/barbers` - Listar barberos (con filtros de ubicación)
- `GET /api/barbers/:id` - Perfil detallado de barbero

### Reservas
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings/my` - Mis reservas
- `GET /api/bookings/slots` - Slots disponibles
- `PATCH /api/bookings/:id/status` - Actualizar estado

### Usuarios
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users` - Listar usuarios (Admin)

### Admin
- `GET /api/admin/stats` - Estadísticas generales

## 🔒 Seguridad

- Passwords hasheados con bcrypt (cost factor 12)
- JWT access tokens con expiración de 15 minutos
- JWT refresh tokens con expiración de 7 días
- Rate limiting en endpoints de autenticación (5 intentos/IP/15min)
- Validación de datos con Zod en todos los endpoints
- Sanitización de emails (trim + lowercase)

## 🎨 Diseño UI/UX

- **Dark Mode** por defecto con colores oscuros profesionales
- **Responsive Design** mobile-first
- **Componentes Reutilizables** con consistencia visual
- **Estados de Carga** con skeletons y spinners
- **Notificaciones Toast** para feedback al usuario
- **Badges de Estado** con códigos de color intuitivos

## 📝 Licencia

MIT License - ver LICENSE para más detalles.

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**BarberGo** - Tu barbero, donde estés. ✂️🏠
