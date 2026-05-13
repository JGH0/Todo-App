<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { applyTheme } from "../utils/themeSettings";

const iframeUrl = ref(
  "http://localhost/Todo-App-Backend/public/index.php/themes?parent=todo-app",
);
const isLoading = ref(true);
const showInstallPopup = ref(false);
const installingTheme = ref(null);

// Preview iframe state
const showPreviewOverlay = ref(false);
const previewUrl = ref("");
const previewThemeName = ref("");

// Hardcoded theme data for direct installation
const availableThemes = ref([
  {
    id: "midnight-void",
    name: "Midnight Void",
    description: "A dark theme with purple accents perfect for night coding",
    preview: ["#1a1a2e", "#16213e", "#7c3aed"],
    vars: {
      "--bg": "#1a1a2e",
      "--surface": "#16213e",
      "--surface-strong": "#0f172a",
      "--surface-muted": "#1e293b",
      "--border": "#374151",
      "--line": "#4b5563",
      "--text": "#ffffff",
      "--text-muted": "#9ca3af",
      "--text-strong": "#f3f4f6",
      "--accent": "#7c3aed",
      "--accent-text": "#ffffff",
      "--accent-soft": "#4c1d95",
      "--sidebar-bg": "#16213e",
      "--sidebar-border": "#374151",
      "--sidebar-text": "#ffffff",
      "--sidebar-text-muted": "#9ca3af",
      "--input-bg": "#1e293b",
      "--input-border": "#4b5563",
      "--modal-bg": "#16213e",
      "--chip": "#4b5563",
      "--success": "#065f46",
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "A calming blue theme inspired by the sea",
    preview: ["#0f172a", "#1e293b", "#0ea5e9"],
    vars: {
      "--bg": "#0f172a",
      "--surface": "#1e293b",
      "--surface-strong": "#020617",
      "--surface-muted": "#334155",
      "--border": "#334155",
      "--line": "#475569",
      "--text": "#f1f5f9",
      "--text-muted": "#94a3b8",
      "--text-strong": "#ffffff",
      "--accent": "#0ea5e9",
      "--accent-text": "#ffffff",
      "--accent-soft": "#0c4a6e",
      "--sidebar-bg": "#1e293b",
      "--sidebar-border": "#334155",
      "--sidebar-text": "#f1f5f9",
      "--sidebar-text-muted": "#94a3b8",
      "--input-bg": "#334155",
      "--input-border": "#475569",
      "--modal-bg": "#1e293b",
      "--chip": "#475569",
      "--success": "#047857",
    },
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "A natural green theme that's easy on the eyes",
    preview: ["#14532d", "#166534", "#22c55e"],
    vars: {
      "--bg": "#14532d",
      "--surface": "#166534",
      "--surface-strong": "#052e16",
      "--surface-muted": "#15803d",
      "--border": "#15803d",
      "--line": "#166534",
      "--text": "#f0fdf4",
      "--text-muted": "#86efac",
      "--text-strong": "#ffffff",
      "--accent": "#22c55e",
      "--accent-text": "#ffffff",
      "--accent-soft": "#052e16",
      "--sidebar-bg": "#166534",
      "--sidebar-border": "#15803d",
      "--sidebar-text": "#f0fdf4",
      "--sidebar-text-muted": "#86efac",
      "--input-bg": "#15803d",
      "--input-border": "#166534",
      "--modal-bg": "#166534",
      "--chip": "#15803d",
      "--success": "#052e16",
    },
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    description: "A warm orange theme reminiscent of golden hour",
    preview: ["#431407", "#7c2d12", "#ea580c"],
    vars: {
      "--bg": "#431407",
      "--surface": "#7c2d12",
      "--surface-strong": "#1c1917",
      "--surface-muted": "#9a3412",
      "--border": "#9a3412",
      "--line": "#c2410c",
      "--text": "#fff7ed",
      "--text-muted": "#fed7aa",
      "--text-strong": "#ffffff",
      "--accent": "#ea580c",
      "--accent-text": "#ffffff",
      "--accent-soft": "#7c2d12",
      "--sidebar-bg": "#7c2d12",
      "--sidebar-border": "#9a3412",
      "--sidebar-text": "#fff7ed",
      "--sidebar-text-muted": "#fed7aa",
      "--input-bg": "#9a3412",
      "--input-border": "#c2410c",
      "--modal-bg": "#7c2d12",
      "--chip": "#9a3412",
      "--success": "#14532d",
    },
  },
  {
    id: "arctic-frost",
    name: "Arctic Frost",
    description: "A cool cyan theme like winter ice",
    preview: ["#083344", "#164e63", "#06b6d4"],
    vars: {
      "--bg": "#083344",
      "--surface": "#164e63",
      "--surface-strong": "#042f2e",
      "--surface-muted": "#155e75",
      "--border": "#155e75",
      "--line": "#0e7490",
      "--text": "#f0fdfa",
      "--text-muted": "#67e8f9",
      "--text-strong": "#ffffff",
      "--accent": "#06b6d4",
      "--accent-text": "#ffffff",
      "--accent-soft": "#164e63",
      "--sidebar-bg": "#164e63",
      "--sidebar-border": "#155e75",
      "--sidebar-text": "#f0fdfa",
      "--sidebar-text-muted": "#67e8f9",
      "--input-bg": "#155e75",
      "--input-border": "#0e7490",
      "--modal-bg": "#164e63",
      "--chip": "#155e75",
      "--success": "#059669",
    },
  },
]);

const installThemeDirectly = (theme) => {
  console.log("Installing theme directly:", theme);

  // Close preview overlay if active
  if (showPreviewOverlay.value) {
    closePreview();
  }

  // Add theme to external themes storage
  const externalThemes = JSON.parse(
    localStorage.getItem("todo-app.external-themes") || "[]",
  );

  // Check if theme already exists
  if (externalThemes.find((t) => t.name === theme.name)) {
    alert(`${theme.name} is already installed!`);
    return;
  }

  const newTheme = {
    id: `external-${Date.now()}`,
    name: theme.name,
    description: theme.description,
    preview: theme.preview,
    vars: { ...theme.vars },
    group: "External",
    source: "direct-install",
    installedAt: new Date().toISOString(),
  };

  externalThemes.push(newTheme);
  localStorage.setItem(
    "todo-app.external-themes",
    JSON.stringify(externalThemes),
  );

  console.log("Theme saved to localStorage:", newTheme);

  // Dispatch event to notify settings
  window.dispatchEvent(new CustomEvent("external-themes-updated"));

  // Automatically apply the installed theme
  applyTheme(newTheme.id);

  alert(
    `${theme.name} has been installed and applied successfully!`,
  );
};

const previewTheme = (theme) => {
  console.log("Opening iframe preview for theme:", theme);

  // Create preview URL with theme data
  const themeData = {
    name: theme.name,
    vars: theme.vars,
    preview: theme.preview,
  };

  // Encode theme data for URL
  const encodedTheme = btoa(JSON.stringify(themeData));

  // Build preview URL using origin (root of the app) as base
  const currentUrl = new URL("/", window.location.origin);
  currentUrl.searchParams.set("__theme_preview", encodedTheme);
  currentUrl.searchParams.set("__preview_mode", "true");

  // Set preview state
  previewUrl.value = currentUrl.toString();
  previewThemeName.value = theme.name;
  showPreviewOverlay.value = true;
};

const closePreview = () => {
  showPreviewOverlay.value = false;
  previewUrl.value = "";
  previewThemeName.value = "";
};

const installTheme = () => {
  if (!installingTheme.value) return;

  console.log("Installing theme:", installingTheme.value);

  // Add theme to external themes storage using the correct storage key
  const externalThemes = JSON.parse(
    localStorage.getItem("todo-app.external-themes") || "[]",
  );
  const newTheme = {
    id: `external-${Date.now()}`,
    name: installingTheme.value.name,
    preview: installingTheme.value.preview || ["#ffffff", "#f0f0f0", "#007acc"],
    vars: installingTheme.value.vars || {},
    group: "External",
    source: installingTheme.value.source || "external",
    installedAt: new Date().toISOString(),
  };

  externalThemes.push(newTheme);
  localStorage.setItem(
    "todo-app.external-themes",
    JSON.stringify(externalThemes),
  );

  console.log("Theme saved to localStorage:", newTheme);

  // Dispatch event to notify settings
  window.dispatchEvent(new CustomEvent("external-themes-updated"));

  // Automatically apply the installed theme
  applyTheme(newTheme.id);

  // Close popup and reset
  showInstallPopup.value = false;
  installingTheme.value = null;

  // Send success message back to iframe
  const iframe = document.querySelector("iframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(
      {
        type: "THEME_DOWNLOAD_SUCCESS",
        data: { themeId: newTheme.id },
      },
      "*",
    );
    console.log("Sent download success message to iframe");
  }
};

