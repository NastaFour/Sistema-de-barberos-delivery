# PRD + Design + Tasks — OLA 3: Skills Post-MVP (5 skills)

> Spec-Driven Development · Phase 1-4 consolidado
> Skills post-MVP: i18n, offline sync, deep linking, reports, store deployment.

## Skills Overview

| Skill | Categoría | Purpose |
|---|---|---|
| `i18n-localization` | 05-frontend | Multi-idioma (es/en) con i18next |
| `offline-sync-mobile` | 05-frontend | Sync offline Expo con conflict resolution |
| `deep-linking-mobile` | 05-frontend | Deep links Expo para reservas compartidas |
| `reports-exports` | 04-backend | Reportes PDF/CSV de ingresos, reservas, ratings |
| `store-deployment-eas` | 08-devops | Deploy a App Store / Play Store via EAS |

## Task Breakdown (30 tasks: 5 skills × 6 tasks each)

### Block 1-5: Una skill por block

Cada skill: SKILL.md + 2-3 references + 1 script + update SKILLS.md/AGENTS.md.

### Block 6: Final Validation

skill-validator --strict → 0 errors. SKILLS.md count = 83.

## Cross-References

- `i18n-localization` → `react-native`, `react-vite`, `notifications-multichannel` (template localization)
- `offline-sync-mobile` → `state-management`, `booking-scheduling-domain`, `background-jobs-queues`
- `deep-linking-mobile` → `react-native`, `barbergo-workflow`
- `reports-exports` → `prisma-orm`, `postgresql`, `payments`, `booking-scheduling-domain`
- `store-deployment-eas` → `expo-production-auditor`, `ci-cd`, `env-management`
