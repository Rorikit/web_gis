import type { SelectHTMLAttributes } from 'react';

export const Select = ({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`select ${className}`} {...props}>
    {children}
  </select>
);
