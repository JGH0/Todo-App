<template>
	<div class="card category-management">
		<div class="card-header">
			<div>
				<p class="eyebrow">Categories</p>
				<h2>Manage Categories</h2>
			</div>
			<button class="add-btn" @click="openAddModal">+ Add Category</button>
		</div>

		<div v-if="loading" class="loading-state">Loading categories...</div>
		<div v-else-if="error" class="error-banner">{{ error }}</div>
		<div v-else-if="categories.length === 0" class="empty-state">No categories found. Create one.</div>

		<div v-else class="category-list">
			<div v-for="cat in sortedCategories" :key="cat.id" class="category-item">
				<div class="category-info">
					<button class="favorite-star" :class="{ active: cat.favorite }" @click="toggleFavorite(cat)">
						<svg width="20" height="20" viewBox="0 0 24 24" :fill="cat.favorite ? '#f5b342' : 'none'" stroke="currentColor" stroke-width="2">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</button>

					<span v-if="editingId !== cat.id" class="category-name" @dblclick="startEdit(cat)">
						{{ cat.name }}
					</span>
					<input
						v-else
						v-model="editName"
						type="text"
						@keyup.enter="saveEdit(editingCat)"
						@keyup.esc="cancelEdit"
						@blur="saveEdit(editingCat)"
						class="edit-input"
						ref="editInput"
					/>
				</div>

				<div class="category-actions">
					<button v-if="editingId !== cat.id" class="icon-btn edit" @click="startEdit(cat)" title="Rename">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
							<path d="M15.6287 5.12132L4.31497 16.435M15.6287 5.12132L19.1642 8.65685M15.6287 5.12132L17.0429 3.70711C17.4334 3.31658 18.0666 3.31658 18.4571 3.70711L20.5784 5.82843C20.969 6.21895 20.969 6.85212 20.5784 7.24264L19.1642 8.65685M7.85051 19.9706L4.31497 16.435M7.85051 19.9706L19.1642 8.65685M7.85051 19.9706L3.25431 21.0312L4.31497 16.435" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<button class="icon-btn delete" @click.stop="confirmDelete(cat)" title="Delete">
						<svg fill="#000000" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28" height="28">
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
		</div>

		<!-- Add Modal -->
		<Teleport to="body">
			<div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
				<div class="modal-card small-modal">
					<div class="modal-header">
						<h3>Add New Category</h3>
						<button class="close-btn" @click="closeAddModal">✕</button>
					</div>
					<div class="modal-body">
						<div class="field">
							<label class="field-label">Category Name</label>
							<input v-model="newCategoryName" type="text" placeholder="e.g., Urgent" @keyup.enter="createNewCategory" />
						</div>
						<label class="checkbox-field">
							<input type="checkbox" v-model="isFavorite" />
							<span>⭐ Mark as favorite</span>
						</label>
					</div>
					<div class="modal-footer">
						<button class="secondary-button" @click="closeAddModal">Cancel</button>
						<button class="primary-button" @click="createNewCategory" :disabled="!newCategoryName.trim()">Add</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- Delete Confirmation Modal -->
		<Teleport to="body">
			<div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
				<div class="modal-card small-modal">
					<div class="modal-header">
						<h3>Delete Category</h3>
						<button class="close-btn" @click="deleteTarget = null">✕</button>
					</div>
					<div class="modal-body">
						<p>Are you sure you want to delete "<strong>{{ deleteTarget.name }}</strong>"?<br>This will not delete associated todos, but they will lose this category.</p>
					</div>
					<div class="modal-footer">
						<button class="secondary-button" @click="deleteTarget = null">Cancel</button>
						<button class="danger-button" @click="performDelete" :disabled="isProcessing">Delete</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService'
import { getTodos, updateTodo } from '@/services/todoService'

const categories = ref([])
const loading = ref(false)
const error = ref(null)
const isProcessing = ref(false)

// Editing
const editingId = ref(null)
const editingCat = ref(null)
const editName = ref('')

// Add modal
const showAddModal = ref(false)
const newCategoryName = ref('')
const isFavorite = ref(false)

// Delete modal
const deleteTarget = ref(null)

// Sorted categories: favorites first, then alphabetically
const sortedCategories = computed(() => {
	return [...categories.value].sort((a, b) => {
		if (a.favorite !== b.favorite) return b.favorite - a.favorite
		return a.name.localeCompare(b.name)
	})
})

const loadCategories = async () => {
	loading.value = true
	error.value = null
	try {
		const data = await getCategories()
		categories.value = data
	} catch (err) {
		console.error(err)
		error.value = 'Failed to load categories.'
	} finally {
		loading.value = false
	}
}

const startEdit = (cat) => {
	editingId.value = cat.id
	editingCat.value = cat
	editName.value = cat.name
	nextTick(() => {
		const input = document.querySelector('.edit-input')
		if (input) input.focus()
	})
}

const saveEdit = async (cat) => {
	if (!editingId.value || !cat) {
		cancelEdit()
		return
	}

	const newName = editName.value.trim()
	if (!newName || newName === cat.name) {
		cancelEdit()
		return
	}

	// Check for duplicate name (excluding current category)
	const exists = categories.value.some(
		(c) => c.id !== cat.id && c.name.toLowerCase() === newName.toLowerCase()
	)
	if (exists) {
		error.value = 'A category with this name already exists.'
		setTimeout(() => error.value = null, 3000)
		cancelEdit()
		return
	}

	isProcessing.value = true
	try {
		const updatedCat = { ...cat, name: newName }
		await updateCategory(cat.id, updatedCat)

		const todos = await getTodos()
		const affectedTodos = todos.filter(todo => 
			todo.categories && todo.categories.includes(cat.name)
		)

		await Promise.all(affectedTodos.map(async (todo) => {
			const updatedCategories = todo.categories.map(c => c === cat.name ? newName : c)
			const updatedTodo = { ...todo, categories: updatedCategories }
			await updateTodo(todo.id, updatedTodo)
		}))

		const index = categories.value.findIndex(c => c.id === cat.id)
		if (index !== -1) categories.value[index] = updatedCat

		cancelEdit()
		window.dispatchEvent(new CustomEvent('categories-updated'))
	} catch (err) {
		console.error(err)
		error.value = 'Failed to rename category. Some todos may not be updated.'
		setTimeout(() => error.value = null, 5000)
	} finally {
		isProcessing.value = false
	}
}

