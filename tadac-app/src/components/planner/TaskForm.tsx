'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { CATEGORIES, type Category, type Priority } from '@/types/domain';
import { createTask, updateTask } from '@/app/actions/tasks';

interface TaskFormProps {
  defaultDate: string;          // YYYY-MM-DD pre-filled
  editTask?: {                  // if set, we are editing
    id: string;
    title: string;
    description: string;
    scheduledDate: string;
    scheduledTime?: string | null;
    priority: string;
    category: string;
    estimatedMins?: number | null;
    deadline?: string | null;
  };
  onClose: () => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high',   label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low',    label: '🟢 Low' },
];

export default function TaskForm({ defaultDate, editTask, onClose }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [title,         setTitle]         = useState(editTask?.title          ?? '');
  const [description,   setDescription]   = useState(editTask?.description    ?? '');
  const [scheduledDate, setScheduledDate] = useState(editTask?.scheduledDate  ?? defaultDate);
  const [scheduledTime, setScheduledTime] = useState(editTask?.scheduledTime  ?? '');
  const [priority,      setPriority]      = useState<Priority>((editTask?.priority as Priority) ?? 'medium');
  const [category,      setCategory]      = useState<Category>((editTask?.category as Category) ?? 'Other');
  const [estimatedMins, setEstimatedMins] = useState(editTask?.estimatedMins?.toString() ?? '');
  const [deadline,      setDeadline]      = useState(editTask?.deadline ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required.'); return; }

    startTransition(async () => {
      const payload = {
        title,
        description,
        scheduledDate,
        scheduledTime: scheduledTime || undefined,
        priority,
        category,
        estimatedMins: estimatedMins ? parseInt(estimatedMins) : undefined,
        deadline:      deadline || undefined,
      };

      const result = editTask
        ? await updateTask(editTask.id, payload)
        : await createTask(payload);

      if (!result.success) {
        setError(result.message);
      } else {
        onClose();
      }
    });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Panel
        padding="lg"
        style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}
        id="task-form-panel"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {editTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <Input
            id="task-title"
            label="Title"
            placeholder="What do you need to do?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />

          {/* Description */}
          <Textarea
            id="task-description"
            label="Notes (optional)"
            placeholder="Extra context..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ minHeight: 70 }}
          />

          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              id="task-date"
              label="Date"
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              required
            />
            <Input
              id="task-time"
              label="Time (optional)"
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
            />
          </div>

          {/* Priority + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="input-field"
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="input-field"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Est. time + Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              id="task-est-mins"
              label="Est. duration (mins)"
              type="number"
              min="1"
              max="480"
              placeholder="e.g. 45"
              value={estimatedMins}
              onChange={e => setEstimatedMins(e.target.value)}
            />
            <Input
              id="task-deadline"
              label="Deadline (optional)"
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: '0.8rem', color: 'var(--due)', padding: '8px 12px', background: 'var(--due-soft)', borderRadius: 8 }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending} id="task-form-submit">
              {isPending
                ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                : editTask ? 'Save changes' : 'Add task'
              }
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
