# Product Requirements Document
## Personal Productivity & Learning App

**Version:** 3.0  
**Status:** Build specification  
**Document purpose:** Single source of truth for product behavior, architecture, MVP scope, and acceptance criteria.

---

## 0. Product Definition

A personal productivity and learning web app for a college student who wants one place to:

- plan the day and plan tomorrow the night before
- run focused work sessions
- learn and track software projects
- practice daily interview / aptitude questions
- revise topics using deterministic spaced repetition
- journal and reflect
- see useful progress statistics
- earn light XP and levels from real activity
- create personal real-life rewards
- use a lightweight floating browser timer

The interface is visually inspired by **2D anime / pixel-art environments**, but the product is **not an RPG**.

There are no:

- quests
- combat
- HP
- weapons
- enemies
- fantasy inventory
- fantasy currency
- forced gameplay mechanics

The visual style is a shell around a serious productivity system.

### Core loop

```text
PLAN → FOCUS → LEARN → REVISE → REFLECT → PLAN TOMORROW → repeat
```

### Primary product principle

> Make productivity pleasant enough to reopen every day without making productivity itself another game.

---

# 1. Goals

## 1.1 Product goals

The app must let the user:

1. quickly see what matters today
2. plan and reorder tasks
3. run a focus timer and track real focus time
4. create revision topics and receive reliable Day 1/3/7/15/30 checkpoints
5. complete daily interview practice and understand weak areas
6. discover projects and progressively track project stages
7. reflect at night and plan tomorrow
8. see useful progress without digging through raw logs
9. personalize music, quotes, appearance, rewards, and timer settings
10. use the same focus session from the web app and browser extension

## 1.2 Non-goals

Do not build in V1:

- multi-user social features
- public profiles
- social feeds
- chat
- AI therapist / AI journal analysis
- generic AI motivational spam
- microservices
- queues
- separate auth infrastructure
- full CMS
- large manually maintained content database
- raw session-history/admin tables
- RPG gameplay systems

---

# 2. Target User

A college student balancing:

- coursework
- DSA / competitive programming
- interview preparation
- software projects
- internships
- fitness / personal life

The product must be fast and low-maintenance.

The user should not spend more time maintaining the productivity system than actually doing the work.

---

# 3. Platform and Scope

## 3.1 Main web app

Core surfaces:

- Home
- Planner
- Focus
- Interview
- Revision
- Projects
- Progress
- Rewards
- Journal
- Settings

## 3.2 Browser extension

Desktop-first, built after the core application is stable.

The extension provides:

- floating timer
- session type
- category
- pause / resume / stop
- optional music controls
- synchronization with the main application

Use Manifest V3.

The extension must never become a second implementation of business logic. It should communicate with the same application state/API.

---

# 4. Information Architecture

Primary navigation:

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

The browser extension exists outside this navigation.

The main app should support keyboard-friendly navigation and direct links to important states, especially:

- today's revisions
- today's interview
- current focus session
- tomorrow's plan

---

# 5. Core Functional Requirements

# 5.1 Home / Dashboard

The Home screen is a current-day snapshot.

Show:

- greeting
- current date
- level + XP progress
- today's focus progress
- today's important tasks
- revisions due today
- short upcoming revision list
- today's interview challenge status
- motivational quote when enabled
- prominent Start Focus action

Example:

```text
Good evening, Parth.

LV 12             1840 / 2000 XP
Focus             02h 42m / 03h

TODAY
✓ Complete backend assignment
○ Solve 3 DSA problems
○ Review PostgreSQL joins

REVISION
3 due today
2 upcoming

INTERVIEW
3 / 5 completed

[ Start Focus ]
```

### Rules

- Hide empty sections instead of showing unnecessary zero-state cards.
- Keep the dashboard dense enough to be useful but not visually noisy.
- Start Focus must remain visually prominent.
- Do not turn the dashboard into a raw database table.

---

# 5.2 Planner

Planner is a normal productivity planner.

