'use client';

/**
 * Category selector + optional task link for the focus session.
 * Only shown in idle phase.
 */

import { CATEGORIES, type Category } from '@/types/domain';
import { useFocus } from '@/lib/focus-context';

const CATEGORY_COLORS: Record<Category, string> = {
  Development: '#6ba7ff',
  DSA:         '#a78bfa',
  College:     '#f59e0b',
  Interview:   '#ec4899',
  Revision:    '#10b981',
  Personal:    '#f6a94c',
  Other:       '#94a3b8',
};

interface CategoryTaskPickerProps {
  tasks: { id: string; title: string; category: string }[];
}

export default function CategoryTaskPicker({ tasks }: CategoryTaskPickerProps) {
  const { state, setCategory, setTask } = useFocus();

  return (
    <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Category */}
      <div>
        <p className="section-title" style={{ marginBottom: 8, textAlign: 'center' }}>Category</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {CATEGORIES.map(cat => {
            const isActive = state.category === cat;
            const color    = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                id={`category-${cat.toLowerCase()}`}
                onClick={() => setCategory(cat)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          6,
                  padding:      '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border:       isActive
                    ? `1.5px solid ${color}`
                    : '1px solid var(--panel-border)',
                  background: isActive
                    ? `${color}22`
                    : 'var(--panel-bg)',
                  color:     isActive ? color : 'var(--text-secondary)',
                  cursor:    'pointer',
                  fontSize:  '0.8rem',
                  fontWeight: 600,
                  transition: 'all 120ms',
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: isActive ? color : 'var(--text-tertiary)',
                  display: 'inline-block',
                }} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Link to a task (optional) */}
      {tasks.length > 0 && (
        <div>
          <p className="section-title" style={{ marginBottom: 8, textAlign: 'center' }}>Link to task (optional)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {/* None option */}
            <button
              onClick={() => setTask(undefined)}
              style={{
                padding:      '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border:       !state.linkedTaskId
                  ? '1.5px solid var(--accent)'
                  : '1px solid var(--panel-border)',
                background:   !state.linkedTaskId ? 'var(--accent-soft)' : 'var(--panel-bg)',
                color:        !state.linkedTaskId ? 'var(--accent)' : 'var(--text-tertiary)',
                textAlign:    'left',
                fontSize:     '0.8rem',
                cursor:       'pointer',
              }}
            >
              No linked task
            </button>

            {tasks.map(t => {
              const isLinked = state.linkedTaskId === t.id;
              return (
                <button
                  key={t.id}
                  id={`link-task-${t.id}`}
                  onClick={() => { setTask(t.id); setCategory(t.category as Category); }}
                  style={{
                    padding:      '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border:       isLinked
                      ? '1.5px solid var(--accent)'
                      : '1px solid var(--panel-border)',
                    background:   isLinked ? 'var(--accent-soft)' : 'var(--panel-bg)',
                    color:        isLinked ? 'var(--accent)' : 'var(--text-secondary)',
                    textAlign:    'left',
                    fontSize:     '0.8rem',
                    cursor:       'pointer',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
