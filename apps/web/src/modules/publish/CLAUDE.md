# CLAUDE.md — publish module (frontend)

## What this module does
Handles the publish flow from the frontend: saves the latest project state, calls the publish API, displays the generated public URL, and allows copy-to-clipboard sharing.

## Component tree
```
Toolbar → "Publish" button → PublishModal
  PublishModal    ← shows publish CTA or "already published" state with URL
```

## Key files
| File | Purpose |
|------|---------|
| `components/PublishModal.tsx` | Modal: publish/unpublish UI, copy URL button |
| `hooks/usePublish.ts` | Calls saveNow() then publishProject(), stores result |

## API used
- `POST /api/publish/:id` → `{ project, publicUrl }`
- `DELETE /api/publish/:id` → unpublish
- Public viewer: `GET /api/publish/view/:slug`

## Public URL format
`http://localhost:3000/view/{slug}` — served by the Next.js `/view/[slug]` route.

## Notes
- Always saves the project before publishing so the public version reflects the latest state
- Slug is stable; republishing reuses the same slug and URL
