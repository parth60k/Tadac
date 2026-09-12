# Tadac — Personal Productivity & Learning App

> *A beautiful 2D anime/pixel-art game interface that happens to contain a serious productivity system.*

Tadac is an all-in-one personal productivity and learning web application explicitly designed for college students. It provides a distracted-free, highly atmospheric environment to plan your day, run Pomodoro sessions, practice technical interviews, manage projects, and use deterministic spaced repetition for long-term learning.

## 🎯 Core Loop
`PLAN → FOCUS → LEARN → REVISE → REFLECT → PLAN TOMORROW`

## ✨ Features

- **Daily Dashboard**: A quick snapshot of your day's tasks, revision items, focus progress, and interview practice status.
- **Glassmorphism Interface**: Set against dynamic anime / pixel-art 2D environments (Day & Night scenes), ensuring the experience feels immersive yet highly productive without leaning into unnecessary RPG mechanics.
- **Planner & Tasks**: Intuitive task management to help structure your day and prepare for the next.
- **Focus Timer**: Customizable Pomodoro sprints to help you deep dive into work.
- **Revision Engine**: A deterministic spaced repetition system anchoring checkpoints at Day 1, 3, 7, 15, and 30 to help you remember topics permanently.
- **Interview Prep**: Curated daily questions spanning DSA, OOP, DBMS, OS, logic, and more.
- **Project Tracking**: Follow detailed step-by-step software project build plans to level up your technical implementation skills.
- **Personal Rewards & Journaling**: Level up your XP, unlock custom personal real-world rewards, and reflect on what you learned at night.

## 💻 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables for Theming
- **Database**: SQLite
- **ORM**: Prisma
- **Icons**: Lucide React
- **Animations**: Framer Motion & CSS keyframes

## 🚀 Getting Started

First, install the required dependencies:
```bash
cd tadac-app
npm install
```

Set up your Prisma database:
```bash
npx prisma db push
```

Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design Philosophy
*"If a visual decision makes something harder to read, slower to operate, or more error-prone: choose usability."*

Tadac avoids convoluted "gamification" tricks (no combat, no fantasy currency, no random stats). Instead, it uses atmospheric background elements (drifting clouds, starry nights, warm desk lamps) alongside clean frosted glass panels to make doing serious work a highly pleasant experience.

## 📜 Documentation
- Complete Product Requirements: [`PRD_v3 (1).md`](./PRD_v3%20(1).md)
- Complete UI/UX Specification: [`design_v2 (1).md`](./design_v2%20(1).md)
- Step-by-Step Implementation Map: [`BUILD_PLAN (1).md`](./BUILD_PLAN%20(1).md)
