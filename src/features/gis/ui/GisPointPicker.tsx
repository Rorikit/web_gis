import { useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { toLonLat, fromLonLat } from 'ol/proj';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import { ryazanMapCenter, toLonLatPair } from '@/shared/constants/map';
import { Button, Modal } from '@/shared/ui';

const pickedPointStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: '#dc2626' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

export const GisPointPicker = ({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (point: { latitude: number; longitude: number }) => void;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!open || !ref.current) return;
    setPoint(null);

    const markerSource = new VectorSource();
    const markerFeature = new Feature();
    markerFeature.setStyle(pickedPointStyle);
    markerSource.addFeature(markerFeature);

    const map = new Map({
      target: ref.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: markerSource })],
      view: new View({ center: fromLonLat(toLonLatPair()), zoom: ryazanMapCenter.zoom }),
    });
    map.on('click', (event) => {
      const [longitude, latitude] = toLonLat(event.coordinate);
      markerFeature.setGeometry(new Point(event.coordinate));
      setPoint({ latitude, longitude });
    });
    return () => map.setTarget(undefined);
  }, [open]);

  return (
    <Modal open={open} title="Указать точку на карте" onClose={onClose}>
      <div className="gis-map" ref={ref} style={{ height: 560 }} />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : 'Выберите точку кликом на карте'}</span>
        <Button disabled={!point} onClick={() => point && onSave(point)}>Сохранить точку</Button>
      </div>
    </Modal>
  );
};
