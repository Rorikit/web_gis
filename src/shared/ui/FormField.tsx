import type { PropsWithChildren } from 'react';

export const FormField = ({ label, error, children }: PropsWithChildren<{ label: string; error?: string }>) => (
  <label className="form-field">
    <span>{label}</span>
    {children}
    {error && <em>{error}</em>}
  </label>
);
