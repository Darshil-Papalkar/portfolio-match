import { forwardRef } from 'react';

const Input = forwardRef(({ className = '', type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={[
        'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-400 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].filter(Boolean).join(' ')}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
