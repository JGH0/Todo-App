<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { getTodos, updateTodo, deleteTodo } from '@/services/todoService'
import { getCategories } from '@/services/categoryService'
import { getAutoDeleteMinutes, AUTO_DELETE_MINUTES_KEY } from '@/utils/appSettings'

const props = defineProps({
	category: {
		type: String,
		default: null
	}
})

// State
const rawTodos = ref([])
const categoriesList = ref([])
const isLoading = ref(false)
const error = ref(null)

// State for edit modal
const editingTodo = ref(null)
const categoryInput = ref('')

// State for delete modal
const deleteTarget = ref(null)
const deleteModalVisible = ref(false)

// Auto‑delete setting (in minutes)
const autoDeleteMinutes = ref(getAutoDeleteMinutes())

// For live countdown
const currentTime = ref(new Date())
let timer = null

// Search & sort
const searchQuery = ref('')
const sortBy = ref('default') // default, title-asc, title-desc, dueDate-asc, dueDate-desc, status-open-first, status-done-first

// Normalize todos: ensure each has a `categories` array (strings)
const normalizedTodos = computed(() => {
	return rawTodos.value.map(todo => {
		if (todo.categories && Array.isArray(todo.categories)) {
			return { ...todo, categories: [...todo.categories] }
		}
		if (todo.categoryId) {
			const cat = categoriesList.value.find(c => c.id == todo.categoryId)
			if (cat) {
				return { ...todo, categories: [cat.name] }
			}
		}
		return { ...todo, categories: [] }
	})
})

// Filter and sort todos
const filteredTodos = computed(() => {
	let result = normalizedTodos.value

	// Category filter
	if (props.category) {
		result = result.filter(todo =>
			todo.categories && todo.categories.includes(props.category)
		)
	}

	// Search filter (title only)
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.trim().toLowerCase()
		result = result.filter(todo =>
			todo.title.toLowerCase().includes(query)
		)
	}

	// Sorting
	if (sortBy.value !== 'default') {
		result = [...result].sort((a, b) => {
			switch (sortBy.value) {
				case 'title-asc':
					return a.title.localeCompare(b.title)
				case 'title-desc':
					return b.title.localeCompare(a.title)
				case 'dueDate-asc':
					const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000)
					const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000)
					return dateA - dateB
				case 'dueDate-desc':
					const dateA2 = a.dueDate ? new Date(a.dueDate) : new Date(0)
					const dateB2 = b.dueDate ? new Date(b.dueDate) : new Date(0)
					return dateB2 - dateA2
				case 'status-open-first':
					if (a.status === 'open' && b.status !== 'open') return -1
					if (a.status !== 'open' && b.status === 'open') return 1
					return 0
				case 'status-done-first':
					if (a.status === 'done' && b.status !== 'done') return -1
					if (a.status !== 'done' && b.status === 'done') return 1
					return 0
				default:
					return 0
			}
		})
	}

	return result
})

// Helper: delete todos that have been done for more than `autoDeleteMinutes`
const deleteExpiredTodos = async () => {
	const expiryDate = new Date()
	expiryDate.setMinutes(expiryDate.getMinutes() - autoDeleteMinutes.value)

	const expiredTodos = rawTodos.value.filter(todo => {
		if (todo.status !== 'done') return false
		if (!todo.completedAt) return false
		const completedDate = new Date(todo.completedAt)
		return completedDate < expiryDate
	})

	if (expiredTodos.length === 0) return

	// Delete each expired todo
	for (const todo of expiredTodos) {
		try {
			await deleteTodo(todo.id)
		} catch (err) {
			console.error(`Failed to delete expired todo ${todo.id}:`, err)
		}
	}

	// Refresh local list
	rawTodos.value = rawTodos.value.filter(t => !expiredTodos.some(e => e.id === t.id))
}

// Load todos and categories from API
const loadData = async () => {
	isLoading.value = true
	error.value = null
	try {
		const [todosData, catsData] = await Promise.all([
			getTodos(),
			getCategories()
		])
		rawTodos.value = todosData
		categoriesList.value = catsData
		await deleteExpiredTodos()
	} catch (err) {
		console.error('Error loading data:', err)
		error.value = 'Failed to load todos. Please try again.'
	} finally {
		isLoading.value = false
	}
}

