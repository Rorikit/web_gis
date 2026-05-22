import type { ReactNode } from 'react';

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

export const Tabs = ({ items, activeId, onChange }: { items: TabItem[]; activeId: string; onChange: (id: string) => void }) => (
  <div className="tabs">
    <div className="tabs__list">
      {items.map((item) => (
        <button key={item.id} className={activeId === item.id ? 'tabs__tab tabs__tab--active' : 'tabs__tab'} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
    <div className="tabs__panel">{items.find((item) => item.id === activeId)?.content}</div>
  </div>
);
