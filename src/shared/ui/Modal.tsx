import type { PropsWithChildren } from 'react';
import { Button } from './Button';

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>;

export const Modal = ({ open, title, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2>{title}</h2>
          <Button variant="secondary" onClick={onClose}>Закрыть</Button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};
