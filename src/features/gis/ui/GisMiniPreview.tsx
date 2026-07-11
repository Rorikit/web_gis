import { useEffect, useRef } from 'react';
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
import type { GisPoint } from '@/entities';
import { ryazanMapCenter, toLonLatPair } from '@/shared/constants/map';

const savedPointStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: '#2563eb' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

export const GisMiniPreview = ({ point }: { point: GisPoint | null }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const center = point ? fromLonLat([point.longitude, point.latitude]) : fromLonLat(toLonLatPair());
    const features = point ? [new Feature(new Point(center))] : [];
    features.forEach((feature) => feature.setStyle(savedPointStyle));
    const source = new VectorSource({ features });
    const map = new Map({
      target: ref.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
      view: new View({ center, zoom: point ? 15 : ryazanMapCenter.zoom }),
    });

    return () => map.setTarget(undefined);
  }, [point]);

  return (
    <div className="gis-mini" ref={ref}>
      {!point && <div className="gis-mini__empty">Точка не указана. Карта открыта по центру Рязани.</div>}
    </div>
  );
};
