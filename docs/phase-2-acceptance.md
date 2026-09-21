# Phase 2 Acceptance Checklist

## Automated

- `npm run build`
- `npx prisma validate`
- `npx tsc --noEmit` (when dependencies are installed)

## Manual

1. Open `/` without a session; expect `/login`.
2. Login with a seeded development user; expect `/admin`.
3. Verify the sidebar on `/admin/students`, `/admin/parents`, `/admin/classes`, `/admin/users`, and `/admin/spp`.
4. Create a student with multiple guardians and verify one primary guardian.
5. Reuse an existing parent and verify no duplicate parent is created.
6. Try a duplicate phone number and use the existing-parent conflict workflow.
7. Search/filter students by name, NIS, class, and status.
8. Create, edit, and deactivate a class. A class with students must not be hard-deleted.
9. Verify SPP search debounce and current month/year defaults.
10. Logout and verify protected admin routes redirect to `/login`.

## Requires DATABASE_URL

- Prisma migration/deploy.
- Seed execution.
- Login against the seeded database.
- Student/guardian transaction verification.
- Parent duplicate verification.
- Class mutation and AuditLog verification.
- SPP payment regression verification.

Never run `prisma migrate reset` against Neon or production.
