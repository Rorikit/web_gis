import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import type { Order } from '@/entities';
import { Button } from '@/shared/ui';

const markerStyle = (color: string) =>
  new Style({
    image: new Circle({
      radius: 7,
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
      view: new View({ center: fromLonLat([37.6173, 55.7558]), zoom: 10 }),
    });
    map.on('pointermove', (event) => {
      const hit = map.hasFeatureAtPixel(event.pixel);
      map.getTargetElement().title = hit ? String(map.forEachFeatureAtPixel(event.pixel, (feature) => feature.get('order')?.address ?? '')) : '';
    });
    map.on('click', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (item) => item);
      setSelected(feature?.get('order') ?? null);
    });
    return () => map.setTarget(undefined);
  }, [orders]);

  return (
    <div className="gis-map" ref={ref}>
      {selected && (
        <div className="gis-popup">
          <strong>{selected.orderNumber}</strong>
          <p>{selected.address}</p>
          <p>{selected.orderKind} · {selected.areaState}</p>
          <Button variant="secondary" onClick={() => window.location.assign(`/orders/${selected.id}`)}>Открыть запись</Button>
        </div>
      )}
    </div>
  );
};
