import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
	createCategory as createCategoryRequest,
	deleteCategory as deleteCategoryRequest,
	getCategories,
	updateCategory as updateCategoryRequest,
} from '@/services/categoryService'
import {
	createTodo as createTodoRequest,
	deleteTodo as deleteTodoRequest,
	getTodos,
	getTodosByCategory,
	updateTodo as updateTodoRequest,
} from '@/services/todoService'

export const useTodoStore = defineStore('todos', () => {
	const todos = ref([])
	const categories = ref([])
	const isLoading = ref(false)
	const error = ref('')
	const activeCategoryId = ref('')
	const hasLoaded = ref(false)

	const todoCount = computed(() => todos.value.length)
	const categoryOptions = computed(() => categories.value)
	const categoryMap = computed(() =>
		categories.value.reduce((map, category) => {
			map[category.id] = category.name
			return map
		}, {}),
	)

	const filteredTodos = computed(() => {
		if (!activeCategoryId.value) {
			return todos.value
		}

		return todos.value.filter((todo) => String(todo.categoryId) === String(activeCategoryId.value))
	})

	const setError = (message) => {
		error.value = message
	}

	const loadCategories = async () => {
		const data = await getCategories()
		categories.value = data
		return data
	}

	const loadTodos = async (categoryId = activeCategoryId.value) => {
		const data = categoryId ? await getTodosByCategory(categoryId) : await getTodos()
		todos.value = data
		activeCategoryId.value = categoryId ? String(categoryId) : ''
		return data
	}

	const initialize = async () => {
		if (hasLoaded.value) {
			return
		}

		try {
			isLoading.value = true
			setError('')
			await Promise.all([loadCategories(), loadTodos('')])
			hasLoaded.value = true
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Daten konnten nicht geladen werden.')
		} finally {
			isLoading.value = false
		}
	}

	const applyCategoryFilter = async (categoryId) => {
		try {
			isLoading.value = true
			setError('')
			await loadTodos(categoryId)
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Todos konnten nicht geladen werden.')
		} finally {
			isLoading.value = false
		}
	}

	const createCategory = async (name) => {
		const trimmedName = name.trim()

		if (!trimmedName) {
			throw new Error('Bitte gib einen Kategorienamen ein.')
		}

		const existing = categories.value.find(
			(category) => category.name.toLowerCase() === trimmedName.toLowerCase(),
		)

		if (existing) {
			return existing
		}

		const createdCategory = await createCategoryRequest({ name: trimmedName })
		categories.value = [...categories.value, createdCategory].sort((left, right) =>
			left.name.localeCompare(right.name),
		)
		return createdCategory
	}

	const updateCategory = async (id, payload) => {
		const updatedCategory = await updateCategoryRequest(id, payload)
		categories.value = categories.value.map((category) =>
			category.id === id ? updatedCategory : category,
		)
		return updatedCategory
	}

	const deleteCategory = async (id) => {
		await deleteCategoryRequest(id)
		categories.value = categories.value.filter((category) => category.id !== id)
		todos.value = todos.value.map((todo) =>
			todo.categoryId === id ? { ...todo, categoryId: null } : todo,
		)

		if (String(activeCategoryId.value) === String(id)) {
			activeCategoryId.value = ''
		}
	}

	const createTodo = async (payload) => {
		const todo = {
			title: payload.title.trim(),
			description: payload.description.trim(),
			status: payload.status || 'open',
			dueDate: payload.dueDate || null,
			dueTime: payload.dueTime || null,
			syncEnabled: Boolean(payload.syncEnabled),
			reminderEnabled: Boolean(payload.reminderEnabled),
			recurringEnabled: Boolean(payload.recurringEnabled),
			categoryId: payload.categoryId ? Number(payload.categoryId) : null,
			projectId: payload.projectId || null,
			createdAt: new Date().toISOString(),
		}

		const createdTodo = await createTodoRequest(todo)

		if (!activeCategoryId.value || String(createdTodo.categoryId) === activeCategoryId.value) {
			todos.value = [createdTodo, ...todos.value]
		}

		return createdTodo
	}

	const updateTodo = async (id, updates) => {
		const currentTodo = todos.value.find((todo) => todo.id === id)
		if (!currentTodo) {
			return null
		}

		const updatedTodo = await updateTodoRequest(id, {
			...currentTodo,
			...updates,
		})

		if (activeCategoryId.value && String(updatedTodo.categoryId) !== activeCategoryId.value) {
			todos.value = todos.value.filter((todo) => todo.id !== id)
			return updatedTodo
		}

		todos.value = todos.value.map((todo) => (todo.id === id ? updatedTodo : todo))
		return updatedTodo
	}

	const toggleTodoStatus = async (id) => {
		const currentTodo = todos.value.find((todo) => todo.id === id)
		if (!currentTodo) {
			return null
		}

		return updateTodo(id, {
			status: currentTodo.status === 'done' ? 'open' : 'done',
		})
	}

	const deleteTodo = async (id) => {
		await deleteTodoRequest(id)
		todos.value = todos.value.filter((todo) => todo.id !== id)
	}

	const getTodosByProject = (projectId) =>
		todos.value.filter((todo) => todo.projectId === projectId)

	return {
		todos,
		categories,
		todoCount,
		categoryOptions,
		categoryMap,
		filteredTodos,
		isLoading,
		error,
		activeCategoryId,
		initialize,
		loadTodos,
		loadCategories,
		applyCategoryFilter,
		createCategory,
		updateCategory,
		deleteCategory,
		createTodo,
		updateTodo,
		toggleTodoStatus,
		deleteTodo,
		getTodosByProject,
	}
})