No RPG terminology.

## Task fields

- id
- title
- description
- scheduled date
- scheduled time (optional)
- priority
- category
- estimated duration
- completion status
- optional deadline
- sort/order position
- createdAt
- updatedAt

## Categories

- Development
- DSA
- College
- Interview
- Revision
- Personal
- Other

## Actions

- add
- edit
- delete
- complete
- reorder
- prioritize
- reschedule

## Views

- Today
- Tomorrow
- Week
- Calendar

## Tomorrow planning

The nightly flow should support:

- up to 3 priority tasks
- optional additional tasks

These become the next day's planner items automatically.

---

# 5.3 Focus / Pomodoro

## Presets

- 25 / 5
- 50 / 10
- 60 / 10
- 90 / 20
- Custom

Custom mode supports:

- focus duration
- short break
- long break
- cycle count

## Controls

- start
- pause
- resume
- stop
- skip break
- reset

## Session data

Store:

- id
- start time
- end time
- duration
- session type
- category
- linked task (optional)
- completion status
- createdAt

## Completion

On completed focus session:

- show duration
- show XP earned
- show category
- show updated daily focus total

Use an understated transition only.

No confetti or large game-style celebration.

## Focus total

Daily focus time is derived from completed focus sessions.

The system must avoid double-counting resumed or stopped sessions.

---

# 5.4 Music

Phase 4.

Two local libraries:

- Focus
- Break

V1 uses the browser's HTML5 Audio API.

No server upload by default.

## Behavior

```text
Focus starts
    ↓
Focus music plays

Focus ends
    ↓
Focus music stops
    ↓
Break music starts

Break ends
    ↓
Break music stops
    ↓
Next focus starts / resumes
```

Stopping a focus session stops playback.

Controls:

- play / pause
- volume
- next
- previous
- shuffle
- loop
- playlist selection

Music settings are personal and should persist locally.

---

# 5.5 Daily Interview Questions

The user receives **5 questions/day by default**.

## Topics

Technical:

- DSA
- C++
- OOP
- DBMS
- Operating Systems
- Computer Networks
- JavaScript
- Backend
- SQL
- APIs

Non-technical:

- aptitude
- logical reasoning
- probability
- percentages
- time/work
- number systems

## Question formats

- MCQ
- true/false
- short answer where appropriate

## V1 content strategy

Do NOT maintain a giant question database.

Use a small curated internal seed set for the tracked daily experience.

Recommended starting size:

```text
200–500 high-quality questions
```

Question records should include:

- id
- question
- options where applicable
- correct answer
- explanation
- topic
- difficulty
- format
- optional tags

The internal set is intentionally small and maintainable.

## External practice

Add a **More Practice** area that links users to relevant external resources.

External resources are supplementary.

They must not be required for the core daily interview flow.

Do not scrape external websites by default.

Prefer:

1. official APIs/feeds when available
2. stable public resource links
3. curated links maintained in config

Do not make the app depend on external content being available.

## Daily attempt flow

```text
Question
   ↓
Answer
   ↓
Correct / Incorrect
   ↓
Explanation
   ↓
Topic + difficulty
   ↓
XP
   ↓
Next question
```

## Weak area detection

Track:

- attempts
- correct answers
- accuracy
- topic accuracy
- recent incorrect attempts

The system may show:

```text
Weak area: DBMS

Consider revising:
• Normalization
• Transactions
• Indexing
```

Do not auto-create revision records for every wrong answer.

Provide:

```text
[ Add to Revision ]
```

so the user explicitly chooses what to revise.

---

# 5.6 Revision Engine — CRITICAL FEATURE

This is the most important learning-system feature.

Revision logic must be deterministic, persistent, timezone-safe, and thoroughly tested.

## Scheduling rule

When a user creates a revision item on Day 0, the system schedules exactly five checkpoints:

```text
Day 1
Day 3
Day 7
Day 15
Day 30
```

Example:

