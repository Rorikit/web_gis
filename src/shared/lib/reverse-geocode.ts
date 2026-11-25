export const reverseGeocode = async (latitude: number, longitude: number, signal?: AbortSignal): Promise<string | null> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=0`;
  try {
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null && 'display_name' in data && typeof (data as { display_name: unknown }).display_name === 'string') {
      return (data as { display_name: string }).display_name;
    }
    return null;
  } catch {
    return null;
  }
};


export type AddressSearchResult = {
  label: string;
  latitude: number;
  longitude: number;
};

export const searchAddress = async (query: string, signal?: AbortSignal): Promise<AddressSearchResult[]> => {
  const text = query.trim();
  if (!text) return [];
  const normalized = /рязан/i.test(text) ? text : `${text}, Рязань`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&q=${encodeURIComponent(normalized)}`;
  try {
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      if (typeof item !== 'object' || item === null) return [];
      const record = item as Record<string, unknown>;
      const latitude = Number(record.lat);
      const longitude = Number(record.lon);
      const label = typeof record.display_name === 'string' ? record.display_name : '';
      if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      return [{ label, latitude, longitude }];
    });
  } catch {
    return [];
  }
};
