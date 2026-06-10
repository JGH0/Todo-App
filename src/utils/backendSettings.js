// ── Backend URL settings ───────────────────────────────────────────────────
// Allows the user to select which backend to use in the settings view.
// Falls back to full offline mode when no backend is configured or reachable.

const BACKEND_URL_KEY = "todo-app.backend-url";

// In production the app runs behind an Nginx reverse proxy that forwards
// /api/ to the backend container. Use a relative URL so the browser
// sends API requests to the same origin (no CORS).
// During Docker builds, the VITE_API_BASE_URL env var can override this.
const BUILD_API_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : null;

export const DEFAULT_BACKEND_URL = BUILD_API_URL || "/api/v1";
export const JSON_SERVER_URL = "http://localhost:3000";

export const BACKEND_PRESETS = [
  {
    id: "same-origin",
    label: "Same-Origin Proxy",
    url: "/api/v1",
  },
  {
    id: "json-server",
    label: "JSON Server (npm run server)",
    url: "http://localhost:3000",
  },
  {
    id: "custom",
    label: "Custom URL",
    url: null,
  },
];

export function loadBackendUrl() {
  return localStorage.getItem(BACKEND_URL_KEY) || DEFAULT_BACKEND_URL;
}

export function saveBackendUrl(url) {
  localStorage.setItem(BACKEND_URL_KEY, url);
}

export function getBackendPresetId(url) {
  if (!url) return "custom";
  const preset = BACKEND_PRESETS.find((p) => p.url === url);
  return preset ? preset.id : "custom";
}

// ── Theme store URL settings ───────────────────────────────────────────────
// Separate from the main API URL because the theme store is always the
// CodeIgniter backend, regardless of which API backend the user picks.

const THEME_STORE_URL_KEY = "todo-app.theme-store-url";

export const DEFAULT_THEME_STORE_URL =
  "/index.php";

export function loadThemeStoreUrl() {
  return localStorage.getItem(THEME_STORE_URL_KEY) || DEFAULT_THEME_STORE_URL;
}

export function saveThemeStoreUrl(url) {
  localStorage.setItem(THEME_STORE_URL_KEY, url.replace(/\/+$/, ""));
}

export function getThemeStoreBaseUrl() {
  return loadThemeStoreUrl();
}
