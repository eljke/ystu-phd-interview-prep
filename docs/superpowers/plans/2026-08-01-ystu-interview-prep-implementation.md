# YSTU Interview Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a modern offline-first React application that helps two people prepare for the YSTU 1.2.2 doctoral admission interview using all 43 topics from the approved programme.

**Architecture:** The application is a static Vite SPA using HashRouter. Versioned study content is bundled as typed TypeScript modules, while profiles, attempts, progress, sessions, and settings are stored behind a repository interface implemented with Dexie/IndexedDB. Pure domain modules calculate mastery, review priority, pair readiness, backup merge results, and content audit results; React features consume those modules without importing Dexie directly.

**Tech Stack:** React, TypeScript strict mode, Vite, React Router, Dexie, dexie-react-hooks, Zod, Vitest, React Testing Library, fake-indexeddb, Playwright, vite-plugin-pwa, ESLint, Prettier, npm, GitHub Actions, GitHub Pages.

## Global Constraints

- Use Node.js 22 and npm; commit `package-lock.json`.
- Keep TypeScript `strict: true`; do not use `any` in application code.
- Preserve exactly 43 numbered programme topics with distribution 16 / 10 / 17 and codes `1.1`–`1.16`, `2.1`–`2.10`, `3.1`–`3.17`.
- Preserve the source wording and numbering, including separate items `3.7` and `3.8`; do not invent new examination topics.
- Make every topic available immediately; recommendations must never lock content or create penalties for inactivity.
- Every finished topic must contain a 30–60 second answer, a 1–2 minute answer, key points, oral checklist, at least one quiz question, and 2–4 attributed sources.
- Keep the material intentionally surface-level and oriented toward a coherent spoken answer, not proofs or long calculations.
- Support exactly two local profiles in the first release, with individual and pair progress.
- Use repository interfaces in features; only `src/storage/dexie` may import Dexie.
- Use HashRouter and a configurable Vite `base` so direct navigation works on GitHub Pages.
- Keep the first release fully usable without Supabase or any remote backend.
- Cache the application shell and static content, but never put IndexedDB progress into the service-worker cache.
- Do not add streaks, penalties, public rankings, AI-generated questions, speech recording, or speech recognition.
- Do not label the internal readiness score as an official examination score or a prediction of the admissions committee result.
- Russian is the default UI language; source code identifiers remain in English.
- Meet keyboard-operability, visible focus, reduced-motion, semantic HTML, and WCAG AA contrast requirements.

---

## Planned File Map

### Project and build

- `package.json` — dependencies and scripts.
- `.nvmrc` — Node.js major version.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — strict compiler configuration.
- `vite.config.ts` — React, PWA, test setup, and configurable GitHub Pages base.
- `eslint.config.js`, `.prettierrc.json` — code-quality configuration.
- `index.html` — application entry document.
- `.github/workflows/ci.yml` — pull-request and branch validation.
- `.github/workflows/deploy-pages.yml` — validated GitHub Pages deployment.

### App shell

- `src/main.tsx` — React bootstrap.
- `src/app/App.tsx` — routes and feature error boundaries.
- `src/app/routes.tsx` — route declarations.
- `src/app/providers/AppProviders.tsx` — repository, active-profile, theme, and update providers.
- `src/app/providers/RepositoryProvider.tsx` — `StudyRepository` dependency injection.
- `src/app/providers/ProfileProvider.tsx` — two-profile selection and active participant state.
- `src/app/providers/ThemeProvider.tsx` — light/dark/system preference.
- `src/app/layout/AppShell.tsx` — navigation, page frame, skip link, and responsive shell.

### Domain and repositories

- `src/entities/content/topic.ts` — topic and quiz types.
- `src/entities/content/topicSchema.ts` — Zod validation.
- `src/entities/content/contentAudit.ts` — complete-content checks.
- `src/entities/profile/profile.ts` — profile type and validation.
- `src/entities/progress/progress.ts` — progress and attempt types.
- `src/entities/progress/mastery.ts` — readiness and status calculation.
- `src/entities/review/reviewPriority.ts` — non-blocking recommendation score.
- `src/entities/pair/pairReadiness.ts` — minimum-of-two readiness.
- `src/entities/pair/roleRotation.ts` — responder/reviewer role changes.
- `src/entities/backup/backup.ts` — backup schema and checksum input.
- `src/entities/backup/mergeBackup.ts` — deterministic merge and conflict detection.
- `src/repositories/StudyRepository.ts` — persistence contract.

### Static content

- `src/content/program.ts` — official exam context, grading bands, literature, and content version.
- `src/content/topicManifest.ts` — exact 43 codes and original programme wording.
- `src/content/topics/modeling/*.ts` — topics `1.1`–`1.16`.
- `src/content/topics/numerical-methods/*.ts` — topics `2.1`–`2.10`.
- `src/content/topics/software-complexes/*.ts` — topics `3.1`–`3.17`.
- `src/content/topics/index.ts` — validated exported topic array and lookup map.
- `scripts/audit-content.ts` — command-line content validation used by CI.

### Storage

- `src/storage/dexie/YstuDatabase.ts` — schema and migrations.
- `src/storage/dexie/DexieStudyRepository.ts` — repository implementation.
- `src/storage/dexie/databaseErrors.ts` — typed IndexedDB/quota error mapping.
- `src/storage/memory/MemoryStudyRepository.ts` — no-save fallback and deterministic tests.

### Features and pages

- `src/pages/DashboardPage.tsx`
- `src/pages/TopicsPage.tsx`
- `src/pages/TopicPage.tsx`
- `src/pages/QuizPage.tsx`
- `src/pages/OralExamPage.tsx`
- `src/pages/PairSessionPage.tsx`
- `src/pages/ProgressPage.tsx`
- `src/pages/BackupPage.tsx`
- `src/pages/AboutPage.tsx`
- `src/pages/ContentAuditPage.tsx`
- `src/features/topics/*` — search, filters, topic cards, layered content.
- `src/features/quizzes/*` — five quiz renderers and scoring.
- `src/features/oral-exam/*` — preparation/answer timer and self-assessment.
- `src/features/pair-session/*` — partner checklist and role rotation.
- `src/features/review/*` — optional recommendation queue.
- `src/features/progress/*` — individual and pair summaries.
- `src/features/backup/*` — export, import validation, diff, merge, replace.
- `src/features/pwa/*` — controlled update prompt and offline status.
- `src/shared/ui/*` — focused reusable controls.
- `src/shared/styles/*` — tokens, global styles, layout, themes, reduced motion.

### Tests

- Unit and component tests stay beside source files as `*.test.ts` or `*.test.tsx`.
- `src/test/setup.ts` — jest-dom and fake IndexedDB setup.
- `e2e/onboarding.spec.ts`
- `e2e/topic-study.spec.ts`
- `e2e/quiz.spec.ts`
- `e2e/oral-pair.spec.ts`
- `e2e/backup.spec.ts`
- `e2e/github-pages-base.spec.ts`
- `e2e/offline.spec.ts`
- `playwright.config.ts`

---

### Task 1: Scaffold the Strict React Application and Quality Gates

