import { useEffect, useMemo, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import ScaleLine from 'ol/control/ScaleLine';
import type { Order } from '@/entities';
import { useMapResize } from '@/features/gis/hooks/useMapResize';
import { type BaseMapLayer, orderLegendItems } from '@/features/gis/model/types';
import { ryazanMapCenter, toLonLatPair } from '@/shared/constants/map';
import { Button, EmptyState } from '@/shared/ui';

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
  return order.orderKind === 'Гарантийный' ? '#eab308' : '#2563eb';
};

const createBaseLayer = (layer: BaseMapLayer) =>
  new TileLayer({
    source:
      layer === 'humanitarian'
        ? new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            attributions: '© OpenStreetMap contributors, Tiles style by HOT',
          })
        : new OSM(),
  });

const getOrdersWithPoints = (orders: Order[]) => orders.filter((order) => order.gisPoint);

export const GisMap = ({ orders }: { orders: Order[] }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [baseLayer, setBaseLayer] = useState<BaseMapLayer>('osm');
  const ordersWithPoints = useMemo(() => getOrdersWithPoints(orders), [orders]);

  useMapResize(map, ref.current);

  useEffect(() => {
    if (!ref.current) return;

    const source = new VectorSource();
    const base = createBaseLayer(baseLayer);
    const vector = new VectorLayer({ source });
    const nextMap = new Map({
      target: ref.current,
      layers: [base, vector],
      controls: [new ScaleLine({ units: 'metric', bar: true, text: true, minWidth: 140 })],
      view: new View({ center: fromLonLat(toLonLatPair()), zoom: ryazanMapCenter.zoom }),
    });

    nextMap.on('pointermove', (event) => {
      const order = nextMap.forEachFeatureAtPixel(event.pixel, (feature) => feature.get('order') as Order | undefined);
      nextMap.getTargetElement().title = order?.address ?? '';
    });
    nextMap.on('click', (event) => {
      const order = nextMap.forEachFeatureAtPixel(event.pixel, (feature) => feature.get('order') as Order | undefined);
      setSelected(order ?? null);
    });

    setMap(nextMap);

    return () => {
      setMap(null);
      nextMap.setTarget(undefined);
    };
  }, [baseLayer]);

  useEffect(() => {
    if (!map) return;

    const vectorLayer = map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource> | undefined;
    const source = vectorLayer?.getSource();
    if (!source) return;

    source.clear();
    ordersWithPoints.forEach((order) => {
      const point = order.gisPoint!;
      const feature = new Feature({
        geometry: new Point(fromLonLat([point.longitude, point.latitude])),
        order,
      });
      feature.setStyle(markerStyle(colorByOrder(order)));
      source.addFeature(feature);
    });

    window.requestAnimationFrame(() => {
      map.updateSize();
      if (ordersWithPoints.length === 1) {
        const point = ordersWithPoints[0].gisPoint!;
        map.getView().animate({
          center: fromLonLat([point.longitude, point.latitude]),
          zoom: 15,
          duration: 450,
        });
        return;
      }
      if (ordersWithPoints.length > 1) {
        const extent = source.getExtent();
        if (extent) {
          map.getView().fit(extent, {
            padding: [70, 70, 70, 70],
            maxZoom: 15,
            duration: 450,
          });
        }
      }
    });
  }, [map, ordersWithPoints]);

  const centerMap = () => {
    if (!map) return;
    if (selected?.gisPoint) {
      map.getView().animate({
        center: fromLonLat([selected.gisPoint.longitude, selected.gisPoint.latitude]),
        zoom: 16,
        duration: 450,
      });
      return;
    }
    map.getView().animate({ center: fromLonLat(toLonLatPair()), zoom: ryazanMapCenter.zoom, duration: 450 });
  };

  return (
    <div className={isFullscreen ? 'gis-map-shell gis-map-shell--fullscreen' : 'gis-map-shell'}>
      <div className="gis-map" ref={ref}>
        {!ordersWithPoints.length && (
          <div className="gis-map__empty">
            <EmptyState title="Нет ордеров с координатами" />
          </div>
        )}

        <div className="gis-map-toolbar">
          <Button variant="secondary" onClick={centerMap}>Центрировать</Button>
          <Button variant="secondary" onClick={() => setIsFullscreen((value) => !value)}>
            {isFullscreen ? 'Обычный режим' : 'На весь экран'}
          </Button>
          <select className="select gis-map-toolbar__select" value={baseLayer} onChange={(event) => setBaseLayer(event.target.value as BaseMapLayer)}>
            <option value="osm">OSM Standard</option>
            <option value="humanitarian">OSM Humanitarian</option>
          </select>
        </div>

        <div className="gis-map-legend" aria-label="Легенда карты">
          <strong>Легенда</strong>
          {orderLegendItems.map((item) => (
            <span key={item.label}>
              <i style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>

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
    </div>
  );
};
