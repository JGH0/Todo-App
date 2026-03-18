<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

import { useTodoStore } from '@/stores/todos'

const todoStore = useTodoStore()
const sidebarCategories = computed(() => todoStore.categoryOptions)

onMounted(() => {
  todoStore.initialize()
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-block">
        <p class="sidebar-user">user xy</p>
      </div>

      <nav class="sidebar-nav">
        <RouterLink class="sidebar-link sidebar-link-primary" to="/">
          <span class="sidebar-icon">⊕</span>
          <span>Add a Task</span>
        </RouterLink>

        <RouterLink class="sidebar-link" to="/todo-overview">
          <span class="sidebar-icon">☰</span>
          <span>All Todos</span>
        </RouterLink>

        <a class="sidebar-link" href="#search">
          <span class="sidebar-icon">⌕</span>
          <span>search</span>
        </a>

        <a class="sidebar-link" href="#filters">
          <span class="sidebar-icon">◌</span>
          <span>Filters</span>
        </a>

        <RouterLink class="sidebar-link sidebar-link-muted" to="/ai-assistant">
          <span class="sidebar-icon">✦</span>
          <span>Ask AI</span>
        </RouterLink>
      </nav>

      <section class="sidebar-panel">
        <p class="sidebar-section-title">Favorites</p>
      </section>

      <section class="sidebar-panel">
        <ul class="sidebar-list">
          <li v-for="category in sidebarCategories" :key="category.id">
            {{ category.name }}
          </li>
        </ul>
      </section>

      <div class="sidebar-footer">
        <RouterLink class="sidebar-link sidebar-link-muted" to="/settings">
          <span class="sidebar-icon">⚙</span>
          <span>settings</span>
        </RouterLink>
      </div>
    </aside>

    <main class="workspace">
      <RouterView />
    </main>
  </div>
</template>
