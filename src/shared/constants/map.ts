export const ryazanMapCenter = {
  latitude: 54.6292,
  longitude: 39.7364,
  zoom: 12,
};

export const toLonLatPair = (point = ryazanMapCenter): [number, number] => [point.longitude, point.latitude];
