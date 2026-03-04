---
description: Add a new domain feature (backend API + frontend hook + UI)
argument-hint: feature-name
allowed-tools: Bash, Read, Write, Edit
---

Add a new feature called: $ARGUMENTS

Follow the existing pattern:
1. Backend model: @backend/src/models/goal.ts
2. Backend service: @backend/src/services/goal.ts
3. Backend controller: @backend/src/controllers/goal.ts
4. Frontend hook: @frontend/src/hooks/useGoals.ts
5. Add route in backend/src/routes/index.ts
6. Create frontend page or add to existing page

Use the same patterns (asyncHandler, sendJson/sendError, React Query).
Run typecheck after changes.
