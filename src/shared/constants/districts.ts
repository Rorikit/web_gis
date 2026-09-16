import type { District } from '@/entities/district/types';

// Должен совпадать с районами в БД (accounts/migrations/0003_update_districts.py).
export const districts: District[] = [
  { id: 'sovetsky', name: 'Советский район' },
  { id: 'moskovsky', name: 'Московский район' },
  { id: 'oktyabrsky', name: 'Октябрьский район' },
  { id: 'zheleznodorozhny', name: 'Железнодорожный район' },
  { id: 'district_1', name: '1-й район' },
  { id: 'district_2', name: '2-й район' },
];