const cancelInstall = () => {
  showInstallPopup.value = false;
  installingTheme.value = null;
};

const refreshIframe = () => {
  isLoading.value = true;
  const iframe = document.querySelector("iframe");
  if (iframe) {
    iframe.src = iframe.src;
  }
};

// Test function to simulate theme download (for testing purposes)
const testInstall = () => {
  const testTheme = {
    name: "Midnight Void",
    description: "A dark theme with purple accents",
    preview: ["#1a1a2e", "#16213e", "#7c3aed"],
    vars: {
      "--bg": "#1a1a2e",
      "--surface": "#16213e",
      "--accent": "#7c3aed",
      "--text": "#ffffff",
      "--border": "#374151",
    },
    source: "theme-store",
  };
  console.log("Testing download with:", testTheme);
  installingTheme.value = testTheme;
  showInstallPopup.value = true;
};

const handleIframeLoad = () => {
  console.log("Iframe loaded");
  isLoading.value = false;
};

// Monitor URL hash changes for theme data
const handleHashChange = () => {
  const hash = window.location.hash;
  if (hash.startsWith("#theme-install:")) {
    try {
      const themeData = JSON.parse(
        decodeURIComponent(hash.substring("#theme-install:".length)),
      );
      console.log("Theme data from hash:", themeData);
      installingTheme.value = themeData;
      showInstallPopup.value = true;
      // Clear the hash
      window.location.hash = "";
    } catch (error) {
      console.error("Error parsing theme data from hash:", error);
    }
  }
};

