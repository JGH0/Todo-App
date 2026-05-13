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
import { syncService } from '@/services/syncService'
import { offlineStorage } from '@/services/offlineStorage'
import api from '@/services/api'

export const useTodoStore = defineStore('todos', () => {
	const todos = ref([])
	const categories = ref([])
	const isLoading = ref(false)
	const error = ref('')
	const activeCategoryId = ref('')
	const hasLoaded = ref(false)
	const isOnline = ref(navigator.onLine)
	const isSyncing = ref(false)
	const showConflictModal = ref(false)
	const currentConflicts = ref([])
	const conflictDataType = ref('')

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

	// Online/Offline status management
	const checkBackendConnection = async () => {
		try {
			// Try to fetch categories as a simple health check
			await api.get('/categories', { timeout: 3000 })
			return true
		} catch (error) {
			return false
		}
	}

	const updateOnlineStatus = async (online) => {
		// Check if backend is actually reachable
		const backendReachable = online ? await checkBackendConnection() : false
		isOnline.value = backendReachable
		syncService.setOnlineStatus(backendReachable)

		if (backendReachable && hasLoaded.value) {
			// Trigger sync when coming back online
			performSync()
		}
	}

	// Sync functionality
	const performSync = async () => {
		if (!isOnline.value || isSyncing.value) {
			return
		}

		try {
			isSyncing.value = true
			setError('')

			// Set up conflict callback
			syncService.setConflictCallback(async (conflicts, dataType) => {
				currentConflicts.value = conflicts
				conflictDataType.value = dataType
				showConflictModal.value = true

				// Wait for user resolution
				return new Promise((resolve) => {
					const handleResolution = (event) => {
						window.removeEventListener('conflict-resolved', handleResolution)
						resolve(event.detail)
					}
					window.addEventListener('conflict-resolved', handleResolution)
				})
			})

			const result = await syncService.performFullSync()

			if (result.success) {
				todos.value = result.todos
				categories.value = result.categories
			}
		} catch (syncError) {
			setError(syncError instanceof Error ? syncError.message : 'Synchronisierung fehlgeschlagen.')
		} finally {
			isSyncing.value = false
		}
	}

	// Handle conflict resolution
	const resolveConflicts = (resolution) => {
		showConflictModal.value = false
		window.dispatchEvent(
			new CustomEvent('conflict-resolved', {
				detail: resolution,
			}),
		)
	}

	// Initialize online/offline listeners
	const initializeNetworkListeners = () => {
		// Check backend connection on initial load
		updateOnlineStatus(navigator.onLine)
		
		window.addEventListener('online', () => updateOnlineStatus(true))
		window.addEventListener('offline', () => updateOnlineStatus(false))
		
		// Periodically check backend connection (every 30 seconds)
		setInterval(async () => {
			if (navigator.onLine) {
				const reachable = await checkBackendConnection()
				if (reachable !== isOnline.value) {
					updateOnlineStatus(true)
				}
			}
		}, 30000)
	}

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
		isOnline,
		isSyncing,
		showConflictModal,
		currentConflicts,
		conflictDataType,
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
		performSync,
		resolveConflicts,
		initializeNetworkListeners,
	}
})