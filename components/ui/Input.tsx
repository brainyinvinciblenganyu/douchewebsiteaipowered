import { InputHTMLAttributes, forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={
          'w-full rounded-[0.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(0,88,163,0.16)] ' +
          className
        }
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
export default Input;
