export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  gisApiUrl: import.meta.env.VITE_GIS_API_URL || '/gis-api',
  appName: import.meta.env.VITE_APP_NAME || 'Система учета повреждений теплосетей',
};
