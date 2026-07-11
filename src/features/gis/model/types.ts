export type BaseMapLayer = 'osm' | 'humanitarian';

export type GisLegendItem = {
  label: string;
  color: string;
};

export const orderLegendItems: GisLegendItem[] = [
  { label: 'Текущий', color: '#2563eb' },
  { label: 'Гарантийный', color: '#eab308' },
  { label: 'Закрытый', color: '#64748b' },
];
