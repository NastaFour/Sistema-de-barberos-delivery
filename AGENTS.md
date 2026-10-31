# AGENTS.md — BarberGo

> Punto de entrada para AI agents trabajando en BarberGo. Define el stack, reglas estrictas, y auto-invoke de skills.
> Catálogo completo de skills: [`.opencode/skills/SKILLS.md`](.opencode/skills/SKILLS.md)

## Project Identity

**BarberGo** — Plataforma tipo Uber para conectar clientes con barberos que se desplazan a domicilio.

**Stack fijo (no cambiar sin ADR):**
- **Monorepo**: pnpm 9.15.9 + Turborepo + Biome
- `apps/api` — Express + Prisma + PostgreSQL + Socket.io + Stripe
- `apps/web` — React 18 + Vite + Tailwind + Leaflet + Zustand + TanStack Query
- `apps/mobile-client` — Expo SDK 56 (cliente)
- `apps/mobile-barber` — Expo SDK 56 (barbero)
- `packages/shared-types` — Zod + TypeScript

## Reglas Estrictas

- **Siempre** ESM modules en backend Node.js
- **Siempre** access tokens en memoria, refresh tokens en HTTP-Only cookies (nunca LocalStorage)
- **Siempre** validar payloads de WebSocket con Zod antes de ejecutar lógica
- **Siempre** TypeScript estricto, `any` prohibido (usar `unknown` + narrowing)
- **Nunca** credenciales, DB URLs, o secrets en código o Git
- **Siempre** SOLID, DRY, KISS en cada archivo. Funciones ≤ 40 líneas
- **Siempre** `pnpm` (nunca `npm` ni `npx`, usar `pnpm dlx`)
- **Siempre** commit con conventional commits

## Comandos de Verificación

```bash
# Lint + format
pnpm biome check --write

# Typecheck
pnpm --filter @barbergo/api typecheck
pnpm --filter @barbergo/web typecheck

# Tests
pnpm --filter @barbergo/api test

# Build (monorepo)
pnpm turbo run build

# Validar skills catalog
node ./.opencode/skills/skill-validator/scripts/validate-skills.mjs --strict
```

## Auto-Invoke Rules

Las siguientes skills se activan automáticamente cuando se detecta el trigger:

