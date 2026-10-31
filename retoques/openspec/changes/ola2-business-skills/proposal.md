# PRD — OLA 2: Skills de Dominio Business (5 skills)

> Spec-Driven Development · Phase 1-2 · Artifact
> Skills de dominio business críticas para BarberGo. Tocan lógica core.

## Objetivo General

Crear 5 skills de dominio business que cubren los flujos críticos de BarberGo no cubiertos por skills existentes: booking/scheduling, background jobs, file uploads, form validation, y notificaciones multichannel. Cada skill debe codificar el business logic específico de BarberGo con patrones accionables.

---

## Skill 1: `booking-scheduling-domain`

**Categoría destino**: 04-backend

### Business Goal
Codificar la lógica core de reservas: slots de disponibilidad, verificación de conflictos, transacciones ACID para create booking, timeout de no-show, y reasignación automática. El corazón del app.

### User Stories
- **US1**: Como AI agent al implementar createBooking, quiero el patrón de transacción ACID con slot check inline que previene race conditions entre dos clientes reservando el mismo slot.
- **US2**: Como dev al diseñar availability, quiero las reglas de slots (duración de servicio, buffer entre servicios, horario laboral del barbero, zonas de exclusión).

### Acceptance Criteria
- **AC1**: `references/slot-logic.md` con reglas: duración de servicio, buffer, horario laboral, exclusión por día festivo/enfermedad
- **AC2**: `references/conflict-resolution.md` con patrón de transacción ACID (lock + check + insert) + diagrama de race condition
- **AC3**: `references/no-show-protocol.md` con timeout, auto-cancel, fee logic, reasignación AI
- **AC4**: Script `scripts/check-booking-queries.mjs` que detecte queries de booking sin `$transaction` o sin conflict check
- **AC5**: Tipos de datos: `BookingSlot`, `AvailabilityWindow`, `ConflictCheck` en `references/types.md`
- **AC6**: Referencia `barbergo-workflow` para el lifecycle de estados

### Edge Cases
- **EC1**: Dos clientes reservan el mismo slot simultáneamente → transacción con SELECT FOR UPDATE o check inline
- **EC2**: Barbero marca no disponible después de aceptar → reasignación automática
- **EC3**: Servicio de duración variable → slot dinámico basado en service.durationMinutes
- **EC4**: Zona horaria del cliente vs barbero → normalizar a UTC en DB

---

## Skill 2: `background-jobs-queues`

**Categoría destino**: 04-backend

### Business Goal
Patrones para jobs programados y colas: recordatorios push (24h antes), timeout de no-show, auto-cancel, email de reseña, push programado. Usa BullMQ + Redis.

### User Stories
- **US1**: Como AI agent al implementar recordatorios, quiero el patrón de job programado con BullMQ (delayed job 24h antes de la reserva).
- **US2**: Como dev ante un no-show, quiero el job de timeout que dispara auto-cancel + reasignación AI después de X minutos de tolerancia.

### Acceptance Criteria
- **AC1**: `references/job-catalog.md` con 5+ jobs: reminder-24h, reminder-1h, no-show-timeout, review-request, ai-reassign
- **AC2**: `references/bullmq-setup.md` con config de Redis, Queue, Worker, retry strategy, exponential backoff
- **AC3**: Script `scripts/check-jobs.mjs` que detecte jobs sin retry strategy o sin idempotency check
- **AC4**: Patrón de idempotency (job key único por bookingId + tipo) para evitar duplicados
- **AC5**: Referencia `barbergo-workflow` para no-show + reasignación

### Edge Cases
- **EC1**: Redis cae → jobs en memoria, retry al reconectar
- **EC2**: Job ejecuta pero booking ya cancelado → idempotency check + early return
- **EC3**: Job programado pero fecha de reserva cambió → cancelar job viejo + crear nuevo
- **EC4**: Múltiples instancias de worker → idempotency para que solo una ejecute

---

## Skill 3: `file-uploads-storage`

**Categoría destino**: 04-backend

### Business Goal
Patrones para subir archivos: galería de barberos, avatars de usuarios, imágenes de servicios. Cubre storage (S3/Cloudinary/local), validación (tipo, tamaño), y optimización (resize, WebP).

