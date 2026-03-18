import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import ProjectDetailView from '@/views/ProjectDetailView.vue'
import AiAssistantView from '@/views/AiAssistantView.vue'
import SettingsView from '@/views/SettingsView.vue'
import TodosListView from '@/views/TodosListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/projects/:projectId',
      name: 'project-detail',
      component: ProjectDetailView,
      props: true,
    },
    {
      path: '/todo-overview',
      name: 'todo-overview',
      component: TodosListView,
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: AiAssistantView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

export default router
