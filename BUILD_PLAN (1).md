# Build Plan — Personal Productivity & Learning App

## Purpose

This is the day-by-day implementation plan for the app described in `PRD.md` and `design.md`.

Use this document together with those two files every time you start a build session in Claude/Antigravity.

**Important rule:** `PRD.md` is the product source of truth. `design.md` is the visual source of truth. This document controls the order of implementation and the daily scope.

Do not ask Claude to build the entire application in one prompt.

Build in small, testable slices.

---

# How to use this document with Claude

At the beginning of every build day/session, provide:

1. `PRD.md`
2. `design.md`
3. `BUILD_PLAN.md`
4. the prompt for the current Day/Task below

Tell Claude:

> You are working on the existing codebase, not starting from scratch.
>
> Read `PRD.md`, `design.md`, and `BUILD_PLAN.md` first.
>
> Implement ONLY the task specified for this session.
>
> Do not redesign or rewrite unrelated features.
>
> Before changing files, inspect the existing implementation and identify what already exists.
>
> Reuse existing components, types, database models, utilities, and design tokens whenever possible.
>
> Do not introduce new infrastructure or dependencies unless required by the PRD.
>
> After implementation, run the relevant tests/lint/type checks and fix issues you introduced.
>
> At the end, summarize:
> - files changed
> - what was implemented
> - commands/tests run
> - known issues
> - exact next recommended task
>
> Do not move to the next phase automatically.

---

# Global Rules

## Rule 1 — Revision is the highest-priority correctness feature

Never sacrifice revision correctness for speed or visual polish.

Revision scheduling must be:

- persistent
- deterministic
- timezone-safe
- idempotent
- testable

The schedule is anchored to the original `learnedAt` date.

Intervals:

```text
Day 1
Day 3
Day 7
Day 15
Day 30
```

Never calculate future revision dates from the previous completion date in V1.

---

## Rule 2 — Test after every meaningful backend/domain change

At minimum:

```text
typecheck
lint
unit tests
build
```

Use whichever commands the project actually defines.

Do not blindly run expensive commands after every CSS-only change.

---

## Rule 3 — Keep the architecture simple

Expected V1 stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Framer Motion
- Recharts
- HTML5 Audio API
- Manifest V3 later

Do not introduce:

- microservices
- Redis
- message queues
- separate Express server
- separate frontend
- auth infrastructure
- unnecessary state-management frameworks

unless the PRD explicitly changes.

---

## Rule 4 — External content is supplementary

Projects:

- curated internal project content
- external discovery links/sources

Interview:

- curated/original internal question bank
- external practice links

Do not make the core application depend on external websites.

Do not add scraping as a shortcut.

---

## Rule 5 — Don't overbuild the visual system

The app should look like a beautiful productivity application with anime/pixel-art atmosphere.

It should not become an RPG.

Avoid:

- quests
- HP
- combat
- fantasy currency
- giant animations
- excessive particles
- game HUDs

---

# Recommended Total Timeline

Target:

**15 active build days**

Realistic range:

**12–20 days**, depending on debugging, Claude usage limits, and how many hours you work per day.

The browser extension and final polish are the most flexible parts and can move later.

---

# DAY 1 — Project Foundation

## Goal

Get the project running with the correct architecture and design foundation.

## Tasks

- create/verify Next.js + TypeScript project
- configure Tailwind
- configure Prisma
- configure SQLite
- create initial environment/config structure
- establish app folder structure
- establish route/navigation skeleton
- add global CSS/design tokens
- add day/night theme structure
- create shared layout
- create shared panel/card/button/input primitives
- create typography tokens
- add basic responsive shell

## Pages to scaffold

```text
Home
Planner
Focus
Interview
Revision
Projects
Progress
Rewards
Journal
Settings
```

They can initially contain simple placeholders.

## Do NOT build

- real business logic
- revision engine
- analytics
- music
- extension

