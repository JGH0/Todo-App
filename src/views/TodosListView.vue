<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
	category: {
		type: String,
		default: null
	}
})

// Dummy todo data – now 15 items
const todos = ref([
	{
		id: 1,
		title: 'Einbauter gehen',
		description: '🏠🚶‍♀️',
		dueDate: '2026-03-15',
		dueTime: '18:00',
		status: 'open',
		favorite: false,
		categories: ['Home', 'Personal']
	},
	{
		id: 2,
		title: 'Blumer giessen',
		description: '🍴🍳',
		dueDate: '2026-03-14',
		dueTime: '12:00',
		status: 'open',
		favorite: true,
		categories: ['Work']
	},
	{
		id: 3,
		title: 'Franz 5.12 a-Z',
		description: 'do dotz in 2009',
		dueDate: '2026-03-13',
		dueTime: '10:00',
		status: 'done',
		favorite: false,
		categories: ['Personal']
	},
	{
		id: 4,
		title: 'Mathe 5.30',
		description: 'dotz in 2009',
		dueDate: '2026-03-16',
		dueTime: '09:00',
		status: 'open',
		favorite: false,
		categories: ['Work']
	},
	{
		id: 5,
		title: 'Physik Printing',
		description: 'kategorien do dotz',
		dueDate: '2026-03-20',
		dueTime: null,
		status: 'done',
		favorite: true,
		categories: ['Home']
	},
	{
		id: 6,
		title: 'Team meeting',
		description: 'Discuss Q2 roadmap',
		dueDate: '2026-03-22',
		dueTime: '14:00',
		status: 'open',
		favorite: false,
		categories: ['Work']
	},
	{
		id: 7,
		title: 'Grocery shopping',
		description: 'Buy vegetables, milk, bread',
		dueDate: '2026-03-18',
		dueTime: '17:30',
		status: 'open',
		favorite: true,
		categories: ['Home', 'Personal']
	},
	{
		id: 8,
		title: 'Yoga class',
		description: 'Bring mat and water',
		dueDate: '2026-03-19',
		dueTime: '09:00',
		status: 'open',
		favorite: false,
		categories: ['Personal']
	},
	{
		id: 9,
		title: 'Finish presentation',
		description: 'Slides for Monday',
		dueDate: '2026-03-21',
		dueTime: '20:00',
		status: 'open',
		favorite: false,
		categories: ['Work']
	},
	{
		id: 10,
		title: 'Call dentist',
		description: 'Appointment for check-up',
		dueDate: '2026-03-17',
		dueTime: '11:15',
		status: 'done',
		favorite: false,
		categories: ['Personal']
	},
	{
		id: 11,
		title: 'Pay electricity bill',
		description: 'Due before 25th',
		dueDate: '2026-03-24',
		dueTime: null,
		status: 'open',
		favorite: true,
		categories: ['Home']
	},
	{
		id: 12,
		title: 'Write blog post',
		description: 'Topic: Vue 3 patterns',
		dueDate: '2026-03-26',
		dueTime: '15:00',
		status: 'open',
		favorite: false,
		categories: ['Work']
	},
	{
		id: 13,
		title: 'Water plants',
		description: 'Indoor and balcony',
		dueDate: '2026-03-15',
		dueTime: '08:00',
		status: 'done',
		favorite: true,
		categories: ['Home']
	},
	{
		id: 14,
		title: 'Read book',
		description: 'Atomic Habits',
		dueDate: '2026-03-30',
		dueTime: null,
		status: 'open',
		favorite: false,
		categories: ['Personal']
	},
	{
		id: 15,
		title: 'Code review',
		description: 'Pull requests #42, #43',
		dueDate: '2026-03-16',
		dueTime: '16:00',
		status: 'open',
		favorite: false,
		categories: ['Work']
	}
])

// State for edit modal
const editingTodo = ref(null)
const categoryInput = ref('')

// Filter todos based on category
const filteredTodos = computed(() => {
	if (!props.category) return todos.value
	return todos.value.filter(todo => todo.categories.includes(props.category))
})

// Toggle completion status
const toggleComplete = (todo) => {
	todo.status = todo.status === 'open' ? 'done' : 'open'
}

// Toggle favorite
const toggleFavorite = (todo) => {
	todo.favorite = !todo.favorite
}