```text
Learned: September 13

Revision 1 → September 14
Revision 2 → September 16
Revision 3 → September 20
Revision 4 → September 28
Revision 5 → October 13
```

## Critical scheduling rule

All due dates are based on the **original learning date**.

Completing a revision does **not** shift the remaining checkpoints.

Example:

```text
Original learning date: Sep 13

R1 → Sep 14
R2 → Sep 16
R3 → Sep 20
R4 → Sep 28
R5 → Oct 13
```

Even if R2 is completed on Sep 18, R3 remains Sep 20.

Do not use:

```text
nextDue = completionDate + interval
```

for V1.

Use the original Day 0 anchor.

## Revision item fields

- id
- topic
- notes
- source/reference
- learnedAt
- tags
- category
- createdAt
- updatedAt
- checkpoints

## Checkpoint fields

Each checkpoint contains:

- sequence number: 1–5
- interval days: 1, 3, 7, 15, 30
- dueDate
- status
- completedAt

Recommended statuses:

- PENDING
- COMPLETED

For UI presentation, calculate:

- Upcoming
- Due Today
- Overdue
- Completed

Do not make "MISSED" a destructive terminal state.

An overdue checkpoint should remain actionable until completed.

## Important persistence rule

Revision checkpoints must be persisted in the database.

Do not recalculate the entire schedule only on the frontend.

The frontend may calculate presentation states such as "due today", but the authoritative schedule must exist in stored data.

## Duplicate prevention

Creating the same revision item once should create exactly one five-checkpoint schedule.

Repeated clicks / retries must not create duplicates.

Marking the same checkpoint complete multiple times must not:

- create another checkpoint
- create duplicate history
- award XP repeatedly

Use an idempotent completion operation.

## Editing learned date

If the user edits the original learning date:

- recalculate all future checkpoint dates from the new Day 0 anchor
- preserve the checkpoint sequence
- clearly show that the schedule changed

The application must ask for confirmation before performing a schedule-changing edit.

## Deleting a revision item

Deleting the parent revision item removes or archives its checkpoints according to the chosen persistence strategy.

Deleted items must no longer appear in:

- Due Today
- Upcoming
- analytics
- revision counts

## Timezone handling

Revision dates are calendar dates from the user's configured/local timezone.

Do not accidentally shift a revision by one day because of UTC conversion.

Tests must cover:

- timezone boundary around midnight
- daylight-saving environments if the implementation ever supports them
- browser/device timezone changes

For a date-only schedule, store a canonical date representation or consistently normalize based on the configured user timezone.

## Dashboard behavior

Show:

```text
3 revisions due today
```

and a short upcoming list.

## Revision page

Sections:

```text
Due Today
Overdue
Upcoming
Completed
```

Each item should show:

- topic
- revision number
- due date
- category/tags
- short notes preview

Clicking an item opens:

```text
Topic
Notes
Resources
Revision checklist

[ Mark as revised ]
```

After completion:

```text
✓ Revision completed

Next:
September 28
Revision #4
```

## Revision testing requirements

Unit/integration tests are mandatory.

Minimum test matrix:

1. Day 1 due date
2. Day 3 due date
3. Day 7 due date
4. Day 15 due date
5. Day 30 due date
6. learned date at month boundary
7. learned date at year boundary
8. overdue checkpoint
9. completing overdue checkpoint
10. repeated completion attempts
11. duplicate create attempts
12. edited learned date
13. deleted item
14. timezone boundary
15. dashboard due-count accuracy
16. full schedule remains anchored to Day 0

The revision engine should be implemented and tested before polishing the visual revision page.

---

# 5.7 Project Library

The Projects section has two content layers.

## A. Curated projects

These are stored locally and provide the detailed build experience.

Each curated project includes:

- name
- description
- difficulty
- estimated duration
- stack
- categories
- what you'll learn
- ordered build stages
- resources
- optional prerequisites

Example:

