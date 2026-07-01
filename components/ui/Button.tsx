import { type ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'transparent';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-[var(--color-white)] hover:bg-[var(--color-primary-hover)] shadow-[0_10px_30px_rgba(17,24,39,0.06)]',
  secondary: 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-alt)] shadow-sm',
  ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[rgba(0,88,163,0.08)] hover:text-[var(--color-primary-hover)]',
  transparent: 'bg-transparent text-[var(--color-white)] hover:bg-white/10',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={
          'inline-flex items-center justify-center rounded-[0.75rem] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,88,163,0.16)] disabled:cursor-not-allowed disabled:opacity-60 hover:translate-y-[-1px] hover:scale-[1.01] ' +
          variantStyles[variant] +
          ' ' +
          sizeStyles[size] +
          (className ? ' ' + className : '')
        }
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
export default Button;
