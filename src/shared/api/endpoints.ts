export const endpoints = {
  auth: {
    login: '/auth/ldap/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  damages: {
    list: '/damages',
    detail: (id: string) => `/damages/${id}`,
    archive: (id: string) => `/damages/${id}/archive`,
  },
  orders: {
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    archive: (id: string) => `/orders/${id}/archive`,
  },
  gis: {
    openOrders: '/gis/orders/open',
    archivedOrders: '/gis/orders/archive',
    createDamagePoint: (id: string) => `/gis/damages/${id}/point`,
    updateDamagePoint: (id: string) => `/gis/damages/${id}/point`,
  },
  reports: {
    reference: '/reports/reference',
    damageCard: '/reports/damage-card',
  },
  exports: {
    currentTable: '/exports/current-table',
  },
  audit: {
    history: (entityType: string, entityId: string) => `/audit/${entityType}/${entityId}`,
  },
};
