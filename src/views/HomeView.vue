<script setup>
import { computed, ref } from 'vue'

import TodoCreateForm from '@/components/TodoCreateForm.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodoStore } from '@/stores/todos'

const todoStore = useTodoStore()
const lastCreatedTitle = ref('')

const todos = computed(() => todoStore.todos)

const handleCreateTodo = async (payload) => {
  const createdTodo = await todoStore.createTodo(payload)
  lastCreatedTitle.value = createdTodo.title
  return createdTodo
}
</script>

<template>
  <section class="view-grid">
    <TodoCreateForm
      heading="Todo auf der Hauptseite erstellen"
      submit-label="Todo anlegen"
      :submit-todo="handleCreateTodo"
      @created="lastCreatedTitle = $event.title"
    />

    <div class="stack">
      <section v-if="lastCreatedTitle" class="success-banner">
        "{{ lastCreatedTitle }}" wurde erfolgreich erstellt.
      </section>

      <TodoList
        title="Alle Todos"
        :todos="todos"
      />
    </div>
  </section>
</template>
