import type { PropsWithChildren } from 'react';
import { Button } from './Button';

export const Drawer = ({
  open,
  title,
  onClose,
  children,
}: PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>) => {
  if (!open) return null;
  return (
    <div className="drawer">
      <div className="drawer__header">
        <h2>{title}</h2>
        <Button variant="secondary" onClick={onClose}>Закрыть</Button>
      </div>
      {children}
    </div>
  );
};