### User Stories
- **US1**: Como AI agent al implementar upload de avatar, quiero el patrón de multer + validación (tipo image/*, max 5MB) + storage en S3.
- **US2**: Como dev al subir galería de barbero, quiero el patrón de multi-upload con resize a WebP + thumbnail generation.

### Acceptance Criteria
- **AC1**: `references/upload-patterns.md` con 3 patrones: single avatar, multi-gallery, service-image
- **AC2**: `references/storage-config.md` con config S3/Cloudinary/local + env vars requeridas
- **AC3**: `references/validation-rules.md` con tipos permitidos, max size, dimensiones, sanitization
- **AC4**: Script `scripts/check-uploads.mjs` que detecte endpoints de upload sin validación de tipo/tamaño
- **AC5**: Patrón de response: `{ data: { url, thumbnailUrl, width, height } }` envelope

### Edge Cases
- **EC1**: Upload de archivo malicioso (image con EXIF) → strip metadata con sharp
- **EC2**: Upload de PDF disfrazado de image → validar magic bytes, no solo extension
- **EC3**: S3 timeout → retry con exponential backoff
- **EC4**: Mobile con conexión inestable → upload resumable o chunked

---

## Skill 4: `forms-validation-react`

**Categoría destino**: 05-frontend

### Business Goal
Patrones de form validation con React Hook Form + Zod para todos los forms del web y mobile: login, register, booking, review, profile edit. Validación cliente + servidor compartida via `packages/shared-types`.

### User Stories
- **US1**: Como AI agent al crear form de login, quiero el patrón RHF + Zod resolver con schemas compartidos de `@barbergo/shared-types`.
- **US2**: Como dev al crear form de booking, quiero el patrón de multi-step form con validación por step + schema condicional.

### Acceptance Criteria
- **AC1**: `references/rhf-zod-pattern.md` con patrón base: useForm + zodResolver + shared schema
- **AC2**: `references/multi-step-forms.md` con patrón de wizard form con validación por step
- **AC3**: `references/shared-schemas.md` con convención de schemas en `packages/shared-types` reutilizables web + mobile
- **AC4**: Script `scripts/check-forms.mjs` que detecte forms sin Zod resolver o con schemas inline (no compartidos)
- **AC5**: Cobertura web (RHF) y mobile (RHF + react-native adaptadores)
- **AC6**: Patrones de error display: inline error, toast, error summary

### Edge Cases
- **EC1**: Validación asíncrona (check email único) → debounce + server validation
- **EC2**: Form con campos condicionales → schema dinámico con discriminated union
- **EC3**: Mobile sin keyboard dismissal → `KeyboardAvoidingView` + submit on blur
- **EC4**: Submit con Enter → prevenir double submit con isSubmitting

---

## Skill 5: `notifications-multichannel`

**Categoría destino**: 04-backend

### Business Goal
Unificar notificaciones email + SMS + push en un solo servicio. Hoy solo existe `push-notifications`. Esta skill agrega canales de email (Resend/SendGrid) y SMS (Twilio) con preferencias de usuario.

### User Stories
- **US1**: Como AI agent al enviar notificación de booking confirmado, quiero el patrón `NotificationService.send(userId, { channel, template, data })` que resuelve preferencias del usuario.
- **US2**: Como dev al enviar recordatorio 24h, quiero que el servicio decida canal según preferencias (push si app instalada, SMS si no, email como fallback).

### Acceptance Criteria
- **AC1**: `references/channel-priority.md` con lógica: push > SMS > email (o según preferencias)
- **AC2**: `references/templates.md` con catálogo de templates: booking-confirmed, reminder-24h, reminder-1h, no-show, review-request, welcome
- **AC3**: `references/provider-config.md` con config Resend (email), Twilio (SMS), Expo Push (push) + env vars
- **AC4**: Script `scripts/check-notifications.mjs` que detecte notificaciones enviadas sin usar el NotificationService unificado
- **AC5**: Patrón de `NotificationLog` en DB para tracking + retry
- **AC6**: Referencia `push-notifications` para el canal push específico

### Edge Cases
- **EC1**: Usuario sin phone ni email → solo push, si no tiene app → no notification (log warning)
- **EC2**: SMS falla (Twilio error) → retry con backoff, fallback a email
- **EC3**: Email bounce → marcar email como inválido en DB, no reintentar
- **EC4**: Rate limit de provider (Twilio 1 SMS/sec) → queue con BullMQ

---

## Decision Log Entry

```
[2026-06-17] OLA 2 Phase 1-2 PRD aprobado. 5 skills de dominio business con AC + edge cases. Artefacto: retoques/openspec/changes/ola2-business-skills/proposal.md
```
