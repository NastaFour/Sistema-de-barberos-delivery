# Tasks — OLA 1: Skills Preventivas (SPEC Breakdown)

> Spec-Driven Development · Phase 4 · Artifact
> Cada task: Specific, Programmatically evaluable, Explicit scope, Constrained.
> Orden de ejecución: secuencial por bloque. Un commit = un task.

## Block 0 — Shared Infrastructure

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 0.1 | Crear `_shared/script-utils.mjs` con helpers: walkFiles, readFileUtf8, printResult, exitFromResult, parseFrontmatter | `.opencode/skills/_shared/script-utils.mjs` | S: 5 exports nombrados. P: importable desde otro .mjs. E: 1 archivo. C: sin deps externas, solo node:fs/path | `node -e "import('./.opencode/skills/_shared/script-utils.mjs').then(m=>console.log(Object.keys(m)))"` imprime 5 keys |

## Block 1 — Skill 1: build-config-validator

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 1.1 | Crear `SKILL.md` con frontmatter + body (When to Use, Hard Rules, Workflow, References) | `build-config-validator/SKILL.md` | S: name=build-config-validator, desc≤1024 con what+when. P: skill-validator pasa. E: 1 archivo. C: sin npm/npx/any | `node validate-skills.mjs ./build-config-validator` → 0 errors |
| 1.2 | Crear `scripts/validate-build-config.mjs` que cheque postcss.config + tailwind.config (DEFAULT) + vite.config + tsconfig.base | `build-config-validator/scripts/validate-build-config.mjs` | S: 4 checks (postcss, tailwind, vite, tsconfig). P: exit 0 si OK, 1 si falta. E: 1 archivo. C: usa script-utils, sin deps externas | `node validate-build-config.mjs --webDir apps/web` en repo real |
| 1.3 | Agregar `--fix` flag que genere config files faltantes con template correcto | `build-config-validator/scripts/validate-build-config.mjs` | S: flag --fix crea archivo faltante. P: archivo creado existe. E: edita 1 archivo. C: templates sin secrets | `node validate-build-config.mjs --fix` crea postcss.config.js si falta |
| 1.4 | Actualizar `SKILLS.md` (mover de planned a 06-code-quality) + `AGENTS.md` (auto-invoke entry) | `SKILLS.md`, `AGENTS.md` | S: fila en tabla 06 + row en auto-invoke. P: grep encuentra entrada. E: 2 archivos. C: path plano | `grep build-config-validator SKILLS.md AGENTS.md` |

## Block 2 — Skill 2: frontend-debugging-protocol

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 2.1 | Crear `SKILL.md` | `frontend-debugging-protocol/SKILL.md` | S: name=frontend-debugging-protocol. P: skill-validator pasa. E: 1 archivo. C: sin npm | `validate-skills.mjs ./frontend-debugging-protocol` → 0 errors |
| 2.2 | Crear `references/diagnostic-tree.md` con árbol de decisión por 5 síntomas (sin CSS, sin data, sin markers, sin imagen, redirect loop) | `frontend-debugging-protocol/references/diagnostic-tree.md` | S: 5 síntomas con causa+fix. P: 5 secciones con headers. E: 1 archivo. C: refs a build-config-validator + api-response-normalizer | `grep -c "^##" diagnostic-tree.md` ≥ 5 |
| 2.3 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 02-dev-roles + auto-invoke. P: grep encuentra. E: 2 archivos. C: path plano | `grep frontend-debugging-protocol SKILLS.md` |

## Block 3 — Skill 3: auth-flow-audit

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 3.1 | Crear `SKILL.md` | `auth-flow-audit/SKILL.md` | S: name=auth-flow-audit. P: skill-validator pasa. E: 1 archivo. C: ref a jwt-bcrypt | `validate-skills.mjs ./auth-flow-audit` → 0 errors |
| 3.2 | Crear `references/audit-checklist.md` con 10+ checks categorizados (store, App, API, cookie, interceptor) | `auth-flow-audit/references/audit-checklist.md` | S: 5 categorías con 10+ checks. P: 5 headers de categoría. E: 1 archivo. C: sin LocalStorage | `grep -c "^##" audit-checklist.md` ≥ 5 |
| 3.3 | Crear `scripts/audit-auth.mjs` que detecte anti-patrones (localStorage token, redirect en interceptor, setToken sin getMe) | `auth-flow-audit/scripts/audit-auth.mjs` | S: detecta 4+ anti-patrones. P: exit 0 si limpio, 1 si encuentra. E: 1 archivo. C: usa script-utils | `node audit-auth.mjs` en repo real |
| 3.4 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 02-dev-roles + auto-invoke. P: grep encuentra. E: 2 archivos | `grep auth-flow-audit AGENTS.md` |