## Acceptance

- app runs locally
- routes work
- database connects
- Prisma migration works
- design tokens are centralized
- layout already resembles the intended visual system

## End-of-day test

```text
npm run lint
npm run typecheck
npm run build
```

Use actual project commands if named differently.

---

# DAY 2 — Database + Shared Domain Foundation

## Goal

Create the base schema without prematurely implementing every feature.

## Tasks

Define the core entities needed by the current phases:

```text
User
Task
FocusSession
RevisionItem
RevisionCheckpoint
InterviewQuestion
InterviewAttempt
Project
ProjectStageProgress
Reward
JournalEntry
Setting
```

Important:

Use a dedicated `RevisionCheckpoint` model/table.

Do not use an unstructured revision array for the critical scheduling system.

## Add

- Prisma schema
- migrations
- seed structure
- shared TypeScript domain types where useful
- date/time utility layer
- error-handling conventions
- persistence utility layer

## Acceptance

- migration works from a clean database
- seed command works if implemented
- schema has sensible relations/indexes
- no unnecessary tables

---

# DAY 3 — Dashboard + Planner

## Goal

Make the app useful as a basic daily planner.

## Dashboard

Implement:

- greeting
- date
- XP/level placeholder based on actual model or temporary derived logic
- today's focus summary
- today's task list
- revision due section placeholder
- interview status placeholder
- quote area
- Start Focus CTA

Hide empty sections.

## Planner

Implement:

- create task
- edit task
- delete task
- complete task
- reorder
- priority
- category
- estimated duration
- optional deadline

Views:

```text
Today
Tomorrow
Week
Calendar/basic date view
```

## Acceptance

User can:

```text
create task
→ see task
→ edit task
→ complete task
→ see it reflected on dashboard
```

---

# DAY 4 — Focus Timer Core

## Goal

Create a reliable focus system.

## Tasks

Presets:

```text
25 / 5
50 / 10
60 / 10
90 / 20
Custom
```

Implement:

- timer state
- start
- pause
- resume
- stop
- reset
- skip break
- focus/break transitions
- category
- optional linked task
- session persistence

## Important

Separate timer/domain logic from UI.

Do not put the entire timer algorithm inside one React component.

Use a reusable timer/session state layer.

## Acceptance

Test:

```text
start
pause
resume
complete
stop
skip
reset
```

A completed session should create exactly one valid focus record.

---

# DAY 5 — Focus Stats + XP + Level

## Goal

Connect real activity to motivation.

## Tasks

- calculate daily focus time from sessions
- prevent double counting
- implement XP awards
- derive level from total XP
- XP progress bar
- task completion XP
- focus completion XP
- basic revision/interview XP hooks for later
- subtle completion animation

## XP rules

Start with the PRD defaults.

Keep XP values configurable.

## Acceptance

Example:

```text
Complete a 25-minute focus session
→ focus total increases
→ XP increases once
→ level progress updates
```

Repeated UI events must not double-award XP.

---

# DAY 6 — REVISION ENGINE: DOMAIN LOGIC

## Goal

Build the most important system before worrying about the polished revision UI.

## Tasks

Implement deterministic scheduling function.

Input:

```text
learnedAt = YYYY-MM-DD
```

Output:

```text
Day 1
Day 3
Day 7
Day 15
Day 30
```

Example:

```text
2026-09-13
→ 2026-09-14
→ 2026-09-16
→ 2026-09-20
→ 2026-09-28
→ 2026-10-13
```

## Implement

- RevisionItem creation
- exactly 5 checkpoints
- interval constants
- date-only handling
- user timezone handling
- database persistence
- unique constraints/idempotency strategy
- completion service
- due/upcoming/overdue classification

## Critical rule

Completion timestamp must NEVER become the anchor for later checkpoints.

## Acceptance

Unit tests exist before moving on.

---

# DAY 7 — REVISION UI + FULL REVISION TESTING

