# Design + Tasks — OLA 2: Skills de Dominio Business

> Spec-Driven Development · Phase 3-4 · Artifact consolidado
> Estructura de carpetas, firmas de scripts, grafo de cross-refs, y task breakdown SPEC.

## Folder Structure

```
.opencode/skills/
├── booking-scheduling-domain/
│   ├── SKILL.md
│   ├── references/
│   │   ├── slot-logic.md
│   │   ├── conflict-resolution.md
│   │   ├── no-show-protocol.md
│   │   └── types.md
│   └── scripts/
│       └── check-booking-queries.mjs
├── background-jobs-queues/
│   ├── SKILL.md
│   ├── references/
│   │   ├── job-catalog.md
│   │   └── bullmq-setup.md
│   └── scripts/
│       └── check-jobs.mjs
├── file-uploads-storage/
│   ├── SKILL.md
│   ├── references/
│   │   ├── upload-patterns.md
│   │   ├── storage-config.md
│   │   └── validation-rules.md
│   └── scripts/
│       └── check-uploads.mjs
├── forms-validation-react/
│   ├── SKILL.md
│   ├── references/
│   │   ├── rhf-zod-pattern.md
│   │   ├── multi-step-forms.md
│   │   └── shared-schemas.md
│   └── scripts/
│       └── check-forms.mjs
├── notifications-multichannel/
│   ├── SKILL.md
│   ├── references/
│   │   ├── channel-priority.md
│   │   ├── templates.md
│   │   └── provider-config.md
│   └── scripts/
│       └── check-notifications.mjs
```