## Block 4 — Skill 4: rate-limiting-design

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 4.1 | Crear `SKILL.md` | `rate-limiting-design/SKILL.md` | S: name=rate-limiting-design. P: skill-validator pasa. E: 1 archivo. C: ref a api-design | `validate-skills.mjs ./rate-limiting-design` → 0 errors |
| 4.2 | Crear `references/tier-table.md` con 4 tiers (auth-strict, session-moderate, api-standard, ai-quota) + config express-rate-limit | `rate-limiting-design/references/tier-table.md` | S: 4 tiers con window+max. P: 4 filas en tabla. E: 1 archivo. C: sin npm | `grep -c "tier\|Tier" tier-table.md` ≥ 4 |
| 4.3 | Crear `scripts/check-limiters.mjs` que detecte limiter compartido entre login y session endpoints | `rate-limiting-design/scripts/check-limiters.mjs` | S: detecta shared limiter. P: exit 0 si OK, 1 si encuentra. E: 1 archivo. C: usa script-utils | `node check-limiters.mjs --apiDir apps/api/src` |
| 4.4 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 04-backend + auto-invoke. P: grep encuentra. E: 2 archivos | `grep rate-limiting-design SKILLS.md` |

## Block 5 — Skill 5: api-response-normalizer

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 5.1 | Crear `SKILL.md` | `api-response-normalizer/SKILL.md` | S: name=api-response-normalizer. P: skill-validator pasa. E: 1 archivo. C: ref a prisma-frontend-types | `validate-skills.mjs ./api-response-normalizer` → 0 errors |
| 5.2 | Crear `references/envelope-convention.md` con envelope {data, meta, error} + reglas ID + helper functions pattern | `api-response-normalizer/references/envelope-convention.md` | S: envelope + reglas ID + helpers. P: 3 secciones. E: 1 archivo. C: sin any | `grep -c "^##" envelope-convention.md` ≥ 3 |
| 5.3 | Crear `scripts/check-id-consistency.mjs` que detecte req.params.id usado en where con campo distinto | `api-response-normalizer/scripts/check-id-consistency.mjs` | S: detecta ID mismatch. P: exit 0 si OK, 1 si encuentra. E: 1 archivo. C: usa script-utils | `node check-id-consistency.mjs --apiDir apps/api/src` |
| 5.4 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 04-backend + auto-invoke. E: 2 archivos | `grep api-response-normalizer SKILLS.md` |

## Block 6 — Skill 6: prisma-frontend-types

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 6.1 | Crear `SKILL.md` | `prisma-frontend-types/SKILL.md` | S: name=prisma-frontend-types. P: skill-validator pasa. E: 1 archivo. C: ref a prisma-orm + api-response-normalizer | `validate-skills.mjs ./prisma-frontend-types` → 0 errors |
| 6.2 | Crear `references/type-mapping-rules.md` con tabla Prisma→TS (String, Int, Boolean, DateTime, Json, Enum, Relation) | `prisma-frontend-types/references/type-mapping-rules.md` | S: 7+ mapeos. P: tabla con 7+ filas. E: 1 archivo. C: Json→unknown no any | `grep -c "DateTime\|Json\|Relation" type-mapping-rules.md` ≥ 3 |
| 6.3 | Crear `scripts/generate-frontend-types.mjs` que lea schema.prisma y genere tipos TS | `prisma-frontend-types/scripts/generate-frontend-types.mjs` | S: parsea schema.prisma + genera .ts. P: output tiene interfaces. E: 1 archivo. C: no usa prisma generate, parsing manual | `node generate-frontend-types.mjs --schemaPath apps/api/prisma/schema.prisma` (dry-run) |
| 6.4 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 04-backend + auto-invoke. E: 2 archivos | `grep prisma-frontend-types SKILLS.md` |

