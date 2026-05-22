import type { PropsWithChildren } from 'react';

type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning';

export const Badge = ({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) => (
  <span className={`badge badge--${tone}`}>{children}</span>
);