const handleIframeMessage = (event) => {
  if (event.data && event.data.type === "THEME_DOWNLOAD_REQUEST") {
    console.log("Theme download requested from iframe:", event.data.theme);
    installingTheme.value = event.data.theme;
    showInstallPopup.value = true;
  }
};

onMounted(() => {
  window.addEventListener("message", handleIframeMessage);
  window.addEventListener("hashchange", handleHashChange);

  // Check for initial hash
  handleHashChange();

  // Add load listener to iframe
  const iframe = document.querySelector("iframe");
  if (iframe) {
    iframe.addEventListener("load", handleIframeLoad);
  }
});

onUnmounted(() => {
  window.removeEventListener("message", handleIframeMessage);
  window.removeEventListener("hashchange", handleHashChange);
});
</script>

<template>
  <div class="theme-browser">
    <div class="browser-header">
      <h2>Theme Browser</h2>
      <p>
        Preview themes in a new window or install them directly to your Todo-App
      </p>
    </div>

    <div class="themes-grid">
      <div v-for="theme in availableThemes" :key="theme.id" class="theme-card">
        <div class="theme-preview">
          <span
            v-for="color in theme.preview"
            :key="color"
            class="preview-color"
            :style="{ backgroundColor: color }"
          />
        </div>

        <div class="theme-info">
          <h3>{{ theme.name }}</h3>
          <p>{{ theme.description }}</p>
        </div>

        <div class="theme-actions">
          <button
            class="preview-button"
            @click="previewTheme(theme)"
            :disabled="showPreviewOverlay"
          >
            👁️ Preview
          </button>
          <button class="install-button" @click="installThemeDirectly(theme)">
            🚀 Install Theme
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Overlay -->
    <div v-if="showPreviewOverlay" class="preview-overlay">
      <div class="preview-header">
        <span class="preview-title">
          🎨 Preview: <strong>{{ previewThemeName }}</strong>
        </span>
        <button class="preview-close-btn" @click="closePreview">
          ✕ Close Preview
        </button>
      </div>
      <iframe :src="previewUrl" class="preview-iframe" frameborder="0" />
    </div>
  </div>
</template>

<style scoped>
.theme-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
}

.browser-header {
  margin-bottom: 24px;
}

.browser-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: var(--text);
}

.browser-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  flex: 1;
}

.theme-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-preview {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 12px;
  background: var(--surface-muted);
  border-radius: 8px;
}

.preview-color {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-info {
  flex: 1;
}

.theme-info h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--text);
}

.theme-info p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.theme-actions {
  display: flex;
  gap: 10px;
}

.preview-button {
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.preview-button:hover:not(:disabled) {
  background: var(--surface-strong);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.preview-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.install-button {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  flex: 1;
}

.install-button:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-1px);
}

.install-button:active {
  transform: translateY(0);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .theme-card {
    padding: 16px;
  }

  .browser-header h2 {
    font-size: 20px;
  }
}

/* Preview Overlay */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-title {
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 500;
}

.preview-title strong {
  color: #a78bfa;
}

.preview-close-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-close-btn:hover {
  background: #b91c1c;
}

.preview-iframe {
  flex: 1;
  width: 100%;
  border: none;
  background: white;
}
</style>
