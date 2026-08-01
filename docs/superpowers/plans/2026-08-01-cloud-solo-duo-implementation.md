# Cloud Solo and Duo Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the local two-profile application into a GitHub-whitelisted cloud application that supports solo preparation and synchronized two-device pair sessions, with optional voice recording.

**Architecture:** Keep Vite/GitHub Pages and static study content. Add Supabase Auth, Postgres, Realtime, Edge Functions, and private Storage behind focused gateways; retain Dexie as the local cache and migration source. Postgres plus RLS is authoritative for admission and shared data, while Realtime only signals persisted state changes.

**Tech Stack:** React 19, TypeScript strict, Vite 7, Dexie 4, Supabase JS/Auth/Postgres/Realtime/Storage, Zod 4, MediaRecorder, Vitest, React Testing Library, Playwright, GitHub Actions.

## Global Constraints

- GitHub OAuth authentication never grants access without an active whitelist row for the immutable GitHub user ID.
- All exposed Supabase tables and private Storage objects use RLS; UI checks never replace server authorization.
- Only publishable Supabase configuration is shipped to the browser; OAuth and service-role secrets stay outside Git.
- Static content remains public on GitHub Pages and continues to contain exactly the official 43 topics.
- The application supports a user with no pair and at most one active two-person pair.
- Audio recording is optional, local by default, explicitly uploaded, limited to 5 minutes and 15 MB, and expires after 14 days.
- No WebRTC call, speech recognition, AI scoring, public rankings, streak penalties, or mandatory daily activity.
- TypeScript remains strict with `exactOptionalPropertyTypes`; no application `any`.
- Use Latin `YSTU`/`ystu` branding and identifiers; preserve Russian official name `ЯГТУ` in Russian-language source descriptions.
- Each task ends with relevant tests and one conventional commit.

---

### Task 1: YSTU branding and local-storage compatibility

**Files:**

- Use `src/storage/dexie/YstuDatabase.ts`.
- Use `public/source/ystu-programme-1.2.2-2026.pdf`.
- Modify: `package.json`, `package-lock.json`, `README.md`, `vite.config.ts`, `src/pages/AboutPage.tsx`, `src/pages/BackupPage.tsx`, `src/storage/dexie/DexieStudyRepository.ts`
- Update historical specs/plans to the current branding.
- Test: `src/storage/dexie/YstuDatabase.test.ts`

**Interfaces:**

- Produces: `YstuDatabase`, default database name `ystu-interview-prep`.
- Compatibility: import records once from legacy `yagtu-interview-prep` before using the new database.

- [ ] Add a fake-indexeddb test that writes two profiles to the legacy database, initializes `YstuDatabase`, and expects both profiles in the new database.
- [ ] Run `npm run test:run -- src/storage/dexie/YstuDatabase.test.ts` and confirm it fails because migration does not exist.
- [ ] Implement `migrateLegacyYagtuDatabase()` with Dexie table reads and idempotent `bulkPut`; do not delete the legacy database.
- [ ] Rename branding, package name, backup filename, source PDF path, and imports; verify only migration compatibility uses remain.
- [ ] Run `npm run verify` and `npm run e2e:chromium`.
- [ ] Commit the branding refactor.

### Task 2: Supabase schema, whitelist, and security policies

**Files:**

- Create: `supabase/config.toml`
- Create: `supabase/migrations/202608010001_cloud_foundation.sql`
- Create: `supabase/tests/access_rls.test.sql`
- Create: `src/shared/config/runtimeConfig.ts`
- Modify: `src/vite-env.d.ts`, `.env.example`, `.gitignore`, `package.json`

**Interfaces:**

- Produces: `RuntimeConfig { supabaseUrl: string; supabasePublishableKey: string } | null` from `readRuntimeConfig(import.meta.env)`.
- SQL produces `access_entries`, `app_users`, `pairs`, `pair_members`, `pair_invites`, cloud progress/attempt/session tables, `live_pair_sessions`, `audio_recordings`, and `admin_audit_log`.
- SQL produces `is_allowed()`, `is_admin()`, `shares_pair(uuid)`, and guarded RPC functions.

- [ ] Add Vitest cases for complete configuration, missing configuration, and whitespace values.
- [ ] Run the config test and confirm failure before adding `runtimeConfig.ts`.
- [ ] Add `@supabase/supabase-js`; add `supabase:start`, `supabase:stop`, `supabase:reset`, and `test:rls` scripts.
- [ ] Implement schema constraints: immutable GitHub ID uniqueness, one active pair per user, two members maximum, hashed 24-hour invite token, append-only attempt IDs, live-session revision, audio size/duration/expiry checks.
- [ ] Enable RLS on every exposed table and write policies for denied user, owner, partner, and admin.
- [ ] Add pgTAP tests proving anonymous and non-whitelisted users read nothing, members cannot read another pair, partners can read shared rows, and admins alone mutate whitelist.
- [ ] Run local Supabase reset and pgTAP tests.
- [ ] Commit `feat(cloud): add secure Supabase foundation`.

### Task 3: GitHub Auth gate and whitelist administration

**Files:**