// Toggle completion status
const toggleComplete = async (todo) => {
	const originalStatus = todo.status
	// Optimistic update
	todo.status = todo.status === 'open' ? 'done' : 'open'

	// Set or remove completedAt timestamp
	if (todo.status === 'done') {
		todo.completedAt = new Date().toISOString()
	} else {
		delete todo.completedAt
	}

	try {
		const payload = { ...todo, categories: todo.categories }
		delete payload.categoryId
		const updated = await updateTodo(todo.id, payload)
		const index = rawTodos.value.findIndex(t => t.id === todo.id)
		if (index !== -1) {
			rawTodos.value[index] = updated
		}
		// After successful toggle, check for expired todos
		await deleteExpiredTodos()
	} catch (err) {
		console.error('Error toggling todo status:', err)
		// Revert on error
		todo.status = originalStatus
		if (originalStatus === 'done') {
			todo.completedAt = new Date().toISOString()
		} else {
			delete todo.completedAt
		}
		error.value = 'Failed to update todo status.'
		setTimeout(() => { error.value = null }, 3000)
	}
}

// Toggle favorite
const toggleFavorite = async (todo) => {
	const originalFavorite = todo.favorite
	// Optimistic update
	todo.favorite = !todo.favorite
	try {
		const payload = { ...todo, categories: todo.categories }
		delete payload.categoryId
		const updated = await updateTodo(todo.id, payload)
		const index = rawTodos.value.findIndex(t => t.id === todo.id)
		if (index !== -1) {
			rawTodos.value[index] = updated
		}
	} catch (err) {
		console.error('Error toggling favorite:', err)
		todo.favorite = originalFavorite
		error.value = 'Failed to update favorite.'
		setTimeout(() => { error.value = null }, 3000)
	}
}

// Edit modal methods
const openEdit = (todo) => {
	editingTodo.value = { ...todo, categories: [...todo.categories] }
	categoryInput.value = ''
}

const closeEdit = () => {
	editingTodo.value = null
	categoryInput.value = ''
}

const addCategory = () => {
	if (!editingTodo.value) return
	const value = categoryInput.value.trim()
	if (!value || editingTodo.value.categories.includes(value)) {
		categoryInput.value = ''
		return
	}
	editingTodo.value.categories = [...editingTodo.value.categories, value]
	categoryInput.value = ''
}

const removeCategory = (cat) => {
	if (!editingTodo.value) return
	editingTodo.value.categories = editingTodo.value.categories.filter(c => c !== cat)
}

const saveEdit = async () => {
	if (!editingTodo.value) return
	const originalTodo = rawTodos.value.find(t => t.id === editingTodo.value.id)
	if (!originalTodo) return

	try {
		const updatedPayload = { ...editingTodo.value, categories: editingTodo.value.categories }
		delete updatedPayload.categoryId
		const savedTodo = await updateTodo(editingTodo.value.id, updatedPayload)
		const index = rawTodos.value.findIndex(t => t.id === savedTodo.id)
		if (index !== -1) {
			rawTodos.value[index] = savedTodo
		}
		closeEdit()
	} catch (err) {
		console.error('Error saving todo:', err)
		error.value = 'Failed to save changes. Please try again.'
		setTimeout(() => { error.value = null }, 3000)
	}
}

// Delete modal methods
const confirmDelete = (todo) => {
	deleteTarget.value = todo
	deleteModalVisible.value = true
}

const closeDeleteModal = () => {
	deleteTarget.value = null
	deleteModalVisible.value = false
}

const executeDelete = async () => {
	if (!deleteTarget.value) return
	const todoId = deleteTarget.value.id
	try {
		await deleteTodo(todoId)
		rawTodos.value = rawTodos.value.filter(t => t.id !== todoId)
		closeDeleteModal()
	} catch (err) {
		console.error('Error deleting todo:', err)
		error.value = 'Failed to delete todo. Please try again.'
		setTimeout(() => { error.value = null }, 3000)
		closeDeleteModal()
	}
}

