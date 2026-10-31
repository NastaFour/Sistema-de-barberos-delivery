# PRD — OLA 1: Skills Preventivas (8 skills)

> Spec-Driven Development · Phase 2 · Artifact
> Proyecto: BarberGo · Categoría: `.opencode/skills/`
>justificación: Cada skill previene bugs reales documentados en `CONTEXTO_PARA_AGENTE_SKILLS.md`.

## Objetivo General

Crear 8 skills preventivas que codifiquen las lecciones aprendidas de los 10 bugs más críticos de las Fases 4-5. Cada skill debe ser un agente activo que **detecte o prevenga** una clase de bug antes de que llegue a producción, no solo documentación pasiva.

## Criterios de Aceptación Transversales (todas las skills)

**Funcionales**
- SKILL.md compliance agentskills.io (validado por `skill-validator --strict`, 0 errors)
- Carpeta `<skill-name>/` con `SKILL.md` + `references/` o `scripts/` según corresponda
- Descripción ≤ 1024 chars con "what" + "when to use"
- Auto-invoke entry agregada a `AGENTS.md`
- Entrada agregada a `SKILLS.md` en categoría destino
- Cross-refs a otras skills usan paths planos `../<skill>/SKILL.md`

**Security**
- Sin `npm`/`npx` (usar `pnpm`)
- Sin `any` en código de ejemplos (usar `unknown` + Zod narrowing)
- Sin LocalStorage para tokens
- Sin secrets en ejemplos

**Calidad**
- Funciones ≤ 40 líneas en scripts
- SOLID/DRY/KISS en scripts validadores

---

## Skill 1: `build-config-validator`

**Categoría destino**: 06-code-quality
**Bugs que previene**: #1 (postcss.config.js faltante), #10 (tailwind DEFAULT shade faltante)

### Business Goal
Asegurar que los config files de build del monorepo (postcss, tailwind, vite, tsconfig) existan y estén correctamente configurados antes de ejecutar `dev` o `build`. Prevenir el bug #1 donde Tailwind se instalaba pero nunca procesaba `@tailwind` porque faltaba `postcss.config.js`.

### User Stories
- **US1**: Como dev, al clonar el repo y correr `pnpm dev`, quiero que un script valide que todos los config files existen y tengan la estructura correcta, antes de que Vite falle silenciosamente con CSS roto.
- **US2**: Como AI agent, al modificar `tailwind.config.js`, quiero que la skill me recuerde verificar `DEFAULT` shades y `border` variables para evitar `bg-primary` sin color.

### Acceptance Criteria
- **AC1**: Script `scripts/validate-build-config.mjs` escaneable via `node`
- **AC2**: Verifica existencia de: `apps/web/postcss.config.js`, `apps/web/tailwind.config.js`, `apps/web/vite.config.ts`, `tsconfig.base.json`
- **AC3**: Valida que `tailwind.config.js` tenga `DEFAULT` en cada paleta de color usada en `index.css`
- **AC4**: Valida que `postcss.config.js` tenga plugins `tailwindcss` + `autoprefixer`
- **AC5**: Exit code 0 si OK, 1 si falta algo, con mensaje indicando archivo faltante y fix sugerido
- **AC6**: Soporta flag `--fix` que genere config files faltantes con template correcto

### Edge Cases
- **EC1**: Monorepo sin `apps/web` (solo mobile) → skip web checks con warning
- **EC2**: Tailwind v4 (sin config JS, usa CSS `@theme`) → detectar versión y ajustar checks
- **EC3**: postcss.config con syntax alternativo (`.cjs`, `.mjs`, objeto en `package.json`) → soportar todos

---

## Skill 2: `frontend-debugging-protocol`

**Categoría destino**: 02-dev-roles
**Bugs que previene**: #1, #10, #4, #5, #6 (síntomas visuales con causas no obvias)

