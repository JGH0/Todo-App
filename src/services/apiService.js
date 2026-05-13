import api from './api'
import { offlineStorage } from './offlineStorage'
import {
	toBackendCase,
	toFrontendCase,
	mapStatusToBackend,
	mapStatusToFrontend,
} from '@/utils/fieldMapper'

// Check if online
export const isOnline = () => navigator.onLine

// Convert an array of items from snake_case to camelCase
function convertArrayFromBackend(items) {
	if (!Array.isArray(items)) return items
	return items.map((item) => {
		const converted = toFrontendCase(item)
		// Fix status values
		if (converted.status) {
			converted.status = mapStatusToFrontend(converted.status)
		}
		// Convert category_names from GROUP_CONCAT string to categories array of strings
		if (
			converted.category_names &&
			typeof converted.category_names === 'string'
		) {
			converted.categories = converted.category_names
				.split(',')
				.filter(Boolean)
				.map((name) => name.trim())
		}
		return converted
	})
}

// Convert a single item from camelCase to snake_case for sending
function convertItemToBackend(item) {
	const converted = toBackendCase(item)
	if (converted.status) {
		converted.status = mapStatusToBackend(converted.status)
	}
	return converted
}

// API wrapper that handles offline mode
export const apiCall = async (requestFn, offlineFallback, storageKey) => {
	if (isOnline()) {
		try {
			const result = await requestFn()
			// Save to offline storage for future use
			if (storageKey && result) {
				const converted = convertArrayFromBackend(
					Array.isArray(result) ? result : [result],
				)
				if (storageKey === 'todos') {
					offlineStorage.saveTodos(converted)
				} else if (storageKey === 'categories') {
					offlineStorage.saveCategories(converted)
				}
			}
			return Array.isArray(result) ? convertArrayFromBackend(result) : result
		} catch (error) {
			console.warn('API call failed, falling back to offline storage:', error)
			// Fall back to offline storage
			if (offlineFallback) {
				return offlineFallback()
			}
			throw error
		}
	} else {
		// Offline - use local storage
		console.log('Offline mode - using local storage')
		if (offlineFallback) {
			return offlineFallback()
		}
		throw new Error('Offline and no fallback available')
	}
}

// Get todos with offline support
export const getTodos = async () => {
	return apiCall(
		async () => {
			const response = await api.get('/todos')
			return response.data.data || response.data
		},
		() => offlineStorage.loadTodos(),
		'todos',
	)
}

// Get categories with offline support
export const getCategories = async () => {
	return apiCall(
		async () => {
			const response = await api.get('/categories')
			return response.data.data || response.data
		},
		() => offlineStorage.loadCategories(),
		'categories',
	)
}

