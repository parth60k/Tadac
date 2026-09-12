import { HTMLAttributes, forwardRef } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = {
  sm:   '12px 16px',
  md:   '20px 24px',
  lg:   '28px 32px',
  none: '0',
};

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ hoverable = false, padding = 'md', className = '', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`glass-panel${hoverable ? ' glass-panel-hover' : ''} ${className}`}
        style={{ padding: paddingMap[padding], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
export default Panel;
