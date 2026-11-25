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
import { reverseGeocode, searchAddress, type AddressSearchResult } from '@/shared/lib/reverse-geocode';
import { Button, Input, Modal } from '@/shared/ui';

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
  onSave: (point: { latitude: number; longitude: number; address: string | null }) => void;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerFeatureRef = useRef<Feature<Point> | null>(null);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const selectPoint = (latitude: number, longitude: number, label?: string) => {
    const coordinate = fromLonLat([longitude, latitude]);
    markerFeatureRef.current?.setGeometry(new Point(coordinate));
    mapRef.current?.getView().animate({ center: coordinate, zoom: 17, duration: 250 });
    setPoint({ latitude, longitude });
    if (label) setAddress(label);
  };

  useEffect(() => {
    if (!open || !ref.current) return;
    setPoint(null);
    setAddress(null);
    setSearchQuery('');
    setSearchResults([]);

    const markerSource = new VectorSource();
    const markerFeature = new Feature<Point>();
    markerFeature.setStyle(pickedPointStyle);
    markerSource.addFeature(markerFeature);
    markerFeatureRef.current = markerFeature;

    const map = new Map({
      target: ref.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: markerSource })],
      view: new View({ center: fromLonLat(toLonLatPair()), zoom: ryazanMapCenter.zoom }),
    });
    mapRef.current = map;
    map.on('click', (event) => {
      const [longitude, latitude] = toLonLat(event.coordinate);
      markerFeature.setGeometry(new Point(event.coordinate));
      setPoint({ latitude, longitude });

      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;
      setAddress(null);
      setIsResolvingAddress(true);
      reverseGeocode(latitude, longitude, controller.signal)
        .then((result) => setAddress(result))
        .finally(() => setIsResolvingAddress(false));
    });
    return () => {
      geocodeAbortRef.current?.abort();
      searchAbortRef.current?.abort();
      markerFeatureRef.current = null;
      mapRef.current = null;
      map.setTarget(undefined);
    };
  }, [open]);

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearching(true);
    const results = await searchAddress(query, controller.signal);
    if (!controller.signal.aborted) {
      setSearchResults(results);
      if (results[0]) selectPoint(results[0].latitude, results[0].longitude, results[0].label);
      setIsSearching(false);
    }
  };

  return (
    <Modal open={open} title="Указать точку на карте" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Input
          value={searchQuery}
          placeholder="Поиск по улице и номеру дома, например: Ленина 12"
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void runSearch();
            }
          }}
        />
        <Button type="button" onClick={() => void runSearch()} disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? 'Поиск…' : 'Найти'}
        </Button>
      </div>
      {searchResults.length > 1 && (
        <div className="gis-search-results">
          {searchResults.map((result) => (
            <button
              key={`${result.latitude}-${result.longitude}-${result.label}`}
              type="button"
              onClick={() => selectPoint(result.latitude, result.longitude, result.label)}
            >
              {result.label}
            </button>
          ))}
        </div>
      )}
      <div className="gis-map" ref={ref} style={{ height: 520 }} />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>
          {point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : 'Выберите точку кликом на карте'}
          {isResolvingAddress && ' · определение адреса…'}
          {!isResolvingAddress && address && ` · ${address}`}
        </span>
        <Button disabled={!point} onClick={() => point && onSave({ ...point, address })}>Сохранить точку</Button>
      </div>
    </Modal>
  );
};
