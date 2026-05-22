import type { ButtonHTMLAttributes } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export const IconButton = ({ label, className = '', children, ...props }: IconButtonProps) => (
  <button className={`icon-button ${className}`} title={label} aria-label={label} {...props}>
    {children}
  </button>
);
