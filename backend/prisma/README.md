# Legacy Prisma Artifacts

The backend runtime uses `pg` models and `node-pg-migrate` migrations. These Prisma files are retained only as historical reference and are not part of production schema ownership.

Production schema changes should be added under `backend/migrations/` and applied with `npm run migrate:up`.
