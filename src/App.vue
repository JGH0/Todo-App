<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app-shell">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="hamburger" @click="sidebarOpen = true">☰</button>
      <span class="mobile-title">{{ currentView }}</span>
    </header>

    <!-- Mobile Backdrop -->
    <div v-if="sidebarOpen" class="backdrop" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }" @click.stop>
      <div class="user">User XY</div>

      <nav class="top-links">
        <button class="nav-btn" @click="setView('addTask')">
          + Add a Task
        </button>
        <button class="nav-btn" @click="setView('askAi')">Ask AI</button>
        <button class="nav-btn" @click="setView('recurringTasks')">
          Recurring Tasks
        </button>
        <button class="nav-btn" @click="setView('todos')">All Todos</button>
        <button class="nav-btn" @click="setView('manageCategories')">
          Manage Categories
        </button>
        <button class="nav-btn" @click="setView('themeBrowser')">
          Theme Browser
        </button>
      </nav>

      <div v-if="favoriteCategories.length" class="section-title">
        Favorite Categories
      </div>
      <ul class="list">
        <li
          v-for="cat in favoriteCategories"
          :key="cat.id"
          @click="setView(cat.name.toLowerCase())"
        >
          {{ cat.name }}
        </li>
      </ul>

      <div class="section-title">All Categories</div>
      <ul class="list">
        <li
          v-for="cat in allCategories"
          :key="cat.id"
          @click="setView(cat.name.toLowerCase())"
        >
          {{ cat.name }}
        </li>
      </ul>

      <button class="settings" @click="setView('settings')">Settings</button>
    </aside>

    <!-- Content -->
    <main class="content">
      <component :is="currentComponent" :category="currentCategory" />
    </main>
  </div>
</template>

<script>
import {
  applyTheme,
  loadTheme,
  applyWallpaper,
  loadWallpaper,
} from "@/utils/themeSettings";

// Helper to show preview banner inside iframe previews
function showPreviewIndicator(themeName) {
  const existing = document.getElementById("theme-preview-indicator");
  if (existing) existing.remove();

  const indicator = document.createElement("div");
  indicator.id = "theme-preview-indicator";
  indicator.innerHTML = `
    <div class="preview-indicator-content">
      <span>🎨 Preview Mode: <strong>${themeName}</strong></span>
      <button id="close-preview-indicator">✕ Close Preview</button>
    </div>
  `;
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    text-align: center;
  `;

  const style = document.createElement("style");
  style.textContent = `
    .preview-indicator-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      max-width: 1200px;
      margin: 0 auto;
    }
    #close-preview-indicator {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #close-preview-indicator:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(indicator);

  // Add click handler for close button
  document
    .getElementById("close-preview-indicator")
    ?.addEventListener("click", () => {
      indicator.remove();
      style.remove();
      // Reload to clear preview theme and restore original
      window.location.href = window.location.pathname;
    });
}

// Apply stored theme and wallpaper before first render
const urlParams = new URLSearchParams(location.search);

if (urlParams.has("__theme_preview")) {
  try {
    const themeData = JSON.parse(atob(urlParams.get("__theme_preview")));
    const root = document.documentElement;
    Object.entries(themeData.vars).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
    showPreviewIndicator(themeData.name);
  } catch (error) {
    console.error("Error applying theme preview:", error);
  }
} else if (!urlParams.has("__theme")) {
  applyTheme(loadTheme());
  applyWallpaper(loadWallpaper());
}

import SettingsView from "@/views/SettingsView.vue";
import AiAssistantView from "./views/AiAssistantView.vue";
import TodoCreateForm from "./views/TodoCreateForm.vue";
import TodosListView from "./views/TodosListView.vue";
import CategoryManagementView from "./views/CategoryManagementView.vue";
import RecurringTasksView from "./views/RecurringTasksView.vue";
import ThemeBrowserView from "./views/ThemeBrowserView.vue";
import { getCategories } from "@/services/categoryService";

