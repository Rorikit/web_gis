import type { InputHTMLAttributes } from 'react';

export const Checkbox = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`checkbox ${className}`} type="checkbox" {...props} />
);