- Create: `src/services/auth/AuthGateway.ts`
- Create: `src/services/auth/SupabaseAuthGateway.ts`
- Create: `src/services/supabase/client.ts`
- Create: `src/app/providers/AuthProvider.tsx`
- Create: `src/features/auth/LoginPage.tsx`
- Create: `src/features/auth/AccessDeniedPage.tsx`
- Create: `src/features/admin/AccessAdminPage.tsx`
- Create: `supabase/functions/manage-access/index.ts`
- Modify: `src/app/providers/AppProviders.tsx`, `src/app/routes.tsx`, `src/app/layout/AppShell.tsx`
- Test: `src/app/providers/AuthProvider.test.tsx`, `src/features/admin/AccessAdminPage.test.tsx`

**Interfaces:**

- `AuthGateway.signInWithGitHub(redirectTo: string): Promise<void>`
- `AuthGateway.signOut(): Promise<void>`
- `AuthGateway.getSession(): Promise<AuthSession | null>`
- `AuthGateway.checkAccess(): Promise<AccessDecision>` where decision is `allowed`, `denied`, or `unconfigured`.
- Edge Function accepts `{ action: 'grant' | 'revoke' | 'set-role'; githubLogin: string; role?: 'member' | 'admin' }` and resolves the immutable GitHub ID before mutation.

- [ ] Write provider tests for loading, unconfigured local mode, denied OAuth user, allowed member, and admin navigation.
- [ ] Run tests and confirm the missing provider/gateway failures.
- [ ] Implement a single Supabase client and GitHub OAuth redirect that respects the GitHub Pages base/hash callback.
- [ ] Implement the auth gate so denied sessions sign out and render only the denial page.
- [ ] Implement the admin Edge Function with JWT/admin verification, GitHub `/users/{login}` resolution, service-role mutation, and audit logging.
- [ ] Implement admin UI for grant, revoke, role change, and errors without exposing secrets.
- [ ] Run auth tests, typecheck, lint, and a Playwright login-gate test with a fake gateway.
- [ ] Commit `feat(auth): gate access with GitHub whitelist`.

### Task 4: Cloud repository, outbox, and legacy-profile migration

**Files:**

- Create: `src/repositories/CloudStudyRepository.ts`
- Create: `src/repositories/PairRepository.ts`
- Create: `src/storage/supabase/SupabaseStudyRepository.ts`
- Create: `src/storage/dexie/SyncOutbox.ts`
- Create: `src/storage/sync/SyncingStudyRepository.ts`
- Create: `src/features/migration/LegacyDataMigration.tsx`
- Modify: `src/repositories/StudyRepository.ts`, `src/storage/dexie/YstuDatabase.ts`, `src/app/providers/RepositoryProvider.tsx`, backup schemas
- Test: `src/storage/sync/SyncingStudyRepository.test.ts`, `src/features/migration/LegacyDataMigration.test.tsx`

**Interfaces:**

- `SyncingStudyRepository` implements `StudyRepository`; mutations write locally then enqueue `SyncOperation { id; entity; entityId; operation; payload; createdAt }`.
- `flushOutbox(): Promise<SyncSummary>` is idempotent and removes only acknowledged operations.
- `migrateLegacyProfile(localProfileId: string, userId: string): Promise<MigrationPreview>` never deletes local data.

- [ ] Add behavior tests for local-first writes, offline queue retention, successful retry, duplicate retry idempotency, and remote revocation winning over local state.
- [ ] Run sync tests and confirm failure before implementation.
- [ ] Add Dexie schema version 2 for outbox, sync metadata, and authenticated user binding.
- [ ] Implement Supabase mappings and composite repository without importing Supabase from features/components.
- [ ] Implement migration preview that selects exactly one legacy profile and keeps the second pending until a real partner accepts.
- [ ] Add JSON backup version migration while retaining version 1 import.
- [ ] Run repository, migration, backup, and full verification suites.
- [ ] Commit `feat(sync): synchronize personal progress across devices`.

### Task 5: Solo-first dashboard and oral recording

**Files:**

- Create: `src/features/audio/AudioRecorder.ts`
- Create: `src/features/audio/useAudioRecorder.ts`
- Create: `src/features/audio/AudioPlayback.tsx`
- Create: `src/features/oral-exam/SoloOralSession.tsx`
- Modify: `src/pages/DashboardPage.tsx`, `src/pages/OralExamPage.tsx`, `src/shared/styles/global.css`
- Test: `src/features/audio/AudioRecorder.test.ts`, `src/features/oral-exam/SoloOralSession.test.tsx`, `e2e/solo-oral.spec.ts`

**Interfaces:**

- `AudioRecorder.start(): Promise<void>`, `stop(): Promise<RecordedAudio>`, and `discard(): void`.
- `RecordedAudio { blob: Blob; mimeType: string; durationSeconds: number; sizeBytes: number }`.
- Recording rejects durations over 300 seconds or blobs over 15 MB with Russian user-facing errors.

