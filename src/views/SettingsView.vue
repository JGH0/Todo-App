<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import {
  buildModelsEndpointCandidates,
  getAllModels,
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
  exportThemeAsCss,
  loadWallpaper,
  saveWallpaper,
  applyWallpaper,
  CSS_VAR_LABELS,
  CSS_VAR_GROUPS,
} from "@/utils/themeSettings";
import {
  loadBackendUrl,
  saveBackendUrl,
  getBackendPresetId,
  loadThemeStoreUrl,
  saveThemeStoreUrl,
  BACKEND_PRESETS,
} from "@/utils/backendSettings";
import { updateApiBaseUrl } from "@/services/api";
import { getTodos } from "@/services/todoService";
import { getCategories } from "@/services/categoryService";
import {
  login,
  register,
  logout,
  getUser,
  isAuthenticated,
} from "@/services/authService";

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

    const response = await fetch(`${themeStoreUrl.value}/themes/upload`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Fetch: "true",
      },
      body: formData,
    });

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
      "Image is larger than 3 MB \u2014 consider a smaller file for best performance.";
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const ok = saveWallpaper(e.target.result);
    if (!ok) {
      wallpaperError.value =
        "Could not save wallpaper — storage quota exceeded. Try a smaller image.";
      return;
    }
    wallpaperDataUrl.value = e.target.result;
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
const modelsLoading = ref({});
const statusMsg = ref("");
const newProvName = ref("");
const newProvUrl = ref("");
const newProvKey = ref("");
const customModelInput = ref("");
const selectedProviderIdx = ref(null);


function allModels() {
  return getAllModels(form.value);
}

function providerModels(idx) {
  const prov = form.value.providers[idx]
  if (!prov) return []
  return [...new Set([...prov.models, ...(prov.customModels||[])])]
}

function labeledModels() {
  const seen = {}
  const result = []
  for (const prov of form.value.providers) {
    for (const m of [...(prov.models||[]), ...(prov.customModels||[])]) {
      if (!seen[m]) {
        seen[m] = true
        result.push({ val: m, label: m + ' (' + prov.name + ')' })
      } else {
        // Already seen from another provider — add source label
        result.push({ val: m, label: m + ' (' + prov.name + ')' })
      }
    }
  }
  return result
}

const showAddForm = ref(false)
const showDeleteModal = ref(false)
const deletingProviderIdx = ref(null)
const deletingProviderName = ref("")

function confirmRemoveProvider(idx) {
  deletingProviderIdx.value = idx
  deletingProviderName.value = form.value.providers[idx]?.name || ""
  showDeleteModal.value = true
}

function doRemoveProvider() {
  const idx = deletingProviderIdx.value
  if (idx === null || form.value.providers.length <= 1) return
  form.value.providers.splice(idx, 1)
  if (selectedProviderIdx.value >= form.value.providers.length) {
    selectedProviderIdx.value = form.value.providers.length - 1
  }
  showDeleteModal.value = false
  deletingProviderIdx.value = null
  saveAiSettings(form.value)
}

function addProvider() {
  form.value.providers.push({
    id: "prov_" + Math.random().toString(36).substring(2, 8),
    name: newProvName.value.trim() || "Provider #" + (form.value.providers.length + 1),
    baseUrl: newProvUrl.value.trim(),
    apiKey: newProvKey.value.trim(),
    models: [],
    customModels: [],
  });
  selectedProviderIdx.value = form.value.providers.length - 1;
  newProvName.value = "";
  newProvUrl.value = "";
  newProvKey.value = "";
  showAddForm.value = false;
  saveAiSettings(form.value);
}

function removeProvider(id) {
  if (form.value.providers.length <= 1) return;
  form.value.providers = form.value.providers.filter(p => p.id !== id);
  saveAiSettings(form.value);
}

function addCustomModel() {
  const name = customModelInput.value.trim();
  if (!name || selectedProviderIdx.value === null) return;
  const prov = form.value.providers[selectedProviderIdx.value];
  if (!prov) return;
  if (!prov.customModels) prov.customModels = [];
  if (!prov.customModels.includes(name)) prov.customModels.push(name);
  if (!form.value.primaryModel) form.value.primaryModel = name;
  customModelInput.value = "";
  saveAiSettings(form.value);
}

