import type { Order } from '@/entities';
import { GisMap } from '@/features/gis/ui/GisMap';

export const OrderGisMapWidget = ({ orders }: { orders: Order[] }) => <GisMap orders={orders} />;