**Conteo**: 5 SKILL.md + 15 references/*.md + 5 scripts/*.mjs = 25 archivos nuevos.

## Script Contracts

Todos los scripts usan `_shared/script-utils.mjs` (helper compartido de OLA 1).

### 1. `booking-scheduling-domain/scripts/check-booking-queries.mjs`
Detecta queries de booking sin `$transaction` o sin conflict check inline.

### 2. `background-jobs-queues/scripts/check-jobs.mjs`
Detecta jobs sin retry strategy o sin idempotency check (job key único).

### 3. `file-uploads-storage/scripts/check-uploads.mjs`
Detecta endpoints de upload sin validación de tipo/tamaño (multer config sin fileFilter o limits).

### 4. `forms-validation-react/scripts/check-forms.mjs`
Detecta forms sin zodResolver o con schemas inline (no importados de shared-types).

### 5. `notifications-multichannel/scripts/check-notifications.mjs`
Detecta notificaciones enviadas sin usar NotificationService (e.g., `expo.notifications` directamente en routes).

## Cross-Reference Graph

```
booking-scheduling-domain ──► barbergo-workflow (lifecycle)
                       ──► background-jobs-queues (no-show timeout)
                       ──► prisma-orm (transaction)
                       ──► socketio (booking events)

background-jobs-queues ──► notifications-multichannel (reminder jobs)
                     ──► barbergo-workflow (no-show)

file-uploads-storage ──► prisma-frontend-types (gallery type)
                    ──► api-response-normalizer (upload response envelope)

forms-validation-react ──► prisma-frontend-types (field types)
                       ──► react-vite (form components)
                       ──► react-native (mobile forms)

notifications-multichannel ──► push-notifications (push channel)
                          ──► background-jobs-queues (queued notifications)
                          ──► barbergo-workflow (status notifications)
```

---

## Task Breakdown (SPEC)

### Block 0 — Shared (already exists from OLA 1)
- _shared/script-utils.mjs ✅ (exists)

### Block 1 — booking-scheduling-domain

| # | Task | Files | Verification |
|---|---|---|---|
| 1.1 | SKILL.md | `booking-scheduling-domain/SKILL.md` | validate-skills → 0 errors |
| 1.2 | references/slot-logic.md | slot rules (duration, buffer, horario) | grep "^##" ≥ 3 |
| 1.3 | references/conflict-resolution.md | ACID pattern + race diagram | grep "^##" ≥ 2 |
| 1.4 | references/no-show-protocol.md | timeout + auto-cancel + fee | grep "^##" ≥ 3 |
| 1.5 | references/types.md | BookingSlot, AvailabilityWindow, ConflictCheck | grep "interface" ≥ 3 |
| 1.6 | scripts/check-booking-queries.mjs | detect no-$transaction | node script → exit 0 |
| 1.7 | Update SKILLS.md + AGENTS.md | add to 04-backend + auto-invoke | grep finds entry |

### Block 2 — background-jobs-queues

| # | Task | Files | Verification |
|---|---|---|---|
| 2.1 | SKILL.md | `background-jobs-queues/SKILL.md` | validate-skills → 0 errors |
| 2.2 | references/job-catalog.md | 5+ jobs | grep "^##" ≥ 5 |
| 2.3 | references/bullmq-setup.md | Redis + Queue + Worker config | grep "^##" ≥ 3 |
| 2.4 | scripts/check-jobs.mjs | detect no-retry | node script → exit 0 |
| 2.5 | Update SKILLS.md + AGENTS.md | | grep finds entry |

### Block 3 — file-uploads-storage

| # | Task | Files | Verification |
|---|---|---|---|
| 3.1 | SKILL.md | `file-uploads-storage/SKILL.md` | validate-skills → 0 errors |
| 3.2 | references/upload-patterns.md | 3 patterns | grep "^##" ≥ 3 |
| 3.3 | references/storage-config.md | S3/Cloudinary/local | grep "^##" ≥ 3 |
| 3.4 | references/validation-rules.md | type/size/dimensions | grep "^##" ≥ 3 |
| 3.5 | scripts/check-uploads.mjs | detect no-validation | node script → exit 0 |
| 3.6 | Update SKILLS.md + AGENTS.md | | grep finds entry |

### Block 4 — forms-validation-react

| # | Task | Files | Verification |
|---|---|---|---|
| 4.1 | SKILL.md | `forms-validation-react/SKILL.md` | validate-skills → 0 errors |
| 4.2 | references/rhf-zod-pattern.md | base pattern | grep "^##" ≥ 3 |
| 4.3 | references/multi-step-forms.md | wizard pattern | grep "^##" ≥ 2 |
| 4.4 | references/shared-schemas.md | shared schema convention | grep "^##" ≥ 2 |
| 4.5 | scripts/check-forms.mjs | detect no-zodResolver | node script → exit 0 |
| 4.6 | Update SKILLS.md + AGENTS.md | | grep finds entry |

### Block 5 — notifications-multichannel

| # | Task | Files | Verification |
|---|---|---|---|
| 5.1 | SKILL.md | `notifications-multichannel/SKILL.md` | validate-skills → 0 errors |
| 5.2 | references/channel-priority.md | push > SMS > email logic | grep "^##" ≥ 2 |
| 5.3 | references/templates.md | 6+ templates | grep "^##" ≥ 6 |
| 5.4 | references/provider-config.md | Resend + Twilio + Expo | grep "^##" ≥ 3 |
| 5.5 | scripts/check-notifications.mjs | detect direct expo.notifications | node script → exit 0 |
| 5.6 | Update SKILLS.md + AGENTS.md | | grep finds entry |

### Block 6 — Final Validation

| # | Task | Verification |
|---|---|---|
| 6.1 | skill-validator --strict | 0 errors |
| 6.2 | All 5 scripts executable | exit 0 each |
| 6.3 | SKILLS.md count | 78 entries (73 + 5) |

**Total**: 25 archivos nuevos + 2 updates (SKILLS.md, AGENTS.md). 30 tasks.

## Decision Log

```
[2026-06-17] OLA 2 Phase 3-4 Design+Tasks aprobado. 5 skills, 25 archivos. Artefacto: retoques/openspec/changes/ola2-business-skills/design-tasks.md
```
