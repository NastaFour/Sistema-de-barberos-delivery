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
- [/] **Fase 4: Experiencia Usuario** (Frontend Cliente + Mapa, Dashboard Barbero, Modo disponibilidad On/Off).
- [ ] **Fase 5: QA & Bug Hunting** (Tests unitarios Jest, Race conditions, Reconexión automática, Cache local).
- [ ] **Fase 6: Deploy & Production** (Docker, CI/CD, Monitoreo, Optimización performance).

## 4. 🧠 Decision Log
- [2026-04-22] Backend: Node/Express/TS + Prisma + PostgreSQL elegido por proficiencia del developer.
- [2026-04-22] Auth: JWT access (15min) + refresh (7días) con bcrypt cost 12.
- [2026-04-22] Geolocalización: Fórmula Haversine en SQL crudo Prisma para filtrar barberos cercanos.
- [2026-04-22] Real-time: Socket.io integrado para notificaciones instantáneas de reservas.
- [2026-04-22] Frontend: React + Vite + Tailwind + shadcn/ui para desarrollo rápido y consistente.
- [2026-04-22] State: Zustand para auth (persistencia refreshToken), TanStack Query para server state.
- [2026-04-22] Mapa: Mapbox GL JS por mejor relación calidad/precio vs Google Maps.
- [2026-04-22] Pagos: Stripe como pasarela principal (5% comisión por servicio).

## 5. 🐞 Deferred Issues
- Tests unitarios pendientes para availability.service.ts (Fase 5).
- Reconexión automática y cache local para conexiones intermitentes (Fase 5 - crítico para Venezuela).
- Emails reales de notificación (por ahora solo registros en DB).
- Optimización de imágenes de galería (lazy loading, CDN).