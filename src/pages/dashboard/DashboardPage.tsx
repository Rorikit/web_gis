import { PageHeader } from '@/shared/ui';
import { useDamages } from '@/features/damages/hooks/useDamages';
import { useOrders } from '@/features/orders/hooks/useOrders';

export const DashboardPage = () => {
  const damages = useDamages(false);
  const orders = useOrders(false);
  const damageRows = Array.isArray(damages.data) ? damages.data : [];
  const orderRows = Array.isArray(orders.data) ? orders.data : [];

  return (
    <>
      <PageHeader title="Главная" subtitle="Оперативная сводка по повреждениям и ордерам" />
      <div className="details-grid">
        <div className="card"><h3 className="section-title">Активные повреждения</h3><strong>{damageRows.length}</strong></div>
        <div className="card"><h3 className="section-title">Открытые ордера</h3><strong>{orderRows.length}</strong></div>
        <div className="card"><h3 className="section-title">Без GIS-точки</h3><strong>{damageRows.filter((item) => !item.gisPoint).length}</strong></div>
        <div className="card"><h3 className="section-title">Готово к закрытию</h3><strong>{orderRows.filter((item) => item.areaState === 'ГОТОВ К ЗАКРЫТИЮ').length}</strong></div>
      </div>
    </>
  );
};
