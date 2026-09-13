'use client';

import { useState, useTransition, useOptimistic } from 'react';
import {
  CheckCircle2, Circle, Pencil, Trash2,
  ChevronUp, ChevronDown, Clock, Flag,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { toggleTaskComplete, deleteTask, reorderTasks } from '@/app/actions/tasks';
import type { Category, Priority } from '@/types/domain';
import TaskForm from './TaskForm';

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

interface TaskListProps {
  tasks: Task[];
  selectedDate: string;
}

const PRIORITY_COLOR: Record<Priority, string> = {
  high:   'var(--due)',
  medium: 'var(--warning)',
  low:    'var(--success)',
};

export default function TaskList({ tasks: initialTasks, selectedDate }: TaskListProps) {
  const [isPending, startTransition] = useTransition();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [optimisticTasks, updateOptimistic] = useOptimistic(
    initialTasks,
    (state: Task[], action: { type: 'toggle'; id: string } | { type: 'delete'; id: string }) => {
      if (action.type === 'toggle') {
        return state.map(t => t.id === action.id ? { ...t, completed: !t.completed } : t);
      }
      if (action.type === 'delete') {
        return state.filter(t => t.id !== action.id);
      }
      return state;
    }
  );

  function handleToggle(id: string) {
    startTransition(async () => {
      updateOptimistic({ type: 'toggle', id });
      await toggleTaskComplete(id);
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    startTransition(async () => {
      updateOptimistic({ type: 'delete', id });
      await deleteTask(id);
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const reordered = [...optimisticTasks];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    startTransition(async () => {
      await reorderTasks(reordered.map(t => t.id));
    });
  }

  function handleMoveDown(index: number) {
    if (index === optimisticTasks.length - 1) return;
    const reordered = [...optimisticTasks];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    startTransition(async () => {
      await reorderTasks(reordered.map(t => t.id));
    });
  }

  const pending   = optimisticTasks.filter(t => !t.completed);
  const completed = optimisticTasks.filter(t => t.completed);

  if (optimisticTasks.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No tasks yet for this day.</p>
      </div>
    );
  }

  const renderTask = (task: Task, index: number, globalIndex: number) => (
    <li
      key={task.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid var(--panel-border)',
        opacity: task.completed ? 0.6 : 1,
        transition: 'opacity 150ms',
      }}
    >
      {/* Complete toggle */}
      <button
        onClick={() => handleToggle(task.id)}
        disabled={isPending}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex' }}
        id={`task-toggle-${task.id}`}
      >
        {task.completed
          ? <CheckCircle2 size={20} color="var(--success)" strokeWidth={2} />
          : <Circle       size={20} color="var(--text-tertiary)" strokeWidth={2} />
        }
      </button>

      {/* Task info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.9rem', fontWeight: 500,
          color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: task.completed ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {task.scheduledTime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              <Clock size={11} /> {task.scheduledTime}
            </span>
          )}
          {task.estimatedMins && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              ~{task.estimatedMins}m
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: PRIORITY_COLOR[task.priority as Priority] }}>
            <Flag size={10} strokeWidth={2.5} />
            {task.priority}
          </span>
          <Badge category={task.category as Category} size="sm" />
        </div>
      </div>

      {/* Reorder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => handleMoveUp(globalIndex)}
          disabled={isPending || globalIndex === 0}
          aria-label="Move up"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => handleMoveDown(globalIndex)}
          disabled={isPending || globalIndex === optimisticTasks.length - 1}
          aria-label="Move down"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Edit */}
      <button
        onClick={() => setEditingTask(task)}
        aria-label="Edit task"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4 }}
        id={`task-edit-${task.id}`}
      >
        <Pencil size={15} />
      </button>

      {/* Delete */}
      <button
        onClick={() => handleDelete(task.id, task.title)}
        aria-label="Delete task"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4 }}
        id={`task-delete-${task.id}`}
      >
        <Trash2 size={15} />
      </button>
    </li>
  );

  return (
    <>
      <ul style={{ listStyle: 'none' }}>
        {pending.map((task, i) => renderTask(task, i, i))}
        {completed.length > 0 && (
          <>
            {pending.length > 0 && (
              <li style={{ padding: '8px 0' }}>
                <p className="section-title">Completed</p>
              </li>
            )}
            {completed.map((task, i) => renderTask(task, i, pending.length + i))}
          </>
        )}
      </ul>

      {/* Edit modal */}
      {editingTask && (
        <TaskForm
          defaultDate={selectedDate}
          editTask={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}