### Business Goal
Proveer un checklist sistemático para diagnosticar síntomas visuales del frontend ("se ve sin CSS", "componentes sin data", "mapa sin markers") que tienen causas no obvias (config faltante, data shape mismatch, ID mismatch).

### User Stories
- **US1**: Como AI agent ante "la página se ve sin CSS", quiero un árbol de decisión que me guíe: postcss config → tailwind DEFAULT → import order → cache Vite, en orden de probabilidad.
- **US2**: Como dev ante "barberos sin nombre en la lista", quiero el protocolo que cheque data shape del API vs acceso del frontend antes de cambiar el componente.

### Acceptance Criteria
- **AC1**: `references/diagnostic-tree.md` con árbol de decisión por síntoma
- **AC2**: Cubre 5 síntomas: sin CSS, sin data, sin markers, sin imagen, redirect loop
- **AC3**: Cada rama termina en causa probable + comando de verificación + fix
- **AC4**: Referencia `build-config-validator` para síntomas CSS
- **AC5**: Referencia `api-response-normalizer` para síntomas de data

### Edge Cases
- **EC1**: Síntoma combinado (sin CSS + sin data) → protocolo prioriza CSS primero (no se puede debuggear UI invisible)
- **EC2**: Bug en mobile (Expo) → árbol separado para React Native (sin postcss, sino Metro config)

---

## Skill 3: `auth-flow-audit`

**Categoría destino**: 02-dev-roles
**Bugs que previene**: #2 (store sin setToken), #7 (401 interceptor redirigía en páginas públicas)

### Business Goal
Auditar consistencia end-to-end del flujo de auth: store ↔ App.tsx ↔ API ↔ cookies/tokens. Prevenir bugs donde el login "parece exitoso" pero no persiste, o donde interceptors 401 rompen páginas públicas.

### User Stories
- **US1**: Como AI agent al implementar login, quiero un checklist que verifique: store no persiste access token, App llama `getMe()` no `setToken()`, refresh via httpOnly cookie.
- **US2**: Como dev ante "usuario sin login no puede ver homepage", quiero el checklist que detecte interceptors 401 con redirect automático.

### Acceptance Criteria
- **AC1**: `references/audit-checklist.md` con 10+ checks categorizados (store, App, API, cookie, interceptor)
- **AC2**: Verifica: access token en memoria (Zustand sin persist), refresh en httpOnly cookie, `getMe()` en App mount, NO redirect automático en 401
- **AC3**: Script `scripts/audit-auth.mjs` que escanee código buscando anti-patrones (`localStorage.setItem.*token`, `window.location.*login` en interceptor)
- **AC4**: Referencia `jwt-bcrypt` para estándares de token
- **AC5**: Reporte con anti-patrones encontrados + fix sugerido

### Edge Cases
- **EC1**: App con SSR (Next.js) → cookies en server-side, ajustar checks
- **EC2**: Mobile (Expo) → `SecureStore` en vez de cookies, ajustar checks

---

## Skill 4: `rate-limiting-design`

**Categoría destino**: 04-backend
**Bugs que previene**: #3 (authLimiter bloqueaba /auth/me en loop)

### Business Goal
Proveer patrones de rate limiting diferenciado por tipo de endpoint. Prevenir que un limiter estricto (auth login 5 req) se aplique a endpoints de sesión (/me, /refresh) que se llaman en cada carga.

### User Stories
- **US1**: Como AI agent al agregar rate limiting a auth routes, quiero una tabla de tiers que separe `authLimiter` (login/register, 5 req/15min) de `sessionLimiter` (/me/refresh/logout, 120 req/min).
- **US2**: Como dev ante un loop de 429 en `/auth/me`, quiero el checklist que detecte limiter mal asignado + React StrictMode double-effect.

