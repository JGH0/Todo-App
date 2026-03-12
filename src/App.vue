<script setup>
import { RouterLink, RouterView } from 'vue-router'
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

        <a class="sidebar-link" href="#search">
          <span class="sidebar-icon">⌕</span>
          <span>search</span>
        </a>

        <a class="sidebar-link" href="#filters">
          <span class="sidebar-icon">◌</span>
          <span>Filters</span>
        </a>

        <a class="sidebar-link sidebar-link-muted" href="#ask-ai">
          <span class="sidebar-icon">✦</span>
          <span>Ask AI</span>
        </a>
      </nav>

      <section class="sidebar-panel">
        <p class="sidebar-section-title">Favorites</p>
      </section>

      <section class="sidebar-panel">
        <ul class="sidebar-list">
          <li>Work</li>
          <li>Home</li>
          <li>Personal</li>
        </ul>
      </section>

      <div class="sidebar-footer">
        <a class="sidebar-link sidebar-link-muted" href="#settings">
          <span class="sidebar-icon">⚙</span>
          <span>settings</span>
        </a>
      </div>
    </aside>

    <main class="workspace">
      <RouterView />
    </main>
  </div>
</template>
