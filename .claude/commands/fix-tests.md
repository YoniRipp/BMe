---
description: Run tests and fix failures
argument-hint: test-path (optional)
allowed-tools: Bash, Read, Write, Edit
---

Run tests: !`cd frontend && npx vitest run $ARGUMENTS`

If any fail, read the failing test and the source code it tests.
Fix the root cause (not the test assertions).
Re-run the specific failing test to confirm.
