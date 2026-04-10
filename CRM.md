# CRM Frontend Integration Plan

## Overview

Integrate CRM entities (People, Organizations, Deals) into the frontend using TanStack Table for data tables, ReUI Kanban for the deals board, and a shared EntitySheet for view/edit drawers. Server-side pagination, filtering, sorting, and search across all list endpoints.

---

## Architecture Decisions

| Decision        | Choice                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Pagination      | Server-side, offset-based                                                                                      |
| Data table      | Full-featured generic `DataTable<TData>` — owns toolbar, pagination, sorting, filtering, selection             |
| Deals view      | Kanban board only (no list toggle) — ReUI Kanban component                                                     |
| Row interaction | Click name → Sheet drawer in view mode; Edit button toggles edit mode; Add button → drawer in create/edit mode |
| Row actions     | Dropdown menu column (View / Edit / Delete) + checkbox selection for bulk                                      |
| Drawer          | Shared `EntitySheet` component with per-entity form fields                                                     |
| Kanban data     | Single `GET /deals` request, frontend groups by `stage`                                                        |
| Deal stage drag | Optimistic update with Tanstack Query `onMutate` + rollback on error                                           |
| Import CSV      | Deferred — remove buttons from initial build                                                                   |
| Bulk delete     | Single batch API call `DELETE /people/bulk { ids }`                                                            |
| Query keys      | Flat string keys following existing pattern                                                                    |
| File structure  | Grouped by `crm/` subfolder, organized per entity                                                              |

---

## Columns

### People Table

| Column         | Source                 | Notes                                           |
| -------------- | ---------------------- | ----------------------------------------------- |
| ☐ Checkbox     | TanStack row selection | Bulk selection                                  |
| Name           | `name`                 | Clickable, opens drawer                         |
| Email          | `email`                |                                                 |
| Phone          | `phone`                |                                                 |
| Job Title      | `jobTitle`             |                                                 |
| Status         | `status`               | Badge: lead/prospect/qualified/customer/churned |
| Source         | `source`               |                                                 |
| Organization   | `orgId` → org name     | Relation, requires API join                     |
| Owner          | `ownerId` → user name  | Relation, requires API join                     |
| Last Contacted | `lastContactedAt`      | Date formatting                                 |
| ⋯ Actions      | —                      | DropdownMenu: View / Edit / Delete              |

### Organizations Table

| Column     | Source                 | Notes                              |
| ---------- | ---------------------- | ---------------------------------- |
| ☐ Checkbox | TanStack row selection | Bulk selection                     |
| Name       | `name`                 | Clickable, opens drawer            |
| Domain     | `domain`               |                                    |
| Industry   | `industry`             |                                    |
| Size       | `size`                 |                                    |
| Location   | `location`             |                                    |
| People     | count via relation     | Requires API join                  |
| ⋯ Actions  | —                      | DropdownMenu: View / Edit / Delete |

### Deals Kanban

Stages (columns): `new` → `contacted` → `demo` → `proposal` → `won` → `lost`

Card shows: Title, Value+Currency, Person name, Org name, Owner, Close date

---

## File Structure

```
apps/web/
├── services/crm/
│   ├── people.service.ts        # API calls for people CRUD + list
│   ├── orgs.service.ts          # API calls for orgs CRUD + list
│   └── deals.service.ts         # API calls for deals CRUD + list
│
├── hooks/queries/
│   ├── use-people.ts            # usePeople, usePerson, useCreatePerson, useUpdatePerson, useDeletePerson, useBulkDeletePeople
│   ├── use-orgs.ts              # useOrganizations, useOrg, useCreateOrg, useUpdateOrg, useDeleteOrg, useBulkDeleteOrgs
│   └── use-deals.ts             # useDeals, useDeal, useCreateDeal, useUpdateDeal, useDeleteDeal
│
├── components/
│   ├── shared/
│   │   ├── data-table.tsx        # Generic DataTable<TData> with toolbar, pagination, sorting, filtering, selection
│   │   └── entity-sheet.tsx      # Shared Sheet drawer (view/edit modes, action buttons, loading)
│   │
│   └── crm/
│       ├── people/
│       │   ├── people-columns.tsx    # Column definitions for TanStack Table
│       │   ├── people-data-table.tsx # People page wiring (DataTable + usePeople hook)
│       │   ├── people-drawer.tsx     # People EntitySheet with person form fields
│       │   └── people-filters.tsx    # Filter config for status, source, owner selects
│       │
│       ├── orgs/
│       │   ├── orgs-columns.tsx      # Column definitions
│       │   ├── orgs-data-table.tsx    # Orgs page wiring
│       │   ├── orgs-drawer.tsx       # Orgs EntitySheet with org form fields
│       │   └── orgs-filters.tsx       # Filter config for industry, size selects
│       │
│       └── deals/
│           ├── deal-kanban.tsx       # Deal Kanban board using ReUI Kanban
│           ├── deal-card.tsx         # Single deal card component
│           └── deal-drawer.tsx       # Deals EntitySheet with deal form fields
│
├── lib/
│   └── query-keys.ts               # Add CRM keys (see below)
│
└── app/(crm)/
    ├── people/page.tsx              # Updated: uses PeopleDataTable
    ├── organizations/page.tsx       # Updated: uses OrgsDataTable
    └── deals/page.tsx               # Updated: uses DealKanban
```

