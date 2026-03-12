<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import TodoCreateForm from '@/components/TodoCreateForm.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodoStore } from '@/stores/todos'

const route = useRoute()
const todoStore = useTodoStore()
const lastCreatedTitle = ref('')

const projectId = computed(() => route.params.projectId)
const projectTodos = computed(() => todoStore.getTodosByProject(projectId.value))

const handleCreateProjectTodo = async (payload) => {
  const createdTodo = await todoStore.createTodo(payload)
  lastCreatedTitle.value = createdTodo.title
  return createdTodo
}
</script>

<template>
  <section class="view-grid">
    <TodoCreateForm
      :project-id="projectId"
      heading="Projektbezogenes Todo erstellen"
      submit-label="Projekt-Todo speichern"
      :submit-todo="handleCreateProjectTodo"
      @created="lastCreatedTitle = $event.title"
    />

    <div class="stack">
      <section class="card project-card">
        <p class="eyebrow">Projektkontext</p>
        <h2>{{ projectId }}</h2>
        <p>
          Dieselbe Formular-Komponente wird hier mit optionaler `projectId` erneut
          verwendet, ohne Annahmen ueber die umgebende Seite.
        </p>
      </section>

      <section v-if="lastCreatedTitle" class="success-banner">
        "{{ lastCreatedTitle }}" wurde dem Projekt hinzugefuegt.
      </section>

      <TodoList
        :title="`Todos fuer ${projectId}`"
        :todos="projectTodos"
      />
    </div>
  </section>
</template>
