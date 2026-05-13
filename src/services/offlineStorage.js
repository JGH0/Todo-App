const STORAGE_KEYS = {
	TODOS: 'offline_todos',
	CATEGORIES: 'offline_categories',
	PENDING_CHANGES: 'pending_changes',
	LAST_SYNC: 'last_sync_timestamp',
}

export const offlineStorage = {
	// Save todos to localStorage
	saveTodos(todos) {
		try {
			localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos))
			return true
		} catch (error) {
			console.error('Failed to save todos to localStorage:', error)
			return false
		}
	},

	// Load todos from localStorage
	loadTodos() {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.TODOS)
			return data ? JSON.parse(data) : []
		} catch (error) {
			console.error('Failed to load todos from localStorage:', error)
			return []
		}
	},

	// Save categories to localStorage
	saveCategories(categories) {
		try {
			localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
			return true
		} catch (error) {
			console.error('Failed to save categories to localStorage:', error)
			return false
		}
	},

	// Load categories from localStorage
	loadCategories() {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
			return data ? JSON.parse(data) : []
		} catch (error) {
			console.error('Failed to load categories from localStorage:', error)
			return []
		}
	},

	// Save pending changes (for sync)
	savePendingChanges(changes) {
		try {
			localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(changes))
			return true
		} catch (error) {
			console.error('Failed to save pending changes:', error)
			return false
		}
	},

	// Load pending changes
	loadPendingChanges() {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.PENDING_CHANGES)
			return data ? JSON.parse(data) : []
		} catch (error) {
			console.error('Failed to load pending changes:', error)
			return []
		}
	},

	// Clear pending changes
	clearPendingChanges() {
		try {
			localStorage.removeItem(STORAGE_KEYS.PENDING_CHANGES)
			return true
		} catch (error) {
			console.error('Failed to clear pending changes:', error)
			return false
		}
	},

	// Save last sync timestamp
	saveLastSync(timestamp) {
		try {
			localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString())
			return true
		} catch (error) {
			console.error('Failed to save last sync timestamp:', error)
			return false
		}
	},

	// Load last sync timestamp
	loadLastSync() {
		try {
			const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
			return data ? parseInt(data, 10) : null
		} catch (error) {
			console.error('Failed to load last sync timestamp:', error)
			return null
		}
	},

	// Add a pending change
	addPendingChange(change) {
		const changes = this.loadPendingChanges()
		changes.push({
			...change,
			timestamp: Date.now(),
		})
		return this.savePendingChanges(changes)
	},

	// Clear all offline data
	clearAll() {
		try {
			Object.values(STORAGE_KEYS).forEach((key) => {
				localStorage.removeItem(key)
			})
			return true
		} catch (error) {
			console.error('Failed to clear offline data:', error)
			return false
		}
	},
}