// Format remaining time in largest unit + next unit
function formatTimeRemaining(ms) {
	if (ms <= 0) return 'Expired'
	const totalMinutes = Math.floor(ms / (1000 * 60))

	const weeks = Math.floor(totalMinutes / (7 * 24 * 60))
	const days = Math.floor((totalMinutes % (7 * 24 * 60)) / (24 * 60))
	const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
	const minutes = totalMinutes % 60
	const seconds = Math.floor((ms % (1000 * 60)) / 1000)

	if (weeks > 0) {
		const weekPart = `${weeks} week${weeks !== 1 ? 's' : ''}`
		const dayPart = days ? ` ${days} day${days !== 1 ? 's' : ''}` : ''
		return weekPart + dayPart
	}
	if (days > 0) {
		const dayPart = `${days} day${days !== 1 ? 's' : ''}`
		const hourPart = hours ? ` ${hours} hour${hours !== 1 ? 's' : ''}` : ''
		return dayPart + hourPart
	}
	if (hours > 0) {
		const hourPart = `${hours} hour${hours !== 1 ? 's' : ''}`
		const minutePart = minutes ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''
		return hourPart + minutePart
	}
	if (minutes > 0) {
		const minutePart = `${minutes} minute${minutes !== 1 ? 's' : ''}`
		const secondPart = seconds ? ` ${seconds} second${seconds !== 1 ? 's' : ''}` : ''
		return minutePart + secondPart
	}
	return `${seconds} second${seconds !== 1 ? 's' : ''}`
}

// Enhanced countdown: returns formatted remaining time
const getCountdownText = (todo) => {
	if (todo.status !== 'done' || !todo.completedAt) return ''
	const now = currentTime.value
	const completedDate = new Date(todo.completedAt)
	const expiryDate = new Date(completedDate.getTime() + autoDeleteMinutes.value * 60 * 1000)
	const diffMs = expiryDate - now
	if (diffMs <= 0) return 'Expired'
	return formatTimeRemaining(diffMs)
}

// Event listener for todo creation
const handleTodoCreated = () => {
	loadData()
}

// Listen for changes to auto‑delete setting from other tabs or the same tab
const handleAutoDeleteChange = (e) => {
	autoDeleteMinutes.value = e.detail
}

const handleStorage = (e) => {
	if (e.key === AUTO_DELETE_MINUTES_KEY) {
		autoDeleteMinutes.value = getAutoDeleteMinutes()
	}
}

// Watch for local changes to the setting (e.g. if another part of the app changes it)
watch(autoDeleteMinutes, () => {
	deleteExpiredTodos()
})

// Timer to update currentTime every second
const startTimer = () => {
	timer = setInterval(() => {
		currentTime.value = new Date()
	}, 1000)
}

onMounted(() => {
	loadData()
	window.addEventListener('todo-created', handleTodoCreated)
	window.addEventListener('auto-delete-minutes-changed', handleAutoDeleteChange)
	window.addEventListener('storage', handleStorage)
	startTimer()
})

onBeforeUnmount(() => {
	window.removeEventListener('todo-created', handleTodoCreated)
	window.removeEventListener('auto-delete-minutes-changed', handleAutoDeleteChange)
	window.removeEventListener('storage', handleStorage)
	if (timer) clearInterval(timer)
})
</script>