## Goal

Turn the revision engine into a complete user workflow.

## Tasks

Revision page:

```text
Due Today
Overdue
Upcoming
Completed
```

Revision detail:

- topic
- notes
- resources
- tags
- category
- current checkpoint
- due date
- mark as revised

Creation flow:

- topic
- learned date
- notes
- source
- tags
- category

After creation show:

```text
Day 1
Day 3
Day 7
Day 15
Day 30
```

## Implement

- completion feedback
- next checkpoint display
- confirmation before changing learned date
- recalculation after learned date edit
- delete behavior
- dashboard due count
- dashboard upcoming preview

## Mandatory tests

- Day 1
- Day 3
- Day 7
- Day 15
- Day 30
- month boundary
- year boundary
- overdue
- completing overdue
- duplicate creation
- repeated completion
- edited learned date
- deletion
- timezone boundary
- exact dashboard due count
- original anchor remains unchanged

## Stop condition

Do NOT continue to another major feature if revision tests are failing.

---

# DAY 8 — Interview Question Engine

## Goal

Build daily interview practice.

## Tasks

- question model
- seed/original question bank structure
- 200–500 question target can be populated progressively
- 5 questions/day
- deterministic daily selection strategy
- MCQ
- true/false
- short-answer support where appropriate
- answer submission
- correct/incorrect result
- explanation
- topic
- difficulty
- XP
- attempt persistence

## Suggested topic groups

```text
DSA
C++
OOP
DBMS
OS
CN
JavaScript
Backend
SQL
APIs
Aptitude
Logical Reasoning
Probability
Percentages
Time/Work
Number Systems
```

## Acceptance

User can complete:

```text
5 questions
→ each attempt stored
→ accuracy calculated
→ XP awarded once
```

---

# DAY 9 — Interview Weak Areas + External Practice

## Goal

Connect interview results to learning.

## Tasks

- topic accuracy
- recent accuracy
- weak-topic detection
- weak-topic UI
- Add to Revision action
- external More Practice section
- configurable external resource links

## Important

Do not automatically create revisions for every wrong question.

Use:

```text
[ Add to Revision ]
```

## External resource rules

- no core dependency
- no brittle scraping
- source links configurable
- external-source failure should not break interview page

## Acceptance

Example:

```text
User repeatedly misses DBMS questions
→ DBMS appears as weak area
→ app suggests relevant concepts
→ user can manually add a concept to Revision
```

---

# DAY 10 — Project Library

## Goal

Build the internal project-learning system.

## Tasks

Curated project model:

- name
- description
- difficulty
- duration
- stack
- categories
- what you'll learn
- stages
- resources

Project stages:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

Implement:

- browse
- search
- filter
- project detail
- stage progress
- completion percentage
- My Projects section

## Example project

```text
URL Shortener

1. Basic API
2. Database
3. Auth
4. Analytics
5. Redis
6. Rate limiting
7. Deployment
```

## Acceptance

User can:

```text
open project
→ start stage
→ complete stage
→ see project progress
```

---

# DAY 11 — Nightly Flow + Journal + Tomorrow Planning

## Goal

Complete the PLAN → FOCUS → LEARN → REVISE → REFLECT loop.

## Step 1

Read-only day summary:

- focus
- tasks
- revisions
- interview
- XP
- streak

## Step 2

Journal:

```text
What went well?
What went badly?
What did I learn?
What should I improve tomorrow?
```

## Step 3

Plan tomorrow:

- max 3 priorities
- optional additional tasks

## Acceptance

User can finish a day and create tomorrow's plan without navigating through multiple unrelated pages.

---

# DAY 12 — Progress + Rewards + Streaks + Quotes

## Goal

Add the remaining personal motivation layer.

## Progress

Implement:

- weekly focus
- session count
- revisions
- interview questions
- tasks
- streak
- daily focus chart
- category breakdown
- revision completion
- interview accuracy
- task completion

