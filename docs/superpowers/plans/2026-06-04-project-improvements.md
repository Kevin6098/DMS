# Project Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the recommended DMS project improvements across tests, logging, file security, migrations, permission-aware UI, UX polish, and dependencies.

**Architecture:** Keep changes incremental and compatible with the current Express/MySQL and CRA frontend. Add small backend utilities for logging, upload policy, and migrations instead of refactoring the whole app. Update tests to lock in behavior before feature code where practical.

**Tech Stack:** Express, MySQL, Jest, React, TypeScript, CRA, npm.

---

### Task 1: Stabilize Frontend Tests

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/__tests__/integration.test.tsx`
- Modify: `frontend/src/components/__tests__/Dashboard.test.tsx`
- Modify: `frontend/src/components/__tests__/AdminPanel.test.tsx`

- [ ] Remove double-router wrappers around `<App />`.
- [ ] Replace stale CRA and pre-refactor assertions with current DMS UI assertions.
- [ ] Keep service mocks aligned with current response shapes.
- [ ] Run `npm test -- --watchAll=false` in `frontend`.

### Task 2: Logging Cleanup

**Files:**
- Create: `backend/utils/logger.js`
- Modify: `backend/server.js`
- Modify: `backend/routes/files.js`
- Modify: `frontend/src/components/Login.tsx`

- [ ] Add environment-aware logger with redaction helpers.
- [ ] Replace production debug `console.log` calls in auth/file paths.
- [ ] Keep validation errors user-visible without printing credentials or tokens.
- [ ] Run backend tests and frontend login tests.

### Task 3: Upload Security

**Files:**
- Create: `backend/utils/fileSecurity.js`
- Test: `backend/tests/file-security.test.js`
- Modify: `backend/routes/files.js`

- [ ] Add extension plus MIME allow-list validation.
- [ ] Add per-organization upload policy lookup with fallback environment config.
- [ ] Add malware scan hook command support that fails closed on scanner failure.
- [ ] Run backend unit tests.

### Task 4: Migration Scaffold

**Files:**
- Create: `backend/migrations/001_add_upload_policy_fields.sql`
- Create: `backend/scripts/run-migrations.js`
- Modify: `backend/package.json`
- Modify: `backend/README.md`

- [ ] Add migration table bootstrap.
- [ ] Add idempotent migration runner.
- [ ] Add organization upload policy fields.
- [ ] Add `npm run migrate` script.

### Task 5: Permission-Aware UI and UX Polish

**Files:**
- Modify: `frontend/src/services/fileService.ts`
- Modify: `frontend/src/contexts/FileContext.tsx`
- Modify: `frontend/src/components/Dashboard.tsx`
- Modify: `frontend/src/components/FilePreviewModal.tsx`

- [ ] Add permission helpers for owner/admin/shared edit/view modes.
- [ ] Hide rename/move/delete/share actions when the user cannot perform them.
- [ ] Add clearer destructive confirmations for trash and permanent delete.
- [ ] Improve unsupported preview fallback messaging.

### Task 6: Dependencies

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] Query safe available versions for vulnerable direct dependencies.
- [ ] Upgrade compatible patch/minor dependencies first.
- [ ] Avoid high-risk framework migrations unless tests remain green.
- [ ] Run build, unit tests, and `npm audit --omit=dev`.