---

## Query Keys

Add to existing `apps/web/lib/query-keys.ts`:

```ts
// CRM
PEOPLE: "people",
PEOPLE_LIST: "people-list",
PEOPLE_DETAIL: "people-detail",
ORGS: "orgs",
ORGS_LIST: "orgs-list",
ORGS_DETAIL: "orgs-detail",
DEALS: "deals",
DEALS_LIST: "deals-list",
DEALS_DETAIL: "deals-detail",
```

Hooks append params: `queryKey: [QUERY_KEYS.PEOPLE_LIST, params]`

---

## API Contract Changes

### All CRM List Endpoints — Add Pagination + Filtering + Search + Sorting

Current: `GET /people` → `{ success: true, data: { people: [...] } }`

New:

```
GET /people?page=1&pageSize=25&sortBy=name&sortOrder=asc&status=lead&search=john
GET /orgs?page=1&pageSize=25&sortBy=name&sortOrder=asc&industry=technology&search=acme
GET /deals?page=1&pageSize=25&sortBy=title&sortOrder=asc&stage=new&search=project
```

Response:

```json
{
  "success": true,
  "data": {
    "people": [...],
    "meta": {
      "page": 1,
      "pageSize": 25,
      "totalCount": 142,
      "totalPages": 6
    }
  }
}
```

### List Endpoint Query Params

| Param                   | Type   | Example        | Description                                                         |
| ----------------------- | ------ | -------------- | ------------------------------------------------------------------- |
| `page`                  | number | `1`            | Page number (1-indexed)                                             |
| `pageSize`              | number | `25`           | Items per page (default 25)                                         |
| `sortBy`                | string | `name`         | Column name to sort by                                              |
| `sortOrder`             | string | `asc` / `desc` | Sort direction                                                      |
| `search`                | string | `john`         | Search term (searches name, email, etc.)                            |
| Entity-specific filters |        | `status=lead`  | People: status, source, ownerId. Orgs: industry, size. Deals: stage |

### People List — Include Relations

```sql
SELECT people.*, orgs.name AS org_name, users.name AS owner_name
FROM people
LEFT JOIN orgs ON people.org_id = orgs.id
LEFT JOIN users ON people.owner_id = users.id
WHERE people.workspace_id = ?
```

Response adds `orgName` and `ownerName` to each person object (or nested `org: { id, name }` and `owner: { id, name }`).

### Orgs List — Include People Count

```sql
SELECT orgs.*, COUNT(people.id) AS people_count
FROM orgs
LEFT JOIN people ON people.org_id = orgs.id
WHERE orgs.workspace_id = ?
GROUP BY orgs.id
```

### Deals List — Include Relations (already exists in `getDeal`)

Extend `listDeals` to include relations like `getDeal` does:

```ts
const results = await db.query.deals.findMany({
  where: eq(deals.workspaceId, workspaceId),
  with: {
    org: { columns: { id: true, name: true } },
    person: { columns: { id: true, name: true } },
    owner: { columns: { id: true, name: true } },
  },
});
```

### Bulk Delete Endpoints (New)

```
DELETE /people/bulk  { ids: ["id1", "id2", "id3"] }
DELETE /orgs/bulk     { ids: ["id1", "id2", "id3"] }
```

