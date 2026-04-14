# CLAUDE.md — elements module (backend)

## What this module does
Provides element-level operations (add, update, delete, reorder z-index) on elements within a project. Each operation targets a single `Element` row in Postgres rather than loading the whole project.

## Key files
| File | Purpose |
|------|---------|
| `elements.module.ts` | NestJS module — no imports needed (PrismaModule is @Global) |
| `elements.controller.ts` | REST endpoints under /projects/:projectId/elements |
| `elements.service.ts` | Direct Prisma operations; no longer routes through ProjectsService |
| `dto/create-element.dto.ts` | Validated input for adding a new element |
| `dto/update-element.dto.ts` | Validated partial update input |
| `entities/element.entity.ts` | Re-exports BaseElement from project entity |

## Data model (Prisma)
```prisma
model Element {
  id        String      @id @default(uuid())
  projectId String
  project   Project     @relation(..., onDelete: Cascade)
  type      ElementType  // text | image | shape | button | divider
  x, y, width, height, zIndex  Int
  styles    Json        @default("{}")
  content   String?     // text / button label
  src       String?     // image URL
  alt       String?
}
```

## API endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/projects/:id/elements | Add element (auto-increments zIndex) |
| PATCH | /api/projects/:id/elements/:eid | Update element properties |
| DELETE | /api/projects/:id/elements/:eid | Remove element |
| POST | /api/projects/:id/elements/:eid/reorder/:dir | Change z-order (up/down/top/bottom) |

## Prisma patterns used
- `element.aggregate({ _max: { zIndex: true } })` — find max zIndex for new element
- `element.findFirst({ where: { id, projectId } })` — verify ownership before mutate
- `P2003` error code → NotFoundException (FK violation = project doesn't exist)
- `styles` merge: `{ ...existing.styles, ...dto.styles }` — patch rather than replace

## Notes
- The frontend's primary save path sends the full element array via `PATCH /projects/:id` (bulk replace)
- These individual-element endpoints are available for future fine-grained operations (e.g., collaborative editing)
