import type { TextareaHTMLAttributes } from 'react';

export const Textarea = ({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={`textarea ${className}`} {...props} />
);
