# Contexto para el Agente de Skills — BarberGo

## Proyecto
**BarberGo** — Plataforma tipo Uber para conectar clientes con barberos que se desplazan a domicilio.

**Ruta:** `C:\Users\j1347\Desktop\Proyectos programacion\trabajos\Sistema de  barberos delivery`

**Stack:** pnpm 9.15.9 monorepo + Turborepo + Biome
- `apps/api` — Express + Prisma + PostgreSQL + Socket.io + Stripe
- `apps/web` — React 18 + Vite + Tailwind + Leaflet + Zustand + TanStack Query
- `apps/mobile-client` — Expo SDK 56 (cliente)
- `apps/mobile-barber` — Expo SDK 56 (barbero)
- `packages/shared-types` — Zod + TypeScript

## Lo que hicimos (Fases 1-5)

### Fase 4 — Saneamiento (DoD Gate)
1. Eliminamos 47 `any` types del backend → 0
2. Migramos JWT de localStorage a httpOnly cookies
3. Extrajimos lógica de negocio de routes a controllers (SRP)
4. Tipamos stripe.service.ts con interfaces locales
5. Arreglamos booking.service.test.ts (mock roto)
6. Creamos 15 tests unitarios para availability.service.ts
7. Creamos 11 tests unitarios para auth.service.ts
8. Creamos 6 tests de integración con Supertest

### Fase 5 — QA & Bug Hunting
1. Socket Zod validation — 7/7 listeners con schemas
2. Race condition en createBooking — $transaction con check de conflicto inline
3. Socket.io exponential backoff — 3 apps (web + 2 mobile)
4. TanStack Query onlineManager — retry en offline
5. ConnectionStatusBadge — indicador visual
6. Seed de DB — 4 usuarios, 2 barberos, 7 servicios

## Los 10 problemas más críticos que tuvimos

### 1. postcss.config.js faltante (CRÍTICO)
**Síntoma:** El frontend se veía como texto plano en una línea, sin CSS.
**Causa:** tailwindcss + postcss + autoprefixer estaban instalados pero NO existía `postcss.config.js`. Vite nunca procesaba las directivas `@tailwind` del `index.css`.
**Fix:** Crear `postcss.config.js` con `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`.
**Skill faltante:** Una skill de "verificación de configuración de build" que revise si los config files necesarios existen.

### 2. Auth store sin token/setToken (CRÍTICO)
**Síntoma:** Login aparecía exitoso pero el usuario nunca se autenticaba.
**Causa:** `App.tsx` usaba `useAuthStore().setToken()` y `.token` que no existían en el store. El auth nunca persistía.
**Fix:** Migrar a cookies httpOnly, eliminar `token` del store, llamar `getMe()` directo.
**Skill faltante:** Skill de "auth flow audit" que verifique consistencia entre store ↔ App ↔ API.

### 3. Rate limiter bloqueaba /auth/me (CRÍTICO)
**Síntoma:** `GET /auth/me 429 (Too Many Requests)` en loop infinito.
**Causa:** El rate limiter de auth (5 req/15min) se aplicaba a TODOS los endpoints de auth incluyendo `/me`. React StrictMode duplica el efecto, agotando el límite. El 401 redirect creaba un loop.
**Fix:** Separar `authLimiter` (login/register, 5 req) de `sessionLimiter` (me/refresh/logout, 120 req).
**Skill faltante:** Skill de "rate limiting design" con patrones para diferentes tipos de endpoints.

### 4. Data shape mismatch: barber.profile.* (CRÍTICO)
**Síntoma:** BarbersPage mostraba barberos sin nombre, sin avatar, sin rating. Mapa sin markers.
**Causa:** El frontend accedía `barber.profile?.rating` pero el API devuelve BarberProfile plano con `user` anidado. Dos paths del API (raw SQL vs Prisma) devolvían formas diferentes.
**Fix:** Helper functions `getBarberName/Avatar/Rating/Lat/Lng` que manejan ambas formas.
**Skill faltante:** Skill de "API response normalization" con patrones para unificar respuestas.

