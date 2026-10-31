# BarberGo - App de Delivery de BarberÃ­a a Domicilio

BarberGo es una aplicaciÃ³n completa que conecta clientes con barberos que ofrecen servicios a domicilio. Los barberos se desplazan hasta la ubicaciÃ³n del cliente para realizar cortes de cabello y otros servicios de barberÃ­a.

## ðŸš€ CaracterÃ­sticas Principales

### Para Clientes
- ðŸ” BÃºsqueda de barberos cercanos con geolocalizaciÃ³n
- â­ Sistema de ratings y reseÃ±as
- ðŸ“… Reservas de servicios a domicilio
- ðŸ’³ Pagos integrados con comisiÃ³n del 5%
- ðŸ“ Seguimiento de ubicaciÃ³n del barbero
- ðŸ”” Notificaciones en tiempo real

### Para Barberos
- ðŸ“± Dashboard de gestiÃ³n de citas
- ðŸ•’ GestiÃ³n de disponibilidad horaria
- ðŸ’¼ AdministraciÃ³n de servicios y precios
- ðŸ–¼ï¸ GalerÃ­a de trabajos realizados
- ðŸ“Š EstadÃ­sticas de ingresos y rendimiento

### Para Administradores
- ðŸ‘¥ GestiÃ³n de usuarios y barberos
- ðŸ“ˆ Panel de estadÃ­sticas globales
- ðŸ”’ ModeraciÃ³n de contenido
- ðŸ’° Control de comisiones y pagos

## ðŸ› ï¸ Stack TecnolÃ³gico

### Backend
- **Node.js 20** + **Express 4** + **TypeScript 5**
- **Prisma ORM** + **PostgreSQL 15**
- **Zod** para validaciÃ³n de datos
- **bcryptjs** para hashing de contraseÃ±as
- **jsonwebtoken** para autenticaciÃ³n JWT (access + refresh tokens)
- **Socket.io** para notificaciones en tiempo real
- **express-rate-limit** para protecciÃ³n contra brute-force

### Frontend
- **React 18** + **Vite 5** + **TypeScript**
- **React Router v6** para navegaciÃ³n
- **TanStack Query v5** para gestiÃ³n de estado del servidor
- **Zustand** para estado global de autenticaciÃ³n
- **Tailwind CSS** + diseÃ±o dark mode
- **date-fns** para manejo de fechas
- **Axios** con interceptores para API calls

## ðŸ“ Estructura del Proyecto

```
barber-delivery-app/
├── apps/
│   ├── api/                # Backend Node.js + Express + Prisma
│   │   ├── src/
│   │   │   ├── config/     # Configuración de DB y entorno
│   │   │   ├── middleware/ # Auth, validación, errores
│   │   │   ├── routes/     # Endpoints de la API
│   │   │   ├── controllers/# Lógica de controladores
│   │   │   ├── services/   # Lógica de negocio pura
│   │   │   ├── schemas/    # Validación Zod
│   │   │   ├── utils/      # Helpers (JWT, password, etc.)
│   │   │   ├── types/      # Tipos TypeScript
│   │   │   └── server.ts   # Punto de entrada
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   ├── web/                # Frontend Admin Panel (React + Vite)
│   │   ├── src/
│   │   │   ├── components/ # Componentes reutilizables
│   │   │   ├── pages/      # Páginas principales
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── services/   # Cliente API
│   │   │   ├── store/      # Zustand stores
│   │   │   └── lib/        # Utilidades
│   │   └── package.json
│   ├── mobile-barber/      # App Expo para barberos
│   └── mobile-client/      # App Expo para clientes
├── packages/
│   └── shared-types/       # Tipos y Zod schemas compartidos
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
└── docker-compose.yml
```

## ðŸš€ InstalaciÃ³n y ConfiguraciÃ³n

### Prerrequisitos
- Node.js 20+
- PostgreSQL 15+
- pnpm 9+

### Backend

```bash
cd apps/api

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y secretos JWT

# Generar cliente de Prisma
pnpm run db:generate

# Ejecutar migraciones
pnpm run db:migrate

# Seed inicial (opcional)
pnpm run db:seed

# Iniciar en modo desarrollo
pnpm run dev
```

### Frontend

```bash
cd apps/web

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu API backend

# Iniciar en modo desarrollo
pnpm run dev
```

## ðŸ” Variables de Entorno

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

## ðŸ“¡ Endpoints de la API

### AutenticaciÃ³n
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Obtener usuario actual

### Barberos
- `GET /api/barbers` - Listar barberos (con filtros de ubicaciÃ³n)
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
- `GET /api/admin/stats` - EstadÃ­sticas generales

## ðŸ”’ Seguridad

- Passwords hasheados con bcrypt (cost factor 12)
- JWT access tokens con expiraciÃ³n de 15 minutos
- JWT refresh tokens con expiraciÃ³n de 7 dÃ­as
- Rate limiting en endpoints de autenticaciÃ³n (5 intentos/IP/15min)
- ValidaciÃ³n de datos con Zod en todos los endpoints
- SanitizaciÃ³n de emails (trim + lowercase)

## ðŸŽ¨ DiseÃ±o UI/UX

- **Dark Mode** por defecto con colores oscuros profesionales
- **Responsive Design** mobile-first
- **Componentes Reutilizables** con consistencia visual
- **Estados de Carga** con skeletons y spinners
- **Notificaciones Toast** para feedback al usuario
- **Badges de Estado** con cÃ³digos de color intuitivos

## ðŸ“ Licencia

MIT License - ver LICENSE para mÃ¡s detalles.

## ðŸ‘¥ ContribuciÃ³n

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**BarberGo** - Tu barbero, donde estÃ©s. âœ‚ï¸ðŸ 


