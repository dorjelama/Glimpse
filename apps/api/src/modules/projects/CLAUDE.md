# CLAUDE.md — projects module (backend)

## What this module does
Manages invitation project CRUD. A project is the top-level document: it holds canvas settings and a one-to-many relationship to `Element` rows. All canvas state is persisted here via Prisma.

## Key files
| File | Purpose |
|------|---------|
| `projects.module.ts` | NestJS module; imports PrismaModule explicitly (also @Global) |
| `projects.controller.ts` | REST endpoints — all handlers return Promises, NestJS awaits them |
| `projects.service.ts` | Business logic; all methods `async`, uses `PrismaService` |
| `entities/project.entity.ts` | TypeScript interfaces (`Project`, `BaseElement`, `CanvasSettings`) — domain types, not Prisma types |
| `dto/create-project.dto.ts` | Validated input for POST /projects |
| `dto/update-project.dto.ts` | Validated input for PATCH /projects/:id |

## Data model (Prisma)
```prisma
model Project {
  id            String        @id          // "inv_<12char>"
  title         String
  status        ProjectStatus @default(draft)
  slug          String?       @unique      // set on publish
  canvasWidth   Int           @default(1080)
  canvasHeight  Int           @default(1920)
  canvasBgColor String        @default("#ffffff")
  canvasBgImage String?
  owner         User?         @relation(...)
  ownerId       String?
  elements      Element[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

## Mapper
`toProject(p: PrismaProject): Project` converts Prisma rows to the domain `Project` type. Canvas columns are re-shaped into the `canvas: CanvasSettings` object the frontend expects.

## API endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/projects | Create blank project |
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get single project with elements |
| PATCH | /api/projects/:id | Update title, canvas, or full elements array |
| DELETE | /api/projects/:id | Delete project (elements cascade) |
| POST | /api/projects/:id/publish | Set status=published, generate slug |
| POST | /api/projects/:id/unpublish | Revert to draft |

## Element bulk-replace
When `PATCH /projects/:id` includes an `elements` array, a Prisma `$transaction` deletes all existing elements then `createMany`s the new set. This is how the frontend auto-save syncs the full canvas state.
