import type Map from 'ol/Map';
import { useEffect } from 'react';

export const useMapResize = (map: Map | null, target: HTMLElement | null) => {
  useEffect(() => {
    if (!map || !target) return;

    const updateSize = () => window.requestAnimationFrame(() => map.updateSize());
    const observer = new ResizeObserver(updateSize);
    observer.observe(target);
    updateSize();

    return () => observer.disconnect();
  }, [map, target]);
};