```text
URL Shortener

Stage 1 — Basic API
Stage 2 — Database
Stage 3 — Authentication
Stage 4 — Analytics
Stage 5 — Redis
Stage 6 — Rate limiting
Stage 7 — Deployment
```

Each stage has:

- not started
- in progress
- completed

Project progress belongs to the user and must never be lost if external sources change.

## B. External discovery

Provide:

```text
EXPLORE / TRENDING
```

Use external sources for discovery rather than rebuilding their entire content.

Initial sources:

- roadmap.sh Projects
- GitHub Trending

roadmap.sh provides an actively maintained project-ideas catalog with categories such as Backend, DevOps, JavaScript, Node.js, SQL, React, Docker, Redis, and others. GitHub Trending exposes repositories the community is currently most excited about and supports Today / This week / This month views.

Use external sources as discovery/content links.

Do not scrape blindly.

If an official API/feed is available, prefer it. Otherwise, use stable curated links or manually reviewed imports.

## External-source record

If external items are eventually stored locally, support:

- sourceName
- sourceUrl
- externalId (optional)
- title
- summary
- technology
- difficulty
- tags
- lastFetchedAt
- contentHash (optional)
- importedAt

Never make external items authoritative for user progress.

## Failure isolation rule

If an external source is unavailable:

- Home still works
- Planner still works
- Focus still works
- Revision still works
- Interview history still works
- Project progress still works

External content is a content source, not a core dependency.

---

# 5.8 Rewards

User-created real-life rewards.

Examples:

```text
Cold coffee — 3h focus today
Night ride — 4h focus today
Gaming — complete today's 3 priorities
```

Fields:

- name
- description
- requirement
- XP cost or condition
- redeemed state
- createdAt
- updatedAt

No built-in reward shop.

---

# 5.9 Nightly Flow

Combine the end-of-day flow into one guided, skippable experience.

## Step 1 — Day summary

Read-only summary:

- focus time
- tasks completed
- revisions completed
- interview questions completed
- XP earned
- streak

## Step 2 — Journal

Prompts:

- What went well?
- What went badly?
- What did I learn?
- What should I improve tomorrow?

Plain private writing.

No AI therapist or forced analysis.

## Step 3 — Plan tomorrow

- up to 3 priorities
- optional extra tasks

The user can stop after any step.

---

# 5.10 Progress / Analytics

One useful progress page.

No raw session-history table.

## Weekly summaries

- total focus time
- session count
- revisions done
- interview questions completed
- tasks completed/planned
- current streak

## Charts / views

- daily focus hours
- weekly focus hours
- category breakdown
- revision completion rate
- interview accuracy
- task completion
- best focus day

Charts must remain readable and visually consistent with the design system.

---

# 5.11 XP and Levels

XP is optional motivation, not the purpose of the app.

Suggested configurable values:

```text
Focus session completed      25–35 XP
Task completed               10 XP
Interview question           10 XP
Revision completed           15 XP
Project milestone            50 XP
Daily planning               10 XP
Journal entry                10 XP
```

Level is computed from cumulative XP.

Do not create a separate level table for derived level state.

Cosmetic unlocks only:

- themes
- background variants
- widget styles
- avatar/character customization

Never unlock gameplay advantages.

---

# 5.12 Streaks

Track:

- daily activity streak
- focus streak
- revision streak

Rules:

- streaks reward consistency
- missed days are not punished
- do not gate core functionality behind streaks
- streak protection/freeze can be added later

---

# 5.13 Motivational Quotes

Show sparingly:

- dashboard
- before focus
- occasional rough-day state

Categories:

- stoic
- discipline
- focus
- bad day
- comeback
- anime-inspired
- custom

Allow the user to disable quotes.

Avoid large copyrighted dialogue excerpts.

---

# 5.14 Settings

## Timer

- presets
- custom durations
- auto-start behavior

## Music

- playlists
- volume
- shuffle
- loop

## Appearance

- theme
- day/night background
- panel transparency
- animation intensity

## Widget

Presets:

- Compact
- Comfortable
- Custom

