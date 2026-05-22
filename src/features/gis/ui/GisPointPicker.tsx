import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { toLonLat, fromLonLat } from 'ol/proj';
import { Button, Modal } from '@/shared/ui';

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
    const map = new Map({
      target: ref.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({ center: fromLonLat([37.6173, 55.7558]), zoom: 11 }),
    });
    map.on('click', (event) => {
      const [longitude, latitude] = toLonLat(event.coordinate);
      setPoint({ latitude, longitude });
    });
    return () => map.setTarget(undefined);
  }, [open]);

  return (
    <Modal open={open} title="Указать точку на карте" onClose={onClose}>
      <div className="gis-map" ref={ref} style={{ height: 460 }} />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : 'Выберите точку кликом на карте'}</span>
        <Button disabled={!point} onClick={() => point && onSave(point)}>Сохранить точку</Button>
      </div>
    </Modal>
  );
};
