<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import {
  buildModelsEndpointCandidates,
  DEFAULT_AI_SERVER_URL,
  getActiveAiConfig,
  loadAiSettings,
  parseModels,
  saveAiSettings,
} from "@/utils/aiSettings";
import {
  getAutoDeleteMinutes,
  setAutoDeleteMinutes,
  AUTO_DELETE_MINUTES_KEY,
} from "@/utils/appSettings";
import {
  themes,
  loadTheme,
  applyTheme,
  loadCustomThemes,
  saveCustomThemes,
  loadExternalThemes,
  saveExternalThemes,
  getAllThemes,
  getAllThemesWithExternal,
  exportThemeAsCss,
  loadWallpaper,
  saveWallpaper,
  applyWallpaper,
  CSS_VAR_LABELS,
  CSS_VAR_GROUPS,
} from "@/utils/themeSettings";
import { getTodos } from "@/services/todoService";
import { getCategories } from "@/services/categoryService";

// ── Theme ──────────────────────────────────────────────────────────────────
const currentTheme = ref(loadTheme());
const themeGroups = ["Light", "Dark", "Colorful", "Custom", "External"];
const customThemes = ref(loadCustomThemes());
const externalThemes = ref(loadExternalThemes());

const allThemesList = computed(() => [
  ...themes,
  ...customThemes.value,
  ...externalThemes.value,
]);

const themesByGroup = computed(() =>
  Object.fromEntries(
    themeGroups.map((g) => [
      g,
      allThemesList.value.filter((t) => t.group === g),
    ]),
  ),
);

function selectTheme(id) {
  currentTheme.value = id;
  applyTheme(id);
}

// ── Custom theme creator ───────────────────────────────────────────────────
const showThemeCreator = ref(false);

function blankThemeForm() {
  const base = themes.find((t) => t.id === "light");
  return { name: "", baseId: "light", vars: { ...base.vars } };
}

const themeForm = ref(blankThemeForm());

function openThemeCreator() {
  themeForm.value = blankThemeForm();
  showThemeCreator.value = true;
}

function loadBaseTheme() {
  const base = allThemesList.value.find((t) => t.id === themeForm.value.baseId);
  if (base) themeForm.value.vars = { ...base.vars };
}

function saveCustomTheme() {
  const name = themeForm.value.name.trim() || "Custom Theme";
  const id = "custom-" + Date.now();
  const newTheme = {
    id,
    name,
    group: "Custom",
    preview: [
      themeForm.value.vars["--bg"],
      themeForm.value.vars["--surface"],
      themeForm.value.vars["--accent"],
    ],
    vars: { ...themeForm.value.vars },
  };
  customThemes.value = [...customThemes.value, newTheme];
  saveCustomThemes(customThemes.value);
  showThemeCreator.value = false;
  selectTheme(id);
}

function deleteCustomTheme(id) {
  customThemes.value = customThemes.value.filter((t) => t.id !== id);
  saveCustomThemes(customThemes.value);
  if (currentTheme.value === id) selectTheme("light");
}

function deleteExternalTheme(id) {
  externalThemes.value = externalThemes.value.filter((t) => t.id !== id);
  saveExternalThemes(externalThemes.value);
  if (currentTheme.value === id) selectTheme("light");
}

// Listen for external theme updates
const handleExternalThemesUpdate = () => {
  externalThemes.value = loadExternalThemes();
};

onMounted(() => {
  window.addEventListener(
    "external-themes-updated",
    handleExternalThemesUpdate,
  );
});

onUnmounted(() => {
  window.removeEventListener(
    "external-themes-updated",
    handleExternalThemesUpdate,
  );
});

function downloadTheme(theme) {
  const css = exportThemeAsCss(theme, wallpaperDataUrl.value);
  downloadFile(css, `${theme.id}.css`, "text/css");
}

// ── Theme Publishing ───────────────────────────────────────────────────────
const showPublishModal = ref(false);
const themeToPublish = ref(null);
const publishDescription = ref("");
const publishStatus = ref("");
const isPublishing = ref(false);