// Edit modal methods
const openEdit = (todo) => {
	// Create a shallow copy (for editing, we need a copy to avoid mutating original until save)
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

const saveEdit = () => {
	if (!editingTodo.value) return
	// Here you would normally persist the changes, e.g., call an API or update the original todo
	console.log('Saving edited todo:', editingTodo.value)
	// For demo, we actually update the original todo (so changes are visible)
	const index = todos.value.findIndex(t => t.id === editingTodo.value.id)
	if (index !== -1) {
		todos.value[index] = { ...editingTodo.value }
	}
	closeEdit()
}

// Dummy countdown text (static 3 days)
const countdownText = '🗑️ 3 days'
</script>

<template>
	<div class="card todo-list-view">
		<div class="card-header">
			<div>
				<p class="eyebrow">Todos</p>
				<h2 v-if="category">{{ category }} Tasks</h2>
				<h2 v-else>All Tasks</h2>
			</div>
		</div>

		<div v-if="filteredTodos.length === 0" class="empty-state">
			<p>No todos found for this category.</p>
		</div>

		<ul v-else class="todo-list">
			<li v-for="todo in filteredTodos" :key="todo.id" class="todo-item">
				<!-- First row: completion circle, title, action icons -->
				<div class="todo-row todo-row-main">
					<!-- Completion circle on the left -->
					<button 
						class="completion-circle" 
						:class="{ completed: todo.status === 'done' }"
						@click="toggleComplete(todo)"
						:aria-label="todo.status === 'done' ? 'Mark as open' : 'Mark as done'"
					/>

					<!-- Title in the middle -->
					<span class="todo-title">{{ todo.title }}</span>

					<!-- Action icons on the right -->
					<div class="todo-actions-right">
						<!-- Star SVG (filled when favorite) -->
						<button 
							class="icon-btn star" 
							@click="toggleFavorite(todo)"
							aria-label="Toggle favorite"
						>
							<svg 
								width="24" 
								height="24" 
								viewBox="0 0 24 24" 
								:fill="todo.favorite ? '#f5b342' : 'none'" 
								stroke="currentColor" 
								stroke-width="2"
							>
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
							</svg>
						</button>
						<!-- Edit button with SVG -->
						<button class="icon-btn edit" aria-label="Edit task" @click="openEdit(todo)">
							<svg viewBox="0 0 24 24" id="_24x24_On_Light_Edit" data-name="24x24/On Light/Edit" xmlns="http://www.w3.org/2000/svg" fill="#000000">
								<g id="SVGRepo_bgCarrier" stroke-width="0"></g>
								<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
								<g id="SVGRepo_iconCarrier">
									<path id="Shape" d="M.75,17.5A.751.751,0,0,1,0,16.75V12.569a.755.755,0,0,1,.22-.53L11.461.8a2.72,2.72,0,0,1,3.848,0L16.7,2.191a2.72,2.72,0,0,1,0,3.848L5.462,17.28a.747.747,0,0,1-.531.22ZM1.5,12.879V16h3.12l7.91-7.91L9.41,4.97ZM13.591,7.03l2.051-2.051a1.223,1.223,0,0,0,0-1.727L14.249,1.858a1.222,1.222,0,0,0-1.727,0L10.47,3.91Z" transform="translate(3.25 3.25)" fill="#141124"></path>
								</g>
							</svg>
						</button>
					</div>
				</div>

				<!-- Second row: description -->
				<div v-if="todo.description" class="todo-row todo-description">
					{{ todo.description }}
				</div>

				<!-- Third row: metadata (date/categories) and countdown -->
				<div class="todo-row todo-metadata">
					<div class="meta-left">
						<span v-if="todo.dueDate" class="meta-chip">
							<!-- Calendar SVG -->
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 9H21M17 13.0014L7 13M10.3333 17.0005L7 17M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{{ todo.dueDate }}
							<span v-if="todo.dueTime" class="time-part">
								<!-- Clock SVG -->
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.9997 20.5815L16.4179 18.0113M4.9997 20.5815L7.58154 18.0113M11.9997 9.58148V12.5815L13.4416 13.9998M6.74234 3.99735C6.36727 3.62228 5.85856 3.41156 5.32812 3.41156C4.79769 3.41156 4.28898 3.62228 3.91391 3.99735C3.53884 4.37242 3.32813 4.88113 3.32812 5.41156C3.32812 5.942 3.53884 6.4507 3.91391 6.82578M20.0858 6.82413C20.4609 6.44905 20.6716 5.94035 20.6716 5.40991C20.6716 4.87948 20.4609 4.37077 20.0858 3.9957C19.7107 3.62063 19.202 3.40991 18.6716 3.40991C18.1411 3.40991 17.6324 3.62063 17.2574 3.9957M18.9997 12.5815C18.9997 16.4475 15.8657 19.5815 11.9997 19.5815C8.1337 19.5815 4.9997 16.4475 4.9997 12.5815C4.9997 8.71549 8.1337 5.58149 11.9997 5.58149C15.8657 5.58149 18.9997 8.71549 18.9997 12.5815Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								{{ todo.dueTime }}
							</span>
						</span>
						<span v-for="cat in todo.categories" :key="cat" class="category-chip">
							{{ cat }}
						</span>
					</div>
					<div v-if="todo.status === 'done'" class="meta-right countdown">
						{{ countdownText }}
					</div>
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
						<!-- Title -->
						<div class="field">
							<label class="field-label">Title</label>
							<input v-model="editingTodo.title" type="text" placeholder="Task title" />
						</div>

						<!-- Description -->
						<div class="field">
							<label class="field-label">Description</label>
							<textarea v-model="editingTodo.description" rows="3" placeholder="Description"></textarea>
						</div>

						<!-- Date and Time -->
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

						<!-- Categories -->
						<div class="field">
							<label class="field-label">Categories</label>
							<div class="category-list">
								<span v-for="cat in editingTodo.categories" :key="cat" class="category-chip">
									{{ cat }}
									<button type="button" class="chip-remove" @click="removeCategory(cat)">✕</button>
								</span>
							</div>
							<div class="input-line">
								<input
									v-model="categoryInput"
									type="text"
									placeholder="Add category"
									@keydown.enter.prevent="addCategory"
								/>
								<button class="inline-icon-button" type="button" @click="addCategory">Add</button>
							</div>
						</div>

						<!-- Status and Favorite -->
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
	</div>
</template>

<style scoped>
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
	transition: opacity 0.2s;
}

.icon-btn:hover {
	opacity: 1;
}

.icon-btn.star svg,
.icon-btn.edit svg {
	width: 24px;
	height: 24px;
	stroke: currentColor;
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

.category-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: var(--chip);
	border: 1px solid var(--border);
	padding: 6px 12px;
	font-size: 0.9rem;
	border-radius: 999px;
	color: #000;
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
	span {
	color:#000
	}
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 24px;
}

.primary-button,
.secondary-button {
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
</style>