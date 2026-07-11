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
