export const PHP_API_BASE_URL =
  process.env.NEXT_PUBLIC_PHP_API_BASE_URL || 'http://localhost/douche/douche-backend';

export const BACKEND_API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
export const AUTH_API_BASE_URL = '/api/auth';

export function getAuthApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${AUTH_API_BASE_URL}${normalizedPath}`;
}