function removeCustomModel(provId, name) {
  const prov = form.value.providers.find(p => p.id === provId);
  if (!prov) return;
  prov.customModels = (prov.customModels || []).filter(m => m !== name);
  saveAiSettings(form.value);
}

async function loadModelsFor(prov) {
  if (!prov || !prov.baseUrl) { statusMsg.value = "Set a URL first."; return; }
  modelsLoading.value[prov.id] = true;
  statusMsg.value = "Loading models for " + prov.name + "...";
  const headers = {};
  if (prov.apiKey) headers.Authorization = "Bearer " + prov.apiKey;

  try {
    const urls = buildModelsEndpointCandidates(prov.baseUrl);
    let payload = null, lastErr = null;
    for (const url of urls) {
      try {
        const resp = await fetch(url, { method: "GET", headers });
        if (resp.ok) { payload = await resp.json(); break; }
        else {
          const txt = await resp.text();
          lastErr = new Error(txt || "HTTP " + resp.status);
        }
      } catch (e) { lastErr = e; }
    }
    if (payload) {
      const loaded = parseModels(payload);
      prov.models = [...new Set([...loaded])];
      statusMsg.value = "Loaded " + loaded.length + " model(s) for " + prov.name + ".";
    } else {
      statusMsg.value = "Could not reach " + prov.baseUrl + ": " + (lastErr?.message || "unknown error");
    }
  } catch (err) {
    statusMsg.value = "Failed: " + err.message;
  } finally {
    modelsLoading.value[prov.id] = false;
    saveAiSettings(form.value);
  }
}

watch(
  form,
  (val) => { saveAiSettings(val); },
  { deep: true },
);

// Auto-deletion: stored in minutes
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


