import { offlineStorage } from './offlineStorage'
import api from './api'

// Conflict types
export const CONFLICT_TYPES = {
	TODO_MODIFIED: 'todo_modified',
	CATEGORY_MODIFIED: 'category_modified',
	TODO_DELETED: 'todo_deleted',
	CATEGORY_DELETED: 'category_deleted',
}

// Detect conflicts between local and remote data
export const detectConflicts = (localData, remoteData) => {
	const conflicts = []

	// Check for modified items
	localData.forEach((localItem) => {
		const remoteItem = remoteData.find((item) => item.id === localItem.id)

		if (remoteItem) {
			// Item exists in both - check if modified
			const localUpdated = new Date(localItem.updated_at || localItem.updatedAt).getTime()
			const remoteUpdated = new Date(remoteItem.updated_at || remoteItem.updatedAt).getTime()

			if (localUpdated !== remoteUpdated) {
				conflicts.push({
					type: localItem.title ? CONFLICT_TYPES.TODO_MODIFIED : CONFLICT_TYPES.CATEGORY_MODIFIED,
					local: localItem,
					remote: remoteItem,
				})
			}
		} else {
			// Item only exists locally (was created offline)
			// This is not a conflict, it's a new item to sync
		}
	})

	// Check for items that were deleted remotely
	remoteData.forEach((remoteItem) => {
		const localItem = localData.find((item) => item.id === remoteItem.id)
		if (!localItem) {
			conflicts.push({
				type: remoteItem.title ? CONFLICT_TYPES.TODO_DELETED : CONFLICT_TYPES.CATEGORY_DELETED,
				local: null,
				remote: remoteItem,
			})
		}
	})

	return conflicts
}

// Sync service
export const syncService = {
	isOnline: true,
	conflictCallback: null,

	setOnlineStatus(isOnline) {
		this.isOnline = isOnline
	},

	setConflictCallback(callback) {
		this.conflictCallback = callback
	},

	// Sync todos with conflict detection
	async syncTodos(localTodos, remoteTodos) {
		const conflicts = detectConflicts(localTodos, remoteTodos)

		if (conflicts.length > 0) {
			// If there are conflicts, invoke the callback and let user decide
			if (this.conflictCallback) {
				const resolution = await this.conflictCallback(conflicts, 'todos')
				return this.applyResolution(resolution, localTodos, remoteTodos, 'todos')
			}
			// If no callback, default to remote data
			return remoteTodos
		}

		// No conflicts - merge data
		return this.mergeData(localTodos, remoteTodos)
	},

	// Sync categories with conflict detection
	async syncCategories(localCategories, remoteCategories) {
		const conflicts = detectConflicts(localCategories, remoteCategories)

		if (conflicts.length > 0) {
			if (this.conflictCallback) {
				const resolution = await this.conflictCallback(conflicts, 'categories')
				return this.applyResolution(resolution, localCategories, remoteCategories, 'categories')
			}
			return remoteCategories
		}

		return this.mergeData(localCategories, remoteCategories)
	},

	// Merge local and remote data (no conflicts)
	mergeData(localData, remoteData) {
		const merged = [...remoteData]

		// Add items that only exist locally (created offline)
		localData.forEach((localItem) => {
			const existsInRemote = remoteData.find((item) => item.id === localItem.id)
			if (!existsInRemote) {
				merged.push(localItem)
			}
		})

		return merged
	},

	// Apply user's conflict resolution
	applyResolution(resolution, localData, remoteData, dataType) {
		if (!resolution) {
			return remoteData // Default to remote if no resolution
		}

		const { strategy, itemResolutions } = resolution

		if (strategy === 'local') {
			return localData
		}

		if (strategy === 'remote') {
			return remoteData
		}

		if (strategy === 'per_item' && itemResolutions) {
			const merged = [...remoteData]

			// Apply per-item resolutions
			itemResolutions.forEach((res) => {
				if (res.choice === 'local' && res.local) {
					const index = merged.findIndex((item) => item.id === res.local.id)
					if (index !== -1) {
						merged[index] = res.local
					} else {
						merged.push(res.local)
					}
				}
				// If choice is 'remote', keep the remote version (already in merged)
			})

			return merged
		}

		return remoteData
	},

	// Perform full sync
	async performFullSync() {
		if (!this.isOnline) {
			// Save current state to offline storage
			return { success: false, reason: 'offline' }
		}

		try {
			const localTodos = offlineStorage.loadTodos()
			const localCategories = offlineStorage.loadCategories()

			const todosResponse = await api.get('/todos')
			const categoriesResponse = await api.get('/categories')
			const remoteTodos = todosResponse.data.data || todosResponse.data
			const remoteCategories = categoriesResponse.data.data || categoriesResponse.data

			const syncedTodos = await this.syncTodos(localTodos, remoteTodos)
			const syncedCategories = await this.syncCategories(localCategories, remoteCategories)

			// Save synced data
			offlineStorage.saveTodos(syncedTodos)
			offlineStorage.saveCategories(syncedCategories)
			offlineStorage.saveLastSync(Date.now())

			// Clear pending changes
			offlineStorage.clearPendingChanges()

			return {
				success: true,
				todos: syncedTodos,
				categories: syncedCategories,
			}
		} catch (error) {
			console.error('Sync failed:', error)
			return { success: false, reason: 'error', error }
		}
	},
}