## Block 7 — Skill 7: nodejs-module-loading

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 7.1 | Crear `SKILL.md` | `nodejs-module-loading/SKILL.md` | S: name=nodejs-module-loading. P: skill-validator pasa. E: 1 archivo. C: ref a env-management | `validate-skills.mjs ./nodejs-module-loading` → 0 errors |
| 7.2 | Crear `references/esm-evaluation-order.md` con diagrama de orden de imports + anti-patrón dotenv + regla import "dotenv/config" | `nodejs-module-loading/references/esm-evaluation-order.md` | S: diagrama + anti-patrón + regla. P: 3 secciones. E: 1 archivo. C: cobertura ESM | `grep -c "^##" esm-evaluation-order.md` ≥ 3 |
| 7.3 | Crear `scripts/check-env-loading.mjs` que detecte dotenv.config() tarde en cadena de imports | `nodejs-module-loading/scripts/check-env-loading.mjs` | S: detecta dotenv tarde. P: exit 0 si OK, 1 si encuentra. E: 1 archivo. C: usa script-utils | `node check-env-loading.mjs --srcDir apps/api/src` |
| 7.4 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 04-backend + auto-invoke. E: 2 archivos | `grep nodejs-module-loading SKILLS.md` |

## Block 8 — Skill 8: lazy-loading-patterns

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 8.1 | Crear `SKILL.md` | `lazy-loading-patterns/SKILL.md` | S: name=lazy-loading-patterns. P: skill-validator pasa. E: 1 archivo. C: ref a react-vite | `validate-skills.mjs ./lazy-loading-patterns` → 0 errors |
| 8.2 | Crear `references/lazy-patterns.md` con 3 patrones (singleton lazy, React.lazy, dynamic import) + ejemplos Stripe/Leaflet/LLM | `lazy-loading-patterns/references/lazy-patterns.md` | S: 3 patrones con ejemplos. P: 3 secciones. E: 1 archivo. C: sin any | `grep -c "^##" lazy-patterns.md` ≥ 3 |
| 8.3 | Crear `scripts/check-module-level-loads.mjs` que detecte loadStripe/new Map/L.map a nivel de módulo | `lazy-loading-patterns/scripts/check-module-level-loads.mjs` | S: detecta 3+ calls a nivel módulo. P: exit 0 si OK, 1 si encuentra. E: 1 archivo. C: usa script-utils | `node check-module-level-loads.mjs --srcDir apps/web/src` |
| 8.4 | Actualizar `SKILLS.md` + `AGENTS.md` | `SKILLS.md`, `AGENTS.md` | S: fila en 05-frontend + auto-invoke. E: 2 archivos | `grep lazy-loading-patterns SKILLS.md` |

## Block 9 — Final Validation

| # | Task | Files | SPEC Criteria | Verification |
|---|---|---|---|---|
| 9.1 | Correr `skill-validator --strict` en todo `.opencode/skills/` | — | S: 0 errors. P: exit code 0. E: 0 archivos. C: strict mode | `node validate-skills.mjs ./.opencode/skills` → 0 errors |
| 9.2 | Verificar cross-refs: sin broken-reference warnings en las 8 skills nuevas | — | S: 0 broken refs en nuevas. P: validator no reporta broken. E: 0 archivos. C: paths planos | `node validate-skills.mjs ./.opencode/skills/<skill>` por cada una |
| 9.3 | Verificar SKILLS.md tiene 73 entradas (65 + 8 nuevas) | `SKILLS.md` | S: 73 skills listadas. P: count de filas. E: 1 archivo. C: planned section vacía para Tier 1 | `grep -c "^| \`" SKILLS.md` = 73 |

---

## Summary

- **33 tasks** en 10 blocks
- **21 archivos nuevos** (8 SKILL.md + 7 references + 6 scripts) + 1 shared + 2 updates (SKILLS.md, AGENTS.md)
- **Orden**: Block 0 → 1 → 2 → ... → 8 → 9 (secuencial, cada block independiente)
- **Commit strategy**: 1 commit por block (9 commits + 1 final validation)

## Decision Log Entry

```
[2026-06-17] OLA 1 Phase 4 Tasks aprobado. 33 tasks en 10 blocks. 21 archivos nuevos + 2 updates. Artefacto: retoques/openspec/changes/ola1-preventive-skills/tasks.md
```