### Acceptance Criteria
- **AC1**: `references/tier-table.md` con 4 tiers: auth-strict, session-moderate, api-standard, ai-quota
- **AC2**: Configuración `express-rate-limit` por tier con window + max + standardHeaders
- **AC3**: Script `scripts/check-limiters.mjs` que escanee routes y detecte limiter compartido entre login y session endpoints
- **AC4**: Documenta interacción con React StrictMode (double mount) y recomendación `skip: (req) => req.path === '/me'`
- **AC5**: Referencia `api-design` para mapeo endpoint → tier

### Edge Cases
- **EC1**: Detrás de proxy (Render/Railway) → `trust proxy` config requerida, documentar
- **EC2**: WebSocket handshake → rate limiting en connection event, no en HTTP
- **EC3**: Mobile con IP compartida (NAT carrier) → key por user ID si autenticado, no por IP

---

## Skill 5: `api-response-normalizer`

**Categoría destino**: 04-backend
**Bugs que previene**: #4 (barber.profile.* mismatch), #5 (Barber ID vs User ID), #6 (gallery objects vs strings)

### Business Goal
Unificar data shapes entre diferentes paths del API (raw SQL vs Prisma, IDs anidados vs planos). Prevenir que el frontend acceda a `barber.profile?.rating` cuando el API devuelve BarberProfile plano con `user` anidado.

### User Stories
- **US1**: Como AI agent al diseñar un endpoint, quiero la convención de response envelope `{ data, meta }` + reglas de aplanado para evitar shapes inconsistentes.
- **US2**: Como dev ante "barbero no encontrado", quiero el checklist que verifique consistencia de IDs entre frontend (qué envía) y backend (qué filtra).

### Acceptance Criteria
- **AC1**: `references/envelope-convention.md` define `{ data: T, meta?: { page, total }, error?: { code, message } }`
- **AC2**: Reglas de ID consistency: endpoint `/:id` filtra por ese ID exacto, no por campo relacionado
- **AC3**: Helper functions pattern: `getBarberName/Avatar/Rating/Lat/Lng` que manejen ambas formas (anidada/plana)
- **AC4**: Script `scripts/check-id-consistency.mjs` que detecte endpoints donde `req.params.id` se usa en `where: { <otroCampo>: id }`
- **AC5**: Referencia `prisma-frontend-types` para mapeo de tipos

### Edge Cases
- **EC1**: Endpoint con join complejo (barber + user + reviews) → definir cuál es el "primary entity" y aplanar relativos
- **EC2**: Paginación cursor-based vs offset → `meta` con `nextCursor` o `page/total`

---

## Skill 6: `prisma-frontend-types`

**Categoría destino**: 04-backend
**Bugs que previene**: #6 (gallery objects vs strings, `[object Object]`)

### Business Goal
Mapeo automático y tipado de modelos Prisma → tipos frontend. Prevenir que el frontend trate `BarberGallery[]` (objetos `{id, imageUrl, caption}`) como `string[]`.

### User Stories
- **US1**: Como AI agent al consumir un endpoint que devuelve un modelo Prisma con relaciones, quiero saber exactamente la shape (cuáles son objects vs scalars) sin inspeccionar la DB.
- **US2**: Como dev al renderizar una lista, quiero el tipo correcto importado de `@barbergo/shared-types` para que TS me avise si acceso `img` en vez de `img.imageUrl`.

### Acceptance Criteria
- **AC1**: `references/type-mapping-rules.md` con tabla: tipo Prisma → tipo TS (String→string, Json→unknown+Zod, Relation→T[], DateTime→ISO string)
- **AC2**: Regla: nunca usar `string[]` para relaciones Prisma, siempre `BarberGallery[]` u objeto tipado
- **AC3**: Script `scripts/generate-frontend-types.mjs` que lea `schema.prisma` y genere tipos en `packages/shared-types`
- **AC4**: Usa `Prisma.ModelType` o parsing manual del schema, no `prisma generate` (que es para backend)
- **AC5**: Referencia `api-response-normalizer` para envelope

