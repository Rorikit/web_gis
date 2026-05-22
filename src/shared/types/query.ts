export const queryKeys = {
  currentUser: ['currentUser'] as const,
  damages: (archived = false) => ['damages', archived] as const,
  damage: (id: string) => ['damage', id] as const,
  orders: (archived = false) => ['orders', archived] as const,
  order: (id: string) => ['order', id] as const,
  gisOpenOrders: ['gisOpenOrders'] as const,
  gisArchivedOrders: (from?: string, to?: string) => ['gisArchivedOrders', from, to] as const,
  audit: (entityType: string, entityId: string) => ['audit', entityType, entityId] as const,
  users: ['users'] as const,
};