function openPublishModal(theme) {
  themeToPublish.value = theme;
  publishDescription.value = "";
  publishStatus.value = "";
  showPublishModal.value = true;
}

async function publishTheme() {
  if (!themeToPublish.value) return;

  isPublishing.value = true;
  publishStatus.value = "Generating theme...";

  try {
    const css = exportThemeAsCss(themeToPublish.value, wallpaperDataUrl.value);
    const blob = new Blob([css], { type: "text/css" });

    const formData = new FormData();
    formData.append("display_name", themeToPublish.value.name);
    formData.append("description", publishDescription.value);
    formData.append("theme_css", blob, `${themeToPublish.value.id}.css`);

    publishStatus.value = "Uploading to marketplace...";

    const response = await fetch(
      "http://localhost/Todo-App-Backend/public/index.php/themes/upload",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Fetch: "true"
        },
        body: formData,
      }
    );

    if (!response.ok) {
      // Backend might redirect with an error flash or return HTML, 
      // but let's check response status.
      throw new Error(`Server returned ${response.status}`);
    }

    // Success
    publishStatus.value = "Theme published successfully!";
    setTimeout(() => {
      showPublishModal.value = false;
      themeToPublish.value = null;
      publishStatus.value = "";
    }, 2000);
  } catch (error) {
    console.error("Publish error:", error);
    publishStatus.value = `Failed to publish: ${error.message}`;
  } finally {
    isPublishing.value = false;
  }
}

// ── Wallpaper ──────────────────────────────────────────────────────────────
const wallpaperDataUrl = ref(loadWallpaper());
const wallpaperError = ref("");

function handleWallpaperUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  wallpaperError.value = "";
  if (file.size > 3 * 1024 * 1024) {
    wallpaperError.value =
      "Image is larger than 3 MB — consider a smaller file for best performance.";
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    wallpaperDataUrl.value = e.target.result;
    saveWallpaper(e.target.result);
    applyWallpaper(e.target.result);
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function removeWallpaper() {
  wallpaperDataUrl.value = null;
  wallpaperError.value = "";
  saveWallpaper(null);
  applyWallpaper(null);
}

const form = ref(loadAiSettings());
const modelsLoading = ref(false);
const connectionStatus = ref(getInitialStatus());

// Auto‑deletion: stored in minutes
const autoDeleteMinutes = ref(getAutoDeleteMinutes());

// Display values
const autoDeleteValue = ref(0);
const autoDeleteUnit = ref("days");

// Convert stored minutes to display value and unit (preserving whole units)
function syncDisplayFromMinutes(minutes) {
  if (minutes === 0) {
    autoDeleteValue.value = 0;
    autoDeleteUnit.value = "minutes";
    return;
  }
  // weeks
  const weeks = minutes / (7 * 24 * 60);
  if (Number.isInteger(weeks)) {
    autoDeleteValue.value = weeks;
    autoDeleteUnit.value = "weeks";
    return;
  }
  // days
  const days = minutes / (24 * 60);
  if (Number.isInteger(days)) {
    autoDeleteValue.value = days;
    autoDeleteUnit.value = "days";
    return;
  }
  // hours
  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    autoDeleteValue.value = hours;
    autoDeleteUnit.value = "hours";
    return;
  }
  // minutes
  autoDeleteValue.value = minutes;
  autoDeleteUnit.value = "minutes";
}

syncDisplayFromMinutes(autoDeleteMinutes.value);

// Watch display changes and update stored minutes
watch([autoDeleteValue, autoDeleteUnit], () => {
  let minutes = autoDeleteValue.value;
  if (autoDeleteUnit.value === "weeks") minutes *= 7 * 24 * 60;
  else if (autoDeleteUnit.value === "days") minutes *= 24 * 60;
  else if (autoDeleteUnit.value === "hours") minutes *= 60;
  if (!isNaN(minutes) && minutes >= 0) {
    setAutoDeleteMinutes(minutes);
    autoDeleteMinutes.value = minutes;
    window.dispatchEvent(
      new CustomEvent("auto-delete-minutes-changed", { detail: minutes }),
    );
  }
});