**Files:**
- Create: `.nvmrc`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/test/setup.ts`
- Create: `src/shared/styles/global.css`

**Interfaces:**
- Produces: `App(): JSX.Element`, npm scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `format:check`, `test`, `test:run`, `content:audit`, and `e2e`.

- [ ] **Step 1: Create the Vite React TypeScript scaffold**

Run:

```bash
npm create vite@latest . -- --template react-ts
npm install react-router-dom dexie dexie-react-hooks zod vite-plugin-pwa workbox-window
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom fake-indexeddb @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier
```

Expected: `package.json` and `package-lock.json` are created, and `npm install` exits with status 0.

- [ ] **Step 2: Pin Node and define scripts**

Write `.nvmrc`:

```text
22
```

Set these `package.json` fields:

```json
{
  "engines": { "node": ">=22 <23" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint . --max-warnings 0",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "content:audit": "tsx scripts/audit-content.ts",
    "e2e": "playwright test"
  }
}
```

Install the script runner used by `content:audit`:

```bash
npm install -D tsx
```

- [ ] **Step 3: Write the first failing application test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the product purpose', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Подготовка к собеседованию ЯГТУ' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Configure Vitest and run the failing test**

Add to `vite.config.ts` a `test` block with `environment: 'jsdom'` and `setupFiles: ['./src/test/setup.ts']`. In `src/test/setup.ts`, import `@testing-library/jest-dom/vitest` and `fake-indexeddb/auto`.

Run:

```bash
npm run test:run -- src/app/App.test.tsx
```

Expected: FAIL because `App` does not yet export the required heading.

- [ ] **Step 5: Implement the minimal application shell**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main>
      <h1>Подготовка к собеседованию ЯГТУ</h1>
    </main>
  );
}
```

Update `src/main.tsx` to render `<App />` and import `src/shared/styles/global.css`.

- [ ] **Step 6: Configure strict TypeScript, ESLint, and Prettier**

Ensure `tsconfig.app.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Configure ESLint for TypeScript, React Hooks, and React Refresh; configure Prettier with `singleQuote: true`, `semi: true`, and `trailingComma: "all"`.

- [ ] **Step 7: Verify the scaffold**

Run:

```bash
npm run test:run -- src/app/App.test.tsx
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit with status 0 and `dist/index.html` exists.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: scaffold strict React application"
```

---

### Task 2: Define Topic, Quiz, Progress, and Backup Contracts

**Files:**
- Create: `src/entities/content/topic.ts`
- Create: `src/entities/content/topicSchema.ts`
- Create: `src/entities/content/topicSchema.test.ts`
- Create: `src/entities/profile/profile.ts`
- Create: `src/entities/progress/progress.ts`
- Create: `src/entities/backup/backup.ts`
- Create: `src/repositories/StudyRepository.ts`

**Interfaces:**
- Produces: `Topic`, `TopicSection`, `QuizQuestion`, `Profile`, `TopicProgress`, `QuizAttempt`, `OralAttempt`, `PartnerAssessment`, `StudySession`, `AppSettings`, `BackupSnapshot`, `StudyRepository`, and `topicSchema`.

- [ ] **Step 1: Write failing schema tests for valid and invalid topic content**

Create `src/entities/content/topicSchema.test.ts` with one complete valid topic fixture and assertions that parsing fails when `shortAnswer` is empty, `quiz` is empty, `sources` has fewer than two items, or a quiz references an unknown key point.

Use this representative assertion:

```ts
expect(() => topicSchema.parse({ ...validTopic, shortAnswer: '' })).toThrow();
```

- [ ] **Step 2: Run the schema test and confirm failure**

```bash
npm run test:run -- src/entities/content/topicSchema.test.ts
```

Expected: FAIL because `topicSchema` and domain types do not exist.

- [ ] **Step 3: Implement the discriminated topic and quiz types**

Define in `src/entities/content/topic.ts`:

```ts
export type TopicSection =
  | 'mathematical-modeling'
  | 'numerical-methods'
  | 'software-complexes';

export interface KeyPoint {
  id: string;
  title: string;
  explanation: string;
}

export interface FormulaBlock {
  id: string;
  latex: string;
  plainText: string;
  explanation: string;
}

export interface OralCriterion {
  id: string;
  label: string;
  critical: boolean;
}

export interface TopicSource {
  title: string;
  url: string;
  supports: string[];
}

interface QuizQuestionBase {
  id: string;
  prompt: string;
  explanation: string;
  keyPointIds: string[];
}

export interface SingleChoiceQuestion extends QuizQuestionBase {
  type: 'single-choice';
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
}

export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: 'multiple-choice';
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
}

export interface MatchingQuestion extends QuizQuestionBase {
  type: 'matching';
  left: Array<{ id: string; text: string }>;
  right: Array<{ id: string; text: string }>;
  pairs: Record<string, string>;
}

export interface OrderingQuestion extends QuizQuestionBase {
  type: 'ordering';
  items: Array<{ id: string; text: string }>;
  correctOrder: string[];
}