Advanced controls:

- opacity
- blur
- gradient intensity
- width
- height
- font size
- border radius
- border
- position

## Notifications

- revision reminder
- interview reminder
- focus completion
- nightly planning reminder

## Quotes

- enabled/disabled
- categories

## XP

- XP values
- level curve

---

# 6. Browser Extension

Build only after the web app's focus state and persistence are reliable.

## Widget

Example:

```text
╭────────────────────╮
│  38:42             │
│  Backend           │
│  ▶ Pause   ■ Stop  │
╰────────────────────╯
```

Must show:

- timer
- session type
- category
- pause/resume/stop

Optional:

- music controls

## Synchronization

The extension and web app must read/write the same focus session state.

Starting a timer in the web app should be reflected in the extension.

Stopping it in one surface should stop it in the other.

Do not maintain separate timers that can drift.

## Visual behavior

- compact
- translucent
- unobtrusive
- never fully opaque
- readable over a code editor, browser page, or PDF

---

# 7. Data Model

Use a relational database even for the single-user application.

Recommended core entities:

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

A separate RevisionCheckpoint entity is preferred over a loosely structured array because revision correctness is a critical product requirement.

## Important invariants

### Revision

For every RevisionItem:

```text
exactly 5 checkpoints
intervals = [1, 3, 7, 15, 30]
```

### Interview attempt

Each question attempt is stored exactly once per submission event.

### Focus

Completed focus duration must not be counted twice.

### Project progress

ProjectStageProgress belongs to user progress, not to the external source record.

### XP

XP awards should be idempotent where a repeated UI request could otherwise double-award XP.

---

# 8. Technical Architecture

## Recommended stack

- Next.js or another single full-stack React framework
- TypeScript
- React
- Tailwind CSS
- Prisma or Drizzle
- SQLite for initial single-user V1
- PostgreSQL-ready schema and migration strategy
- Framer Motion
- HTML5 Audio API
- Recharts
- Manifest V3 extension

## Architecture principles

- one full-stack app
- no microservices
- no message queue
- no separate auth server
- one source of truth for business logic
- server-side persistence for critical state
- deterministic server/domain functions for scheduling
- client components focus on UI and local interaction
- external content isolated behind adapters/config

---

# 9. External Content Architecture

External content should be separated from core product data.

```text
                CORE APPLICATION
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
     Planner        Revision       Focus
        |              |              |
        +--------------+--------------+
                       |
                  App Database
                       |
                 +-----+-----+
                 |           |
                 v           v
            Interviews    Projects
                 |           |
          curated seed    curated seed
                 |           |
                 +-----+-----+
                       |
                 External discovery
                 /               \
        roadmap.sh              GitHub
```

The external sources provide ideas/resources.

They do not own:

- user progress
- revision history
- interview attempt history
- XP
- planner data
- journal data

---

# 10. Reliability Requirements

## Critical

Revision scheduling must be deterministic.

The same input must always produce the same five dates.

Example:

```text
learnedAt = 2026-09-13

=> [2026-09-14, 2026-09-16, 2026-09-20,
    2026-09-28, 2026-10-13]
```

## Idempotency

The following actions must be safe against repeated requests:

- create revision schedule
- complete revision checkpoint
- complete focus session
- award activity XP

## Time handling

Use a single documented timezone policy.

Never mix date-only values with timestamps carelessly.

---

# 11. MVP

MVP is complete when the user can:

1. open the dashboard
2. see today's focus/revision/interview/task state
3. create tasks
4. plan tomorrow
5. start and complete a focus session
6. see accurate daily focus time
7. earn XP
8. receive daily interview questions
9. record interview attempts
10. create a revision item
11. receive exact Day 1/3/7/15/30 checkpoints
12. complete a revision checkpoint
13. see due and overdue revisions
14. browse curated projects
15. track project stages
16. write a nightly journal entry
17. create a reward
18. see progress summaries

Music and browser extension are post-MVP phases.

