# Design System
## Personal Productivity & Learning App

**Version:** 2.0  
**Purpose:** Visual/interaction specification for the application.  
**Companion document:** PRD.md

This document describes how the product should look and feel. Product behavior belongs in `PRD.md`.

---

# 1. Design Direction

## One-line brief

> A beautiful 2D anime/pixel-art game interface that happens to contain a serious productivity system.

The environment creates atmosphere.

The panels contain the actual product.

The app should feel like:

- calm
- immersive
- warm
- modern
- slightly nostalgic
- focused
- premium without looking corporate

It should NOT feel like:

- a generic SaaS admin dashboard
- a literal RPG
- a game HUD
- a fantasy game menu
- an over-animated productivity App

---

# 2. Fundamental Layering

Every main screen uses three visual layers.

## Layer 1 — Environment

A large 2D/pixel-art illustrated scene.

Examples:

- study desk
- bedroom/workspace
- library
- quiet street
- forest-side study environment

For V1 use two environments:

- Day
- Night

The environment is atmospheric and mostly static.

Allowed:

- subtle lamp flicker
- slow drifting particles
- very subtle cloud motion
- minor ambient movement

Not allowed:

- large moving characters
- distracting animations
- interactive controls directly on the background

## Layer 2 — Glass Panels

Actual UI sits above the scene.

Characteristics:

- translucent
- soft blur
- low-contrast border
- rounded corners
- restrained shadow
- strong text contrast

All interactive controls must live inside panels.

## Layer 3 — Overlay

Used for:

- modals
- drawers
- toasts
- completion feedback
- tooltips
- confirmation dialogs

---

# 3. Design Principle

If a visual decision makes something harder to read, slower to operate, or more error-prone:

> choose usability.

Especially for:

- revision dates
- timer controls
- task lists
- interview questions
- journal text
- project stages

Visual theme is secondary to correct behavior.

---

# 4. Color System

Define colors as CSS variables so day/night themes and future scenes can change without redesigning components.

```css
:root {
  --color-bg-day: #cfe8f3;
  --color-bg-night: #14192b;

  --panel-bg: rgba(255, 255, 255, 0.10);
  --panel-bg-night: rgba(20, 22, 40, 0.45);
  --panel-border: rgba(255, 255, 255, 0.18);

  --text-primary: #1c1f2b;
  --text-primary-night: #eef1fb;
  --text-secondary: rgba(28, 31, 43, 0.65);

  --accent: #f6a94c;
  --accent-soft: #ffe6c2;

  --success: #6fcf97;
  --due: #eb5757;
  --info: #6ba7ff;
}
```

Keep the palette intentionally small.

Do not invent a different color for every feature.

Category labels should use:

- icon
- subtle dot
- text

rather than giant colored badges.

---

# 5. Surfaces

## Panel

```css
border-radius: 18px;
backdrop-filter: blur(14px);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
```

Panels should feel like glass laid over the environment.

Avoid:

- hard white cards
- black opaque boxes
- thick borders
- excessive glow
- sharp corners

---

# 6. Typography

Use two fonts.

## Body font

Modern readable sans-serif.

Used for:

- paragraphs
- tasks
- buttons
- labels
- questions
- notes
- journal

## Pixel/display font

Used sparingly for:

- focus timer
- XP amount
- level badge
- streak number
- small section titles
- decorative numeric elements

Do not use pixel typography for long text.

Readability is more important than matching the theme.

---

# 7. Spacing

Use an 8px base unit.

```text
4px   tight icon-to-label gap
8px   internal spacing
16px  related elements
24px  between panels
32px  major section separation
```

Desktop main content:

- loose 12-column layout
- generous side margins
- maximum main content width around 1100–1200px
- environment art fills remaining space

---

# 8. Main Layout

Desktop:

```text
┌─────────────────────────────────────────────────────┐
│ environment / background                            │
│                                                     │
│   ┌─────────────── app content ────────────────┐   │
│   │ Nav / header                               │   │
│   │                                             │   │
│   │ Main panels                                 │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Do not stretch UI panels edge-to-edge on large displays.

The background should remain visible around the interface.

---

# 9. Navigation

Navigation should feel like a modern application, not a game menu.

Items:

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

Use simple line icons.

Suggested icon style:

- Lucide-like
- one consistent stroke weight
- clear at small sizes

Pixel-art icons are decorative only.

---

# 10. Dashboard Design

The dashboard should prioritize today's work.

Suggested hierarchy:

```text
Greeting / date

Level + XP              Focus progress

Today's tasks            Revisions due

Interview status         Quote

             [ START FOCUS ]
```

The Start Focus action should be visually dominant.

Avoid making every card equally loud.

---

# 11. Focus Screen

The timer is the visual center.

Example:

```text
            42:31

         BACKEND / FOCUS

        ─────────────
        progress ring
        ─────────────

       [ Pause ] [ Stop ]
