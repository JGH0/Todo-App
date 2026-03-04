<template>
  <div class="app-shell">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="hamburger" @click="sidebarOpen = true">
        ☰
      </button>
      <span class="mobile-title">{{ currentView }}</span>
    </header>

    <!-- Mobile Backdrop -->
    <div
      v-if="sidebarOpen"
      class="backdrop"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="{ open: sidebarOpen }"
      @click.stop
    >
      <div class="user">User XY</div>

      <nav class="top-links">
        <button class="nav-btn" @click="setView('Add Task')">+ Add a Task</button>
        <button class="nav-btn" @click="setView('Search')">Search</button>
        <button class="nav-btn" @click="setView('Filters')">Filters</button>
        <button class="nav-btn" @click="setView('Ask AI')">Ask AI</button>
      </nav>

      <div class="section-title">Favorites</div>
      <ul class="list">
        <li @click="setView('Work')">Work</li>
        <li @click="setView('Home')">Home</li>
        <li @click="setView('Personal')">Personal</li>
      </ul>

      <button class="settings" @click="setView('Settings')">
        Settings
      </button>
    </aside>

    <!-- Content -->
    <main class="content">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script>
const SimpleView = {
  props: ['title'],
  template: `
    <div class="card">
      <h2>{{ title }}</h2>
      <p>This is the {{ title }} view.</p>
    </div>
  `
}

export default {
  components: {
    AddTask: { template: `<SimpleView title="Add Task" />`, components: { SimpleView } },
    Search: { template: `<SimpleView title="Search" />`, components: { SimpleView } },
    Filters: { template: `<SimpleView title="Filters" />`, components: { SimpleView } },
    AskAI: { template: `<SimpleView title="Ask AI" />`, components: { SimpleView } },
    Work: { template: `<SimpleView title="Work" />`, components: { SimpleView } },
    Home: { template: `<SimpleView title="Home" />`, components: { SimpleView } },
    Personal: { template: `<SimpleView title="Personal" />`, components: { SimpleView } },
    Settings: { template: `<SimpleView title="Settings" />`, components: { SimpleView } }
  },

  data() {
    return {
      currentView: 'Add Task',
      sidebarOpen: false
    }
  },

  computed: {
    currentComponent() {
      return this.currentView.replace(/\s/g, '')
    }
  },

  methods: {
    setView(view) {
      this.currentView = view
      this.sidebarOpen = false
    }
  }
}
</script>

<style scoped>
/* Layout */
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
  background: #f5f5f5;
  color: #1f1f1f;
}

/* Sidebar */
.sidebar {
  background: #ffffff;
  border-right: 1px solid #d0d0d0;
  padding: 20px 16px;
  z-index: 20;
}

.user {
  font-size: 20px;
  font-weight: 600;
  color: #111;
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
  color: #222;
  font-weight: 500;
}

.nav-btn:hover,
.list li:hover,
.settings:hover {
  color: #000;
}

.section-title {
  border-top: 1px solid #ddd;
  padding-top: 12px;
  margin-top: 14px;
  font-weight: 600;
  color: #222;
}

.list {
  list-style: none;
  padding: 0;
  margin: 10px 0 14px;
}

.list li {
  padding: 6px 0;
  cursor: pointer;
  color: #222;
}

/* Content */
.content {
  padding: 20px;
}

.card {
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 18px;
}

/* Mobile Header */
.mobile-header {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #d0d0d0;
  grid-column: 1 / -1;
}

.hamburger {
  font-size: 22px;
  background: none;
  border: 0;
  cursor: pointer;
  color: #111;
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
    border-bottom: 1px solid #d0d0d0;
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