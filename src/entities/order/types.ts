import type { GisPoint } from '@/entities/gis-point/types';
import type { AreaState, ContractorType, OrderKind } from '@/entities/damage/types';

export type Order = {
  id: string;
  districtId: string;
  orderNumber: string;
  address: string;
  orderKind: OrderKind;
  openedAt: string;
  validUntil: string;
  closedAt: string | null;
  areaState: AreaState;
  contractorType: ContractorType;
  contractorName: string;
  contractNumber: string;
  plannedFinishDate: string | null;
  note: string;
  gisPoint: GisPoint | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};