```

Timer:

- largest pixel-font element
- high contrast
- simple ring/bar around it
- no game-style frame

Category/session label sits below it in the normal body font.

---

# 12. Timer States

## Running

- accent-colored progress
- subtle ambient panel emphasis

## Paused

- reduce motion
- visually clear paused state

## Completed

Use a brief:

- fade
- small scale transition
- XP text

Duration:

```text
~200–300ms
```

No confetti.

No large sound effects by default.

---

# 13. Planner Components

## Task row

```text
○  Solve 3 DSA problems      • DSA
```

Optional:

- time
- priority
- deadline

Completed:

```text
✓  Solve 3 DSA problems
```

Use:

- reduced opacity
- strike-through

Avoid:

- bouncing checkbox
- large success animation
- giant completion badges

---

# 14. Revision UI

Revision is a critical workflow and must look trustworthy.

## Due card

```text
┌─────────────────────────────────┐
│ PostgreSQL JOINs                │
│ Revision #3                     │
│ Due today                       │
│ DBMS · SQL                      │
│                                 │
│ [ Review ]                      │
└─────────────────────────────────┘
```

Status hierarchy:

- Due Today → strongest emphasis
- Overdue → clear warning
- Upcoming → quiet
- Completed → subdued

Do not visually hide an overdue revision.

## Revision detail

```text
POSTGRESQL JOINS

Notes
────────────────────────────
...

Resources
────────────────────────────
...

Revision #3
Due: Sep 20

[ Mark as revised ]
```

After completion:

```text
✓ Revision completed

Next:
Sep 28 · Revision #4
```

The next date must be displayed using the stored schedule.

Do not calculate a new date from the completion timestamp.

---

# 15. Revision Creation Flow

Keep creation simple.

Fields:

```text
Topic
Category
Date learned
Tags
Notes
Source / reference
```

After save, show:

```text
Revision schedule created

Day 1   Sep 14
Day 3   Sep 16
Day 7   Sep 20
Day 15  Sep 28
Day 30  Oct 13

[ Done ]
```

This is useful feedback because it lets the user immediately verify that the schedule is correct.

---

# 16. Interview UI

The question screen should be calm and readable.

```text
QUESTION 3 / 5
DBMS · Medium

Which normal form...

○ A
○ B
○ C
○ D

[ Submit ]
```

After answering:

```text
✓ Correct

Explanation
...

Topic: Normalization
Difficulty: Medium

+10 XP

[ Next ]
```

Incorrect answers should be clear but not punishing.

---

# 17. Weak Area UI

Example:

```text
DBMS
Accuracy: 60%

Weak topics:
Normalization
Transactions
Indexing

[ Add Normalization to Revision ]
```

Keep this recommendation optional.

Do not automatically generate multiple revision items from every mistake.

---

# 18. Project Library

Two visual zones:

## My Projects

Progress-oriented.

```text
URL Shortener
███████░░░ 70%

Booking System
███░░░░░░░ 30%
```

## Explore / Trending

Discovery-oriented.

```text
🔥 Explore

roadmap.sh
Project ideas across technologies

GitHub Trending
Currently popular repositories

[ Open ]
```

External source cards should visually communicate that the user is leaving the app.

Use an external-link icon.

---

# 19. Project Detail

Example:

```text
URL Shortener
Intermediate
Node.js · PostgreSQL · Redis

What you'll learn
...

BUILD STAGES

✓ 1. Basic API
✓ 2. Database
→ 3. Authentication
○ 4. Analytics
○ 5. Redis
○ 6. Rate limiting
○ 7. Deployment
```

Stages should feel like a checklist, not RPG quests.

---

# 20. Journal

Journal screens should be quieter than the dashboard.

Use:

- large readable text area
- generous padding
- minimal visual noise
- no animated particles near text

Prompts:

```text
What went well?

What went badly?

What did I learn?

What should I improve tomorrow?
```

No AI-generated response cards.

---

# 21. Nightly Flow

Three-step progress indicator:

```text
1 Summary  →  2 Reflect  →  3 Plan Tomorrow
```

Keep the flow skippable.

The user should always understand:

- where they are
- what is next
- how to exit

---

# 22. Progress Page

Charts should be simple.

Use:

- clean bar charts
- readable labels
- restrained accent use
- no unnecessary 3D graphics
- no huge decorative illustrations

Suggested layout:

```text
THIS WEEK

Focus       14h 32m
Sessions    18
Revisions   23
Interview   30
Tasks       42/51

[ Focus chart ]

[ Category breakdown ]

[ Revision completion ]

[ Interview accuracy ]
```

---

# 23. Rewards

Rewards should look personal rather than like an in-game shop.

```text
Cold coffee
Complete 3h focus today

[ Redeem ]
```

No gold coins.

No fantasy inventory.

No game-store UI.

---

# 24. XP / Level

XP can have a subtle visual language.

Example:

```text
LV 12