export interface FillBlankQuestion extends QuizQuestionBase {
  type: 'fill-blank';
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion
  | OrderingQuestion
  | FillBlankQuestion;

export interface Topic {
  id: string;
  code: string;
  section: TopicSection;
  originalText: string;
  shortAnswer: string;
  extendedAnswer: string;
  keyPoints: KeyPoint[];
  formulas: FormulaBlock[];
  example?: string;
  commonMistakes: string[];
  oralChecklist: OralCriterion[];
  quiz: QuizQuestion[];
  sources: TopicSource[];
}
```

- [ ] **Step 4: Implement profile, progress, and attempt types**

Define stable ISO-string timestamps and these status values:

```ts
export type TopicStatus =
  | 'not-started'
  | 'studying'
  | 'can-answer'
  | 'mastered'
  | 'needs-review';
```

Define the persistence types exactly as follows:

```ts
export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewedSection =
  | 'shortAnswer'
  | 'extendedAnswer'
  | 'keyPoints'
  | 'formulas'
  | 'example'
  | 'commonMistakes';

export interface TopicProgress {
  id: string;
  profileId: string;
  topicId: string;
  viewedSections: ViewedSection[];
  manualReview: boolean;
  status: TopicStatus;
  masteryScore: number;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  profileId: string;
  topicId: string;
  correct: number;
  total: number;
  score: number;
  answers: Record<string, unknown>;
  completedAt: string;
  updatedAt: string;
}

export type OralCriterionResult = 'covered' | 'partial' | 'missed';

export interface OralAttempt {
  id: string;
  profileId: string;
  topicId: string;
  selfConfidence: number;
  oralScore: number;
  criteria: Array<{ criterionId: string; result: OralCriterionResult }>;
  startedAt: string;
  completedAt: string;
  updatedAt: string;
}

export interface PartnerAssessment {
  id: string;
  oralAttemptId: string;
  responderProfileId: string;
  reviewerProfileId: string;
  topicId: string;
  score: number;
  criteria: Array<{ criterionId: string; result: OralCriterionResult }>;
  notes?: string;
  completedAt: string;
  updatedAt: string;
}

export type StudySessionMode =
  | 'selected'
  | 'random-section'
  | 'responder-weak'
  | 'pair-weak'
  | 'mock-interview';

export interface StudySession {
  id: string;
  mode: StudySessionMode;
  participantIds: [string, string];
  topicIds: string[];
  attemptIds: string[];
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'app-settings';
  activeProfileId?: string;
  theme: 'light' | 'dark' | 'system';
  oralPreparationSeconds: number;
  oralAnswerSeconds: number;
  oralTimerEnabled: boolean;
  updatedAt: string;
}
```

Validate all normalised scores at repository boundaries as finite numbers in `0..1`.

- [ ] **Step 5: Define the backup snapshot and repository contract**

Create `BackupSnapshot` with:

```ts
export interface BackupSnapshot {
  formatVersion: 1;
  exportedAt: string;
  contentVersion: string;
  checksum: string;
  profiles: Profile[];
  topicProgress: TopicProgress[];
  quizAttempts: QuizAttempt[];
  oralAttempts: OralAttempt[];
  partnerAssessments: PartnerAssessment[];
  studySessions: StudySession[];
  settings: AppSettings;
}
```

Create `StudyRepository` with exact asynchronous methods:

```ts
export interface StudyRepository {
  initialize(): Promise<void>;
  listProfiles(): Promise<Profile[]>;
  saveProfile(profile: Profile): Promise<void>;
  getTopicProgress(profileId: string, topicId: string): Promise<TopicProgress | undefined>;
  listTopicProgress(profileId: string): Promise<TopicProgress[]>;
  saveTopicProgress(progress: TopicProgress): Promise<void>;
  listQuizAttempts(profileId: string, topicId?: string): Promise<QuizAttempt[]>;
  saveQuizAttempt(attempt: QuizAttempt): Promise<void>;
  listOralAttempts(profileId: string, topicId?: string): Promise<OralAttempt[]>;
  saveOralAttempt(attempt: OralAttempt): Promise<void>;
  listPartnerAssessments(profileId: string, topicId?: string): Promise<PartnerAssessment[]>;
  savePartnerAssessment(assessment: PartnerAssessment): Promise<void>;
  listStudySessions(): Promise<StudySession[]>;
  saveStudySession(session: StudySession): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  exportSnapshot(contentVersion: string): Promise<BackupSnapshot>;
  replaceSnapshot(snapshot: BackupSnapshot): Promise<void>;
}
```

- [ ] **Step 6: Implement `topicSchema` and cross-field validation**

Use Zod discriminated unions for quiz types. Add `superRefine` checks for unique key-point IDs, unique question IDs, `keyPointIds` existing in the topic, and `supports` referencing at least one key-point ID or the literal values `shortAnswer`, `extendedAnswer`, `example`, or `oralChecklist`.

- [ ] **Step 7: Verify tests and types**

```bash
npm run test:run -- src/entities/content/topicSchema.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/entities src/repositories
git commit -m "feat: define study domain contracts"
```

---

### Task 3: Encode the Official Programme Manifest and Content Audit

**Files:**
- Create: `src/content/program.ts`
- Create: `src/content/topicManifest.ts`
- Create: `src/entities/content/contentAudit.ts`
- Create: `src/entities/content/contentAudit.test.ts`
- Create: `src/content/topics/index.ts`
- Create: `scripts/audit-content.ts`

**Interfaces:**
- Consumes: `Topic`, `TopicSection`, `topicSchema`.
- Produces: `PROGRAMME_INFO`, `CONTENT_VERSION`, `topicManifest`, `auditTopics(topics): ContentAuditReport`, and CLI exit status.

- [ ] **Step 1: Write failing audit tests for the required programme shape**

Create tests that expect:

```ts
expect(report.totalTopics).toBe(43);
expect(report.sectionCounts).toEqual({
  'mathematical-modeling': 16,
  'numerical-methods': 10,
  'software-complexes': 17,
});
expect(report.errors).toEqual([]);
```

Add negative tests for duplicate codes, missing `2.10`, an extra `4.1`, fewer than two sources, and a broken key-point reference.

- [ ] **Step 2: Run tests and confirm failure**

```bash
npm run test:run -- src/entities/content/contentAudit.test.ts
```

Expected: FAIL because audit functions and the manifest do not exist.

- [ ] **Step 3: Create exact topic-code expectations**

Use this code list in `contentAudit.ts`:

```ts
export const EXPECTED_TOPIC_CODES = [
  '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8',
  '1.9', '1.10', '1.11', '1.12', '1.13', '1.14', '1.15', '1.16',
  '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10',
  '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9',
  '3.10', '3.11', '3.12', '3.13', '3.14', '3.15', '3.16', '3.17',
] as const;
```

- [ ] **Step 4: Encode the official manifest**

Create `topicManifest.ts` with 43 entries. For each entry, copy `code`, `section`, and `originalText` exactly from section 8 of the approved design document, which in turn transcribes the PDF. Use stable IDs `topic-1-01` through `topic-3-17`.

Add explicit assertions for the source split:

```ts
expect(topicManifest.find((item) => item.code === '3.7')?.originalText)
  .toBe('Прикладное программное обеспечение научных исследований. Формы');
expect(topicManifest.find((item) => item.code === '3.8')?.originalText)
  .toBe('представления комплексов прикладных программ: библиотека, пакет прикладных программ, диалоговая система.');
```

- [ ] **Step 5: Encode official exam metadata without converting it into an internal score**

Create `PROGRAMME_INFO` containing the oral individual format, minimum successful result of 70/100, official score bands, programme title, and the bibliography transcribed from the PDF. Set:

```ts
export const CONTENT_VERSION = '2026.08.01';
```

- [ ] **Step 6: Implement the audit function**

`auditTopics` must parse every item with `topicSchema`, compare exact codes and section counts, report duplicates, validate source count, and return:

```ts
export interface ContentAuditReport {
  valid: boolean;
  totalTopics: number;
  sectionCounts: Record<TopicSection, number>;
  errors: Array<{ topicCode?: string; path: string; message: string }>;
}
```

- [ ] **Step 7: Implement the CLI audit**

`scripts/audit-content.ts` imports `topics` from `src/content/topics`, prints a readable report, and sets `process.exitCode = 1` when `valid` is false.

Until the full content index is added in Tasks 4–6, export an empty `topics` array from `src/content/topics/index.ts` and expect the CLI to fail; do not add it to the green CI sequence yet.

- [ ] **Step 8: Run domain tests**

```bash
npm run test:run -- src/entities/content/contentAudit.test.ts
npm run typecheck
```

Expected: PASS for fixture-based tests.

- [ ] **Step 9: Commit**

```bash
git add src/content src/entities/content scripts
git commit -m "feat: encode official programme manifest"
```

---

### Task 4: Author and Validate Mathematical Modelling Topics 1.1–1.16

**Files:**
- Create: `src/content/topics/defineTopic.ts`
- Create: `src/content/topics/modeling/topic-1-01.ts`
- Create: `src/content/topics/modeling/topic-1-02.ts`
- Create: `src/content/topics/modeling/topic-1-03.ts`
- Create: `src/content/topics/modeling/topic-1-04.ts`
- Create: `src/content/topics/modeling/topic-1-05.ts`
- Create: `src/content/topics/modeling/topic-1-06.ts`
- Create: `src/content/topics/modeling/topic-1-07.ts`
- Create: `src/content/topics/modeling/topic-1-08.ts`
- Create: `src/content/topics/modeling/topic-1-09.ts`
- Create: `src/content/topics/modeling/topic-1-10.ts`
- Create: `src/content/topics/modeling/topic-1-11.ts`
- Create: `src/content/topics/modeling/topic-1-12.ts`
- Create: `src/content/topics/modeling/topic-1-13.ts`
- Create: `src/content/topics/modeling/topic-1-14.ts`
- Create: `src/content/topics/modeling/topic-1-15.ts`
- Create: `src/content/topics/modeling/topic-1-16.ts`
- Create: `src/content/topics/modeling/index.ts`
- Create: `src/content/topics/modeling/modelingTopics.test.ts`

**Interfaces:**
- Consumes: `Topic`, `topicSchema`, `topicManifest`.
- Produces: `defineTopic(input): Topic` and `modelingTopics: Topic[]`.

- [ ] **Step 1: Write a failing section-completeness test**

Test that `modelingTopics` contains the exact ordered codes `1.1`–`1.16`, every item parses, every item has 2–4 sources, and each source has a non-empty `supports` array.

- [ ] **Step 2: Run the test and confirm failure**

```bash
npm run test:run -- src/content/topics/modeling/modelingTopics.test.ts
```

Expected: FAIL because topic modules do not exist.

- [ ] **Step 3: Implement `defineTopic`**

`defineTopic` accepts all fields except `id`, `section`, and `originalText`, resolves those three values from `topicManifest` by `code`, parses the result with `topicSchema`, and returns the parsed topic. Throw a descriptive error for an unknown code.

- [ ] **Step 4: Author topics 1.1–1.4**

For each file, provide:

- a 90–150 word `shortAnswer` suitable for 30–60 seconds;
- a 220–400 word `extendedAnswer` suitable for 1–2 minutes;
- 3–7 key points covering every noun phrase in the official item;
- formulas only when needed to avoid a vague answer;
- one compact example;
- 2–5 common mistakes;
- 4–6 oral criteria, with foundational omissions marked `critical: true`;
- 3–6 quiz questions distributed across applicable question types;
- 2–4 sources, prioritising programme literature, university course material, standards, or primary documentation.

Use source `supports` values that point to exact key-point IDs or approved literals from Task 2.

- [ ] **Step 5: Validate the first four topics**

```bash
npm run test:run -- src/content/topics/modeling/modelingTopics.test.ts
```

Expected: FAIL only because codes `1.5`–`1.16` are still absent; no schema errors for `1.1`–`1.4`.

- [ ] **Step 6: Author topics 1.5–1.8 using the same fixed content contract**

Cover ANOVA, regression and least squares, experiment planning, and unconstrained optimisation at interview depth. Keep derivations out; retain only definitions, assumptions, workflow, interpretation, and a small example.

- [ ] **Step 7: Author topics 1.9–1.12 using the fixed content contract**

Cover Lagrange multipliers, concentrated-parameter dynamic systems, one-dimensional stability/bifurcations, and Lyapunov stability. Include plain-language explanations beside formulas.

- [ ] **Step 8: Author topics 1.13–1.16 using the fixed content contract**

Cover distributed-parameter systems, difference schemes, discrete simulation approaches, and dimensional analysis/similarity. Avoid turning numerical-method details into new examination topics beyond the programme wording.

- [ ] **Step 9: Export and validate the full section**

Create an ordered `modelingTopics` array and run:

```bash
npm run test:run -- src/content/topics/modeling/modelingTopics.test.ts
npm run typecheck
```

Expected: PASS and exactly 16 topics.

- [ ] **Step 10: Commit**

```bash
git add src/content/topics/defineTopic.ts src/content/topics/modeling
git commit -m "content: add mathematical modelling topics"
```

---

### Task 5: Author and Validate Numerical Methods Topics 2.1–2.10

**Files:**
- Create: `src/content/topics/numerical-methods/topic-2-01.ts`
- Create: `src/content/topics/numerical-methods/topic-2-02.ts`
- Create: `src/content/topics/numerical-methods/topic-2-03.ts`
- Create: `src/content/topics/numerical-methods/topic-2-04.ts`
- Create: `src/content/topics/numerical-methods/topic-2-05.ts`
- Create: `src/content/topics/numerical-methods/topic-2-06.ts`
- Create: `src/content/topics/numerical-methods/topic-2-07.ts`
- Create: `src/content/topics/numerical-methods/topic-2-08.ts`
- Create: `src/content/topics/numerical-methods/topic-2-09.ts`
- Create: `src/content/topics/numerical-methods/topic-2-10.ts`
- Create: `src/content/topics/numerical-methods/index.ts`
- Create: `src/content/topics/numerical-methods/numericalMethodTopics.test.ts`

**Interfaces:**
- Consumes: `defineTopic`.
- Produces: `numericalMethodTopics: Topic[]`.

- [ ] **Step 1: Write the failing exact-code and schema test**

Expect ordered codes `2.1`–`2.10`, valid schemas, 2–4 sources, and at least one formula or explicit statement that no formula is needed through prose fields where appropriate.

- [ ] **Step 2: Run the test and confirm failure**

```bash
npm run test:run -- src/content/topics/numerical-methods/numericalMethodTopics.test.ts
```

Expected: FAIL because modules are absent.

- [ ] **Step 3: Author topics 2.1–2.3**

Cover numerical-method accuracy/stability, approximation/interpolation, and numerical differentiation/integration. Explain error sources and practical method choice without long derivations.

- [ ] **Step 4: Author topics 2.4–2.6**

Cover nonlinear equations, systems of linear equations, and eigenvalue problems. Include compact algorithm descriptions, convergence conditions at a high level, and one small example per topic.

- [ ] **Step 5: Author topics 2.7–2.8**

Cover ordinary differential equations and boundary-value problems. Distinguish initial and boundary conditions clearly and include the role of step size and stability.

- [ ] **Step 6: Author topics 2.9–2.10**

Cover partial differential equations and Monte Carlo methods according to the exact source wording. Use classifications and workflow-level explanations rather than proofs.

- [ ] **Step 7: Export and validate the full section**

```bash
npm run test:run -- src/content/topics/numerical-methods/numericalMethodTopics.test.ts
npm run typecheck
```

Expected: PASS and exactly 10 topics.

- [ ] **Step 8: Commit**

```bash
git add src/content/topics/numerical-methods
git commit -m "content: add numerical methods topics"
```

---

### Task 6: Author Software-Complex Topics 3.1–3.17 and Activate Full Content Audit

**Files:**
- Create: `src/content/topics/software-complexes/topic-3-01.ts`
- Create: `src/content/topics/software-complexes/topic-3-02.ts`
- Create: `src/content/topics/software-complexes/topic-3-03.ts`
- Create: `src/content/topics/software-complexes/topic-3-04.ts`
- Create: `src/content/topics/software-complexes/topic-3-05.ts`
- Create: `src/content/topics/software-complexes/topic-3-06.ts`
- Create: `src/content/topics/software-complexes/topic-3-07.ts`
- Create: `src/content/topics/software-complexes/topic-3-08.ts`
- Create: `src/content/topics/software-complexes/topic-3-09.ts`
- Create: `src/content/topics/software-complexes/topic-3-10.ts`
- Create: `src/content/topics/software-complexes/topic-3-11.ts`
- Create: `src/content/topics/software-complexes/topic-3-12.ts`
- Create: `src/content/topics/software-complexes/topic-3-13.ts`
- Create: `src/content/topics/software-complexes/topic-3-14.ts`
- Create: `src/content/topics/software-complexes/topic-3-15.ts`
- Create: `src/content/topics/software-complexes/topic-3-16.ts`
- Create: `src/content/topics/software-complexes/topic-3-17.ts`
- Create: `src/content/topics/software-complexes/index.ts`
- Create: `src/content/topics/software-complexes/softwareComplexTopics.test.ts`
- Modify: `src/content/topics/index.ts`
- Create: `src/content/topics/topics.test.ts`

**Interfaces:**
- Consumes: `defineTopic`, `auditTopics`.
- Produces: `softwareComplexTopics`, `topics`, and `topicsById`.

- [ ] **Step 1: Write failing section and whole-bank tests**

Expect 17 exact codes in the section and 43 exact codes in the combined export. Add a dedicated test that `3.7` and `3.8` stay separate and preserve their source text.

- [ ] **Step 2: Run tests and confirm failure**

```bash
npm run test:run -- src/content/topics/software-complexes/softwareComplexTopics.test.ts src/content/topics/topics.test.ts
```

Expected: FAIL because section modules are absent and the combined bank is incomplete.

- [ ] **Step 3: Author topics 3.1–3.4**

Cover programme complexes, software lifecycle/requirements, architecture/modularity, and development organisation exactly within the official programme boundaries.

- [ ] **Step 4: Author topics 3.5–3.8**

Cover quality/testing/documentation and the source split between `3.7` and `3.8`. Add a neutral `commonMistakes` note explaining that the wording appears to form one sentence in the PDF but is intentionally preserved as two numbered items.

- [ ] **Step 5: Author topics 3.9–3.12**

Cover the corresponding programme concepts using current primary documentation where the topic names a technology or standard, while keeping the spoken answer generic enough not to depend on one vendor.

- [ ] **Step 6: Author topics 3.13–3.17**

Complete the final five programme items with the same fixed content contract and source attribution.

- [ ] **Step 7: Combine and freeze topic ordering**

Create:

```ts
export const topics = [
  ...modelingTopics,
  ...numericalMethodTopics,
  ...softwareComplexTopics,
] as const;

export const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
```

Run `auditTopics(topics)` at module initialisation and throw a readable error when the result is invalid, so an invalid production build fails immediately.

- [ ] **Step 8: Enable and run the CLI audit**

```bash
npm run content:audit
npm run test:run -- src/content/topics
npm run typecheck
```

Expected: PASS; audit prints 43 topics and section counts 16 / 10 / 17.

- [ ] **Step 9: Commit**

```bash
git add src/content/topics scripts/audit-content.ts
git commit -m "content: complete the 43-topic study bank"
```

---

### Task 7: Implement Mastery, Review Priority, Pair Readiness, and Role Rotation

**Files:**
- Create: `src/entities/progress/mastery.ts`
- Create: `src/entities/progress/mastery.test.ts`
- Create: `src/entities/review/reviewPriority.ts`
- Create: `src/entities/review/reviewPriority.test.ts`
- Create: `src/entities/pair/pairReadiness.ts`
- Create: `src/entities/pair/pairReadiness.test.ts`
- Create: `src/entities/pair/roleRotation.ts`
- Create: `src/entities/pair/roleRotation.test.ts`

**Interfaces:**
- Produces: `calculateMastery(input): MasteryResult`, `calculateReviewPriority(input): number`, `calculatePairReadiness(a, b): number`, and `rotateRoles(pair): PairRoles`.

Define these exact pure-domain interfaces before writing the tests:

```ts
export interface MasteryInput {
  progress: TopicProgress | undefined;
  quizAttempts: QuizAttempt[];
  oralAttempts: OralAttempt[];
  partnerAssessments: PartnerAssessment[];
  criticalCriterionIds: string[];
  now: string;
}

export interface MasteryResult {
  score: number;
  status: TopicStatus;
  coverage: number;
  quizAccuracy: number;
  selfConfidence: number;
  oralScore: number;
  partnerScore?: number;
}

export interface ReviewPriorityInput {
  mastery: MasteryResult;
  lastReviewedAt?: string;
  failedCriticalCriteria: number;
  manualReview: boolean;
  now: string;
}

export interface PairRoles {
  responderId: string;
  reviewerId: string;
}
```

- [ ] **Step 1: Write failing mastery tests**

Test these rules:

- untouched topic returns status `not-started` and score `0`;
- viewed material without attempts returns `studying`;
- `can-answer` requires material coverage, at least one quiz, at least one oral attempt, and no failed critical criterion;
- `mastered` requires successful attempts on at least two different calendar dates;
- manual review or a later weak attempt can produce `needs-review`.

- [ ] **Step 2: Define fixed weights and implement mastery**

Use fixed weights:

```ts
export const MASTERY_WEIGHTS = {
  coverage: 0.2,
  quizAccuracy: 0.25,
  selfConfidence: 0.15,
  oralScore: 0.25,
  partnerScore: 0.15,
} as const;
```

When no partner score exists, redistribute its weight proportionally across the other four components. Clamp the result to `0..1`.

- [ ] **Step 3: Write and implement review-priority tests**

Use a `0..100` score based on inverse mastery, days since review capped at 30, failed critical criteria, and `manualReview`. Verify that manual review adds 20 points but never exceeds 100, and that no date is treated as overdue debt.

- [ ] **Step 4: Write and implement pair-readiness tests**

```ts
expect(calculatePairReadiness(0.82, 0.61)).toBe(0.61);
```

Reject values outside `0..1` with a `RangeError`.

- [ ] **Step 5: Write and implement role-rotation tests**

Given `{ responderId: 'a', reviewerId: 'b' }`, return `{ responderId: 'b', reviewerId: 'a' }`; reject equal IDs.

- [ ] **Step 6: Run all domain tests**

```bash
npm run test:run -- src/entities/progress src/entities/review src/entities/pair
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/entities/progress src/entities/review src/entities/pair
git commit -m "feat: add readiness and review algorithms"
```

---

### Task 8: Implement Dexie Storage, Migrations, and Memory Fallback

**Files:**
- Create: `src/storage/dexie/YstuDatabase.ts`
- Create: `src/storage/dexie/DexieStudyRepository.ts`
- Create: `src/storage/dexie/DexieStudyRepository.test.ts`
- Create: `src/storage/dexie/databaseErrors.ts`
- Create: `src/storage/memory/MemoryStudyRepository.ts`
- Create: `src/storage/memory/MemoryStudyRepository.test.ts`

**Interfaces:**
- Consumes: all Task 2 persistence types and `StudyRepository`.
- Produces: `YstuDatabase`, `DexieStudyRepository`, `MemoryStudyRepository`, and `mapStorageError(error): StorageError`.

- [ ] **Step 1: Write failing repository contract tests**

Create a shared test suite that runs against both repositories and verifies profile save/list, progress upsert, attempt ordering, settings defaults, export snapshot completeness, and replace snapshot atomicity.

- [ ] **Step 2: Run tests and confirm failure**

```bash
npm run test:run -- src/storage
```

Expected: FAIL because repositories are absent.

- [ ] **Step 3: Define Dexie schema version 1**

Use tables and indexes:

```ts
profiles: 'id, updatedAt'
topicProgress: 'id, [profileId+topicId], profileId, topicId, updatedAt'
quizAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt'
oralAttempts: 'id, [profileId+topicId], profileId, topicId, completedAt'
partnerAssessments: 'id, [profileId+topicId], profileId, topicId, completedAt'
studySessions: 'id, startedAt, completedAt'
settings: 'id'
```

Use the constant settings ID `app-settings`.

- [ ] **Step 4: Implement `DexieStudyRepository`**

All multi-table operations, especially `replaceSnapshot`, must use a Dexie read-write transaction. Sort attempts by `completedAt` ascending in repository results. Do not expose Dexie collections outside the adapter.

- [ ] **Step 5: Implement the memory repository**

Use Maps keyed by entity ID and clone values on read/write with `structuredClone`, so tests and no-save mode cannot mutate stored data by reference.

- [ ] **Step 6: Map browser storage failures**

Create a discriminated `StorageError` with kinds `unavailable`, `quota`, and `unknown`. Map `QuotaExceededError` and failed IndexedDB open events without swallowing the original error message.

- [ ] **Step 7: Verify repository behavior and migration safety**

Add a test that opens schema version 1, writes attempts, reopens the database, and confirms all data remains. Reserve migration functions in `YstuDatabase` instead of destructive table recreation.

Run:

```bash
npm run test:run -- src/storage
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/storage
git commit -m "feat: add offline study repositories"
```

---

### Task 9: Build Providers, Two-Profile Onboarding, Theme, and Navigation

**Files:**
- Create: `src/app/providers/RepositoryProvider.tsx`
- Create: `src/app/providers/ProfileProvider.tsx`
- Create: `src/app/providers/ThemeProvider.tsx`
- Create: `src/app/providers/AppProviders.tsx`
- Create: `src/app/layout/AppShell.tsx`
- Create: `src/app/routes.tsx`
- Modify: `src/app/App.tsx`
- Create: `src/features/profiles/ProfileSetup.tsx`
- Create: `src/features/profiles/ProfileSetup.test.tsx`
- Create: `src/shared/ui/Button.tsx`
- Create: `src/shared/ui/Field.tsx`
- Create: `src/shared/styles/tokens.css`
- Create: `src/shared/styles/themes.css`

**Interfaces:**
- Consumes: `StudyRepository`, `DexieStudyRepository`, `MemoryStudyRepository`, `Profile`.
- Produces: `useStudyRepository()`, `useProfiles()`, `useTheme()`, route shell, and two-profile onboarding.

- [ ] **Step 1: Write failing onboarding tests**

Verify that a fresh app asks for two non-empty distinct names, saves exactly two profiles, selects the first profile, and shows the main navigation after completion.

- [ ] **Step 2: Run the test and confirm failure**

```bash
npm run test:run -- src/features/profiles/ProfileSetup.test.tsx
```

Expected: FAIL because providers and onboarding do not exist.

- [ ] **Step 3: Implement repository dependency injection**

`RepositoryProvider` accepts an optional repository prop for tests and otherwise creates one `DexieStudyRepository` instance. On `unavailable`, render a choice between retry and `MemoryStudyRepository` no-save mode.

- [ ] **Step 4: Implement profile state**

`ProfileProvider` loads profiles once, requires exactly two before entering the app, exposes `activeProfileId`, `setActiveProfileId`, `profiles`, and `refreshProfiles`, and stores the active ID in settings.

- [ ] **Step 5: Implement theme state**

Support `light`, `dark`, and `system`; persist the choice through `AppSettings`; apply a `data-theme` attribute to `document.documentElement`.

- [ ] **Step 6: Implement HashRouter routes and shell**

Create routes for `/`, `/topics`, `/topics/:topicId`, `/quiz/:topicId`, `/oral`, `/pair`, `/progress`, `/backup`, `/about`, and `/content-audit`. Add a skip link, semantic `<nav>`, active link state, profile switcher, theme switcher, and responsive mobile navigation.

- [ ] **Step 7: Add design tokens and visible focus**

Define spacing, typography, surfaces, border, focus ring, success/warning/error semantics, and distinct section markers using icon/label plus colour. Add `@media (prefers-reduced-motion: reduce)` rules.

- [ ] **Step 8: Verify onboarding and keyboard navigation**

```bash
npm run test:run -- src/features/profiles/ProfileSetup.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app src/features/profiles src/shared
git commit -m "feat: add two-profile application shell"
```

---

### Task 10: Build Topic Catalogue, Search, Filters, and Layered Topic View

**Files:**
- Create: `src/pages/TopicsPage.tsx`
- Create: `src/pages/TopicPage.tsx`
- Create: `src/features/topics/filterTopics.ts`
- Create: `src/features/topics/filterTopics.test.ts`
- Create: `src/features/topics/TopicFilters.tsx`
- Create: `src/features/topics/TopicCard.tsx`
- Create: `src/features/topics/TopicCatalogue.tsx`
- Create: `src/features/topics/TopicDetail.tsx`
- Create: `src/features/topics/TopicDetail.test.tsx`
- Create: `src/features/topics/FormulaBlockView.tsx`
- Create: `src/shared/ui/Disclosure.tsx`
- Create: `src/shared/ui/StatusBadge.tsx`

**Interfaces:**
- Consumes: `topics`, `TopicProgress`, `useProfiles`, `StudyRepository`.
- Produces: `filterTopics(input): Topic[]` and topic-study pages.

- [ ] **Step 1: Write failing pure filter tests**

Test case-insensitive Russian search across `code` and `originalText`, section filter, status filter, active-profile filter, and stable sorting by code, confidence, and review priority.

- [ ] **Step 2: Implement `filterTopics` and verify tests**

Do not mutate the input array. Use `Intl.Collator('ru', { numeric: true })` for code ordering.

Run:

```bash
npm run test:run -- src/features/topics/filterTopics.test.ts
```

Expected: PASS.

- [ ] **Step 3: Write failing layered-view tests**

Verify that the original wording is visible immediately, the short and extended answers are hidden before the learner presses `Показать шпаргалку`, and opening each layer updates coverage without requiring a quiz.

- [ ] **Step 4: Implement catalogue UI**

Show all 43 topics at first load. Add search, section/status/profile filters, sorting, result count, and a clear-filters action. Persist only filter preferences in URL search parameters, not in IndexedDB.

- [ ] **Step 5: Implement topic detail UI**

Render original wording, attempt-first prompt, short answer, extended answer, key points, formulas with `plainText`, example, common mistakes, oral checklist preview, sources with `supports`, and actions for quiz and oral practice.

- [ ] **Step 6: Save non-blocking coverage progress**

When a learner opens the main material, upsert `TopicProgress.viewedSections`. Never mark a topic `can-answer` from reading alone; call the mastery module after persistence.

- [ ] **Step 7: Verify catalogue and detail behavior**

```bash
npm run test:run -- src/features/topics
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/TopicsPage.tsx src/pages/TopicPage.tsx src/features/topics src/shared/ui
git commit -m "feat: add free topic catalogue and study view"
```

---

### Task 11: Implement the Five Quiz Types and Attempt Persistence

**Files:**
- Create: `src/pages/QuizPage.tsx`
- Create: `src/features/quizzes/scoreQuestion.ts`
- Create: `src/features/quizzes/scoreQuestion.test.ts`
- Create: `src/features/quizzes/QuizRunner.tsx`
- Create: `src/features/quizzes/QuizRunner.test.tsx`
- Create: `src/features/quizzes/questions/SingleChoiceQuestionView.tsx`
- Create: `src/features/quizzes/questions/MultipleChoiceQuestionView.tsx`
- Create: `src/features/quizzes/questions/MatchingQuestionView.tsx`
- Create: `src/features/quizzes/questions/OrderingQuestionView.tsx`
- Create: `src/features/quizzes/questions/FillBlankQuestionView.tsx`

**Interfaces:**
- Consumes: `QuizQuestion`, `QuizAttempt`, `StudyRepository`, `calculateMastery`.
- Produces: `scoreQuestion(question, answer): QuestionScore` and a persisted quiz flow.

- [ ] **Step 1: Write failing scoring tests for all five question types**

Include exact-set comparison for multiple choice, complete-pair comparison for matching, full sequence comparison for ordering, and trimmed accepted-answer comparison for fill-blank respecting `caseSensitive`.

- [ ] **Step 2: Implement pure scoring**

Return:

```ts
export interface QuestionScore {
  correct: boolean;
  earned: number;
  possible: 1;
}
```

Do not award partial credit in the first release.

- [ ] **Step 3: Write failing component tests**

Verify keyboard-accessible controls, no correctness indicated by colour alone, feedback with explanation, link back to the relevant key point, and final persisted attempt.

- [ ] **Step 4: Implement question renderers**

Use native radio groups, checkboxes, select controls for matching, up/down buttons plus keyboard shortcuts for ordering, and a labelled text input for fill-blank. Avoid drag-only interactions.

- [ ] **Step 5: Implement `QuizRunner`**

Allow one topic or a selected topic set. Show one question at a time, reveal feedback only after submission, allow continuation, and calculate final `score = correct / total`.

- [ ] **Step 6: Persist the attempt and recalculate progress**

Save `QuizAttempt`, load current attempts and progress, call `calculateMastery`, and upsert `TopicProgress` in one UI-level operation with error feedback. Generate IDs with `crypto.randomUUID()`.

- [ ] **Step 7: Verify quiz behavior**

```bash
npm run test:run -- src/features/quizzes
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/QuizPage.tsx src/features/quizzes
git commit -m "feat: add multi-format topic quizzes"
```

---

### Task 12: Implement Oral Practice with Timestamp-Based Timer and Self-Assessment

**Files:**
- Create: `src/pages/OralExamPage.tsx`
- Create: `src/features/oral-exam/useOralTimer.ts`
- Create: `src/features/oral-exam/useOralTimer.test.ts`
- Create: `src/features/oral-exam/OralPractice.tsx`
- Create: `src/features/oral-exam/OralPractice.test.tsx`
- Create: `src/features/oral-exam/OralSelfAssessment.tsx`
- Create: `src/shared/ui/ProgressBar.tsx`

**Interfaces:**
- Consumes: `Topic`, `OralAttempt`, `AppSettings`, `StudyRepository`, `calculateMastery`.
- Produces: `useOralTimer(config)` and persisted individual oral attempts.

- [ ] **Step 1: Write failing timer tests with fake timers**

Verify 20-second preparation, configurable 60/90/120-second answer phase, pause/resume, disabled timer mode, and correct remaining time after the browser tab is suspended by calculating from timestamps rather than interval tick counts.

- [ ] **Step 2: Implement the timer hook**

Store phase start and accumulated pause duration. Derive remaining milliseconds from `Date.now()` and update display at 250 ms intervals.

- [ ] **Step 3: Write failing oral-flow tests**

Verify source question first, hidden answer, explicit transition into answer phase, reveal of reference answer only after the learner finishes, checklist self-assessment, confidence scale, and persisted attempt.

- [ ] **Step 4: Implement oral practice**

Support a chosen topic, random topic from a chosen section, and random topic from a chosen set. Provide `Без таймера`, preparation duration, and answer duration settings.

- [ ] **Step 5: Implement self-assessment**

Require every oral criterion to be marked `covered`, `partial`, or `missed`; derive oral score as `(covered + 0.5 * partial) / criteriaCount`. Collect self-confidence `1..5` and normalise it to `0..1`.

- [ ] **Step 6: Persist and recalculate mastery**

Save `OralAttempt`, then upsert progress with the pure mastery result. A failed critical criterion prevents `can-answer` regardless of average score.

- [ ] **Step 7: Verify oral practice**

```bash
npm run test:run -- src/features/oral-exam
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/OralExamPage.tsx src/features/oral-exam src/shared/ui/ProgressBar.tsx
git commit -m "feat: add timed oral practice"
```

---

### Task 13: Implement Cooperative Pair Sessions and Partner Assessment

**Files:**
- Create: `src/pages/PairSessionPage.tsx`
- Create: `src/features/pair-session/PairSession.tsx`
- Create: `src/features/pair-session/PairSession.test.tsx`
- Create: `src/features/pair-session/PartnerChecklist.tsx`
- Create: `src/features/pair-session/createPairSession.ts`
- Create: `src/features/pair-session/createPairSession.test.ts`

**Interfaces:**
- Consumes: two `Profile` values, `rotateRoles`, `OralAttempt`, `PartnerAssessment`, `StudySession`.
- Produces: selected/random pair sessions with automatic role rotation and partner scoring.

- [ ] **Step 1: Write failing session-construction tests**

Test modes `selected`, `random-section`, `responder-weak`, `pair-weak`, and `mock-interview`. Ensure topics are never invented and come only from the 43-topic bank.

- [ ] **Step 2: Implement deterministic session construction**

Accept an injected `random(): number` for tests. Avoid repeating a topic until the chosen pool is exhausted.

- [ ] **Step 3: Write failing UI tests**

Verify explicit responder/reviewer labels, hidden reference answer during response, partner checklist after the response, optional notes, role rotation after each question, and end-session summary.

- [ ] **Step 4: Implement pair flow**

The responder performs the same oral phases as Task 12. The reviewer scores each criterion and overall coherence; save `PartnerAssessment` linked to the oral attempt.

- [ ] **Step 5: Persist the session and both participants’ progress**

Store a `StudySession` with mode, topic IDs, participant IDs, started/completed timestamps, and attempt IDs. Update responder mastery with the partner score; do not change reviewer mastery merely for reviewing.

- [ ] **Step 6: Verify pair behavior**

```bash
npm run test:run -- src/features/pair-session
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/PairSessionPage.tsx src/features/pair-session
git commit -m "feat: add cooperative pair sessions"
```

---

### Task 14: Build Dashboard, Optional Review Queue, Progress, and Restrained Gamification

**Files:**
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/pages/ProgressPage.tsx`
- Create: `src/features/review/buildReviewQueue.ts`
- Create: `src/features/review/buildReviewQueue.test.ts`
- Create: `src/features/review/ReviewRecommendations.tsx`
- Create: `src/features/progress/buildProgressSummary.ts`
- Create: `src/features/progress/buildProgressSummary.test.ts`
- Create: `src/features/progress/ProgressOverview.tsx`
- Create: `src/features/progress/AchievementList.tsx`

**Interfaces:**
- Consumes: all progress and attempt data, `calculateReviewPriority`, `calculatePairReadiness`.
- Produces: optional ranked recommendations, individual summaries, pair summaries, and fixed achievements.

- [ ] **Step 1: Write failing review-queue tests**

Verify descending priority, explicit manual-review boost, no “overdue” label, user-selected limit, and the ability to return an empty list without warnings.

- [ ] **Step 2: Implement review queue construction**

Return topic ID, priority, and plain-language reasons such as `Низкий результат теста`, `Давно не повторяли`, or `Отмечено вручную`. Never block navigation.

- [ ] **Step 3: Write failing progress-summary tests**

Verify counts by status, section coverage, each participant’s readiness, pair readiness as minimum per topic, and “weak for pair” when either participant is below `0.6`.

- [ ] **Step 4: Implement summaries and achievements**

Use only these achievements: first independent oral answer, first partner explanation, section coverage at 25/50/75/100%, and both participants can answer the same topic. Award each achievement once; no daily streak.

- [ ] **Step 5: Build dashboard actions**

Show `Продолжить`, `Выбрать темы`, `Быстрый тест`, and `Парный опрос`; active-profile progress; pair readiness; optional recommendations; recent topics; and pair weak topics.

- [ ] **Step 6: Build detailed progress page**

Provide participant tabs, pair view, section breakdown, status filters, and topic links. Use text labels and accessible progress bars, not charts that rely only on colour.

- [ ] **Step 7: Verify dashboard and summaries**

```bash
npm run test:run -- src/features/review src/features/progress
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/DashboardPage.tsx src/pages/ProgressPage.tsx src/features/review src/features/progress
git commit -m "feat: add flexible review and pair progress"
```

---

### Task 15: Implement Versioned Backup, Checksum, Diff, Merge, and Safe Replace

**Files:**
- Create: `src/entities/backup/checksum.ts`
- Create: `src/entities/backup/checksum.test.ts`
- Create: `src/entities/backup/mergeBackup.ts`
- Create: `src/entities/backup/mergeBackup.test.ts`
- Create: `src/pages/BackupPage.tsx`
- Create: `src/features/backup/exportBackup.ts`
- Create: `src/features/backup/importBackup.ts`
- Create: `src/features/backup/BackupManager.tsx`
- Create: `src/features/backup/BackupManager.test.tsx`
- Create: `src/features/backup/BackupDiff.tsx`

**Interfaces:**
- Consumes: `BackupSnapshot`, `StudyRepository`.
- Produces: `calculateChecksum(payload): Promise<string>`, `mergeBackup(local, incoming, resolutions): MergeResult`, download/export and validated import flows.

- [ ] **Step 1: Write failing checksum and schema tests**

Canonicalise object keys before hashing with Web Crypto SHA-256. Verify that equal data with different property insertion order produces the same checksum and changed data produces a different checksum.

- [ ] **Step 2: Implement checksum generation**

Exclude the `checksum` field itself from the hash input. Encode with `TextEncoder` and return lowercase hexadecimal.

- [ ] **Step 3: Write failing merge tests**

For each entity ID, choose the record with later `updatedAt`. When timestamps are equal and data differs, emit a conflict requiring `local` or `incoming` resolution. Verify no silent overwrite.

- [ ] **Step 4: Implement merge and diff**

Return added, changed, unchanged, and conflicts per entity type. Preserve attempt history rather than collapsing attempts by topic.

- [ ] **Step 5: Write failing backup UI tests**

Verify export creates a versioned JSON filename, invalid Zod input does not alter storage, checksum mismatch is rejected, merge preview appears before writing, and replace first downloads an automatic safety backup.

- [ ] **Step 6: Implement export and import**

Use filename `ystu-prep-backup-YYYY-MM-DD.json`. Read files with `File.text()`, parse JSON safely, validate, verify checksum, show diff, then call repository methods only after confirmation.

- [ ] **Step 7: Verify round-trip integration**

Add a test: seed repository → export → clear/replace with defaults → import → compare all entity collections.

Run:

```bash
npm run test:run -- src/entities/backup src/features/backup
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/entities/backup src/pages/BackupPage.tsx src/features/backup
git commit -m "feat: add safe progress backup and merge"
```

---

### Task 16: Add About, Source Transparency, and Content Audit Pages

**Files:**
- Create: `src/pages/AboutPage.tsx`
- Create: `src/pages/AboutPage.test.tsx`
- Create: `src/pages/ContentAuditPage.tsx`
- Create: `src/features/content-audit/ContentAuditReport.tsx`
- Create: `src/features/content-audit/ContentAuditReport.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Consumes: `PROGRAMME_INFO`, `CONTENT_VERSION`, `topics`, `auditTopics`.
- Produces: official-context page and developer audit page.

- [ ] **Step 1: Write failing About page tests**

Verify oral individual format, minimum 70/100, official score bands, disclaimer that internal readiness is not an official score, and all programme bibliography entries.

- [ ] **Step 2: Implement About page**

Separate `Из программы ЯГТУ` from `Дополнительные источники приложения`. Show the content version. Include a PDF link only when the file is intentionally added to `public/` with permission; otherwise explain that the source document is not redistributed by the app.

- [ ] **Step 3: Write failing content-audit page tests**

Verify summary 43 / 16 / 10 / 17, success state, and readable topic/path/message rows for injected invalid fixtures.

- [ ] **Step 4: Implement the hidden route**

Keep `/content-audit` out of main navigation but available directly. Run the same pure audit used by the CLI.

- [ ] **Step 5: Verify pages**

```bash
npm run test:run -- src/pages/AboutPage.test.tsx src/features/content-audit
npm run content:audit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/AboutPage.tsx src/pages/ContentAuditPage.tsx src/features/content-audit src/app/routes.tsx
git commit -m "feat: add programme and content audit pages"
```

---

### Task 17: Add PWA Offline Support, Controlled Updates, and Feature Error Boundaries

**Files:**
- Modify: `vite.config.ts`
- Create: `src/features/pwa/UpdatePrompt.tsx`
- Create: `src/features/pwa/UpdatePrompt.test.tsx`
- Create: `src/features/pwa/OfflineIndicator.tsx`
- Create: `src/shared/errors/FeatureErrorBoundary.tsx`
- Create: `src/shared/errors/StorageProblem.tsx`
- Create: `src/shared/errors/QuotaProblem.tsx`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/manifest.webmanifest`

**Interfaces:**
- Consumes: `virtual:pwa-register/react`, storage error mapping.
- Produces: offline shell, deferred update action, and feature-level recovery UI.

- [ ] **Step 1: Write failing update-prompt tests**

Verify that an available update is announced but not applied while an oral or quiz attempt is active, and applies only after explicit confirmation when the app is idle.

- [ ] **Step 2: Configure Vite PWA**

Use `registerType: 'prompt'`, precache built assets and content chunks, and add a navigation fallback to `index.html`. Do not cache external source pages or IndexedDB data.

- [ ] **Step 3: Implement online/offline and update UI**

Show a non-blocking offline indicator. The update prompt must offer `Обновить сейчас` and `Позже` and preserve current study state until the user confirms.

- [ ] **Step 4: Implement feature error boundaries**

Wrap catalogue, quiz, oral, pair, progress, and backup routes separately. Provide `Повторить` and route-home actions; include technical details only inside a disclosure.

- [ ] **Step 5: Implement storage-specific recovery**

For unavailable IndexedDB, offer retry and no-save mode. For quota errors, offer backup export and deletion of old raw attempts while retaining latest `TopicProgress`; require confirmation before deletion.

- [ ] **Step 6: Verify production PWA build**

```bash
npm run build
npx vite preview --host 127.0.0.1
```

Inspect the generated manifest and service worker; verify application assets are listed and no user data appears.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts src/features/pwa src/shared/errors public
git commit -m "feat: add offline support and recovery UI"
```

---

### Task 18: Add End-to-End Tests, GitHub Pages Deployment, IntelliJ Instructions, and Final Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/onboarding.spec.ts`
- Create: `e2e/topic-study.spec.ts`
- Create: `e2e/quiz.spec.ts`
- Create: `e2e/oral-pair.spec.ts`
- Create: `e2e/backup.spec.ts`
- Create: `e2e/github-pages-base.spec.ts`
- Create: `e2e/offline.spec.ts`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-pages.yml`
- Create: `README.md`
- Create: `docs/content-authoring.md`
- Create: `docs/backup-format.md`

**Interfaces:**
- Consumes: all application features and npm scripts.
- Produces: repeatable local setup, CI gates, Pages artifact, and release evidence.

- [ ] **Step 1: Configure Playwright and write the failing onboarding smoke test**

Configure `webServer.command = 'npm run dev -- --host 127.0.0.1'`, Chromium as the required CI browser, and a clean browser context per test. Verify two-profile creation and landing on the dashboard.

- [ ] **Step 2: Add core user-flow tests**

Write independent tests for:

- any topic can be opened immediately;
- layered content can be revealed;
- a quiz attempt persists after reload;
- an oral attempt persists after reload;
- pair roles rotate after one question;
- export/import restores progress.

- [ ] **Step 3: Test non-empty GitHub Pages base**

Build with:

```bash
VITE_BASE_PATH=/ystu-phd-interview-prep/ npm run build
```

Serve `dist` under that prefix and verify the app, assets, and a hash route load without 404 errors.

- [ ] **Step 4: Add the offline repeat-open test**

Open the production preview online, wait for service-worker activation, create progress, switch the Playwright context offline, reload, and verify both static content and IndexedDB progress remain available.

- [ ] **Step 5: Create CI workflow**

On pull requests and pushes to `main`, use Node 22 and run in order:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run content:audit
npm run test:run
npm run build
npx playwright install --with-deps chromium
npm run e2e
```

Cache npm through `actions/setup-node`.

- [ ] **Step 6: Create Pages deployment workflow**

After all checks pass on `main`, build with `VITE_BASE_PATH=/${{ github.event.repository.name }}/`, upload `dist` with `actions/upload-pages-artifact`, and deploy with `actions/deploy-pages`. Set Pages permissions and environment according to GitHub’s official Pages action flow.

- [ ] **Step 7: Write README for IntelliJ IDEA and GitHub Pages**

Document:

- install Node 22;
- open the repository root in IntelliJ IDEA;
- run `npm ci` in the built-in terminal;
- create npm run configurations for `dev`, `test`, and `build`;
- local URL and hash routing;
- how to enable GitHub Pages with GitHub Actions;
- local data location and browser-specific clearing warning;
- export before changing browsers/devices;
- how to run the content audit;
- first-release limitation: no cloud synchronisation.

- [ ] **Step 8: Write content and backup maintainer documentation**

`docs/content-authoring.md` must define answer length, source quality, source mapping, quiz boundaries, and the exact audit command. `docs/backup-format.md` must define version 1, checksum calculation, merge precedence, conflicts, and replacement safety backup.

- [ ] **Step 9: Run the complete verification sequence**

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run content:audit
npm run test:run
npm run build
npx playwright install chromium
npm run e2e
```

Expected: every command exits with status 0. Record total unit/component test count and Playwright test count in the final implementation report; do not claim success without this output.

- [ ] **Step 10: Inspect acceptance criteria manually**

Confirm:

- 43 topics and 16 / 10 / 17 distribution;
- both answer depths, quiz, oral checklist, and 2–4 sources for every topic;
- two profiles and persisted individual/pair progress;
- all topics immediately accessible;
- no streak, penalty, leaderboard, or content lock;
- internal readiness disclaimer;
- keyboard-only completion of onboarding, topic, quiz, oral, pair, and backup flows;
- light/dark themes and reduced-motion behavior;
- offline repeat open;
- non-empty Pages base.

- [ ] **Step 11: Commit**

```bash
git add .github e2e playwright.config.ts README.md docs package.json package-lock.json
git commit -m "ci: verify and deploy the interview prep app"
```

---

## Plan Self-Review Results

- **Spec coverage:** Every acceptance criterion in the approved design maps to Tasks 3–18. The 43-topic bank is completed before feature work depends on it. Supabase remains explicitly outside the first release.
- **Placeholder scan:** The plan contains no `TBD`, `TODO`, “implement later”, or undefined “write tests” steps. Content-authoring tasks specify exact files, topic ranges, required fields, depth, source policy, and validation commands.
- **Type consistency:** Features use the single `StudyRepository` contract from Task 2; readiness functions use normalised `0..1` values; backup and repository entities share the same domain types; topic quiz references use `keyPointIds` consistently.
- **Scope check:** The work is large but sequentially decomposed into independently reviewable deliverables: static validated content bank, pure learning logic, persistence, user flows, backup, and release hardening.
