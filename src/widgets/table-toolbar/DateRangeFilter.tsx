import { Input } from '@/shared/ui';

type DateRangeFilterProps = {
  label: string;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
};

export const DateRangeFilter = ({ label, from, to, onFrom, onTo }: DateRangeFilterProps) => (
  <div className="date-range">
    <span>{label}</span>
    <Input type="date" value={from} onChange={(event) => onFrom(event.target.value)} />
    <span>—</span>
    <Input type="date" value={to} onChange={(event) => onTo(event.target.value)} />
  </div>
);