<template>
	<div class="card todo-list-view">
		<div class="card-header">
			<div>
				<p class="eyebrow">Todos</p>
				<h2 v-if="category">{{ category }} Tasks</h2>
				<h2 v-else>All Tasks</h2>
			</div>
			<div class="header-controls">
				<input
					v-model="searchQuery"
					type="text"
					placeholder="Search tasks..."
					class="search-input"
				/>
				<select v-model="sortBy" class="sort-select">
					<option value="default">Default (recent first)</option>
					<option value="title-asc">Title A→Z</option>
					<option value="title-desc">Title Z→A</option>
					<option value="dueDate-asc">Due date (earliest first)</option>
					<option value="dueDate-desc">Due date (latest first)</option>
					<option value="status-open-first">Open tasks first</option>
					<option value="status-done-first">Done tasks first</option>
				</select>
				<button v-if="!isLoading" class="refresh-btn" @click="loadData" aria-label="Refresh">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6M1 20v-6h6" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
		</div>

		<div v-if="error" class="error-banner">{{ error }}</div>

		<div v-if="isLoading" class="loading-state"><p>Loading todos...</p></div>

		<div v-else-if="filteredTodos.length === 0" class="empty-state">
			<p>No todos found for this category.</p>
		</div>

		<ul v-else class="todo-list">
			<li v-for="todo in filteredTodos" :key="todo.id" class="todo-item">
				<div class="todo-row todo-row-main">
					<button
						class="completion-circle"
						:class="{ completed: todo.status === 'done' }"
						@click="toggleComplete(todo)"
					/>
					<span class="todo-title">{{ todo.title }}</span>
					<div class="todo-actions-right">
						<button class="icon-btn star" :class="{ active: todo.favorite }" @click="toggleFavorite(todo)">
							<svg width="24" height="24" viewBox="0 0 24 24" :fill="todo.favorite ? '#f5b342' : 'none'" stroke="currentColor" stroke-width="2">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
							</svg>
						</button>
						<button class="icon-btn edit" @click="openEdit(todo)">
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
								<path d="M15.6287 5.12132L4.31497 16.435M15.6287 5.12132L19.1642 8.65685M15.6287 5.12132L17.0429 3.70711C17.4334 3.31658 18.0666 3.31658 18.4571 3.70711L20.5784 5.82843C20.969 6.21895 20.969 6.85212 20.5784 7.24264L19.1642 8.65685M7.85051 19.9706L4.31497 16.435M7.85051 19.9706L19.1642 8.65685M7.85051 19.9706L3.25431 21.0312L4.31497 16.435" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
						<button class="icon-btn delete" @click="confirmDelete(todo)">
							<svg fill="#000000" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
								<title>trash-line</title>
								<path class="clr-i-outline clr-i-outline-path-1" d="M27.14,34H8.86A2.93,2.93,0,0,1,6,31V11.23H8V31a.93.93,0,0,0,.86,1H27.14A.93.93,0,0,0,28,31V11.23h2V31A2.93,2.93,0,0,1,27.14,34Z"></path>
								<path class="clr-i-outline clr-i-outline-path-2" d="M30.78,9H5A1,1,0,0,1,5,7H30.78a1,1,0,0,1,0,2Z"></path>
								<rect class="clr-i-outline clr-i-outline-path-3" x="21" y="13" width="2" height="15"></rect>
								<rect class="clr-i-outline clr-i-outline-path-4" x="13" y="13" width="2" height="15"></rect>
								<path class="clr-i-outline clr-i-outline-path-5" d="M23,5.86H21.1V4H14.9V5.86H13V4a2,2,0,0,1,1.9-2h6.2A2,2,0,0,1,23,4Z"></path>
								<rect x="0" y="0" width="36" height="36" fill-opacity="0"></rect>
							</svg>
						</button>
					</div>
				</div>
				<div v-if="todo.description" class="todo-row todo-description">{{ todo.description }}</div>
				<div class="todo-row todo-metadata">
					<div class="meta-left">
						<span v-if="todo.dueDate" class="meta-chip">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 9H21M17 13.0014L7 13M10.3333 17.0005L7 17M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{{ todo.dueDate }}
							<span v-if="todo.dueTime" class="time-part">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.9997 20.5815L16.4179 18.0113M4.9997 20.5815L7.58154 18.0113M11.9997 9.58148V12.5815L13.4416 13.9998M6.74234 3.99735C6.36727 3.62228 5.85856 3.41156 5.32812 3.41156C4.79769 3.41156 4.28898 3.62228 3.91391 3.99735C3.53884 4.37242 3.32813 4.88113 3.32812 5.41156C3.32812 5.942 3.53884 6.4507 3.91391 6.82578M20.0858 6.82413C20.4609 6.44905 20.6716 5.94035 20.6716 5.40991C20.6716 4.87948 20.4609 4.37077 20.0858 3.9957C19.7107 3.62063 19.202 3.40991 18.6716 3.40991C18.1411 3.40991 17.6324 3.62063 17.2574 3.9957M18.9997 12.5815C18.9997 16.4475 15.8657 19.5815 11.9997 19.5815C8.1337 19.5815 4.9997 16.4475 4.9997 12.5815C4.9997 8.71549 8.1337 5.58149 11.9997 5.58149C15.8657 5.58149 18.9997 8.71549 18.9997 12.5815Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								{{ todo.dueTime }}
							</span>
						</span>
						<span v-for="cat in todo.categories" :key="cat" class="category-chip">{{ cat }}</span>
					</div>
					<div v-if="todo.status === 'done'" class="meta-right countdown">{{ getCountdownText(todo) }}</div>
				</div>
			</li>
		</ul>

		<!-- Edit Modal -->
		<Teleport to="body">
			<div v-if="editingTodo" class="modal-overlay" @click.self="closeEdit">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Edit Task</h3>
						<button class="close-btn" @click="closeEdit">✕</button>
					</div>
					<div class="modal-body">
						<div class="field">
							<label class="field-label">Title</label>
							<input v-model="editingTodo.title" type="text" placeholder="Task title" />
						</div>
						<div class="field">
							<label class="field-label">Description</label>
							<textarea v-model="editingTodo.description" rows="3" placeholder="Description"></textarea>
						</div>
						<div class="split-row">
							<div class="field">
								<label class="field-label">Date</label>
								<input v-model="editingTodo.dueDate" type="date" />
							</div>
							<div class="field" style="margin-top: 0;">
								<label class="field-label">Time</label>
								<input v-model="editingTodo.dueTime" type="time" />
							</div>
						</div>
						<div class="field">
							<label class="field-label">Categories</label>
							<div class="category-list">
								<span v-for="cat in editingTodo.categories" :key="cat" class="category-chip">
									{{ cat }}
									<button type="button" class="chip-remove" @click="removeCategory(cat)">✕</button>
								</span>
							</div>
							<div class="input-line">
								<input v-model="categoryInput" type="text" placeholder="Add category" @keydown.enter.prevent="addCategory" />
								<button class="inline-icon-button" type="button" @click="addCategory">Add</button>
							</div>
						</div>
						<div class="split-row">
							<div class="field">
								<label class="field-label">Status</label>
								<select v-model="editingTodo.status">
									<option value="open">Open</option>
									<option value="done">Done</option>
								</select>
							</div>
							<div class="field checkbox-field">
								<label>
									<input type="checkbox" v-model="editingTodo.favorite" />
									<span>Favorite</span>
								</label>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button class="secondary-button" @click="closeEdit">Cancel</button>
						<button class="primary-button" @click="saveEdit">Save</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- Delete Confirmation Modal -->
		<Teleport to="body">
			<div v-if="deleteModalVisible" class="modal-overlay" @click.self="closeDeleteModal">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Delete Task</h3>
						<button class="close-btn" @click="closeDeleteModal">✕</button>
					</div>
					<div class="modal-body">
						<p>Are you sure you want to delete "<strong>{{ deleteTarget?.title }}</strong>"?<br>This action cannot be undone.</p>
					</div>
					<div class="modal-footer">
						<button class="secondary-button" @click="closeDeleteModal">Cancel</button>
						<button class="danger-button" @click="executeDelete">Delete</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
