<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: new principles added, Technology section materially expanded)
- Modified principles:
  - III. Test-First (NON-NEGOTIABLE): expanded — every user story MUST have at least one automated
    test that maps to it by ID; the full suite MUST run before work is handed back.
- Added principles:
  - VI. Build & Verification Gate (NON-NEGOTIABLE)
  - VII. Enterprise Engineering Standards
- Added sections: none (existing "Technology & Constraints" materially expanded)
- Removed sections: none
- Resolved TODOs:
  - TODO(TECH_STACK) → Next.js (App Router) + TypeScript is now the mandated stack.
- Deferred TODOs: none
- Dependent artifacts: plan/tasks templates read this file at runtime; no template edits made.
-->

# FirstApp Constitution

## Core Principles

### I. Spec-Driven Development

Every feature MUST begin as a written specification (`/speckit-specify`) that states user value,
acceptance scenarios, and measurable success criteria before any plan or code exists. A plan
(`/speckit-plan`) and task list (`/speckit-tasks`) MUST be produced and checked against this
constitution before implementation starts. Code that has no traceable spec requirement MUST NOT be
merged.

Rationale: specs keep scope explicit and give reviewers and AI agents a shared source of truth.

### II. Simplicity First (YAGNI)

- Build the smallest thing that satisfies the current spec; speculative features, configuration
  options, and abstractions are prohibited until a spec requires them.
- Every new runtime dependency, service, or architectural layer MUST be justified in the plan's
  Complexity Tracking table, including the simpler alternative that was rejected and why.
- Prefer Next.js and platform built-ins over third-party packages.

Rationale: an app is easiest to understand, change, and debug when it stays small.

### III. Test-First (NON-NEGOTIABLE)

- Every user story MUST have at least one automated test, and every acceptance scenario of that
  story MUST be covered by a test. Each test MUST reference its story ID (for example `US1`) in its
  name or `describe` block so coverage per story is traceable.
- Tests derived from acceptance scenarios MUST be written and observed failing before the
  implementation is written (Red → Green → Refactor).
- Each user story MUST be independently testable and demonstrable on its own.
- A change MUST NOT be merged or handed back while any test is failing or skipped without a linked
  TODO and reason.

Rationale: failing-first tests prove the test actually checks the behavior the spec demands, and
per-story tests prove every promised capability exists.

### IV. Security & Privacy by Default

- Secrets (API keys, tokens, passwords) MUST NOT be committed; they are supplied via environment
  variables or a secrets manager, and example config files (`.env.example`) contain placeholders only.
  Server-only secrets MUST NOT use the `NEXT_PUBLIC_` prefix.
- The app MUST collect and retain only the data a spec explicitly requires, and the spec MUST state
  why that data is needed.
- All external input (route handlers, server actions, forms, query params) MUST be validated at the
  boundary with a schema; dependencies MUST be pinned to exact versions via a committed lockfile.
- Authentication and authorization checks MUST run on the server, never only in client components.

Rationale: security mistakes are cheapest to prevent and most expensive to fix after release.

### V. Accessible, Consistent User Experience

- Any user-facing interface MUST meet WCAG 2.2 AA: keyboard navigation, sufficient contrast,
  semantic HTML, and text alternatives for non-text content.
- Error messages MUST tell the user what happened and what they can do next; no raw stack traces or
  error codes alone. Each route segment that can fail MUST provide an `error.tsx` boundary.
- UI patterns, terminology, and styling MUST stay consistent across features.

Rationale: an app is only as good as a user's ability to use it, including users with disabilities.

### VI. Build & Verification Gate (NON-NEGOTIABLE)

- Work MUST NOT be returned to the user, marked done, or merged until `next build` completes
  successfully with zero type errors and zero lint errors.
- Before any solution is returned, the ENTIRE automated test suite (unit, integration, and
  end-to-end) MUST be run, not only the tests for the changed story, and every test MUST pass.
- The hand-off MUST report the exact build and test commands run and their results (pass/fail
  counts). A failing build or test is fixed, not reported as "done with known issues."
- If a build or test cannot be run (for example a missing external service), the agent MUST say so
  explicitly and MUST NOT claim the work is complete.

Rationale: code that does not build or passes only a subset of tests is not a solution; verifying
everything before hand-off prevents regressions from reaching the user.

### VII. Enterprise Engineering Standards

- TypeScript in `strict` mode; `any` is prohibited without an inline justification comment.
- Code MUST pass ESLint (`next/core-web-vitals` + TypeScript rules) and Prettier formatting.
- Structured, leveled logging on the server; no `console.log` left in committed application code.
  Logs MUST NOT contain secrets or personal data.
- Configuration is environment-driven and validated at startup; the app MUST fail fast on missing or
  invalid required configuration.
- Errors are handled explicitly at boundaries (route handlers, server actions, data access) and
  mapped to safe user-facing messages and appropriate HTTP status codes.
- Code is organized by feature with clear separation between UI components, server logic, and data
  access; business logic MUST NOT live inside React components.
- Public modules, non-obvious decisions, and setup steps MUST be documented (README/quickstart).

Rationale: enterprise applications must be maintainable, observable, and safe to operate by teams
other than the original author.

## Technology & Constraints

- **Framework**: Next.js (latest stable, App Router) with TypeScript is REQUIRED for every feature
  and application in this project. Alternative frameworks MUST NOT be introduced; a deviation
  requires a MAJOR amendment to this constitution.
- **Rendering**: Prefer React Server Components; mark components `"use client"` only when they need
  browser-only APIs or interactivity.
- **Testing**: Vitest (or Jest) with React Testing Library for unit/component tests; Playwright for
  end-to-end tests of user-story acceptance scenarios. A single `npm test` (or equivalent) script
  MUST run the full suite.
- **Package management**: one package manager per repo with a committed lockfile; Node.js LTS.
- Builds MUST be reproducible from a clean checkout using documented commands (README or quickstart).
- Performance goals, if any, MUST be stated as measurable targets in the feature spec rather than
  assumed; Core Web Vitals MUST NOT regress without justification.

## Development Workflow & Quality Gates

1. Specify → Clarify (when the spec has open questions) → Plan → Tasks → Implement, in that order.
2. The plan's Constitution Check MUST pass, or each violation MUST be recorded and justified in
   Complexity Tracking, before research and again after design.
3. Task lists MUST include, for every user story, at least one test task that precedes that story's
   implementation tasks, plus a final task that runs the build and the full test suite.
4. Every change lands through version control as a small, focused commit or pull request that
   references its spec. Self-review against this constitution's principles is required when there is
   no second reviewer.
5. Before a feature is marked done or handed back: `next build` succeeds, lint and type checks pass,
   the full test suite passes, acceptance scenarios have been demonstrated, and `/speckit-analyze`
   reports no CRITICAL inconsistencies between spec, plan, and tasks.

## Governance

- This constitution supersedes all other practices and guidance documents. Where a guidance file
  (for example `CLAUDE.md`) conflicts with it, the constitution wins and the guidance file MUST be
  corrected.
- Amendments are made through `/speckit-constitution`, MUST include a Sync Impact Report, and MUST
  update any dependent templates or docs that the change affects.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR for
  adding a principle or section or materially expanding guidance, PATCH for clarifications and wording.
- Compliance is reviewed at every plan's Constitution Check and at every code review; unjustified
  complexity or skipping the Build & Verification Gate is grounds to reject a change.

**Version**: 1.1.0 | **Ratified**: 2026-10-22 | **Last Amended**: 2026-10-22