Response: `{ success: true, data: { deleted: 3 } }`

---

## Implementation Phases

### Phase 1: Foundation (Backend + Shared Components)

**1.1 Backend — Pagination, Filtering, Sorting, Search**

- Update `listPeople` controller to accept query params (page, pageSize, sortBy, sortOrder, status, source, ownerId, search)
- Update `listOrgs` controller to accept query params (page, pageSize, sortBy, sortOrder, industry, size, search)
- Update `listDeals` controller to accept query params (page, pageSize, sortBy, sortOrder, stage, search)
- Add `meta` object to all list responses (page, pageSize, totalCount, totalPages)
- Add relation includes to people list (org name, owner name)
- Add people count to orgs list
- Add relation includes to deals list (org, person, owner names)
- Update Zod validators for query param validation
- Update route handlers to pass query params to controllers

**1.2 Backend — Bulk Delete**

- Add `DELETE /people/bulk` route + controller
- Add `DELETE /orgs/bulk` route + controller
- Add Zod validators for bulk delete

**1.3 Frontend — Shared DataTable Component**

- Create `apps/web/components/shared/data-table.tsx`
- Generic `DataTable<TData>` props:
  - `columns: ColumnDef<TData>[]`
  - `data: TData[]`
  - `pageCount: number`
  - `pageIndex: number`
  - `pageSize: number`
  - `onPaginationChange: (pagination: PaginationState) => void`
  - `onSortingChange: (sorting: SortingState) => void`
  - `onColumnFiltersChange: (filters: ColumnFiltersState) => void`
  - `searchPlaceholder?: string`
  - `filterConfig?: FilterConfig[]` (defines which columns get filter dropdowns and their options)
  - `onSearchChange: (search: string) => void`
  - `isLoading?: boolean`
  - `enableRowSelection?: boolean`
  - `onRowClick?: (row: TData) => void`
- Internal toolbar: search input + filter dropdowns (from filterConfig) + column visibility toggle
- Footer pagination using existing shadcn Pagination component
- Loading state (Skeleton rows), Empty state (EmptyState component), Error state (ErrorState component)
- Checkbox column for row selection
- Actions column for dropdown menu

**1.4 Frontend — Shared EntitySheet Component**

- Create `apps/web/components/shared/entity-sheet.tsx`
- Props:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `title: string`
  - `description?: string`
  - `mode: "view" | "edit" | "create"`
  - `isLoading?: boolean`
  - `children: React.ReactNode` (the form fields or view content)
  - `onEdit?: () => void`
  - `onSave?: () => void`
  - `onDelete?: () => void`
- View mode: read-only fields, Edit button in header
- Edit/Create mode: editable form fields, Save/Cancel buttons
- Uses shadcn `Sheet` component (already in packages/ui)

**1.5 Frontend — Install ReUI Kanban**

- Run `pnpm dlx shadcn@latest add @reui/kanban` in `apps/web`
- Verify it installs to `apps/web/components/reui/kanban.tsx` (or appropriate path based on shadcn config)

**1.6 Frontend — Services**

- Create `apps/web/services/crm/people.service.ts`
- Create `apps/web/services/crm/orgs.service.ts`
- Create `apps/web/services/crm/deals.service.ts`
- Each service: list (with params), get, create, update, delete, bulkDelete

**1.7 Frontend — Query Keys + Hooks**

- Update `apps/web/lib/query-keys.ts` with CRM keys
- Create `apps/web/hooks/queries/use-people.ts`
- Create `apps/web/hooks/queries/use-orgs.ts`
- Create `apps/web/hooks/queries/use-deals.ts`
- Each hook file: list query hook (with pagination params), detail query hook, create/update/delete/bulkDelete mutation hooks

### Phase 2: People Page

**2.1 Column Definitions**

- Create `apps/web/components/crm/people/people-columns.tsx`
- TanStack Table `ColumnDef<Person>[]` for all People columns
- Name column: clickable cell (opens drawer)
- Status column: Badge with color variants
- Actions column: DropdownMenu with View/Edit/Delete

**2.2 Filter Config**

- Create `apps/web/components/crm/people/people-filters.tsx`
- Define filter options for Status, Source, Owner selects

**2.3 People Drawer**