// If stored minutes change from another tab, update display
watch(autoDeleteMinutes, (newMinutes) => {
  syncDisplayFromMinutes(newMinutes);
});

// Listen for storage events from other tabs
const handleStorage = (e) => {
  if (e.key === AUTO_DELETE_MINUTES_KEY) {
    autoDeleteMinutes.value = getAutoDeleteMinutes();
  }
};
window.addEventListener("storage", handleStorage);

onUnmounted(() => {
  window.removeEventListener("storage", handleStorage);
});

const activeConfig = computed(() => getActiveAiConfig(form.value));
const activeEndpointSignature = computed(
  () => `${activeConfig.value.source}:${activeConfig.value.requestBaseUrl}`,
);

function getInitialStatus() {
  const settings = loadAiSettings();
  const active = getActiveAiConfig(settings);

  if (!active.requestBaseUrl) {
    return "Configure the active server URL or API base URL to load models.";
  }

  if (settings.models.length) {
    return `Saved ${settings.models.length} model option(s). Refresh to reload from the active profile.`;
  }

  return "Load models from the active profile.";
}

function authHeaders() {
  const headers = {};

  if (activeConfig.value.apiKey) {
    headers.Authorization = `Bearer ${activeConfig.value.apiKey}`;
  }

  return headers;
}

async function requestJson(options = {}) {
  const urls = buildModelsEndpointCandidates(activeConfig.value.requestBaseUrl);
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      `No model endpoint could be reached from ${activeConfig.value.requestBaseUrl}`,
    )
  );
}

function getPreferredSecondaryModel() {
  return (
    form.value.models.find((model) => model.id !== form.value.primaryModel)
      ?.id ||
    form.value.primaryModel ||
    ""
  );
}

function syncModelSelection() {
  if (!form.value.models.length) {
    form.value.primaryModel = "";
    form.value.secondaryModel = "";
    return;
  }

  const modelIds = new Set(form.value.models.map((model) => model.id));

  if (!modelIds.has(form.value.primaryModel)) {
    form.value.primaryModel = form.value.models[0].id;
  }

  if (!modelIds.has(form.value.secondaryModel)) {
    form.value.secondaryModel = getPreferredSecondaryModel();
  }

  if (
    form.value.useSecondModel &&
    form.value.models.length > 1 &&
    form.value.secondaryModel === form.value.primaryModel
  ) {
    form.value.secondaryModel = getPreferredSecondaryModel();
  }
}

async function loadModels() {
  if (!activeConfig.value.requestBaseUrl) {
    connectionStatus.value =
      "Configure the active server URL or API base URL first.";
    return;
  }

  modelsLoading.value = true;
  connectionStatus.value = "Loading models...";

  try {
    const payload = await requestJson({
      method: "GET",
      headers: authHeaders(),
    });

    form.value.models = parseModels(payload);
    syncModelSelection();

    if (!form.value.models.length) {
      connectionStatus.value = "Connected, but no models were returned.";
      return;
    }

    connectionStatus.value = `Connected. Loaded ${form.value.models.length} model(s).`;
  } catch (error) {
    connectionStatus.value = `Connection failed: ${error.message}`;
    form.value.models = [];
    form.value.primaryModel = "";
    form.value.secondaryModel = "";
  } finally {
    modelsLoading.value = false;
  }
}

watch(
  form,
  (value) => {
    saveAiSettings(value);
  },
  { deep: true },
);

watch(activeEndpointSignature, (next, previous) => {
  if (!previous || previous === next) return;

  form.value.models = [];
  form.value.primaryModel = "";
  form.value.secondaryModel = "";
  connectionStatus.value = activeConfig.value.requestBaseUrl
    ? "Connection target changed. Load models for this profile."
    : "Configure the active server URL or API base URL to load models.";
});

