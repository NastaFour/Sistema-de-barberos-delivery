---
name: project-memory-ledger
description: Maintain a strict, minimal-token context of the project's state, constraints, and architecture. Use this skill to preserve continuity across sessions, enforce tech stack rules, and systematically track roadmap progress without relying on chat history.
---

This skill guides the creation and maintenance of a single-source-of-truth project ledger. It ensures that every code generation and architectural choice strictly aligns with the established project guidelines, avoiding generic assumptions and technical drift.

## Contextual Anchoring

Before executing complex tasks or suggesting architectures, absorb the project state:
- **Core Vision**: What is the ultimate goal and aesthetic of this software?
- **Technical Constraints**: Strictly obey the defined tech stack. Do not hallucinate dependencies.
- **Current Position**: Identify the active `[/]` phase in the roadmap. Target work only towards the active phase.

**CRITICAL**: Treat the `Project Data Ledger` below as absolute law. If a user request contradicts a strict rule in the ledger, explicitly warn them before proceeding.

## Ledger Maintenance

You are responsible for keeping the ledger brutally concise and up-to-date:
- **Milestone Tracking**: Upon completing a major feature, check off `[x]` the current phase and activate `[/]` the next.
- **Phase Declaration**: When you believe a phase is finished, YOU MUST autonomously invoke the `dod-checker` skill. If the DoD Checker returns `[ 🔴 FAIL ]`, you must fix the issues immediately. If it returns `[ 🟢 PASS ]`, explicitly announce: "PHASE X COMPLETED. READY FOR PHASE Y." and wait for user confirmation. A phase CANNOT be checked off `[x]` until the DoD Checker has explicitly passed.
- **Architectural Traceability**: Instantly log any major decision (e.g., choice of state management, routing, or performance trade-offs) in the `Decision Log` to prevent circular problem-solving in future sessions.
- **Format**: Keep entries atomic. Bullet points only. No conversational fluff or large diffs.

Remember: Elegance comes from precision. Minimal tokens consumed, maximum context retained.

---

# 🗃️ PROJECT DATA LEDGER - BarberGo

## 1. 📌 Project Identity
- **Name**: BarberGo - Delivery de Barbería a Domicilio
- **Core Goal**: Plataforma tipo Uber para conectar clientes con barberos que se desplazan a su ubicación.
- **Tech Stack**: React 18 + Vite + TypeScript, Node.js 20 + Express + Prisma ORM + PostgreSQL 15, Socket.io, JWT + bcryptjs, TailwindCSS, shadcn/ui, Mapbox GL, TanStack Query, Zustand.
- **Aesthetic**: Dashboard profesional, responsive, dark mode, UI limpia con énfasis en mapas y geolocalización.

## 2. 🚦 Strict Rules
- SOLO usar tecnologías del arsenal en TECH_STACK_ADVISOR.md.
- TypeScript estricto: NUNCA usar `any`.
- Servicios = funciones puras, Controladores = solo req/res.
- Respuestas API consistentes: `{ success, data?, error?, message? }`.
- Validación Zod en todos los endpoints.
- Rate limiting en auth (5 intentos/IP/15min).

## 3. 🗺️ Roadmap "The Barber-Route" & Phases
- [x] **Fase 1: El Cerebro** (DB Schema, PostGIS, Modelos Users/Barbers/Services/Bookings).
- [x] **Fase 2: La Conexión** (Socket.io real-time, Algoritmo Haversine cercanía, WebSockets notificaciones).
- [x] **Fase 3: Flujo de Confianza** (Auth JWT, Pagos Stripe, Sistema Ratings/Reviews, Disponibilidad barberos).
- [x] **Fase 4: Experiencia Usuario** (Frontend Cliente + Mapa, Dashboard Barbero, Modo disponibilidad On/Off).
- [x] **Fase 5: QA & Bug Hunting** (Tests unitarios Jest 34/34, Race conditions ACID, Socket Zod validation, Replay protection).
- [x] **Fase 6: Deploy & Production** (Docker pnpm multi-stage, Typecheck 100% 0 errores en los 5 workspaces, Ciclo Monday x3, DoD PASS).

## 4. 🧠 Decision Log
- [2026-04-22] Backend: Node/Express/TS + Prisma + PostgreSQL elegido por proficiencia del developer.
- [2026-04-22] Auth: JWT access (15min) + refresh (7días) con bcrypt cost 12.
- [2026-04-22] Geolocalización: Fórmula Haversine en SQL crudo Prisma para filtrar barberos cercanos.
- [2026-04-22] Real-time: Socket.io integrado para notificaciones instantáneas de reservas.
- [2026-04-22] Frontend: React + Vite + Tailwind + shadcn/ui para desarrollo rápido y consistente.
- [2026-04-22] State: Zustand para auth (persistencia refreshToken), TanStack Query para server state.
- [2026-04-22] Mapa: Mapbox GL JS por mejor relación calidad/precio vs Google Maps.
- [2026-06-15] Migración npm→pnpm: pnpm 9.15.9, pnpm-workspace.yaml, turbo.json, biome.json. Estructura apps/ + packages/shared-types.
- [2026-06-15] Expo SDK 54→56: expo 56.0.11, react 19.2.3, react-native 0.85.0.
- [2026-06-15] Fase 4 completada: endpoint `PATCH /barbers/:id/status` implementado, EarningsChart SVG funcional, tipos unificados en `@barber-delivery/shared-types`.
- [2026-10-31] Culminación y Finiquitado de BarberGo:
  - Saneamiento monorepo pnpm v11.9.0 y compatibilidad Expo SDK 56 en mobile-client y mobile-barber.
  - Concurrencia ACID en `booking.service.ts` ($transaction con paso de `tx` a `isSlotAvailable` y bloqueo de `PENDING_PAYMENT`).
  - Protección de 7 listeners WebSockets Socket.io con validación estricta Zod (`validatePayload`).
  - Desacoplamiento de Stripe en `payment.controller.ts` con protección contra replay/idempotencia.
  - Rediseño visual Web bajo el chasis "Midnight Barber Atelier" (`#0d0f12`, acentos dorados ámbar, sin morados de IA) y resortes de Emil Kowalski.
  - Resolución de tipos en mobile-client y mobile-barber (`StyleSheet.absoluteFill`, `expo-task-manager`).
  - Overrides pnpm de seguridad para mitigar CVEs (`tar`, `proxy-addr`, `node-forge`).
  - Dockerfiles modernizados a pnpm multi-stage y docker-compose contextualizado a la raíz.
  - DoD Gatekeeper auditado: PASS. Monorepo 100% verde (34/34 tests, 0 errores TS en 5 workspaces).

## 5. 🐞 Deferred Issues
- Emails reales de notificación (por ahora push notifications y registros en DB).
- Optimización avanzada de imágenes de galería (CDN externo / Cloudinary).