### 5. Barber ID mismatch (CRÍTICO)
**Síntoma:** Click en cualquier barbero → "Barbero no encontrado".
**Causa:** `BarbersPage` pasaba `barber.id` (BarberProfile ID) pero `getBarberById` buscaba por `where: { userId: id }` (User ID).
**Fix:** Cambiar backend a `where: { id }` y reviews query a `barberId: barber.userId`.
**Skill faltante:** Skill de "ID consistency" que audite que los IDs coincidan entre frontend y backend.

### 6. Gallery objects vs strings (ALTO)
**Síntoma:** Imágenes de galería rotas, mostraban `[object Object]`.
**Causa:** Prisma devuelve `BarberGallery[]` (objetos con `{id, imageUrl, caption}`) pero el frontend los trataba como `string[]`.
**Fix:** `img.imageUrl` en vez de `img`.
**Skill faltante:** Skill de "Prisma response typing" que mapee modelos Prisma a tipos frontend.

### 7. 401 interceptor redirigía en páginas públicas (CRÍTICO)
**Síntoma:** Usuario sin login no podía ver ni la homepage. Redirect a /login en todas las páginas.
**Causa:** Interceptor axios hacía `window.location.href = "/login"` en CUALQUIER 401, incluyendo el `getMe()` que App.tsx llama en cada carga.
**Fix:** Eliminar el redirect automático del interceptor. Cada página maneja 401 individualmente.
**Skill faltante:** Skill de "axios interceptor patterns" con best practices para SPAs.

### 8. dotenv cargado tarde (CRÍTICO)
**Síntoma:** `Environment validation failed` — todas las vars eran `undefined`.
**Causa:** `dotenv.config()` se llamaba en `server.ts` línea 18, pero `env.ts` (que valida las vars) se importaba ANTES. Los imports de ES modules se evalúan antes del código del módulo.
**Fix:** `import "dotenv/config"` al inicio de `env.ts`.
**Skill faltante:** Skill de "Node.js module loading order" que explique el orden de evaluación de imports.

### 9. Stripe cargado en todas las páginas (MEDIO)
**Síntoma:** Errores de Stripe en consola en páginas que no usan pagos (login, home).
**Causa:** `StripeCheckout.tsx` llamaba `loadStripe()` a nivel de módulo, ejecutándose al importar.
**Fix:** Lazy load con `getStripe()` que solo carga si la key es válida y el componente se monta.
**Skill faltante:** Skill de "heavy dependency lazy loading" para React.

### 10. Tailwind DEFAULT shade faltante (MEDIO)
**Síntoma:** `bg-primary` y `text-primary` no aplicaban color.
**Causa:** tailwind.config.js no tenía `DEFAULT` en la paleta primary.
**Fix:** Agregar `DEFAULT: "#0ea5e9"` al objeto `primary`.
**Skill faltante:** Skill de "Tailwind config audit" que verifique DEFAULT shades y border vars.

## Skills que sugerimos crear

| Skill | Descripción | Problemas que previene |
|-------|-------------|----------------------|
| `build-config-validator` | Verifica que postcss.config, tailwind.config, vite.config, tsconfig existan y estén correctos | #1, #10 |
| `auth-flow-audit` | Audita consistencia entre auth store ↔ App.tsx ↔ API ↔ cookies/tokens | #2, #7 |
| `api-response-normalizer` | Patrones para unificar respuestas de diferentes paths del API | #4, #5, #6 |
| `rate-limiting-design` | Patrones para rate limiting diferenciado por tipo de endpoint | #3 |
| `nodejs-module-loading` | Guía sobre orden de evaluación de imports en ESM | #8 |
| `lazy-loading-patterns` | Patrones para cargar dependencias pesadas bajo demanda | #9 |
| `prisma-frontend-types` | Mapeo automático de modelos Prisma a tipos del frontend | #6 |
| `frontend-debugging-protocol` | Checklist sistemático para diagnosticar "se ve sin CSS" | #1, #10 |

## Estado actual
- Backend: 0 typecheck errores, 34/34 tests, 0 `any` types
- Frontend: Funcionando con Tailwind CSS cargando correctamente
- Mobile: Pendiente verificación Expo Go
- Fase 5: ~80% completada
- Fase 6 (Deploy): No iniciada
