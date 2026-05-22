import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import type { GisPoint } from '@/entities';

export const GisMiniPreview = ({ point }: { point: GisPoint | null }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current || !point) return;
    const center = fromLonLat([point.longitude, point.latitude]);
    const source = new VectorSource({ features: [new Feature(new Point(center))] });
    const map = new Map({
      target: ref.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
      view: new View({ center, zoom: 15 }),
    });
    return () => map.setTarget(undefined);
  }, [point]);
  return <div className="gis-mini" ref={ref}>{!point && <div className="state">Точка не указана</div>}</div>;
};
