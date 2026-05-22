export type ApiModule =
  | 'auth'
  | 'damages'
  | 'orders'
  | 'gis'
  | 'users'
  | 'audit'
  | 'reports'
  | 'exports';

const ALL_API_MODULES: ApiModule[] = [
  'auth',
  'damages',
  'orders',
  'gis',
  'users',
  'audit',
  'reports',
  'exports',
];

const API_MODULE_SET = new Set<ApiModule>(ALL_API_MODULES);

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const parseModuleSet = (value: string | undefined): Set<ApiModule> => {
  const source = value ?? 'reports,exports';
  const modules = source
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is ApiModule => API_MODULE_SET.has(part as ApiModule));

  return new Set<ApiModule>(modules);
};

export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  gisApiUrl: import.meta.env.VITE_GIS_API_URL || '/gis-api',
  appName: import.meta.env.VITE_APP_NAME || 'Система учета повреждений теплосетей',
  mockFallbackEnabled: parseBoolean(import.meta.env.VITE_ENABLE_MOCK_FALLBACK, true),
  mockFallbackModules: parseModuleSet(import.meta.env.VITE_MOCK_FALLBACK_MODULES),
};

export const isMockFallbackEnabledFor = (module: ApiModule) =>
  env.mockFallbackEnabled && env.mockFallbackModules.has(module);
