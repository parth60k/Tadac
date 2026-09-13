/**
 * Shared TypeScript domain types
 * These mirror the Prisma schema but are safe to import on both client + server.
 * Do NOT import @prisma/client here — that is server-only.
 */

// ─── Category ────────────────────────────────────────────────────────────────

export type Category =
  | 'Development'
  | 'DSA'
  | 'College'
  | 'Interview'
  | 'Revision'
  | 'Personal'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Development', 'DSA', 'College', 'Interview', 'Revision', 'Personal', 'Other',
];

// ─── Priority ─────────────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low';

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledDate: string;    // YYYY-MM-DD
  scheduledTime?: string;   // HH:MM
  priority: Priority;
  category: Category;
  estimatedMins?: number;
  deadline?: string;        // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;     // ISO string
  sortOrder: number;
  xpAwarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Pick<
  Task,
  'title' | 'scheduledDate' | 'priority' | 'category'
> & Partial<Pick<Task, 'description' | 'scheduledTime' | 'estimatedMins' | 'deadline'>>;

export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'scheduledDate' | 'scheduledTime' | 'priority' | 'category' | 'estimatedMins' | 'deadline' | 'completed' | 'sortOrder'>
>;

// ─── Focus Session ─────────────────────────────────────────────────────────────

export type SessionType = 'focus' | 'short_break' | 'long_break';
export type SessionStatus = 'active' | 'completed' | 'stopped';
export type FocusPreset = '25/5' | '50/10' | '60/10' | '90/20' | 'custom';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  preset: FocusPreset;
  sessionType: SessionType;
  category: Category;
  plannedMins: number;
  actualMins: number;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  xpAwarded: boolean;
  createdAt: string;
}

// ─── Revision ─────────────────────────────────────────────────────────────────

export type CheckpointStatus = 'PENDING' | 'COMPLETED';

// Presentation-only state derived from dueDate vs today
export type CheckpointView = 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED';

export const REVISION_INTERVALS = [1, 3, 7, 15, 30] as const;
export type RevisionInterval = typeof REVISION_INTERVALS[number];

export interface RevisionCheckpoint {
  id: string;
  revisionItemId: string;
  sequence: number;           // 1–5
  intervalDays: RevisionInterval;
  dueDate: string;            // YYYY-MM-DD
  status: CheckpointStatus;
  completedAt?: string;
  xpAwarded: boolean;
  createdAt: string;
  updatedAt: string;
  // Derived on the client
  view?: CheckpointView;
}

export interface RevisionItem {
  id: string;
  userId: string;
  topic: string;
  notes: string;
  source: string;
  category: Category;
  tags: string[];
  learnedAt: string;          // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  checkpoints: RevisionCheckpoint[];
}

export type CreateRevisionInput = {
  topic: string;
  learnedAt: string;          // YYYY-MM-DD — the Day 0 anchor
  notes?: string;
  source?: string;
  category?: Category;
  tags?: string[];
};

// ─── Interview ─────────────────────────────────────────────────────────────────

export type QuestionFormat = 'mcq' | 'true_false' | 'short_answer';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface InterviewQuestion {
  id: string;
  topic: string;
  subTopic: string;
  difficulty: QuestionDifficulty;
  format: QuestionFormat;
  question: string;
  options: string[];          // Parsed from JSON
  answer: string;
  explanation: string;
  tags: string[];
  active: boolean;
}

export interface InterviewAttempt {
  id: string;
  userId: string;
  questionId: string;
  attemptDate: string;        // YYYY-MM-DD
  userAnswer: string;
  correct: boolean;
  xpAwarded: boolean;
  attemptedAt: string;
}

// Topic accuracy for weak-area detection
export interface TopicAccuracy {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;           // 0–100
  recentIncorrect: number;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProjectStage {
  id: string;
  projectId: string;
  sequence: number;
  title: string;
  description: string;
  resources: Array<{ title: string; url: string }>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationEst: string;
  stack: string[];
  categories: string[];
  whatYouLearn: string;
  prerequisites: string;
  resources: Array<{ title: string; url: string }>;
  stages: ProjectStage[];
  active: boolean;
}

export interface ProjectStageProgress {
  id: string;
  userId: string;
  projectId: string;
  stageId: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  xpAwarded: boolean;
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface Reward {
  id: string;
  userId: string;
  name: string;
  description: string;
  requirement: string;
  redeemed: boolean;
  redeemedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  userId: string;
  entryDate: string;          // YYYY-MM-DD
  wentWell: string;
  wentBadly: string;
  learned: string;
  improveTomorrow: string;
  tomorrowPriorities: string[];
  tomorrowExtras: string[];
  xpAwarded: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── XP & Levels ─────────────────────────────────────────────────────────────

export type XpReason =
  | 'focus_session'
  | 'task'
  | 'revision'
  | 'interview'
  | 'project_stage'
  | 'journal'
  | 'planning';

export interface XpEvent {
  id: string;
  userId: string;
  amount: number;
  reason: XpReason;
  sourceId: string;
  earnedAt: string;
}

/** Compute level from cumulative XP — level = floor(sqrt(totalXP / 100)) + 1 */
export function computeLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/** XP needed to reach next level from current total */
export function xpToNextLevel(totalXP: number): { current: number; needed: number; level: number } {
  const level = computeLevel(totalXP);
  const needed = Math.pow(level, 2) * 100;
  const current = totalXP - Math.pow(level - 1, 2) * 100;
  return { current, needed, level };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'day' | 'night' | 'auto';
  timezone: string;
  focusPreset: FocusPreset;
  customFocusMins: number;
  customShortBreak: number;
  customLongBreak: number;
  customCycles: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  quoteEnabled: boolean;
  quoteCategories: string[];
  xpFocusSession: number;
  xpTask: number;
  xpInterview: number;
  xpRevision: number;
  xpProjectMilestone: number;
  xpDailyPlanning: number;
  xpJournal: number;
}
