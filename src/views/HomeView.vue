<script setup>
import { computed, onMounted, ref } from 'vue'

import TodoCreateForm from '@/components/TodoCreateForm.vue'
import CategoryManager from '@/components/CategoryManager.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodoStore } from '@/stores/todos'

const todoStore = useTodoStore()
const lastCreatedTitle = ref('')

const todos = computed(() => todoStore.filteredTodos)
const categories = computed(() => todoStore.categoryOptions)
const categoryMap = computed(() => todoStore.categoryMap)

onMounted(async () => {
  await todoStore.initialize()
})

const handleCreateTodo = async (payload) => {
  const createdTodo = await todoStore.createTodo(payload)
  lastCreatedTitle.value = createdTodo.title
  return createdTodo
}

const handleFilterChange = async (event) => {
  await todoStore.applyCategoryFilter(event.target.value)
}
</script>

<template>
  <section class="view-grid">
    <TodoCreateForm
      heading="Todo auf der Hauptseite erstellen"
      submit-label="Todo anlegen"
      :categories="categories"
      :create-category="todoStore.createCategory"
      :submit-todo="handleCreateTodo"
      @created="lastCreatedTitle = $event.title"
    />

    <div class="stack">
      <section class="card">
        <div class="card-header">
          <div>
            <p class="eyebrow">Filter</p>
            <h2>Todos nach Kategorie</h2>
          </div>
        </div>

        <label class="field">
          <span class="field-label">Kategorie</span>
          <select :value="todoStore.activeCategoryId" @change="handleFilterChange">
            <option value="">Alle Kategorien</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>
      </section>

      <section v-if="todoStore.error" class="error-banner">
        {{ todoStore.error }}
      </section>

      <section v-if="lastCreatedTitle" class="success-banner">
        "{{ lastCreatedTitle }}" wurde erfolgreich erstellt.
      </section>

      <CategoryManager
        :categories="categories"
        :on-update-category="todoStore.updateCategory"
        :on-delete-category="todoStore.deleteCategory"
      />

      <TodoList
        title="Alle Todos"
        :todos="todos"
        :category-map="categoryMap"
        :on-toggle-status="todoStore.toggleTodoStatus"
        :on-delete-todo="todoStore.deleteTodo"
      />
    </div>
  </section>
</template>