watch(
  form,
  (value) => {
    saveAiSettings(value);
  },
  { deep: true },
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

// ── Authentication ───────────────────────────────────────────────────────────
const authEmail = ref("");
const authPassword = ref("");
const authName = ref("");
const authLoading = ref(false);
const authStatus = ref("");
const authMode = ref("login"); // 'login' or 'register'
const currentUser = ref(getUser());

async function handleAuth() {
  authLoading.value = true;
  authStatus.value = "";

  try {
    if (authMode.value === "register") {
      const result = await register({
        email: authEmail.value,
        password: authPassword.value,
        name: authName.value,
      });
      if (result.success) {
        authStatus.value = "Registration successful!";
        currentUser.value = getUser();
        authMode.value = "login";
      } else {
        authStatus.value = result.message || "Registration failed";
      }
    } else {
      const result = await login(authEmail.value, authPassword.value);
      if (result.success) {
        authStatus.value = "Login successful!";
        currentUser.value = getUser();
      } else {
        authStatus.value = result.message || "Login failed";
      }
    }
  } catch (error) {
    authStatus.value = "Error: " + error.message;
  } finally {
    authLoading.value = false;
  }
}

function handleLogout() {
  logout();
  currentUser.value = null;
  authStatus.value = "Successfully logged out";
}

function toggleAuthMode() {
  authMode.value = authMode.value === "login" ? "register" : "login";
  authStatus.value = "";
}

// ── Backend URL ──────────────────────────────────────────────────────────────
const backendUrl = ref(loadBackendUrl());
const backendPresetId = ref(getBackendPresetId(backendUrl.value));
const customBackendUrl = ref(
  backendPresetId.value === "custom" ? backendUrl.value : "",
);

function selectBackendPreset() {
  const preset = BACKEND_PRESETS.find((p) => p.id === backendPresetId.value);
  if (preset && preset.id === "custom") {
    backendUrl.value = customBackendUrl.value || preset.url || "";
  } else if (preset) {
    backendUrl.value = preset.url;
  }
  saveBackendUrl(backendUrl.value);
  updateApiBaseUrl(backendUrl.value);
}

watch(backendPresetId, () => {
  selectBackendPreset();
});

watch(customBackendUrl, () => {
  if (backendPresetId.value === "custom") {
    backendUrl.value = customBackendUrl.value;
    saveBackendUrl(backendUrl.value);
    updateApiBaseUrl(backendUrl.value);
  }
});

// ── Theme store URL ───────────────────────────────────────────────────────────
const themeStoreUrl = ref(loadThemeStoreUrl());

watch(themeStoreUrl, (val) => {
  saveThemeStoreUrl(val);
});

// ── Helpers ──────────────────────────────────────────────────────────────────
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
    exportStatus.value = "Exported " + todos.length + " todo(s).";
  } catch (e) {
    exportStatus.value = "Export failed: " + e.message;
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
    const escape = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
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
    exportStatus.value = "Exported " + todos.length + " todo(s).";
  } catch (e) {
    exportStatus.value = "Export failed: " + e.message;
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

    <div class="settings-grid" style="overflow-y: auto; max-height: calc(100vh - 120px); padding-bottom: 40px;">
      <!-- AI Providers -->
      <article class="panel">
        <h2>AI Providers</h2>
        <p class="hint">
          Each tab is an AI provider (OpenAI, DeepSeek, Anthropic, Google, Ollama...).
          Click + to add a new provider. Close a tab to remove it.
          All models are shown in the model selectors below with their source.
        </p>

        <!-- Tab bar -->
        <div class="provider-tabs">
          <button
            v-for="(prov, idx) in form.providers"
            :key="prov.id"
            class="tab-btn"
            :class="{ active: selectedProviderIdx === idx }"
            @click="selectedProviderIdx = idx"
          >
            <span class="tab-label">{{ prov.name }}</span>
            <span
              class="tab-close"
              @click.stop="confirmRemoveProvider(idx)"
              title="Remove provider"
            >&times;</span>
          </button>
          <button class="tab-btn tab-add" @click="showAddForm = !showAddForm" title="Add provider">+</button>
        </div>

        <!-- Active provider config (OR add form, never both) -->
        <div v-if="showAddForm" class="add-provider-form">
          <h3 style="margin: 0 0 8px; font-size: 0.95em;">New Provider</h3>
          <div class="row">
            <label>Name</label>
            <input v-model="newProvName" type="text" placeholder="e.g. DeepSeek" />
          </div>
          <div class="row">
            <label>Base URL</label>
            <input v-model="newProvUrl" type="url" placeholder="https://api.deepseek.com" />
          </div>
          <div class="row">
            <label>API Key</label>
            <input v-model="newProvKey" type="password" placeholder="sk-..." autocomplete="off" />
          </div>
          <div class="actions" style="margin-top: 8px;">
            <button @click="addProvider" :disabled="!newProvUrl.trim() || !newProvName.trim()">Add Provider</button>
            <button class="btn-cancel" @click="showAddForm = false">Cancel</button>
          </div>
        </div>

        <!-- Active provider config (only when not adding new) -->
        <div v-if="!showAddForm && form.providers[selectedProviderIdx]" class="provider-config">
          <div class="row">
            <label>Name</label>
            <input v-model="form.providers[selectedProviderIdx].name" type="text" />
          </div>
          <div class="row">
            <label>Base URL</label>
            <input v-model="form.providers[selectedProviderIdx].baseUrl" type="url" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="row">
            <label>API Key</label>
            <input v-model="form.providers[selectedProviderIdx].apiKey" type="password" placeholder="sk-..." autocomplete="off" />
          </div>

          <div class="actions" style="margin: 8px 0;">
            <button :disabled="modelsLoading[form.providers[selectedProviderIdx].id]" @click="loadModelsFor(form.providers[selectedProviderIdx])">
              {{ modelsLoading[form.providers[selectedProviderIdx].id] ? "Loading..." : "Load Models" }}
            </button>
          </div>

          <div class="prov-models" v-if="providerModels(selectedProviderIdx).length">
            <span v-for="m in providerModels(selectedProviderIdx)" :key="m" class="model-chip">
              {{ m }}
              <button class="chip-remove" @click="removeCustomModel(form.providers[selectedProviderIdx].id, m)" title="Remove">&times;</button>
            </span>
          </div>

          <div class="inline-row" style="margin-top: 6px;">
            <input v-model="customModelInput" type="text" placeholder="Add custom model name"
              @keydown.enter.prevent="addCustomModel" />
            <button class="btn-small btn-add-model" @click="addCustomModel" :disabled="!customModelInput.trim()">Add</button>
          </div>
        </div>

        <!-- Combined model selectors with source labels -->
        <h3 style="margin: 16px 0 8px; font-size: 1em;">Model Selection</h3>

        <div class="row">
          <label>Primary model</label>
          <select v-model="form.primaryModel">
            <option value="">Select model</option>
            <option v-for="m in labeledModels()" :key="m.val" :value="m.val">{{ m.label }}</option>
          </select>
        </div>

        <label class="toggle">
          <input v-model="form.useSecondModel" type="checkbox" />
          <span>Verify with second model (up to 5 rounds of correction)</span>
        </label>

        <div v-if="form.useSecondModel" class="row">
          <label>Secondary (verification) model</label>
          <select v-model="form.secondaryModel">
            <option value="">Select model</option>
            <option v-for="m in labeledModels()" :key="m.val" :value="m.val">{{ m.label }}</option>
          </select>
        </div>

        <p class="hint" style="margin-top: 8px;">
          When enabled, the secondary model reviews the primary's response for errors
          and requests corrections. This loops up to 5 times.
        </p>

        <p class="status" v-if="statusMsg" style="margin-top: 8px;">{{ statusMsg }}</p>
      </article>

      <!-- Delete confirmation modal -->
      <Teleport to="body">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
          <div class="modal-content modal-sm">
            <h3>Remove provider?</h3>
            <p>Are you sure you want to remove <strong>{{ deletingProviderName }}</strong>?</p>
            <div class="modal-actions">
              <button @click="showDeleteModal = false">Cancel</button>
              <button class="btn-danger" @click="doRemoveProvider">Remove</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Appearance -->
      <!-- Appearance -->
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
                  &darr;
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
                  &Cross;
                </button>
                <button
                  v-if="theme.group === 'External'"
                  class="icon-btn danger"
                  title="Remove theme"
                  @click.stop="deleteExternalTheme(theme.id)"
                >
                  &Cross;
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
            Upload "<strong>{{ themeToPublish?.name }}</strong
            >" to the public marketplace for others to use.
          </p>

          <div class="row">
            <label>Description</label>
            <textarea
              v-model="publishDescription"
              placeholder="Describe your theme's mood and colors..."
              rows="3"
            ></textarea>
          </div>

          <p
            v-if="publishStatus"
            class="status"
            :class="{
              warn: publishStatus.includes('Failed'),
              success: publishStatus.includes('successfully'),
            }"
          >
            {{ publishStatus }}
          </p>

          <div class="actions creator-actions">
            <button @click="publishTheme" :disabled="isPublishing">
              {{ isPublishing ? "Publishing..." : "Publish to Marketplace" }}
            </button>
            <button
              class="btn-ghost"
              @click="showPublishModal = false"
              :disabled="isPublishing"
            >
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

      <!-- Export -->
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

      <!-- Auto-Deletion -->
      <article class="panel">
        <h2>Auto-Deletion</h2>
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

      <!-- Backend URL Selection -->
      <article class="panel">
        <h2>Backend</h2>
        <p class="hint">
          Select which backend server the app should connect to. When no backend
          is reachable, the app falls back to offline mode automatically.
        </p>

        <div class="row">
          <label for="backend-preset">Backend type</label>
          <select id="backend-preset" v-model="backendPresetId">
            <option
              v-for="preset in BACKEND_PRESETS"
              :key="preset.id"
              :value="preset.id"
            >
              {{ preset.label }}
            </option>
          </select>
        </div>

        <div v-if="backendPresetId === 'custom'" class="row">
          <label for="custom-backend-url">Custom backend URL</label>
          <input
            id="custom-backend-url"
            v-model="customBackendUrl"
            type="url"
            placeholder="http://localhost:8080/api/v1"
          />
        </div>

        <p class="status">
          Active URL: <code>{{ backendUrl || "(none)" }}</code>
        </p>
        <p class="hint">
          Changes take effect immediately. The connection test happens
          automatically on the next API call.
        </p>

        <div class="row" style="margin-top: 16px">
          <label for="theme-store-url">Theme store URL</label>
          <input
            id="theme-store-url"
            v-model="themeStoreUrl"
            type="url"
            placeholder="http://localhost:8080/index.php"
          />
        </div>
        <p class="hint">
          Base URL of the CodeIgniter theme marketplace backend. Change this if
          your friend hosts it elsewhere.
        </p>
      </article>

      <!-- Backend Authentication -->
      <article class="panel">
        <h2>Backend Authentication</h2>
        <p class="hint">Login to sync your todos with the backend server.</p>

        <div v-if="currentUser" class="user-info">
          <p>
            <strong>Logged in as:</strong>
            {{ currentUser.name || currentUser.email }}
          </p>
          <p><strong>Email:</strong> {{ currentUser.email }}</p>
          <div class="actions">
            <button @click="handleLogout">Logout</button>
          </div>
        </div>

        <div v-else class="auth-form">
          <form @submit.prevent="handleAuth">
            <div class="row">
              <label for="auth-email">Email</label>
              <input
                id="auth-email"
                v-model="authEmail"
                type="email"
                placeholder="user@example.com"
              />
            </div>

            <div class="row">
              <label for="auth-password">Password</label>
              <input
                id="auth-password"
                v-model="authPassword"
                type="password"
                placeholder="Your password"
              />
            </div>

            <div v-if="authMode === 'register'" class="row">
              <label for="auth-name">Name</label>
              <input
                id="auth-name"
                v-model="authName"
                type="text"
                placeholder="Your name"
              />
            </div>

            <div class="actions">
              <button type="submit" :disabled="authLoading">
                {{
                  authLoading
                    ? "Loading..."
                    : authMode === "login"
                      ? "Login"
                      : "Register"
                }}
              </button>
              <button type="button" @click="toggleAuthMode">
                {{
                  authMode === "login" ? "Create new account" : "Back to login"
                }}
              </button>
            </div>
          </form>

          <p v-if="authStatus" class="status">{{ authStatus }}</p>
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

