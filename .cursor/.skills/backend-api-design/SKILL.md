---
name: backend-api-design
description: Design and implement production-grade REST APIs with Express, Prisma 7, and MySQL. Use this skill for routes, middleware, authentication, validation, persistence, migrations, observability, or when structuring a Node.js backend that must stay maintainable and secure—the backend counterpart to "design thinking" used on the frontend.
---

This skill applies **design thinking** (purpose, constraints, differentiation) to **API and backend architecture**—same discipline as frontend-design (context first, then intentional execution), but expressed as contracts, data models, and operations instead of typography and layout.

The user describes what the API should do (resources, auth, integrations, SLAs). They may reference the Blog UI or domain entities (posts, users, comments).

## Design thinking (backend)

Before coding endpoints, clarify:

- **Purpose**: Who calls this API (web app, mobile, jobs)? What workflows must be atomic or idempotent?
- **Resource model**: Nouns and relationships; which boundaries are aggregates; what is public vs internal DTO.
- **Tone of failure**: How errors are surfaced (problem+json, custom envelope); validation vs authorization vs not-found semantics.
- **Constraints**: Express version, deployment (serverless vs long-running), MySQL sizing, Prisma 7 adapter setup, existing auth.
- **Differentiation**: One clear “north star” for quality—e.g. **predictable pagination**, **strict validation**, **audit trail**, or **low-latency reads**—and implement it consistently, not halfway.

**Critical**: Choose a coherent API style and apply it everywhere (naming, status codes, error shape, date format). Boring consistency beats clever one-offs.

## Architecture guidelines (Express + Prisma 7 + MySQL)

Focus on:

- **Layering**: Routers thin; services hold business rules; Prisma stays in data/repository modules. Avoid fat route handlers with raw SQL unless justified.
- **Contracts**: Request validation at the boundary (e.g. Zod). Response types documented (OpenAPI or shared types package if monorepo). Version APIs if breaking changes are likely (`/api/v1`).
- **Data integrity**: Transactions for multi-step writes; Prisma schema reflects real constraints (unique, FK, indexes). Migrations reviewed like code.
- **Security**: Least privilege DB user; rotate secrets; HTTP security headers if serving HTML—API still needs solid CORS, rate limits where abuse matters, and auth schemes that match the UI (cookies vs bearer). Never expose stack traces in JSON.
- **Performance**: Indexed queries; no unbounded lists; select only needed columns for hot paths; connection pooling via Prisma’s MySQL2 adapter setup as per project singleton.
- **Observability**: Consistent logging; request ids; metrics placeholders compatible with your host (no PII in logs).

## MySQL & Prisma 7 specifics

- Prefer **utf8mb4**; explicit lengths where it matters; document migration impact on large tables (online DDL concerns).
- Treat **Prisma 7** config as part of the **system design**: `prisma.config.ts`, env loading, generator output path, and **PrismaClient** construction with the correct **adapter** for MySQL (`mysql2`).
- After substantive schema edits: migrate → generate → smoke-test critical queries.

## What to avoid

- Endpoints that return different JSON shapes for the same resource “depending on mood.”
- Silent truncation of validation errors (either return field-level detail consistently or a single opaque 400—pick one policy).
- N+1 patterns disguised as “simple loops.”
- Putting business rules only in controllers so services cannot be reused or tested.

## Execution standard

Deliver **working** code paths: validation, persistence, error mapping, and a minimal repeatable way to run migrations and seeds. Elegance is **clear module boundaries** and **honest HTTP semantics**—mirroring the frontend rule: implement completely, with intention behind every public surface.