const cancelEdit = () => {
	editingId.value = null
	editingCat.value = null
	editName.value = ''
}

const toggleFavorite = async (cat) => {
	const updated = { ...cat, favorite: !cat.favorite }
	try {
		await updateCategory(cat.id, updated)
		const index = categories.value.findIndex(c => c.id === cat.id)
		if (index !== -1) categories.value[index] = updated
		window.dispatchEvent(new CustomEvent('categories-updated'))
	} catch (err) {
		console.error(err)
		error.value = 'Failed to update favorite.'
		setTimeout(() => error.value = null, 3000)
	}
}

const openAddModal = () => {
	newCategoryName.value = ''
	isFavorite.value = false
	showAddModal.value = true
}

const closeAddModal = () => {
	showAddModal.value = false
	newCategoryName.value = ''
	isFavorite.value = false
}

const createNewCategory = async () => {
	const name = newCategoryName.value.trim()
	if (!name) return

	// Check for duplicate name
	const exists = categories.value.some(
		(c) => c.name.toLowerCase() === name.toLowerCase()
	)
	if (exists) {
		error.value = 'A category with this name already exists.'
		setTimeout(() => error.value = null, 3000)
		return
	}

	try {
		const newCat = { name, favorite: isFavorite.value }
		const saved = await createCategory(newCat)
		categories.value.push(saved)
		closeAddModal()
		window.dispatchEvent(new CustomEvent('categories-updated'))
	} catch (err) {
		console.error(err)
		error.value = 'Failed to create category.'
		setTimeout(() => error.value = null, 3000)
	}
}

const confirmDelete = (cat) => {
	deleteTarget.value = cat
}

const performDelete = async () => {
	if (!deleteTarget.value) return
	const catToDelete = deleteTarget.value
	isProcessing.value = true
	try {
		const todos = await getTodos()
		const affectedTodos = todos.filter(todo => 
			todo.categories && todo.categories.includes(catToDelete.name)
		)

		await Promise.all(affectedTodos.map(async (todo) => {
			const updatedCategories = todo.categories.filter(c => c !== catToDelete.name)
			const updatedTodo = { ...todo, categories: updatedCategories }
			await updateTodo(todo.id, updatedTodo)
		}))

		await deleteCategory(catToDelete.id)

		categories.value = categories.value.filter(c => c.id !== catToDelete.id)
		deleteTarget.value = null
		window.dispatchEvent(new CustomEvent('categories-updated'))
	} catch (err) {
		console.error(err)
		error.value = 'Failed to delete category. Some todos may not be updated.'
		setTimeout(() => error.value = null, 5000)
	} finally {
		isProcessing.value = false
	}
}

onMounted(() => {
	loadCategories()
})
</script>

<style scoped>
/* Keep existing styles, add/overwrite for icons */
.category-management {
	max-width: 800px;
	margin: 0 auto;
}

.category-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-top: 20px;
}

.category-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: var(--surface-muted);
	border: 1px solid var(--border);
	border-radius: 20px;
}

.category-info {
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
}

.favorite-star {
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.6;
	transition: opacity 0.2s;
}

.favorite-star:hover {
	opacity: 1;
}

.favorite-star.active svg {
	fill: #f5b342;
	stroke: #f5b342;
}

.category-name {
	font-size: 1.1rem;
	font-weight: 500;
	cursor: pointer;
	padding: 4px 0;
}

.edit-input {
	font-size: 1.1rem;
	font-weight: 500;
	padding: 4px 8px;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: var(--input-bg);
	color: var(--text);
	width: auto;
	min-width: 150px;
}

.category-actions {
	display: flex;
	gap: 12px;
}

.icon-btn {
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
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

.icon-btn.edit svg {
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

.add-btn {
	background: var(--accent);
	color: white;
	border: none;
	border-radius: 999px;
	padding: 8px 16px;
	cursor: pointer;
	font-weight: 500;
	transition: opacity 0.2s;
}

.add-btn:hover {
	opacity: 0.9;
}

.loading-state, .empty-state {
	text-align: center;
	padding: 40px;
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

/* Modal styles */
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
	background: var(--modal-bg);
	color: var(--text);
	border-radius: 28px;
	padding: 24px;
	width: 90%;
	max-width: 500px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.small-modal {
	max-width: 400px;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.modal-header h3 {
	margin: 0;
	color: var(--text-strong);
}

.close-btn {
	background: transparent;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	color: var(--text);
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
	background: var(--input-bg);
	color: var(--text);
}

.field input:focus,
.field textarea:focus,
.field select:focus {
	outline: none;
	border-color: var(--accent);
}

.checkbox-field {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
	cursor: pointer;
}

.checkbox-field input {
	width: auto;
	margin: 0;
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
	background: var(--chip);
	color: var(--text);
}

.danger-button {
	background: #d32f2f;
	color: white;
}

.danger-button:disabled {
	opacity: 0.7;
	cursor: wait;
}

.danger-button:hover:not(:disabled) {
	background: #b71c1c;
}
</style>