## Rewards

Implement user-defined rewards.

Example:

```text
Cold coffee
Requirement: 3h focus
```

## Streaks

Implement:

- daily activity
- focus streak
- revision streak

No punishment for missed days.

## Quotes

Implement:

- quote model/config
- categories
- enable/disable
- sparing display

---

# DAY 13 — Local Music

## Goal

Add the media layer without touching core business logic.

## Tasks

- local file selection
- Focus playlist
- Break playlist
- audio player state
- play/pause
- volume
- next/previous
- loop
- shuffle
- focus → break transition
- break → focus transition
- stopping session stops music

## Important

Do not upload user music to your server.

## Acceptance

```text
Focus starts
→ focus music plays

Focus ends
→ break music plays

Break ends
→ next focus resumes/starts

Stop session
→ music stops
```

---

# DAY 14 — Browser Extension

## Goal

Create the floating timer.

## Tasks

- Manifest V3
- extension UI
- timer display
- session type
- category
- pause/resume
- stop
- same visual language
- compact preset
- comfortable preset
- custom settings foundation
- connection/sync to main app

## Critical

The extension must NOT maintain an independent timer algorithm.

It should communicate with the application's canonical focus-session state.

## Test

```text
Start on web
→ extension reflects session

Pause on extension
→ web reflects pause

Stop on web
→ extension reflects stopped state
```

---

# DAY 15 — Polish, Reliability, Deployment

## Goal

Turn the MVP into something you can actually keep using.

## Bug pass

Check all core flows:

```text
Planner
Focus
XP
Revision
Interview
Projects
Journal
Rewards
Progress
Music
Extension
```

## UI pass

- spacing consistency
- typography
- panel transparency
- day/night theme
- background contrast
- responsive layouts
- animation restraint

## Accessibility

- keyboard navigation
- focus states
- contrast
- reduced motion
- labels
- color-independent status

## Performance

Check:

- unnecessary rerenders
- large bundle additions
- image/background sizes
- database queries
- loading states

## Final verification

Run:

```text
typecheck
lint
tests
production build
```

Then test the complete daily loop:

```text
PLAN
↓
FOCUS
↓
LEARN
↓
REVISE
↓
REFLECT
↓
PLAN TOMORROW
```

---

# Optional Days 16–20

Use these only if needed.

## Day 16 — Revision hardening

- more edge cases
- timezone/device date testing
- migration safety
- idempotency review
- database constraint review

## Day 17 — UX refinement

- dashboard hierarchy
- navigation
- mobile adaptation
- loading states
- error states

## Day 18 — Extension refinement

- customization controls
- persistence
- reconnection
- edge cases

## Day 19 — External content refinement

- project provider abstraction
- configurable links
- better source cards
- fallback behavior
- manual review workflow

## Day 20 — Portfolio/deployment pass

- README
- architecture diagram
- screenshots
- environment setup
- deployment
- database migration process
- clean Git history

---

# What NOT to Do During the Build

Do not allow Claude to:

- rewrite the whole application because of one bug
- replace the chosen stack without reason
- create an Express backend beside Next.js
- add Redux/Zustand unless actually needed
- introduce Redis
- introduce Docker just for the sake of using Docker
- build authentication before V1 needs it
- build a CMS
- scrape external websites as a core feature
- generate thousands of interview questions
- auto-create revisions from every wrong MCQ
- recalculate revision schedules from completion dates
- store revision schedules only in React state
- create unnecessary admin/history pages
- spend a full day polishing animation while core behavior is broken

---

# Claude Session Prompt Template

Copy this for every session and replace the bracketed parts.

