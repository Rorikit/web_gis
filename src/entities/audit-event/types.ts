export type AuditEvent = {
  id: string;
  entityType: 'damage' | 'order' | 'user' | string;
  entityId: string;
  userId: string;
  userName: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
};