██████████░░░ 1840 / 2000 XP
```

Level-up:

- short glow
- subtle number transition

Do not use:

- fireworks
- giant banners
- full-screen celebration
- gameplay mechanics

---

# 25. Quote Card

Small, quiet panel.

Example:

```text
"Do the next useful thing."

— Custom
```

Rules:

- never full width
- never first visual focus
- body font
- dismissible
- optional

---

# 26. Browser Extension Widget

Small floating glass panel.

```text
╭────────────────────╮
│  38:42             │
│  Backend           │
│  ▶ Pause   ■ Stop  │
╰────────────────────╯
```

## Presets

### Compact

- small
- more transparent
- minimal chrome

### Comfortable

- slightly larger
- easier reading
- clearer border

### Custom

Advanced controls:

- opacity
- blur
- gradient
- width
- height
- font size
- border radius
- border
- position

Important:

> The content behind the widget must remain readable.

Never make the widget opaque enough to block a code editor or PDF.

---

# 27. Motion

Motion is subtle and purposeful.

## Panel entrance

```text
fade + 8–12px slide
150–200ms
```

## Progress

```text
ease-out fill
~400ms
```

## Completion

```text
fade + slight scale
200–300ms
```

## Background

Near-static.

Optional:

- slowly drifting particles
- very subtle lamp flicker
- slowly moving clouds

Avoid:

- screen shake
- bounce everywhere
- particle explosions
- looping decorative animation around text
- constant motion in journal/question screens

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

---

# 28. Responsive Design

## Desktop

Primary target.

Use:

- full environment
- multi-panel layout
- extension support

## Tablet

- reduce panel width
- simplify background visibility
- preserve readable spacing

## Mobile

The product should remain usable even if desktop is the priority.

Adapt:

- navigation to bottom/tab/drawer pattern
- timer remains prominent
- panels stack vertically
- background becomes less visually busy
- tables become cards

Do not merely shrink the desktop interface.

---

# 29. Accessibility

Minimum requirements:

- WCAG AA contrast where practical
- verify contrast against both day/night backgrounds
- keyboard navigation
- visible focus indicators
- semantic buttons and inputs
- labels for all form fields
- do not rely on color alone
- reduced-motion support
- readable text scaling
- sufficient hit targets

Pixel font should stay restricted to short strings.

---

# 30. States

Every important component should define:

- default
- hover
- focus
- active
- disabled
- loading
- success
- error
- empty

Critical screens additionally need:

- offline/fallback state where applicable
- overdue state
- permission state for local audio
- external-source unavailable state

---

# 31. Error Design

Errors should be useful and calm.

Prefer:

```text
Couldn't save this revision.
Your existing schedule is still unchanged.

[ Retry ]
```

Avoid:

```text
SYSTEM FAILURE!!!
```

No game-style error effects.

---

# 32. External Content Design

When showing content from external sources:

```text
External source
roadmap.sh

Project ideas and build guides

[ Open roadmap.sh ↗ ]
```

or:

```text
External source
GitHub Trending

Currently trending repositories

[ Open GitHub ↗ ]
```

The source should be clear.

Do not make external content visually appear as if it were authored by the app.

---

# 33. Background Art Direction

## Day

Mood:

- warm
- focused
- productive
- natural light

Possible scene:

- desk
- laptop
- books
- window
- trees / sky
- soft sunlight

## Night

Mood:

- calm
- late-night focus
- blue-toned
- warm desk lamp

Possible scene:

- same room
- dark window
- warm lamp
- subtle city/sky light

Art should be original or properly licensed.

Never copy a known game scene, map, character, UI, or logo.

---

# 34. Visual Restraint Rules

Never:

- use a new color for every category
- make every card glow
- animate every click
- use ornate fantasy borders
- put pixel art on every icon
- make the dashboard look like a game menu
- let the background compete with text
- sacrifice readability for atmosphere

---

# 35. Design QA Checklist

Before a screen is considered finished:

### Readability

- Can the user read every important value immediately?
- Is the background distracting?
- Is contrast sufficient?

### Interaction

- Can the user understand what is clickable?
- Are buttons consistent?
- Are hover/focus states clear?

### Motion

- Does animation help?
- Can it be disabled?
- Is anything moving unnecessarily?

### Consistency

- Same spacing scale?
- Same corner radius?
- Same icon style?
- Same accent?
- Same typography hierarchy?

### Product alignment

- Does it still feel like a productivity application?
- Is the game influence only visual?
- Is the screen faster than a conventional dashboard rather than slower?

---

# 36. Design North Star

The ideal result should feel like:

> "Someone who loves anime games designed a beautiful productivity system."

Not:

> "Someone turned a productivity app into an RPG."

The interface should make the user want to return.

The underlying system should remain serious, reliable, fast, and understandable.
