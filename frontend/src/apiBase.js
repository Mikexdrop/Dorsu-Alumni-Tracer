const API_BASE = (process && process.env && process.env.REACT_APP_API_BASE) ? process.env.REACT_APP_API_BASE.replace(/\/+$/, '') : '';
export function apiUrl(path) {
  if (!path) return API_BASE || '';
  if (!path.startsWith('/')) path = '/' + path;
  return (API_BASE || '') + path;
}
export default API_BASE;
