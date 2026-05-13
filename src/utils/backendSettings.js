// ── Backend URL settings ───────────────────────────────────────────────────
// Allows the user to select which backend to use in the settings view.
// Falls back to full offline mode when no backend is configured or reachable.

const BACKEND_URL_KEY = "todo-app.backend-url";

export const DEFAULT_BACKEND_URL = "http://localhost:8080/api/v1";
export const JSON_SERVER_URL = "http://localhost:3000";

export const BACKEND_PRESETS = [
  {
    id: "spring-boot",
    label: "Spring Boot Backend",
    url: "http://localhost:8080/api/v1",
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
  "http://localhost/Todo-App-Backend/public/index.php";

export function loadThemeStoreUrl() {
  return localStorage.getItem(THEME_STORE_URL_KEY) || DEFAULT_THEME_STORE_URL;
}

export function saveThemeStoreUrl(url) {
  localStorage.setItem(THEME_STORE_URL_KEY, url.replace(/\/+$/, ""));
}

export function getThemeStoreBaseUrl() {
  return loadThemeStoreUrl();
}
