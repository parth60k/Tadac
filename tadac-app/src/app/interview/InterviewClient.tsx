'use client';

import { useState, useTransition, useMemo } from 'react';
import { CheckCircle2, XCircle, ChevronRight, BrainCircuit, Loader2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { submitInterviewAttempt } from '@/app/actions/interview';

type Question = {
  id: string;
  topic: string;
  difficulty: string;
  format: string;
  question: string;
  options: string;
  answer: string;
  explanation: string;
};

type Attempt = {
  questionId: string;
  userAnswer: string;
  correct: boolean;
};

interface Props {
  initialData: {
    questions: Question[];
    attempts: Attempt[];
    today: string;
    quotaMet: boolean;
  };
}

export default function InterviewClient({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions]    = useState(initialData.questions);
  const [attempts, setAttempts]      = useState<Record<string, Attempt>>(
    initialData.attempts.reduce((acc, att) => {
      acc[att.questionId] = att;
      return acc;
    }, {} as Record<string, Attempt>)
  );
  
  // Find first unanswered question
  const firstUnansweredIdx = questions.findIndex(q => !attempts[q.id]);
  const [currentIndex, setCurrentIndex] = useState(
    firstUnansweredIdx === -1 ? questions.length : firstUnansweredIdx
  );

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [error, setError] = useState<string>('');

  const isCompleted = currentIndex >= questions.length;
  const currentQ = questions[currentIndex];
  
  const currentAttempt = currentQ ? attempts[currentQ.id] : null;

  const parsedOptions = useMemo(() => {
    if (!currentQ || currentQ.format !== 'mcq') return [];
    try {
      return JSON.parse(currentQ.options) as string[];
    } catch {
      return [];
    }
  }, [currentQ]);

  function handleSelect(opt: string) {
    if (currentAttempt || isPending) return;
    setSelectedOption(opt);
    setError('');
  }

  function handleSubmit() {
    if (!selectedOption) {
      setError('Please select an answer.');
      return;
    }
    
    startTransition(async () => {
      const res = await submitInterviewAttempt(currentQ.id, selectedOption);
      if (!res.success) {
        setError(res.message);
      } else {
        setAttempts(prev => ({
          ...prev,
          [currentQ.id]: {
            questionId: currentQ.id,
            userAnswer: String(selectedOption),
            correct: res.data.correct
          }
        }));
      }
    });
  }

  function handleNext() {
    setSelectedOption('');
    setError('');
    setCurrentIndex(i => i + 1);
  }

  if (questions.length === 0) {
    return (
      <div className="page-wrapper">
         <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
          Daily Practice
        </h1>
        <Panel padding="lg" style={{ textAlign: 'center' }}>
           <p style={{ color: 'var(--text-secondary)' }}>No questions available in the question bank right now.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrainCircuit size={24} color="var(--accent)" />
          Daily Practice
        </h1>
        <div style={{ padding: '6px 14px', background: 'var(--panel-bg)', borderRadius: 20, border: '1px solid var(--panel-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {Object.keys(attempts).length} / {questions.length} Completed
        </div>
      </div>

      {isCompleted ? (
        <Panel padding="lg" style={{ textAlign: 'center', marginTop: 40 }}>
          <CheckCircle2 size={40} color="var(--success)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 8 }}>
            Daily Quota Met!
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: 20 }}>
            You've completed all {questions.length} practice questions for today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
             <p style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 8 }}>
               + {questions.length * 10} XP Earned
             </p>
          </div>
        </Panel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Progress indicators */}
          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((q, idx) => {
              const att = attempts[q.id];
              let bg = 'var(--panel-border)';
              if (att) {
                bg = att.correct ? 'var(--success)' : 'var(--due)';
              } else if (idx === currentIndex) {
                bg = 'var(--accent)';
              }
              return (
                <div key={q.id} style={{
                  flex: 1, height: 6, borderRadius: 3, background: bg, transition: 'background 0.3s'
                }} />
              );
            })}
          </div>

          <Panel padding="lg" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentQ.topic}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--panel-bg)', padding: '2px 8px', borderRadius: 10, border: '1px solid var(--panel-border)' }}>
                {currentQ.difficulty}
              </span>
            </div>

            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 24 }}>
              {currentQ.question}
            </h2>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {parsedOptions.map((opt, i) => {
                const isSelected = selectedOption === opt;
                let border = isSelected ? 'var(--accent)' : 'var(--panel-border)';
                let bg     = isSelected ? 'rgba(246,169,76,0.1)' : 'transparent';
                
                // If attempted, reveal correct/incorrect coloring
                if (currentAttempt) {
                  const isCorrectAnswer = opt.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();
                  const isUserAnswer = currentAttempt.userAnswer.toLowerCase().trim() === opt.toLowerCase().trim();
                  
                  if (isCorrectAnswer) {
                    border = 'var(--success)';
                    bg = 'rgba(111,207,151,0.1)';
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    border = 'var(--due)';
                    bg = 'rgba(235,87,87,0.1)';
                  } else {
                    border = 'var(--panel-border)';
                    bg = 'transparent';
                    // Mute unselected wrong options slightly
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    disabled={!!currentAttempt || isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${border}`,
                      background: bg,
                      cursor: currentAttempt ? 'default' : 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                      opacity: currentAttempt && !border.includes('success') && !border.includes('due') ? 0.6 : 1
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && !currentAttempt && <div style={{ width: 10, height: 10, borderRadius: '50%', background: border }} />}
                      {currentAttempt && border.includes('success') && <CheckCircle2 size={14} color="var(--success)" />}
                      {currentAttempt && border.includes('due') && <XCircle size={14} color="var(--due)" />}
                    </div>
                    <span style={{ fontSize: '0.95rem', color: isSelected || currentAttempt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--due)' }}>{error}</p>
            )}

            {/* Post-attempt Reveal Block */}
            {currentAttempt && (
              <div style={{
                marginTop: 24, padding: 16, borderRadius: 'var(--radius-md)',
                background: currentAttempt.correct ? 'var(--success-soft)' : 'var(--due-soft)',
                border: `1px solid ${currentAttempt.correct ? 'var(--success)' : 'var(--due)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {currentAttempt.correct ? (
                    <><CheckCircle2 size={18} color="var(--success)" /><strong style={{ color: 'var(--success)' }}>Correct! +10 XP</strong></>
                  ) : (
                    <><XCircle size={18} color="var(--due)" /><strong style={{ color: 'var(--due)' }}>Incorrect (+10 XP for attempting)</strong></>
                  )}
                </div>
                {currentQ.explanation && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 8 }}>
                    {currentQ.explanation}
                  </p>
                )}
                {!currentAttempt.correct && !currentQ.explanation && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 8 }}>
                    The correct answer is: <strong>{currentQ.answer}</strong>
                  </p>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              {!currentAttempt ? (
                <Button variant="primary" onClick={handleSubmit} disabled={isPending || !selectedOption} style={{ gap: 8 }}>
                   {isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Answer'}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext} style={{ gap: 8 }}>
                   Next Question <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
