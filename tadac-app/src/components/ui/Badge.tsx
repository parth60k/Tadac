export type Category =
  | 'Development'
  | 'DSA'
  | 'College'
  | 'Interview'
  | 'Revision'
  | 'Personal'
  | 'Other';

const CATEGORY_COLORS: Record<Category, string> = {
  Development: '#6ba7ff',
  DSA:         '#f6a94c',
  College:     '#6fcf97',
  Interview:   '#bb86fc',
  Revision:    '#f2994a',
  Personal:    '#eb5757',
  Other:       '#9e9e9e',
};

interface BadgeProps {
  category: Category | string;
  size?: 'sm' | 'md';
}

export default function Badge({ category, size = 'sm' }: BadgeProps) {
  const color = CATEGORY_COLORS[category as Category] ?? '#9e9e9e';
  return (
    <span
      className="category-dot"
      style={{
        fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {category}
    </span>
  );
}