| Trigger | Skill | Acción |
|---|---|---|
| Iniciar nueva feature o módulo (2+ archivos) | [`professional-planner`](.opencode/skills/professional-planner/SKILL.md) | Iniciar SDD 6-fases |
| "planificar", "diseñar", "PRD", "spec", "arquitectura" | [`professional-planner`](.opencode/skills/professional-planner/SKILL.md) | SDD flow |
| Crear/modificar schema Prisma | [`prisma-orm`](.opencode/skills/prisma-orm/SKILL.md) | Validar schema + migración |
| Crear/modificar endpoint Express | [`expressjs`](.opencode/skills/expressjs/SKILL.md) + [`api-design`](.opencode/skills/api-design/SKILL.md) | Route modularization + Zod validation |
| Crear/modificar Socket.io events | [`socketio`](.opencode/skills/socketio/SKILL.md) | Zod payload validation |
| Crear/modificar componente React/Vite | [`react-vite`](.opencode/skills/react-vite/SKILL.md) | SRP + Vite config |
| Crear/modificar pantalla Expo | [`react-native`](.opencode/skills/react-native/SKILL.md) + [`expo-production-auditor`](.opencode/skills/expo-production-auditor/SKILL.md) | SRP + native compat |
| Crear tests | [`testing-patterns`](.opencode/skills/testing-patterns/SKILL.md) | Vitest, no Jest |
| Flujo de booking/reserva/tracking/pago | [`barbergo-workflow`](.opencode/skills/barbergo-workflow/SKILL.md) | Business lifecycle reference |
| Declarar fase completada | [`dod-checker`](.opencode/skills/dod-checker/SKILL.md) | MANDATORY: DoD gate |
| Auth flow / login / register / cookies | [`jwt-bcrypt`](.opencode/skills/jwt-bcrypt/SKILL.md) | Token security standards |
| Pagos / checkout / Pago Móvil / Cashea | [`payments`](.opencode/skills/payments/SKILL.md) | Venezuela payment ecosystem |
| GPS / mapa / tracking / ubicación | [`maps-gps`](.opencode/skills/maps-gps/SKILL.md) | Real-time GPS tracking |
| State management / Zustand / cache | [`state-management`](.opencode/skills/state-management/SKILL.md) | Store patterns |
| Crear nueva skill | [`skill-creator`](.opencode/skills/skill-creator/SKILL.md) | Spec-compliant creation |
| CSS no carga / config de build | [`build-config-validator`](.opencode/skills/build-config-validator/SKILL.md) | Validar postcss/tailwind/vite config |
| Debug visual frontend | [`frontend-debugging-protocol`](.opencode/skills/frontend-debugging-protocol/SKILL.md) | Árbol de diagnóstico por síntoma |
| Auth / login / cookies / interceptor | [`auth-flow-audit`](.opencode/skills/auth-flow-audit/SKILL.md) | Auditar consistencia store↔App↔API |
| Rate limiting / 429 / throttle | [`rate-limiting-design`](.opencode/skills/rate-limiting-design/SKILL.md) | Limiters diferenciados por tier |
| Response shape / ID mismatch / data shape | [`api-response-normalizer`](.opencode/skills/api-response-normalizer/SKILL.md) | Envelope + ID consistency |
| Prisma → frontend types / [object Object] | [`prisma-frontend-types`](.opencode/skills/prisma-frontend-types/SKILL.md) | Mapeo tipos Prisma → TS |
| dotenv / env vars undefined / ESM imports | [`nodejs-module-loading`](.opencode/skills/nodejs-module-loading/SKILL.md) | Orden de evaluación ESM |
| Lazy load / code split / heavy deps | [`lazy-loading-patterns`](.opencode/skills/lazy-loading-patterns/SKILL.md) | Singleton lazy + React.lazy |
| Booking / reserva / slots / disponibilidad | [`booking-scheduling-domain`](.opencode/skills/booking-scheduling-domain/SKILL.md) | Slots, conflictos ACID, no-show |
| Background jobs / colas / recordatorios / BullMQ | [`background-jobs-queues`](.opencode/skills/background-jobs-queues/SKILL.md) | Jobs programados + Redis |
| File upload / imagen / galería / multer / S3 | [`file-uploads-storage`](.opencode/skills/file-uploads-storage/SKILL.md) | Upload + validación + storage |
| Form validation / React Hook Form / Zod | [`forms-validation-react`](.opencode/skills/forms-validation-react/SKILL.md) | RHF + Zod + shared schemas |
| Notificaciones / email / SMS / multichannel | [`notifications-multichannel`](.opencode/skills/notifications-multichannel/SKILL.md) | Push + email + SMS con fallback |
| Multi-idioma / i18n / traducciones | [`i18n-localization`](.opencode/skills/i18n-localization/SKILL.md) | i18next + locale formatting |
| Offline / sync / sin conexión / queue | [`offline-sync-mobile`](.opencode/skills/offline-sync-mobile/SKILL.md) | Local queue + conflict resolution |
| Deep link / universal link / compartir | [`deep-linking-mobile`](.opencode/skills/deep-linking-mobile/SKILL.md) | URL scheme + universal links |
| Reportes / PDF / CSV / exportar | [`reports-exports`](.opencode/skills/reports-exports/SKILL.md) | PDF + CSV streaming + background |
| App Store / Play Store / EAS / deploy | [`store-deployment-eas`](.opencode/skills/store-deployment-eas/SKILL.md) | EAS Build + Submit + OTA |
| Design tokens / color scale / spacing / design system | [`design-system-tokens`](.opencode/skills/design-system-tokens/SKILL.md) | Token taxonomy + enforcement |
| Glassmorphism / gradients / shadows / visual effects | [`visual-effects`](.opencode/skills/visual-effects/SKILL.md) | Premium UI effects |
| Micro-interactions / hover / press / stagger / shimmer | [`micro-interactions`](.opencode/skills/micro-interactions/SKILL.md) | Catálogo copy-paste |
| Framer Motion / animation / spring / AnimatePresence | [`motion-framer`](.opencode/skills/motion-framer/SKILL.md) | Motion + Reanimated 3 |
| Scroll animation / parallax / scroll reveal | [`scroll-animations`](.opencode/skills/scroll-animations/SKILL.md) | useScroll + ScrollTrigger |
| Page transition / route transition / shared element | [`page-transitions`](.opencode/skills/page-transitions/SKILL.md) | Web + mobile transitions |
| GSAP / timeline / SplitText / MorphSVG / Flip | [`motion-gsap`](.opencode/skills/motion-gsap/SKILL.md) | Animación avanzada |
| Lottie / onboarding / empty state / success animation | [`lottie-animations`](.opencode/skills/lottie-animations/SKILL.md) | Ilustraciones animadas |
| prefers-reduced-motion / animation performance / 60fps | [`motion-accessibility`](.opencode/skills/motion-accessibility/SKILL.md) | Motion a11y + performance |
| Fin de sesión | [`session-notes`](.opencode/skills/session-notes/SKILL.md) | Context transfer |