- [ ] Add tests for unsupported MediaRecorder, denied microphone, start/stop, MIME selection, limits, discard, and completing a session without audio.
- [ ] Run tests and confirm expected failures.
- [ ] Implement recorder lifecycle with track cleanup and `MediaRecorder.isTypeSupported`.
- [ ] Rebuild oral flow as prepare → answer/optional recording → playback → reference → checklist → save.
- [ ] Redesign dashboard actions for solo, duo, pending reviews, personal progress, and optional pair progress.
- [ ] Add keyboard/focus/reduced-motion behavior and mobile layout.
- [ ] Run component tests, `npm run verify`, and solo Playwright tests with microphone permission granted/denied.
- [ ] Commit `feat(oral): add solo practice with optional recording`.

### Task 6: Pair invitations and synchronized two-device sessions

**Files:**

- Create: `src/storage/supabase/SupabasePairRepository.ts`
- Create: `src/storage/supabase/SupabaseLiveSessionRepository.ts`
- Create: `src/features/pairs/PairSetup.tsx`
- Create: `src/features/pairs/LivePairSession.tsx`
- Create: `src/features/pairs/usePairPresence.ts`
- Modify: `src/pages/PairSessionPage.tsx`, `src/pages/DashboardPage.tsx`, `src/app/routes.tsx`
- Test: `src/features/pairs/LivePairSession.test.tsx`, `e2e/two-device-pair.spec.ts`

**Interfaces:**

- `PairRepository.createInvite(): Promise<{ url: string; expiresAt: string }>` and `acceptInvite(token: string): Promise<Pair>`.
- `LiveSessionRepository.apply(command: LiveSessionCommand, expectedRevision: number): Promise<LivePairSession>`.
- Commands are `start`, `finish-answer`, `submit-assessment`, `swap-roles`, `next-topic`, and `close`.

- [ ] Add unit tests for invite expiry/single use, maximum pair size, role permissions, stale revisions, reconnect recovery, and atomic assessment plus role rotation.
- [ ] Run tests and confirm missing behavior failures.
- [ ] Implement invite RPCs and pair UI for an unpaired user.
- [ ] Implement persisted live state and private Realtime notifications; use Presence only for online/offline status.
- [ ] Replace the single-device pair page with responder/reviewer views controlled by server state.
- [ ] Add Playwright test using two browser contexts that join, finish an answer, assess, rotate, disconnect, and recover.
- [ ] Run RLS, unit, full verification, and Chromium E2E suites.
- [ ] Commit `feat(pairs): synchronize sessions across two devices`.

### Task 7: Explicit asynchronous audio review

**Files:**

- Create: `src/repositories/AudioRepository.ts`
- Create: `src/storage/supabase/SupabaseAudioRepository.ts`
- Create: `src/features/audio/ShareRecording.tsx`
- Create: `src/features/pairs/PendingReviews.tsx`
- Create: `supabase/functions/delete-expired-audio/index.ts`
- Modify: `src/features/oral-exam/SoloOralSession.tsx`, `src/pages/DashboardPage.tsx`
- Test: `src/features/audio/ShareRecording.test.tsx`, `e2e/async-audio-review.spec.ts`

**Interfaces:**

- `AudioRepository.upload(recording, oralAttemptId, reviewerId): Promise<AudioRecording>` requires an explicit UI action.
- `AudioRepository.getSignedPlaybackUrl(id: string): Promise<string>` checks pair membership through RLS.
- Cleanup deletes Storage objects whose metadata `expires_at <= now()` and marks rows expired.

- [ ] Add tests proving no automatic upload, explicit partner targeting, limits, signed playback access, expiry, and retry after upload failure.
- [ ] Run tests and confirm failures.
- [ ] Implement private bucket policies and audio metadata lifecycle.
- [ ] Implement explicit share confirmation and pending-review dashboard.
- [ ] Implement scheduled cleanup Edge Function and document its Supabase cron setup.
- [ ] Run Storage/RLS integration tests and async-review Playwright scenario.
- [ ] Commit `feat(audio): add private asynchronous partner reviews`.

### Task 8: CI, deployment, operations, and final acceptance

**Files:**

- Modify: `.github/workflows/ci.yml`, `.github/workflows/deploy-pages.yml`, `README.md`, `.env.example`
- Create: `docs/supabase-setup.md`
- Create: `scripts/verify-runtime-config.ts`
- Test: all Vitest, pgTAP, and Playwright suites

**Interfaces:**

- CI fails when required production Supabase variables are absent from the deployment job.
- Deploy injects only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

- [ ] Add runtime-config script tests for missing and valid deployment variables.
- [ ] Update CI to validate TypeScript, lint, content, Vitest, build, migrations/RLS, and Chromium E2E.
- [ ] Update Pages deployment to validate configuration before build and retain `.nojekyll`.
- [ ] Document GitHub OAuth callback, redirect allowlist, first-admin SQL, Edge Function secrets, Storage bucket, cron, GitHub repository secrets, rollback, and access revocation.
- [ ] Run `npm install`, `npm run verify`, local Supabase tests, `npm run e2e:chromium`, and `git diff --check`.
- [ ] Deploy to GitHub Pages, smoke-test allowed and denied GitHub accounts, solo recording, two-device pairing, reconnect, and async review.
- [ ] Commit `chore(deploy): validate cloud production setup` and push `master`.