### Edge Cases
- **EC1**: Modelo con `Json` field → `unknown` + validación Zod runtime, no `any`
- **EC2**: Soft-delete fields (`deletedAt`) → tipo optional, omitir en responses públicas
- **EC3**: Enums Prisma → union types TS literales

---

## Skill 7: `nodejs-module-loading`

**Categoría destino**: 04-backend
**Bugs que previene**: #8 (dotenv cargado tarde, env vars undefined)

### Business Goal
Documentar el orden de evaluación de imports en ES modules. Prevenir que `dotenv.config()` en `server.ts` no alcance a módulos importados antes (como `env.ts` que valida vars).

### User Stories
- **US1**: Como AI agent al crear `env.ts` que valida variables, quiero la regla: `import "dotenv/config"` al inicio de `env.ts`, no `dotenv.config()` en `server.ts`.
- **US2**: Como dev ante "Environment validation failed" con vars undefined, quiero el diagnóstico que verifique orden de imports.

### Acceptance Criteria
- **AC1**: `references/esm-evaluation-order.md` con diagrama del orden: imports estáticos → código del módulo → imports dinámicos
- **AC2**: Regla: módulo que valida env vars debe importar `dotenv/config` primero, antes de leer `process.env`
- **AC3**: Anti-patrón documentado: `dotenv.config()` en `server.ts` línea N, con `env.ts` importado antes → vars undefined
- **AC4**: Script `scripts/check-env-loading.mjs` que detecte `dotenv.config()` en archivo que no sea el primer import de la cadena
- **AC5**: Cobertura ESM únicamente (CommonJS tiene orden diferente, documentar diferencia)

### Edge Cases
- **EC1**: `env.ts` importado transitivamente por otro módulo → el primer import de toda la app debe cargar dotenv
- **EC2**: Variable `NODE_ENV` seteada por CLI (`NODE_ENV=production node ...`) → no necesita dotenv, documentar

---

## Skill 8: `lazy-loading-patterns`

**Categoría destino**: 05-frontend
**Bugs que previene**: #9 (Stripe loadStripe() a nivel de módulo, errores en todas las páginas)

### Business Goal
Patrones para cargar dependencias pesadas (Stripe, Leaflet, LLM SDKs) bajo demanda en React/Vite. Prevenir que `loadStripe()` a nivel de módulo ejecute en páginas que no usan pagos.

### User Stories
- **US1**: Como AI agent al integrar Stripe, quiero el patrón `getStripe()` singleton lazy que solo carga si la key es válida y el componente se monta.
- **US2**: Como dev ante errores de Stripe en consola de login page, quiero el checklist que detecte `loadStripe()` a nivel de módulo.

### Acceptance Criteria
- **AC1**: `references/lazy-patterns.md` con 3 patrones: singleton lazy, `React.lazy()` + `Suspense`, dynamic `import()`
- **AC2**: Ejemplos: `getStripe()` (Stripe), `getMap()` (Leaflet), `getLLM()` (AI SDK)
- **AC3**: Script `scripts/check-module-level-loads.mjs` que detecte calls a `loadStripe`/`loadStripe`/`new Map()` a nivel de módulo (fuera de hooks/componentes)
- **AC4**: Cobertura web (Vite) y mobile (Expo con `expo-linear-gradient` etc.)
- **AC5**: Métrica: bundler debe code-split el chunk pesado (verificar con `rollup-plugin-visualizer`)

### Edge Cases
- **EC1**: SSR (Next.js) → lazy load solo client-side, `next/dynamic` con `ssr: false`
- **EC2**: Test environment → mock la lib pesada, no cargar real
- **EC3**: Service Worker cachea el chunk → invalidar al actualizar versión

---

## Decision Log Entry

```
[2026-06-17] OLA 1 Phase 2 PRD aprobado. 8 skills preventivas con AC + edge cases. Bugs #1-#10 cubiertos. Artefacto: retoques/openspec/changes/ola1-preventive-skills/proposal.md
```