## Workflow Reference

El lifecycle completo de BarberGo está en [`barbergo-workflow`](.opencode/skills/barbergo-workflow/SKILL.md):

```
PENDING → ACCEPTED → EN_RUTA → ARRIVED → COMPLETED
    │         │         │          │
    ▼         ▼         ▼          ▼
CANCELLED  REJECTED  CANCELLED  NO_SHOW
```

## Project Tracker

El estado del proyecto se mantiene en [`retoques/PROJECT_TRACKER.md`](retoques/PROJECT_TRACKER.md). Antes de tareas complejas, leer el tracker para contexto.

<!-- skillsGV:kernel:start -->
## skillsGV — catálogo de skills (modo gentle-ai)

Este repositorio tiene el catálogo skillsGV instalado y el harness gentle-ai activo.

- **Skills**: elegí ≤5 skills relevantes por tarea desde tu índice de skills y leé solo esos `SKILL.md`; el catálogo es capa de conocimiento, no capa de proceso.
- **Proceso**: ODD exclusivo (Organic Driven Development), gobernado por Gentle-AI 4.3.1 (`default-inline`: ningún trigger aplica por defecto; delegación solo por razón real: exploración >1 batch de ≤3 llamadas/~10k tokens o >~5 búsquedas secuenciales, 2+ writers paralelos con superficies disjuntas o backstop de ~150k tokens, o verificador independiente para ítems de alto riesgo 1-6 en tmpdir aislado `mktemp -d`). Clasificación por 3 criterios (Understood, Contained risk, Resumable from `git diff` alone); micro-blueprint pre-flight de 5 líneas para ejecución one-shot; commits en slices revisables de ~400 líneas (alto riesgo aislado); gate final de CVEs recientes (`live-cve-security-intel`); cierre con evidencia observada y línea `Risk: item N (reason)` o `Risk: none`.
- **Instalaciones ya gitignoradas** (`.skills-install/` y skills): no las commitees.
- **Floor, Not Ceiling (Enseñanza > Dogma)**: Las skills proveen el piso de ingeniería y diseño; salvo en invariantes de seguridad, `pnpm-only` y verificación real, el modelo está autorizado a proponer mejoras, APIs modernas o direcciones creativas que superen el baseline cuando beneficien al proyecto.
<!-- skillsGV:kernel:end -->
