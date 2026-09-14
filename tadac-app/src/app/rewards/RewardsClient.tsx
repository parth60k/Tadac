'use client';

import { useState, useTransition } from 'react';
import { Gift, Plus, CheckCircle2, Lock, Trash2, Loader2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { createReward, redeemReward, deleteReward } from '@/app/actions/rewards';
import type { Reward } from '@prisma/client';

export default function RewardsClient({ initialRewards }: { initialRewards: Reward[] }) {
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [requirement, setRequirement] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !name.trim() || !requirement.trim()) return;

    startTransition(async () => {
      const res = await createReward(name, requirement);
      if (res?.success) {
        setIsCreating(false);
        setName('');
        setRequirement('');
      } else {
        alert('Failed to create reward');
      }
    });
  }

  function handleRedeem(id: string) {
    if (isPending) return;
    startTransition(async () => {
      await redeemReward(id);
    });
  }

  function handleDelete(id: string) {
    if (isPending) return;
    if (confirm('Delete this reward?')) {
      startTransition(async () => {
        await deleteReward(id);
      });
    }
  }

  const active = initialRewards.filter(r => !r.redeemed);
  const redeemed = initialRewards.filter(r => r.redeemed);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gift size={24} color="var(--accent)" /> Rewards
        </h1>
        <Button variant="primary" onClick={() => setIsCreating(!isCreating)} style={{ gap: 8 }}>
          <Plus size={16} /> New Reward
        </Button>
      </div>

      {isCreating && (
        <Panel padding="md" style={{ marginBottom: 24, border: '2px solid var(--accent)' }} className="fade-in">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>What is the physical reward?</label>
              <input 
                type="text" className="input-base" style={{ width: '100%' }}
                placeholder="e.g. Cold Coffee" value={name} onChange={e => setName(e.target.value)} autoFocus required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>What must you do to earn it?</label>
              <input 
                type="text" className="input-base" style={{ width: '100%' }}
                placeholder="e.g. 3h deep focus" value={requirement} onChange={e => setRequirement(e.target.value)} required 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? <Loader2 size={16} className="spin" /> : 'Save Reward'}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Locked Objectives</h2>
      {active.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: 32 }}>No active rewards. Set a goal!</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
          {active.map(r => (
            <Panel key={r.id} padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={16} color="var(--text-tertiary)" /> {r.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Req: {r.requirement}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} disabled={isPending} style={{ color: 'var(--due)' }}>
                  <Trash2 size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleRedeem(r.id)} disabled={isPending} style={{ gap: 6, color: 'var(--success)', borderColor: 'var(--success)' }}>
                  {isPending ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Redeem
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {redeemed.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Claimed Trophies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {redeemed.map(r => (
              <Panel key={r.id} padding="md" style={{ background: 'var(--bg-primary)', opacity: 0.8, borderStyle: 'dashed' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{r.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                  <CheckCircle2 size={12} /> Claimed on {r.redeemedAt?.toLocaleDateString()}
                </span>
              </Panel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
