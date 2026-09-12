import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', style, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {icon && (
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input-field ${className}`}
            style={{ paddingLeft: icon ? 36 : undefined, borderColor: error ? 'var(--due)' : undefined, ...style }}
            {...props}
          />
        </div>
        {error && <p style={{ fontSize: '0.75rem', color: 'var(--due)', margin: 0 }}>{error}</p>}
        {hint && !error && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`input-field ${className}`}
          style={{ resize: 'vertical', minHeight: 100, borderColor: error ? 'var(--due)' : undefined, ...style }}
          {...props}
        />
        {error && <p style={{ fontSize: '0.75rem', color: 'var(--due)', margin: 0 }}>{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