```text
You are continuing development of an existing application.

Read these files first:
- PRD.md
- design.md
- BUILD_PLAN.md

Current task:
[DAY X — TASK NAME]

Scope:
[PASTE THE TASKS FROM THIS DAY]

Rules:
1. PRD.md is the product source of truth.
2. design.md is the visual source of truth.
3. BUILD_PLAN.md controls implementation order.
4. Work only on today's scope.
5. Do not rewrite unrelated working code.
6. Inspect the existing codebase before making changes.
7. Reuse existing components, utilities, types, database models, and design tokens.
8. Do not introduce new infrastructure/dependencies unless required.
9. Preserve existing functionality.
10. If you discover a problem outside today's scope, document it instead of expanding scope unless it blocks today's work.

Implementation requirements:
- Follow the existing architecture.
- Keep business/domain logic separate from presentation where practical.
- For critical data operations, make repeated requests safe/idempotent.
- Handle errors explicitly.
- Keep types strict.
- Do not use mock data where the feature is supposed to use persisted application data.

Testing requirements:
- Run the relevant unit/integration tests.
- Run typecheck and lint when appropriate.
- Run a production build for major milestone sessions.
- Fix issues introduced by this session.

Before finishing:
1. Verify today's acceptance criteria.
2. Tell me which files changed.
3. Tell me exactly what you tested.
4. Tell me any known limitations.
5. Do NOT start the next day/phase automatically.

IMPORTANT:
The Revision Engine is a critical correctness feature.
Never change its scheduling semantics without explicitly checking PRD.md.
Revision checkpoints are anchored to the original learnedAt date:
Day 1, Day 3, Day 7, Day 15, Day 30.
Do not calculate the next revision from completionDate in V1.
```

---

# Revision-Specific Claude Prompt

Use this whenever working on the revision engine.

```text
Focus ONLY on the Revision Engine.

Read:
- PRD.md
- design.md
- BUILD_PLAN.md

This is a high-priority correctness system.

Requirements:
- persist RevisionItem
- persist exactly 5 RevisionCheckpoint records
- intervals are 1, 3, 7, 15, 30 days
- dates are anchored to learnedAt
- completion does not shift future checkpoints
- overdue checkpoints remain actionable
- duplicate creation is prevented
- repeated completion is idempotent
- XP is not awarded twice
- editing learnedAt requires confirmation and recalculates the schedule
- deleting an item removes it from active revision views/analytics
- date handling must be timezone-safe
- dashboard due count must be accurate

Before implementing UI polish:
1. implement domain logic
2. write tests
3. run tests
4. test month/year boundaries
5. test repeated requests
6. test overdue completion
7. test edited learnedAt
8. verify exact dates

Do not move to another feature.
```

---

# Suggested Git Milestones

Commit after each completed day/major milestone.

```text
day-01-foundation
day-02-database
day-03-planner-dashboard
day-04-focus
day-05-xp
day-06-revision-engine
day-07-revision-ui-tests
day-08-interview
day-09-interview-weak-areas
day-10-projects
day-11-journal-nightly-flow
day-12-progress-rewards
day-13-music
day-14-extension
day-15-polish
```

Do not commit broken revision logic just because the day ended.

---

# Definition of Done

The project is not "done" because all pages exist.

The V1 is done when:

- core user flows actually work
- data persists after refresh
- revision schedules are correct
- repeated operations do not duplicate data/XP
- planner/focus/revision/interview state is reliable
- analytics match underlying data
- extension does not drift from the main timer
- external sources are optional
- UI is readable over the background artwork
- the app works without RPG mechanics
- production build succeeds
- critical tests pass

---

# Final Daily Loop Test

After the build is stable, simulate one realistic day:

```text
1. Create tomorrow's priorities
2. Start a focus session
3. Complete a task
4. Earn XP
5. Answer 5 interview questions
6. Create a new revision topic
7. Verify Day 1/3/7/15/30 schedule
8. Complete one revision
9. Inspect dashboard
10. Write journal
11. Plan tomorrow
12. Check progress
13. Start another focus session from extension
```

If the whole loop feels fast, reliable, and pleasant, the app is doing its job.