/* Theme swatches */
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

/* Custom theme creator */
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

/* Wallpaper */
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

/* Authentication styles */
.user-info {
  padding: 12px;
  background: var(--surface-muted);
  border-radius: 4px;
  margin-bottom: 12px;
}

.user-info p {
  margin: 6px 0;
}

.auth-form {
  padding: 12px 0;
}

@media (max-width: 960px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* ── AI Provider Cards ────────────────────────────────────────────────────── */
.add-provider-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.add-provider-row .preset-select {
  flex: 1;
}
.btn-add {
  padding: 8px 16px;
  background: var(--accent, #0077B6);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}
.btn-add:hover {
  opacity: 0.9;
}
.provider-card {
  border: 1px solid var(--border, #ddd);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--surface, #fff);
  transition: border-color 0.2s;
}
.provider-card.active {
  border-color: var(--accent, #0077B6);
  box-shadow: 0 0 0 1px var(--accent, #0077B6);
}
.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 6px;
}
.provider-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.provider-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
  background: #e8ecf0;
  color: #333;
}
.provider-badge.deepseek {
  background: #d0e8f0;
  color: #005573;
}
.provider-badge.openai {
  background: #d4f0d4;
  color: #006633;
}
.provider-badge.anthropic {
  background: #e8d4f0;
  color: #6b0099;
}
.provider-badge.google {
  background: #f0e8d4;
  color: #996600;
}
.provider-badge.ollama {
  background: #e8e8e8;
  color: #444;
}
.provider-badge.custom {
  background: #f0d4d4;
  color: #993300;
}
.active-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.7em;
  font-weight: 700;
  background: var(--accent, #0077B6);
  color: #fff;
  letter-spacing: 0.5px;
}
.provider-model-tag {
  font-size: 0.8em;
  color: var(--text-muted, #888);
  font-family: monospace;
}
.provider-actions {
  display: flex;
  gap: 6px;
}
.btn-small {
  padding: 4px 10px;
  border: 1px solid var(--border, #ccc);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  background: var(--surface, #fff);
  color: var(--text, #333);
}
.btn-small.btn-activate {
  border-color: var(--accent, #0077B6);
  color: var(--accent, #0077B6);
  font-weight: 600;
}
.btn-small.btn-cancel {
  padding: 8px 16px;
  border: 1px solid var(--border, #ccc);
  border-radius: 5px;
  background: var(--surface, #fff);
  color: var(--text, #333);
  cursor: pointer;
  font-weight: 600;
}

.btn-danger {
  border-color: #d32f2f;
  color: #d32f2f;
}
.btn-small.btn-add-model {
  border-color: var(--accent, #0077B6);
  color: var(--accent, #0077B6);
}
.btn-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.provider-details .row {
  margin-bottom: 8px;
}
.provider-details .inline-row {
  display: flex;
  gap: 6px;
}
.provider-details .inline-row input {
  flex: 1;
}
.provider-details select {
  width: 100%;
}
.provider-details input {
  width: 100%;
}
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted, #999);
  font-style: italic;
}


/* ── AI Provider Cards ────────────────────────────────────────────────────── */
.add-provider-row {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.add-provider-row input {
  flex: 1;
  min-width: 120px;
}
.btn-add {
  padding: 7px 14px;
  background: var(--accent, #0077B6);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}
.btn-add:hover { opacity: 0.9; }
.btn-add:disabled { opacity: 0.4; cursor: not-allowed; }

.provider-card {
  border: 1px solid var(--border, #ddd);
  border-radius: 7px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: var(--surface, #fff);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.provider-card.active {
  border-color: var(--accent, #0077B6);
  box-shadow: 0 0 0 1px var(--accent, #0077B6);
}
.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.provider-card .row {
  margin-bottom: 6px;
}
.provider-card .row input,
.provider-card .row select {
  width: 100%;
}
.provider-card .actions {
  margin: 6px 0;
}
.prov-models {
  font-size: 0.85em;
  color: var(--text-muted, #666);
  margin: 4px 0;
}
.model-chip {
  display: inline-block;
  padding: 2px 7px;
  margin: 2px;
  background: var(--surface-strong, #e8ecef);
  border-radius: 4px;
  font-size: 0.8em;
  font-family: monospace;
}
.chip-remove {
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  margin-left: 2px;
  font-weight: bold;
  padding: 0 2px;
}
.inline-row {
  display: flex;
  gap: 6px;
}
.inline-row input {
  flex: 1;
}


/* ── AI Provider Tabs ─────────────────────────────────────────────────────── */
.add-provider-form {
  padding: 12px;
  background: var(--surface-muted, #f5f5f5);
  border: 1px solid var(--border, #ddd);
  border-radius: 6px;
  margin-bottom: 12px;
}
.add-provider-form .row {
  margin-bottom: 8px;
}
.add-provider-form .row input {
  width: 100%;
}
.add-provider-form .actions {
  display: flex;
  gap: 8px;
}

.provider-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 2px;
  flex-wrap: nowrap;
}
.provider-tabs .tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border, #ccc);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: var(--surface-muted, #f0f0f0);
  color: var(--text-muted, #666);
  cursor: pointer;
  font-size: 0.85em;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.provider-tabs .tab-btn.active {
  background: var(--surface, #fff);
  color: var(--text, #333);
  font-weight: 600;
  border-color: var(--accent, #0077B6);
}
.provider-tabs .tab-btn:hover:not(.active) {
  background: var(--surface-strong, #e8e8e8);
}
.tab-label {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #d32f2f;
  background: transparent;
  color: #d32f2f;
  font-size: 1em;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  margin-left: 4px;
}
.tab-close:hover {
  background: #d32f2f;
  color: #fff;
}
.tab-add {
  font-weight: 700 !important;
  font-size: 1.1em !important;
  padding: 6px 12px !important;
  border-style: dashed !important;
  border-color: var(--accent, #0077B6) !important;
  color: var(--accent, #0077B6) !important;
}
.tab-add:hover {
  background: var(--accent-soft, #cce9f5) !important;
}


.provider-config {
  border: 1px solid var(--border, #ddd);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}
.provider-config .row {
  margin-bottom: 8px;
}
.provider-config .row input {
  width: 100%;
}
.prov-models {
  margin: 6px 0;
}
.model-chip {
  display: inline-block;
  padding: 2px 7px;
  margin: 2px;
  background: var(--surface-strong, #e8ecef);
  border-radius: 4px;
  font-size: 0.8em;
  font-family: monospace;
}
.chip-remove {
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  margin-left: 2px;
  font-weight: bold;
  padding: 0 2px;
}
.inline-row {
  display: flex;
  gap: 6px;
}
.inline-row input {
  flex: 1;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content.modal-sm {
  max-width: 380px;
  padding: 24px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #ddd);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.modal-content.modal-sm h3 {
  margin: 0 0 10px;
  font-size: 1.1em;
}
.modal-content.modal-sm p {
  margin: 0;
  color: var(--text-muted, #666);
  font-size: 0.9em;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
.btn-cancel {
  padding: 8px 16px;
  border: 1px solid var(--border, #ccc);
  border-radius: 5px;
  background: var(--surface, #fff);
  color: var(--text, #333);
  cursor: pointer;
  font-weight: 600;
}

.btn-danger {
  padding: 8px 16px;
  background: #d32f2f;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
}

</style>