const SimpleView = {
  props: ["title"],
  template: `
		<div class="card">
			<h2>{{ title }}</h2>
			<p>This is the {{ title }} view.</p>
		</div>
	`,
};

export default {
  components: {
    SettingsView,
    TodoCreateForm,
    TodosListView,
    CategoryManagementView,
    SearchView: {
      components: { SimpleView },
      template: `<SimpleView title="Search" />`,
    },
    FiltersView: {
      components: { SimpleView },
      template: `<SimpleView title="Filters" />`,
    },
    AiAssistantView,
    RecurringTasksView,
    ThemeBrowserView,
  },

  data() {
    return {
      currentView: "todos",
      currentCategory: null,
      sidebarOpen: false,
      categories: [],
    };
  },

  computed: {
    currentComponent() {
      const views = {
        settings: "SettingsView",
        addTask: "TodoCreateForm",
        askAi: "AiAssistantView",
        todos: "TodosListView",
        manageCategories: "CategoryManagementView",
        recurringTasks: "RecurringTasksView",
        themeBrowser: "ThemeBrowserView",
      };
      return views[this.currentView] || "TodosListView";
    },
    favoriteCategories() {
      return this.categories.filter((cat) => cat.favorite === true);
    },
    allCategories() {
      return this.categories.filter((cat) => cat.favorite !== true);
    },
  },

  async mounted() {
    await this.loadCategories();
    window.addEventListener("categories-updated", this.loadCategories);
  },

  beforeUnmount() {
    window.removeEventListener("categories-updated", this.loadCategories);
  },

  methods: {
    async loadCategories() {
      try {
        this.categories = await getCategories();
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    },
    setView(view) {
      // Check if view matches any category name (case-insensitive)
      const matchedCategory = (this.categories || []).find(
        (cat) => cat.name.toLowerCase() === view.toLowerCase(),
      );

      if (matchedCategory) {
        this.currentView = "todos";
        this.currentCategory = matchedCategory.name;
      } else {
        this.currentView = view;
        this.currentCategory = null;
      }
      this.sidebarOpen = false;
    },
  },
};
</script>

<style scoped>
/* Layout */
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
  background: var(--bg);
  background-image: var(--wallpaper, none);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: var(--text);
  transition:
    background-color 0.3s,
    color 0.3s;
}

/* Sidebar */
.sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  padding: 20px 16px;
  z-index: 20;
  transition:
    background 0.3s,
    border-color 0.3s;
}

.user {
  font-size: 20px;
  font-weight: 600;
  color: var(--sidebar-text);
  margin-bottom: 18px;
}

.top-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-btn,
.settings {
  background: transparent;
  border: 0;
  padding: 6px 0;
  text-align: left;
  cursor: pointer;
  color: var(--sidebar-text);
  font-weight: 500;
}

.nav-btn:hover,
.list li:hover,
.settings:hover {
  opacity: 0.75;
}

.section-title {
  border-top: 1px solid var(--sidebar-border);
  padding-top: 12px;
  margin-top: 14px;
  font-weight: 600;
  color: var(--sidebar-text);
}

.list {
  list-style: none;
  padding: 0;
  margin: 10px 0 14px;
}

.list li {
  padding: 6px 0;
  cursor: pointer;
  color: var(--sidebar-text);
}

/* Content */
.content {
  padding: 20px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 18px;
}

/* Mobile Header */
.mobile-header {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--sidebar-border);
  grid-column: 1 / -1;
}

.hamburger {
  font-size: 22px;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--sidebar-text);
}

/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 10;
}

/* Mobile */
@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .mobile-header {
    display: flex;
  }

  .sidebar {
    position: fixed;
    top: 52px;
    left: 0;
    right: 0;
    border-right: 0;
    border-bottom: 1px solid var(--sidebar-border);
    display: none;
  }

  .sidebar.open {
    display: block;
  }

  .content {
    padding-top: 16px;
  }
}
</style>
