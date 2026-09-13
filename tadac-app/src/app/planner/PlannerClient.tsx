'use client';

import { useState, useEffect, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List, CalendarRange } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import TaskList from '@/components/planner/TaskList';
import TaskForm from '@/components/planner/TaskForm';
import { getTasksForDate, getTasksForDateRange } from '@/app/actions/tasks';
import { todayDate, addDays, formatDateShort, formatDateLong } from '@/lib/date';

type View = 'today' | 'tomorrow' | 'week';

interface Task {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  priority: string;
  category: string;
  estimatedMins?: number | null;
  deadline?: string | null;
  completed: boolean;
  sortOrder: number;
}

const TIMEZONE = 'Asia/Kolkata';

// ─── Week strip component ─────────────────────────────────────────────────────
function WeekStrip({
  selectedDate,
  onSelectDate,
  taskCountByDate,
}: {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  taskCountByDate: Record<string, number>;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));

  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 16 }}>
      {days.map(d => {
        const { day, month } = formatDateLabel(d);
        const isSelected = d === selectedDate;
        const count = taskCountByDate[d] ?? 0;
        return (
          <button
            key={d}
            onClick={() => onSelectDate(d)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
              background: isSelected ? 'var(--accent-soft)' : 'transparent',
              border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
              transition: 'all 150ms',
              minWidth: 44,
            }}
          >
            <span style={{ fontSize: '0.65rem', color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 600 }}>
              {month}
            </span>
            <span style={{
              fontSize: '1.05rem', fontWeight: 700,
              color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
            }}>
              {day}
            </span>
            {count > 0 && (
              <span style={{
                marginTop: 3, width: 6, height: 6, borderRadius: '50%',
                background: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function formatDateLabel(dateStr: string): { day: string; month: string; weekday: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    month:   dt.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }),
    day:     dt.toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric' }),
    weekday: dt.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' }),
  };
}

// ─── Main Planner Client ──────────────────────────────────────────────────────
export default function PlannerClient() {
  const today                     = todayDate(TIMEZONE);
  const [view, setView]           = useState<View>('today');
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm]   = useState(false);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [isPending, startTransition] = useTransition();

  // Load tasks whenever selected date changes
  useEffect(() => {
    startTransition(async () => {
      const result = await getTasksForDate(selectedDate);
      setTasks(result as Task[]);
    });
  }, [selectedDate]);

  // Load week tasks when in week view
  useEffect(() => {
    if (view !== 'week') return;
    startTransition(async () => {
      const from = addDays(today, 0);
      const to   = addDays(today, 6);
      const result = await getTasksForDateRange(from, to);
      setWeekTasks(result as Task[]);
    });
  }, [view, today]);

  function goToToday()    { setSelectedDate(today);                      setView('today'); }
  function goToTomorrow() { setSelectedDate(addDays(today, 1));          setView('tomorrow'); }
  function prevDay()      { setSelectedDate(prev => addDays(prev, -1)); }
  function nextDay()      { setSelectedDate(prev => addDays(prev, 1));  }

  const isToday    = selectedDate === today;
  const isTomorrow = selectedDate === addDays(today, 1);
  const dateLabel  = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDateLong(selectedDate);

  // Count tasks per day for the week dots
  const taskCountByDate: Record<string, number> = {};
  weekTasks.forEach(t => {
    taskCountByDate[t.scheduledDate] = (taskCountByDate[t.scheduledDate] ?? 0) + 1;
  });

  // Group week tasks by date
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const weekTasksByDate: Record<string, Task[]> = {};
  weekDates.forEach(d => { weekTasksByDate[d] = []; });
  weekTasks.forEach(t => {
    if (weekTasksByDate[t.scheduledDate]) {
      weekTasksByDate[t.scheduledDate].push(t as Task);
    }
  });

  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
        Planner
      </h1>

      {/* ── View tabs ────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        {([
          { id: 'today',    label: 'Today',    icon: <List size={14} /> },
          { id: 'tomorrow', label: 'Tomorrow', icon: <CalendarDays size={14} /> },
          { id: 'week',     label: 'Week',     icon: <CalendarRange size={14} /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            id={`planner-tab-${tab.id}`}
            onClick={() => {
              setView(tab.id);
              if (tab.id === 'today')    goToToday();
              if (tab.id === 'tomorrow') goToTomorrow();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              border: view === tab.id ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
              background: view === tab.id ? 'var(--accent-soft)' : 'var(--panel-bg)',
              color: view === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 150ms',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Add task button */}
        <Button variant="primary" size="sm" id="add-task-btn" onClick={() => setShowForm(true)} style={{ gap: 6 }}>
          <Plus size={16} /> Add task
        </Button>
      </div>

      {/* ── Day/Week view ─────────────────────── */}
      {view === 'week' ? (
        // Week view — 7 columns
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WeekStrip
            selectedDate={selectedDate}
            onSelectDate={d => { setSelectedDate(d); setView('today'); }}
            taskCountByDate={taskCountByDate}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {weekDates.map(d => {
              const { day, month, weekday } = formatDateLabel(d);
              const dayTasks = weekTasksByDate[d] ?? [];
              const isT = d === today;
              return (
                <Panel
                  key={d}
                  padding="sm"
                  hoverable
                  style={{ cursor: 'pointer', border: isT ? '1px solid var(--accent)' : undefined }}
                  onClick={() => { setSelectedDate(d); setView('today'); }}
                >
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{weekday}</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: isT ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {day}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{month}</p>
                  {dayTasks.length > 0 && (
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                      {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </Panel>
              );
            })}
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center' }}>
            Click a day to view and manage tasks.
          </p>
        </div>
      ) : (
        // Day view
        <Panel padding="lg">
          {/* Date header + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              onClick={prevDay}
              aria-label="Previous day"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
            >
              <ChevronLeft size={20} />
            </button>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {dateLabel}
              </p>
              {!isToday && (
                <button
                  onClick={goToToday}
                  style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
                >
                  ← Back to today
                </button>
              )}
            </div>

            <button
              onClick={nextDay}
              aria-label="Next day"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Stats strip */}
          {tasks.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '8px 0', borderBottom: '1px solid var(--panel-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                {tasks.filter(t => t.completed).length}/{tasks.length} done
              </span>
              {tasks.some(t => t.priority === 'high') && (
                <span style={{ fontSize: '0.78rem', color: 'var(--due)' }}>
                  {tasks.filter(t => t.priority === 'high' && !t.completed).length} high priority
                </span>
              )}
            </div>
          )}

          {/* Task list or loading */}
          {isPending ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading…</p>
            </div>
          ) : (
            <TaskList tasks={tasks} selectedDate={selectedDate} />
          )}
        </Panel>
      )}

      {/* Task creation form */}
      {showForm && (
        <TaskForm
          defaultDate={selectedDate}
          onClose={() => {
            setShowForm(false);
            // Reload tasks for selected date
            startTransition(async () => {
              const result = await getTasksForDate(selectedDate);
              setTasks(result as Task[]);
            });
          }}
        />
      )}
    </div>
  );
}
