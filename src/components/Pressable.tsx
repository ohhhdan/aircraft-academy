import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'card' | 'ghost' | 'teal';
  className?: string;
  style?: CSSProperties;
}

export function Pressable({
  children,
  variant = 'card',
  className = '',
  style,
  ...props
}: PressableProps) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : variant === 'teal'
          ? 'btn-teal'
          : variant === 'ghost'
            ? ''
            : 'card';

  return (
    <button
      type="button"
      className={`pressable ${variantClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
