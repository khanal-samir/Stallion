# Stallion

A TypeScript monorepo for a CRM product.

## Overview

This repository contains:

- `apps/web`: Next.js frontend
- `apps/api`: Hono API server
- `packages/validators`: shared Zod schemas and types
- `packages/ui`: shared UI components
- `packages/eslint-config` and `packages/typescript-config`: shared tooling

## Product

The app is centered around a CRM with:

- People management
- Organization management
- Deals pipeline
- Workspace switching and invitations

## Frontend

The web app uses:

- Next.js
- React
- TanStack Query for server state
- TanStack Table for CRM list views
- React Hook Form + Zod for forms
- shadcn/ui and Radix components
- Tailwind CSS

Main UI patterns:

- People and Orgs use server-driven tables with sorting, filtering, pagination, row selection, and row actions.
- Deals use a Kanban board with drag-and-drop stage updates.
- Create/edit/view flows use shared sheet components.
- Workspace switching updates all CRM caches immediately.

## Backend

The API uses:

- Hono
- Drizzle ORM
- PostgreSQL
- Better Auth for authentication and organizations

The API handles:

- CRM CRUD
- Pagination, sorting, and filtering
- Workspace-scoped access
- Invitation and member management

## Shared Packages

- `packages/validators`: shared schemas for auth, workspace, and CRM entities
- `packages/ui`: shared design system components
- `packages/eslint-config`: shared lint rules
- `packages/typescript-config`: shared TS config

## Scripts

From the repo root:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
```

Database commands:

```bash
pnpm db:push
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:reset
```

Docker:

```bash
pnpm docker:up
pnpm docker:down
pnpm docker:clean
```

## Stack

- Node 20+
- pnpm
- Turborepo
- Next.js
- Hono
- Drizzle ORM
- PostgreSQL
- Better Auth
- TanStack Query
- TanStack Table

## Notes

- The repo is organized as a monorepo with app and package boundaries.
- CRM list pages are server-driven, not client-filtered.
- Deals are rendered as a pipeline instead of a table.
