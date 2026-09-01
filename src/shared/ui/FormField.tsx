import type { PropsWithChildren } from 'react';

export const FormField = ({ label, hint, error, children }: PropsWithChildren<{ label: string; hint?: string; error?: string }>) => (
  <label className="form-field">
    <span>{label}</span>
    {children}
    {hint && <small className="form-field__hint">{hint}</small>}
    {error && <em>{error}</em>}
  </label>
);
