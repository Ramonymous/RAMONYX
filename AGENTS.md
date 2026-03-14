# AGENTS.md — RAMONYX Project Guide for AI Agents

> This file is intended for AI coding agents (e.g., Claude Code, GitHub Copilot, Cursor, Windsurf).
> It describes the project structure, conventions, domain rules, and data model decisions.
> Read this fully before making any feature, schema, or UI decisions.

---

## Project Overview

**RAMONYX** is a **Manufacturing Execution System (MES)** built on top of the
[FastAPI Full-Stack Template](https://github.com/fastapi/full-stack-fastapi-template).

It manages the full production lifecycle of a manufacturing plant — from raw material receiving,
through stamping/welding production orders, quality control, to final delivery.

Stack: Python/FastAPI · PostgreSQL · React 19/TypeScript · Docker Compose · Traefik · GitHub Actions

---

## MES Domain Knowledge

> Domain accuracy matters. Read before touching any model, route, or UI.

### Industry
Manufacturing plant with two main production processes: **Stamping/Blanking** and **Welding/Assembly**.

### User Roles

| Role | Description |
|---|---|
| `ADMIN` | Full system access, user management |
| `MANAGER` | Read access across all modules, approvals |
| `PLANNER` | Creates and manages Production Orders |
| `MPC_RM` | Material Planning & Control — Raw Material |
| `MPC_HW` | Material Planning & Control — Hardware / Standard Part |
| `LINE_STORE` | Manages Single Part inventory |
| `DELIVERY` | Manages outbound Finish Good delivery |
| `QC` | Quality Control — scan lot to confirm |
| `STAMPING` | Stamping/Blanking line — inputs achievement |
| `WELDING` | Welding/Assembly line — inputs achievement |

### Product Categories

| Category | Code | Description |
|---|---|---|
| Raw Material | `RM` | Base materials from supplier (steel coil, sheet, etc.) |
| Standard Part | `SP` | Hardware/purchased components (bolts, brackets, etc.) |
| Single Part | `WIP` | Work-in-progress parts produced by Stamping |
| Finish Good | `FG` | Final assembled products, ready for delivery |

---

## Production Flow

```
[SUPPLIER]
    │
    ▼
RECEIVE RAW MATERIAL (MPC_RM)          → generates LOT-RM
    │
    ▼
PRODUCTION ORDER — STAMPING (PLANNER)  → planner picks a PROCESS, not a product
    │
    ▼
ISSUE RAW MATERIAL → Stamping (MPC_RM) → consumes LOT-RM
    │
    ▼
STAMPING ACHIEVEMENT (STAMPING)        → generates LOT-STP
    │
    ├── Finish Good? ──► QC SCAN → PC STORE (LINE_STORE) → DELIVERY
    │
    └── Single Part? ──► QC SCAN → LINE STORE (LINE_STORE)
                                          │
                                          ▼
                              PRODUCTION ORDER — WELDING (PLANNER)
                                          │
                                          ▼
                              ISSUE STANDARD PART (MPC_HW)    → consumes LOT-HW
                              ISSUE SINGLE PART (LINE_STORE)  → consumes LOT-SP / LOT-STP
                                          │
                                          ▼
                              WELDING / ASSEMBLY (WELDING)    → generates LOT-WELD
                                          │
                                          ▼
                                    QC SCAN CONFIRM (QC)
                                          │
                                          ▼
                                    PC STORE (LINE_STORE)
                                          │
                                          ▼
                                      DELIVERY (DELIVERY)
```

---

## Process & Separating

Planners select a **Process**, not a product directly. A process defines inputs and outputs.

```python
# A process can have 1 input → 2 outputs (separating)
# Example: process "767"
#   input:  767-RM  (qty 1)
#   output: 767e6   (qty 1, is_primary=True)
#           767e7   (qty 1, is_primary=False)
```

**Separating rule**: 1 RM → 2 Finish Goods via 1 process. ISSUE is done once for the whole
process (not per output). The system creates **2 separate PO lines** (one per output) so that
achievement, repair, and QC can be tracked independently — e.g. 767e6 may be all OK while
767e7 has repair items.

### Data Models (Process)

```python
class Process(SQLModel, table=True):
    code: str = Field(primary_key=True)
    name: str
    type: str           # "STAMPING" | "WELDING" | "SEPARATING"
    description: str = ""

class ProcessInput(SQLModel, table=True):
    process_code: str = Field(foreign_key="process.code", primary_key=True)
    product_code: str = Field(foreign_key="product.code", primary_key=True)
    qty: int = 1

class ProcessOutput(SQLModel, table=True):
    process_code: str = Field(foreign_key="process.code", primary_key=True)
    product_code: str = Field(foreign_key="product.code", primary_key=True)
    qty: int = 1
    is_primary: bool = True     # False = by-product / secondary output
```

---

## Inventory Transactions

Each role handles specific transaction types on specific product categories only:

| Role | Transactions | Product Category |
|---|---|---|
| `MPC_RM` | RECEIVE, ISSUE, RETURN | Raw Material only |
| `MPC_HW` | RECEIVE, ISSUE, RETURN | Standard Part only |
| `LINE_STORE` | RECEIVE, ISSUE, RETURN | Single Part only |
| `DELIVERY` | RECEIVE, ISSUE, RETURN | Single Part / Finish Good |

> **Rule**: Enforce at API level. Never allow a role to transact outside their category.
> Frontend role guards are UX only — backend must validate.

### RECEIVE Form Structure

Both MPC_RM and MPC_HW RECEIVE share the same structure:

```
Header  : timestamp (auto) | supplier name (input)
Detail  : select product | input qty | input supplier lot number
Actions : Review → Confirm → Print Label
          Edit (only before Confirm) | Cancel (generates reversal) | Reprint Label
```

### Transaction Status

Transactions follow: `DRAFT → CONFIRMED → CANCELLED`

- Edit is only allowed in `DRAFT`
- Cancel on a `CONFIRMED` transaction generates a **reversal transaction** — never hard delete
- Reprint is allowed at any status except `CANCELLED`

### Key Business Rules

- A **Production Order** must exist and be open before any ISSUE transaction
- QC confirmation is **mandatory** before any lot moves to the next stage
- RETURN must reference the original ISSUE transaction
- Finish Goods can bypass Line Store and go directly to PC Store / Delivery
- Stock must never go negative — validate before every ISSUE
- Every transaction must record `created_at` timestamp and `created_by` user (traceability)

---

## Lot System

### Lot Number Format

```
LOT-{PREFIX}-{DDMMYY}-{SEQUENCE}
Example: LOT-RM-140326-0001
```

| Prefix | Generated when | Example |
|---|---|---|
| `RM` | MPC_RM confirms RECEIVE | `LOT-RM-140326-0001` |
| `HW` | MPC_HW confirms RECEIVE | `LOT-HW-140326-0001` |
| `SP` | Line Store RECEIVE from vendor | `LOT-SP-140326-0001` |
| `STP` | Stamping achievement confirmed | `LOT-STP-140326-0001` |
| `WELD` | Welding achievement confirmed | `LOT-WELD-140326-0001` |

**Sequence rules**:
- Sequence is **per prefix per day** — resets every day, independent between prefixes
- `LOT-RM-140326-0001` and `LOT-HW-140326-0001` can coexist — different sequence counters
- Uniqueness: `prefix + date + sequence`

### Lot Sequence Counter Table

```python
class LotSequence(SQLModel, table=True):
    prefix: str     # "RM" | "HW" | "SP" | "STP" | "WELD"  (composite PK)
    date: date      # 2026-03-14                              (composite PK)
    last_seq: int   # auto-incremented per prefix per day
```

### Lot Data Model

```python
class Lot(SQLModel, table=True):
    id: str = Field(primary_key=True)       # LOT-STP-140326-0001
    prefix: str                              # RM | HW | SP | STP | WELD
    product_code: str = Field(foreign_key="product.code")

    qty_ok: int                              # printable qty
    qty_repair: int = 0                      # if > 0, print is BLOCKED
    qty_ng: int = 0                          # recorded only, no label generated

    repair_status: str = "NONE"             # NONE | PENDING | DONE

    supplier_lot: str | None = None         # only for RM and HW lots
    parent_lot_ids: list[str] = []          # for backward traceability (FG → RM)

    transaction_id: str                      # FK to originating transaction
    created_at: datetime
    created_by: str                          # FK to user

    printed_at: datetime | None = None
    printed_by: str | None = None
    label_count: int = 0                     # reprint counter
```

---

## Achievement & Repair Flow

### Input Fields

```
qty_ok + qty_repair + qty_ng = total_achievement
```

### Label Generation Rules

| Condition | Label |
|---|---|
| `qty_ng > 0` | NO label generated — operator writes manually, system records only |
| `qty_ok > 0` AND `qty_repair == 0` | Print label immediately |
| `qty_ok > 0` AND `qty_repair > 0` | BLOCKED — show warning: "There are {n} items pending repair. Cannot print label yet." |
| After repair done (`qty_repair → 0`) | Print allowed — **same lot number**, qty updated to final `qty_ok` |

### Repair Flow

```
Achievement submitted (qty_repair > 0)
    │
    ▼
Lot status: PENDING_REPAIR → print BLOCKED
    │
    ▼
Repair completed → operator updates qty_ok, qty_repair = 0
    │
    ▼
Lot status: READY → print ALLOWED
    │
    ▼
Print label → same LOT-STP-XXXXXX-XXXX, qty = final qty_ok
```

> Only the STAMPING/WELDING role (and ADMIN) can mark repair as done and trigger print.
> Same rule applies to Welding achievement.

---

## Label & QR Code

- **Format**: QR Code
- **Content**: internal lot number only (e.g. `LOT-STP-140326-0001`)
- **Output**: PDF (for now — thermal printer integration later)
- **Label fields**: item code, item name, qty_ok, lot number, timestamp, operator name
- **NG items**: no system label — manual writing only

### QC Flow

QC does not fill forms — they only **scan the QR code** on the label.
Scanning confirms the lot as QC-passed and moves it to the next stage.

---

## Line Store — Receive Logic

Line Store can receive parts from two sources:

| Source | Flow |
|---|---|
| From Stamping (internal) | Scan QR on LOT-STP label → auto-receive, no data entry |
| From Vendor (external) | Manual entry: select item + qty → generate LOT-SP (no supplier lot required) |

After receive:
- If part is **Finish Good** → goes directly to PC Store (Delivery)
- If part is **Single Part** → stays in Line Store, waits for Welding PO ISSUE

---

## Traceability

**Direction: Backward only** — from a Finish Good lot, trace back to the source Raw Material lot.

Each lot stores `parent_lot_ids` pointing to the lots it was created from (consumed during ISSUE).

```
LOT-WELD-140326-0001
    └── parent: LOT-SP-130326-0005, LOT-HW-120326-0002
                    └── LOT-SP parent: LOT-STP-120326-0003
                                           └── LOT-STP parent: LOT-RM-100326-0001
                                                                    └── supplier_lot: "SUP-XYZ-001"
```

Traceability query: given a FG lot ID, recursively follow `parent_lot_ids` until reaching RM lots.

---

## Repository Structure

```
RAMONYX/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py         # SQLModel ORM — source of truth for DB schema
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── crud.py           # DB operations
│   │   ├── api/routes/       # One file per resource
│   │   └── core/
│   │       ├── config.py
│   │       ├── db.py
│   │       └── security.py
│   ├── alembic/versions/     # Migration chain — never reorder or delete
│   ├── tests/
│   └── pyproject.toml        # uv managed
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── routes/           # TanStack Router (file-based)
│   │   ├── components/
│   │   ├── client/           # AUTO-GENERATED — DO NOT EDIT
│   │   └── hooks/
│   ├── tests/                # Playwright E2E
│   └── package.json          # Bun managed
│
├── scripts/generate-client.sh
├── compose.yml
├── compose.override.yml
├── .env                      # DO NOT COMMIT secrets
└── .pre-commit-config.yaml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLModel, Pydantic, Alembic |
| Database | PostgreSQL |
| Auth | JWT, Argon2 password hashing |
| Frontend | React 19, TypeScript, Vite, TanStack Router, TanStack Query |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| API Client | Auto-generated from OpenAPI spec |
| Testing | Pytest (backend), Playwright (E2E) |
| Dev Tools | Docker Compose, Traefik, Mailcatcher, Adminer |
| CI/CD | GitHub Actions |
| Package Mgr | uv (Python), Bun (Node) |

---

## Local Development

> ⚠️ Frontend runs **outside Docker** for fast hot-reload.

```bash
# Terminal 1 — backend stack
docker compose watch

# Terminal 2 — frontend
cd frontend && bun run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Adminer (DB) | http://localhost:8080 |
| Traefik UI | http://localhost:8090 |
| Mailcatcher | http://localhost:1080 |

```bash
docker compose logs -f backend
docker compose exec backend bash scripts/tests-start.sh
```

---

## Backend Conventions

### Adding a new resource

1. Model → `models.py`
2. Schema → `schemas.py`
3. CRUD → `crud.py`
4. Routes → `api/routes/{resource}.py`, register in `api/main.py`
5. Migration:
```bash
docker compose exec backend alembic revision --autogenerate -m "add {resource} table"
docker compose exec backend alembic upgrade head
```

### RBAC Rules
- Enforce role checks at the API level using `Depends(get_current_user)`
- Valid role values: `ADMIN` `MANAGER` `PLANNER` `MPC_RM` `MPC_HW` `LINE_STORE` `DELIVERY` `QC` `STAMPING` `WELDING`
- Frontend role guards are UX only — never the security boundary

### Key Rules
- SQLModel for all DB models
- Schemas and models are separate — never return a DB model directly from an endpoint
- All routes prefixed `/api/v1/`
- No hardcoded secrets — use `core/config.py`

---

## Frontend Conventions

- Never edit `src/client/` — regenerate after backend changes:
  ```bash
  bash scripts/generate-client.sh
  ```
- Routes in `src/routes/` (TanStack Router file-based)
- Data fetching via TanStack Query
- New shadcn components: `bunx shadcn-ui@latest add <component>`
- Read role from `useAuth()` hook — hide irrelevant menu items per role

### UI Design System (approved — do not restyle without instruction)

**Reference**: Siemens Opcenter — industrial MES control panel

| Token | Value |
|---|---|
| Base bg (dark) | Near-black navy (`#0a0e1a` range) |
| Accent | Steel/electric blue (`#00aaff` range) |
| Base bg (light) | Steel gray (`#f0f2f5`) — not white |
| Corner radius | `rounded-sm` / `rounded-none` only |
| Borders | Thin low-opacity — no decorative shadows |
| Gradients | None |
| Icons | Lucide, `size-4` max, `strokeWidth={1.5}` |
| Numbers/IDs | `font-mono` |
| Labels | `uppercase tracking-wider text-xs` |

**Stable — do not restyle**: `_layout.tsx`, `index.tsx`, `items.tsx`, `DataTable.tsx`, `index.css`

---

## Database Migrations

```bash
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic downgrade -1
```

> ⚠️ Never delete or reorder files in `alembic/versions/`

---

## Environment Variables

```dotenv
SECRET_KEY=changethis
FIRST_SUPERUSER_PASSWORD=changethis
POSTGRES_PASSWORD=changethis
```

Generate secret: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

---

## Upstream Sync

```bash
git pull --no-commit upstream master
# resolve conflicts
git merge --continue
```

> ⚠️ Most likely conflicts: `models.py`, `crud.py`, `alembic/versions/`, `compose.yml`

---

## Known Gotchas

- Frontend runs outside Docker — `docker compose stop frontend` then `bun run dev`
- `src/client/` is auto-generated — never edit manually
- Migration files are chained — never reorder or delete
- Role enforcement at API level — frontend guards are UX only
- Stock cannot go negative — validate before every ISSUE
- Production Order required before any ISSUE transaction
- Lot print is BLOCKED if `qty_repair > 0` — warn the user explicitly
- NG items are recorded in the system but no label is generated

---

## What AI Agents Should Know

- This is a **real factory MES** — every decision must make operational sense on a factory floor
- **Role-based access is core** — always ask "which roles can see or do this?" for every new feature
- **Lot traceability is backward** — FG → WIP → RM, via `parent_lot_ids` chain
- **Lot number is immutable** after creation — only qty fields update (after repair)
- **NG items never get labels** — system records qty_ng for reporting only
- Do not redesign the UI without explicit instruction — design system is approved and documented above
- Do not edit `alembic/versions/` directly — always use autogenerate
- Do not edit `src/client/` — always regenerate from OpenAPI spec

---

*Last updated: March 2026*