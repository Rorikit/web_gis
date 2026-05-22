import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = ({ children, variant = 'primary', className = '', type = 'button', ...props }: PropsWithChildren<ButtonProps>) => (
  <button className={`button button--${variant} ${className}`} type={type} {...props}>
    {children}
  </button>
);
