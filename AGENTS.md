# AI Agent Onboarding – gp-nestjs-api

This document helps autonomous agents understand the project structure, workflows, and guardrails so they can contribute confidently.

## Mission
A NestJS REST API backed by MySQL using a lightweight Kysely + mysql2 data layer. The codebase follows best practices around validation, logging, and modular architecture. Agents are expected to keep consistency, maintain test/lint health, and respect environment constraints.

## Tech Stack
- **Runtime:** Node.js 20, TypeScript, NestJS 11
- **Database:** MySQL via Kysely query builder (no native binaries)
- **Testing:** Jest (unit + e2e) with `--runInBand`
- **Tooling:** ESLint, Prettier, Docker/Docker Compose

## Key Directories
- `src/`
  - `app.controller.ts`, `app.module.ts`, `app.service.ts`: root module and base endpoints
  - `config/setup-app.ts`: shared bootstrap helper configuring pipes and swagger
  - `common/`: shared DTOs and utilities
  - `database/`: connection pooling, schema bootstrap, and Kysely bindings
  - `users/`: user REST resource with DTOs, service, controller
  - `health/`: liveness/readiness endpoints hitting the database directly
- `test/`: Jest e2e spec; unit specs live beside source files

## Environment & Secrets
- `.env` / `.env.example` provide `APP_PORT`, `DATABASE_URL`, optional `DATABASE_ADMIN_URL`.
- Admin URL is only used during boot to ensure the schema exists; store securely if used.

## Commands
- `npm run dev` – watch mode
- `npm run build` – compile TypeScript
- `npm run lint:check` / `npm run format:check` – enforce standards
- `npm test` – unit tests (run serially)
- `npm run test:e2e` – e2e tests (requires running MySQL)

## Continuous Integration
- GitHub Actions workflow at `.github/workflows/ci.yml` runs on pushes and pull requests targeting `dev` (default) and `main`.
- Steps: checkout, setup Node.js 20 with npm cache, `npm ci`, `npm run lint:check`, `npm test`, and `npm run build`.
- Keep these commands green; extend the workflow if new quality gates are required.

## Logging & Error Handling
- Services and controllers use Nest’s `Logger` to trace operations.
- Database errors that matter (duplicate email, missing rows) are mapped inside services; unexpected errors bubble up.
- Health checks and bootstrap code emit structured diagnostics.

## Contribution Guidelines
1. **Node/TS compatibility:** Stick with TypeScript ES2022 and `moduleResolution: node16` for decorator support.
2. **Validation:** Add DTOs and leverage `class-validator` / `class-transformer` for new endpoints.
3. **Logging:** Follow the existing pattern—controller logs for entry, service logs for business actions.
4. **Database:** Update the schema bootstrap logic in `DatabaseService` or create migrations if the data model changes; keep queries type-safe with Kysely.
5. **Testing:** Add/adjust unit and e2e tests; they run serially to avoid worker crashes.
6. **Lint/Format:** Run `npm run lint:check` and `npm run format` before finishing changes.
7. **Docker:** Keep Dockerfile/compose in sync when dependencies change.

## Common Pitfalls
- Forgetting to supply MySQL credentials or admin URL leads to bootstrap failure.
- Running e2e tests without a reachable MySQL instance.
- Introducing TypeScript config changes incompatible with decorators.
- Forgetting to update the schema bootstrap SQL when adding new tables/columns.

## Automation Hooks
- Jest serial execution prevents worker crashes in constrained environments.
- Startup bootstrap ensures the target database and core tables exist when admin credentials are supplied.

## Future Work Suggestions for Agents
- Implement authentication/authorization modules.
- Add structured logging transport (e.g., pino) or observability hooks.
- Expand test coverage for the users module and new resources.
- Introduce CI scripts and Git hooks (lint/test) if not already managed externally.

Stay consistent, keep logs informative, honor configuration contracts, and always verify with lint/tests before finishing. EOF