- Create `apps/web/components/crm/people/people-drawer.tsx`
- EntitySheet with person form fields (name, email, phone, jobTitle, status, source, orgId select, ownerId select)
- View mode: read-only display
- Edit mode: react-hook-form + Zod validation
- Create mode: empty form

**2.4 People Data Table**

- Create `apps/web/components/crm/people/people-data-table.tsx`
- Wire DataTable + usePeople hook + column defs + filter config

**2.5 People Page**

- Update `apps/web/app/(crm)/people/page.tsx`
- Replace stub with PeopleDataTable
- Add "Add Person" button in PageHeader actions
- Handle drawer open/close state

### Phase 3: Organizations Page

**3.1–3.5** — Mirror Phase 2 pattern for Organizations entity

### Phase 4: Deals Kanban Page

**4.1 Deal Card Component**

- Create `apps/web/components/crm/deals/deal-card.tsx`
- Displays: title, value+currency, person/org names, owner, close date
- Clickable (opens drawer)

**4.2 Deal Drawer**

- Create `apps/web/components/crm/deals/deal-drawer.tsx`
- EntitySheet with deal form fields (title, value, currency, stage, personId, orgId, ownerId, closeDate)

**4.3 Deal Kanban Board**

- Create `apps/web/components/crm/deals/deal-kanban.tsx`
- Uses ReUI Kanban components
- `value` = deals grouped by stage
- `onValueChange` = optimistic update + `useUpdateDeal` mutation
- `onItemClick` = open drawer
- Validate stage enum order: new → contacted → demo → proposal → won → lost

**4.4 Deals Page**

- Update `apps/web/app/(crm)/deals/page.tsx`
- Replace stub with DealKanban
- Remove board/list ToggleGroup (kanban only)
- Add "Add Deal" button in PageHeader

### Phase 5: Polish & Integration

- Remove Import CSV buttons from all pages (deferred)
- Add "Delete selected" bulk action to People and Orgs table toolbars (appears when rows selected)
- Ensure all error states, loading states, and empty states are wired up
- Test optimistic update rollback on failed deal stage changes
- Test pagination, sorting, and filtering across all tables
- Verify drawer view/edit/create flows for all entities
- Ensure query invalidation works correctly after mutations (list queries refresh after create/update/delete)

---

## Key Component Interfaces

### DataTable<TData>

```tsx
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: (pagination: PaginationState) => void;
  onSortingChange: (sorting: SortingState) => void;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  searchPlaceholder?: string;
  onSearchChange: (search: string) => void;
  filterConfig?: FilterConfig[];
  enableRowSelection?: boolean;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}
```

### EntitySheet

```tsx
interface EntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  mode: "view" | "edit" | "create";
  isLoading?: boolean;
  children: React.ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
}
```

### Service Function Pattern

```tsx
// services/crm/people.service.ts
interface PeopleListParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
}

async function listPeople(
  params: PeopleListParams,
): Promise<{ people: Person[]; meta: PaginationMeta }>;
async function getPerson(id: string): Promise<Person>;
async function createPerson(data: CreatePerson): Promise<Person>;
async function updatePerson(id: string, data: UpdatePerson): Promise<Person>;
async function deletePerson(id: string): Promise<void>;
async function bulkDeletePeople(ids: string[]): Promise<{ deleted: number }>;
```

### Hook Pattern

```tsx
// hooks/queries/use-people.ts
function usePeople(params: PeopleListParams); // useQuery with [PEOPLE_LIST, params]
function usePerson(id: string); // useQuery with [PEOPLE_DETAIL, id]
function useCreatePerson(); // useMutation + invalidate [PEOPLE, PEOPLE_LIST]
function useUpdatePerson(); // useMutation + invalidate [PEOPLE, PEOPLE_LIST, PEOPLE_DETAIL, id]
function useDeletePerson(); // useMutation + invalidate [PEOPLE]
function useBulkDeletePeople(); // useMutation + invalidate [PEOPLE]
```

---

## Dependencies to Install

```bash
# In apps/web
pnpm dlx shadcn@latest add @reui/kanban
```

Note: `@tanstack/react-table` is already installed. `@dnd-kit` packages can be removed since ReUI Kanban handles DnD internally.

---

## Import CSV — Deferred

The "Import CSV" buttons should be removed from initial build. This feature will be added later with:

- File upload modal
- Column mapping step
- Batch creation endpoint
- Error reporting for failed rows