---

# 12. Build Order

## Phase 1 — Foundation

- app shell
- design tokens
- navigation
- database
- dashboard
- planner
- focus timer
- focus persistence
- XP

## Phase 2 — Learning Core

- interview question engine
- interview attempts
- weak-topic summaries
- revision domain model
- revision schedule generation
- revision completion
- revision tests
- project library
- project stage progress

**Revision tests must pass before moving on.**

## Phase 3 — Personal Flow

- nightly flow
- journal
- tomorrow planning
- rewards
- quotes
- progress analytics
- streaks

## Phase 4 — Media

- local music
- focus/break playlist behavior
- audio settings

## Phase 5 — Browser Extension

- floating timer
- synchronization
- customization

## Phase 6 — Polish

- day/night background improvements
- animation pass
- responsive fixes
- accessibility
- performance
- external content discovery integrations

---

# 13. Acceptance Criteria — Revision

A revision implementation is accepted only when:

### Creation

Given:

```text
topic = PostgreSQL JOINs
learnedAt = Sep 13
```

the system creates exactly five checkpoints:

```text
Sep 14
Sep 16
Sep 20
Sep 28
Oct 13
```

### Completion

If checkpoint #2 is completed on Sep 18:

```text
#2 = COMPLETED, completedAt = Sep 18
#3 = still due Sep 20
```

### Repeated completion

Sending the completion request twice does not create duplicate history or award duplicate revision XP.

### Overdue

If the user opens the app after Sep 20 and #3 is incomplete:

```text
#3 = OVERDUE in UI
dueDate remains Sep 20
```

The user can still complete it.

### Date editing

Changing learnedAt from Sep 13 to Sep 15 recalculates:

```text
Sep 16
Sep 18
Sep 22
Sep 30
Oct 15
```

after confirmation.

### Deletion

Deleted items are removed from due/upcoming views and analytics.

---

# 14. Acceptance Criteria — External Content

1. Core app functions without external sources.
2. External source failures do not break navigation or user data.
3. User progress is stored locally in the app.
4. Links are opened from the original source where appropriate.
5. No brittle scraping is required for MVP.
6. External integrations are isolated behind a provider/source layer.
7. The app can replace one source without rewriting the project/interview systems.

---

# 15. UX Principles

1. Fast, minimal clicks.
2. No complicated productivity metadata.
3. Dashboard hides empty sections.
4. Visual feedback over notification spam.
5. Missed days are not punished.
6. XP can be ignored without reducing product usefulness.
7. Visual style never harms readability.
8. Product language remains normal productivity language.
9. Critical workflows are more reliable than decorative features.
10. Revision correctness is more important than visual polish.
11. External content is additive, not foundational.

---

# 16. Explicit Do-Not-Build List

Do not build:

- RPG combat
- character battles
- quests
- HP
- inventory
- weapons
- fantasy currency
- enemies
- excessive particles
- giant animations
- generic SaaS dashboard cards
- raw session-history admin tables
- AI therapist
- AI motivational spam
- social feed
- social sharing
- unnecessary auth
- microservices
- giant CMS
- automatic revision creation for every wrong interview question
- brittle scraping as a core dependency

---

# 17. Future Expansion

Possible later additions:

- real authentication
- cloud sync
- PostgreSQL migration
- richer external source adapters
- adaptive interview recommendations
- company-specific interview sets
- more backgrounds
- dawn/dusk scenes
- revision rescheduling as an explicit advanced feature
- streak protection
- mobile app
- more detailed project recommendations

These are not required for V1.

---

# 18. External References

The project-discovery architecture should treat these as external sources rather than core dependencies:

- roadmap.sh Projects: https://roadmap.sh/projects
- GitHub Trending: https://github.com/trending

As of the current product planning pass, roadmap.sh exposes an actively maintained project-ideas catalog across technologies/categories, while GitHub Trending exposes currently popular repositories. These are discovery surfaces, not substitutes for user-owned project progress.

---
