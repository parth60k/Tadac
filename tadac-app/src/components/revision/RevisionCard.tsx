'use client';

/**
 * Revision item card — shown in the Due / Overdue / Upcoming lists.
 * Clicking opens the detail panel.
 * Design spec §14: "Due Today → strongest emphasis, Overdue → clear warning"
 */

import { BookOpen, Tag, Clock, ChevronRight } from 'lucide-react';
import type { CheckpointView, Category } from '@/types/domain';
import { formatDateShort } from '@/lib/date';

interface Checkpoint {
  id:          string;
  sequence:    number;
  intervalDays: number;
  dueDate:     string;
  status:      string;
  view?:       CheckpointView;
}

interface RevisionItem {
  id:          string;
  topic:       string;
  notes:       string;
  category:    string;
  tags:        string;
  learnedAt:   string;
  checkpoints: Checkpoint[];
}

interface RevisionCardProps {
  item:        RevisionItem;
  checkpoint:  Checkpoint;
  view:        CheckpointView;
  onClick:     () => void;
}

const VIEW_CONFIG: Record<CheckpointView, { label: string; color: string; bg: string; borderColor: string }> = {
  DUE_TODAY:  { label: 'Due today',  color: 'var(--accent)',   bg: 'rgba(246,169,76,0.08)',  borderColor: 'var(--accent)' },
  OVERDUE:    { label: 'Overdue',    color: 'var(--due)',      bg: 'rgba(235,87,87,0.07)',   borderColor: 'var(--due)' },
  UPCOMING:   { label: 'Upcoming',   color: 'var(--info)',     bg: 'transparent',            borderColor: 'var(--panel-border)' },
  COMPLETED:  { label: 'Completed',  color: 'var(--success)',  bg: 'transparent',            borderColor: 'var(--panel-border)' },
};

export default function RevisionCard({ item, checkpoint, view, onClick }: RevisionCardProps) {
  const cfg  = VIEW_CONFIG[view];
  const tags = item.tags ? item.tags.split(',').filter(Boolean) : [];

  return (
    <button
      onClick={onClick}
      id={`rev-card-${checkpoint.id}`}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          14,
        padding:      '14px 16px',
        borderRadius: 'var(--radius-md)',
        border:       `1px solid ${cfg.borderColor}`,
        background:   cfg.bg,
        cursor:       'pointer',
        textAlign:    'left',
        width:        '100%',
        transition:   'background 120ms, transform 120ms',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-sm)',
        background: `${cfg.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <BookOpen size={17} color={cfg.color} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.9rem', fontWeight: 600,
          color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {item.topic}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Revision number */}
          <span style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 700 }}>
            Revision #{checkpoint.sequence} · Day {checkpoint.intervalDays}
          </span>

          {/* Due date */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            <Clock size={11} />
            {formatDateShort(checkpoint.dueDate)}
          </span>

          {/* Category */}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {item.category}
          </span>

          {/* Tags */}
          {tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '0.68rem', color: 'var(--text-tertiary)',
              padding: '1px 6px', borderRadius: 10,
              border: '1px solid var(--panel-border)',
            }}>
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>

        {/* Notes preview */}
        {item.notes && (
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-tertiary)',
            marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.notes}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight size={16} color="var(--text-tertiary)" />
    </button>
  );
}