/* Keep all existing styles – unchanged */
.todo-list-view {
	background: var(--surface);
	backdrop-filter: blur(12px);
}

.todo-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	gap: 16px;
}

.todo-item {
	padding: 18px 20px;
	border-radius: 24px;
	background: #f8f8f6;
	border: 1px solid #e2e2de;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.todo-row {
	display: flex;
	align-items: center;
}

.todo-row-main {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.completion-circle {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	border: 2px solid #888;
	background: transparent;
	cursor: pointer;
	padding: 0;
	transition: background 0.2s, border-color 0.2s;
	margin-right: 12px;
	flex-shrink: 0;
}

.completion-circle.completed {
	background: #4caf50;
	border-color: #4caf50;
}

.todo-title {
	flex: 1;
	font-weight: 600;
	font-size: 1.15rem;
}

.todo-actions-right {
	display: flex;
	gap: 8px;
	margin-left: 12px;
	flex-shrink: 0;
}

.icon-btn {
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	opacity: 0.6;
	transition: opacity 0.2s, transform 0.1s;
}

.icon-btn:hover {
	opacity: 1;
	transform: scale(1.05);
}

.icon-btn:active {
	transform: scale(0.95);
}

.icon-btn.star svg,
.icon-btn.edit svg,
.icon-btn.delete svg {
	width: 24px;
	height: 24px;
	stroke: currentColor;
}

.icon-btn.delete svg {
	width: 28px;
	height: 28px;
	fill: currentColor;
	stroke: none;
}

.icon-btn.star.active svg {
	fill: #f5b342;
}

.todo-description {
	color: var(--text-muted);
	padding-left: 40px;
	font-size: 0.95rem;
}

.todo-metadata {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	padding-left: 40px;
}

.meta-left {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.meta-chip,
.category-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: var(--chip);
	border: 1px solid var(--border);
	padding: 6px 14px;
	font-size: 0.9rem;
	border-radius: 999px;
}

.meta-chip svg,
.category-chip svg {
	width: 16px;
	height: 16px;
	stroke: currentColor;
}

.time-part {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-left: 4px;
}

.meta-right {
	font-size: 0.9rem;
	color: #d32f2f;
	font-weight: 500;
	white-space: nowrap;
}

.countdown {
	background: rgba(211, 47, 47, 0.1);
	padding: 4px 14px;
	border-radius: 999px;
}

.empty-state {
	padding: 40px 20px;
	text-align: center;
	color: var(--text-muted);
	background: rgba(255,255,255,0.4);
	border-radius: 18px;
}

.loading-state {
	padding: 40px 20px;
	text-align: center;
	color: var(--text-muted);
}

.error-banner {
	background: #fee;
	border: 1px solid #fcc;
	color: #c33;
	padding: 12px;
	border-radius: 12px;
	margin-bottom: 16px;
	text-align: center;
}

.refresh-btn {
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 8px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s;
}

.refresh-btn:hover {
	background: rgba(0, 0, 0, 0.05);
}

@media (max-width: 640px) {
	.todo-item {
		padding: 14px;
	}

	.todo-description,
	.todo-metadata {
		padding-left: 0;
	}

	.todo-metadata {
		flex-direction: column;
		align-items: flex-start;
	}

	.meta-right {
		align-self: flex-end;
	}
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-card {
	background: white;
	border-radius: 28px;
	padding: 24px;
	width: 90%;
	max-width: 500px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.modal-header h3 {
	margin: 0;
	color: #333;
}

.close-btn {
	background: transparent;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	padding: 0;
	line-height: 1;
}

.modal-body {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.field-label {
	font-size: 0.9rem;
	color: var(--text-muted);
}

.field input,
.field textarea,
.field select {
	width: 100%;
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 10px 12px;
	font: inherit;
	background: white;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
	outline: none;
	border-color: var(--accent);
}

.split-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.category-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 8px;
}

.chip-remove {
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0 2px;
	font-size: 1rem;
	line-height: 1;
}

.input-line {
	display: flex;
	gap: 8px;
}

.input-line input {
	flex: 1;
}

.inline-icon-button {
	background: var(--chip);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 8px 16px;
	cursor: pointer;
	white-space: nowrap;
	color: #000;
}

.checkbox-field {
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.checkbox-field label {
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
}

.checkbox-field label span {
	color: #000;
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 24px;
}

.primary-button,
.secondary-button,
.danger-button {
	border: none;
	border-radius: 999px;
	padding: 10px 20px;
	cursor: pointer;
	font-weight: 500;
}

.primary-button {
	background: var(--accent);
	color: white;
}

.secondary-button {
	background: #e5e5e2;
	color: #303030;
}

.danger-button {
	background: #d32f2f;
	color: white;
}

.danger-button:hover {
	background: #b71c1c;
}

.header-controls {
	display: flex;
	gap: 12px;
	align-items: center;
	margin-bottom: 1rem;
}

.search-input {
	padding: 8px 12px;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: white;
	font-size: 0.9rem;
	min-width: 180px;
}

.search-input:focus {
	outline: none;
	border-color: var(--accent);
}

.sort-select {
	padding: 8px 12px;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: white;
	font-size: 0.9rem;
	cursor: pointer;
}

@media (max-width: 768px) {
	.card-header {
		flex-direction: column;
		align-items: stretch;
		gap: 12px;
	}
	.header-controls {
		flex-wrap: wrap;
	}
	.search-input {
		flex: 1;
	}
}
</style>