// Create todo with offline support
export const createTodo = async (todo) => {
	const backendTodo = convertItemToBackend(todo)

	if (isOnline()) {
		try {
			const response = await api.post('/todos', backendTodo)
			const createdTodo = response.data.data || response.data
			const converted = toFrontendCase(createdTodo)
			if (converted.status) {
				converted.status = mapStatusToFrontend(converted.status)
			}
			// Update local storage
			const localTodos = offlineStorage.loadTodos()
			offlineStorage.saveTodos([converted, ...localTodos])
			return converted
		} catch (error) {
			// If offline during request, save locally and add to pending changes
			console.warn('Failed to create todo, saving locally:', error)
			const localTodos = offlineStorage.loadTodos()
			const newTodo = {
				...todo,
				id: `local_${Date.now()}`,
				created_at: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			offlineStorage.saveTodos([newTodo, ...localTodos])
			offlineStorage.addPendingChange({
				type: 'create_todo',
				data: newTodo,
			})
			return newTodo
		}
	} else {
		// Offline - save locally
		const localTodos = offlineStorage.loadTodos()
		const newTodo = {
			...todo,
			id: `local_${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		offlineStorage.saveTodos([newTodo, ...localTodos])
		offlineStorage.addPendingChange({
			type: 'create_todo',
			data: newTodo,
		})
		return newTodo
	}
}

// Update todo with offline support
export const updateTodo = async (id, todo) => {
	const backendTodo = convertItemToBackend(todo)

	if (isOnline()) {
		try {
			const response = await api.put(`/todos/${id}`, backendTodo)
			const updatedTodo = response.data.data || response.data
			const converted = toFrontendCase(updatedTodo)
			if (converted.status) {
				converted.status = mapStatusToFrontend(converted.status)
			}
			// Update local storage
			const localTodos = offlineStorage.loadTodos()
			const updated = localTodos.map((t) =>
				t.id === id ? converted : t,
			)
			offlineStorage.saveTodos(updated)
			return converted
		} catch (error) {
			// If offline during request, update locally
			console.warn('Failed to update todo, updating locally:', error)
			const localTodos = offlineStorage.loadTodos()
			const updated = localTodos.map((t) =>
				t.id === id ?
					{ ...t, ...todo, updatedAt: new Date().toISOString() } :
					t,
			)
			offlineStorage.saveTodos(updated)
			offlineStorage.addPendingChange({
				type: 'update_todo',
				id,
				data: todo,
			})
			return localTodos.find((t) => t.id === id)
		}
	} else {
		// Offline - update locally
		const localTodos = offlineStorage.loadTodos()
		const updated = localTodos.map((t) =>
			t.id === id ?
				{ ...t, ...todo, updatedAt: new Date().toISOString() } :
				t,
		)
		offlineStorage.saveTodos(updated)
		offlineStorage.addPendingChange({
			type: 'update_todo',
			id,
			data: todo,
		})
		return localTodos.find((t) => t.id === id)
	}
}

// Delete todo with offline support
export const deleteTodo = async (id) => {
	if (isOnline()) {
		try {
			await api.delete(`/todos/${id}`)
			// Update local storage
			const localTodos = offlineStorage.loadTodos()
			offlineStorage.saveTodos(localTodos.filter((t) => t.id !== id))
			return true
		} catch (error) {
			// If offline during request, delete locally
			console.warn('Failed to delete todo, deleting locally:', error)
			const localTodos = offlineStorage.loadTodos()
			offlineStorage.saveTodos(localTodos.filter((t) => t.id !== id))
			offlineStorage.addPendingChange({
				type: 'delete_todo',
				id,
			})
			return true
		}
	} else {
		// Offline - delete locally
		const localTodos = offlineStorage.loadTodos()
		offlineStorage.saveTodos(localTodos.filter((t) => t.id !== id))
		offlineStorage.addPendingChange({
			type: 'delete_todo',
			id,
		})
		return true
	}
}

// Create category with offline support
export const createCategory = async (category) => {
	// Backend requires 'color' field
	const backendCategory = toBackendCase({
		...category,
		color: category.color || '#3B82F6',
		favorite: category.favorite ?? false,
	})

	if (isOnline()) {
		try {
			const response = await api.post('/categories', backendCategory)
			const createdCategory = response.data.data || response.data
			const converted = toFrontendCase(createdCategory)
			// Update local storage
			const localCategories = offlineStorage.loadCategories()
			offlineStorage.saveCategories([...localCategories, converted])
			return converted
		} catch (error) {
			// If offline during request, save locally
			console.warn('Failed to create category, saving locally:', error)
			const localCategories = offlineStorage.loadCategories()
			const newCategory = {
				...category,
				id: `local_${Date.now()}`,
				color: category.color || '#3B82F6',
				favorite: category.favorite ?? false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			offlineStorage.saveCategories([...localCategories, newCategory])
			offlineStorage.addPendingChange({
				type: 'create_category',
				data: newCategory,
			})
			return newCategory
		}
	} else {
		// Offline - save locally
		const localCategories = offlineStorage.loadCategories()
		const newCategory = {
			...category,
			id: `local_${Date.now()}`,
			color: category.color || '#3B82F6',
			favorite: category.favorite ?? false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		offlineStorage.saveCategories([...localCategories, newCategory])
		offlineStorage.addPendingChange({
			type: 'create_category',
			data: newCategory,
		})
		return newCategory
	}
}

// Update category with offline support
export const updateCategory = async (id, category) => {
	const backendCategory = toBackendCase({
		...category,
		color: category.color || '#3B82F6',
	})

	if (isOnline()) {
		try {
			const response = await api.put(`/categories/${id}`, backendCategory)
			const updatedCategory = response.data.data || response.data
			const converted = toFrontendCase(updatedCategory)
			// Update local storage
			const localCategories = offlineStorage.loadCategories()
			const updated = localCategories.map((c) =>
				c.id === id ? converted : c,
			)
			offlineStorage.saveCategories(updated)
			return converted
		} catch (error) {
			// If offline during request, update locally
			console.warn('Failed to update category, updating locally:', error)
			const localCategories = offlineStorage.loadCategories()
			const updated = localCategories.map((c) =>
				c.id === id ?
					{ ...c, ...category, updatedAt: new Date().toISOString() } :
					c,
			)
			offlineStorage.saveCategories(updated)
			offlineStorage.addPendingChange({
				type: 'update_category',
				id,
				data: category,
			})
			return localCategories.find((c) => c.id === id)
		}
	} else {
		// Offline - update locally
		const localCategories = offlineStorage.loadCategories()
		const updated = localCategories.map((c) =>
			c.id === id ?
				{ ...c, ...category, updatedAt: new Date().toISOString() } :
				c,
		)
		offlineStorage.saveCategories(updated)
		offlineStorage.addPendingChange({
			type: 'update_category',
			id,
			data: category,
		})
		return localCategories.find((c) => c.id === id)
	}
}

// Delete category with offline support
export const deleteCategory = async (id) => {
	if (isOnline()) {
		try {
			await api.delete(`/categories/${id}`)
			// Update local storage
			const localCategories = offlineStorage.loadCategories()
			offlineStorage.saveCategories(localCategories.filter((c) => c.id !== id))
			return true
		} catch (error) {
			// If offline during request, delete locally
			console.warn('Failed to delete category, deleting locally:', error)
			const localCategories = offlineStorage.loadCategories()
			offlineStorage.saveCategories(localCategories.filter((c) => c.id !== id))
			offlineStorage.addPendingChange({
				type: 'delete_category',
				id,
			})
			return true
		}
	} else {
		// Offline - delete locally
		const localCategories = offlineStorage.loadCategories()
		offlineStorage.saveCategories(localCategories.filter((c) => c.id !== id))
		offlineStorage.addPendingChange({
			type: 'delete_category',
			id,
		})
		return true
	}
}