watch(
  () => form.value.primaryModel,
  () => {
    if (
      form.value.useSecondModel &&
      form.value.models.length > 1 &&
      form.value.secondaryModel === form.value.primaryModel
    ) {
      form.value.secondaryModel = getPreferredSecondaryModel();
    }
  },
);

watch(
  () => form.value.useSecondModel,
  (enabled) => {
    if (enabled && !form.value.secondaryModel) {
      form.value.secondaryModel = getPreferredSecondaryModel();
    }
  },
);

// ── Export ─────────────────────────────────────────────────────────────────
const exportLoading = ref(false);
const exportStatus = ref("");

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportAsJson() {
  exportLoading.value = true;
  exportStatus.value = "";
  try {
    const [todos, categories] = await Promise.all([
      getTodos(),
      getCategories(),
    ]);
    const payload = { exportedAt: new Date().toISOString(), todos, categories };
    downloadFile(
      JSON.stringify(payload, null, 2),
      "todos-export.json",
      "application/json",
    );
    exportStatus.value = `Exported ${todos.length} todo(s).`;
  } catch (e) {
    exportStatus.value = `Export failed: ${e.message}`;
  } finally {
    exportLoading.value = false;
  }
}

async function exportAsCsv() {
  exportLoading.value = true;
  exportStatus.value = "";
  try {
    const [todos, categories] = await Promise.all([
      getTodos(),
      getCategories(),
    ]);
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const headers = [
      "id",
      "title",
      "description",
      "status",
      "dueDate",
      "dueTime",
      "category",
      "createdAt",
    ];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = todos.map((t) =>
      [
        t.id,
        t.title,
        t.description,
        t.status,
        t.dueDate,
        t.dueTime,
        catMap[t.categoryId] ?? "",
        t.createdAt,
      ]
        .map(escape)
        .join(","),
    );
    downloadFile(
      [headers.join(","), ...rows].join("\n"),
      "todos-export.csv",
      "text/csv",
    );
    exportStatus.value = `Exported ${todos.length} todo(s).`;
  } catch (e) {
    exportStatus.value = `Export failed: ${e.message}`;
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <section class="settings-page">
    <header class="page-head">
      <h1>Settings</h1>
      <p>Settings are saved automatically in this browser.</p>
    </header>

    <div class="settings-grid">
      <article class="panel">
        <h2>Server & Auth</h2>

        <label class="toggle">
          <input v-model="form.useDefaultServer" type="checkbox" />
          <span>Use default server</span>
        </label>

        <p class="hint">
          The default server starts at <code>{{ DEFAULT_AI_SERVER_URL }}</code
          >, but both server profiles can be customized. You can also override
          the API base URL for providers like OpenAI or Google.
        </p>

        <div class="server-block" :class="{ active: form.useDefaultServer }">
          <h3>Default server</h3>
          <div class="row">
            <label for="default-server-url">Server URL (optional)</label>
            <input
              id="default-server-url"
              v-model="form.defaultServerUrl"
              type="url"
              placeholder="https://ai.hallenbarter.org"
            />
          </div>
          <div class="row">
            <label for="default-api-url">API base URL</label>
            <input
              id="default-api-url"
              v-model="form.defaultApiUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div class="row">
            <label for="default-api-key">API key</label>
            <input
              id="default-api-key"
              v-model="form.defaultApiKey"
              type="password"
              placeholder="Optional if your API/server is open"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="server-block" :class="{ active: !form.useDefaultServer }">
          <h3>Custom server</h3>
          <div class="row">
            <label for="custom-server-url"
              >Custom domain / URL (optional)</label
            >
            <input
              id="custom-server-url"
              v-model="form.customServerUrl"
              type="url"
              placeholder="https://your-server.example"
            />
          </div>
          <div class="row">
            <label for="custom-api-url">Custom API base URL</label>
            <input
              id="custom-api-url"
              v-model="form.customApiUrl"
              type="url"
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
            />
          </div>
          <div class="row">
            <label for="custom-api-key">Custom API key</label>
            <input
              id="custom-api-key"
              v-model="form.customApiKey"
              type="password"
              placeholder="Paste the key for your custom API or server"
              autocomplete="off"
            />
          </div>
        </div>

        <p class="active-line">
          Active profile:
          <strong>{{
            form.useDefaultServer ? "Default server" : "Custom server"
          }}</strong>
          <span v-if="activeConfig.serverUrl">
            server <code>{{ activeConfig.serverUrl }}</code>
          </span>
          <span v-if="activeConfig.apiUrl">
            API <code>{{ activeConfig.apiUrl }}</code>
          </span>
        </p>

        <div class="actions">
          <button :disabled="modelsLoading" @click="loadModels">
            {{ modelsLoading ? "Loading models..." : "Load Models" }}
          </button>
          <button :disabled="modelsLoading" @click="loadModels">Refresh</button>
        </div>

        <p class="status">{{ connectionStatus }}</p>
      </article>

      <article class="panel">
        <h2>Model Setup</h2>

        <div class="row">
          <label for="primary-model">Primary model</label>
          <select
            id="primary-model"
            v-model="form.primaryModel"
            :disabled="!form.models.length"
          >
            <option value="">
              {{
                form.models.length
                  ? "Select model from server"
                  : "Load models from the active server first"
              }}
            </option>
            <option
              v-for="model in form.models"
              :key="model.id"
              :value="model.id"
            >
              {{ model.label }}
            </option>
          </select>
        </div>

        <label class="toggle">
          <input
            v-model="form.useSecondModel"
            type="checkbox"
            :disabled="!form.models.length"
          />
          <span>Combine with second model for higher accuracy</span>
        </label>

        <div v-if="form.useSecondModel" class="row">
          <label for="secondary-model">Secondary model</label>
          <select
            id="secondary-model"
            v-model="form.secondaryModel"
            :disabled="!form.models.length"
          >
            <option value="">
              {{
                form.models.length ? "Select second model" : "Load models first"
              }}
            </option>
            <option
              v-for="model in form.models"
              :key="`secondary-${model.id}`"
              :value="model.id"
            >
              {{ model.label }}
            </option>
          </select>
        </div>

        <p class="hint">
          Compatible endpoints are detected from the active connection target.
          OpenAI‑style and Ollama‑style model lists are both supported. Use a
          base URL such as <code>https://api.openai.com/v1</code>, not the full
          endpoint path.
        </p>
      </article>

      <article class="panel">
        <h2>Appearance</h2>
        <p class="hint">
          Choose a theme. Hover a swatch to download it as a CSS file for the
          marketplace.
        </p>

        <div v-for="group in themeGroups" :key="group" class="theme-group">
          <h3 class="group-label">{{ group }}</h3>
          <div class="theme-grid">
            <div
              v-for="theme in themesByGroup[group]"
              :key="theme.id"
              class="theme-swatch-wrap"
            >
              <button
                class="theme-swatch"
                :class="{ active: currentTheme === theme.id }"
                :title="theme.name"
                @click="selectTheme(theme.id)"
              >
                <span class="swatch-colors">
                  <span
                    class="swatch-dot"
                    :style="{ background: theme.preview[0] }"
                  />
                  <span
                    class="swatch-dot"
                    :style="{ background: theme.preview[1] }"
                  />
                  <span
                    class="swatch-dot"
                    :style="{ background: theme.preview[2] }"
                  />
                </span>
                <span class="swatch-label">{{ theme.name }}</span>
              </button>
              <div class="swatch-actions">
                <button
                  class="icon-btn"
                  title="Download theme as CSS"
                  @click.stop="downloadTheme(theme)"
                >
                  &#8595;
                </button>
                <button
                  v-if="theme.group === 'Custom'"
                  class="icon-btn"
                  title="Publish to Marketplace"
                  @click.stop="openPublishModal(theme)"
                >
                  &#8593;
                </button>
                <button
                  v-if="theme.group === 'Custom'"
                  class="icon-btn danger"
                  title="Delete theme"
                  @click.stop="deleteCustomTheme(theme.id)"
                >
                  &#x2715;
                </button>
                <button
                  v-if="theme.group === 'External'"
                  class="icon-btn danger"
                  title="Remove theme"
                  @click.stop="deleteExternalTheme(theme.id)"
                >
                  &#x2715;
                </button>
              </div>
            </div>
            <button
              v-if="group === 'Custom'"
              class="theme-swatch add-swatch"
              @click="openThemeCreator"
            >
              <span class="add-icon">+</span>
              <span class="swatch-label">New</span>
            </button>
          </div>
        </div>

        <!-- Custom theme creator -->
        <div v-if="showThemeCreator" class="theme-creator">
          <h3>Create Custom Theme</h3>

          <div class="row">
            <label>Name</label>
            <input
              v-model="themeForm.name"
              type="text"
              placeholder="My Theme"
            />
          </div>

          <div class="row">
            <label>Start from</label>
            <select v-model="themeForm.baseId" @change="loadBaseTheme">
              <option v-for="t in allThemesList" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <div v-for="vg in CSS_VAR_GROUPS" :key="vg.label" class="var-group">
            <h4 class="var-group-label">{{ vg.label }}</h4>
            <div class="color-grid">
              <label v-for="v in vg.vars" :key="v" class="color-row">
                <input type="color" v-model="themeForm.vars[v]" />
                <span>{{ CSS_VAR_LABELS[v] }}</span>
              </label>
            </div>
          </div>

          <div class="actions creator-actions">
            <button @click="saveCustomTheme">Save Theme</button>
            <button class="btn-ghost" @click="showThemeCreator = false">
              Cancel
            </button>
          </div>
        </div>

        <!-- Publish Modal -->
        <div v-if="showPublishModal" class="theme-creator publish-modal">
          <h3>Publish Theme</h3>
          <p class="hint">
            Upload "<strong>{{ themeToPublish?.name }}</strong>" to the public
            marketplace for others to use.
          </p>

          <div class="row">
            <label>Description</label>
            <textarea
              v-model="publishDescription"
              placeholder="Describe your theme's mood and colors..."
              rows="3"
            ></textarea>
          </div>

          <p v-if="publishStatus" class="status" :class="{ warn: publishStatus.includes('Failed'), success: publishStatus.includes('successfully') }">
            {{ publishStatus }}
          </p>

          <div class="actions creator-actions">
            <button
              @click="publishTheme"
              :disabled="isPublishing"
            >
              {{ isPublishing ? "Publishing..." : "Publish to Marketplace" }}
            </button>
            <button class="btn-ghost" @click="showPublishModal = false" :disabled="isPublishing">
              Cancel
            </button>
          </div>
        </div>

        <!-- Wallpaper -->
        <div class="wallpaper-section">
          <h3>Wallpaper</h3>
          <p class="hint">
            The wallpaper is embedded as base64 in downloaded theme CSS files,
            keeping them self-contained for marketplace uploads.
          </p>
          <div v-if="wallpaperDataUrl" class="wallpaper-preview">
            <img :src="wallpaperDataUrl" alt="Wallpaper preview" />
          </div>
          <p v-if="wallpaperError" class="status warn">{{ wallpaperError }}</p>
          <div class="actions">
            <label class="btn-upload">
              {{ wallpaperDataUrl ? "Change Wallpaper" : "Upload Wallpaper" }}
              <input
                type="file"
                accept="image/*"
                @change="handleWallpaperUpload"
              />
            </label>
            <button v-if="wallpaperDataUrl" @click="removeWallpaper">
              Remove
            </button>
          </div>
        </div>
      </article>

      <article class="panel">
        <h2>Export</h2>
        <p class="hint">Download all your todos and categories as a file.</p>
        <div class="actions">
          <button :disabled="exportLoading" @click="exportAsJson">
            Export as JSON
          </button>
          <button :disabled="exportLoading" @click="exportAsCsv">
            Export as CSV
          </button>
        </div>
        <p v-if="exportStatus" class="status">{{ exportStatus }}</p>
      </article>

      <article class="panel">
        <h2>Auto‑Deletion</h2>
        <div class="row">
          <label>Delete completed todos after</label>
          <div class="unit-input-group">
            <input
              v-model.number="autoDeleteValue"
              type="number"
              min="0"
              step="1"
              class="value-input"
            />
            <select v-model="autoDeleteUnit" class="unit-select">
              <option value="weeks">weeks</option>
              <option value="days">days</option>
              <option value="hours">hours</option>
              <option value="minutes">minutes</option>
            </select>
          </div>
          <p class="hint">
            0 means immediate deletion. The countdown will show the remaining
            time in the largest units.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head h1 {
  margin: 0 0 6px;
}

.page-head p {
  margin: 0;
  color: var(--text-muted);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 16px;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.panel h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.toggle input {
  margin: 0;
}

.server-block {
  border: 1px solid var(--border);
  padding: 14px;
  margin-bottom: 12px;
  background: var(--surface-muted);
}

.server-block.active {
  border-color: var(--text-strong);
  background: var(--surface);
}

input,
select,
button {
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  padding: 9px 10px;
  font-size: 14px;
}

button {
  cursor: pointer;
}

button:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.hint,
.status,
.active-line {
  margin: 0;
  color: var(--text-muted);
}

.hint {
  margin-bottom: 12px;
}

code {
  font-family: monospace;
}

/* Styles for the unit input group */
.unit-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
.value-input {
  flex: 2;
}
.unit-select {
  flex: 1;
}

/* ── Appearance / theme swatches ── */
.theme-group {
  margin-bottom: 16px;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 10px;
}

.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.theme-swatch-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.theme-swatch-wrap:hover .swatch-actions {
  opacity: 1;
}

.swatch-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.icon-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  padding: 2px 7px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  line-height: 1.4;
}

.icon-btn:hover {
  background: var(--accent-soft);
  color: var(--text);
}

.icon-btn.danger:hover {
  background: #ffd5d5;
  color: #b00;
}

.theme-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.1s;
  min-width: 72px;
}

.theme-swatch:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.theme-swatch.active {
  border-color: var(--accent);
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.add-swatch {
  border-style: dashed;
}

.add-icon {
  font-size: 22px;
  line-height: 1;
  color: var(--text-muted);
}

.swatch-colors {
  display: flex;
  gap: 3px;
}

.swatch-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: block;
}

.swatch-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ── Custom theme creator ── */
.theme-creator {
  margin-top: 16px;
  border: 1px solid var(--border);
  padding: 16px;
  background: var(--surface-muted);
}

.theme-creator h3 {
  margin: 0 0 14px;
  font-size: 15px;
}

.var-group {
  margin-bottom: 14px;
}

.var-group-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.color-row input[type="color"] {
  width: 28px;
  height: 28px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.creator-actions {
  margin-top: 16px;
  margin-bottom: 0;
}

.btn-ghost {
  background: transparent !important;
  border-color: var(--border) !important;
  color: var(--text-muted) !important;
}

/* ── Wallpaper ── */
.wallpaper-section {
  margin-top: 20px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.wallpaper-section h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.wallpaper-preview {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-bottom: 10px;
}

.wallpaper-preview img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.btn-upload {
  display: inline-block;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  padding: 9px 10px;
  font-size: 14px;
  cursor: pointer;
}

.btn-upload:hover {
  border-color: var(--accent);
}

.btn-upload input[type="file"] {
  display: none;
}

.warn {
  color: #b06000 !important;
}

@media (max-width: 960px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
