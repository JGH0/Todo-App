import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const useTodoStore = defineStore('todos', () => {
  const todos = ref([
    {
      id: 1,
      title: 'Bestehende Aufgaben analysieren',
      description: 'Aktuellen Aufbau der Todo-App sichten und Felder abstimmen.',
      status: 'open',
      categories: ['Work'],
      dueDate: null,
      dueTime: null,
      syncEnabled: false,
      reminderEnabled: false,
      recurringEnabled: false,
      projectId: 'web-redesign',
      createdAt: new Date().toISOString(),
    },
  ])

  const todoCount = computed(() => todos.value.length)

  const createTodo = async (payload) => {
    await wait(200)

    const todo = {
      id: Date.now(),
      title: payload.title.trim(),
      description: payload.description.trim(),
      status: payload.status || 'open',
      categories: payload.categories || [],
      dueDate: payload.dueDate || null,
      dueTime: payload.dueTime || null,
      syncEnabled: Boolean(payload.syncEnabled),
      reminderEnabled: Boolean(payload.reminderEnabled),
      recurringEnabled: Boolean(payload.recurringEnabled),
      projectId: payload.projectId || null,
      createdAt: new Date().toISOString(),
    }

    todos.value.unshift(todo)
    return todo
  }

  const getTodosByProject = (projectId) =>
    todos.value.filter((todo) => todo.projectId === projectId)

  return {
    todos,
    todoCount,
    createTodo,
    getTodosByProject,
  }
})
