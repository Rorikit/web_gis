import { useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import type { Order } from '@/entities';
import { ryazanMapCenter, toLonLatPair } from '@/shared/constants/map';
import { Button } from '@/shared/ui';

const markerStyle = (color: string) =>
  new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  });

const colorByOrder = (order: Order) => {
  if (order.closedAt) return '#64748b';
  return order.orderKind === 'Гарантийный' ? '#eab308' : '#dc2626';
};

export const GisMap = ({ orders }: { orders: Order[] }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const source = new VectorSource();
    orders.filter((order) => order.gisPoint).forEach((order) => {
      const point = order.gisPoint!;
      const feature = new Feature({ geometry: new Point(fromLonLat([point.longitude, point.latitude])), order });
      feature.setStyle(markerStyle(colorByOrder(order)));
      source.addFeature(feature);
    });

    const map = new Map({
      target: ref.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
      view: new View({ center: fromLonLat(toLonLatPair()), zoom: ryazanMapCenter.zoom }),
    });

    map.on('pointermove', (event) => {
      const title = map.forEachFeatureAtPixel(event.pixel, (feature) => feature.get('order')?.address ?? '');
      map.getTargetElement().title = String(title ?? '');
    });
    map.on('click', (event) => {
      const order = map.forEachFeatureAtPixel(event.pixel, (feature) => feature.get('order') as Order);
      setSelected(order ?? null);
    });

    return () => map.setTarget(undefined);
  }, [orders]);

  return (
    <div className="gis-map" ref={ref}>
      {selected && (
        <div className="gis-popup">
          <strong>{selected.orderNumber}</strong>
          <p>{selected.address}</p>
          <div className="details-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div className="details-item"><span>Тип</span>{selected.orderKind}</div>
            <div className="details-item"><span>Состояние</span>{selected.areaState}</div>
            <div className="details-item"><span>Исполнитель</span>{selected.contractorName}</div>
            <div className="details-item"><span>Открыт до</span>{selected.validUntil}</div>
          </div>
          <Button variant="secondary" onClick={() => window.location.assign(`/orders/${selected.id}`)}>Открыть запись</Button>
        </div>
      )}
    </div>
  );
};
